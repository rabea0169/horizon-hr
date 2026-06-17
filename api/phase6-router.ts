// ═══════════════════════════════════════════════════════════════
//  Phase 6: Full Accounting System
//  Chart of Accounts + Treasury + Opening Balances + General Ledger
//  Credit Limits + Aging + Integration Engine
// ═══════════════════════════════════════════════════════════════

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, desc, count, sql } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  accounts,
  openingBalances,
  treasuryAccounts,
  treasuryTransactions,
  generalLedger,
  creditLimits,
  agingBuckets,
  integrationLogs,
  fiscalYears,
  crmCustomers,
  inventoryTransactions,
  finishedGoods,
  salesInvoices,
  salesOrders,
  salesRepOrders,
} from "@db/schema";

// ─── Chart of Accounts Router ───
export const accountRouter = createRouter({
  list: authedQuery
    .input(z.object({ type: z.string().optional(), category: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.type) conditions.push(eq(accounts.type, input.type as "asset" | "liability" | "equity" | "revenue" | "expense" | "cost_of_sales"));
      if (input?.category) conditions.push(eq(accounts.category, input.category as "current_asset" | "fixed_asset" | "current_liability" | "long_term_liability" | "equity" | "revenue" | "expense" | "cost_of_sales" | "other_income" | "other_expense"));
      if (input?.search) {
        conditions.push(sql`(${accounts.name} LIKE ${"%" + input.search + "%"} OR ${accounts.code} LIKE ${"%" + input.search + "%"})`);
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(accounts).where(where).orderBy(accounts.code);
    }),

  getById: authedQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    const rows = await db.select().from(accounts).where(eq(accounts.id, input.id)).limit(1);
    return rows[0] ?? null;
  }),

  create: adminQuery
    .input(z.object({
      code: z.string(), name: z.string(), nameEn: z.string().optional(),
      type: z.enum(["asset", "liability", "equity", "revenue", "expense", "cost_of_sales"]),
      category: z.enum([
        "current_asset", "fixed_asset", "current_liability", "long_term_liability",
        "equity", "revenue", "expense", "cost_of_sales", "other_income", "other_expense",
      ]),
      parentId: z.number().optional(), level: z.number().default(1),
      isLeaf: z.boolean().default(true), openingBalance: z.string().default("0"),
      currency: z.string().default("EGP"), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(accounts).values(input);
      return { id: Number(result[0].insertId) };
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(), name: z.string().optional(), nameEn: z.string().optional(),
      isActive: z.boolean().optional(), openingBalance: z.string().optional(),
      currentBalance: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...data } = input;
      await db.update(accounts).set(data).where(eq(accounts.id, id));
      return { success: true };
    }),

  delete: adminQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    await db.delete(accounts).where(eq(accounts.id, input.id));
    return { success: true };
  }),

  // Trial Balance (ميزان المراجعة)
  trialBalance: authedQuery
    .input(z.object({ fiscalYear: z.string(), period: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select({
        accountId: generalLedger.accountId,
        totalDebit: sql`COALESCE(SUM(${generalLedger.debit}), 0)`,
        totalCredit: sql`COALESCE(SUM(${generalLedger.credit}), 0)`,
      }).from(generalLedger)
        .where(sql`${generalLedger.fiscalYear} = ${input.fiscalYear}`)
        .groupBy(generalLedger.accountId);

      // Join with accounts
      const creditNormal = new Set(["liability", "equity", "revenue"]);
      const allAccounts = await db.select().from(accounts).where(eq(accounts.isActive, true));
      return allAccounts.map((acc: typeof allAccounts[0]) => {
        const gl = rows.find((r: any) => r.accountId === acc.id);
        const opening = parseFloat(acc.openingBalance?.toString() || "0");
        const debit = parseFloat(gl?.totalDebit?.toString() || "0");
        const credit = parseFloat(gl?.totalCredit?.toString() || "0");
        const balance = creditNormal.has(acc.type)
          ? opening + credit - debit
          : opening + debit - credit;
        return {
          ...acc,
          openingBalance: opening,
          totalDebit: debit,
          totalCredit: credit,
          balance,
        };
      });
    }),

  // Financial Statements
  incomeStatement: authedQuery
    .input(z.object({ fiscalYear: z.string(), fromDate: z.string().optional(), toDate: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [eq(generalLedger.fiscalYear, input.fiscalYear)];
      if (input.fromDate) conditions.push(sql`${generalLedger.date} >= ${input.fromDate}`);
      if (input.toDate) conditions.push(sql`${generalLedger.date} <= ${input.toDate}`);

      const rows = await db.select({
        accountId: generalLedger.accountId,
        totalDebit: sql`COALESCE(SUM(${generalLedger.debit}), 0)`,
        totalCredit: sql`COALESCE(SUM(${generalLedger.credit}), 0)`,
      }).from(generalLedger)
        .where(and(...conditions))
        .groupBy(generalLedger.accountId);

      const allAccounts = await db.select().from(accounts).where(eq(accounts.isActive, true));

      const revenue = allAccounts.filter((a: typeof allAccounts[0]) => a.type === "revenue");
      const costOfSales = allAccounts.filter((a: typeof allAccounts[0]) => a.category === "cost_of_sales");
      const expenses = allAccounts.filter((a: typeof allAccounts[0]) => a.type === "expense");
      const otherIncome = allAccounts.filter((a: typeof allAccounts[0]) => a.category === "other_income");
      const otherExpense = allAccounts.filter((a: typeof allAccounts[0]) => a.category === "other_expense");

      const getBalance = (acc: typeof allAccounts[0]) => {
        const gl = rows.find((r: any) => r.accountId === acc.id);
        const debit = parseFloat(gl?.totalDebit?.toString() || "0");
        const credit = parseFloat(gl?.totalCredit?.toString() || "0");
        return credit - debit; // Revenue is credit
      };

      type RowT = { accountId: number; totalDebit: unknown; totalCredit: unknown };
      const totalRevenue = revenue.reduce((s: number, a: typeof allAccounts[0]) => s + getBalance(a), 0);
      const totalCOS = costOfSales.reduce((s: number, a: typeof allAccounts[0]) => s + (parseFloat(rows.find((r: RowT) => r.accountId === a.id)?.totalDebit?.toString() || "0") - parseFloat(rows.find((r: RowT) => r.accountId === a.id)?.totalCredit?.toString() || "0")), 0);
      const grossProfit = totalRevenue - totalCOS;
      const totalExpenses = expenses.reduce((s: number, a: typeof allAccounts[0]) => s + (parseFloat(rows.find((r: RowT) => r.accountId === a.id)?.totalDebit?.toString() || "0") - parseFloat(rows.find((r: RowT) => r.accountId === a.id)?.totalCredit?.toString() || "0")), 0);
      const totalOtherIncome = otherIncome.reduce((s: number, a: typeof allAccounts[0]) => s + getBalance(a), 0);
      const totalOtherExpense = otherExpense.reduce((s: number, a: typeof allAccounts[0]) => s + (parseFloat(rows.find((r: RowT) => r.accountId === a.id)?.totalDebit?.toString() || "0") - parseFloat(rows.find((r: RowT) => r.accountId === a.id)?.totalCredit?.toString() || "0")), 0);
      const netIncome = grossProfit - totalExpenses + totalOtherIncome - totalOtherExpense;

      return {
        revenue: totalRevenue, costOfSales: totalCOS, grossProfit,
        expenses: totalExpenses, otherIncome: totalOtherIncome, otherExpense: totalOtherExpense, netIncome,
      };
    }),

  // Balance Sheet
  balanceSheet: authedQuery
    .input(z.object({ fiscalYear: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const glRows = await db.select({
        accountId: generalLedger.accountId,
        totalDebit: sql`COALESCE(SUM(${generalLedger.debit}), 0)`,
        totalCredit: sql`COALESCE(SUM(${generalLedger.credit}), 0)`,
      }).from(generalLedger)
        .where(sql`${generalLedger.fiscalYear} = ${input.fiscalYear}`)
        .groupBy(generalLedger.accountId);

      const allAccounts = await db.select().from(accounts).where(eq(accounts.isActive, true));

      const currentAssets = allAccounts.filter((a: typeof allAccounts[0]) => a.category === "current_asset");
      const fixedAssets = allAccounts.filter((a: typeof allAccounts[0]) => a.category === "fixed_asset");
      const currentLiabilities = allAccounts.filter((a: typeof allAccounts[0]) => a.category === "current_liability");
      const longTermLiabilities = allAccounts.filter((a: typeof allAccounts[0]) => a.category === "long_term_liability");
      const equityAccounts = allAccounts.filter((a: typeof allAccounts[0]) => a.category === "equity");

      const getBalance = (acc: typeof allAccounts[0]) => {
        const opening = parseFloat(acc.openingBalance?.toString() || "0");
        const gl = glRows.find((r: any) => r.accountId === acc.id);
        const debit = parseFloat(gl?.totalDebit?.toString() || "0");
        const credit = parseFloat(gl?.totalCredit?.toString() || "0");
        return opening + debit - credit;
      };

      const totalCurrentAssets = currentAssets.reduce((s: number, a: typeof allAccounts[0]) => s + getBalance(a), 0);
      const totalFixedAssets = fixedAssets.reduce((s: number, a: typeof allAccounts[0]) => s + getBalance(a), 0);
      const totalAssets = totalCurrentAssets + totalFixedAssets;
      const totalCurrentLiabilities = currentLiabilities.reduce((s: number, a: typeof allAccounts[0]) => s + Math.abs(getBalance(a)), 0);
      const totalLongTermLiabilities = longTermLiabilities.reduce((s: number, a: typeof allAccounts[0]) => s + Math.abs(getBalance(a)), 0);
      const totalEquity = equityAccounts.reduce((s: number, a: typeof allAccounts[0]) => s + Math.abs(getBalance(a)), 0);
      const totalLiabilitiesAndEquity = totalCurrentLiabilities + totalLongTermLiabilities + totalEquity;

      return {
        currentAssets: totalCurrentAssets, fixedAssets: totalFixedAssets, totalAssets,
        currentLiabilities: totalCurrentLiabilities, longTermLiabilities: totalLongTermLiabilities,
        totalLiabilities: totalCurrentLiabilities + totalLongTermLiabilities,
        equity: totalEquity, totalLiabilitiesAndEquity,
        details: {
          currentAssetDetails: currentAssets.map((a: typeof allAccounts[0]) => ({ name: a.name, balance: getBalance(a) })),
          currentLiabilityDetails: currentLiabilities.map((a: typeof allAccounts[0]) => ({ name: a.name, balance: Math.abs(getBalance(a)) })),
        },
      };
    }),
});

// ─── Opening Balances Router ───
export const openingBalanceRouter = createRouter({
  list: authedQuery
    .input(z.object({ fiscalYear: z.string() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const where = input ? eq(openingBalances.fiscalYear, input.fiscalYear) : undefined;
      return db.select().from(openingBalances).where(where).orderBy(desc(openingBalances.createdAt));
    }),

  create: adminQuery
    .input(z.object({
      fiscalYear: z.string(), accountId: z.number(),
      debit: z.string().default("0"), credit: z.string().default("0"),
      reference: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const debit = parseFloat(input.debit) || 0;
      const credit = parseFloat(input.credit) || 0;
      const result = await db.insert(openingBalances).values({
        ...input, debit: debit.toString(), credit: credit.toString(),
        balance: (debit - credit).toString(),
      });
      return { id: Number(result[0].insertId) };
    }),

  post: adminQuery
    .input(z.object({ id: z.number(), postedBy: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(openingBalances)
        .set({ posted: true, postedAt: new Date(), postedBy: input.postedBy })
        .where(eq(openingBalances.id, input.id));

      // Also update account opening balance
      const ob = await db.select().from(openingBalances).where(eq(openingBalances.id, input.id)).limit(1);
      if (ob[0]) {
        await db.update(accounts)
          .set({ openingBalance: ob[0].balance.toString() })
          .where(eq(accounts.id, ob[0].accountId));
      }
      return { success: true };
    }),
});

// ─── Treasury Router ───
export const treasuryRouter = createRouter({
  listAccounts: authedQuery.query(async () => {
    const db = await getDb();
    return db.select().from(treasuryAccounts).orderBy(desc(treasuryAccounts.isDefault));
  }),

  getAccount: authedQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    const rows = await db.select().from(treasuryAccounts).where(eq(treasuryAccounts.id, input.id)).limit(1);
    return rows[0] ?? null;
  }),

  createAccount: adminQuery
    .input(z.object({
      name: z.string(), code: z.string(), type: z.enum(["cash", "bank", "check", "other"]),
      bankName: z.string().optional(), accountNumber: z.string().optional(),
      iban: z.string().optional(), branch: z.string().optional(),
      currency: z.string().default("EGP"), openingBalance: z.string().default("0"),
      accountId: z.number().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(treasuryAccounts).values({
        ...input, currentBalance: input.openingBalance,
      });
      return { id: Number(result[0].insertId) };
    }),

  // Transactions
  listTransactions: authedQuery
    .input(z.object({ treasuryAccountId: z.number().optional(), type: z.string().optional(), fromDate: z.string().optional(), toDate: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.treasuryAccountId) conditions.push(eq(treasuryTransactions.treasuryAccountId, input.treasuryAccountId));
      if (input?.type) conditions.push(eq(treasuryTransactions.type, input.type as "receipt" | "payment" | "transfer_in" | "transfer_out"));
      if (input?.fromDate) conditions.push(sql`${treasuryTransactions.date} >= ${input.fromDate}`);
      if (input?.toDate) conditions.push(sql`${treasuryTransactions.date} <= ${input.toDate}`);
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(treasuryTransactions).where(where).orderBy(desc(treasuryTransactions.createdAt));
    }),

  createTransaction: adminQuery
      .input(z.object({
        treasuryAccountId: z.number(), type: z.enum(["receipt", "payment", "transfer_in", "transfer_out"]),
        amount: z.string(), reference: z.string().optional(),
        date: z.string(), fiscalYear: z.string().optional(), paymentMethod: z.enum(["cash", "bank", "check", "card", "transfer"]).optional(),
        documentId: z.number().optional(), documentNumber: z.string().optional(),
        partyType: z.enum(["customer", "supplier", "employee", "other"]).optional(),
        partyName: z.string().optional(), description: z.string().optional(),
        debitAccountId: z.number().optional(), creditAccountId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
      return await db.transaction(async (tx) => {
        const [result] = await tx.insert(treasuryTransactions).values({
          ...input,
          date: new Date(input.date),
        });

        // Update treasury account balance
        const amount = parseFloat(input.amount);
        const isIn = ["receipt", "transfer_in"].includes(input.type);
        await tx.update(treasuryAccounts)
          .set({ currentBalance: sql`${treasuryAccounts.currentBalance} ${isIn ? "+" : "-"} ${amount}` })
          .where(eq(treasuryAccounts.id, input.treasuryAccountId));

        // Create GL entry
        const fiscalYear = input.fiscalYear || new Date(input.date).getFullYear().toString();
        await tx.insert(generalLedger).values({
          entryId: `TRX-${Date.now()}`, lineNumber: 1, date: new Date(input.date),
          accountId: input.debitAccountId || 1, debit: isIn ? input.amount : "0",
          credit: isIn ? "0" : input.amount,
          sourceType: "treasury", sourceId: Number(result.insertId),
          sourceNumber: input.documentNumber || input.reference,
          partyName: input.partyName, description: input.description,
          fiscalYear, period: new Date(input.date).toISOString().slice(0, 7),
          createdBy: ctx.user?.id || 1,
        });

        return { id: Number(result.insertId) };
      });
    }),

  // Cash flow summary
  cashFlow: authedQuery
    .input(z.object({ fromDate: z.string(), toDate: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const receipts = await db.select({
        total: sql`COALESCE(SUM(${treasuryTransactions.amount}), 0)`,
        count: count(),
      }).from(treasuryTransactions)
        .where(and(
          eq(treasuryTransactions.type, "receipt"),
          sql`${treasuryTransactions.date} >= ${input.fromDate}`,
          sql`${treasuryTransactions.date} <= ${input.toDate}`,
        ));

      const payments = await db.select({
        total: sql`COALESCE(SUM(${treasuryTransactions.amount}), 0)`,
        count: count(),
      }).from(treasuryTransactions)
        .where(and(
          eq(treasuryTransactions.type, "payment"),
          sql`${treasuryTransactions.date} >= ${input.fromDate}`,
          sql`${treasuryTransactions.date} <= ${input.toDate}`,
        ));

      const byAccount = await db.select({
        accountId: treasuryTransactions.treasuryAccountId,
        type: treasuryTransactions.type,
        total: sql`COALESCE(SUM(${treasuryTransactions.amount}), 0)`,
      }).from(treasuryTransactions)
        .where(and(
          sql`${treasuryTransactions.date} >= ${input.fromDate}`,
          sql`${treasuryTransactions.date} <= ${input.toDate}`,
        ))
        .groupBy(treasuryTransactions.treasuryAccountId, treasuryTransactions.type);

      return {
        receipts: receipts[0],
        payments: payments[0],
        netFlow: parseFloat(receipts[0]?.total?.toString() || "0") - parseFloat(payments[0]?.total?.toString() || "0"),
        byAccount,
      };
    }),
});

// ─── General Ledger Router ───
export const generalLedgerRouter = createRouter({
  list: authedQuery
    .input(z.object({
      accountId: z.number().optional(), fiscalYear: z.string().optional(),
      fromDate: z.string().optional(), toDate: z.string().optional(),
      sourceType: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const conditions = [];
      if (input?.accountId) conditions.push(eq(generalLedger.accountId, input.accountId));
      if (input?.fiscalYear) conditions.push(eq(generalLedger.fiscalYear, input.fiscalYear));
      if (input?.fromDate) conditions.push(sql`${generalLedger.date} >= ${input.fromDate}`);
      if (input?.toDate) conditions.push(sql`${generalLedger.date} <= ${input.toDate}`);
      if (input?.sourceType) conditions.push(eq(generalLedger.sourceType, input.sourceType as "manual_journal" | "sales_invoice" | "purchase_invoice" | "expense" | "payment_voucher" | "receipt_voucher" | "payroll" | "inventory_in" | "inventory_out" | "transfer" | "opening_balance" | "grn" | "challan" | "finished_goods" | "wastage" | "treasury"));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(generalLedger).where(where).orderBy(desc(generalLedger.createdAt));
    }),

  createEntry: adminQuery
    .input(z.object({
      entryId: z.string(), date: z.string(), fiscalYear: z.string(), period: z.string(),
      lines: z.array(z.object({
        accountId: z.number(), debit: z.string().default("0"), credit: z.string().default("0"),
        description: z.string().optional(), sourceType: z.string().optional(),
        sourceId: z.number().optional(), sourceNumber: z.string().optional(),
        partyName: z.string().optional(),
      })),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // Validate balanced entry
      const totalDebit = input.lines.reduce((s, l) => s + parseFloat(l.debit || "0"), 0);
      const totalCredit = input.lines.reduce((s, l) => s + parseFloat(l.credit || "0"), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.001) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Entry is not balanced: Debit = " + totalDebit + ", Credit = " + totalCredit });
      }

      return await db.transaction(async (tx) => {
        await tx.insert(generalLedger).values(
          input.lines.map((l, i) => ({
            entryId: input.entryId, lineNumber: i + 1, date: new Date(input.date),
            accountId: l.accountId, debit: l.debit, credit: l.credit,
            description: l.description, sourceType: l.sourceType as "manual_journal",
            sourceId: l.sourceId, sourceNumber: l.sourceNumber,
            partyName: l.partyName, fiscalYear: input.fiscalYear, period: input.period,
            notes: input.notes, createdBy: ctx.user?.id || 1,
          }))
        );

        // Update account balances based on account type
        const creditNormal = new Set(["liability", "equity", "revenue"]);
        for (const line of input.lines) {
          const debit = parseFloat(line.debit || "0");
          const credit = parseFloat(line.credit || "0");
          const acc = await tx.select({ type: accounts.type }).from(accounts).where(eq(accounts.id, line.accountId)).limit(1);
          const sign = acc[0] && creditNormal.has(acc[0].type) ? 1 : -1;
          await tx.update(accounts)
            .set({ currentBalance: sql`${accounts.currentBalance} + ${credit * sign} - ${debit * sign}` })
            .where(eq(accounts.id, line.accountId));
        }

        return { id: input.entryId, linesInserted: input.lines.length };
      });
    }),
});

// ─── Credit Limit Router ───
export const creditLimitRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = await getDb();
    return db.select().from(creditLimits).orderBy(desc(creditLimits.createdAt));
  }),

  getByCustomer: authedQuery.input(z.object({ customerId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    const rows = await db.select().from(creditLimits).where(eq(creditLimits.customerId, input.customerId)).limit(1);
    return rows[0] ?? null;
  }),

  create: adminQuery
    .input(z.object({
      customerId: z.number(), creditLimit: z.string(), paymentTermDays: z.number().default(30),
      warningPercent: z.string().default("80"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(creditLimits).values(input);
      return { id: Number(result[0].insertId) };
    }),

  updateBalance: adminQuery
    .input(z.object({ customerId: z.number(), amount: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const amt = parseFloat(input.amount);
      await db.update(creditLimits)
        .set({
          currentBalance: sql`${creditLimits.currentBalance} + ${amt}`,
          totalInvoiced: sql`${creditLimits.totalInvoiced} + ${amt}`,
        })
        .where(eq(creditLimits.customerId, input.customerId));
      return { success: true };
    }),

  checkLimit: authedQuery
    .input(z.object({ customerId: z.number(), requestedAmount: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const rows = await db.select().from(creditLimits)
        .where(eq(creditLimits.customerId, input.customerId)).limit(1);
      const cl = rows[0];
      if (!cl) return { allowed: true, message: "No credit limit set", usage: 0 };

      const limit = parseFloat(cl.creditLimit?.toString() || "0");
      const current = parseFloat(cl.currentBalance?.toString() || "0");
      const requested = parseFloat(input.requestedAmount);
      const afterRequest = current + requested;
      const warning = parseFloat(cl.warningPercent?.toString() || "80");
      const usage = limit > 0 ? (afterRequest / limit) * 100 : 0;

      if (limit > 0 && afterRequest > limit) {
        return { allowed: false, message: "Credit limit exceeded", usage, limit, current, remaining: limit - current };
      }
      if (usage >= warning) {
        return { allowed: true, message: "Warning: Approaching credit limit", usage, limit, current, remaining: limit - current };
      }
      return { allowed: true, message: "OK", usage, limit, current, remaining: limit - current };
    }),
});

// ─── Aging Router ───
export const agingRouter = createRouter({
  list: authedQuery
    .input(z.object({ customerId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const where = input?.customerId ? eq(agingBuckets.customerId, input.customerId) : undefined;
      return db.select().from(agingBuckets).where(where).orderBy(desc(agingBuckets.invoiceDate));
    }),

  calculate: adminQuery
    .input(z.object({ customerId: z.number().optional(), asOfDate: z.string() }))
    .query(async ({ input }) => {
      // This calculates aging from sales_invoices
      const db = await getDb();

      // Get all unpaid invoices
      const invoices = await db.select().from(salesInvoices)
        .where(and(
          input.customerId ? eq(salesInvoices.customerId, input.customerId) : undefined,
          gte(salesInvoices.status, "issued"),
          sql`${salesInvoices.amountPaid} < ${salesInvoices.totalAmount}`,
        ));

      const asOf = new Date(input.asOfDate);
      type InvoiceRow = typeof salesInvoices.$inferSelect;
      const buckets: Array<{
        invoiceId: number; invoiceNumber: string; customerId: number;
        invoiceDate: Date | string | null; dueDate: Date | string | null;
        amount: number; amountPaid: number; balance: number;
        bucket1_30: number; bucket31_60: number; bucket61_90: number; bucket90_plus: number;
        daysOverdue: number;
      }> = (invoices as InvoiceRow[]).map((inv: InvoiceRow) => {
        const due = new Date(inv.dueDate || inv.issueDate || "0");
        const daysOverdue = Math.floor((asOf.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        const balance = parseFloat(inv.totalAmount?.toString() || "0") - parseFloat(inv.amountPaid?.toString() || "0");

        return {
          invoiceId: inv.id, invoiceNumber: inv.invoiceNumber,
          customerId: inv.customerId, invoiceDate: inv.issueDate, dueDate: inv.dueDate,
          amount: parseFloat(inv.totalAmount?.toString() || "0"),
          amountPaid: parseFloat(inv.amountPaid?.toString() || "0"),
          balance: balance,
          bucket1_30: daysOverdue > 0 && daysOverdue <= 30 ? balance : 0,
          bucket31_60: daysOverdue > 30 && daysOverdue <= 60 ? balance : 0,
          bucket61_90: daysOverdue > 60 && daysOverdue <= 90 ? balance : 0,
          bucket90_plus: daysOverdue > 90 ? balance : 0,
          daysOverdue: Math.max(0, daysOverdue),
        };
      });

      // Aggregate by customer
      const customerMap = new Map<number, typeof buckets>();
      buckets.forEach(b => {
        const arr = customerMap.get(b.customerId) || [];
        arr.push(b);
        customerMap.set(b.customerId, arr);
      });

      type BucketRow = typeof buckets[number];
      const summary = Array.from(customerMap.entries()).map(([custId, invs]: [number, BucketRow[]]) => ({
        customerId: custId,
        totalBalance: invs.reduce((s: number, i: BucketRow) => s + i.balance, 0),
        bucket1_30: invs.reduce((s: number, i: BucketRow) => s + i.bucket1_30, 0),
        bucket31_60: invs.reduce((s: number, i: BucketRow) => s + i.bucket31_60, 0),
        bucket61_90: invs.reduce((s: number, i: BucketRow) => s + i.bucket61_90, 0),
        bucket90_plus: invs.reduce((s: number, i: BucketRow) => s + i.bucket90_plus, 0),
        invoices: invs,
      }));

      return { summary, details: buckets };
    }),
});

// ─── Integration Engine Router ───
export const integrationRouter = createRouter({
  listLogs: authedQuery
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const where = input?.status ? eq(integrationLogs.status, input.status as "success" | "failed" | "pending") : undefined;
      return db.select().from(integrationLogs).where(where).orderBy(desc(integrationLogs.createdAt));
    }),

  // Trigger: When GRN is received → Update inventory + Create GL entry
  grnReceived: adminQuery
    .input(z.object({ grnId: z.number(), grnNumber: z.string(), itemId: z.number(), quantity: z.number(), unitCost: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      return await db.transaction(async (tx) => {
        // Log the integration event
        await tx.insert(integrationLogs).values({
          event: "grn_received", sourceModule: "grn", targetModule: "inventory+gl",
          sourceId: input.grnId, sourceNumber: input.grnNumber,
          status: "success",
          details: `Received ${input.quantity} units of item ${input.itemId} at ${input.unitCost}`,
        });

        // Create inventory transaction
        await tx.insert(inventoryTransactions).values({
          itemId: input.itemId, type: "in", quantity: input.quantity,
          referenceType: "grn", referenceId: input.grnId,
          notes: `GRN ${input.grnNumber}`,
        });

        // Create GL entry for inventory increase
        const totalCost = (parseFloat(input.unitCost) * input.quantity).toFixed(2);
        const invAccount = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.code, "121000")).limit(1);
        const apAccount = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.code, "211000")).limit(1);
        const invId = invAccount[0]?.id || 1;
        const apId = apAccount[0]?.id || 2;
        const now = new Date();
        const fiscalYear = now.getFullYear().toString();
        const period = now.toISOString().slice(0, 7);
        await tx.insert(generalLedger).values([
          { entryId: `GRN-${input.grnId}-${Date.now()}`, lineNumber: 1, date: now, accountId: invId, debit: totalCost, credit: "0", sourceType: "grn", sourceId: input.grnId, sourceNumber: input.grnNumber, description: "Inventory received", fiscalYear, period, createdBy: ctx.user?.id || 1 },
          { entryId: `GRN-${input.grnId}-${Date.now()}`, lineNumber: 2, date: now, accountId: apId, debit: "0", credit: totalCost, sourceType: "grn", sourceId: input.grnId, sourceNumber: input.grnNumber, description: "Accounts payable - GRN", fiscalYear, period, createdBy: ctx.user?.id || 1 },
        ]);

        return { success: true, inventoryUpdated: true, glEntry: true };
      });
    }),

  // Trigger: When Production completed → Create Finished Goods
  productionCompleted: adminQuery
    .input(z.object({ orderId: z.number(), orderNumber: z.string(), modelId: z.number(), modelName: z.string(), quantity: z.number(), warehouseId: z.number(), unitCost: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      return await db.transaction(async (tx) => {
        await tx.insert(integrationLogs).values({
          event: "production_completed", sourceModule: "production", targetModule: "finished_goods+gl",
          sourceId: input.orderId, sourceNumber: input.orderNumber,
          status: "success",
          details: `Produced ${input.quantity} units of ${input.modelName}`,
        });

        // Create finished goods record
        const sku = `FG-${input.modelId}-${Date.now()}`;
        await tx.insert(finishedGoods).values({
          sku, modelId: input.modelId, modelName: input.modelName,
          color: "", size: "", warehouseId: input.warehouseId,
          quantity: input.quantity, availableQty: input.quantity, reservedQty: 0,
          unitCost: input.unitCost, totalCost: (parseFloat(input.unitCost) * input.quantity).toFixed(2),
          productionDate: new Date(),
          status: "in_stock",
        });

        // GL Entry: Transfer from WIP to Finished Goods
        const fgAccount = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.code, "125000")).limit(1);
        const wipAccount = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.code, "141000")).limit(1);
        const fgId = fgAccount[0]?.id || 3;
        const wipId = wipAccount[0]?.id || 4;
        const now = new Date();
        const fiscalYear = now.getFullYear().toString();
        const period = now.toISOString().slice(0, 7);
        await tx.insert(generalLedger).values([
          { entryId: `PROD-${input.orderId}-${Date.now()}`, lineNumber: 1, date: now, accountId: fgId, debit: input.unitCost, credit: "0", sourceType: "finished_goods", sourceId: input.orderId, sourceNumber: input.orderNumber, description: "Finished goods produced", fiscalYear, period, createdBy: ctx.user?.id || 1 },
          { entryId: `PROD-${input.orderId}-${Date.now()}`, lineNumber: 2, date: now, accountId: wipId, debit: "0", credit: input.unitCost, sourceType: "finished_goods", sourceId: input.orderId, sourceNumber: input.orderNumber, description: "Work in progress reduced", fiscalYear, period, createdBy: ctx.user?.id || 1 },
        ]);

        return { success: true };
      });
    }),

  // Trigger: When Sales Rep Order submitted → Create Sales Order
  salesRepOrderSubmitted: adminQuery
    .input(z.object({ repOrderId: z.number(), repOrderNumber: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();

      return await db.transaction(async (tx) => {
        const repOrders = await tx.select().from(salesRepOrders).where(eq(salesRepOrders.id, input.repOrderId)).limit(1);
        if (!repOrders[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        const ro = repOrders[0];

        // Create or find customer
        let customerId = ro.customerId;
        if (!customerId) {
          const custResult = await tx.insert(crmCustomers).values({
            name: ro.customerName, phone: ro.customerPhone,
            address: ro.customerAddress, status: "active",
          });
          customerId = Number(custResult[0].insertId);
        }

        // Create sales order
        const soResult = await tx.insert(salesOrders).values({
          orderNumber: ro.orderNumber, customerId, modelId: ro.modelId,
          quantity: ro.quantity, unitPrice: ro.unitPrice?.toString() || "0",
          totalAmount: ro.grandTotal?.toString() || "0",
          orderDate: new Date(),
          deliveryDate: ro.deliveryDate ? new Date(ro.deliveryDate) : undefined,
          status: "confirmed",
        });
        const salesOrderId = Number(soResult[0].insertId);

        // Update sales rep order
        await tx.update(salesRepOrders)
          .set({ syncedToErp: true, erpOrderId: salesOrderId, status: "approved" })
          .where(eq(salesRepOrders.id, input.repOrderId));

        await tx.insert(integrationLogs).values({
          event: "rep_order_synced", sourceModule: "sales_rep", targetModule: "sales_order",
          sourceId: input.repOrderId, targetId: salesOrderId,
          sourceNumber: input.repOrderNumber, targetNumber: ro.orderNumber,
          status: "success",
        });

        return { success: true, salesOrderId };
      });
    }),
});

// ─── Fiscal Year Router ───
export const fiscalYearRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = await getDb();
    return db.select().from(fiscalYears).orderBy(desc(fiscalYears.startDate));
  }),

  create: adminQuery
    .input(z.object({ name: z.string(), startDate: z.string(), endDate: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.insert(fiscalYears).values({
        name: input.name,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });
      return { id: Number(result[0].insertId) };
    }),

  close: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(fiscalYears).set({ status: "closed" }).where(eq(fiscalYears.id, input.id));
      return { success: true };
    }),
});


