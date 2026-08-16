import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { samRecords } from "@db/schema";
import { desc } from "drizzle-orm";

export const samRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().select().from(samRecords).orderBy(desc(samRecords.id)).limit(200);
  }),
  create: adminQuery
    .input(
      z.object({
        operationName: z.string(),
        modelId: z.number().optional(),
        machineType: z.string(),
        sam: z.number(),
        rating: z.string().default("100%"),
        allowance: z.number().default(15),
        finalSam: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const data = {
        modelId: input.modelId ?? 0,
        operationName: input.operationName,
        machineType: input.machineType,
        samMinutes: input.sam.toString(),
        allowancePercent: input.allowance.toString(),
        effectiveSam: input.finalSam.toString(),
      };
      const result = await getDb().insert(samRecords).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
});
