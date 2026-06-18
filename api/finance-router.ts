import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { advances, bonusPenalties, pieceRateRecords, costCalculations } from "@db/schema";
import type { InsertAdvance, InsertBonusPenalty, InsertPieceRateRecord, InsertCostCalculation } from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

export const advanceRouter = createRouter({
  list: authedQuery
    .input(z.object({ employeeId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.employeeId) conditions.push(eq(advances.employeeId, input.employeeId));
      if (input?.status) conditions.push(eq(advances.status, input.status as "pending" | "approved" | "rejected" | "repaid"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.advances.findMany({ where, with: { employee: true }, orderBy: desc(advances.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ employeeId: z.number(), amount: z.string(), reason: z.string().optional(), repaymentAmount: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, repaymentAmount: input.repaymentAmount ?? null };
      const [result] = await db.insert(advances).values(data as InsertAdvance).$returningId();
      return db.query.advances.findFirst({ where: eq(advances.id, result.id), with: { employee: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected", "repaid"]).optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(advances).set(data).where(eq(advances.id, id));
      return db.query.advances.findFirst({ where: eq(advances.id, id), with: { employee: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(advances).where(eq(advances.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, pending] = await Promise.all([
      db.select({ count: count() }).from(advances),
      db.select({ count: count() }).from(advances).where(eq(advances.status, "pending")),
    ]);
    return { total: total[0].count, pending: pending[0].count };
  }),
});

export const bonusPenaltyRouter = createRouter({
  list: authedQuery
    .input(z.object({ employeeId: z.number().optional(), month: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.employeeId) conditions.push(eq(bonusPenalties.employeeId, input.employeeId));
      if (input?.month) conditions.push(eq(bonusPenalties.month, input.month));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.bonusPenalties.findMany({ where, with: { employee: true }, orderBy: desc(bonusPenalties.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ employeeId: z.number(), type: z.enum(["bonus", "penalty"]), category: z.string(), amount: z.string(), reason: z.string().optional(), month: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input };
      const [result] = await db.insert(bonusPenalties).values(data as InsertBonusPenalty).$returningId();
      return db.query.bonusPenalties.findFirst({ where: eq(bonusPenalties.id, result.id), with: { employee: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(bonusPenalties).where(eq(bonusPenalties.id, input.id));
      return { success: true };
    }),
});

export const pieceRateRouter = createRouter({
  list: authedQuery
    .input(z.object({ employeeId: z.number().optional(), modelId: z.number().optional(), date: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.employeeId) conditions.push(eq(pieceRateRecords.employeeId, input.employeeId));
      if (input?.modelId) conditions.push(eq(pieceRateRecords.modelId, input.modelId));
      if (input?.date) conditions.push(eq(pieceRateRecords.date, new Date(input.date)));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.pieceRateRecords.findMany({ where, with: { employee: true, model: true, stage: true }, orderBy: desc(pieceRateRecords.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ employeeId: z.number(), modelId: z.number(), stageId: z.number().optional(), quantity: z.number(), unitPrice: z.string(), totalAmount: z.string(), date: z.string(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, date: new Date(input.date) };
      const [result] = await db.insert(pieceRateRecords).values(data as InsertPieceRateRecord).$returningId();
      return db.query.pieceRateRecords.findFirst({ where: eq(pieceRateRecords.id, result.id), with: { employee: true, model: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), quantity: z.number().optional(), unitPrice: z.string().optional(), totalAmount: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
      if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
      if (data.notes !== undefined) updateData.notes = data.notes;
      await db.update(pieceRateRecords).set(updateData).where(eq(pieceRateRecords.id, id));
      return db.query.pieceRateRecords.findFirst({ where: eq(pieceRateRecords.id, id), with: { employee: true, model: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(pieceRateRecords).where(eq(pieceRateRecords.id, input.id));
      return { success: true };
    }),

  summary: authedQuery
    .input(z.object({ employeeId: z.number(), month: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const records = await db.select().from(pieceRateRecords)
        .where(sql`${pieceRateRecords.employeeId} = ${input.employeeId} AND DATE_FORMAT(${pieceRateRecords.date}, '%Y-%m') = ${input.month}`);
      const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
      const totalAmount = records.reduce((sum, r) => sum + parseFloat(r.totalAmount as unknown as string), 0);
      return { totalQuantity, totalAmount, recordCount: records.length };
    }),
});

export const costCalculationRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().query.costCalculations.findMany({
      with: { model: true },
      orderBy: desc(costCalculations.createdAt),
    });
  }),

  create: adminQuery
    .input(z.object({
      modelId: z.number(),
      fabricCost: z.string().optional(),
      laborCost: z.string().optional(),
      overheadCost: z.string().optional(),
      trimCost: z.string().optional(),
      otherCost: z.string().optional(),
      totalCost: z.string(),
      profitMargin: z.string().optional(),
      sellingPrice: z.string(),
      minOrderQuantity: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = { ...input };
      const [result] = await db.insert(costCalculations).values(data as InsertCostCalculation).$returningId();
      return db.query.costCalculations.findFirst({ where: eq(costCalculations.id, result.id), with: { model: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), sellingPrice: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, sellingPrice, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice;
      await db.update(costCalculations).set(updateData).where(eq(costCalculations.id, id));
      return db.query.costCalculations.findFirst({ where: eq(costCalculations.id, id), with: { model: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(costCalculations).where(eq(costCalculations.id, input.id));
      return { success: true };
    }),
});
