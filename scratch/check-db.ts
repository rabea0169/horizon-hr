import { getDb } from "../api/queries/connection";
import { systemSettings } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = getDb();
  const rows = await db.select().from(systemSettings).where(eq(systemSettings.key, "disabled_modules"));
  console.log("Disabled modules in DB:", rows);
}

main().catch(console.error);
