import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { employees, departments } from "@db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";

export const employeeRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          search: z.string().optional(),
          departmentId: z.number().optional(),
          status: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (input?.search) {
        conditions.push(
          sql`${employees.fullName} LIKE ${"%" + input.search + "%"} OR ${employees.email} LIKE ${"%" + input.search + "%"}`
        );
      }
      if (input?.departmentId) {
        conditions.push(eq(employees.departmentId, input.departmentId));
      }
      if (input?.status) {
        conditions.push(eq(employees.status, input.status as "active" | "on_leave" | "inactive" | "terminated"));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(employees)
          .leftJoin(departments, eq(employees.departmentId, departments.id))
          .where(where)
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(employees.createdAt)),
        db
          .select({ count: count() })
          .from(employees)
          .where(where),
      ]);

      const formatted = data.map((row) => ({
        ...row.employees,
        department: row.departments,
      }));

      return {
        employees: formatted,
        total: totalResult[0].count,
        page,
        pageSize,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const emp = await db.query.employees.findFirst({
        where: eq(employees.id, input.id),
        with: {
          department: true,
          manager: true,
        },
      });
      return emp;
    }),

  create: adminQuery
    .input(
      z.object({
        employeeCode: z.string().min(1),
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        departmentId: z.number().optional(),
        role: z.string().min(1),
        jobTitle: z.string().min(1),
        managerId: z.number().optional(),
        joinDate: z.string(),
        salary: z.string().optional(),
        status: z.enum(["active", "on_leave", "inactive", "terminated"]).default("active"),
        employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
        salaryType: z.enum(["monthly", "piece_rate", "mixed"]).default("monthly"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db
        .insert(employees)
        .values({
          ...input,
          joinDate: new Date(input.joinDate),
        })
        .$returningId();
      return db.query.employees.findFirst({
        where: eq(employees.id, result.id),
        with: { department: true },
      });
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        employeeCode: z.string().min(1).optional(),
        fullName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        departmentId: z.number().optional(),
        role: z.string().min(1).optional(),
        jobTitle: z.string().min(1).optional(),
        managerId: z.number().optional(),
        joinDate: z.string().optional(),
        salary: z.string().optional(),
        status: z.enum(["active", "on_leave", "inactive", "terminated"]).optional(),
        employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).optional(),
        salaryType: z.enum(["monthly", "piece_rate", "mixed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, joinDate, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (joinDate) updateData.joinDate = new Date(joinDate);
      await db.update(employees).set(updateData).where(eq(employees.id, id));
      return db.query.employees.findFirst({
        where: eq(employees.id, id),
        with: { department: true },
      });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(employees).where(eq(employees.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [
      totalResult,
      activeResult,
      onLeaveResult,
      newThisMonth,
    ] = await Promise.all([
      db.select({ count: count() }).from(employees),
      db.select({ count: count() }).from(employees).where(eq(employees.status, "active")),
      db.select({ count: count() }).from(employees).where(eq(employees.status, "on_leave")),
      db
        .select({ count: count() })
        .from(employees)
        .where(sql`MONTH(${employees.joinDate}) = MONTH(CURDATE()) AND YEAR(${employees.joinDate}) = YEAR(CURDATE())`),
    ]);

    return {
      total: totalResult[0].count,
      active: activeResult[0].count,
      onLeave: onLeaveResult[0].count,
      newThisMonth: newThisMonth[0].count,
    };
  }),

  byDepartment: authedQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        departmentName: departments.name,
        departmentColor: departments.color,
        count: count(),
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .groupBy(departments.id)
      .orderBy(desc(count()));
    return result;
  }),
});
