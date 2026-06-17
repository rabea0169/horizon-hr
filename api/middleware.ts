import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

/** Unified user shape for both Kimi platform and Horizon local auth */
type UnifiedUser = { id: number; role: string; name?: string };

function getUnifiedUser(ctx: TrpcContext): UnifiedUser | undefined {
  if (ctx.user) {
    return { id: ctx.user.id, role: ctx.user.role ?? "user", name: ctx.user.name ?? undefined };
  }
  if (ctx.horizonUser) {
    return { id: ctx.horizonUser.id, role: ctx.horizonUser.role, name: ctx.horizonUser.username };
  }
  return undefined;
}

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const user = getUnifiedUser(ctx);

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user, horizonUser: ctx.horizonUser, authUser: user } });
});

function requireRole(...roles: string[]) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const user = getUnifiedUser(ctx);

    if (!user || !roles.includes(user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user, horizonUser: ctx.horizonUser, authUser: user } });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = authedQuery.use(requireRole("admin"));
export const hrQuery = authedQuery.use(requireRole("admin", "hr_manager", "hr_specialist"));
export const supervisorQuery = authedQuery.use(requireRole("admin", "hr_manager", "supervisor"));
export const financeQuery = authedQuery.use(requireRole("admin", "finance_manager", "accountant"));
