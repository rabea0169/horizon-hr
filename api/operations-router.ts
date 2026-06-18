import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { qcRecords, mrpRecords, challans, subcontracts, bundles, bundleTracking, cuttingOrders, workOrders, shifts, activities, employees, bomRecords, inventoryItems } from "@db/schema";
import { eq, count, desc, sql, and } from "drizzle-orm";

const stageEnum = ["fabric", "cutting", "sewing", "pressing", "packing"] as const;

const stageToDb: Record<string, string> = { fabric: "inline", cutting: "input", sewing: "output", pressing: "final", packing: "packing" };
const stageFromDb: Record<string, string> = { inline: "fabric", input: "cutting", output: "sewing", final: "pressing", packing: "packing" };

export const qcRouter = createRouter({
  list: authedQuery
    .input(z.object({ orderId: z.number().optional(), stage: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.orderId) conditions.push(eq(qcRecords.orderId, input.orderId));
      if (input?.stage) conditions.push(eq(qcRecords.stage, (stageToDb[input.stage] ?? input.stage) as any));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(qcRecords)
        .leftJoin(employees, eq(qcRecords.inspectedBy, employees.id))
        .leftJoin(bundles, eq(qcRecords.bundleId, bundles.id))
        .where(where)
        .orderBy(desc(qcRecords.createdAt));
      return rows.map((r) => mapQcToFrontend(r.qc_records, r.employees, r.bundles));
    }),

  create: adminQuery
    .input(z.object({
      stage: z.enum(stageEnum),
      bundleId: z.number().optional(),
      modelId: z.number().optional(),
      inspectedBy: z.string().optional(),
      date: z.string(),
      checkedQty: z.number(),
      passedQty: z.number(),
      failedQty: z.number(),
      defects: z.any().optional(),
      status: z.enum(["pass", "fail", "rework"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      let inspectedById: number | undefined;
      if (input.inspectedBy) {
        const emp = await db.query.employees.findFirst({ where: eq(employees.fullName, input.inspectedBy) });
        if (emp) inspectedById = emp.id;
      }
      const [result] = await db.insert(qcRecords).values({
        bundleId: input.bundleId,
        stage: (stageToDb[input.stage] ?? input.stage) as any,
        checkedQuantity: input.checkedQty,
        passedQuantity: input.passedQty,
        defectedQuantity: input.failedQty,
        defects: typeof input.defects === "string" ? input.defects : input.defects ? JSON.stringify(input.defects) : undefined,
        inspectedBy: inspectedById,
        date: new Date(input.date),
      }).$returningId();
      const created = await db
        .select()
        .from(qcRecords)
        .leftJoin(employees, eq(qcRecords.inspectedBy, employees.id))
        .leftJoin(bundles, eq(qcRecords.bundleId, bundles.id))
        .where(eq(qcRecords.id, result.id));
      return mapQcToFrontend(created[0]?.qc_records, created[0]?.employees, created[0]?.bundles);
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(),
      stage: z.enum(stageEnum).optional(),
      bundleId: z.number().optional(),
      inspectedBy: z.string().optional(),
      date: z.string().optional(),
      checkedQty: z.number().optional(),
      passedQty: z.number().optional(),
      failedQty: z.number().optional(),
      defects: z.any().optional(),
      status: z.enum(["pass", "fail", "rework"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.stage) updateData.stage = (stageToDb[data.stage] ?? data.stage) as any;
      if (data.bundleId !== undefined) updateData.bundleId = data.bundleId;
      if (data.checkedQty !== undefined) updateData.checkedQuantity = data.checkedQty;
      if (data.passedQty !== undefined) updateData.passedQuantity = data.passedQty;
      if (data.failedQty !== undefined) updateData.defectedQuantity = data.failedQty;
      if (data.defects !== undefined) updateData.defects = typeof data.defects === "string" ? data.defects : JSON.stringify(data.defects);
      if (data.date) updateData.date = new Date(data.date);
      if (data.inspectedBy) {
        const emp = await db.query.employees.findFirst({ where: eq(employees.fullName, data.inspectedBy) });
        if (emp) updateData.inspectedBy = emp.id;
      }
      await db.update(qcRecords).set(updateData).where(eq(qcRecords.id, id));
      const updated = await db
        .select()
        .from(qcRecords)
        .leftJoin(employees, eq(qcRecords.inspectedBy, employees.id))
        .leftJoin(bundles, eq(qcRecords.bundleId, bundles.id))
        .where(eq(qcRecords.id, id));
      return mapQcToFrontend(updated[0]?.qc_records, updated[0]?.employees, updated[0]?.bundles);
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(qcRecords).where(eq(qcRecords.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [total, passed, defected] = await Promise.all([
      db.select({ count: count() }).from(qcRecords),
      db.select({ sum: sql<number>`COALESCE(SUM(${qcRecords.passedQuantity}), 0)` }).from(qcRecords),
      db.select({ sum: sql<number>`COALESCE(SUM(${qcRecords.defectedQuantity}), 0)` }).from(qcRecords),
    ]);
    return { total: total[0].count, passed: passed[0].sum, defected: defected[0].sum };
  }),
});

function mapQcToFrontend(qc: any, emp?: any, bundle?: any) {
  const checked = qc.checkedQuantity ?? 0;
  const passed = qc.passedQuantity ?? 0;
  const failed = qc.defectedQuantity ?? 0;
  const rate = checked > 0 ? ((failed / checked) * 100).toFixed(1) : "0.0";
  let status = "pass";
  if (checked > 0) {
    const passRate = passed / checked;
    status = passRate >= 0.95 ? "pass" : passRate >= 0.8 ? "rework" : "fail";
  }
  return {
    id: qc.id,
    inspectionCode: `QC-${String(qc.id).padStart(4, "0")}`,
    stage: stageFromDb[qc.stage] ?? qc.stage,
    bundleId: qc.bundleId,
    bundleCode: bundle?.bundleCode,
    modelId: qc.orderId,
    modelName: "",
    inspectedBy: emp?.fullName ?? String(qc.inspectedBy ?? ""),
    date: qc.date ? new Date(qc.date).toISOString().split("T")[0] : "",
    checkedQty: checked,
    passedQty: passed,
    failedQty: failed,
    defectRate: rate,
    defects: qc.defects ? JSON.parse(qc.defects) : [],
    status,
    notes: "",
  };
}

export const mrpRouter = createRouter({
  list: authedQuery
    .input(z.object({ productionOrderId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.productionOrderId) {
        return db.query.mrpRecords.findMany({ where: eq(mrpRecords.productionOrderId, input.productionOrderId), with: { item: true }, orderBy: desc(mrpRecords.createdAt) });
      }
      return db.query.mrpRecords.findMany({ with: { item: true }, orderBy: desc(mrpRecords.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      productionOrderId: z.number().optional(),
      materialName: z.string(),
      category: z.string().optional(),
      unit: z.string().optional(),
      requiredQuantity: z.number(),
      availableQuantity: z.number().optional(),
      status: z.enum(["planned", "ordered", "available", "shortage", "sufficient", "low", "critical", "order_needed"]).optional()
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      let item = await db.query.inventoryItems.findFirst({
        where: eq(inventoryItems.name, input.materialName)
      });
      if (!item) {
        const [newInv] = await db.insert(inventoryItems).values({
          sku: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: input.materialName,
          category: input.category || "other",
          unit: input.unit || "قطعة",
          quantity: input.availableQuantity || 0,
          minStock: 10,
          status: "in_stock"
        }).$returningId();
        item = { id: newInv.id } as any;
      }
      
      const prodOrderId = input.productionOrderId || 1;
      const requiredQty = input.requiredQuantity;
      const availableQty = input.availableQuantity ?? 0;
      
      let status: "planned" | "ordered" | "available" | "shortage" = "planned";
      if (input.status) {
        if (input.status === "sufficient" || input.status === "available") status = "available";
        else if (input.status === "critical" || input.status === "shortage") status = "shortage";
        else if (input.status === "low" || input.status === "ordered") status = "ordered";
        else status = "planned";
      } else {
        status = availableQty >= requiredQty ? "available" : "shortage";
      }

      const [result] = await db.insert(mrpRecords).values({
        productionOrderId: prodOrderId,
        itemId: item!.id,
        requiredQuantity: requiredQty,
        availableQuantity: availableQty,
        shortage: Math.max(0, requiredQty - availableQty),
        status
      }).$returningId();
      
      return db.query.mrpRecords.findFirst({ where: eq(mrpRecords.id, result.id), with: { item: true } });
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(),
      materialName: z.string().optional(),
      category: z.string().optional(),
      unit: z.string().optional(),
      availableQuantity: z.number().optional(),
      requiredQuantity: z.number().optional(),
      status: z.enum(["planned", "ordered", "available", "shortage", "sufficient", "low", "critical", "order_needed"]).optional()
    }))
    .mutation(async ({ input }) => {
      const { id, materialName, category, unit, ...data } = input;
      const db = getDb();
      
      const mrpRec = await db.query.mrpRecords.findFirst({ where: eq(mrpRecords.id, id), with: { item: true } });
      if (!mrpRec) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "سجل تخطيط الاحتياجات غير موجود / MRP record not found",
        });
      }
      
      if (mrpRec.item && (materialName || category || unit)) {
        await db.update(inventoryItems).set({
          name: materialName || undefined,
          category: category || undefined,
          unit: unit || undefined
        }).where(eq(inventoryItems.id, mrpRec.itemId));
      }
      
      const updateData: Record<string, unknown> = {};
      if (data.availableQuantity !== undefined) {
        updateData.availableQuantity = data.availableQuantity;
        updateData.shortage = Math.max(0, (data.requiredQuantity ?? mrpRec.requiredQuantity) - data.availableQuantity);
      }
      if (data.requiredQuantity !== undefined) {
        updateData.requiredQuantity = data.requiredQuantity;
        updateData.shortage = Math.max(0, data.requiredQuantity - (data.availableQuantity ?? mrpRec.availableQuantity ?? 0));
      }
      if (data.status) {
        let status: "planned" | "ordered" | "available" | "shortage" = "planned";
        if (data.status === "sufficient" || data.status === "available") status = "available";
        else if (data.status === "critical" || data.status === "shortage") status = "shortage";
        else if (data.status === "low" || data.status === "ordered") status = "ordered";
        else status = "planned";
        updateData.status = status;
      }
      
      if (Object.keys(updateData).length > 0) {
        await db.update(mrpRecords).set(updateData).where(eq(mrpRecords.id, id));
      }
      
      return db.query.mrpRecords.findFirst({ where: eq(mrpRecords.id, id), with: { item: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(mrpRecords).where(eq(mrpRecords.id, input.id));
      return { success: true };
    }),
});

export const challanRouter = createRouter({
  list: authedQuery
    .input(z.object({ status: z.string().optional(), type: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(challans.status, input.status as "draft" | "ready" | "shipped" | "delivered" | "returned"));
      if (input?.type) conditions.push(eq(challans.type, input.type as "dispatch" | "return"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.challans.findMany({ where, with: { items: true }, orderBy: desc(challans.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ challanNumber: z.string().min(1), type: z.enum(["dispatch", "return"]).default("dispatch"), customerName: z.string().optional(), orderId: z.number().optional(), vehicleNumber: z.string().optional(), driverName: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(challans).values(input).$returningId();
      return db.query.challans.findFirst({ where: eq(challans.id, result.id), with: { items: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["draft", "ready", "shipped", "delivered", "returned"]).optional(), shippedAt: z.string().optional(), deliveredAt: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, shippedAt, deliveredAt, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (shippedAt !== undefined) updateData.shippedAt = shippedAt ? new Date(shippedAt) : null;
      if (deliveredAt !== undefined) updateData.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
      await db.update(challans).set(updateData).where(eq(challans.id, id));
      return db.query.challans.findFirst({ where: eq(challans.id, id), with: { items: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(challans).where(eq(challans.id, input.id));
      return { success: true };
    }),
});

export const subcontractRouter = createRouter({
  list: authedQuery
    .input(z.object({ supplierId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.supplierId) conditions.push(eq(subcontracts.supplierId, input.supplierId));
      if (input?.status) conditions.push(eq(subcontracts.status, input.status as "pending" | "in_progress" | "completed" | "cancelled"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.subcontracts.findMany({ where, with: { supplier: true, model: true }, orderBy: desc(subcontracts.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ contractNumber: z.string().min(1), supplierId: z.number(), modelId: z.number().optional(), description: z.string().optional(), quantity: z.number(), unitPrice: z.string().optional(), totalAmount: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = { ...input };
      if (input.unitPrice) data.unitPrice = parseFloat(input.unitPrice);
      if (input.totalAmount) data.totalAmount = parseFloat(input.totalAmount);
      if (input.startDate) data.startDate = new Date(input.startDate);
      if (input.endDate) data.endDate = new Date(input.endDate);
      const [result] = await db.insert(subcontracts).values(data as any).$returningId();
      return db.query.subcontracts.findFirst({ where: eq(subcontracts.id, result.id), with: { supplier: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(), receivedQuantity: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(subcontracts).set(data).where(eq(subcontracts.id, id));
      return db.query.subcontracts.findFirst({ where: eq(subcontracts.id, id), with: { supplier: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(subcontracts).where(eq(subcontracts.id, input.id));
      return { success: true };
    }),
});

export const bundleRouter = createRouter({
  list: authedQuery
    .input(z.object({ workOrderId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.workOrderId) conditions.push(eq(bundles.workOrderId, input.workOrderId));
      if (input?.status) conditions.push(eq(bundles.status, input.status as "cutting" | "sewing" | "ironing" | "qc" | "packed" | "shipped"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.bundles.findMany({ where, with: { model: true, line: true, tracking: true }, orderBy: desc(bundles.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ bundleCode: z.string().min(1), modelId: z.number(), workOrderId: z.number().optional(), size: z.string().optional(), color: z.string().optional(), quantity: z.number(), qrCode: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(bundles).values(input).$returningId();
      return db.query.bundles.findFirst({ where: eq(bundles.id, result.id) });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["cutting", "sewing", "ironing", "qc", "packed", "shipped"]).optional(), currentStage: z.string().optional(), currentLineId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(bundles).set(data).where(eq(bundles.id, id));
      return db.query.bundles.findFirst({ where: eq(bundles.id, id) });
    }),

  scan: adminQuery
    .input(z.object({ bundleId: z.number(), stage: z.string(), lineId: z.number().optional(), employeeId: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(bundleTracking).values(input);
      await db.update(bundles).set({ currentStage: input.stage, currentLineId: input.lineId }).where(eq(bundles.id, input.bundleId));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(bundles).where(eq(bundles.id, input.id));
      return { success: true };
    }),
});

export const cuttingOrderRouter = createRouter({
  list: authedQuery
    .input(z.object({ modelId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.modelId) conditions.push(eq(cuttingOrders.modelId, input.modelId));
      if (input?.status) conditions.push(eq(cuttingOrders.status, input.status as "pending" | "cutting" | "completed" | "cancelled"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.cuttingOrders.findMany({ where, with: { model: true }, orderBy: desc(cuttingOrders.createdAt) });
    }),

  create: adminQuery
    .input(z.object({ orderNumber: z.string().min(1), modelId: z.number(), fabricDescription: z.string().optional(), color: z.string().optional(), size: z.string().optional(), quantity: z.number(), assignedTo: z.number().optional(), dueDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, dueDate: input.dueDate ? new Date(input.dueDate) : null };
      const [result] = await db.insert(cuttingOrders).values(data).$returningId();
      return db.query.cuttingOrders.findFirst({ where: eq(cuttingOrders.id, result.id), with: { model: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "cutting", "completed", "cancelled"]).optional(), cutQuantity: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(cuttingOrders).set(data).where(eq(cuttingOrders.id, id));
      return db.query.cuttingOrders.findFirst({ where: eq(cuttingOrders.id, id), with: { model: true } });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(cuttingOrders).where(eq(cuttingOrders.id, input.id));
      return { success: true };
    }),
});

export const workOrderRouter = createRouter({
  list: authedQuery
    .input(z.object({ productionOrderId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.productionOrderId) conditions.push(eq(workOrders.productionOrderId, input.productionOrderId));
      if (input?.status) conditions.push(eq(workOrders.status, input.status as "pending" | "in_progress" | "completed" | "cancelled"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      const rows = await db.query.workOrders.findMany({
        where,
        with: {
          model: {
            with: {
              stages: true
            }
          },
          line: true
        },
        orderBy: desc(workOrders.createdAt)
      });
      
      return rows.map((row) => {
        const completedStageIds = row.completedStages ? row.completedStages.split(",").filter(Boolean).map(Number) : [];
        const stages = row.model?.stages?.map((stage) => ({
          id: stage.id,
          name: stage.name,
          completed: completedStageIds.includes(stage.id),
        })) ?? [];
        
        return {
          id: row.id,
          orderCode: row.orderNumber,
          modelId: row.modelId,
          modelName: row.model?.name ?? "",
          bomId: undefined,
          productionOrderId: row.productionOrderId,
          lineId: row.lineId,
          lineName: row.line?.name ?? "",
          quantity: row.quantity,
          startDate: row.startDate ? new Date(row.startDate).toISOString().split("T")[0] : "",
          endDate: row.endDate ? new Date(row.endDate).toISOString().split("T")[0] : "",
          priority: row.priority,
          status: row.status,
          stages,
          notes: "",
        };
      });
    }),

  create: adminQuery
    .input(z.object({ orderNumber: z.string().min(1), productionOrderId: z.number().optional(), modelId: z.number(), lineId: z.number().optional(), quantity: z.number(), priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"), startDate: z.string().optional(), endDate: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, startDate: input.startDate ? new Date(input.startDate) : null, endDate: input.endDate ? new Date(input.endDate) : null };
      const [result] = await db.insert(workOrders).values(data).$returningId();
      return db.query.workOrders.findFirst({ where: eq(workOrders.id, result.id), with: { model: true, line: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(), completed: z.number().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(workOrders).set(data).where(eq(workOrders.id, id));
      return db.query.workOrders.findFirst({ where: eq(workOrders.id, id), with: { model: true } });
    }),

  toggleStage: adminQuery
    .input(z.object({ workOrderId: z.number(), stageId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const wo = await db.query.workOrders.findFirst({ where: eq(workOrders.id, input.workOrderId) });
      if (!wo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "أمر التشغيل غير موجود / Work order not found",
        });
      }
      
      const currentCompleted = wo.completedStages ? wo.completedStages.split(",").filter(Boolean).map(Number) : [];
      const index = currentCompleted.indexOf(input.stageId);
      if (index > -1) {
        currentCompleted.splice(index, 1);
      } else {
        currentCompleted.push(input.stageId);
      }
      
      await db.update(workOrders).set({
        completedStages: currentCompleted.join(",")
      }).where(eq(workOrders.id, input.workOrderId));
      
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(workOrders).where(eq(workOrders.id, input.id));
      return { success: true };
    }),
});

export const shiftRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().query.shifts.findMany({ orderBy: desc(shifts.createdAt) });
  }),

  create: adminQuery
    .input(z.object({ name: z.string().min(1), startTime: z.string(), endTime: z.string(), daysOfWeek: z.string(), gracePeriod: z.number().default(15) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(shifts).values(input).$returningId();
      return db.query.shifts.findFirst({ where: eq(shifts.id, result.id) });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), status: z.enum(["active", "inactive"]).optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(shifts).set(data).where(eq(shifts.id, id));
      return db.query.shifts.findFirst({ where: eq(shifts.id, id) });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(shifts).where(eq(shifts.id, input.id));
      return { success: true };
    }),
});

export const auditRouter = createRouter({
  list: adminQuery
    .input(z.object({ entityType: z.string().optional(), limit: z.number().default(100) }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 100;
      if (input?.entityType) {
        return db.select().from(activities).where(eq(activities.entityType, input.entityType)).orderBy(desc(activities.createdAt)).limit(limit);
      }
      return db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
    }),

  create: authedQuery
    .input(z.object({ action: z.string(), entityType: z.string(), entityId: z.number().optional(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userName = ctx.user?.name || "Unknown";
      const userId = ctx.user?.id ? parseInt(String(ctx.user.id)) : undefined;
      await db.insert(activities).values({ ...input, userId, userName });
      return { success: true };
    }),
});

export const bomRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    const rows = await db.query.bomRecords.findMany({
      with: {
        model: true,
        item: true
      }
    });

    const groups: Record<number, {
      id: number;
      modelId: number;
      modelName: string;
      modelCode: string;
      items: any[];
      totalMaterialCost: number;
      updatedAt: Date;
    }> = {};

    for (const row of rows) {
      if (!row.model) continue;
      const modelId = row.modelId;
      if (!groups[modelId]) {
        groups[modelId] = {
          id: modelId,
          modelId: modelId,
          modelName: row.model.name,
          modelCode: row.model.modelCode,
          items: [],
          totalMaterialCost: 0,
          updatedAt: row.createdAt ?? new Date()
        };
      }
      
      const qty = parseFloat(String(row.quantity)) || 0;
      const price = parseFloat(row.item?.unitCost ?? "0") || 0;
      const total = qty * price;
      
      groups[modelId].items.push({
        id: row.id,
        materialName: row.item?.name ?? "Unknown Material",
        category: row.item?.category ?? "other",
        quantity: qty,
        unit: row.unit,
        unitPrice: String(price),
        total: String(total),
        notes: row.notes ?? ""
      });
      
      groups[modelId].totalMaterialCost += total;
      if (row.createdAt && row.createdAt > groups[modelId].updatedAt) {
        groups[modelId].updatedAt = row.createdAt;
      }
    }

    return Object.values(groups).map(g => ({
      ...g,
      totalMaterialCost: String(g.totalMaterialCost),
      updatedAt: g.updatedAt.toISOString()
    }));
  }),

  create: adminQuery
    .input(z.object({
      modelId: z.number(),
      items: z.array(z.object({
        materialName: z.string(),
        category: z.string(),
        quantity: z.number(),
        unit: z.string(),
        unitPrice: z.string().optional(),
        notes: z.string().optional()
      }))
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(bomRecords).where(eq(bomRecords.modelId, input.modelId));
      
      for (const item of input.items) {
        let invItem = await db.query.inventoryItems.findFirst({
          where: eq(inventoryItems.name, item.materialName)
        });
        
        if (!invItem) {
          const [newInv] = await db.insert(inventoryItems).values({
            sku: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: item.materialName,
            category: item.category,
            unit: item.unit,
            quantity: 100,
            unitCost: item.unitPrice ?? "0",
            status: "in_stock"
          }).$returningId();
          invItem = { id: newInv.id } as any;
        }
        
        await db.insert(bomRecords).values({
          modelId: input.modelId,
          itemId: invItem!.id,
          quantity: String(item.quantity),
          unit: item.unit,
          notes: item.notes ?? ""
        });
      }
      return { success: true };
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(),
      modelId: z.number(),
      items: z.array(z.object({
        materialName: z.string(),
        category: z.string(),
        quantity: z.number(),
        unit: z.string(),
        unitPrice: z.string().optional(),
        notes: z.string().optional()
      }))
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const modelId = input.modelId || input.id;
      await db.delete(bomRecords).where(eq(bomRecords.modelId, modelId));
      
      for (const item of input.items) {
        let invItem = await db.query.inventoryItems.findFirst({
          where: eq(inventoryItems.name, item.materialName)
        });
        
        if (!invItem) {
          const [newInv] = await db.insert(inventoryItems).values({
            sku: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: item.materialName,
            category: item.category,
            unit: item.unit,
            quantity: 100,
            unitCost: item.unitPrice ?? "0",
            status: "in_stock"
          }).$returningId();
          invItem = { id: newInv.id } as any;
        }
        
        await db.insert(bomRecords).values({
          modelId,
          itemId: invItem!.id,
          quantity: String(item.quantity),
          unit: item.unit,
          notes: item.notes ?? ""
        });
      }
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(bomRecords).where(eq(bomRecords.modelId, input.id));
      return { success: true };
    })
});


