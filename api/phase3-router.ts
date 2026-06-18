import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { employees, attendance, productionOrders, dailyProduction, bundleTracking, bundles, machines, activities, users, productionLines, payrollRecords, advances, pieceRateRecords, systemSettings, inventoryItems } from "@db/schema";
import type { InsertBundleTracking, InsertActivity } from "@db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// ─── Mobile App API ───
export const mobileRouter = createRouter({
  // Employee self-service: view own profile
  myProfile: authedQuery
    .input(z.object({ employeeCode: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const emp = await db.query.employees.findFirst({
        where: eq(employees.employeeCode, input.employeeCode),
        with: { department: true, manager: true },
      });
      if (!emp) throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
      return emp;
    }),

  // Employee self-service: view own attendance
  myAttendance: authedQuery
    .input(z.object({ employeeId: z.number(), startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.attendance.findMany({
        where: and(
          eq(attendance.employeeId, input.employeeId),
          gte(attendance.date, new Date(input.startDate))
        ),
        orderBy: desc(attendance.date),
      });
    }),

  // Employee self-service: view own payroll
  myPayroll: authedQuery
    .input(z.object({ employeeId: z.number(), month: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const payroll = await db.select().from(payrollRecords)
        .where(and(
          eq(payrollRecords.employeeId, input.employeeId),
          eq(payrollRecords.month, input.month)
        ));
      const advancesList = await db.select().from(advances)
        .where(and(
          eq(advances.employeeId, input.employeeId),
          eq(advances.status, "approved")
        ));
      const pieceRates = await db.select().from(pieceRateRecords)
        .where(sql`${pieceRateRecords.employeeId} = ${input.employeeId} AND DATE_FORMAT(${pieceRateRecords.date}, '%Y-%m') = ${input.month}`);
      const totalPieceRate = pieceRates.reduce((sum, p) => sum + parseFloat(p.totalAmount as unknown as string), 0);
      return { payroll: payroll[0] || null, advances: advancesList, pieceRates: totalPieceRate };
    }),

  // Employee self-service: clock in/out
  clockInOut: authedQuery
    .input(z.object({ employeeId: z.number(), type: z.enum(["in", "out"]), latitude: z.string().optional(), longitude: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (input.type === "in") {
        await db.insert(attendance).values({
          employeeId: input.employeeId,
          date: today,
          checkIn: new Date(),
          status: "present",
        });
        return { success: true, message: "Clock in recorded" };
      } else {
        await db.update(attendance)
          .set({ checkOut: new Date() })
          .where(and(eq(attendance.employeeId, input.employeeId), eq(attendance.date, today)));
        return { success: true, message: "Clock out recorded" };
      }
    }),

  // Dashboard summary for mobile
  dashboard: authedQuery.query(async () => {
    const db = getDb();
    const [empCount, orderCount, activeLines, todayProd] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.status, "active")),
      db.select({ count: sql<number>`count(*)` }).from(productionOrders).where(eq(productionOrders.status, "in_progress")),
      db.select({ count: sql<number>`count(*)` }).from(productionLines).where(eq(productionLines.status, "active")),
      db.select({ sum: sql<number>`COALESCE(SUM(produced), 0)` }).from(dailyProduction)
        .where(gte(dailyProduction.date, new Date(new Date().setHours(0, 0, 0, 0)))),
    ]);
    return {
      activeEmployees: empCount[0]?.count || 0,
      inProgressOrders: orderCount[0]?.count || 0,
      activeLines: activeLines[0]?.count || 0,
      todayProduction: todayProd[0]?.sum || 0,
    };
  }),
});

