import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { createToken } from "./horizon-auth";
import { loginRateLimit } from "./lib/rate-limiter";
import { env } from "./lib/env";

const HORIZON_USERS = [
  { id: 1, username: env.adminUsername, passwordHash: bcrypt.hashSync(env.adminPassword, 10), role: "admin" as const, fullName: "مدير النظام" },
  { id: 2, username: "supervisor", passwordHash: bcrypt.hashSync(env.supervisorPassword, 10), role: "supervisor" as const, fullName: "مشرف الإنتاج" },
  { id: 3, username: "accountant", passwordHash: bcrypt.hashSync(env.accountantPassword, 10), role: "accountant" as const, fullName: "المحاسب" },
  { id: 4, username: "worker", passwordHash: bcrypt.hashSync(env.workerPassword, 10), role: "worker" as const, fullName: "عامل عادي" },
];

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

      const user = HORIZON_USERS.find((u) => u.username === input.username);
      if (!user || !bcrypt.compareSync(input.password, user.passwordHash)) {
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
