/**
 * db/seed-production.ts
 * ─────────────────────────────────────────────────────────────────
 * ملف البذر الإنتاجي — يُنشئ البيانات التأسيسية الحقيقية فقط:
 *   ✅ شجرة الحسابات المالية (Chart of Accounts)
 *   ✅ الأقسام الأساسية
 *   ✅ المستخدمين الرئيسيين (admin / supervisor / accountant / worker)
 *   ✅ إعدادات الشركة والضريبة
 *   ✅ الورديات الافتراضية
 *   ✅ الفئات المالية (expense categories)
 *   ✅ مراحل دورة حياة المبيعات
 *   ✅ إعدادات الطباعة
 *
 * ❌ لا يحتوي على: موظفين وهميين، حضور عشوائي، أوامر إنتاج، مبيعات، الخ.
 *
 * الاستخدام:
 *   npx tsx db/seed-production.ts
 *
 * أو عبر package.json:
 *   npm run db:seed:prod
 * ─────────────────────────────────────────────────────────────────
 */

import { getDb } from "../api/queries/connection";
import bcrypt from "bcryptjs";
import {
  users, departments, employees, shifts,
  accounts, companySettings, printSettings,
  systemSettings, expenseCategories,
  salesPipelineStages, warehouses,
  fiscalYears,
} from "./schema";
import { sql } from "drizzle-orm";

// ─── قراءة متغيرات البيئة بشكل آمن ────────────────────────────
const ADMIN_PASSWORD    = process.env.HORIZON_ADMIN_PASSWORD    || "admin123";
const SUPERVISOR_PASS   = process.env.HORIZON_SUPERVISOR_PASSWORD || "super123";
const ACCOUNTANT_PASS   = process.env.HORIZON_ACCOUNTANT_PASSWORD || "acc123";
const WORKER_PASS       = process.env.HORIZON_WORKER_PASSWORD   || "work123";
const IS_PRODUCTION     = process.env.NODE_ENV === "production";

if (IS_PRODUCTION && ADMIN_PASSWORD === "admin123") {
  console.error("❌ [SECURITY ERROR] Please set HORIZON_ADMIN_PASSWORD in your .env.production file before running seed!");
  process.exit(1);
}

const db = getDb();
console.log("🌱 Starting production seed (foundation data only)...\n");

