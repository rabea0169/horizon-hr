import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { leaves } from "@db/schema";
import { eq } from "drizzle-orm";

export const leaveRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().select().from(leaves).orderBy(leaves.id).limit(500);
  }),
  create: adminQuery
    .input(
      z.object({
        employeeId: z.number(),
        type: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        status: z.string().default("pending"),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {
        employeeId: input.employeeId,
        type: input.type,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: input.status,
        reason: input.reason,
      };
      const result = await getDb().insert(leaves).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.string().optional(),
        approvedBy: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...rawData } = input;
      const data: any = { ...rawData };
      await getDb().update(leaves).set(data).where(eq(leaves.id, id));
      return { success: true };
    }),
});
