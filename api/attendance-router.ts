import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { attendance, employees } from "@db/schema";
import { eq, and, count, sql, desc } from "drizzle-orm";

export const attendanceRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        date: z.string().optional(), // YYYY-MM-DD
        employeeId: z.number().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 50;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (input.date) {
        conditions.push(eq(attendance.date, new Date(input.date)));
      }
      if (input.employeeId) {
        conditions.push(eq(attendance.employeeId, input.employeeId));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(attendance)
          .leftJoin(employees, eq(attendance.employeeId, employees.id))
          .where(where)
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(attendance.date)),
        db.select({ count: count() }).from(attendance).where(where),
      ]);

      return {
        attendance: data.map((r) => ({ ...r.attendance, employee: r.employees })),
        total: totalResult[0].count,
        page,
        pageSize,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.attendance.findFirst({
        where: eq(attendance.id, input.id),
        with: { employee: true },
      });
    }),

  checkIn: authedQuery
    .input(
      z.object({
        employeeId: z.number(),
        date: z.string(),
        status: z.enum(["present", "late", "absent", "on_leave", "half_day"]).default("present"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db
        .insert(attendance)
        .values({
          employeeId: input.employeeId,
          date: new Date(input.date),
          checkIn: new Date(),
          status: input.status,
          notes: input.notes,
        })
        .$returningId();
      return db.query.attendance.findFirst({
        where: eq(attendance.id, result.id),
        with: { employee: true },
      });
    }),

  checkOut: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const record = await db.query.attendance.findFirst({
        where: eq(attendance.id, input.id),
      });
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Attendance record not found" });

      const checkIn = record.checkIn;
      const checkOut = new Date();
      let hoursWorked = null;
      if (checkIn) {
        const diffMs = checkOut.getTime() - checkIn.getTime();
        hoursWorked = (diffMs / (1000 * 60 * 60)).toFixed(2);
      }

      await db
        .update(attendance)
        .set({ checkOut, hoursWorked: hoursWorked ? String(hoursWorked) : null })
        .where(eq(attendance.id, input.id));

      return db.query.attendance.findFirst({
        where: eq(attendance.id, input.id),
        with: { employee: true },
      });
    }),

  bulkMark: adminQuery
    .input(
      z.object({
        employeeIds: z.array(z.number()),
        date: z.string(),
        status: z.enum(["present", "late", "absent", "on_leave", "half_day"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const date = new Date(input.date);
      const values = input.employeeIds.map((employeeId) => ({
        employeeId,
        date,
        status: input.status,
      }));
      await db.insert(attendance).values(values);
      return { success: true, count: values.length };
    }),

  create: adminQuery
    .input(z.object({ employeeId: z.number(), date: z.string(), status: z.enum(["present", "late", "absent", "on_leave", "half_day"]).optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(attendance).values({
        employeeId: input.employeeId,
        date: new Date(input.date),
        status: input.status ?? "present",
      }).$returningId();
      return db.query.attendance.findFirst({ where: eq(attendance.id, result.id), with: { employee: true } });
    }),

  update: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["present", "late", "absent", "on_leave", "half_day"]).optional(), checkOut: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const data: Record<string, unknown> = {};
      if (input.status) data.status = input.status;
      if (input.checkOut) {
        data.checkOut = new Date(input.checkOut);
        const record = await db.query.attendance.findFirst({ where: eq(attendance.id, input.id) });
        if (record?.checkIn) {
          const diffMs = new Date(input.checkOut).getTime() - new Date(record.checkIn).getTime();
          data.hoursWorked = String((diffMs / (1000 * 60 * 60)).toFixed(2));
        }
      }
      await db.update(attendance).set(data).where(eq(attendance.id, input.id));
      return db.query.attendance.findFirst({ where: eq(attendance.id, input.id), with: { employee: true } });
    }),

  todayStats: authedQuery.query(async () => {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];
    const [
      presentResult,
      lateResult,
      absentResult,
      onLeaveResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(attendance).where(and(eq(attendance.date, new Date(today)), eq(attendance.status, "present"))),
      db.select({ count: count() }).from(attendance).where(and(eq(attendance.date, new Date(today)), eq(attendance.status, "late"))),
      db.select({ count: count() }).from(attendance).where(and(eq(attendance.date, new Date(today)), eq(attendance.status, "absent"))),
      db.select({ count: count() }).from(attendance).where(and(eq(attendance.date, new Date(today)), eq(attendance.status, "on_leave"))),
    ]);

    return {
      present: presentResult[0].count,
      late: lateResult[0].count,
      absent: absentResult[0].count,
      onLeave: onLeaveResult[0].count,
    };
  }),

  monthlyTrend: authedQuery
    .input(z.object({ year: z.number().default(new Date().getFullYear()), month: z.number().default(new Date().getMonth() + 1) }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          date: attendance.date,
          present: count(sql`CASE WHEN ${attendance.status} = 'present' THEN 1 END`),
          late: count(sql`CASE WHEN ${attendance.status} = 'late' THEN 1 END`),
          absent: count(sql`CASE WHEN ${attendance.status} = 'absent' THEN 1 END`),
        })
        .from(attendance)
        .where(
          sql`YEAR(${attendance.date}) = ${input.year} AND MONTH(${attendance.date}) = ${input.month}`
        )
        .groupBy(attendance.date)
        .orderBy(attendance.date);
      return result;
    }),
});
