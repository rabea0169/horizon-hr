import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { createRouter, authedQuery, adminQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  productLifecycle, techPacks, designRevisions, sampleReviews,
  customReports, reportTemplates, buyerPortalUsers, productionForecasts,
  auditLog, employees, attendance, productionOrders, dailyProduction,
  machines, inventoryItems, salesOrders, crmCustomers,
  leaves, advances, pieceRateRecords, payrollRecords, qcRecords,
  InsertAttendance, InsertAdvance, InsertProductLifecycle,
} from "@db/schema";
import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";

const PORTAL_SESSIONS = new Map<string, { employeeId: number; customerId: number | null; type: "employee" | "buyer"; expiresAt: number }>();

function generatePortalToken(employeeId: number, customerId: number | null, type: "employee" | "buyer"): string {
  const token = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("");
  PORTAL_SESSIONS.set(token, { employeeId, customerId, type, expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
  return token;
}

function validatePortalToken(token: string, type: "employee" | "buyer"): { employeeId: number; customerId: number | null } | null {
  const session = PORTAL_SESSIONS.get(token);
  if (!session || session.type !== type || session.expiresAt < Date.now()) {
    PORTAL_SESSIONS.delete(token);
    return null;
  }
  return { employeeId: session.employeeId, customerId: session.customerId };
}

// ─── PLM Router ───
export const plmRouter = createRouter({
  // Product Lifecycle
  lifecycleList: authedQuery
    .input(z.object({ modelId: z.number().optional(), stage: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.modelId) conditions.push(eq(productLifecycle.modelId, input.modelId));
      if (input?.stage) conditions.push(eq(productLifecycle.stage, input.stage as "concept" | "design" | "tech_pack" | "sampling" | "costing" | "buyer_approval" | "bulk_fabric" | "cutting" | "production" | "finishing" | "qc_final" | "packing" | "shipped" | "delivered"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.productLifecycle.findMany({ where, with: { model: true, assignee: true }, orderBy: [productLifecycle.stageOrder] });
    }),

  lifecycleCreate: adminQuery
    .input(z.object({
      modelId: z.number(), stage: z.enum([
        "concept", "design", "tech_pack", "sampling", "costing",
        "buyer_approval", "bulk_fabric", "cutting", "production",
        "finishing", "qc_final", "packing", "shipped", "delivered",
      ]), stageOrder: z.number(), assignedTo: z.number().optional(),
      startDate: z.string().optional(), targetDate: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, startDate: input.startDate ? new Date(input.startDate) : null, targetDate: input.targetDate ? new Date(input.targetDate) : null };
      const [result] = await db.insert(productLifecycle).values(data).$returningId();
      return db.query.productLifecycle.findFirst({ where: eq(productLifecycle.id, result.id), with: { model: true } });
    }),

  lifecycleUpdate: adminQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "in_progress", "completed", "skipped", "blocked"]).optional(),
      completedDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, completedDate, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (completedDate !== undefined) updateData.completedDate = completedDate ? new Date(completedDate) : null;
      if (data.status === "completed") updateData.completedDate = new Date();
      await db.update(productLifecycle).set(updateData).where(eq(productLifecycle.id, id));
      return db.query.productLifecycle.findFirst({ where: eq(productLifecycle.id, id), with: { model: true } });
    }),

  lifecycleDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(productLifecycle).where(eq(productLifecycle.id, input.id));
      return { success: true };
    }),

  lifecycleStats: authedQuery
    .input(z.object({ modelId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const stages = await db.select().from(productLifecycle).where(eq(productLifecycle.modelId, input.modelId));
      const total = stages.length;
      const completed = stages.filter((s) => s.status === "completed").length;
      const inProgress = stages.filter((s) => s.status === "in_progress").length;
      const blocked = stages.filter((s) => s.status === "blocked").length;
      return { total, completed, inProgress, blocked, progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }),

  // Tech Packs
  techPackList: authedQuery
    .input(z.object({ modelId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.modelId) conditions.push(eq(techPacks.modelId, input.modelId));
      if (input?.status) conditions.push(eq(techPacks.status, input.status as "draft" | "review" | "approved" | "rejected" | "revision_needed"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.techPacks.findMany({ where, with: { model: true, revisions: true, samples: true }, orderBy: desc(techPacks.createdAt) });
    }),

  techPackCreate: adminQuery
    .input(z.object({
      modelId: z.number(), packNumber: z.string().min(1), version: z.string().optional(),
      description: z.string().optional(), fabricSpecs: z.string().optional(),
      trimSpecs: z.string().optional(), measurementChart: z.string().optional(),
      constructionDetails: z.string().optional(), sketchImages: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(techPacks).values(input).$returningId();
      return db.query.techPacks.findFirst({ where: eq(techPacks.id, result.id), with: { model: true } });
    }),

  techPackUpdate: adminQuery
    .input(z.object({
      id: z.number(), status: z.enum(["draft", "review", "approved", "rejected", "revision_needed"]).optional(),
      approvedBy: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, approvedBy, ...data } = input;
      const db = getDb();
      const updateData: Record<string, unknown> = { ...data };
      if (approvedBy !== undefined) { updateData.approvedBy = approvedBy; updateData.approvedAt = new Date(); }
      await db.update(techPacks).set(updateData).where(eq(techPacks.id, id));
      return db.query.techPacks.findFirst({ where: eq(techPacks.id, id), with: { model: true } });
    }),

  techPackDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(techPacks).where(eq(techPacks.id, input.id));
      return { success: true };
    }),

  // Design Revisions
  revisionList: authedQuery
    .input(z.object({ modelId: z.number().optional(), techPackId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.modelId) conditions.push(eq(designRevisions.modelId, input.modelId));
      if (input?.techPackId) conditions.push(eq(designRevisions.techPackId, input.techPackId));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.designRevisions.findMany({ where, with: { model: true, techPack: true }, orderBy: desc(designRevisions.createdAt) });
    }),

  revisionCreate: adminQuery
    .input(z.object({
      modelId: z.number(), techPackId: z.number().optional(),
      revisionNumber: z.string().min(1), changeDescription: z.string().optional(),
      changedBy: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(designRevisions).values(input).$returningId();
      return db.query.designRevisions.findFirst({ where: eq(designRevisions.id, result.id) });
    }),

  revisionApprove: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["approved", "rejected"]), approvedBy: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(designRevisions).set({ status: input.status, approvedBy: input.approvedBy }).where(eq(designRevisions.id, input.id));
      return { success: true };
    }),

  // Sample Reviews
  sampleList: authedQuery
    .input(z.object({ modelId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.modelId) conditions.push(eq(sampleReviews.modelId, input.modelId));
      if (input?.status) conditions.push(eq(sampleReviews.status, input.status as "submitted" | "under_review" | "decided"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.sampleReviews.findMany({ where, with: { model: true, techPack: true }, orderBy: desc(sampleReviews.createdAt) });
    }),

  sampleCreate: adminQuery
    .input(z.object({
      modelId: z.number(), techPackId: z.number().optional(),
      sampleType: z.enum(["fit", "pp", "production", "counter", "size_set"]),
      size: z.string().optional(), color: z.string().optional(),
      reviewerName: z.string().optional(), reviewDate: z.string().optional(),
      comments: z.string().optional(), defects: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data = { ...input, reviewDate: input.reviewDate ? new Date(input.reviewDate) : null };
      const [result] = await db.insert(sampleReviews).values(data).$returningId();
      return db.query.sampleReviews.findFirst({ where: eq(sampleReviews.id, result.id), with: { model: true } });
    }),

  sampleDecide: adminQuery
    .input(z.object({
      id: z.number(), decision: z.enum(["approved", "approved_with_comments", "rejected", "resubmit"]),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(sampleReviews).set({ decision: input.decision, status: "decided", comments: input.comments }).where(eq(sampleReviews.id, input.id));
      return { success: true };
    }),
});

// ─── Custom Report Builder Router ───
export const reportBuilderRouter = createRouter({
  // Report Templates
  templateList: authedQuery.query(async () => {
    return getDb().query.reportTemplates.findMany({ orderBy: desc(reportTemplates.createdAt) });
  }),

  templateCreate: adminQuery
    .input(z.object({
      name: z.string().min(1), category: z.string().min(1),
      description: z.string().optional(), queryConfig: z.string().min(1),
      chartType: z.enum(["table", "bar", "line", "pie", "area", "kpi", "heatmap"]).default("table"),
      isSystem: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(reportTemplates).values(input).$returningId();
      return db.query.reportTemplates.findFirst({ where: eq(reportTemplates.id, result.id) });
    }),

  // Custom Reports
  reportList: authedQuery
    .input(z.object({ createdBy: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      if (input?.createdBy) {
        return db.query.customReports.findMany({ where: eq(customReports.createdBy, input.createdBy), with: { creator: true }, orderBy: desc(customReports.createdAt) });
      }
      return db.query.customReports.findMany({ with: { creator: true }, orderBy: desc(customReports.createdAt) });
    }),

  reportCreate: adminQuery
    .input(z.object({
      name: z.string().min(1), description: z.string().optional(),
      queryConfig: z.string().min(1),
      chartType: z.enum(["table", "bar", "line", "pie", "area", "kpi", "heatmap"]).default("table"),
      filters: z.string().optional(), schedule: z.string().optional(),
      isPublic: z.boolean().optional(), createdBy: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(customReports).values(input).$returningId();
      return db.query.customReports.findFirst({ where: eq(customReports.id, result.id), with: { creator: true } });
    }),

  reportDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(customReports).where(eq(customReports.id, input.id));
      return { success: true };
    }),

  // Execute a report query
  execute: adminQuery
    .input(z.object({ reportId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const report = await db.query.customReports.findFirst({ where: eq(customReports.id, input.reportId) });
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });

      // Parse and execute the query configuration
      let config;
      try { config = JSON.parse(report.queryConfig); } catch { config = { type: "employees" }; }

      let data: unknown[] = [];
      switch (config.type) {
        case "employees":
          data = await db.select().from(employees).limit(100);
          break;
        case "attendance":
          data = await db.select().from(attendance).orderBy(desc(attendance.date)).limit(100);
          break;
        case "production":
          data = await db.select().from(productionOrders).orderBy(desc(productionOrders.createdAt)).limit(100);
          break;
        case "daily_production":
          data = await db.select().from(dailyProduction).orderBy(desc(dailyProduction.date)).limit(100);
          break;
        case "inventory":
          data = await db.select().from(inventoryItems).limit(100);
          break;
        case "sales":
          data = await db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt)).limit(100);
          break;
        case "machines":
          data = await db.select().from(machines).limit(100);
          break;
        default:
          data = await db.select().from(employees).limit(50);
      }

      await db.update(customReports).set({ lastRunAt: new Date() }).where(eq(customReports.id, input.reportId));
      return { report, rowCount: data.length, data: data.slice(0, 500) };
    }),
});

// ─── Predictive Analytics Router ───
export const analyticsRouter = createRouter({
  // Create/update forecast
  forecastCreate: adminQuery
    .input(z.object({
      modelId: z.number(), lineId: z.number().optional(),
      forecastType: z.enum(["demand", "capacity", "material", "delivery"]),
      period: z.string(), predictedValue: z.string(),
      confidence: z.string().optional(), algorithm: z.string().optional(),
      factors: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = {
        ...input,
        predictedValue: parseFloat(input.predictedValue),
        confidence: input.confidence ? parseFloat(input.confidence) : 85,
      };
      const [result] = await db.insert(productionForecasts).values(data as any).$returningId();
      return db.query.productionForecasts.findFirst({ where: eq(productionForecasts.id, result.id), with: { model: true } });
    }),

  forecastList: authedQuery
    .input(z.object({ modelId: z.number().optional(), forecastType: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.modelId) conditions.push(eq(productionForecasts.modelId, input.modelId));
      if (input?.forecastType) conditions.push(eq(productionForecasts.forecastType, input.forecastType as "demand" | "capacity" | "material" | "delivery"));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.productionForecasts.findMany({ where, with: { model: true, line: true }, orderBy: desc(productionForecasts.createdAt) });
    }),

  // Simple linear regression forecast
  predict: adminQuery
    .input(z.object({
      modelId: z.number(), lineId: z.number().optional(),
      forecastType: z.enum(["demand", "capacity", "material"]),
      periods: z.number().default(4), // number of future periods
      periodUnit: z.enum(["day", "week", "month"]).default("week"),
    }))
    .query(async ({ input }) => {
      const db = getDb();

      // Get historical data for the model
      const history = await db.select().from(dailyProduction)
        .where(input.lineId ? sql`${dailyProduction.lineId} = ${input.lineId}` : sql`1=1`)
        .orderBy(dailyProduction.date)
        .limit(30);

      if (history.length < 3) {
        return { error: "Insufficient data (minimum 3 records)", forecast: [] };
      }

      // Simple linear regression
      const n = history.length;
      const x = history.map((_, i) => i);
      const y = history.map((h) => h.produced || 0);
      const sumX = x.reduce((a: number, b: number) => a + b, 0);
      const sumY = y.reduce((a: number, b: number) => a + b, 0);
      const sumXY = x.reduce((s: number, xi: number, i: number) => s + xi * y[i], 0);
      const sumX2 = x.reduce((s: number, xi: number) => s + xi * xi, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Generate forecasts
      const forecast = [];
      for (let i = 1; i <= input.periods; i++) {
        const predicted = Math.max(0, Math.round(slope * (n + i - 1) + intercept));
        const periodName = `Period +${i}`;
        forecast.push({
          period: periodName,
          predicted,
          trend: slope > 0 ? "up" : slope < 0 ? "down" : "stable",
          confidence: Math.max(50, 95 - i * 5), // confidence decreases over time
        });
      }

      // Calculate accuracy if actuals exist
      const lastForecast = await db.select().from(productionForecasts)
        .where(and(eq(productionForecasts.modelId, input.modelId), sql`${productionForecasts.actualValue} IS NOT NULL`))
        .orderBy(desc(productionForecasts.createdAt))
        .limit(1);

      let accuracy = null;
      if (lastForecast.length > 0) {
        const predicted = parseFloat(lastForecast[0].predictedValue as unknown as string);
        const actual = parseFloat(lastForecast[0].actualValue as unknown as string);
        if (actual > 0) accuracy = Math.round(100 - Math.abs((predicted - actual) / actual) * 100);
      }

      return {
        historicalAvg: Math.round(sumY / n),
        trend: slope > 0.5 ? "strong_up" : slope > 0 ? "up" : slope > -0.5 ? "stable" : "down",
        forecast,
        accuracy,
        algorithm: "simple_linear_regression",
      };
    }),

  // Dashboard KPIs
  kpiSummary: authedQuery.query(async () => {
    const db = getDb();
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      empCount, attCount, orderCount, prodTotal,
      machineCount, lowStock, customerCount, pendingSales,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.status, "active")),
      db.select({ count: sql<number>`count(*)` }).from(attendance).where(gte(attendance.date, weekAgo)),
      db.select({ count: sql<number>`count(*)` }).from(productionOrders).where(eq(productionOrders.status, "in_progress")),
      db.select({ sum: sql<number>`COALESCE(SUM(produced), 0)` }).from(dailyProduction).where(gte(dailyProduction.date, weekAgo)),
      db.select({ count: sql<number>`count(*)` }).from(machines).where(eq(machines.status, "operational")),
      db.select({ count: sql<number>`count(*)` }).from(inventoryItems).where(eq(inventoryItems.status, "low_stock")),
      db.select({ count: sql<number>`count(*)` }).from(crmCustomers).where(eq(crmCustomers.status, "active")),
      db.select({ count: sql<number>`count(*)` }).from(salesOrders).where(eq(salesOrders.status, "pending")),
    ]);

    return {
      activeEmployees: empCount[0]?.count || 0,
      weeklyAttendance: attCount[0]?.count || 0,
      inProgressOrders: orderCount[0]?.count || 0,
      weeklyProduction: prodTotal[0]?.sum || 0,
      operationalMachines: machineCount[0]?.count || 0,
      lowStockItems: lowStock[0]?.count || 0,
      activeCustomers: customerCount[0]?.count || 0,
      pendingSales: pendingSales[0]?.count || 0,
    };
  }),
});

