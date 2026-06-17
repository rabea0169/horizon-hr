import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { productionLines, productionModels } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const lineRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().select().from(productionLines).orderBy(desc(productionLines.id)).limit(100);
  }),
  listModels: authedQuery.query(async () => {
    return getDb().select().from(productionModels).orderBy(desc(productionModels.id)).limit(200);
  }),
  update: adminQuery
    .input(z.object({ id: z.number(), efficiency: z.number().optional(), status: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...rawData } = input;
      const data: any = { ...rawData };
      await getDb().update(productionLines).set(data).where(eq(productionLines.id, id));
      return { success: true };
    }),
});
