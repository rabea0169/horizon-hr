import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { auditLog } from "@db/schema";
import { desc } from "drizzle-orm";

export const auditApiRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().select().from(auditLog).orderBy(desc(auditLog.id)).limit(500);
  }),
  create: adminQuery
    .input(
      z.object({
        tableName: z.string(),
        recordId: z.number(),
        action: z.enum(["INSERT", "UPDATE", "DELETE"]),
        oldValues: z.string().optional(),
        newValues: z.string().optional(),
        changedBy: z.number().optional(),
        changedByName: z.string().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await getDb().insert(auditLog).values(input).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
});
