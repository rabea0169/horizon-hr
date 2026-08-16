import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { departments, employees } from "@db/schema";
import { eq, count } from "drizzle-orm";

export const departmentRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    const allDepts = await db.query.departments.findMany({
      with: {
        employees: true,
        manager: true,
      },
    });
    return allDepts;
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const dept = await db.query.departments.findFirst({
        where: eq(departments.id, input.id),
        with: {
          employees: true,
          manager: true,
        },
      });
      return dept;
    }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        managerId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db
        .insert(departments)
        .values({
          name: input.name,
          description: input.description,
          color: input.color,
          managerId: input.managerId,
        })
        .$returningId();
      return db.query.departments.findFirst({
        where: eq(departments.id, result.id),
      });
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        managerId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(departments).set(data).where(eq(departments.id, id));
      return db.query.departments.findFirst({
        where: eq(departments.id, id),
      });
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(departments).where(eq(departments.id, input.id));
      return { success: true };
    }),

  stats: authedQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        departmentName: departments.name,
        employeeCount: count(employees.id),
      })
      .from(departments)
      .leftJoin(employees, eq(employees.departmentId, departments.id))
      .groupBy(departments.id, departments.name);
    return result;
  }),
});
