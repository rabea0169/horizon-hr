import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { grns } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const grnRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().select().from(grns).orderBy(desc(grns.id)).limit(200);
  }),
  create: adminQuery
    .input(
      z.object({
        grnNo: z.string(),
        supplierId: z.number(),
        poId: z.number().optional(),
        items: z.string(),
        totalQty: z.number(),
        status: z.string().default("pending"),
        receivedDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {
        grnNumber: input.grnNo,
        supplierId: input.supplierId,
        supplyOrderId: input.poId ?? 0,
        status: input.status,
        receivedDate: new Date(input.receivedDate),
        notes: input.items,
      };
      const result = await getDb().insert(grns).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
  update: adminQuery
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const data: any = { status: input.status };
      await getDb().update(grns).set(data).where(eq(grns.id, input.id));
      return { success: true };
    }),
});
