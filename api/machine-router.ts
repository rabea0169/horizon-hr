import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { machines } from "@db/schema";
import type { InsertMachine } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const machineRouter = createRouter({
  list: authedQuery
    .input(z.object({ status: z.string().optional(), lineId: z.number().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(machines.status, input.status as "operational" | "maintenance" | "broken" | "idle"));
      if (input?.lineId) conditions.push(eq(machines.lineId, input.lineId));
      if (input?.search) conditions.push(sql`${machines.name} LIKE ${"%" + input.search + "%"} OR ${machines.machineCode} LIKE ${"%" + input.search + "%"}`);
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.select().from(machines).where(where).orderBy(desc(machines.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getDb().query.machines.findFirst({
        where: eq(machines.id, input.id),
        with: { line: true },
      });
    }),

  create: adminQuery
    .input(z.object({
      machineCode: z.string().min(1),
      name: z.string().min(1),
      type: z.string().min(1),
      brand: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      lineId: z.number().optional(),
      purchaseDate: z.string().optional(),
      cost: z.string().optional(),
      nextMaintenance: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = { ...input };
      if (input.purchaseDate) data.purchaseDate = new Date(input.purchaseDate);
      if (input.nextMaintenance) data.nextMaintenance = new Date(input.nextMaintenance);
      if (input.cost) data.cost = input.cost;
      const [result] = await db.insert(machines).values(data as InsertMachine).$returningId();
      return db.query.machines.findFirst({ where: eq(machines.id, result.id) });
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      status: z.enum(["operational", "maintenance", "broken", "idle"]).optional(),
      lineId: z.number().optional(),
      nextMaintenance: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, nextMaintenance, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (nextMaintenance !== undefined) updateData.nextMaintenance = nextMaintenance ? new Date(nextMaintenance) : null;
      await db.update(machines).set(updateData).where(eq(machines.id, id));
      return db.query.machines.findFirst({ where: eq(machines.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(machines).where(eq(machines.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [operational, maintenance, broken, idle, total] = await Promise.all([
      db.select({ count: count() }).from(machines).where(eq(machines.status, "operational")),
      db.select({ count: count() }).from(machines).where(eq(machines.status, "maintenance")),
      db.select({ count: count() }).from(machines).where(eq(machines.status, "broken")),
      db.select({ count: count() }).from(machines).where(eq(machines.status, "idle")),
      db.select({ count: count() }).from(machines),
    ]);
    return { operational: operational[0].count, maintenance: maintenance[0].count, broken: broken[0].count, idle: idle[0].count, total: total[0].count };
  }),
});
