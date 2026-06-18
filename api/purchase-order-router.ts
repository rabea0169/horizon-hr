import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { purchaseOrders, purchaseOrderItems } from "@db/schema";
import type { InsertPurchaseOrder } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const purchaseOrderRouter = createRouter({
  list: authedQuery
    .input(z.object({ supplierId: z.number().optional(), status: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.supplierId) conditions.push(eq(purchaseOrders.supplierId, input.supplierId));
      if (input?.status) conditions.push(eq(purchaseOrders.status, input.status as "draft" | "sent" | "confirmed" | "partially_received" | "fully_received" | "cancelled" | "closed"));
      if (input?.search) conditions.push(sql`${purchaseOrders.poNumber} LIKE ${"%" + input.search + "%"}`);
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.purchaseOrders.findMany({ where, with: { supplier: true }, orderBy: desc(purchaseOrders.createdAt) });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, input.id),
        with: { supplier: true },
      });
    }),

  create: adminQuery
    .input(z.object({
      poNumber: z.string().min(1),
      supplierId: z.number(),
      orderDate: z.string(),
      expectedDeliveryDate: z.string().optional(),
      deliveryAddress: z.string().optional(),
      subtotal: z.string(),
      vatRate: z.string().optional(),
      vatAmount: z.string().optional(),
      discountAmount: z.string().optional(),
      shippingCost: z.string().optional(),
      totalAmount: z.string(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({ itemId: z.number(), quantity: z.number(), unitPrice: z.string(), total: z.string(), notes: z.string().optional() })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { items, ...poData } = input;
      const [result] = await db.insert(purchaseOrders).values({
        ...poData,
        subtotal: poData.subtotal,
        vatRate: poData.vatRate ?? "14",
        vatAmount: poData.vatAmount ?? "0",
        discountAmount: poData.discountAmount ?? "0",
        shippingCost: poData.shippingCost ?? "0",
        totalAmount: poData.totalAmount,
        orderDate: new Date(poData.orderDate),
        expectedDeliveryDate: poData.expectedDeliveryDate ? new Date(poData.expectedDeliveryDate) : null,
      } as InsertPurchaseOrder).$returningId();

      const poId = result.id;
      if (items && items.length > 0) {
        await db.insert(purchaseOrderItems).values(items.map(i => ({
          purchaseOrderId: poId,
          itemId: i.itemId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
          notes: i.notes,
        })));
      }

      return db.query.purchaseOrders.findFirst({ where: eq(purchaseOrders.id, poId), with: { supplier: true } });
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["draft", "sent", "confirmed", "partially_received", "fully_received", "cancelled", "closed"]) }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id));
      return db.query.purchaseOrders.findFirst({ where: eq(purchaseOrders.id, id), with: { supplier: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(purchaseOrders).where(eq(purchaseOrders.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, draft, sent, confirmed, partiallyReceived, fullyReceived] = await Promise.all([
      db.select({ count: count() }).from(purchaseOrders),
      db.select({ count: count() }).from(purchaseOrders).where(eq(purchaseOrders.status, "draft")),
      db.select({ count: count() }).from(purchaseOrders).where(eq(purchaseOrders.status, "sent")),
      db.select({ count: count() }).from(purchaseOrders).where(eq(purchaseOrders.status, "confirmed")),
      db.select({ count: count() }).from(purchaseOrders).where(eq(purchaseOrders.status, "partially_received")),
      db.select({ count: count() }).from(purchaseOrders).where(eq(purchaseOrders.status, "fully_received")),
    ]);
    return { total: total[0].count, draft: draft[0].count, sent: sent[0].count, confirmed: confirmed[0].count, partiallyReceived: partiallyReceived[0].count, fullyReceived: fullyReceived[0].count };
  }),

  // Items
  getItems: authedQuery
    .input(z.object({ purchaseOrderId: z.number() }))
    .query(async ({ input }) => {
      return getDb().query.purchaseOrderItems.findMany({
        where: eq(purchaseOrderItems.purchaseOrderId, input.purchaseOrderId),
        with: { item: true },
      });
    }),
});
