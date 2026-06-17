import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { goodsReceipts, goodsReceiptItems, purchaseOrders, inventoryItems, inventoryTransactions, integrationLogs, InsertGoodsReceipt, InsertInventoryTransaction } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const goodsReceiptRouter = createRouter({
  list: authedQuery
    .input(z.object({ purchaseOrderId: z.number().optional(), supplierId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.purchaseOrderId) conditions.push(eq(goodsReceipts.purchaseOrderId, input.purchaseOrderId));
      if (input?.supplierId) conditions.push(eq(goodsReceipts.supplierId, input.supplierId));
      if (input?.status) conditions.push(eq(goodsReceipts.status, input.status as "pending_inspection" | "partially_accepted" | "fully_accepted" | "rejected"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.goodsReceipts.findMany({ where, with: { purchaseOrder: true, supplier: true }, orderBy: desc(goodsReceipts.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      grNumber: z.string().min(1),
      purchaseOrderId: z.number(),
      supplierId: z.number(),
      receiptDate: z.string(),
      invoiceNumber: z.string().optional(),
      subtotal: z.string().optional(),
      vatAmount: z.string().optional(),
      totalAmount: z.string().optional(),
      notes: z.string().optional(),
      receivedBy: z.string().optional(),
      items: z.array(z.object({
        purchaseOrderItemId: z.number(),
        itemId: z.number(),
        orderedQuantity: z.number(),
        receivedQuantity: z.number(),
        acceptedQuantity: z.number().optional(),
        rejectedQuantity: z.number().optional(),
        rejectionReason: z.string().optional(),
        unitPrice: z.string().optional(),
        total: z.string().optional(),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { items, ...grData } = input;

      const grId = await db.transaction(async (tx) => {
        const [result] = await tx.insert(goodsReceipts).values({
          ...grData,
          subtotal: grData.subtotal ? parseFloat(grData.subtotal) : 0,
          vatAmount: grData.vatAmount ? parseFloat(grData.vatAmount) : 0,
          totalAmount: grData.totalAmount ? parseFloat(grData.totalAmount) : 0,
          receiptDate: new Date(grData.receiptDate),
        } as InsertGoodsReceipt).$returningId();

        const id = result.id;
        if (items && items.length > 0) {
          await tx.insert(goodsReceiptItems).values(items.map(i => ({
            goodsReceiptId: id,
            ...i,
            acceptedQuantity: i.acceptedQuantity || 0,
            rejectedQuantity: i.rejectedQuantity || 0,
            unitPrice: i.unitPrice || "0",
            total: i.total || "0",
          })));
        }
        return id;
      });

      return db.query.goodsReceipts.findFirst({ where: eq(goodsReceipts.id, grId), with: { purchaseOrder: true, supplier: true } });
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending_inspection", "partially_accepted", "fully_accepted", "rejected"]) }))
    .mutation(async ({ input }) => {
      const { id, status } = input;
      const db = getDb();
      
      return await db.transaction(async (tx) => {
        await tx.update(goodsReceipts).set({ status }).where(eq(goodsReceipts.id, id));
        
        if (status === "fully_accepted" || status === "partially_accepted") {
          const gr = await tx.query.goodsReceipts.findFirst({
            where: eq(goodsReceipts.id, id),
            with: { items: true, purchaseOrder: true },
          });
          
          if (gr && gr.items) {
            for (const item of gr.items) {
              if ((item.acceptedQuantity || 0) > 0) {
                await tx.update(inventoryItems)
                  .set({ quantity: sql`${inventoryItems.quantity} + ${item.acceptedQuantity || 0}` })
                  .where(eq(inventoryItems.id, item.itemId));
                
                await tx.insert(inventoryTransactions).values({
                  itemId: item.itemId,
                  type: "in",
                  quantity: item.acceptedQuantity || 0,
                  referenceType: "goods_receipt",
                  referenceId: id,
                  notes: `Goods receipt from supplier - PO #${gr.purchaseOrder?.poNumber || gr.purchaseOrderId}`,
                } as InsertInventoryTransaction);
              }
            }
            
            if (gr.purchaseOrderId) {
              const poStatus = status === "fully_accepted" ? "fully_received" : "partially_received";
              await tx.update(purchaseOrders)
                .set({ status: poStatus })
                .where(eq(purchaseOrders.id, gr.purchaseOrderId));
            }
            
            await tx.insert(integrationLogs).values({
              event: "inventory_updated_from_gr",
              sourceModule: "goods_receipt",
              targetModule: "inventory",
              sourceId: id,
              targetId: gr.purchaseOrderId,
              status: "success",
              details: `Inventory updated: ${gr.items.length} items received`,
              processedAt: new Date(),
            });
          }
        }
        
        return tx.query.goodsReceipts.findFirst({ where: eq(goodsReceipts.id, id), with: { purchaseOrder: true, supplier: true } });
      });
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, pendingInspection, partiallyAccepted, fullyAccepted] = await Promise.all([
      db.select({ count: count() }).from(goodsReceipts),
      db.select({ count: count() }).from(goodsReceipts).where(eq(goodsReceipts.status, "pending_inspection")),
      db.select({ count: count() }).from(goodsReceipts).where(eq(goodsReceipts.status, "partially_accepted")),
      db.select({ count: count() }).from(goodsReceipts).where(eq(goodsReceipts.status, "fully_accepted")),
    ]);
    return { total: total[0].count, pendingInspection: pendingInspection[0].count, partiallyAccepted: partiallyAccepted[0].count, fullyAccepted: fullyAccepted[0].count };
  }),
});
