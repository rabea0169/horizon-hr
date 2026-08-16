import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";

export const approvalRouter = createRouter({
  list: authedQuery.query(async () => {
    return [] as unknown[];
  }),
  create: adminQuery
    .input(
      z.object({
        workflowName: z.string(),
        moduleName: z.string(),
        approverRole: z.string(),
        sequenceOrder: z.number().default(1),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      return { id: 0, ...input };
    }),
});
