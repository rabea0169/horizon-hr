import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const isProd = process.env.NODE_ENV === "production";
const rootDir = process.cwd();
const UPLOADS_DIR = path.resolve(rootDir, "public/uploads");
const DIST_UPLOADS_DIR = path.resolve(rootDir, "dist/public/uploads");

/**
 * Saves a base64 encoded image to the local filesystem and returns the public path.
 * Supports both development (public/uploads) and production (dist/public/uploads) paths.
 */
export async function saveBase64Image(base64Data: string): Promise<string> {
  // Ensure upload directories exist
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  if (isProd) {
    await fs.mkdir(DIST_UPLOADS_DIR, { recursive: true });
  }

  // Parse base64
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("تنسيق الصورة غير صالح / Invalid base64 format");
  }

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");

  // Determine file extension
  let ext = ".png";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") ext = ".jpg";
  else if (mimeType === "image/webp") ext = ".webp";
  else if (mimeType === "image/gif") ext = ".gif";

  const filename = `${nanoid()}${ext}`;
  
  // Write to development public path
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filePath, buffer);

  // Write to production dist path if in production
  if (isProd) {
    const distFilePath = path.join(DIST_UPLOADS_DIR, filename);
    await fs.writeFile(distFilePath, buffer);
  }

  return `/uploads/${filename}`;
}
