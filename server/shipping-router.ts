import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { shipments, shipmentItems } from "@db/schema";
import type { InsertShipment } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const shippingRouter = createRouter({
  list: authedQuery
    .input(z.object({ salesOrderId: z.number().optional(), status: z.string().optional(), customerId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.salesOrderId) conditions.push(eq(shipments.salesOrderId, input.salesOrderId));
      if (input?.status) conditions.push(eq(shipments.status, input.status as "pending" | "picked" | "in_transit" | "out_for_delivery" | "delivered" | "returned" | "cancelled"));
      if (input?.customerId) conditions.push(eq(shipments.customerId, input.customerId));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.shipments.findMany({ where, with: { salesOrder: true }, orderBy: desc(shipments.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      trackingNumber: z.string().min(1),
      salesOrderId: z.number(),
      customerId: z.number(),
      carrier: z.string().optional(),
      shippingDate: z.string(),
      estimatedDeliveryDate: z.string().optional(),
      shippingAddress: z.string().optional(),
      shippingCost: z.string().optional(),
      status: z.enum(["pending", "picked", "in_transit", "out_for_delivery", "delivered", "returned", "cancelled"]).default("pending"),
      deliveryNotes: z.string().optional(),
      recipientName: z.string().optional(),
      recipientPhone: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({ salesOrderItemId: z.number(), itemId: z.number(), quantity: z.number(), notes: z.string().optional() })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { items, ...shipData } = input;
      const [result] = await db.insert(shipments).values({
        ...shipData,
        shippingCost: shipData.shippingCost ?? "0",
        shippingDate: new Date(shipData.shippingDate),
        estimatedDeliveryDate: shipData.estimatedDeliveryDate ? new Date(shipData.estimatedDeliveryDate) : null,
      } as InsertShipment).$returningId();

      const shipmentId = result.id;
      if (items && items.length > 0) {
        await db.insert(shipmentItems).values(items.map(i => ({ shipmentId, ...i })));
      }

      return db.query.shipments.findFirst({ where: eq(shipments.id, shipmentId), with: { salesOrder: true } });
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "picked", "in_transit", "out_for_delivery", "delivered", "returned", "cancelled"]) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: any = { status: input.status };
      if (input.status === "delivered") updateData.actualDeliveryDate = new Date();
      await db.update(shipments).set(updateData).where(eq(shipments.id, input.id));
      return db.query.shipments.findFirst({ where: eq(shipments.id, input.id), with: { salesOrder: true } });
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, pending, inTransit, delivered, returned] = await Promise.all([
      db.select({ count: count() }).from(shipments),
      db.select({ count: count() }).from(shipments).where(eq(shipments.status, "pending")),
      db.select({ count: count() }).from(shipments).where(eq(shipments.status, "in_transit")),
      db.select({ count: count() }).from(shipments).where(eq(shipments.status, "delivered")),
      db.select({ count: count() }).from(shipments).where(eq(shipments.status, "returned")),
    ]);
    return { total: total[0].count, pending: pending[0].count, inTransit: inTransit[0].count, delivered: delivered[0].count, returned: returned[0].count };
  }),
});
