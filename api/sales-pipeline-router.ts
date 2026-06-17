import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { salesOpportunities, salesPipelineStages, salesOrders, integrationLogs, InsertSalesOpportunity, InsertSalesOrder } from "@db/schema";
import { eq, count, desc, sql, sum } from "drizzle-orm";

export const salesPipelineRouter = createRouter({
  // Pipeline Stages
  listStages: authedQuery.query(async () => {
    return getDb().query.salesPipelineStages.findMany({ where: eq(salesPipelineStages.isActive, true), orderBy: salesPipelineStages.order });
  }),

  createStage: adminQuery
    .input(z.object({ name: z.string().min(1), order: z.number(), color: z.string().optional(), probability: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(salesPipelineStages).values({
        ...input,
        probability: input.probability || "0",
      }).$returningId();
      return db.query.salesPipelineStages.findFirst({ where: eq(salesPipelineStages.id, result.id) });
    }),

  updateStage: adminQuery
    .input(z.object({ id: z.number(), name: z.string().optional(), color: z.string().optional(), probability: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      if (data.probability) data.probability = data.probability;
      await db.update(salesPipelineStages).set(data).where(eq(salesPipelineStages.id, id));
      return db.query.salesPipelineStages.findFirst({ where: eq(salesPipelineStages.id, id) });
    }),

  // Opportunities
  listOpportunities: authedQuery
    .input(z.object({ stageId: z.number().optional(), customerId: z.number().optional(), status: z.string().optional(), assignedTo: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.stageId) conditions.push(eq(salesOpportunities.stageId, input.stageId));
      if (input?.customerId) conditions.push(eq(salesOpportunities.customerId, input.customerId));
      if (input?.status) conditions.push(eq(salesOpportunities.status, input.status as "open" | "won" | "lost" | "on_hold"));
      if (input?.assignedTo) conditions.push(eq(salesOpportunities.assignedTo, input.assignedTo));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.salesOpportunities.findMany({ where, with: { customer: true, stage: true }, orderBy: desc(salesOpportunities.createdAt) });
    }),

  createOpportunity: adminQuery
    .input(z.object({
      title: z.string().min(1),
      customerId: z.number(),
      stageId: z.number(),
      expectedValue: z.string(),
      probability: z.string().optional(),
      expectedCloseDate: z.string().optional(),
      source: z.string().optional(),
      assignedTo: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(salesOpportunities).values({
        ...input,
        expectedValue: parseFloat(input.expectedValue),
        probability: input.probability ? parseFloat(input.probability) : 0,
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      } as InsertSalesOpportunity).$returningId();
      return db.query.salesOpportunities.findFirst({ where: eq(salesOpportunities.id, result.id), with: { customer: true, stage: true } });
    }),

  updateOpportunity: adminQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      stageId: z.number().optional(),
      expectedValue: z.string().optional(),
      actualValue: z.string().optional(),
      probability: z.string().optional(),
      expectedCloseDate: z.string().optional(),
      assignedTo: z.number().optional(),
      description: z.string().optional(),
      status: z.enum(["open", "won", "lost", "on_hold"]).optional(),
      lossReason: z.string().optional(),
      autoCreateOrder: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, autoCreateOrder, ...data } = input;
      const db = getDb();
      const updateData: any = { ...data };
      if (data.expectedValue) updateData.expectedValue = parseFloat(data.expectedValue);
      if (data.actualValue) updateData.actualValue = parseFloat(data.actualValue);
      if (data.probability) updateData.probability = parseFloat(data.probability);
      if (data.expectedCloseDate) updateData.expectedCloseDate = new Date(data.expectedCloseDate);
      if (data.status === "won" || data.status === "lost") updateData.actualCloseDate = new Date();
      await db.update(salesOpportunities).set(updateData).where(eq(salesOpportunities.id, id));
      
      // CASCADE: Auto-create Sales Order when opportunity is won
      if (data.status === "won" && autoCreateOrder) {
        const opp = await db.query.salesOpportunities.findFirst({
          where: eq(salesOpportunities.id, id),
          with: { customer: true },
        });
        
        if (opp && opp.customer) {
          const orderNumber = `SO-OPP-${opp.id}`;
          const [soResult] = await db.insert(salesOrders).values({
            orderNumber,
            customerId: opp.customerId,
            totalAmount: String(opp.expectedValue || opp.actualValue || 0),
            orderDate: new Date(),
            status: "pending",
            notes: `Auto-generated from won opportunity: ${opp.title}`,
          } as InsertSalesOrder).$returningId();
          
          // Log integration
          await db.insert(integrationLogs).values({
            event: "opportunity_converted_to_so",
            sourceModule: "sales_pipeline",
            targetModule: "sales_order",
            sourceId: id,
            targetId: soResult.id,
            sourceNumber: `OPP-${opp.id}`,
            targetNumber: orderNumber,
            status: "success",
            details: `Opportunity "${opp.title}" converted to ${orderNumber}`,
            processedAt: new Date(),
          });
        }
      }
      
      return db.query.salesOpportunities.findFirst({ where: eq(salesOpportunities.id, id), with: { customer: true, stage: true } });
    }),

  moveStage: adminQuery
    .input(z.object({ id: z.number(), stageId: z.number(), probability: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const updateData: any = { stageId: input.stageId };
      if (input.probability) updateData.probability = parseFloat(input.probability);
      await db.update(salesOpportunities).set(updateData).where(eq(salesOpportunities.id, input.id));
      return db.query.salesOpportunities.findFirst({ where: eq(salesOpportunities.id, input.id), with: { customer: true, stage: true } });
    }),

  deleteOpportunity: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(salesOpportunities).where(eq(salesOpportunities.id, input.id));
      return { success: true };
    }),

  // Dashboard Stats
  dashboard: authedQuery.query(async () => {
    const db = getDb();
    const [total, open, won, lost, pipelineValue] = await Promise.all([
      db.select({ count: count() }).from(salesOpportunities),
      db.select({ count: count() }).from(salesOpportunities).where(eq(salesOpportunities.status, "open")),
      db.select({ count: count() }).from(salesOpportunities).where(eq(salesOpportunities.status, "won")),
      db.select({ count: count() }).from(salesOpportunities).where(eq(salesOpportunities.status, "lost")),
      db.select({ total: sum(salesOpportunities.expectedValue) }).from(salesOpportunities).where(eq(salesOpportunities.status, "open")),
    ]);
    return {
      total: total[0].count,
      open: open[0].count,
      won: won[0].count,
      lost: lost[0].count,
      pipelineValue: pipelineValue[0].total || 0,
    };
  }),

  stageBreakdown: authedQuery.query(async () => {
    const db = getDb();
    const stages = await db.query.salesPipelineStages.findMany({ where: eq(salesPipelineStages.isActive, true), orderBy: salesPipelineStages.order });
    const result = [];
    for (const stage of stages) {
      const [countResult, valueResult] = await Promise.all([
        db.select({ count: count() }).from(salesOpportunities).where(sql`${salesOpportunities.stageId} = ${stage.id} AND ${salesOpportunities.status} = 'open'`),
        db.select({ total: sum(salesOpportunities.expectedValue) }).from(salesOpportunities).where(sql`${salesOpportunities.stageId} = ${stage.id} AND ${salesOpportunities.status} = 'open'`),
      ]);
      result.push({ stage: stage.name, color: stage.color, count: countResult[0].count, value: valueResult[0].total || 0 });
    }
    return result;
  }),
});

