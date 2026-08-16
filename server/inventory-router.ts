import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { inventoryItems, inventoryTransactions } from "@db/schema";
import type { InsertInventoryItem } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const inventoryRouter = createRouter({
  list: authedQuery
    .input(z.object({ category: z.string().optional(), status: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.category) conditions.push(eq(inventoryItems.category, input.category));
      if (input?.status) conditions.push(eq(inventoryItems.status, input.status as "in_stock" | "low_stock" | "out_of_stock"));
      if (input?.search) conditions.push(sql`${inventoryItems.name} LIKE ${"%" + input.search + "%"} OR ${inventoryItems.sku} LIKE ${"%" + input.search + "%"}`);
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.select().from(inventoryItems).where(where).orderBy(desc(inventoryItems.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getDb().query.inventoryItems.findFirst({
        where: eq(inventoryItems.id, input.id),
        with: { transactions: true },
      });
    }),

  create: adminQuery
    .input(z.object({
      sku: z.string().min(1),
      name: z.string().min(1),
      category: z.string().min(1),
      unit: z.string().min(1),
      quantity: z.number().default(0),
      minStock: z.number().default(0),
      reorderPoint: z.number().default(0),
      unitCost: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, unitCost: input.unitCost ?? null };
      const [result] = await db.insert(inventoryItems).values(data as InsertInventoryItem).$returningId();
      return db.query.inventoryItems.findFirst({ where: eq(inventoryItems.id, result.id) });
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      quantity: z.number().optional(),
      minStock: z.number().optional(),
      unitCost: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(["in_stock", "low_stock", "out_of_stock"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, unitCost, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (unitCost !== undefined) updateData.unitCost = unitCost;
      await db.update(inventoryItems).set(updateData).where(eq(inventoryItems.id, id));
      return db.query.inventoryItems.findFirst({ where: eq(inventoryItems.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(inventoryItems).where(eq(inventoryItems.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, lowStock, outOfStock] = await Promise.all([
      db.select({ count: count() }).from(inventoryItems),
      db.select({ count: count() }).from(inventoryItems).where(eq(inventoryItems.status, "low_stock")),
      db.select({ count: count() }).from(inventoryItems).where(eq(inventoryItems.status, "out_of_stock")),
    ]);
    return { total: total[0].count, lowStock: lowStock[0].count, outOfStock: outOfStock[0].count };
  }),
});

export const inventoryTransactionRouter = createRouter({
  list: authedQuery
    .input(z.object({ itemId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.itemId) {
        return db.query.inventoryTransactions.findMany({ where: eq(inventoryTransactions.itemId, input.itemId), orderBy: desc(inventoryTransactions.createdAt) });
      }
      return db.select().from(inventoryTransactions).orderBy(desc(inventoryTransactions.createdAt));
    }),

  create: adminQuery
    .input(z.object({
      itemId: z.number(),
      type: z.enum(["in", "out", "adjustment", "transfer"]),
      quantity: z.number(),
      referenceType: z.string().optional(),
      referenceId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(inventoryTransactions).values(input).$returningId();
      return db.query.inventoryTransactions.findFirst({ where: eq(inventoryTransactions.id, result.id) });
    }),
});
