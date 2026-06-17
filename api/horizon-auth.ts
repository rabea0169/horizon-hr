import { SignJWT, jwtVerify } from "jose";
import { env } from "./lib/env";

const SECRET = new TextEncoder().encode(env.horizonJwtSecret);

export type HorizonUser = {
  id: number;
  username: string;
  role: string;
  fullName?: string;
};

export async function createToken(user: HorizonUser): Promise<string> {
  return new SignJWT({ sub: String(user.id), username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<HorizonUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 30 });
    return {
      id: Number(payload.sub),
      username: payload.username as string,
      role: payload.role as string,
      fullName: payload.fullName as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function authenticateHorizonRequest(headers: Headers): Promise<HorizonUser | undefined> {
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await verifyToken(token);
    if (user) return user;
  }

  const cookieHeader = headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const eqIdx = c.indexOf("=");
        return [c.slice(0, eqIdx).trim(), c.slice(eqIdx + 1).trim()];
      }),
    );
    const hrToken = cookies["hr_auth_token"];
    if (hrToken) {
      const decoded = decodeURIComponent(hrToken);
      const user = await verifyToken(decoded);
      if (user) return user;
    }
  }

  return undefined;
}
