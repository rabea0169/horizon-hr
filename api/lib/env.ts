import "dotenv/config";
import { createHash, randomBytes } from "crypto";

function generateDevSecret(): string {
  const parts = [process.env.USERNAME || "", process.env.COMPUTERNAME || "", randomBytes(8).toString("hex")];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  horizonJwtSecret: process.env.HORIZON_JWT_SECRET || process.env.APP_SECRET || generateDevSecret(),
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  adminUsername: process.env.HORIZON_ADMIN_USERNAME || "admin",
  adminPassword: process.env.HORIZON_ADMIN_PASSWORD || "admin123",
  supervisorPassword: process.env.HORIZON_SUPERVISOR_PASSWORD || "super123",
  accountantPassword: process.env.HORIZON_ACCOUNTANT_PASSWORD || "acc123",
  workerPassword: process.env.HORIZON_WORKER_PASSWORD || "work123",
};
