import "dotenv/config";
import { createHash, randomBytes } from "crypto";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function generateDevSecret(): string {
  const parts = [process.env.USERNAME || "", process.env.COMPUTERNAME || "", randomBytes(8).toString("hex")];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}

function required(name: string): string {
  const value = process.env[name];
  if (!value && IS_PRODUCTION) {
    throw new Error(`[STARTUP ERROR] Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

/**
 * في الإنتاج: يجب توفير HORIZON_ADMIN_PASSWORD وكلمات المرور الأخرى عبر متغيرات البيئة.
 * القيم الافتراضية متاحة فقط في بيئة التطوير.
 */
function credential(envVar: string, devDefault: string): string {
  const value = process.env[envVar];
  if (!value && IS_PRODUCTION) {
    throw new Error(
      `[SECURITY ERROR] ${envVar} must be set in production. ` +
      `Do NOT use the default credential '${devDefault}' in production!`
    );
  }
  return value ?? devDefault;
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  // JWT secret: يُستخدم APP_SECRET كمصدر، وفي التطوير يُولَّد تلقائياً
  horizonJwtSecret: IS_PRODUCTION
    ? (process.env.APP_SECRET || (() => { throw new Error("[SECURITY ERROR] APP_SECRET is required in production"); })())
    : (process.env.APP_SECRET || generateDevSecret()),
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  isProduction: IS_PRODUCTION,
  databaseUrl: required("DATABASE_URL"),
  // هذه الحقول اختيارية وتُستخدم لنظام OAuth الخارجي
  kimiAuthUrl: process.env.KIMI_AUTH_URL ?? "",
  kimiOpenUrl: process.env.KIMI_OPEN_URL ?? "",
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  // كلمات المرور — تُرفع في الإنتاج إذا لم تُعيَّن
  adminUsername: process.env.HORIZON_ADMIN_USERNAME || "admin",
  adminPassword: credential("HORIZON_ADMIN_PASSWORD", "admin123"),
  supervisorPassword: credential("HORIZON_SUPERVISOR_PASSWORD", "super123"),
  accountantPassword: credential("HORIZON_ACCOUNTANT_PASSWORD", "acc123"),
  workerPassword: credential("HORIZON_WORKER_PASSWORD", "work123"),
};
