import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { quotations, quotationItems } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const quotationRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().select().from(quotations).orderBy(desc(quotations.id)).limit(200);
  }),
  create: adminQuery
    .input(
      z.object({
        customerId: z.number(),
        quoteNo: z.string(),
        items: z.string(),
        totalAmount: z.number(),
        status: z.string().default("draft"),
        validUntil: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data = {
        quotationNumber: input.quoteNo,
        customerId: input.customerId,
        issueDate: new Date(),
        expiryDate: input.validUntil ? new Date(input.validUntil) : undefined,
        subtotal: input.totalAmount.toString(),
        totalAmount: input.totalAmount.toString(),
        status: input.status as "draft" | "sent" | "accepted" | "rejected" | "expired",
      };
      const result = await getDb().insert(quotations).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
  listItems: authedQuery
    .input(z.object({ quotationId: z.number() }))
    .query(async ({ input }) => {
      return getDb().select().from(quotationItems).where(eq(quotationItems.quotationId, input.quotationId));
    }),
});
