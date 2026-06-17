import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { productionLines, productionOrders, dailyProduction, productionModels, modelStages, InsertProductionOrder, InsertDailyProduction, InsertModelStage } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const productionLineRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return db.query.productionLines.findMany({
      with: { supervisor: true },
      orderBy: desc(productionLines.createdAt),
    });
  }),

  create: adminQuery
    .input(z.object({
      name: z.string().min(1),
      lineType: z.enum(["sewing", "cutting", "ironing", "packing", "finishing"]).default("sewing"),
      supervisorId: z.number().optional(),
      capacity: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(productionLines).values(input).$returningId();
      return db.query.productionLines.findFirst({ where: eq(productionLines.id, result.id) });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), name: z.string().min(1).optional(), status: z.enum(["active", "inactive", "maintenance"]).optional(), supervisorId: z.number().optional(), capacity: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(productionLines).set(data).where(eq(productionLines.id, id));
      return db.query.productionLines.findFirst({ where: eq(productionLines.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(productionLines).where(eq(productionLines.id, input.id));
      return { success: true };
    }),
});

export const productionOrderRouter = createRouter({
  list: authedQuery
    .input(z.object({ status: z.string().optional(), lineId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(productionOrders.status, input.status as "pending" | "in_progress" | "completed" | "cancelled"));
      if (input?.lineId) conditions.push(eq(productionOrders.lineId, input.lineId));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.select().from(productionOrders).where(where).orderBy(desc(productionOrders.createdAt));
    }),

  create: adminQuery
    .input(z.object({
      orderCode: z.string().min(1),
      styleName: z.string().min(1),
      customerName: z.string().optional(),
      quantity: z.number().min(1),
      lineId: z.number().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, startDate: input.startDate ? new Date(input.startDate) : null, endDate: input.endDate ? new Date(input.endDate) : null };
      const [result] = await db.insert(productionOrders).values(data as InsertProductionOrder).$returningId();
      return db.query.productionOrders.findFirst({ where: eq(productionOrders.id, result.id) });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(), completed: z.number().optional(), lineId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(productionOrders).set(data).where(eq(productionOrders.id, id));
      return db.query.productionOrders.findFirst({ where: eq(productionOrders.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(productionOrders).where(eq(productionOrders.id, input.id));
      return { success: true };
    }),
});

export const dailyProductionRouter = createRouter({
  list: authedQuery
    .input(z.object({ lineId: z.number().optional(), date: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.lineId) conditions.push(eq(dailyProduction.lineId, input.lineId));
      if (input?.date) conditions.push(eq(dailyProduction.date, new Date(input.date)));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.select().from(dailyProduction).where(where).orderBy(desc(dailyProduction.date));
    }),

  create: adminQuery
    .input(z.object({
      lineId: z.number(),
      orderId: z.number().optional(),
      date: z.string(),
      produced: z.number().default(0),
      defected: z.number().default(0),
      reworked: z.number().default(0),
      workersCount: z.number().default(0),
      hoursWorked: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(dailyProduction).values({ ...input, date: new Date(input.date), hoursWorked: input.hoursWorked ? parseFloat(input.hoursWorked) : null } as InsertDailyProduction).$returningId();
      return db.query.dailyProduction.findFirst({ where: eq(dailyProduction.id, result.id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(dailyProduction).where(eq(dailyProduction.id, input.id));
      return { success: true };
    }),
});

export const productionModelRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return db.query.productionModels.findMany({
      with: { stages: true },
      orderBy: desc(productionModels.createdAt),
    });
  }),

  create: adminQuery
    .input(z.object({
      modelCode: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      baseImage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(productionModels).values(input).$returningId();
      return db.query.productionModels.findFirst({ where: eq(productionModels.id, result.id), with: { stages: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), status: z.enum(["active", "inactive", "draft"]).optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(productionModels).set(data).where(eq(productionModels.id, id));
      return db.query.productionModels.findFirst({ where: eq(productionModels.id, id), with: { stages: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(productionModels).where(eq(productionModels.id, input.id));
      return { success: true };
    }),
});

export const modelStageRouter = createRouter({
  create: adminQuery
    .input(z.object({ modelId: z.number(), name: z.string().min(1), sequence: z.number(), unitPrice: z.string().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(modelStages).values({ ...input, unitPrice: input.unitPrice ? parseFloat(input.unitPrice) : 0 } as InsertModelStage).$returningId();
      return db.query.modelStages.findFirst({ where: eq(modelStages.id, result.id) });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), sequence: z.number().optional(), unitPrice: z.string().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.unitPrice !== undefined) updateData.unitPrice = parseFloat(data.unitPrice);
      await db.update(modelStages).set(updateData).where(eq(modelStages.id, id));
      return db.query.modelStages.findFirst({ where: eq(modelStages.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(modelStages).where(eq(modelStages.id, input.id));
      return { success: true };
    }),
});
