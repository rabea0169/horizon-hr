import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { paymentVouchers, receiptVouchers } from "@db/schema";
import { desc } from "drizzle-orm";

export const voucherRouter = createRouter({
  listPayments: authedQuery.query(async () => {
    return getDb().select().from(paymentVouchers).orderBy(desc(paymentVouchers.id)).limit(200);
  }),
  createPayment: adminQuery
    .input(
      z.object({
        voucherNo: z.string(),
        payee: z.string(),
        amount: z.number(),
        description: z.string().optional(),
        status: z.string().default("draft"),
        date: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const data = {
        voucherNumber: input.voucherNo,
        voucherDate: new Date(input.date),
        payeeName: input.payee,
        payeeType: "other" as const,
        amount: input.amount.toString(),
        description: input.description,
        status: input.status as "draft" | "approved" | "paid" | "cancelled",
      };
      const result = await getDb().insert(paymentVouchers).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
  listReceipts: authedQuery.query(async () => {
    return getDb().select().from(receiptVouchers).orderBy(desc(receiptVouchers.id)).limit(200);
  }),
  createReceipt: adminQuery
    .input(
      z.object({
        voucherNo: z.string(),
        payer: z.string(),
        amount: z.number(),
        description: z.string().optional(),
        status: z.string().default("draft"),
        date: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const data = {
        voucherNumber: input.voucherNo,
        voucherDate: new Date(input.date),
        payerName: input.payer,
        payerType: "other" as const,
        amount: input.amount.toString(),
        description: input.description,
        status: input.status as "draft" | "approved" | "received" | "cancelled",
      };
      const result = await getDb().insert(receiptVouchers).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
});
