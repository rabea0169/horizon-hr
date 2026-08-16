import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, adminQuery, publicQuery } from "./middleware";
import { createToken } from "./horizon-auth";
import { loginRateLimit } from "./lib/rate-limiter";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { employees } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export const authRouter = createRouter({
  me: authedQuery.query(async (opts) => {
    const db = getDb();
    let allowedModules: string[] | undefined = undefined;
    const userId = opts.ctx.horizonUser?.id;
    if (userId) {
      const dbUser = await db.query.employees.findFirst({
        where: eq(employees.id, userId),
      });
      if (dbUser?.allowedModules) {
        allowedModules = dbUser.allowedModules as string[];
      }
    }
    return {
      id: opts.ctx.user?.id || opts.ctx.horizonUser?.id,
      username: opts.ctx.horizonUser?.username || opts.ctx.user?.name,
      role: opts.ctx.horizonUser?.role || opts.ctx.user?.role,
      fullName: opts.ctx.horizonUser?.fullName || opts.ctx.user?.name,
      allowedModules,
    };
  }),

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

      if (dbUser && dbUser.passwordHash) {
        if (bcrypt.compareSync(input.password, dbUser.passwordHash)) {
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
        if (input.username === env.adminUsername) {
          const systemAdminHash = bcrypt.hashSync(env.adminPassword, 10);
          if (bcrypt.compareSync(input.password, systemAdminHash)) {
            user = {
              id: 1, // Fallback admin ID
              username: env.adminUsername,
              role: "admin",
              fullName: "مدير النظام",
            };
          }
        }
      }

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "اسم المستخدم أو كلمة المرور غير صحيحة",
        });
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

  listUsers: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: employees.id,
        username: employees.employeeCode,
        fullName: employees.fullName,
        role: employees.role,
        active: sql<boolean>`${employees.status} = 'active'`,
        createdAt: employees.createdAt,
        allowedModules: employees.allowedModules,
      })
      .from(employees)
      .where(
        sql`${employees.role} IN ('admin', 'supervisor', 'accountant', 'worker') AND ${employees.employeeCode} IS NOT NULL AND ${employees.passwordHash} IS NOT NULL`
      );
    return rows;
  }),

  updateUserPermissions: adminQuery
    .input(z.object({
      userId: z.number(),
      allowedModules: z.array(z.string()).nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(employees)
        .set({ allowedModules: input.allowedModules })
        .where(eq(employees.id, input.userId));
      return { success: true };
    }),

  addUser: adminQuery
    .input(
      z.object({
        username: z.string().min(1),
        fullName: z.string().min(1),
        password: z.string().min(1),
        role: z.enum(["admin", "supervisor", "accountant", "worker"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const hash = bcrypt.hashSync(input.password, 10);

      // Check if employee with this code already exists
      const existing = await db.query.employees.findFirst({
        where: eq(employees.employeeCode, input.username),
      });

      if (existing) {
        await db
          .update(employees)
          .set({
            fullName: input.fullName,
            passwordHash: hash,
            role: input.role,
            status: "active",
          })
          .where(eq(employees.id, existing.id));
        return { id: existing.id, success: true };
      }

      const [result] = await db
        .insert(employees)
        .values({
          employeeCode: input.username,
          fullName: input.fullName,
          email: `${input.username}@horizon.factory`,
          role: input.role,
          jobTitle: input.role === "admin" ? "مدير النظام" : input.role === "supervisor" ? "مشرف" : "محاسب",
          joinDate: new Date(),
          salary: "0",
          status: "active",
          employmentType: "full_time",
          salaryType: "monthly",
          passwordHash: hash,
        })
        .$returningId();

      return { id: result.id, success: true };
    }),

  removeUser: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Remove system login access but keep operational data intact
      await db
        .update(employees)
        .set({
          passwordHash: null,
          status: "inactive",
        })
        .where(eq(employees.id, input.id));
      return { success: true };
    }),
});

