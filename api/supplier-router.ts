import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { suppliers, supplyOrders } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const supplierRouter = createRouter({
  list: authedQuery
    .input(z.object({ status: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(suppliers.status, input.status as "active" | "inactive"));
      if (input?.search) conditions.push(sql`${suppliers.name} LIKE ${"%" + input.search + "%"}`);
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.select().from(suppliers).where(where).orderBy(desc(suppliers.createdAt));
    }),

  create: adminQuery
    .input(z.object({ name: z.string().min(1), contactPerson: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), address: z.string().optional(), taxNumber: z.string().optional(), rating: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(suppliers).values(input).$returningId();
      return db.query.suppliers.findFirst({ where: eq(suppliers.id, result.id) });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), status: z.enum(["active", "inactive"]).optional(), rating: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(suppliers).set(data).where(eq(suppliers.id, id));
      return db.query.suppliers.findFirst({ where: eq(suppliers.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(suppliers).where(eq(suppliers.id, input.id));
      return { success: true };
    }),
});

export const supplyOrderRouter = createRouter({
  list: authedQuery
    .input(z.object({ supplierId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.supplierId) conditions.push(eq(supplyOrders.supplierId, input.supplierId));
      if (input?.status) conditions.push(eq(supplyOrders.status, input.status as "draft" | "sent" | "partial" | "received" | "cancelled"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.supplyOrders.findMany({ where, with: { supplier: true, items: true }, orderBy: desc(supplyOrders.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ orderNumber: z.string().min(1), supplierId: z.number(), expectedDate: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, expectedDate: input.expectedDate ? new Date(input.expectedDate) : null };
      const [result] = await db.insert(supplyOrders).values(data as InsertSupplyOrder).$returningId();
      return db.query.supplyOrders.findFirst({ where: eq(supplyOrders.id, result.id), with: { supplier: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["draft", "sent", "partial", "received", "cancelled"]).optional(), receivedDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, receivedDate, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (receivedDate !== undefined) updateData.receivedDate = receivedDate ? new Date(receivedDate) : null;
      await db.update(supplyOrders).set(updateData).where(eq(supplyOrders.id, id));
      return db.query.supplyOrders.findFirst({ where: eq(supplyOrders.id, id), with: { supplier: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(supplyOrders).where(eq(supplyOrders.id, input.id));
      return { success: true };
    }),
});