async function seedProduction() {
  await db.transaction(async (tx) => {

    // ─── 0. مسح البيانات القديمة فقط من جداول التهيئة ──────────
    console.log("🧹 Clearing setup tables...");
    await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
    await tx.delete(printSettings);
    await tx.delete(expenseCategories);
    await tx.delete(salesPipelineStages);
    await tx.delete(companySettings);
    await tx.delete(systemSettings);
    await tx.delete(accounts);
    await tx.delete(shifts);
    await tx.delete(warehouses);
    await tx.delete(fiscalYears);
    // مسح الموظفين الافتراضيين فقط (admin / supervisor / accountant / worker)
    await tx.execute(sql`DELETE FROM employees WHERE employee_code IN ('admin','supervisor','accountant','worker')`);
    await tx.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    console.log("  ✓ Done\n");

    // ─── 1. إعدادات الشركة ──────────────────────────────────────
    console.log("🏢 Seeding company settings...");
    await tx.insert(companySettings).values({
      companyName: "مصنع سليم",
      address: "يرجى تحديث عنوان الشركة من الإعدادات",
      phone: "",
      email: "",
      currency: "EGP",
      currencySymbol: "ج.م",
      taxRate: "14",           // ضريبة القيمة المضافة المصرية
      fiscalYearStart: "01",   // يناير
      workingDays: JSON.stringify(["saturday","sunday","monday","tuesday","wednesday","thursday"]),
      workingHoursPerDay: "8",
      overtimeRate: "1.5",
    } as any);
    console.log("  ✓ Company settings created\n");

    // ─── 2. السنة المالية ───────────────────────────────────────
    console.log("📅 Seeding fiscal year...");
    const currentYear = new Date().getFullYear();
    await tx.insert(fiscalYears).values({
      name: `السنة المالية ${currentYear}`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
      status: "open" as const,
    } as any);
    console.log("  ✓ Fiscal year created\n");

    // ─── 3. شجرة الحسابات (Chart of Accounts) ──────────────────
    console.log("💵 Seeding Chart of Accounts...");
    const chartOfAccounts = [
      // الأصول
      { code: "1000", name: "الأصول",            type: "asset",     category: "current_asset",    level: 0, isLeaf: false },
      { code: "1100", name: "الأصول المتداولة",   type: "asset",     category: "current_asset",    level: 1, isLeaf: false },
      { code: "1110", name: "الخزينة النقدية",    type: "asset",     category: "current_asset",    level: 2, isLeaf: true  },
      { code: "1120", name: "البنك الأهلي",        type: "asset",     category: "current_asset",    level: 2, isLeaf: true  },
      { code: "1130", name: "العملاء (مدينون)",    type: "asset",     category: "current_asset",    level: 2, isLeaf: true  },
      { code: "1140", name: "مخزن المواد الخام",   type: "asset",     category: "current_asset",    level: 2, isLeaf: true  },
      { code: "1150", name: "مخزن نصف مصنع",       type: "asset",     category: "current_asset",    level: 2, isLeaf: true  },
      { code: "1160", name: "مخزن البضاعة التامة", type: "asset",     category: "current_asset",    level: 2, isLeaf: true  },
      { code: "1200", name: "الأصول الثابتة",      type: "asset",     category: "fixed_asset",      level: 1, isLeaf: false },
      { code: "1210", name: "الماكينات والمعدات",  type: "asset",     category: "fixed_asset",      level: 2, isLeaf: true  },
      { code: "1220", name: "الأثاث والتجهيزات",  type: "asset",     category: "fixed_asset",      level: 2, isLeaf: true  },
      // الخصوم
      { code: "2000", name: "الخصوم",             type: "liability", category: "current_liability", level: 0, isLeaf: false },
      { code: "2100", name: "الخصوم المتداولة",   type: "liability", category: "current_liability", level: 1, isLeaf: false },
      { code: "2110", name: "الموردين (دائنون)",   type: "liability", category: "current_liability", level: 2, isLeaf: true  },
      { code: "2120", name: "الرواتب المستحقة",   type: "liability", category: "current_liability", level: 2, isLeaf: true  },
      { code: "2130", name: "ضريبة القيمة المضافة المستحقة", type: "liability", category: "current_liability", level: 2, isLeaf: true },
      // حقوق الملكية
      { code: "3000", name: "حقوق الملكية",       type: "equity",    category: "equity",            level: 0, isLeaf: false },
      { code: "3100", name: "رأس المال",           type: "equity",    category: "equity",            level: 1, isLeaf: true  },
      { code: "3200", name: "الأرباح المحتجزة",   type: "equity",    category: "equity",            level: 1, isLeaf: true  },
      // الإيرادات
      { code: "4000", name: "الإيرادات",          type: "revenue",   category: "revenue",           level: 0, isLeaf: false },
      { code: "4100", name: "إيرادات المبيعات",   type: "revenue",   category: "revenue",           level: 1, isLeaf: true  },
      { code: "4200", name: "إيرادات أخرى",       type: "revenue",   category: "revenue",           level: 1, isLeaf: true  },
      // تكلفة المبيعات
      { code: "5000", name: "تكلفة البضائع المباعة", type: "cost_of_sales", category: "cost_of_sales", level: 0, isLeaf: false },
      { code: "5100", name: "تكلفة المواد الخام", type: "cost_of_sales", category: "cost_of_sales", level: 1, isLeaf: true },
      { code: "5200", name: "تكلفة العمالة المباشرة", type: "cost_of_sales", category: "cost_of_sales", level: 1, isLeaf: true },
      // المصروفات
      { code: "6000", name: "المصروفات",          type: "expense",   category: "expense",           level: 0, isLeaf: false },
      { code: "6100", name: "الرواتب والأجور",    type: "expense",   category: "expense",           level: 1, isLeaf: true  },
      { code: "6200", name: "الإيجار",            type: "expense",   category: "expense",           level: 1, isLeaf: true  },
      { code: "6300", name: "الكهرباء والمياه",   type: "expense",   category: "expense",           level: 1, isLeaf: true  },
      { code: "6400", name: "الصيانة",            type: "expense",   category: "expense",           level: 1, isLeaf: true  },
      { code: "6500", name: "المصروفات الإدارية", type: "expense",   category: "expense",           level: 1, isLeaf: true  },
      { code: "6600", name: "مصروفات التسويق",    type: "expense",   category: "expense",           level: 1, isLeaf: true  },
    ];

    for (const acct of chartOfAccounts) {
      await tx.insert(accounts).values(acct as any);
    }
    console.log(`  ✓ ${chartOfAccounts.length} accounts created\n`);

    // ─── 4. الأقسام الأساسية ────────────────────────────────────
    console.log("📁 Seeding departments...");
    // الأقسام موجودة — نضيفها فقط إذا لم تكن موجودة
    const existingDepts = await tx.select().from(departments);
    if (existingDepts.length === 0) {
      const deptData = [
        { name: "الإدارة",        description: "الإدارة العليا والتخطيط الاستراتيجي",  color: "#4A2C3F" },
        { name: "الإنتاج",        description: "خطوط الإنتاج والخياطة والتصنيع",       color: "#059669" },
        { name: "القص",           description: "قسم القص والتجهيز والتدريج",            color: "#D97706" },
        { name: "مراقبة الجودة",  description: "فحص الجودة وضبط المعايير",             color: "#DC2626" },
        { name: "المستودع",       description: "إدارة المخزون والمشتريات",              color: "#2563EB" },
        { name: "المالية",        description: "المحاسبة والرواتب والتقارير المالية",   color: "#0891B2" },
        { name: "المبيعات",       description: "المبيعات وخدمة العملاء والتسويق",      color: "#BE185D" },
        { name: "الموارد البشرية",description: "شؤون الموظفين والتوظيف والتدريب",      color: "#7C3AED" },
      ];
      for (const d of deptData) await tx.insert(departments).values(d);
      console.log(`  ✓ ${deptData.length} departments created`);
    } else {
      console.log(`  ℹ️  Departments already exist (${existingDepts.length}), skipping`);
    }

    const depts = await tx.select().from(departments);
    const adminDept      = depts.find(d => d.name.includes("الإدارة"))?.id       || depts[0].id;
    const productionDept = depts.find(d => d.name.includes("الإنتاج"))?.id       || depts[0].id;
    const financeDept    = depts.find(d => d.name.includes("المالية"))?.id       || depts[0].id;
    console.log("");

    // ─── 5. الورديات الافتراضية ────────────────────────────────
    console.log("⏰ Seeding default shifts...");
    await tx.insert(shifts).values([
      {
        name: "الوردية الصباحية",
        startTime: "07:00",
        endTime: "15:00",
        daysOfWeek: JSON.stringify(["saturday","sunday","monday","tuesday","wednesday","thursday"]),
        isDefault: true,
      },
      {
        name: "الوردية المسائية",
        startTime: "15:00",
        endTime: "23:00",
        daysOfWeek: JSON.stringify(["saturday","sunday","monday","tuesday","wednesday","thursday"]),
        isDefault: false,
      },
    ] as any[]);
    console.log("  ✓ 2 shifts created\n");

    // ─── 6. المستخدمون الأساسيون للنظام ────────────────────────
    console.log("👤 Seeding system users...");
    const SALT_ROUNDS = 12; // أعلى من الافتراضي (10) لمزيد من الأمان

    const systemUsers = [
      {
        employeeCode: "admin",
        fullName: "مدير النظام",
        email: "admin@company.com",
        phone: "",
        departmentId: adminDept,
        role: "admin",
        jobTitle: "مدير عام",
        joinDate: new Date(),
        salary: "0",
        status: "active" as const,
        employmentType: "full_time" as const,
        salaryType: "monthly" as const,
        passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, SALT_ROUNDS),
      },
      {
        employeeCode: "supervisor",
        fullName: "مشرف الإنتاج",
        email: "supervisor@company.com",
        phone: "",
        departmentId: productionDept,
        role: "supervisor",
        jobTitle: "مشرف خط",
        joinDate: new Date(),
        salary: "0",
        status: "active" as const,
        employmentType: "full_time" as const,
        salaryType: "monthly" as const,
        passwordHash: bcrypt.hashSync(SUPERVISOR_PASS, SALT_ROUNDS),
      },
      {
        employeeCode: "accountant",
        fullName: "المحاسب",
        email: "accountant@company.com",
        phone: "",
        departmentId: financeDept,
        role: "accountant",
        jobTitle: "محاسب",
        joinDate: new Date(),
        salary: "0",
        status: "active" as const,
        employmentType: "full_time" as const,
        salaryType: "monthly" as const,
        passwordHash: bcrypt.hashSync(ACCOUNTANT_PASS, SALT_ROUNDS),
      },
      {
        employeeCode: "worker",
        fullName: "مستخدم عادي",
        email: "worker@company.com",
        phone: "",
        departmentId: productionDept,
        role: "worker",
        jobTitle: "عامل",
        joinDate: new Date(),
        salary: "0",
        status: "active" as const,
        employmentType: "full_time" as const,
        salaryType: "monthly" as const,
        passwordHash: bcrypt.hashSync(WORKER_PASS, SALT_ROUNDS),
      },
    ];

    for (const u of systemUsers) {
      await tx.insert(employees).values(u as any);
    }
    console.log("  ✓ 4 system users created (admin / supervisor / accountant / worker)\n");

    // ─── 7. فئات المصروفات الافتراضية ──────────────────────────
    console.log("💸 Seeding expense categories...");
    await tx.insert(expenseCategories).values([
      { name: "رواتب وأجور",      icon: "👥", color: "#6366f1" },
      { name: "إيجارات",          icon: "🏭", color: "#f59e0b" },
      { name: "كهرباء ومياه",     icon: "💡", color: "#22c55e" },
      { name: "صيانة وإصلاح",     icon: "🔧", color: "#ef4444" },
      { name: "مواصلات وشحن",     icon: "🚚", color: "#3b82f6" },
      { name: "مشتريات مواد خام", icon: "📦", color: "#8b5cf6" },
      { name: "مصروفات إدارية",   icon: "📋", color: "#64748b" },
      { name: "تسويق ومبيعات",    icon: "📢", color: "#ec4899" },
      { name: "أخرى",             icon: "💰", color: "#94a3b8" },
    ] as any[]);
    console.log("  ✓ 9 expense categories created\n");

    // ─── 8. مراحل دورة مبيعات ──────────────────────────────────
    console.log("📊 Seeding sales pipeline stages...");
    await tx.insert(salesPipelineStages).values([
      { name: "عميل محتمل",    order: 1, color: "#94a3b8", probability: 10 },
      { name: "تواصل أولي",   order: 2, color: "#3b82f6", probability: 25 },
      { name: "عرض سعر",       order: 3, color: "#f59e0b", probability: 50 },
      { name: "تفاوض",         order: 4, color: "#f97316", probability: 70 },
      { name: "مغلق / رابح",   order: 5, color: "#22c55e", probability: 100 },
      { name: "مغلق / خاسر",   order: 6, color: "#ef4444", probability: 0  },
    ] as any[]);
    console.log("  ✓ 6 pipeline stages created\n");

    // ─── 9. مستودع رئيسي افتراضي ───────────────────────────────
    console.log("🏪 Seeding default warehouse...");
    await tx.insert(warehouses).values({
      name: "المستودع الرئيسي",
      code: "WH-001",
      location: "",
      type: "raw_materials",
      isActive: true,
    } as any);
    console.log("  ✓ Default warehouse created\n");

    // ─── 10. إعدادات الطباعة الافتراضية ────────────────────────
    console.log("🖨️ Seeding print settings...");
    await tx.insert(printSettings).values({
      paperSize: "A4",
      orientation: "portrait",
      fontSize: 12,
      fontFamily: "Arial",
      showLogo: true,
      headerText: "مصنع سليم",
      footerText: "نظام Horizon ERP",
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 15,
      marginRight: 15,
    } as any);
    console.log("  ✓ Print settings created\n");

    // ─── 11. إعدادات النظام العامة ─────────────────────────────
    console.log("⚙️  Seeding system settings...");
    await tx.insert(systemSettings).values([
      { key: "system_initialized", value: "true" },
      { key: "default_currency",   value: "EGP" },
      { key: "default_vat_rate",   value: "14" },
      { key: "disabled_modules",   value: "[]" },
    ] as any[]);
    console.log("  ✓ System settings created\n");

  }); // end transaction

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅  Production seed completed successfully!");
  console.log("");
  console.log("📋 Next steps:");
  console.log("   1. Login with: admin / [HORIZON_ADMIN_PASSWORD]");
  console.log("   2. Go to Settings → Company to update company info");
  console.log("   3. Add real employees from HR → Employees");
  console.log("   4. Set up real production lines from Production");
  console.log("   5. Configure inventory items and suppliers");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  process.exit(0);
}

seedProduction().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
