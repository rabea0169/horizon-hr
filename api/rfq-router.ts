import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { rfqs, rfqItems, rfqResponses, InsertRFQ } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const rfqRouter = createRouter({
  list: authedQuery
    .input(z.object({ status: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(rfqs.status, input.status as "draft" | "sent" | "bidding" | "evaluated" | "awarded" | "cancelled"));
      if (input?.search) conditions.push(sql`${rfqs.rfqNumber} LIKE ${"%" + input.search + "%"}`);
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.rfqs.findMany({ where, orderBy: desc(rfqs.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      rfqNumber: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      purchaseRequestId: z.number().optional(),
      deadline: z.string().optional(),
      deliveryTerms: z.string().optional(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({ itemId: z.number(), quantity: z.number(), specifications: z.string().optional(), notes: z.string().optional() })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { items, ...rfqData } = input;
      const [result] = await db.insert(rfqs).values({
        ...rfqData,
        deadline: rfqData.deadline ? new Date(rfqData.deadline) : null,
      } as InsertRFQ).$returningId();

      const rfqId = result.id;
      if (items && items.length > 0) {
        await db.insert(rfqItems).values(items.map(i => ({ rfqId, ...i })));
      }

      return db.query.rfqs.findFirst({ where: eq(rfqs.id, rfqId) });
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["draft", "sent", "bidding", "evaluated", "awarded", "cancelled"]) }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(rfqs).set(data).where(eq(rfqs.id, id));
      return db.query.rfqs.findFirst({ where: eq(rfqs.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(rfqs).where(eq(rfqs.id, input.id));
      return { success: true };
    }),

  // RFQ Items
  getItems: authedQuery
    .input(z.object({ rfqId: z.number() }))
    .query(async ({ input }) => {
      return getDb().query.rfqItems.findMany({ where: eq(rfqItems.rfqId, input.rfqId), with: { item: true } });
    }),

  // RFQ Responses (Supplier Quotes)
  addResponse: adminQuery
    .input(z.object({
      rfqId: z.number(),
      supplierId: z.number(),
      unitPrice: z.string(),
      totalPrice: z.string(),
      deliveryDays: z.number().optional(),
      validityDays: z.number().optional(),
      currency: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(rfqResponses).values({
        ...input,
      }).$returningId();
      return db.query.rfqResponses.findFirst({ where: eq(rfqResponses.id, result.id), with: { supplier: true } });
    }),

  listResponses: authedQuery
    .input(z.object({ rfqId: z.number() }))
    .query(async ({ input }) => {
      return getDb().query.rfqResponses.findMany({ where: eq(rfqResponses.rfqId, input.rfqId), with: { supplier: true } });
    }),

  awardResponse: adminQuery
    .input(z.object({ responseId: z.number(), rfqId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(rfqResponses).set({ isWinner: false }).where(eq(rfqResponses.rfqId, input.rfqId));
      await db.update(rfqResponses).set({ isWinner: true }).where(eq(rfqResponses.id, input.responseId));
      await db.update(rfqs).set({ status: "awarded" }).where(eq(rfqs.id, input.rfqId));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, draft, sent, bidding, awarded] = await Promise.all([
      db.select({ count: count() }).from(rfqs),
      db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, "draft")),
      db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, "sent")),
      db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, "bidding")),
      db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, "awarded")),
    ]);
    return { total: total[0].count, draft: draft[0].count, sent: sent[0].count, bidding: bidding[0].count, awarded: awarded[0].count };
  }),
});
