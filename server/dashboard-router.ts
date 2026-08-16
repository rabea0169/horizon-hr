import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { employees, attendance, leaves, jobPostings, performanceReviews, departments, activities } from "@db/schema";
import { eq, count, sql, desc, inArray } from "drizzle-orm";

export const dashboardRouter = createRouter({
  stats: authedQuery.query(async () => {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];

    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      newThisMonth,
      openPositions,
      pendingLeaves,
      pendingReviews,
      todayPresent,
      todayLate,
      todayAbsent,
    ] = await Promise.all([
      db.select({ count: count() }).from(employees),
      db.select({ count: count() }).from(employees).where(eq(employees.status, "active")),
      db.select({ count: count() }).from(employees).where(eq(employees.status, "on_leave")),
      db
        .select({ count: count() })
        .from(employees)
        .where(sql`MONTH(${employees.joinDate}) = MONTH(CURDATE()) AND YEAR(${employees.joinDate}) = YEAR(CURDATE())`),
      db.select({ count: count() }).from(jobPostings).where(eq(jobPostings.status, "open")),
      db.select({ count: count() }).from(leaves).where(eq(leaves.status, "pending")),
      db.select({ count: count() }).from(performanceReviews).where(eq(performanceReviews.status, "pending")),
      db
        .select({ count: count() })
        .from(attendance)
        .where(sql`${attendance.date} = ${today} AND ${attendance.status} IN ('present', 'late')`),
      db
        .select({ count: count() })
        .from(attendance)
        .where(sql`${attendance.date} = ${today} AND ${attendance.status} = 'late'`),
      db
        .select({ count: count() })
        .from(attendance)
        .where(sql`${attendance.date} = ${today} AND ${attendance.status} = 'absent'`),
    ]);

    return {
      totalEmployees: totalEmployees[0].count,
      activeEmployees: activeEmployees[0].count,
      onLeaveEmployees: onLeaveEmployees[0].count,
      newThisMonth: newThisMonth[0].count,
      openPositions: openPositions[0].count,
      pendingLeaves: pendingLeaves[0].count,
      pendingReviews: pendingReviews[0].count,
      todayPresent: todayPresent[0].count,
      todayLate: todayLate[0].count,
      todayAbsent: todayAbsent[0].count,
    };
  }),

  departmentHeadcount: authedQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        departmentId: employees.departmentId,
        count: count(),
      })
      .from(employees)
      .groupBy(employees.departmentId);

    // Get department names
    const deptIds = result.map((r) => r.departmentId).filter((id): id is number => id !== null);
    if (deptIds.length === 0) return [];

    const deptNames = await db
      .select()
      .from(departments)
      .where(inArray(departments.id, deptIds));

    const deptMap = new Map(deptNames.map((d) => [d.id, d]));
    return result.map((r) => ({
      ...r,
      department: r.departmentId ? deptMap.get(Number(r.departmentId)) : null,
    }));
  }),

  monthlyAttendanceTrend: authedQuery.query(async () => {
    const db = getDb();
    const currentYear = new Date().getFullYear();

    const result = await db
      .select({
        month: sql<number>`MONTH(${attendance.date})`,
        present: count(sql`CASE WHEN ${attendance.status} = 'present' THEN 1 END`),
        late: count(sql`CASE WHEN ${attendance.status} = 'late' THEN 1 END`),
        absent: count(sql`CASE WHEN ${attendance.status} = 'absent' THEN 1 END`),
      })
      .from(attendance)
      .where(sql`YEAR(${attendance.date}) = ${currentYear}`)
      .groupBy(sql`MONTH(${attendance.date})`)
      .orderBy(sql`MONTH(${attendance.date})`);

    return result;
  }),

  recentActivities: authedQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(10);
  }),

  upcomingReviews: authedQuery.query(async () => {
    const db = getDb();
    return db.query.performanceReviews.findMany({
      where: eq(performanceReviews.status, "pending"),
      with: {
        employee: true,
        reviewer: true,
      },
      limit: 5,
      orderBy: [desc(performanceReviews.createdAt)],
    });
  }),
});
