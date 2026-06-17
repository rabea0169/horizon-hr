import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { salesCommissions, salesOrders } from "@db/schema";
import { eq, count, desc, sql, sum } from "drizzle-orm";

export const salesCommissionRouter = createRouter({
  list: authedQuery
    .input(z.object({ employeeId: z.number().optional(), period: z.string().optional(), isPaid: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.employeeId) conditions.push(eq(salesCommissions.employeeId, input.employeeId));
      if (input?.period) conditions.push(eq(salesCommissions.period, input.period));
      if (input?.isPaid !== undefined) conditions.push(eq(salesCommissions.isPaid, input.isPaid));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      return db.query.salesCommissions.findMany({ where, with: { employee: true }, orderBy: desc(salesCommissions.createdAt) });
    }),

  create: adminQuery
    .input(z.object({
      employeeId: z.number(),
      salesOrderId: z.number().optional(),
      opportunityId: z.number().optional(),
      commissionRate: z.string(),
      saleAmount: z.string(),
      commissionAmount: z.string(),
      period: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(salesCommissions).values({
        ...input,
      }).$returningId();
      return db.query.salesCommissions.findFirst({ where: eq(salesCommissions.id, result.id), with: { employee: true } });
    }),

  markPaid: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(salesCommissions).set({ isPaid: true, paidAt: new Date() }).where(eq(salesCommissions.id, input.id));
      return db.query.salesCommissions.findFirst({ where: eq(salesCommissions.id, input.id), with: { employee: true } });
    }),

  bulkCreate: adminQuery
    .input(z.object({
      employeeId: z.number(),
      period: z.string(),
      rate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const rate = parseFloat(input.rate);
      const orders = await db.query.salesOrders.findMany({
        where: sql`${salesOrders.status} = 'delivered'`,
      });
      const commissions = orders.map(o => ({
        employeeId: input.employeeId,
        salesOrderId: o.id,
        commissionRate: String(rate),
        saleAmount: String(o.totalAmount),
        commissionAmount: String(parseFloat(o.totalAmount as string) * (rate / 100)),
        period: input.period,
      }));
      if (commissions.length > 0) {
        await db.insert(salesCommissions).values(commissions);
      }
      return { created: commissions.length };
    }),

  stats: authedQuery
    .input(z.object({ period: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.period) conditions.push(eq(salesCommissions.period, input.period));
      const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

      const [totalCommissions, paidCommissions, unpaidCommissions, totalAmount, paidAmount] = await Promise.all([
        db.select({ count: count() }).from(salesCommissions).where(where),
        db.select({ count: count() }).from(salesCommissions).where(sql.join([...(where ? [where] : []), eq(salesCommissions.isPaid, true)], sql` AND `)),
        db.select({ count: count() }).from(salesCommissions).where(sql.join([...(where ? [where] : []), eq(salesCommissions.isPaid, false)], sql` AND `)),
        db.select({ total: sum(salesCommissions.commissionAmount) }).from(salesCommissions).where(where),
        db.select({ total: sum(salesCommissions.commissionAmount) }).from(salesCommissions).where(sql.join([...(where ? [where] : []), eq(salesCommissions.isPaid, true)], sql` AND `)),
      ]);

      return {
        total: totalCommissions[0].count,
        paid: paidCommissions[0].count,
        unpaid: unpaidCommissions[0].count,
        totalAmount: totalAmount[0].total || 0,
        paidAmount: paidAmount[0].total || 0,
      };
    }),
});
