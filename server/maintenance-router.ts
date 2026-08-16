import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { maintenanceRecords, machineDepreciation } from "@db/schema";
import { desc } from "drizzle-orm";

export const maintenanceRouter = createRouter({
  list: authedQuery.query(async () => {
    return getDb().select().from(maintenanceRecords).orderBy(desc(maintenanceRecords.id)).limit(200);
  }),
  create: adminQuery
    .input(
      z.object({
        machineId: z.number(),
        type: z.string(),
        description: z.string(),
        cost: z.number().default(0),
        performedBy: z.string().optional(),
        nextDue: z.string().optional(),
        status: z.string().default("completed"),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {
        machineId: input.machineId,
        title: input.type,
        maintenanceType: "preventive",
        scheduledDate: new Date(),
        description: input.description,
        cost: input.cost.toString(),
        technicianName: input.performedBy,
        status: input.status,
      };
      if (input.nextDue) data.nextDueDate = new Date(input.nextDue);
      const result = await getDb().insert(maintenanceRecords).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
  listDepreciation: authedQuery.query(async () => {
    return getDb().select().from(machineDepreciation).orderBy(desc(machineDepreciation.id)).limit(200);
  }),
});
