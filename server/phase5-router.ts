// ═══════════════════════════════════════════════════════════════
//  Phase 5: Expenses + Finished Goods + Wastage + Sales Rep Mobile
// ═══════════════════════════════════════════════════════════════

import { z } from "zod";
import { eq, and, like, desc, count, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  expenseCategories,
  expenses,
  finishedGoods,
  wastageRecords,
  salesRepVisits,
  salesRepOrders,
} from "@db/schema";

// ─── Expense Categories Router ───
export const expenseCategoryRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = await getDb();
    return db.select().from(expenseCategories).orderBy(expenseCategories.name);
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select().from(expenseCategories).where(eq(expenseCategories.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: adminQuery
    .input(z.object({
      name: z.string().min(1),
      code: z.string().min(1),
      parentId: z.number().optional(),
      description: z.string().optional(),
      budgetLimit: z.string().optional(),
      period: z.enum(["monthly", "quarterly", "annual", "weekly", "daily"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(expenseCategories).values({
        ...input,
        parentId: input.parentId ?? null,
      });
      return { id: Number(result[0].insertId) };
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      code: z.string().optional(),
      description: z.string().optional(),
      budgetLimit: z.string().optional(),
      period: z.enum(["monthly", "quarterly", "annual", "weekly", "daily"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(expenseCategories).set(data).where(eq(expenseCategories.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(expenseCategories).where(eq(expenseCategories.id, input.id));
      return { success: true };
    }),
});

// ─── Expenses Router ───
export const expenseRouter = createRouter({
  list: authedQuery
    .input(z.object({
      categoryId: z.number().optional(),
      status: z.string().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.categoryId) conditions.push(eq(expenses.categoryId, input.categoryId));
      if (input?.status) conditions.push(eq(expenses.status, input.status as "draft" | "pending" | "approved" | "rejected" | "paid"));
      if (input?.fromDate) conditions.push(sql`${expenses.expenseDate} >= ${input.fromDate}`);
      if (input?.toDate) conditions.push(sql`${expenses.expenseDate} <= ${input.toDate}`);
      if (input?.search) conditions.push(like(expenses.title, `%${input.search}%`));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(expenses).where(where).orderBy(desc(expenses.expenseDate));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select().from(expenses).where(eq(expenses.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: adminQuery
    .input(z.object({
      expenseNumber: z.string(),
      categoryId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      amount: z.string(),
      expenseDate: z.string(),
      paymentMethod: z.enum(["cash", "check", "bank_transfer", "credit_card", "other"]).optional(),
      payee: z.string().optional(),
      receiptNumber: z.string().optional(),
      isRecurring: z.boolean().optional(),
      recurringFrequency: z.enum(["weekly", "monthly", "quarterly", "annually"]).optional(),
      departmentId: z.number().optional(),
      vatAmount: z.string().optional(),
      totalAmount: z.string(),
      allocatedToOrderId: z.number().optional(),
      allocatedToModelId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const expData: any = {
        ...input,
        status: "draft",
      };
      if (input.expenseDate) expData.expenseDate = new Date(input.expenseDate);
      const result = await db.insert(expenses).values(expData);
      return { id: Number(result[0].insertId) };
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      amount: z.string().optional(),
      expenseDate: z.string().optional(),
      paymentMethod: z.enum(["cash", "check", "bank_transfer", "credit_card", "other"]).optional(),
      payee: z.string().optional(),
      receiptNumber: z.string().optional(),
      isRecurring: z.boolean().optional(),
      departmentId: z.number().optional(),
      status: z.enum(["draft", "pending", "approved", "rejected", "paid"]).optional(),
      vatAmount: z.string().optional(),
      totalAmount: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...rawData } = input;
      const data: any = { ...rawData };
      if (data.expenseDate) data.expenseDate = new Date(data.expenseDate);
      await db.update(expenses).set(data).where(eq(expenses.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(expenses).where(eq(expenses.id, input.id));
      return { success: true };
    }),

  approve: adminQuery
    .input(z.object({ id: z.number(), approvedBy: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(expenses)
        .set({ status: "approved", approvedBy: input.approvedBy, approvedAt: new Date() })
        .where(eq(expenses.id, input.id));
      return { success: true };
    }),

  // Dashboard KPIs
  summary: authedQuery
    .input(z.object({
      fromDate: z.string(),
      toDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select({
        totalExpenses: sql`COALESCE(SUM(${expenses.totalAmount}), 0)`,
        count: count(),
        avgExpense: sql`COALESCE(AVG(${expenses.totalAmount}), 0)`,
      }).from(expenses)
        .where(and(
          sql`${expenses.expenseDate} >= ${input.fromDate}`,
          sql`${expenses.expenseDate} <= ${input.toDate}`,
          eq(expenses.status, "paid")
        ));

      const byCategory = await db.select({
        categoryId: expenses.categoryId,
        total: sql`COALESCE(SUM(${expenses.totalAmount}), 0)`,
      }).from(expenses)
        .where(and(
          sql`${expenses.expenseDate} >= ${input.fromDate}`,
          sql`${expenses.expenseDate} <= ${input.toDate}`,
        ))
        .groupBy(expenses.categoryId);

      return { summary: rows[0], byCategory };
    }),
});

// ─── Finished Goods Router ───
export const finishedGoodsRouter = createRouter({
  list: authedQuery
    .input(z.object({
      warehouseId: z.number().optional(),
      status: z.string().optional(),
      modelId: z.number().optional(),
      customerId: z.number().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.warehouseId) conditions.push(eq(finishedGoods.warehouseId, input.warehouseId));
      if (input?.status) conditions.push(eq(finishedGoods.status, input.status as "in_stock" | "reserved" | "picked" | "packed" | "shipped" | "delivered" | "returned" | "quarantine"));
      if (input?.modelId) conditions.push(eq(finishedGoods.modelId, input.modelId));
      if (input?.customerId) conditions.push(eq(finishedGoods.customerId, input.customerId));
      if (input?.search) conditions.push(like(finishedGoods.modelName, `%${input.search}%`));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(finishedGoods).where(where).orderBy(desc(finishedGoods.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select().from(finishedGoods).where(eq(finishedGoods.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: authedQuery
    .input(z.object({
      sku: z.string(),
      modelId: z.number(),
      modelName: z.string(),
      color: z.string(),
      size: z.string(),
      barcode: z.string().optional(),
      productionOrderId: z.number().optional(),
      bundleId: z.number().optional(),
      warehouseId: z.number(),
      binId: z.number().optional(),
      quantity: z.number(),
      unitCost: z.string().optional(),
      totalCost: z.string().optional(),
      sellingPrice: z.string().optional(),
      customerId: z.number().optional(),
      customerName: z.string().optional(),
      salesOrderId: z.number().optional(),
      qualityGrade: z.enum(["a", "b", "c"]).optional(),
      productionDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const fgData: any = {
        ...input,
        availableQty: input.quantity,
        reservedQty: 0,
        status: "in_stock",
      };
      if (input.productionDate) fgData.productionDate = new Date(input.productionDate);
      const result = await db.insert(finishedGoods).values(fgData);
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["in_stock", "reserved", "picked", "packed", "shipped", "delivered", "returned", "quarantine"]).optional(),
      quantity: z.number().optional(),
      availableQty: z.number().optional(),
      reservedQty: z.number().optional(),
      sellingPrice: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(finishedGoods).set(data).where(eq(finishedGoods.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(finishedGoods).where(eq(finishedGoods.id, input.id));
      return { success: true };
    }),

  // KPIs
  summary: authedQuery.query(async () => {
    const db = await getDb();
    const rows = await db.select({
      totalItems: count(),
      totalQuantity: sql`COALESCE(SUM(${finishedGoods.quantity}), 0)`,
      totalValue: sql`COALESCE(SUM(${finishedGoods.totalCost}), 0)`,
      totalAvailable: sql`COALESCE(SUM(${finishedGoods.availableQty}), 0)`,
      totalReserved: sql`COALESCE(SUM(${finishedGoods.reservedQty}), 0)`,
    }).from(finishedGoods);

    const byWarehouse = await db.select({
      warehouseId: finishedGoods.warehouseId,
      count: count(),
      totalQty: sql`COALESCE(SUM(${finishedGoods.quantity}), 0)`,
    }).from(finishedGoods).groupBy(finishedGoods.warehouseId);

    return { summary: rows[0], byWarehouse };
  }),
});

// ─── Wastage Router ───
export const wastageRouter = createRouter({
  list: authedQuery
    .input(z.object({
      sourceType: z.string().optional(),
      wastageType: z.string().optional(),
      modelId: z.number().optional(),
      lineId: z.number().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.sourceType) conditions.push(eq(wastageRecords.sourceType, input.sourceType as "cutting" | "sewing" | "ironing" | "finishing" | "qc_reject" | "damage" | "expiry"));
      if (input?.wastageType) conditions.push(eq(wastageRecords.wastageType, input.wastageType as "end_bit" | "defect" | "shrinkage" | "overcut" | "miscut" | "thread_waste" | "oil_stain" | "other"));
      if (input?.modelId) conditions.push(eq(wastageRecords.modelId, input.modelId));
      if (input?.lineId) conditions.push(eq(wastageRecords.lineId, input.lineId));
      if (input?.fromDate) conditions.push(sql`${wastageRecords.wastageDate} >= ${input.fromDate}`);
      if (input?.toDate) conditions.push(sql`${wastageRecords.wastageDate} <= ${input.toDate}`);
      if (input?.status) conditions.push(eq(wastageRecords.status, input.status as "reported" | "under_review" | "approved" | "rejected" | "resolved"));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(wastageRecords).where(where).orderBy(desc(wastageRecords.wastageDate));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select().from(wastageRecords).where(eq(wastageRecords.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: authedQuery
    .input(z.object({
      wastageNumber: z.string(),
      sourceType: z.enum(["cutting", "sewing", "ironing", "finishing", "qc_reject", "damage", "expiry"]),
      sourceId: z.number().optional(),
      modelId: z.number().optional(),
      productionOrderId: z.number().optional(),
      lineId: z.number().optional(),
      itemId: z.number().optional(),
      fabricRollId: z.number().optional(),
      wastageType: z.enum(["end_bit", "defect", "shrinkage", "overcut", "miscut", "thread_waste", "oil_stain", "other"]),
      quantity: z.string(),
      unit: z.string(),
      unitCost: z.string().optional(),
      totalCost: z.string().optional(),
      percentOfInput: z.string().optional(),
      standardPercent: z.string().optional(),
      reason: z.string().optional(),
      correctiveAction: z.string().optional(),
      wastageDate: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Auto-calculate variance and isWithinStandard
      const pct = parseFloat(input.percentOfInput || "0");
      const std = parseFloat(input.standardPercent || "0");
      const variance = std > 0 ? (pct - std).toFixed(2) : null;
      const isWithinStandard = std > 0 ? pct <= std : true;

      const wastageData: any = {
        ...input,
        variance: variance,
        isWithinStandard,
        status: "reported",
      };
      if (input.wastageDate) wastageData.wastageDate = new Date(input.wastageDate);
      const result = await db.insert(wastageRecords).values(wastageData);
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["reported", "under_review", "approved", "rejected", "resolved"]).optional(),
      reason: z.string().optional(),
      correctiveAction: z.string().optional(),
      approvedBy: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(wastageRecords).set(data).where(eq(wastageRecords.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(wastageRecords).where(eq(wastageRecords.id, input.id));
      return { success: true };
    }),

  // Dashboard KPIs
  summary: authedQuery
    .input(z.object({
      fromDate: z.string(),
      toDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select({
        totalRecords: count(),
        totalWastageCost: sql`COALESCE(SUM(${wastageRecords.totalCost}), 0)`,
        totalQuantity: sql`COALESCE(SUM(${wastageRecords.quantity}), 0)`,
        avgPercent: sql`COALESCE(AVG(${wastageRecords.percentOfInput}), 0)`,
        withinStandard: sql`SUM(CASE WHEN ${wastageRecords.isWithinStandard} = 1 THEN 1 ELSE 0 END)`,
        outsideStandard: sql`SUM(CASE WHEN ${wastageRecords.isWithinStandard} = 0 THEN 1 ELSE 0 END)`,
      }).from(wastageRecords)
        .where(and(
          sql`${wastageRecords.wastageDate} >= ${input.fromDate}`,
          sql`${wastageRecords.wastageDate} <= ${input.toDate}`,
        ));

      const bySource = await db.select({
        sourceType: wastageRecords.sourceType,
        count: count(),
        totalCost: sql`COALESCE(SUM(${wastageRecords.totalCost}), 0)`,
      }).from(wastageRecords)
        .where(and(
          sql`${wastageRecords.wastageDate} >= ${input.fromDate}`,
          sql`${wastageRecords.wastageDate} <= ${input.toDate}`,
        ))
        .groupBy(wastageRecords.sourceType);

      return { summary: rows[0], bySource };
    }),
});

// ─── Sales Rep Visits Router ───
export const salesRepVisitRouter = createRouter({
  list: authedQuery
    .input(z.object({
      salesRepId: z.number().optional(),
      customerId: z.number().optional(),
      status: z.string().optional(),
      visitType: z.string().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.salesRepId) conditions.push(eq(salesRepVisits.salesRepId, input.salesRepId));
      if (input?.customerId) conditions.push(eq(salesRepVisits.customerId, input.customerId));
      if (input?.status) conditions.push(eq(salesRepVisits.status, input.status as "planned" | "in_progress" | "completed" | "cancelled" | "no_show"));
      if (input?.visitType) conditions.push(eq(salesRepVisits.visitType, input.visitType as "scheduled" | "unplanned" | "follow_up" | "complaint" | "delivery" | "collection"));
      if (input?.fromDate) conditions.push(sql`${salesRepVisits.scheduledDate} >= ${input.fromDate}`);
      if (input?.toDate) conditions.push(sql`${salesRepVisits.scheduledDate} <= ${input.toDate}`);

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(salesRepVisits).where(where).orderBy(desc(salesRepVisits.scheduledDate));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select().from(salesRepVisits).where(eq(salesRepVisits.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: authedQuery
    .input(z.object({
      visitNumber: z.string(),
      salesRepId: z.number(),
      salesRepName: z.string(),
      customerId: z.number().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerAddress: z.string().optional(),
      customerLocation: z.string().optional(),
      visitType: z.enum(["scheduled", "unplanned", "follow_up", "complaint", "delivery", "collection"]).optional(),
      scheduledDate: z.string(),
      scheduledTime: z.string().optional(),
      purpose: z.string().optional(),
      nextVisitDate: z.string().optional(),
      gpsLatitude: z.string().optional(),
      gpsLongitude: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const visitData: any = {
        ...input,
        status: "planned",
        paymentCollected: "0",
        scheduledDate: new Date(input.scheduledDate),
      };
      if (input.nextVisitDate) visitData.nextVisitDate = new Date(input.nextVisitDate);
      if (input.gpsLatitude) visitData.gpsLatitude = input.gpsLatitude;
      if (input.gpsLongitude) visitData.gpsLongitude = input.gpsLongitude;
      const result = await db.insert(salesRepVisits).values(visitData);
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["planned", "in_progress", "completed", "cancelled", "no_show"]).optional(),
      actualStartTime: z.date().optional(),
      actualEndTime: z.date().optional(),
      outcome: z.string().optional(),
      notes: z.string().optional(),
      gpsLatitude: z.string().optional(),
      gpsLongitude: z.string().optional(),
      photos: z.string().optional(),
      nextVisitDate: z.string().optional(),
      orderTaken: z.boolean().optional(),
      orderAmount: z.string().optional(),
      paymentCollected: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...rawData } = input;
      const data: any = { ...rawData };
      if (data.nextVisitDate) data.nextVisitDate = new Date(data.nextVisitDate);
      await db.update(salesRepVisits).set(data).where(eq(salesRepVisits.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(salesRepVisits).where(eq(salesRepVisits.id, input.id));
      return { success: true };
    }),

  startVisit: authedQuery
    .input(z.object({ id: z.number(), gpsLatitude: z.string().optional(), gpsLongitude: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(salesRepVisits)
        .set({ status: "in_progress", actualStartTime: new Date(), gpsLatitude: input.gpsLatitude, gpsLongitude: input.gpsLongitude })
        .where(eq(salesRepVisits.id, input.id));
      return { success: true };
    }),

  completeVisit: authedQuery
    .input(z.object({
      id: z.number(),
      outcome: z.string(),
      notes: z.string().optional(),
      orderTaken: z.boolean().optional(),
      orderAmount: z.string().optional(),
      paymentCollected: z.string().optional(),
      gpsLatitude: z.string().optional(),
      gpsLongitude: z.string().optional(),
      photos: z.string().optional(),
      customerSignature: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(salesRepVisits)
        .set({ ...data, status: "completed", actualEndTime: new Date() })
        .where(eq(salesRepVisits.id, id));
      return { success: true };
    }),

  // Dashboard KPIs
  summary: authedQuery
    .input(z.object({
      salesRepId: z.number().optional(),
      fromDate: z.string(),
      toDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [
        sql`${salesRepVisits.scheduledDate} >= ${input.fromDate}`,
        sql`${salesRepVisits.scheduledDate} <= ${input.toDate}`,
      ];
      if (input.salesRepId) conditions.push(eq(salesRepVisits.salesRepId, input.salesRepId));

      const rows = await db.select({
        totalVisits: count(),
        completedVisits: sql`SUM(CASE WHEN ${salesRepVisits.status} = 'completed' THEN 1 ELSE 0 END)`,
        cancelledVisits: sql`SUM(CASE WHEN ${salesRepVisits.status} = 'cancelled' THEN 1 ELSE 0 END)`,
        totalOrderAmount: sql`COALESCE(SUM(${salesRepVisits.orderAmount}), 0)`,
        totalPayments: sql`COALESCE(SUM(${salesRepVisits.paymentCollected}), 0)`,
        ordersTaken: sql`SUM(CASE WHEN ${salesRepVisits.orderTaken} = 1 THEN 1 ELSE 0 END)`,
      }).from(salesRepVisits).where(and(...conditions));

      return { summary: rows[0] };
    }),
});

// ─── Sales Rep Orders Router ───
export const salesRepOrderRouter = createRouter({
  list: authedQuery
    .input(z.object({
      salesRepId: z.number().optional(),
      customerId: z.number().optional(),
      status: z.string().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      synced: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.salesRepId) conditions.push(eq(salesRepOrders.salesRepId, input.salesRepId));
      if (input?.customerId) conditions.push(eq(salesRepOrders.customerId, input.customerId));
      if (input?.status) conditions.push(eq(salesRepOrders.status, input.status as "draft" | "submitted" | "approved" | "in_production" | "ready" | "delivered" | "cancelled" | "rejected"));
      if (input?.synced !== undefined) conditions.push(eq(salesRepOrders.syncedToErp, input.synced));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(salesRepOrders).where(where).orderBy(desc(salesRepOrders.createdAt));
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select().from(salesRepOrders).where(eq(salesRepOrders.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  create: authedQuery
    .input(z.object({
      orderNumber: z.string(),
      salesRepId: z.number(),
      salesRepName: z.string(),
      visitId: z.number().optional(),
      customerId: z.number().optional(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      customerAddress: z.string().optional(),
      modelId: z.number().optional(),
      modelName: z.string().optional(),
      color: z.string().optional(),
      size: z.string().optional(),
      quantity: z.number(),
      unitPrice: z.string(),
      totalAmount: z.string(),
      discountPercent: z.string().optional(),
      discountAmount: z.string().optional(),
      vatRate: z.string().optional(),
      vatAmount: z.string().optional(),
      grandTotal: z.string(),
      deliveryDate: z.string().optional(),
      deliveryAddress: z.string().optional(),
      specialInstructions: z.string().optional(),
      paymentTerms: z.string().optional(),
      photos: z.string().optional(),
      customerSignature: z.string().optional(),
      gpsLatitude: z.string().optional(),
      gpsLongitude: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const insertData: any = {
        ...input,
        status: "draft",
        syncedToErp: false,
      };
      if (input.deliveryDate) insertData.deliveryDate = new Date(input.deliveryDate);
      const result = await db.insert(salesRepOrders).values(insertData);
      return { id: Number(result[0].insertId) };
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "submitted", "approved", "in_production", "ready", "delivered", "cancelled", "rejected"]).optional(),
      syncedToErp: z.boolean().optional(),
      erpOrderId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(salesRepOrders).set(data).where(eq(salesRepOrders.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.delete(salesRepOrders).where(eq(salesRepOrders.id, input.id));
      return { success: true };
    }),

  submit: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(salesRepOrders).set({ status: "submitted" }).where(eq(salesRepOrders.id, input.id));
      return { success: true };
    }),

  syncToErp: adminQuery
    .input(z.object({ id: z.number(), erpOrderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(salesRepOrders)
        .set({ syncedToErp: true, erpOrderId: input.erpOrderId, status: "approved" })
        .where(eq(salesRepOrders.id, input.id));
      return { success: true };
    }),
});

