import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { salesOrders, crmCustomers, crmInteractions, inventoryItems, inventoryTransactions, shipments, integrationLogs } from "@db/schema";
import type { InsertSalesOrder, InsertInventoryTransaction, InsertShipment, InsertCRMInteraction } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const salesOrderRouter = createRouter({
  list: authedQuery
    .input(z.object({ customerId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.customerId) conditions.push(eq(salesOrders.customerId, input.customerId));
      if (input?.status) conditions.push(eq(salesOrders.status, input.status as any));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.salesOrders.findMany({ where, with: { customer: true }, orderBy: desc(salesOrders.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      orderNumber: z.string().min(1),
      customerId: z.number(),
      modelId: z.number().optional(),
      quantity: z.number().min(1),
      unitPrice: z.string(),
      totalAmount: z.string(),
      orderDate: z.string(),
      deliveryDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, unitPrice: input.unitPrice, totalAmount: input.totalAmount, orderDate: new Date(input.orderDate), deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null };
      const [result] = await db.insert(salesOrders).values(data as InsertSalesOrder).$returningId();
      return db.query.salesOrders.findFirst({ where: eq(salesOrders.id, result.id), with: { customer: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "confirmed", "in_production", "ready", "shipped", "delivered", "cancelled"]).optional() }))
    .mutation(async ({ input }) => {
      const { id, status } = input;
      const db = getDb();
      
      return await db.transaction(async (tx) => {
        const order = await tx.query.salesOrders.findFirst({
          where: eq(salesOrders.id, id),
          with: { customer: true },
        });
        
        await tx.update(salesOrders).set({ status }).where(eq(salesOrders.id, id));
        
        if (status === "delivered" && order) {
          if (order.modelId) {
            const item = await tx.query.inventoryItems.findFirst({
              where: eq(inventoryItems.id, order.modelId),
            });
            if (item) {
              const newQty = Math.max(0, (item.quantity || 0) - (order.quantity || 0));
              await tx.update(inventoryItems)
                .set({ quantity: newQty })
                .where(eq(inventoryItems.id, order.modelId));
              
              await tx.insert(inventoryTransactions).values({
                itemId: order.modelId,
                type: "out",
                quantity: order.quantity || 0,
                referenceType: "sales_order",
                referenceId: id,
                notes: `Sales delivery to customer: ${order.customer?.name || order.customerId}`,
              } as InsertInventoryTransaction);
            }
          }
          
          await tx.insert(integrationLogs).values({
            event: "inventory_deducted_from_sale",
            sourceModule: "sales_order",
            targetModule: "inventory",
            sourceId: id,
            status: "success",
            details: `Deducted ${order.quantity} units from finished goods for SO-${order.orderNumber}`,
            processedAt: new Date(),
          });
        }
        
        if (status === "shipped" && order) {
          const existingShipment = await tx.query.shipments.findFirst({
            where: eq(shipments.salesOrderId, id),
          });
          
          if (!existingShipment) {
            await tx.insert(shipments).values({
              trackingNumber: `AUTO-SO-${order.orderNumber}`,
              salesOrderId: id,
              customerId: order.customerId,
              shippingDate: new Date(),
              status: "in_transit",
              shippingAddress: order.customer?.address || "",
              recipientName: order.customer?.name || "",
              recipientPhone: order.customer?.phone || "",
            } as InsertShipment);
            
            await tx.insert(integrationLogs).values({
              event: "shipment_auto_created",
              sourceModule: "sales_order",
              targetModule: "shipping",
              sourceId: id,
              status: "success",
              details: `Auto-created shipment for SO-${order.orderNumber}`,
              processedAt: new Date(),
            });
          }
        }
        
        return tx.query.salesOrders.findFirst({ where: eq(salesOrders.id, id), with: { customer: true } });
      });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(salesOrders).where(eq(salesOrders.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, pending, shipped, delivered] = await Promise.all([
      db.select({ count: count() }).from(salesOrders),
      db.select({ count: count() }).from(salesOrders).where(eq(salesOrders.status, "pending")),
      db.select({ count: count() }).from(salesOrders).where(eq(salesOrders.status, "shipped")),
      db.select({ count: count() }).from(salesOrders).where(eq(salesOrders.status, "delivered")),
    ]);
    return { total: total[0].count, pending: pending[0].count, shipped: shipped[0].count, delivered: delivered[0].count };
  }),
});

export const crmRouter = createRouter({
  list: authedQuery
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(crmCustomers.status, input.status as any));
      if (input?.search) conditions.push(sql`${crmCustomers.name} LIKE ${"%" + input.search + "%"}`);
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.crmCustomers.findMany({ where, with: { interactions: true }, orderBy: desc(crmCustomers.createdAt) });
    }),

  listCustomers: authedQuery
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(crmCustomers.status, input.status as any));
      if (input?.search) conditions.push(sql`${crmCustomers.name} LIKE ${"%" + input.search + "%"}`);
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.crmCustomers.findMany({ where, with: { interactions: true }, orderBy: desc(crmCustomers.createdAt) });
    }),

  getCustomer: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getDb().query.crmCustomers.findFirst({
        where: eq(crmCustomers.id, input.id),
        with: { interactions: true, salesOrders: true },
      });
    }),

  createCustomer: adminQuery
    .input(z.object({ name: z.string().min(1), contactPerson: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), address: z.string().optional(), city: z.string().optional(), country: z.string().optional(), customerType: z.enum(["wholesale", "retail", "corporate", "export"]).default("wholesale"), rating: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(crmCustomers).values(input).$returningId();
      return db.query.crmCustomers.findFirst({ where: eq(crmCustomers.id, result.id) });
    }),

  updateCustomer: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      contactPerson: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      customerType: z.enum(["wholesale", "retail", "corporate", "export"]).optional(),
      status: z.enum(["active", "inactive", "prospect"]).optional(),
      rating: z.number().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(crmCustomers).set(data).where(eq(crmCustomers.id, id));
      return db.query.crmCustomers.findFirst({ where: eq(crmCustomers.id, id) });
    }),

  deleteCustomer: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(crmCustomers).where(eq(crmCustomers.id, input.id));
      return { success: true };
    }),

  listInteractions: authedQuery
    .input(z.object({ customerId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.customerId) {
        return db.query.crmInteractions.findMany({ where: eq(crmInteractions.customerId, input.customerId), orderBy: desc(crmInteractions.createdAt) });
      }
      return db.select().from(crmInteractions).orderBy(desc(crmInteractions.createdAt));
    }),

  createInteraction: adminQuery
    .input(z.object({ customerId: z.number(), type: z.enum(["call", "email", "meeting", "visit", "note"]), subject: z.string().optional(), content: z.string().optional(), followUpDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, followUpDate: input.followUpDate ? new Date(input.followUpDate) : null };
      const [result] = await db.insert(crmInteractions).values(data as InsertCRMInteraction).$returningId();
      return db.query.crmInteractions.findFirst({ where: eq(crmInteractions.id, result.id) });
    }),

  addInteraction: adminQuery
    .input(z.object({ customerId: z.number(), type: z.enum(["call", "email", "meeting", "visit", "note"]), subject: z.string().optional(), content: z.string().optional(), followUpDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, followUpDate: input.followUpDate ? new Date(input.followUpDate) : null };
      const [result] = await db.insert(crmInteractions).values(data as InsertCRMInteraction).$returningId();
      return db.query.crmInteractions.findFirst({ where: eq(crmInteractions.id, result.id) });
    }),

  deleteInteraction: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(crmInteractions).where(eq(crmInteractions.id, input.id));
      return { success: true };
    }),
});

