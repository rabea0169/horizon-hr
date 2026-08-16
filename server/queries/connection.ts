import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const poolConnection = mysql.createPool({
      uri: env.databaseUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    instance = drizzle(poolConnection, {
      schema: fullSchema,
      mode: "default",
    }) as any;
  }
  return instance;
}
