import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { authenticateHorizonRequest } from "./horizon-auth";
import type { HorizonUser } from "./horizon-auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  horizonUser?: HorizonUser;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try Kimi platform auth first
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Kimi auth failed — try Horizon HR local auth
  }

  // Fallback to Horizon HR local JWT auth
  if (!ctx.user) {
    try {
      ctx.horizonUser = await authenticateHorizonRequest(opts.req.headers);
    } catch {
      // No auth available — public access
    }
  }

  return ctx;
}
