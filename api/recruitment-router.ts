import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { jobPostings, candidates } from "@db/schema";
import { eq, and, count, desc } from "drizzle-orm";

// ─── Job Postings Router ───
export const jobPostingRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          status: z.string().optional(),
          departmentId: z.number().optional(),
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
      if (input?.status) {
        conditions.push(eq(jobPostings.status, input.status as "open" | "paused" | "closed"));
      }
      if (input?.departmentId) {
        conditions.push(eq(jobPostings.departmentId, input.departmentId));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.jobPostings.findMany({
        where,
        with: { department: true },
        limit: pageSize,
        offset,
        orderBy: [desc(jobPostings.createdAt)],
      });

      const totalResult = await db
        .select({ count: count() })
        .from(jobPostings)
        .where(where);

      const jobsWithCount = await Promise.all(
        data.map(async (job) => {
          const candidateCount = await db
            .select({ count: count() })
            .from(candidates)
            .where(eq(candidates.jobPostingId, job.id));
          return { ...job, candidateCount: candidateCount[0].count };
        })
      );

      return {
        jobs: jobsWithCount,
        total: totalResult[0].count,
        page,
        pageSize,
      };
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.jobPostings.findFirst({
        where: eq(jobPostings.id, input.id),
        with: { department: true },
      });
    }),

  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        departmentId: z.number().optional(),
        description: z.string().optional(),
        requirements: z.string().optional(),
        salaryRange: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
        status: z.enum(["open", "paused", "closed"]).default("open"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db
        .insert(jobPostings)
        .values(input)
        .$returningId();
      return db.query.jobPostings.findFirst({
        where: eq(jobPostings.id, result.id),
        with: { department: true },
      });
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        departmentId: z.number().optional(),
        description: z.string().optional(),
        requirements: z.string().optional(),
        salaryRange: z.string().optional(),
        location: z.string().optional(),
        employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).optional(),
        status: z.enum(["open", "paused", "closed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(jobPostings).set(data).where(eq(jobPostings.id, id));
      return db.query.jobPostings.findFirst({
        where: eq(jobPostings.id, id),
        with: { department: true },
      });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(jobPostings).where(eq(jobPostings.id, input.id));
      return { success: true };
    }),
});

// ─── Candidates Router ───
export const candidateRouter = createRouter({
  list: authedQuery
    .input(
      z
        .object({
          jobPostingId: z.number(),
          stage: z.string().optional(),
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
      if (input?.jobPostingId) {
        conditions.push(eq(candidates.jobPostingId, input.jobPostingId));
      }
      if (input?.stage) {
        conditions.push(
          eq(candidates.stage, input.stage as "applied" | "screening" | "interview" | "offer" | "hired" | "rejected")
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.candidates.findMany({
        where,
        with: { jobPosting: true },
        limit: pageSize,
        offset,
        orderBy: [desc(candidates.createdAt)],
      });

      const totalResult = await db.select({ count: count() }).from(candidates).where(where);

      return {
        candidates: data,
        total: totalResult[0].count,
        page,
        pageSize,
      };
    }),

  create: authedQuery
    .input(
      z.object({
        jobPostingId: z.number(),
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        resumeUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(candidates).values(input).$returningId();
      return db.query.candidates.findFirst({
        where: eq(candidates.id, result.id),
        with: { jobPosting: true },
      });
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        stage: z.enum(["applied", "screening", "interview", "offer", "hired", "rejected"]).optional(),
        rating: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
        fullName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        resumeUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) cleaned[k] = v;
      }
      await db.update(candidates).set(cleaned).where(eq(candidates.id, id));
      return db.query.candidates.findFirst({
        where: eq(candidates.id, id),
        with: { jobPosting: true },
      });
    }),

  updateStage: authedQuery
    .input(
      z.object({
        id: z.number(),
        stage: z.enum(["applied", "screening", "interview", "offer", "hired", "rejected"]),
        rating: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(candidates).set(data).where(eq(candidates.id, id));
      return db.query.candidates.findFirst({
        where: eq(candidates.id, id),
        with: { jobPosting: true },
      });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(candidates).where(eq(candidates.id, input.id));
      return { success: true };
    }),
});
