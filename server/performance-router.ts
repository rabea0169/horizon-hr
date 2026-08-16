import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { performanceReviews } from "@db/schema";
import { eq, and, count, desc } from "drizzle-orm";

export const performanceRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          employeeId: z.number().optional(),
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
      if (input?.employeeId) {
        conditions.push(eq(performanceReviews.employeeId, input.employeeId));
      }
      if (input?.status) {
        conditions.push(
          eq(performanceReviews.status, input.status as "pending" | "in_progress" | "completed")
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.performanceReviews.findMany({
        where,
        with: {
          employee: true,
          reviewer: true,
        },
        limit: pageSize,
        offset,
        orderBy: [desc(performanceReviews.createdAt)],
      });

      const totalResult = await db
        .select({ count: count() })
        .from(performanceReviews)
        .where(where);

      return {
        reviews: data,
        total: totalResult[0].count,
        page,
        pageSize,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.performanceReviews.findFirst({
        where: eq(performanceReviews.id, input.id),
        with: {
          employee: true,
          reviewer: true,
        },
      });
    }),

  create: adminQuery
    .input(
      z.object({
        employeeId: z.number(),
        reviewerId: z.number(),
        period: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db
        .insert(performanceReviews)
        .values({
          employeeId: input.employeeId,
          reviewerId: input.reviewerId,
          period: input.period,
          status: "pending",
        })
        .$returningId();
      return db.query.performanceReviews.findFirst({
        where: eq(performanceReviews.id, result.id),
        with: { employee: true, reviewer: true },
      });
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        overallRating: z.number().min(1).max(5).optional(),
        communication: z.number().min(1).max(5).optional(),
        teamwork: z.number().min(1).max(5).optional(),
        productivity: z.number().min(1).max(5).optional(),
        punctuality: z.number().min(1).max(5).optional(),
        goals: z.string().optional(),
        comments: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "completed") {
        updateData.completedAt = new Date();
      }
      await db.update(performanceReviews).set(updateData).where(eq(performanceReviews.id, id));
      return db.query.performanceReviews.findFirst({
        where: eq(performanceReviews.id, id),
        with: { employee: true, reviewer: true },
      });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(performanceReviews).where(eq(performanceReviews.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const [pendingResult, inProgressResult, completedResult] = await Promise.all([
      db.select({ count: count() }).from(performanceReviews).where(eq(performanceReviews.status, "pending")),
      db.select({ count: count() }).from(performanceReviews).where(eq(performanceReviews.status, "in_progress")),
      db.select({ count: count() }).from(performanceReviews).where(eq(performanceReviews.status, "completed")),
    ]);
    return {
      pending: pendingResult[0].count,
      inProgress: inProgressResult[0].count,
      completed: completedResult[0].count,
    };
  }),
});
