import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { companySettings, systemSettings } from "@db/schema";
import { eq } from "drizzle-orm";

export const settingsRouter = createRouter({
  get: authedQuery.query(async () => {
    const rows = await getDb().select().from(companySettings).limit(1);
    return rows[0] ?? null;
  }),
  update: adminQuery
    .input(
      z.object({
        companyName: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        taxNumber: z.string().optional(),
        currency: z.string().optional(),
        logoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const rows = await getDb().select().from(companySettings).limit(1);
      if (rows.length > 0) {
        await getDb().update(companySettings).set(input).where(eq(companySettings.id, rows[0].id));
        return { id: rows[0].id, ...input };
      }
      // Insert requires companyName
      const insertData = { companyName: input.companyName || "شركتي", ...input };
      const result = await getDb().insert(companySettings).values(insertData).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
  getModulesState: authedQuery.query(async () => {
    const rows = await getDb()
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "disabled_modules"))
      .limit(1);
    if (rows.length === 0 || !rows[0].value) {
      return [];
    }
    try {
      return JSON.parse(rows[0].value) as string[];
    } catch {
      return [];
    }
  }),
  updateModulesState: adminQuery
    .input(z.array(z.string()))
    .mutation(async ({ input }) => {
      const db = getDb();
      const val = JSON.stringify(input);
      await db
        .insert(systemSettings)
        .values({
          key: "disabled_modules",
          value: val,
        })
        .onDuplicateKeyUpdate({
          set: { value: val },
        });
      return { success: true };
    }),
});

