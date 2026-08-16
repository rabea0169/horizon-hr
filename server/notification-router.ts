import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";

export const notificationRouter = createRouter({
  list: authedQuery.query(async () => {
    return [] as unknown[];
  }),
  create: adminQuery
    .input(
      z.object({
        userId: z.number(),
        title: z.string(),
        message: z.string(),
        type: z.string().default("info"),
        read: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      return { id: 0, ...input };
    }),
  markRead: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async () => {
      return { success: true };
    }),
});
