import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payrollRecords, employees } from "@db/schema";
import { eq, and, count, desc } from "drizzle-orm";

export const payrollRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        month: z.string().optional(),
        employeeId: z.number().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (input.month) {
        conditions.push(eq(payrollRecords.month, input.month));
      }
      if (input.employeeId) {
        conditions.push(eq(payrollRecords.employeeId, input.employeeId));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(payrollRecords)
          .leftJoin(employees, eq(payrollRecords.employeeId, employees.id))
          .where(where)
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(payrollRecords.createdAt)),
        db.select({ count: count() }).from(payrollRecords).where(where),
      ]);

      return {
        payrolls: data.map((r) => ({ ...r.payroll_records, employee: r.employees })),
        total: totalResult[0].count,
        page,
        pageSize,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.payrollRecords.findFirst({
        where: eq(payrollRecords.id, input.id),
        with: { employee: true },
      });
    }),

  create: adminQuery
    .input(
      z.object({
        employeeId: z.number(),
        month: z.string(),
        basicSalary: z.string(),
        bonus: z.string().default("0"),
        deductions: z.string().default("0"),
        status: z.enum(["processed", "pending", "on_hold"]).default("pending"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const basicSalary = Number(input.basicSalary);
      const bonus = Number(input.bonus);
      const deductions = Number(input.deductions);
      const netPay = basicSalary + bonus - deductions;

      const [result] = await db
        .insert(payrollRecords)
        .values({
          employeeId: input.employeeId,
          month: input.month,
          basicSalary: String(basicSalary),
          bonus: String(bonus),
          deductions: String(deductions),
          netPay: String(netPay),
          status: input.status,
        })
        .$returningId();
      return db.query.payrollRecords.findFirst({
        where: eq(payrollRecords.id, result.id),
        with: { employee: true },
      });
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        basicSalary: z.string().optional(),
        bonus: z.string().optional(),
        deductions: z.string().optional(),
        status: z.enum(["processed", "pending", "on_hold"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};

      if (data.basicSalary !== undefined) updateData.basicSalary = data.basicSalary;
      if (data.bonus !== undefined) updateData.bonus = data.bonus;
      if (data.deductions !== undefined) updateData.deductions = data.deductions;
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "processed") {
          updateData.processedAt = new Date();
        }
      }

      const existing = await db.query.payrollRecords.findFirst({
        where: eq(payrollRecords.id, id),
      });
      if (existing) {
        const basic = Number(updateData.basicSalary ?? existing.basicSalary);
        const bonus = Number(updateData.bonus ?? existing.bonus);
        const deductions = Number(updateData.deductions ?? existing.deductions);
        updateData.netPay = String(basic + bonus - deductions);
      }

      await db.update(payrollRecords).set(updateData).where(eq(payrollRecords.id, id));
      return db.query.payrollRecords.findFirst({
        where: eq(payrollRecords.id, id),
        with: { employee: true },
      });
    }),

  processPayroll: adminQuery
    .input(z.object({ month: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      
      return await db.transaction(async (tx) => {
        const activeEmployees = await tx.query.employees.findMany({
          where: eq(employees.status, "active"),
        });

        const existingPayrolls = await tx
          .select({ employeeId: payrollRecords.employeeId })
          .from(payrollRecords)
          .where(eq(payrollRecords.month, input.month));

        const existingIds = new Set(existingPayrolls.map((p) => Number(p.employeeId)));
        const newEmployees = activeEmployees.filter((e) => !existingIds.has(e.id));

        if (newEmployees.length === 0) return { processed: 0 };

        const payrollData = newEmployees.map((emp) => ({
          employeeId: emp.id,
          month: input.month,
          basicSalary: emp.salary ?? "0",
          bonus: "0",
          deductions: "0",
          netPay: emp.salary ?? "0",
          status: "pending" as const,
        }));

        await tx.insert(payrollRecords).values(payrollData);
        return { processed: payrollData.length };
      });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(payrollRecords).where(eq(payrollRecords.id, input.id));
      return { success: true };
    }),
});
