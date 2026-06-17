import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  styleColorSizeMatrix, fabricRolls, cutPlans, markerPlans,
  samRecords, lineBalancing, warehouses, warehouseBins, reorderRules,
} from "@db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

// ─── Style-Color-Size Matrix Router ───
export const matrixRouter = createRouter({
  list: authedQuery
    .input(z.object({ modelId: z.number().optional(), color: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.modelId) conditions.push(eq(styleColorSizeMatrix.modelId, input.modelId));
      if (input?.color) conditions.push(eq(styleColorSizeMatrix.color, input.color));
      if (input?.status) conditions.push(eq(styleColorSizeMatrix.status, input.status as "active" | "inactive" | "discontinued"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.styleColorSizeMatrix.findMany({ where, with: { model: true }, orderBy: desc(styleColorSizeMatrix.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      modelId: z.number(), styleCode: z.string().min(1), color: z.string().min(1),
      colorCode: z.string().optional(), size: z.string().min(1), sizeOrder: z.number().optional(),
      quantity: z.number().optional(), unitPrice: z.string().optional(), barcode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = { ...input };
      if (input.unitPrice) data.unitPrice = parseFloat(input.unitPrice);
      const [result] = await db.insert(styleColorSizeMatrix).values(data as any).$returningId();
      return db.query.styleColorSizeMatrix.findFirst({ where: eq(styleColorSizeMatrix.id, result.id), with: { model: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), quantity: z.number().optional(), unitPrice: z.string().optional(), status: z.enum(["active", "inactive", "discontinued"]).optional() }))
    .mutation(async ({ input }) => {
      const { id, unitPrice, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice);
      await db.update(styleColorSizeMatrix).set(updateData).where(eq(styleColorSizeMatrix.id, id));
      return db.query.styleColorSizeMatrix.findFirst({ where: eq(styleColorSizeMatrix.id, id), with: { model: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(styleColorSizeMatrix).where(eq(styleColorSizeMatrix.id, input.id));
      return { success: true };
    }),
});

// ─── Fabric Roll Router ───
export const fabricRollRouter = createRouter({
  list: authedQuery
    .input(z.object({ supplierId: z.number().optional(), lotNumber: z.string().optional(), status: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.supplierId) conditions.push(eq(fabricRolls.supplierId, input.supplierId));
      if (input?.lotNumber) conditions.push(eq(fabricRolls.lotNumber, input.lotNumber));
      if (input?.status) conditions.push(eq(fabricRolls.status, input.status as "available" | "in_use" | "finished" | "rejected" | "quarantine"));
      if (input?.search) conditions.push(sql`${fabricRolls.rollNumber} LIKE ${"%" + input.search + "%"} OR ${fabricRolls.fabricType} LIKE ${"%" + input.search + "%"}`);
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.fabricRolls.findMany({ where, with: { supplier: true }, orderBy: desc(fabricRolls.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      rollNumber: z.string().min(1), lotNumber: z.string().min(1), supplierId: z.number(),
      fabricType: z.string().min(1), fabricCode: z.string().optional(), color: z.string().optional(),
      width: z.string().optional(), length: z.string().optional(), weight: z.string().optional(),
      shrinkagePercent: z.string().optional(), shade: z.string().optional(),
      receivedDate: z.string(), location: z.string().optional(), qualityGrade: z.enum(["a", "b", "c"]).optional(),
      inspectionNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = { ...input, receivedDate: new Date(input.receivedDate) };
      if (input.width) data.width = parseFloat(input.width);
      if (input.length) data.length = parseFloat(input.length);
      if (input.weight) data.weight = parseFloat(input.weight);
      if (input.shrinkagePercent) data.shrinkagePercent = parseFloat(input.shrinkagePercent);
      const [result] = await db.insert(fabricRolls).values(data as any).$returningId();
      return db.query.fabricRolls.findFirst({ where: eq(fabricRolls.id, result.id), with: { supplier: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["available", "in_use", "finished", "rejected", "quarantine"]).optional(), length: z.string().optional(), location: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, length, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (length !== undefined) updateData.length = parseFloat(length);
      await db.update(fabricRolls).set(updateData).where(eq(fabricRolls.id, id));
      return db.query.fabricRolls.findFirst({ where: eq(fabricRolls.id, id), with: { supplier: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(fabricRolls).where(eq(fabricRolls.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, available, inUse, rejected] = await Promise.all([
      db.select({ count: count() }).from(fabricRolls),
      db.select({ count: count() }).from(fabricRolls).where(eq(fabricRolls.status, "available")),
      db.select({ count: count() }).from(fabricRolls).where(eq(fabricRolls.status, "in_use")),
      db.select({ count: count() }).from(fabricRolls).where(eq(fabricRolls.status, "rejected")),
    ]);
    return { total: total[0].count, available: available[0].count, inUse: inUse[0].count, rejected: rejected[0].count };
  }),
});

// ─── Cut Plan Router ───
export const cutPlanRouter = createRouter({
  list: authedQuery
    .input(z.object({ orderId: z.number().optional(), modelId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.orderId) conditions.push(eq(cutPlans.orderId, input.orderId));
      if (input?.modelId) conditions.push(eq(cutPlans.modelId, input.modelId));
      if (input?.status) conditions.push(eq(cutPlans.status, input.status as "planned" | "spreading" | "cutting" | "completed" | "cancelled"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.cutPlans.findMany({ where, with: { model: true, order: true, markers: true }, orderBy: desc(cutPlans.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      planNumber: z.string().min(1), orderId: z.number(), modelId: z.number(),
      layCount: z.number().optional(), plyHeight: z.number().optional(),
      spreadType: z.enum(["face_up", "face_down", "nap", "tubular"]).optional(),
      totalPieces: z.number().optional(), plannedDate: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, plannedDate: input.plannedDate ? new Date(input.plannedDate) : null };
      const [result] = await db.insert(cutPlans).values(data).$returningId();
      return db.query.cutPlans.findFirst({ where: eq(cutPlans.id, result.id), with: { model: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["planned", "spreading", "cutting", "completed", "cancelled"]).optional(), totalPieces: z.number().optional(), efficiency: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, efficiency, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (efficiency !== undefined) updateData.efficiency = parseFloat(efficiency);
      if (data.status === "completed") updateData.completedDate = new Date();
      await db.update(cutPlans).set(updateData).where(eq(cutPlans.id, id));
      return db.query.cutPlans.findFirst({ where: eq(cutPlans.id, id), with: { model: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(cutPlans).where(eq(cutPlans.id, input.id));
      return { success: true };
    }),
});

// ─── Marker Plan Router ───
export const markerPlanRouter = createRouter({
  list: authedQuery
    .input(z.object({ cutPlanId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.cutPlanId) {
        return db.query.markerPlans.findMany({ where: eq(markerPlans.cutPlanId, input.cutPlanId), with: { model: true }, orderBy: desc(markerPlans.createdAt) });
      }
      return db.query.markerPlans.findMany({ with: { model: true }, orderBy: desc(markerPlans.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      markerNumber: z.string().min(1), cutPlanId: z.number(), modelId: z.number(),
      markerLength: z.string().optional(), markerWidth: z.string().optional(),
      fabricUtilization: z.string().optional(), piecesPerMarker: z.number().optional(),
      sizeRatio: z.string().optional(), markerImage: z.string().optional(), cadFile: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = { ...input };
      if (input.markerLength) data.markerLength = parseFloat(input.markerLength);
      if (input.markerWidth) data.markerWidth = parseFloat(input.markerWidth);
      if (input.fabricUtilization) data.fabricUtilization = parseFloat(input.fabricUtilization);
      const [result] = await db.insert(markerPlans).values(data as any).$returningId();
      return db.query.markerPlans.findFirst({ where: eq(markerPlans.id, result.id), with: { model: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["draft", "approved", "in_use", "archived"]).optional(), fabricUtilization: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, fabricUtilization, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (fabricUtilization !== undefined) updateData.fabricUtilization = parseFloat(fabricUtilization);
      await db.update(markerPlans).set(updateData).where(eq(markerPlans.id, id));
      return db.query.markerPlans.findFirst({ where: eq(markerPlans.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(markerPlans).where(eq(markerPlans.id, input.id));
      return { success: true };
    }),
});

// ─── SAM Router ───
export const samRouter = createRouter({
  list: authedQuery
    .input(z.object({ modelId: z.number().optional(), stageId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.modelId) conditions.push(eq(samRecords.modelId, input.modelId));
      if (input?.stageId) conditions.push(eq(samRecords.stageId, input.stageId));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.samRecords.findMany({ where, with: { model: true, stage: true }, orderBy: desc(samRecords.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      modelId: z.number(), operationName: z.string().min(1), operationCode: z.string().optional(),
      stageId: z.number().optional(), samMinutes: z.string(), machineType: z.string().optional(),
      difficulty: z.enum(["low", "medium", "high"]).optional(), allowancePercent: z.string().optional(),
      targetPerHour: z.number().optional(), effectiveSam: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = { ...input, samMinutes: parseFloat(input.samMinutes) };
      if (input.allowancePercent) data.allowancePercent = parseFloat(input.allowancePercent);
      if (input.effectiveSam) data.effectiveSam = parseFloat(input.effectiveSam);
      const [result] = await db.insert(samRecords).values(data as any).$returningId();
      return db.query.samRecords.findFirst({ where: eq(samRecords.id, result.id), with: { model: true, stage: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(samRecords).where(eq(samRecords.id, input.id));
      return { success: true };
    }),

  stats: authedQuery
    .input(z.object({ modelId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const records = await db.select().from(samRecords).where(eq(samRecords.modelId, input.modelId));
      const totalSam = records.reduce((sum, r) => sum + parseFloat(r.samMinutes as unknown as string), 0);
      const avgEfficiency = records.length > 0 ? records.reduce((sum, r) => sum + (r.targetPerHour || 0), 0) / records.length : 0;
      return { totalOperations: records.length, totalSamMinutes: totalSam.toFixed(3), avgTargetPerHour: Math.round(avgEfficiency) };
    }),
});

// ─── Line Balancing Router ───
export const lineBalancingRouter = createRouter({
  list: authedQuery
    .input(z.object({ lineId: z.number().optional(), modelId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.lineId) conditions.push(eq(lineBalancing.lineId, input.lineId));
      if (input?.modelId) conditions.push(eq(lineBalancing.modelId, input.modelId));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.lineBalancing.findMany({ where, with: { line: true, model: true }, orderBy: lineBalancing.operationSequence });
    }),

  create: adminQuery
    .input(z.object({
      lineId: z.number(), modelId: z.number(), operationSequence: z.number(),
      operationName: z.string().min(1), samMinutes: z.string(), workstations: z.number().optional(),
      operators: z.number().optional(), targetOutput: z.number().optional(), bottleneck: z.boolean().optional(),
      cycleTime: z.string().optional(), taktTime: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = { ...input, samMinutes: parseFloat(input.samMinutes) };
      if (input.cycleTime) data.cycleTime = parseFloat(input.cycleTime);
      if (input.taktTime) data.taktTime = parseFloat(input.taktTime);
      const [result] = await db.insert(lineBalancing).values(data as any).$returningId();
      return db.query.lineBalancing.findFirst({ where: eq(lineBalancing.id, result.id), with: { line: true, model: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), actualOutput: z.number().optional(), efficiency: z.string().optional(), bottleneck: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { id, efficiency, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (efficiency !== undefined) updateData.efficiency = parseFloat(efficiency);
      await db.update(lineBalancing).set(updateData).where(eq(lineBalancing.id, id));
      return db.query.lineBalancing.findFirst({ where: eq(lineBalancing.id, id), with: { line: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(lineBalancing).where(eq(lineBalancing.id, input.id));
      return { success: true };
    }),
});

// ─── Warehouse Router ───
export const warehouseRouter = createRouter({
  list: authedQuery
    .input(z.object({ type: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.type) conditions.push(eq(warehouses.type, input.type as "raw_material" | "finished_goods" | "work_in_progress" | "rejected" | "quarantine"));
      if (input?.status) conditions.push(eq(warehouses.status, input.status as "active" | "inactive"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.warehouses.findMany({ where, with: { bins: true }, orderBy: desc(warehouses.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ code: z.string().min(1), name: z.string().min(1), type: z.enum(["raw_material", "finished_goods", "work_in_progress", "rejected", "quarantine"]).optional(), address: z.string().optional(), managerName: z.string().optional(), phone: z.string().optional(), isDefault: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(warehouses).values(input as any).$returningId();
      return db.query.warehouses.findFirst({ where: eq(warehouses.id, result.id), with: { bins: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), status: z.enum(["active", "inactive"]).optional(), managerName: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(warehouses).set(data).where(eq(warehouses.id, id));
      return db.query.warehouses.findFirst({ where: eq(warehouses.id, id), with: { bins: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(warehouses).where(eq(warehouses.id, input.id));
      return { success: true };
    }),
});

// ─── Warehouse Bin Router ───
export const warehouseBinRouter = createRouter({
  list: authedQuery
    .input(z.object({ warehouseId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.warehouseId) conditions.push(eq(warehouseBins.warehouseId, input.warehouseId));
      if (input?.status) conditions.push(eq(warehouseBins.status, input.status as "empty" | "partial" | "full" | "reserved"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.warehouseBins.findMany({ where, with: { warehouse: true, item: true } });
    }),

  create: adminQuery
    .input(z.object({ warehouseId: z.number(), binCode: z.string().min(1), aisle: z.string().optional(), rack: z.string().optional(), shelf: z.string().optional(), capacity: z.number().optional(), itemId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(warehouseBins).values(input).$returningId();
      return db.query.warehouseBins.findFirst({ where: eq(warehouseBins.id, result.id), with: { warehouse: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), currentQty: z.number().optional(), itemId: z.number().optional(), status: z.enum(["empty", "partial", "full", "reserved"]).optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(warehouseBins).set(data).where(eq(warehouseBins.id, id));
      return db.query.warehouseBins.findFirst({ where: eq(warehouseBins.id, id), with: { warehouse: true, item: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(warehouseBins).where(eq(warehouseBins.id, input.id));
      return { success: true };
    }),
});

// ─── Reorder Rule Router ───
export const reorderRuleRouter = createRouter({
  list: authedQuery
    .input(z.object({ itemId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.itemId) conditions.push(eq(reorderRules.itemId, input.itemId));
      if (input?.status) conditions.push(eq(reorderRules.status, input.status as "active" | "inactive" | "triggered"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.reorderRules.findMany({ where, with: { item: true, warehouse: true, supplier: true }, orderBy: desc(reorderRules.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      itemId: z.number(), warehouseId: z.number().optional(), supplierId: z.number().optional(),
      minStock: z.number().optional(), maxStock: z.number().optional(), reorderPoint: z.number().optional(),
      reorderQty: z.number().optional(), safetyStock: z.number().optional(), leadTimeDays: z.number().optional(),
      autoReorder: z.boolean().optional(), notificationEmail: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(reorderRules).values(input as any).$returningId();
      return db.query.reorderRules.findFirst({ where: eq(reorderRules.id, result.id), with: { item: true, supplier: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), minStock: z.number().optional(), reorderPoint: z.number().optional(), autoReorder: z.boolean().optional(), status: z.enum(["active", "inactive", "triggered"]).optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(reorderRules).set(data).where(eq(reorderRules.id, id));
      return db.query.reorderRules.findFirst({ where: eq(reorderRules.id, id), with: { item: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(reorderRules).where(eq(reorderRules.id, input.id));
      return { success: true };
    }),

  checkStock: authedQuery.query(async () => {
    const db = getDb();
    const rules = await db.query.reorderRules.findMany({ where: eq(reorderRules.status, "active"), with: { item: true } });
    const triggered = rules.filter((r) => r.item && (r.item.quantity || 0) <= (r.reorderPoint || 0));
    return { totalRules: rules.length, triggered: triggered.length, triggeredItems: triggered.map((t) => ({ id: t.id, itemName: t.item?.name, currentQty: t.item?.quantity, reorderPoint: t.reorderPoint })) };
  }),
});