// ─── Biometric Device Integration ───
export const biometricRouter = createRouter({
  // Register a biometric device
  registerDevice: adminQuery
    .input(z.object({
      deviceCode: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(["fingerprint", "face", "card", "multimodal"]),
      brand: z.string(),
      model: z.string(),
      ipAddress: z.string().optional(),
      port: z.string().optional(),
      location: z.string().optional(),
      lineId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(machines).values({
        machineCode: input.deviceCode,
        name: input.name,
        type: input.type,
        brand: input.brand,
        model: input.model,
        lineId: input.lineId,
        status: "operational",
        notes: `IP: ${input.ipAddress || "N/A"}, Port: ${input.port || "N/A"}, Location: ${input.location || "N/A"}`,
      }).$returningId();
      return { success: true, deviceId: result.id };
    }),

  // Push attendance from biometric device
  pushAttendance: adminQuery
    .input(z.object({
      deviceCode: z.string(),
      employeeCode: z.string(),
      timestamp: z.string(),
      type: z.enum(["in", "out"]),
      method: z.enum(["fingerprint", "face", "card"]).default("fingerprint"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const emp = await db.query.employees.findFirst({
        where: eq(employees.employeeCode, input.employeeCode),
      });
      if (!emp) throw new TRPCError({ code: "NOT_FOUND", message: `Employee ${input.employeeCode} not found` });

      const ts = new Date(input.timestamp);
      const dateStr = ts.toISOString().split("T")[0];

      const existing = await db.query.attendance.findMany({
        where: and(eq(attendance.employeeId, emp.id), eq(attendance.date, new Date(dateStr))),
      });

      if (input.type === "in") {
        if (existing.length === 0) {
          await db.insert(attendance).values({
            employeeId: emp.id,
            date: new Date(dateStr),
            checkIn: ts,
            status: "present",
          });
        }
      } else {
        if (existing.length > 0) {
          await db.update(attendance).set({ checkOut: ts }).where(eq(attendance.id, existing[0].id));
        }
      }

      await db.insert(activities).values({
        action: "biometric_punch",
        entityType: "attendance",
        entityId: emp.id,
        description: `Biometric ${input.type} for ${emp.fullName} via ${input.method} at ${input.timestamp}`,
      });

      return { success: true, employeeName: emp.fullName };
    }),

  // Get device status
  deviceStatus: adminQuery.query(async () => {
    const db = getDb();
    const devices = await db.select().from(machines)
      .where(sql`${machines.type} IN ('fingerprint', 'face', 'card', 'multimodal')`);
    return devices.map((d) => ({
      id: d.id,
      code: d.machineCode,
      name: d.name,
      type: d.type,
      status: d.status,
      lastMaintenance: d.nextMaintenance,
    }));
  }),
});

// ─── Barcode/RFID Scanner API ───
export const barcodeRouter = createRouter({
  // Scan a bundle QR/barcode
  scanBundle: authedQuery
    .input(z.object({
      bundleCode: z.string(),
      stage: z.string(),
      lineId: z.number().optional(),
      employeeId: z.number().optional(),
      scannerType: z.enum(["qr", "barcode", "rfid"]).default("qr"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const bundle = await db.query.bundles.findFirst({
        where: eq(bundles.bundleCode, input.bundleCode),
      });
      if (!bundle) throw new TRPCError({ code: "NOT_FOUND", message: `Bundle ${input.bundleCode} not found` });

      await db.insert(bundleTracking).values({
        bundleId: bundle.id,
        stage: input.stage,
        lineId: input.lineId,
        employeeId: input.employeeId,
        scannedAt: new Date(),
      } as InsertBundleTracking);

      await db.update(bundles).set({
        currentStage: input.stage,
        currentLineId: input.lineId,
      }).where(eq(bundles.id, bundle.id));

      return { success: true, bundleId: bundle.id, previousStage: bundle.currentStage, newStage: input.stage };
    }),

  // Get bundle info by scanning
  getBundleByCode: authedQuery
    .input(z.object({ bundleCode: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.bundles.findFirst({
        where: eq(bundles.bundleCode, input.bundleCode),
        with: { model: true, line: true, tracking: true },
      });
    }),

  // Bulk scan (for RFID batch reads)
  bulkScan: adminQuery
    .input(z.object({
      bundleCodes: z.array(z.string()),
      stage: z.string(),
      lineId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const results = [];
      for (const code of input.bundleCodes) {
        const bundle = await db.query.bundles.findFirst({
          where: eq(bundles.bundleCode, code),
        });
        if (bundle) {
          await db.insert(bundleTracking).values({
            bundleId: bundle.id,
            stage: input.stage,
            lineId: input.lineId,
            scannedAt: new Date(),
          });
          await db.update(bundles).set({
            currentStage: input.stage,
            currentLineId: input.lineId,
          }).where(eq(bundles.id, bundle.id));
          results.push({ code, status: "scanned", bundleId: bundle.id });
        } else {
          results.push({ code, status: "not_found", bundleId: null });
        }
      }
      return { success: true, scanned: results.filter((r) => r.status === "scanned").length, failed: results.filter((r) => r.status === "not_found").length, details: results };
    }),

  // Generate QR code data for a bundle
  generateQR: adminQuery
    .input(z.object({ bundleId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const bundle = await db.query.bundles.findFirst({
        where: eq(bundles.id, input.bundleId),
        with: { model: true, workOrder: true },
      });
      if (!bundle) throw new TRPCError({ code: "NOT_FOUND", message: "Bundle not found" });
      const qrData = JSON.stringify({
        bundleCode: bundle.bundleCode,
        model: bundle.model?.name,
        size: bundle.size,
        color: bundle.color,
        quantity: bundle.quantity,
        scanUrl: `/api/scan?code=${bundle.bundleCode}`,
      });
      return { bundleCode: bundle.bundleCode, qrData, base64: Buffer.from(qrData).toString("base64") };
    }),
});

// ─── Notifications System ───
export const notificationRouter = createRouter({
  // Send in-app notification
  sendInApp: adminQuery
    .input(z.object({
      userId: z.number().optional(),
      userIds: z.array(z.number()).optional(),
      title: z.string().min(1),
      message: z.string().min(1),
      type: z.enum(["info", "warning", "error", "success"]).default("info"),
      link: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const targets = input.userIds || (input.userId ? [input.userId] : []);
      if (targets.length === 0) {
        // Broadcast to all users
        const allUsers = await db.select().from(users);
        for (const u of allUsers) {
          await db.insert(activities).values({
            userId: u.id,
            action: "notification",
            entityType: "notification",
            description: `${input.title}: ${input.message}`,
          });
        }
      } else {
        for (const uid of targets) {
          await db.insert(activities).values({
            userId: uid,
            action: "notification",
            entityType: "notification",
            description: `${input.title}: ${input.message}`,
          });
        }
      }
      return { success: true, sentTo: targets.length || "all" };
    }),

  // Get notifications for current user
  myNotifications: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user?.id ? parseInt(String(ctx.user.id)) : 0;
    const notifs = await db.select().from(activities)
      .where(and(eq(activities.userId, userId), eq(activities.action, "notification")))
      .orderBy(desc(activities.createdAt))
      .limit(50);
    return notifs;
  }),

  // Send SMS (placeholder - would integrate with SMS gateway)
  sendSMS: adminQuery
    .input(z.object({
      phoneNumbers: z.array(z.string()),
      message: z.string().min(1).max(160),
      template: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // In production, integrate with Twilio, AWS SNS, or local SMS gateway
      const db = getDb();
      await db.insert(activities).values({
        action: "sms_sent",
        entityType: "notification",
        description: `SMS to ${input.phoneNumbers.length} recipients: ${input.message.substring(0, 50)}...`,
      } as InsertActivity);
      return { success: true, recipients: input.phoneNumbers.length, message: "SMS queued for delivery" };
    }),

  // Send Email (placeholder - would integrate with SMTP/SES)
  sendEmail: adminQuery
    .input(z.object({
      to: z.array(z.string().email()),
      subject: z.string().min(1),
      body: z.string().min(1),
      html: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(activities).values({
        action: "email_sent",
        entityType: "notification",
        description: `Email "${input.subject}" to ${input.to.length} recipients`,
      });
      return { success: true, recipients: input.to.length, message: "Email queued for delivery" };
    }),

  // Register push notification token
  registerPushToken: authedQuery
    .input(z.object({
      token: z.string().min(1),
      platform: z.enum(["ios", "android", "web"]),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user?.id ? parseInt(String(ctx.user.id)) : 0;
      // Store in system_settings for now (would use proper push_tokens table)
      await db.insert(systemSettings).values({
        key: `push_token_${userId}_${input.platform}`,
        value: JSON.stringify({ token: input.token, deviceId: input.deviceId, registeredAt: new Date().toISOString() }),
      }).onDuplicateKeyUpdate({
        set: { value: JSON.stringify({ token: input.token, deviceId: input.deviceId, registeredAt: new Date().toISOString() }) },
      });
      return { success: true };
    }),

  // Trigger low-stock alerts
  checkAlerts: adminQuery.query(async () => {
    const db = getDb();
    const lowStockItems = await db.select().from(inventoryItems)
      .where(sql`${inventoryItems.quantity} <= ${inventoryItems.reorderPoint}`);
    const brokenMachines = await db.select().from(machines).where(eq(machines.status, "broken"));
    const pendingAdvances = await db.select().from(advances).where(eq(advances.status, "pending"));
    return {
      lowStock: lowStockItems.length,
      brokenMachines: brokenMachines.length,
      pendingAdvances: pendingAdvances.length,
      alerts: [
        ...lowStockItems.map((i) => ({ type: "low_stock", severity: "warning", message: `Low stock: ${i.name} (${i.quantity} remaining)`, entityId: i.id })),
        ...brokenMachines.map((m) => ({ type: "machine_down", severity: "error", message: `Machine down: ${m.name}`, entityId: m.id })),
        ...pendingAdvances.map((a) => ({ type: "pending_advance", severity: "info", message: `Pending advance #${a.id}`, entityId: a.id })),
      ],
    };
  }),
});

// ─── Multi-Tenancy (Factory Management) ───
export const tenancyRouter = createRouter({
  // Get current factory settings
  getSettings: adminQuery.query(async () => {
    const db = getDb();
    const settings = await db.select().from(systemSettings);
    const factoryName = settings.find((s) => s.key === "factory_name")?.value || "Horizon Factory";
    const factoryCode = settings.find((s) => s.key === "factory_code")?.value || "HF001";
    const timezone = settings.find((s) => s.key === "timezone")?.value || "Africa/Cairo";
    const currency = settings.find((s) => s.key === "currency")?.value || "EGP";
    return { factoryName, factoryCode, timezone, currency, settingsCount: settings.length };
  }),

  // Update factory settings
  updateSettings: adminQuery
    .input(z.object({
      factoryName: z.string().optional(),
      factoryCode: z.string().optional(),
      timezone: z.string().optional(),
      currency: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const entries = Object.entries(input).filter(([, v]) => v !== undefined);
      for (const [key, value] of entries) {
        await db.insert(systemSettings).values({
          key: key.replace(/([A-Z])/g, "_$1").toLowerCase(),
          value: String(value),
        }).onDuplicateKeyUpdate({
          set: { value: String(value) },
        });
      }
      return { success: true };
    }),
});

