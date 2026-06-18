import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { createToken } from "./horizon-auth";
import { loginRateLimit } from "./lib/rate-limiter";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { employees } from "@db/schema";
import { eq } from "drizzle-orm";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => ({
    id: opts.ctx.user?.id,
    username: opts.ctx.horizonUser?.username || opts.ctx.user?.name,
    role: opts.ctx.horizonUser?.role || opts.ctx.user?.role,
    fullName: opts.ctx.horizonUser?.fullName || opts.ctx.user?.name,
  })),

  horizonLogin: publicQuery
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || ctx.req.headers.get("x-real-ip")
        || "unknown";
      const { allowed, retryAfter } = loginRateLimit(ip);
      if (!allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `الرجاء الانتظار ${retryAfter} ثانية قبل المحاولة مرة أخرى`,
        });
      }

      const db = getDb();
      let user = null;

      // 1. Check DB first
      const dbUser = await db.query.employees.findFirst({
        where: eq(employees.employeeCode, input.username),
      });

      if (dbUser) {
        if (dbUser.passwordHash && bcrypt.compareSync(input.password, dbUser.passwordHash)) {
          user = {
            id: dbUser.id,
            username: dbUser.employeeCode,
            role: dbUser.role,
            fullName: dbUser.fullName,
          };
        }
      }

      // 2. Fallback to Env if not found in the DB (specifically for administrative bootstrap account)
      if (!user) {
        if (input.username === env.adminUsername && input.password === env.adminPassword) {
          user = {
            id: 1, // Fallback admin ID
            username: env.adminUsername,
            role: "admin",
            fullName: "مدير النظام",
          };
        }
      }

      if (!user) {
        return { success: false, token: null, user: null };
      }

      const opts = getSessionCookieOptions(ctx.req.headers);
      const token = await createToken({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
      });
      ctx.resHeaders.append("set-cookie", `hr_auth_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=${opts.sameSite?.toLowerCase() || "lax"}; Max-Age=${60 * 60 * 8}${opts.secure ? "; Secure" : ""}`);
      return {
        success: true,
        token,
        user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
      };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    ctx.resHeaders.append("set-cookie", "hr_auth_token=; HttpOnly; Path=/; Max-Age=0");
    return { success: true };
  }),
});

