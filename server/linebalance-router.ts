import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { lineBalancing } from "@db/schema";
import { desc } from "drizzle-orm";

export const lineBalanceRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().select().from(lineBalancing).orderBy(desc(lineBalancing.id)).limit(200);
  }),
  create: adminQuery
    .input(
      z.object({
        lineId: z.number(),
        modelId: z.number(),
        operationSequence: z.number().default(1),
        operationName: z.string(),
        samMinutes: z.string(),
        workstations: z.number().default(1),
        operators: z.number().default(1),
        targetOutput: z.number().default(0),
        cycleTime: z.string().optional(),
        taktTime: z.string().optional(),
        efficiency: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await getDb().insert(lineBalancing).values(input).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
});
