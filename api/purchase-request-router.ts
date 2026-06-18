import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { purchaseRequests, purchaseRequestItems, purchaseOrders, purchaseOrderItems, integrationLogs } from "@db/schema";
import type { InsertPurchaseRequest, InsertPurchaseOrder } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const purchaseRequestRouter = createRouter({
  list: authedQuery
    .input(z.object({
      status: z.enum(["draft", "pending_approval", "approved", "rejected", "converted_to_po"]).optional(),
      department: z.string().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional()
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(purchaseRequests.status, input.status));
      if (input?.department) conditions.push(eq(purchaseRequests.department, input.department));
      if (input?.priority) conditions.push(eq(purchaseRequests.priority, input.priority));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.purchaseRequests.findMany({ where, orderBy: desc(purchaseRequests.createdAt) });
    }),

  create: authedQuery
    .input(z.object({
      prNumber: z.string().min(1),
      department: z.string().optional(),
      requestedBy: z.string().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      requiredDate: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({ itemId: z.number(), quantity: z.number(), notes: z.string().optional() })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { items, ...prData } = input;

      const prId = await db.transaction(async (tx) => {
        const [result] = await tx.insert(purchaseRequests).values({
          ...prData,
          requiredDate: prData.requiredDate ? new Date(prData.requiredDate) : null,
        } as InsertPurchaseRequest).$returningId();

        const id = result.id;
        if (items && items.length > 0) {
          await tx.insert(purchaseRequestItems).values(items.map(i => ({ purchaseRequestId: id, ...i })));
        }
        return id;
      });

      return db.query.purchaseRequests.findFirst({ where: eq(purchaseRequests.id, prId) });
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["draft", "pending_approval", "approved", "rejected", "converted_to_po"]) }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(purchaseRequests).set(data).where(eq(purchaseRequests.id, id));
      return db.query.purchaseRequests.findFirst({ where: eq(purchaseRequests.id, id) });
    }),

  approve: adminQuery
    .input(z.object({ id: z.number(), approvedBy: z.number(), autoConvertToPo: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      
      await db.transaction(async (tx) => {
        await tx.update(purchaseRequests).set({ status: "approved", approvedBy: input.approvedBy, approvedAt: new Date() }).where(eq(purchaseRequests.id, input.id));
        
        if (input.autoConvertToPo) {
          const pr = await tx.query.purchaseRequests.findFirst({
            where: eq(purchaseRequests.id, input.id),
            with: { items: true },
          });
          
          if (pr && pr.items && pr.items.length > 0) {
            let subtotal = 0;
            const poItems = pr.items.map((item: any) => {
              const estPrice = item.unitPrice ? parseFloat(String(item.unitPrice)) : 100;
              const total = item.quantity * estPrice;
              subtotal += total;
              return {
                itemId: item.itemId,
                quantity: item.quantity,
                unitPrice: String(estPrice),
                total: String(total),
              };
            });
            
            const vatAmount = subtotal * 0.14;
            const totalAmount = subtotal + vatAmount;
            
            const [poResult] = await tx.insert(purchaseOrders).values({
              poNumber: `PO-${pr.prNumber}`,
              supplierId: 1,
              purchaseRequestId: pr.id,
              orderDate: new Date(),
              expectedDeliveryDate: pr.requiredDate,
              subtotal: String(subtotal),
              vatRate: "14",
              vatAmount: String(vatAmount),
              totalAmount: String(totalAmount),
              status: "draft",
              notes: `Auto-generated from Purchase Request ${pr.prNumber}`,
            } as InsertPurchaseOrder).$returningId();
            
            const poId = poResult.id;
            
            await tx.insert(purchaseOrderItems).values(
              poItems.map((i: any) => ({ ...i, purchaseOrderId: poId }))
            );
            
            await tx.update(purchaseRequests)
              .set({ status: "converted_to_po" })
              .where(eq(purchaseRequests.id, input.id));
            
            await tx.insert(integrationLogs).values({
              event: "pr_converted_to_po",
              sourceModule: "purchase_request",
              targetModule: "purchase_order",
              sourceId: input.id,
              targetId: poId,
              sourceNumber: pr.prNumber,
              targetNumber: `PO-${pr.prNumber}`,
              status: "success",
              details: `PR ${pr.prNumber} auto-converted to PO-${poId}`,
              processedAt: new Date(),
            });
          }
        }
      });
      
      return db.query.purchaseRequests.findFirst({ where: eq(purchaseRequests.id, input.id) });
    }),

  reject: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(purchaseRequests).set({ status: "rejected" }).where(eq(purchaseRequests.id, input.id));
      return db.query.purchaseRequests.findFirst({ where: eq(purchaseRequests.id, input.id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(purchaseRequests).where(eq(purchaseRequests.id, input.id));
      return { success: true };
    }),

  getItems: authedQuery
    .input(z.object({ purchaseRequestId: z.number() }))
    .query(async ({ input }) => {
      return getDb().query.purchaseRequestItems.findMany({
        where: eq(purchaseRequestItems.purchaseRequestId, input.purchaseRequestId),
        with: { item: true },
      });
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, draft, pendingApproval, approved, rejected, converted] = await Promise.all([
      db.select({ count: count() }).from(purchaseRequests),
      db.select({ count: count() }).from(purchaseRequests).where(eq(purchaseRequests.status, "draft")),
      db.select({ count: count() }).from(purchaseRequests).where(eq(purchaseRequests.status, "pending_approval")),
      db.select({ count: count() }).from(purchaseRequests).where(eq(purchaseRequests.status, "approved")),
      db.select({ count: count() }).from(purchaseRequests).where(eq(purchaseRequests.status, "rejected")),
      db.select({ count: count() }).from(purchaseRequests).where(eq(purchaseRequests.status, "converted_to_po")),
    ]);
    return { total: total[0].count, draft: draft[0].count, pendingApproval: pendingApproval[0].count, approved: approved[0].count, rejected: rejected[0].count, converted: converted[0].count };
  }),
});
