import { createRouter, authedQuery, adminQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { salesInvoices, purchaseInvoices } from "@db/schema";
import { desc } from "drizzle-orm";

export const invoiceRouter = createRouter({
  listSales: authedQuery
    .input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const page = input?.page;
      const pageSize = input?.pageSize;
      const q = getDb().select().from(salesInvoices).orderBy(desc(salesInvoices.id));
      if (page && pageSize) {
        return q.limit(pageSize).offset((page - 1) * pageSize);
      }
      return q.limit(200);
    }),
  createSales: adminQuery
    .input(
      z.object({
        invoiceNo: z.string(),
        customerId: z.number(),
        orderId: z.number().optional(),
        amount: z.number(),
        vat: z.number().default(0),
        total: z.number(),
        status: z.string().default("draft"),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {
        invoiceNumber: input.invoiceNo,
        customerId: input.customerId,
        salesOrderId: input.orderId ?? 0,
        subtotal: input.amount.toString(),
        vatAmount: input.vat.toString(),
        totalAmount: input.total.toString(),
        status: input.status,
        issueDate: new Date(),
      };
      if (input.dueDate) data.dueDate = new Date(input.dueDate);
      const result = await getDb().insert(salesInvoices).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
  listPurchase: authedQuery
    .input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const page = input?.page;
      const pageSize = input?.pageSize;
      const q = getDb().select().from(purchaseInvoices).orderBy(desc(purchaseInvoices.id));
      if (page && pageSize) {
        return q.limit(pageSize).offset((page - 1) * pageSize);
      }
      return q.limit(200);
    }),
  createPurchase: adminQuery
    .input(
      z.object({
        invoiceNo: z.string(),
        supplierId: z.number(),
        grnId: z.number(),
        amount: z.number(),
        vat: z.number().default(0),
        total: z.number(),
        status: z.string().default("draft"),
      })
    )
    .mutation(async ({ input }) => {
      const data: any = {
        invoiceNumber: input.invoiceNo,
        supplierId: input.supplierId,
        grnId: input.grnId,
        subtotal: input.amount.toString(),
        vatAmount: input.vat.toString(),
        totalAmount: input.total.toString(),
        status: input.status,
        issueDate: new Date(),
      };
      const result = await getDb().insert(purchaseInvoices).values(data).$returningId();
      return { id: result[0]?.id ?? 0, ...input };
    }),
});