// ─── Employee Self-Service Portal Router ───
export const employeePortalRouter = createRouter({
  // Auth: login with employee code
  portalLogin: publicQuery
    .input(z.object({ employeeCode: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const emp = await db.query.employees.findFirst({
        where: eq(employees.employeeCode, input.employeeCode),
        with: { department: true },
      });
      if (!emp) throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
      
      // Verify password using bcrypt if passwordHash exists
      if (emp.passwordHash) {
        if (!bcrypt.compareSync(input.password, emp.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور غير صحيحة" });
        }
      } else {
        // Temporary fallback for demo/development before migrating password hashes
        if (input.password !== "demo-fallback-pass-change-me" && input.password !== emp.employeeCode) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "التحقق من كلمة المرور مفعل ومطلب. يرجى استخدام كود الموظف ككلمة مرور مؤقتة." });
        }
      }

      const token = generatePortalToken(emp.id, null, "employee");
      return { success: true, token, employee: { id: emp.id, code: emp.employeeCode, name: emp.fullName, department: emp.department?.name, jobTitle: emp.jobTitle, salaryType: emp.salaryType } };
    }),

  // Payslip: view monthly payslip
  payslip: publicQuery
    .input(z.object({ token: z.string(), employeeId: z.number(), month: z.string() }))
    .query(async ({ input }) => {
      const session = validatePortalToken(input.token, "employee");
      if (!session || session.employeeId !== input.employeeId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
      }
      const db = getDb();
      const [payroll] = await db.select().from(payrollRecords)
        .where(and(eq(payrollRecords.employeeId, input.employeeId), eq(payrollRecords.month, input.month)));
      const approvedAdvances = await db.select().from(advances)
        .where(and(eq(advances.employeeId, input.employeeId), eq(advances.status, "approved")));
      const pieceRates = await db.select().from(pieceRateRecords)
        .where(sql`${pieceRateRecords.employeeId} = ${input.employeeId} AND DATE_FORMAT(${pieceRateRecords.date}, '%Y-%m') = ${input.month}`);
      const totalPieceRate = pieceRates.reduce((sum, p) => sum + parseFloat(p.totalAmount as unknown as string), 0);

      return { payroll, advances: approvedAdvances, pieceRateTotal: totalPieceRate, pieceRateRecords: pieceRates.length };
    }),

  // Attendance calendar
  attendanceCalendar: publicQuery
    .input(z.object({ token: z.string(), employeeId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const session = validatePortalToken(input.token, "employee");
      if (!session || session.employeeId !== input.employeeId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
      }
      const db = getDb();
      const monthStr = `${input.year}-${String(input.month).padStart(2, "0")}`;
      const records = await db.select().from(attendance)
        .where(sql`${attendance.employeeId} = ${input.employeeId} AND DATE_FORMAT(${attendance.date}, '%Y-%m') = ${monthStr}`)
        .orderBy(attendance.date);
      return records;
    }),

  // Request leave
  requestLeave: publicQuery
    .input(z.object({
      token: z.string(), employeeId: z.number(), leaveType: z.enum(["annual", "sick", "maternity", "paternity", "unpaid", "emergency"]),
      startDate: z.string(), endDate: z.string(), days: z.number(), reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const session = validatePortalToken(input.token, "employee");
      if (!session || session.employeeId !== input.employeeId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
      }
      const db = getDb();
      const data = {
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: "pending" as const,
      };
      const { token: _, employeeId, leaveType, startDate, endDate, days, reason } = input;
      const [result] = await db.insert(leaves).values({
        employeeId, leaveType, startDate: new Date(startDate), endDate: new Date(endDate), days, status: "pending", reason,
      }).$returningId();
      return { success: true, requestId: result.id };
    }),

  // Request advance
  requestAdvance: publicQuery
    .input(z.object({ token: z.string(), employeeId: z.number(), amount: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const session = validatePortalToken(input.token, "employee");
      if (!session || session.employeeId !== input.employeeId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
      }
      const db = getDb();
      const [result] = await db.insert(advances).values({
        employeeId: input.employeeId, amount: input.amount, reason: input.reason, status: "pending",
      }).$returningId();
      return { success: true, requestId: result.id };
    }),
});

// ─── Buyer Portal (B2B) Router ───
export const buyerPortalRouter = createRouter({
  // Buyer login
  buyerLogin: publicQuery
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const buyer = await db.query.buyerPortalUsers.findFirst({
        where: eq(buyerPortalUsers.email, input.email),
        with: { customer: true },
      });
      if (!buyer || buyer.status !== "active") throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials or account inactive" });
      
      // Verify buyer password hash
      if (!buyer.password || !bcrypt.compareSync(input.password, buyer.password)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      const customerId = buyer.customerId || buyer.customer?.id || 0;
      const token = generatePortalToken(0, customerId, "buyer");
      await db.update(buyerPortalUsers).set({ lastLogin: new Date() }).where(eq(buyerPortalUsers.id, buyer.id));
      return { success: true, token, buyer: { id: buyer.id, name: buyer.fullName, email: buyer.email, role: buyer.role, customer: buyer.customer?.name } };
    }),

  // View orders for buyer's company
  myOrders: publicQuery
    .input(z.object({ token: z.string(), customerId: z.number() }))
    .query(async ({ input }) => {
      const session = validatePortalToken(input.token, "buyer");
      if (!session || session.customerId !== input.customerId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
      }
      const db = getDb();
      return db.query.salesOrders.findMany({
        where: eq(salesOrders.customerId, input.customerId),
        with: { customer: true },
        orderBy: desc(salesOrders.createdAt),
      });
    }),

  // View production status of an order
  orderProductionStatus: publicQuery
    .input(z.object({ token: z.string(), orderId: z.number() }))
    .query(async ({ input }) => {
      const session = validatePortalToken(input.token, "buyer");
      if (!session) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
      }
      const db = getDb();
      const order = await db.query.salesOrders.findFirst({
        where: eq(salesOrders.id, input.orderId),
        with: { customer: true },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.customerId !== session.customerId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Find related production order
      const prodOrders = await db.select().from(productionOrders)
        .where(sql`${productionOrders.orderCode} LIKE ${"%" + order.orderNumber + "%"}`)
        .limit(1);

      const prodOrder = prodOrders[0];
      let progress = 0;
      if (prodOrder && prodOrder.quantity > 0) {
        progress = Math.round(((prodOrder.completed || 0) / prodOrder.quantity) * 100);
      }

      // Get lifecycle stages
      let lifecycleStages: unknown[] = [];
      if (prodOrder) {
        lifecycleStages = await db.select().from(productLifecycle)
          .where(eq(productLifecycle.modelId, order.modelId || 0))
          .orderBy(productLifecycle.stageOrder);
      }

      return { order, productionOrder: prodOrder || null, progress, lifecycleStages };
    }),

  // View quality reports for buyer's orders
  qualityReports: publicQuery
    .input(z.object({ token: z.string(), customerId: z.number() }))
    .query(async ({ input }) => {
      const session = validatePortalToken(input.token, "buyer");
      if (!session || session.customerId !== input.customerId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired session" });
      }
      const db = getDb();
      const orders = await db.select().from(salesOrders).where(eq(salesOrders.customerId, input.customerId));
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length === 0) return [];

      const qcData = await db.select().from(qcRecords)
        .where(inArray(qcRecords.orderId, orderIds))
        .orderBy(desc(qcRecords.createdAt))
        .limit(50);
      return qcData;
    }),

  // Create buyer portal user (admin only)
  createBuyerUser: adminQuery
    .input(z.object({
      customerId: z.number(), fullName: z.string().min(1), email: z.string().email(),
      role: z.enum(["buyer_admin", "buyer_user", "viewer"]).default("buyer_user"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(buyerPortalUsers).values({
        ...input, status: "pending",
      }).$returningId();
      return db.query.buyerPortalUsers.findFirst({ where: eq(buyerPortalUsers.id, result.id), with: { customer: true } });
    }),
});

// ─── Audit Trail Router ───
export const auditRouter = createRouter({
  list: adminQuery
    .input(z.object({
      tableName: z.string().optional(),
      action: z.enum(["INSERT", "UPDATE", "DELETE"]).optional(),
      limit: z.number().default(100),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.tableName) conditions.push(eq(auditLog.tableName, input.tableName));
      if (input?.action) conditions.push(eq(auditLog.action, input.action));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.select().from(auditLog).where(where).orderBy(desc(auditLog.createdAt)).limit(input?.limit || 100);
    }),

  create: adminQuery
    .input(z.object({
      tableName: z.string(), recordId: z.number(), action: z.enum(["INSERT", "UPDATE", "DELETE"]),
      oldValues: z.string().optional(), newValues: z.string().optional(),
      changedBy: z.number().optional(), changedByName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      
      return { success: true };
    }),

  stats: adminQuery.query(async () => {
    const db = getDb();
    const [inserts, updates, deletes, total] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(auditLog).where(eq(auditLog.action, "INSERT")),
      db.select({ count: sql<number>`count(*)` }).from(auditLog).where(eq(auditLog.action, "UPDATE")),
      db.select({ count: sql<number>`count(*)` }).from(auditLog).where(eq(auditLog.action, "DELETE")),
      db.select({ count: sql<number>`count(*)` }).from(auditLog),
    ]);
    return { inserts: inserts[0]?.count || 0, updates: updates[0]?.count || 0, deletes: deletes[0]?.count || 0, total: total[0]?.count || 0 };
  }),
});

// ─── PowerBI / External BI Integration ───
function validateBiKey(key: string | undefined): boolean {
  const allowedKeysEnv = process.env.BI_API_KEYS;
  if (!allowedKeysEnv) {
    return false; // Reject all requests if API keys are not configured
  }
  const allowedKeys = allowedKeysEnv.split(",").map(k => k.trim()).filter(Boolean);
  return key !== undefined && allowedKeys.includes(key);
}

export const biIntegrationRouter = createRouter({
  // Export data for PowerBI (OData-like)
  odata: publicQuery
    .input(z.object({
      apiKey: z.string(), // Require apiKey parameter
      entity: z.enum(["employees", "attendance", "production", "inventory", "sales", "machines", "orders"]),
      top: z.number().default(1000),
      filter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      if (!validateBiKey(input.apiKey)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or missing API key" });
      }
      const db = getDb();
      let data: unknown[] = [];
      switch (input.entity) {
        case "employees":
          data = await db.select({
            id: employees.id, employeeCode: employees.employeeCode, fullName: employees.fullName,
            jobTitle: employees.jobTitle, status: employees.status, salaryType: employees.salaryType,
            joinDate: employees.joinDate, departmentId: employees.departmentId,
          }).from(employees).limit(input.top);
          break;
        case "attendance":
          data = await db.select().from(attendance).orderBy(desc(attendance.date)).limit(input.top);
          break;
        case "production":
          data = await db.select().from(dailyProduction).orderBy(desc(dailyProduction.date)).limit(input.top);
          break;
        case "inventory":
          data = await db.select().from(inventoryItems).limit(input.top);
          break;
        case "sales":
          data = await db.select().from(salesOrders).orderBy(desc(salesOrders.createdAt)).limit(input.top);
          break;
        case "machines":
          data = await db.select().from(machines).limit(input.top);
          break;
        case "orders":
          data = await db.select().from(productionOrders).orderBy(desc(productionOrders.createdAt)).limit(input.top);
          break;
      }
      return { entity: input.entity, count: data.length, data };
    }),

  // Summary stats for BI dashboards
  biSummary: publicQuery
    .input(z.object({ apiKey: z.string() })) // Require apiKey parameter
    .query(async ({ input }) => {
      if (!validateBiKey(input.apiKey)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or missing API key" });
      }
      const db = getDb();
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      empStats, prodStats, invStats, salesStats, machineStats,
    ] = await Promise.all([
      db.select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${employees.status} = 'active' then 1 else 0 end)`,
        monthly: sql<number>`sum(case when ${employees.salaryType} = 'monthly' then 1 else 0 end)`,
        pieceRate: sql<number>`sum(case when ${employees.salaryType} = 'piece_rate' then 1 else 0 end)`,
      }).from(employees),
      db.select({
        totalProduced: sql<number>`COALESCE(SUM(produced), 0)`,
        totalDefected: sql<number>`COALESCE(SUM(defected), 0)`,
        avgDaily: sql<number>`COALESCE(AVG(produced), 0)`,
      }).from(dailyProduction).where(gte(dailyProduction.date, monthAgo)),
      db.select({
        totalItems: sql<number>`count(*)`,
        lowStock: sql<number>`sum(case when ${inventoryItems.status} = 'low_stock' then 1 else 0 end)`,
        outOfStock: sql<number>`sum(case when ${inventoryItems.status} = 'out_of_stock' then 1 else 0 end)`,
      }).from(inventoryItems),
      db.select({
        totalOrders: sql<number>`count(*)`,
        totalRevenue: sql<number>`COALESCE(SUM(totalAmount), 0)`,
        pending: sql<number>`sum(case when ${salesOrders.status} = 'pending' then 1 else 0 end)`,
        delivered: sql<number>`sum(case when ${salesOrders.status} = 'delivered' then 1 else 0 end)`,
      }).from(salesOrders),
      db.select({
        total: sql<number>`count(*)`,
        operational: sql<number>`sum(case when ${machines.status} = 'operational' then 1 else 0 end)`,
        broken: sql<number>`sum(case when ${machines.status} = 'broken' then 1 else 0 end)`,
      }).from(machines),
    ]);

    return {
      employees: empStats[0],
      production: prodStats[0],
      inventory: invStats[0],
      sales: salesStats[0],
      machines: machineStats[0],
      period: { from: monthAgo.toISOString().split("T")[0], to: today.toISOString().split("T")[0] },
    };
  }),
});


