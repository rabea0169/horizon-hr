import { getDb } from "../api/queries/connection";
import bcrypt from "bcryptjs";
import {
  users, departments, employees, attendance, leaves, performanceReviews,
  jobPostings, candidates, payrollRecords, shifts, shiftAssignments,
  advances, bonusPenalties, productionLines, productionOrders, dailyProduction,
  productionModels, modelStages, pieceRateRecords, machines, inventoryItems,
  inventoryTransactions, suppliers, supplyOrders, supplyOrderItems,
  cuttingOrders, workOrders, bundles, bundleTracking, bomRecords,
  qcRecords, mrpRecords, challans, challanItems, subcontracts,
  salesOrders, crmCustomers, crmInteractions, costCalculations,
  printSettings, activities, systemSettings, styleColorSizeMatrix, fabricRolls,
  cutPlans, markerPlans, samRecords, lineBalancing, warehouses, warehouseBins,
  reorderRules, productLifecycle, techPacks, designRevisions, sampleReviews,
  customReports, reportTemplates, buyerPortalUsers, productionForecasts,
  auditLog, companySettings, purchaseRequests, purchaseRequestItems,
  grns, salesInvoices, purchaseInvoices, paymentVouchers, receiptVouchers,
  journalVouchers, journalVoucherLines, maintenanceRecords, machineDepreciation,
  orderAmendments, deliveryReminders, quotations, quotationItems,
  purchaseOrders, purchaseOrderItems, rfqs, rfqItems, rfqResponses,
  goodsReceipts, goodsReceiptItems, salesPipelineStages, salesOpportunities,
  salesCommissions, shipments, shipmentItems, integrationLogs,
  openingBalances, treasuryAccounts, treasuryTransactions, creditLimits,
  agingBuckets, fiscalYears, expenseCategories, expenses, finishedGoods,
  wastageRecords, salesRepVisits, salesRepOrders, defectTypes,
  accounts, generalLedger
} from "./schema";
import { sql } from "drizzle-orm";

console.log("🌱 Starting seed...");
const db = getDb();

// ─── Helpers ───
const now = () => new Date();
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const monthStr = (m: number) => `2025-${String(m).padStart(2, "0")}`;

async function seed() {
  // ─── 0. Wipe Old Data ───
  console.log("🧹 Wiping old data...");
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
  const allTables = [
    users, departments, employees, attendance, leaves, performanceReviews,
    jobPostings, candidates, payrollRecords, shifts, shiftAssignments,
    advances, bonusPenalties, productionLines, productionOrders, dailyProduction,
    productionModels, modelStages, pieceRateRecords, machines, inventoryItems,
    inventoryTransactions, suppliers, supplyOrders, supplyOrderItems,
    cuttingOrders, workOrders, bundles, bundleTracking, bomRecords,
    qcRecords, mrpRecords, challans, challanItems, subcontracts,
    salesOrders, crmCustomers, crmInteractions, costCalculations,
    printSettings, activities, systemSettings, styleColorSizeMatrix, fabricRolls,
    cutPlans, markerPlans, samRecords, lineBalancing, warehouses, warehouseBins,
    reorderRules, productLifecycle, techPacks, designRevisions, sampleReviews,
    customReports, reportTemplates, buyerPortalUsers, productionForecasts,
    auditLog, companySettings, purchaseRequests, purchaseRequestItems,
    grns, salesInvoices, purchaseInvoices, paymentVouchers, receiptVouchers,
    journalVouchers, journalVoucherLines, maintenanceRecords, machineDepreciation,
    orderAmendments, deliveryReminders, quotations, quotationItems,
    purchaseOrders, purchaseOrderItems, rfqs, rfqItems, rfqResponses,
    goodsReceipts, goodsReceiptItems, salesPipelineStages, salesOpportunities,
    salesCommissions, shipments, shipmentItems, integrationLogs,
    openingBalances, treasuryAccounts, treasuryTransactions, creditLimits,
    agingBuckets, fiscalYears, expenseCategories, expenses, finishedGoods,
    wastageRecords, salesRepVisits, salesRepOrders, defectTypes,
    accounts, generalLedger
  ];
  for (const table of allTables) {
    await db.delete(table);
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("✓ Old data wiped.");

  // ─── 0.1 Accounts (شجرة الحسابات) ───
  console.log("💵 Seeding Chart of Accounts...");
  const accountsData = [
    { code: "110000", name: "الخزينة النقدية", type: "asset" as const, category: "current_asset" as const, level: 1, isLeaf: true },
    { code: "120000", name: "البنك الأهلي", type: "asset" as const, category: "current_asset" as const, level: 1, isLeaf: true },
    { code: "121000", name: "مخزن المواد الخام", type: "asset" as const, category: "current_asset" as const, level: 1, isLeaf: true },
    { code: "125000", name: "مخزن البضاعة التامة", type: "asset" as const, category: "current_asset" as const, level: 1, isLeaf: true },
    { code: "130000", name: "العملاء (شؤون البيع)", type: "asset" as const, category: "current_asset" as const, level: 1, isLeaf: true },
    { code: "211000", name: "الموردين (شؤون الشراء)", type: "liability" as const, category: "current_liability" as const, level: 1, isLeaf: true },
    { code: "220000", name: "الرواتب والأجور المستحقة", type: "liability" as const, category: "current_liability" as const, level: 1, isLeaf: true },
    { code: "310000", name: "رأس المال", type: "equity" as const, category: "equity" as const, level: 1, isLeaf: true },
    { code: "410000", name: "إيرادات المبيعات", type: "revenue" as const, category: "revenue" as const, level: 1, isLeaf: true },
    { code: "510000", name: "مصروفات الرواتب والأجور", type: "expense" as const, category: "expense" as const, level: 1, isLeaf: true },
    { code: "520000", name: "تكاليف الإنتاج والتشغيل", type: "expense" as const, category: "expense" as const, level: 1, isLeaf: true },
    { code: "610000", name: "تكلفة المبيعات COGS", type: "cost_of_sales" as const, category: "cost_of_sales" as const, level: 1, isLeaf: true },
  ];
  for (const acct of accountsData) {
    await db.insert(accounts).values(acct);
  }
  const dbAccts = await db.select().from(accounts);
  console.log(`  ✓ ${dbAccts.length} accounts seeded`);

  // ─── 1. Departments ───
  console.log("📁 Seeding departments...");
  const deptData = [
    { name: "الإدارة", description: "الإدارة العليا والتخطيط", color: "#4A2C3F" },
    { name: "الخياطة", description: "خطوط الإنتاج والخياطة", color: "#059669" },
    { name: "القص", description: "قسم القص والتجهيز", color: "#D97706" },
    { name: "الكي والتغليف", description: "الكي والتعبئة النهائية", color: "#7C3AED" },
    { name: "مراقبة الجودة", description: "فحص الجودة وضبط المعايير", color: "#DC2626" },
    { name: "المستودع", description: "المخزن والتخزين", color: "#2563EB" },
    { name: "المالية", description: "الحسابات والرواتب", color: "#0891B2" },
    { name: "المبيعات", description: "المبيعات وخدمة العملاء", color: "#BE185D" },
  ];
  for (const d of deptData) await db.insert(departments).values(d);
  const depts = await db.select().from(departments);
  console.log(`  ✓ ${depts.length} departments`);

  // ─── 2. Employees ───
  console.log("👥 Seeding employees...");
  const employeeNames = [
    ["أحمد محمد", "محمد أحمد", "محمود إبراهيم", "خالد سعيد", "عمر حسن"],
    ["فاطمة علي", "سارة محمود", "نورا خالد", "هاني عادل", "تامر فؤاد"],
    ["سامي جمال", "وليد عبدالله", "إيمان سالم", "ريم Osama", "كريم نادر"],
    ["دعاء طارق", "ياسر منصور", "رانيا عصام", "هشام مجدي", "سمر كمال"],
    ["باسم رأفت", "نشوى إبراهيم", "عادل محروس", "منى سعيد", "عمرو خالد"],
    ["عبير حسن", "وائل فريد", "نهى سلامة", "أشرف عاطف", "داليا مصطفى"],
  ];
  const roles = ["مدير", "مشرف", "فني", "عامل", "محاسب", "مندوب"];
  const jobTitles = ["مدير مصنع", "مشرف خط", "خياط", "قصاص", "كواية", "فني جودة", "محاسب", "مندوب مبيعات", "عامل مستودع", "فني صيانة"];
  let empIdx = 1;
  for (const dept of depts) {
    const names = employeeNames[dept.id - 1] || employeeNames[0];
    for (const name of names) {
      await db.insert(employees).values({
        employeeCode: `EMP${String(empIdx).padStart(3, "0")}`,
        fullName: name,
        email: `emp${empIdx}@horizon.factory`,
        phone: `01${rand(0, 9)}${rand(10000000, 99999999)}`,
        departmentId: dept.id,
        role: randPick(roles),
        jobTitle: randPick(jobTitles),
        joinDate: daysAgo(rand(30, 1000)),
        salary: String(rand(3000, 15000)),
        status: randPick(["active", "active", "active", "active", "on_leave", "inactive"]),
        employmentType: randPick(["full_time", "full_time", "full_time", "part_time", "contract"]),
        salaryType: randPick(["monthly", "monthly", "monthly", "piece_rate", "mixed"]),
      } as any);
      empIdx++;
    }
  }

  // ─── 2.1 Default System Users ───
  console.log("👥 Seeding default system users into employees...");
  const adminDept = depts.find(d => d.name === "الإدارة")?.id || depts[0].id;
  const sewingDept = depts.find(d => d.name === "الخياطة")?.id || depts[0].id;
  const financeDept = depts.find(d => d.name === "المالية")?.id || depts[0].id;

  const systemUsers = [
    {
      employeeCode: "admin",
      fullName: "مدير النظام",
      email: "admin@horizon.factory",
      phone: "01001234567",
      departmentId: adminDept,
      role: "admin",
      jobTitle: "مدير عام",
      joinDate: new Date("2026-01-01"),
      salary: "20000.00",
      status: "active" as const,
      employmentType: "full_time" as const,
      salaryType: "monthly" as const,
      passwordHash: bcrypt.hashSync(process.env.HORIZON_ADMIN_PASSWORD || "admin123", 10),
    },
    {
      employeeCode: "supervisor",
      fullName: "مشرف الإنتاج",
      email: "supervisor@horizon.factory",
      phone: "01011234567",
      departmentId: sewingDept,
      role: "supervisor",
      jobTitle: "مشرف خط",
      joinDate: new Date("2026-01-01"),
      salary: "10000.00",
      status: "active" as const,
      employmentType: "full_time" as const,
      salaryType: "monthly" as const,
      passwordHash: bcrypt.hashSync(process.env.HORIZON_SUPERVISOR_PASSWORD || "super123", 10),
    },
    {
      employeeCode: "accountant",
      fullName: "المحاسب",
      email: "accountant@horizon.factory",
      phone: "01021234567",
      departmentId: financeDept,
      role: "accountant",
      jobTitle: "محاسب",
      joinDate: new Date("2026-01-01"),
      salary: "12000.00",
      status: "active" as const,
      employmentType: "full_time" as const,
      salaryType: "monthly" as const,
      passwordHash: bcrypt.hashSync(process.env.HORIZON_ACCOUNTANT_PASSWORD || "acc123", 10),
    },
    {
      employeeCode: "worker",
      fullName: "عامل عادي",
      email: "worker@horizon.factory",
      phone: "01031234567",
      departmentId: sewingDept,
      role: "worker",
      jobTitle: "خياط",
      joinDate: new Date("2026-01-01"),
      salary: "5000.00",
      status: "active" as const,
      employmentType: "full_time" as const,
      salaryType: "piece_rate" as const,
      passwordHash: bcrypt.hashSync(process.env.HORIZON_WORKER_PASSWORD || "work123", 10),
    },
  ];

  for (const u of systemUsers) {
    await db.insert(employees).values(u as any);
  }

  const emps = await db.select().from(employees);
  console.log(`  ✓ ${emps.length} employees`);

  // ─── 3. Attendance ───
  console.log("📋 Seeding attendance...");
  const activeEmps = emps.filter((e) => e.status === "active");
  for (let d = 0; d < 30; d++) {
    const date = daysAgo(d);
    if (date.getDay() === 5) continue; // Friday off
    for (const emp of activeEmps.slice(0, 20)) {
      const isLate = Math.random() < 0.1;
      const isAbsent = Math.random() < 0.05;
      await db.insert(attendance).values({
        employeeId: emp.id,
        date,
        checkIn: isAbsent ? null : new Date(date.getTime() + 7 * 3600000 + (isLate ? rand(15, 60) : rand(-5, 10)) * 60000),
        checkOut: isAbsent ? null : new Date(date.getTime() + 15 * 3600000 + rand(-30, 30) * 60000),
        status: isAbsent ? "absent" : isLate ? "late" : "present",
        hoursWorked: isAbsent ? "0" : String(rand(7, 9)),
        notes: "",
      } as any);
    }
  }
  console.log(`  ✓ Attendance seeded`);

  // ─── 4. Leaves ───
  console.log("🏖️ Seeding leaves...");
  const leaveTypes = ["annual", "sick", "unpaid", "emergency"] as const;
  for (let i = 0; i < 20; i++) {
    const emp = randPick(activeEmps);
    const start = daysAgo(rand(1, 90));
    const end = new Date(start); end.setDate(end.getDate() + rand(1, 7));
    await db.insert(leaves).values({
      employeeId: emp.id,
      leaveType: randPick(leaveTypes),
      startDate: start,
      endDate: end,
      days: Math.ceil((end.getTime() - start.getTime()) / 86400000),
      reason: randPick(["إجازة سنوية", "مرض", "ظروف شخصية", "أحد عائلي"]),
      status: randPick(["approved", "approved", "approved", "pending", "rejected"]),
    } as any);
  }
  console.log(`  ✓ 20 leaves`);

  // ─── 5. Performance Reviews ───
  console.log("⭐ Seeding performance reviews...");
  for (let i = 0; i < 15; i++) {
    const emp = randPick(emps);
    await db.insert(performanceReviews).values({
      employeeId: emp.id,
      reviewerId: randPick(emps.filter((e) => e.id !== emp.id)).id,
      period: monthStr(rand(1, 6)),
      status: randPick(["completed", "completed", "pending"]),
      overallRating: rand(1, 5),
      communication: rand(1, 5),
      teamwork: rand(1, 5),
      productivity: rand(1, 5),
      punctuality: rand(1, 5),
      goals: randPick(["زيادة الإنتاجية", "تحسين الجودة", "التطوير المهني"]),
      comments: randPick(["أداء ممتاز", "يحتاج تحسين", "جيد"]),
      completedAt: now(),
    } as any);
  }
  console.log(`  ✓ 15 reviews`);

  // ─── 6. Job Postings ───
  console.log("📝 Seeding job postings...");
  const jobTitles2 = ["خياط ماهر", "فني صيانة ماكينات", "مشرف جودة", "محاسب تكاليف", "مندوب مبيعات", "عامل قص", "مشرف خط إنتاج", "فني IT", "سائق توصيل", "أخصائي موارد بشرية"];
  for (let i = 0; i < 10; i++) {
    await db.insert(jobPostings).values({
      title: jobTitles2[i],
      departmentId: randPick(depts).id,
      description: `مطلوب ${jobTitles2[i]} بخبرة ${rand(1, 5)} سنوات`,
      requirements: randPick(["خبرة في المصانع", "مؤهل عالي", "إجادة الإكسل"]),
      salaryRange: `${rand(4000, 8000)} - ${rand(8000, 15000)}`,
      location: "القاهرة",
      employmentType: randPick(["full_time", "contract"]),
      status: randPick(["open", "open", "open", "closed"]),
    } as any);
  }
  console.log(`  ✓ 10 job postings`);

  // ─── 7. Candidates ───
  console.log("🧑‍💼 Seeding candidates...");
  const jobs = await db.select().from(jobPostings);
  const candidateNames = ["علي حسن", "محمد سعيد", "خالد عمر", "أحمد علي", "ياسر محمود", "هبة كريم", "سحر أشرف", "نادية طارق", "مها عادل", "ليلى فؤاد", "رامي جمال", "سيف عبدالله", "دينا سالم", "بسمة عادل", "طارق نادر", "كنزي عمر", "مريم سامي", "إبراهيم حسن", "نورهان علي", "حسن خالد"];
  for (let i = 0; i < candidateNames.length; i++) {
    await db.insert(candidates).values({
      jobPostingId: randPick(jobs).id,
      fullName: candidateNames[i],
      email: `candidate${i}@email.com`,
      phone: `01${rand(0, 9)}${rand(10000000, 99999999)}`,
      stage: randPick(["applied", "screening", "interview", "interview", "offer", "hired", "rejected"]),
      rating: rand(1, 5),
      notes: randPick(["ممتاز", "جيد", "يحتاج تقييم", ""]),
    } as any);
  }
  console.log(`  ✓ 20 candidates`);

  // ─── 8. Shifts ───
  console.log("🕐 Seeding shifts...");
  const shiftData = [
    { name: "الوردية الصباحية", startTime: "07:00", endTime: "15:00", daysOfWeek: "1,2,3,4,6" },
    { name: "الوردية المسائية", startTime: "15:00", endTime: "23:00", daysOfWeek: "1,2,3,4,6" },
    { name: "الوردية الليلية", startTime: "23:00", endTime: "07:00", daysOfWeek: "1,2,3,4,6" },
  ];
  for (const s of shiftData) await db.insert(shifts).values(s);
  const shiftRecs = await db.select().from(shifts);
  console.log(`  ✓ 3 shifts`);

  // ─── 9. Payroll ───
  console.log("💰 Seeding payroll records...");
  for (const emp of emps) {
    await db.insert(payrollRecords).values({
      employeeId: emp.id,
      month: "2025-06",
      basicSalary: String(rand(3000, 15000)),
      bonus: String(rand(0, 2000)),
      deductions: String(rand(0, 1000)),
      netPay: String(rand(2500, 16000)),
      status: "processed",
      processedAt: now(),
    } as any);
  }
  console.log(`  ✓ ${emps.length} payroll records`);

  // ─── 10. Advances ───
  console.log("💸 Seeding advances...");
  for (let i = 0; i < 15; i++) {
    await db.insert(advances).values({
      employeeId: randPick(emps).id,
      amount: String(rand(500, 5000)),
      reason: randPick(["ظروف طارئة", "مصاريف علاج", "مصاريف دراسية", ""]),
      status: randPick(["approved", "approved", "pending", "rejected"]),
    } as any);
  }
  console.log(`  ✓ 15 advances`);

  // ─── 11. Bonus/Penalties ───
  console.log("🎁 Seeding bonuses & penalties...");
  for (let i = 0; i < 20; i++) {
    await db.insert(bonusPenalties).values({
      employeeId: randPick(emps).id,
      type: randPick(["bonus", "penalty"]),
      category: randPick(["حضور", "إنتاج", "جودة", "سلوك", "إضافي"]),
      amount: String(rand(100, 2000)),
      reason: randPick(["مكافأة حضور", "جزاء تأخير", "مكافأة إنتاج", ""]),
      month: monthStr(rand(1, 6)),
    } as any);
  }
  console.log(`  ✓ 20 bonuses/penalties`);

  // ─── 12. Production Lines ───
  console.log("🏭 Seeding production lines...");
  const lineData = [
    { name: "خط الخياطة أ", lineType: "sewing" as const, capacity: 50 },
    { name: "خط الخياطة ب", lineType: "sewing" as const, capacity: 45 },
    { name: "خط القص", lineType: "cutting" as const, capacity: 30 },
    { name: "خط الكي", lineType: "ironing" as const, capacity: 40 },
    { name: "خط التغليف", lineType: "packing" as const, capacity: 60 },
  ];
  for (const l of lineData) await db.insert(productionLines).values(l);
  const lines = await db.select().from(productionLines);
  console.log(`  ✓ ${lines.length} production lines`);

  // ─── 13. Production Orders ───
  console.log("📦 Seeding production orders...");
  const customers = ["H&M", "Zara", "Max", "LC Waikiki", "DeFacto", "Mango", "Pull&Bear", "Bershka"];
  const styles = ["تيشيرت", "قميص", "بنطلون", "جاكت", "فستان", "تنورة", "بلوزة", "سويت شيرت"];
  for (let i = 0; i < 15; i++) {
    const qty = rand(500, 5000);
    await db.insert(productionOrders).values({
      orderCode: `PO-${String(i + 1).padStart(4, "0")}`,
      styleName: `${randPick(styles)} ${randPick(["صيفي", "شتوي", "رياضي", "كلاسيك"])}`,
      customerName: randPick(customers),
      quantity: qty,
      completed: rand(0, qty),
      defected: rand(0, Math.floor(qty * 0.05)),
      lineId: randPick(lines).id,
      status: randPick(["in_progress", "in_progress", "pending", "completed", "completed"]),
      startDate: daysAgo(rand(1, 60)),
      endDate: daysAgo(rand(-30, 0)),
      priority: randPick(["normal", "normal", "high", "urgent"]),
    } as any);
  }
  const orders = await db.select().from(productionOrders);
  console.log(`  ✓ ${orders.length} production orders`);

  // ─── 14. Daily Production ───
  console.log("📊 Seeding daily production...");
  for (let d = 0; d < 30; d++) {
    const date = daysAgo(d);
    if (date.getDay() === 5) continue;
    for (const line of lines) {
      await db.insert(dailyProduction).values({
        lineId: line.id,
        orderId: randPick(orders).id,
        date,
        produced: rand(50, 500),
        defected: rand(0, 20),
        reworked: rand(0, 10),
        workersCount: rand(10, line.capacity || 30),
        hoursWorked: String(rand(7, 9)),
      } as any);
    }
  }
  console.log(`  ✓ Daily production seeded`);

  // ─── 15. Production Models ───
  console.log("👗 Seeding production models...");
  const modelData = [
    { modelCode: "MDL-001", name: "تيشيرت قطن", category: "ملابس علوية" },
    { modelCode: "MDL-002", name: "قميص رسمي", category: "ملابس رسمية" },
    { modelCode: "MDL-003", name: "بنطلون جينز", category: "ملابس سفلية" },
    { modelCode: "MDL-004", name: "جاكت شتوي", category: "معاطف" },
    { modelCode: "MDL-005", name: "فستان صيفي", category: "فساتين" },
    { modelCode: "MDL-006", name: "بلوزة حريمي", category: "ملابس علوية" },
    { modelCode: "MDL-007", name: "سويت شيرت", category: "ملابس رياضية" },
    { modelCode: "MDL-008", name: "تنورة قصيرة", category: "ملابس سفلية" },
    { modelCode: "MDL-009", name: "جاكت جلد", category: "معاطف" },
    { modelCode: "MDL-010", name: "بنطلون كاجوال", category: "ملابس سفلية" },
  ];
  for (const m of modelData) await db.insert(productionModels).values(m);
  const models = await db.select().from(productionModels);
  console.log(`  ✓ ${models.length} models`);

  // ─── 16. Model Stages ───
  console.log("🔧 Seeding model stages...");
  const stageNames = ["قص", "تجهيز", "خياطة", "كي", "تفتيش", "تغليف"];
  for (const model of models) {
    for (let i = 0; i < stageNames.length; i++) {
      await db.insert(modelStages).values({
        modelId: model.id,
        name: stageNames[i],
        sequence: i + 1,
        unitPrice: String(rand(2, 15)),
        description: `مرحلة ${stageNames[i]}`,
      } as any);
    }
  }
  console.log(`  ✓ Model stages seeded`);

  // ─── 17. Piece Rate Records ───
  console.log("💵 Seeding piece rate records...");
  const pieceEmps = emps.filter((e) => e.salaryType === "piece_rate" || e.salaryType === "mixed");
  for (let i = 0; i < 50; i++) {
    const model = randPick(models);
    const qty = rand(10, 100);
    const price = rand(5, 20);
    await db.insert(pieceRateRecords).values({
      employeeId: randPick(pieceEmps).id,
      modelId: model.id,
      quantity: qty,
      unitPrice: String(price),
      totalAmount: String(qty * price),
      date: daysAgo(rand(0, 30)),
    } as any);
  }
  console.log(`  ✓ 50 piece rate records`);

  // ─── 18. Machines ───
  console.log("⚙️ Seeding machines...");
  const machineData = [
    { machineCode: "MC-001", name: "ماكينة خياطة Juki", type: "sewing", brand: "Juki", model: "DDL-8700" },
    { machineCode: "MC-002", name: "ماكينة خياطة Brother", type: "sewing", brand: "Brother", model: "S-1000" },
    { machineCode: "MC-003", name: "ماكينة أوفر", type: "overlock", brand: "Juki", model: "MO-6700" },
    { machineCode: "MC-004", name: "ماكينة قص", type: "cutting", brand: "Eastman", model: "Chickadee" },
    { machineCode: "MC-005", name: "مكواة بخار", type: "ironing", brand: "Pony", model: "SP-500" },
    { machineCode: "MC-006", name: "ماكينة زرار", type: "button", brand: "Juki", model: "MB-1800" },
    { machineCode: "MC-007", name: "ماكينة عراوي", type: "buttonhole", brand: "Juki", model: "LBH-780" },
    { machineCode: "MC-008", name: "ماكينة تطريز", type: "embroidery", brand: "Tajima", model: "TFMX" },
  ];
  for (const m of machineData) {
    await db.insert(machines).values({
      ...m,
      lineId: randPick(lines).id,
      purchaseDate: daysAgo(rand(100, 1000)),
      cost: String(rand(5000, 50000)),
      status: randPick(["operational", "operational", "operational", "maintenance", "broken"]),
      nextMaintenance: daysAgo(rand(-30, 90)),
    } as any);
  }
  console.log(`  ✓ ${machineData.length} machines`);

  // ─── 19. Inventory ───
  console.log("📦 Seeding inventory...");
  const invItems = [
    { sku: "FAB-001", name: "قماش قطن أبيض", category: "fabric", unit: "متر", minStock: 100, reorderPoint: 150 },
    { sku: "FAB-002", name: "قماش قطن أسود", category: "fabric", unit: "متر", minStock: 80, reorderPoint: 120 },
    { sku: "FAB-003", name: "قماش جينز", category: "fabric", unit: "متر", minStock: 50, reorderPoint: 80 },
    { sku: "THR-001", name: "خيط بوليستر", category: "thread", unit: "بكرة", minStock: 200, reorderPoint: 300 },
    { sku: "THR-002", name: "خيط قطن", category: "thread", unit: "بكرة", minStock: 150, reorderPoint: 250 },
    { sku: "BTN-001", name: "زرار أبيض صغير", category: "button", unit: "علبة", minStock: 50, reorderPoint: 100 },
    { sku: "BTN-002", name: "زرار أسود كبير", category: "button", unit: "علبة", minStock: 40, reorderPoint: 80 },
    { sku: "ZIP-001", name: "سحاب معدني", category: "zipper", unit: "متر", minStock: 100, reorderPoint: 150 },
    { sku: "LBL-001", name: "تيكت قياس", category: "label", unit: "لفة", minStock: 30, reorderPoint: 50 },
    { sku: "PKG-001", name: "كيس بلاستيك", category: "packaging", unit: "حزمة", minStock: 500, reorderPoint: 1000 },
  ];
  for (const item of invItems) {
    await db.insert(inventoryItems).values({
      ...item,
      quantity: rand(item.minStock || 0, (item.minStock || 0) * 5),
      unitCost: String(rand(5, 100)),
      status: "in_stock",
    } as any);
  }
  console.log(`  ✓ ${invItems.length} inventory items`);

  // ─── 20. Suppliers ───
  console.log("🚚 Seeding suppliers...");
  const supData = [
    { name: "النيل للأقمشة", contactPerson: "محمد النيل", phone: "0123456789", email: "nile@fabrics.com" },
    { name: "مصر للخيوط", contactPerson: "أحمد سعيد", phone: "0111222333", email: "egypt@threads.com" },
    { name: "العبور للإكسسوارات", contactPerson: "خالد عبور", phone: "0155566677", email: "alabour@acc.com" },
    { name: "السويس للتعبئة", contactPerson: "عمرو السويس", phone: "0199988877", email: "suez@pkg.com" },
    { name: "المحلة للقطن", contactPerson: "محمود المحلة", phone: "0177766655", email: "mahalla@cotton.com" },
  ];
  for (const s of supData) await db.insert(suppliers).values(s as any);
  console.log(`  ✓ ${supData.length} suppliers`);

  // ─── 21. CRM Customers ───
  console.log("👔 Seeding CRM customers...");
  const custData = [
    { name: "H&M Egypt", contactPerson: "Anna Karlsson", phone: "02-1234567", email: "procurement@hm.eg", city: "القاهرة", customerType: "wholesale" as const },
    { name: "Zara Egypt", contactPerson: "Maria Garcia", phone: "02-2345678", email: "buying@zara.eg", city: "الجيزة", customerType: "wholesale" as const },
    { name: "Max Fashion", contactPerson: "John Smith", phone: "02-3456789", email: "orders@max.eg", city: "القاهرة", customerType: "corporate" as const },
    { name: "LC Waikiki", contactPerson: "Ayşe Yılmaz", phone: "02-4567890", email: "supply@lcw.eg", city: "الإسكندرية", customerType: "wholesale" as const },
    { name: "DeFacto", contactPerson: "Mehmet Kaya", phone: "02-5678901", email: "buying@defacto.eg", city: "القاهرة", customerType: "wholesale" as const },
  ];
  for (const c of custData) await db.insert(crmCustomers).values(c as any);
  const crmCusts = await db.select().from(crmCustomers);
  console.log(`  ✓ ${crmCusts.length} customers`);

  // ─── 22. Sales Orders ───
  console.log("🛒 Seeding sales orders...");
  for (let i = 0; i < 20; i++) {
    const qty = rand(100, 2000);
    const price = rand(50, 300);
    await db.insert(salesOrders).values({
      orderNumber: `SO-${String(i + 1).padStart(4, "0")}`,
      customerId: randPick(crmCusts).id,
      modelId: randPick(models).id,
      quantity: qty,
      unitPrice: String(price),
      totalAmount: String(qty * price),
      status: randPick(["pending", "confirmed", "in_production", "ready", "shipped", "delivered"]),
      orderDate: daysAgo(rand(1, 90)),
      deliveryDate: daysAgo(rand(-30, 60)),
    } as any);
  }
  console.log(`  ✓ 20 sales orders`);

  // ─── 23. Warehouses ───
  console.log("🏭 Seeding warehouses...");
  const whData = [
    { code: "WH-01", name: "مستودع الخامات", type: "raw_material" as const, isDefault: true },
    { code: "WH-02", name: "مستودع المنتج النهائي", type: "finished_goods" as const },
    { code: "WH-03", name: "مستودع WIP", type: "work_in_progress" as const },
  ];
  for (const w of whData) await db.insert(warehouses).values(w as any);
  const whs = await db.select().from(warehouses);
  console.log(`  ✓ ${whs.length} warehouses`);

  // ─── 24. Print Settings ───
  console.log("🖨️ Seeding print settings...");
  await db.insert(printSettings).values({
    companyName: "مصنع هورايزن للملابس الجاهزة",
    address: "المنطقة الصناعية، العاشر من رمضان، الشرقية",
    phone: "015-555-7890",
    email: "info@horizon-factory.com",
    taxNumber: "123-456-789",
    headerText: "مصنع هورايزن - ملابس جاهزة بجودة عالمية",
    footerText: "شكراً لتعاملكم معنا",
  } as any);
  console.log(`  ✓ Print settings`);

  // ─── 25. System Settings ───
  console.log("⚙️ Seeding system settings...");
  const settings = [
    { key: "factory_name", value: "Horizon Garment Factory" },
    { key: "factory_code", value: "HGF-001" },
    { key: "timezone", value: "Africa/Cairo" },
    { key: "currency", value: "EGP" },
    { key: "language", value: "ar" },
  ];
  for (const s of settings) await db.insert(systemSettings).values(s);
  console.log(`  ✓ System settings`);

  // ─── 26. Tech Packs ───
  console.log("📐 Seeding tech packs...");
  for (const model of models.slice(0, 5)) {
    await db.insert(techPacks).values({
      modelId: model.id,
      packNumber: `TP-${model.modelCode}`,
      version: "1.0",
      description: `Tech pack لـ ${model.name}`,
      fabricSpecs: "100% قطن، 180 جرام/م²",
      trimSpecs: "أزرار بلاستيك، سحاب معدني",
      measurementChart: "S:صدر 96، M:صدر 100، L:صدر 104",
      status: "approved",
    } as any);
  }
  console.log(`  ✓ 5 tech packs`);

  // ─── 27. Fabric Rolls ───
  console.log("🧵 Seeding fabric rolls...");
  const sups = await db.select().from(suppliers);
  const rollColors = ["أبيض", "أسود", "أحمر", "أزرق", "رمادي", "بيج", "كحلي"];
  for (let i = 0; i < 15; i++) {
    await db.insert(fabricRolls).values({
      rollNumber: `RL-${String(i + 1).padStart(4, "0")}`,
      lotNumber: `LOT-${String(rand(1, 100)).padStart(3, "0")}`,
      supplierId: randPick(sups).id,
      fabricType: randPick(["قطن", "بوليستر", "كتان", "جينز","فيسكوز"]),
      color: randPick(rollColors),
      width: String(rand(140, 180)),
      length: String(rand(50, 200)),
      weight: String(rand(10, 50)),
      receivedDate: daysAgo(rand(1, 90)),
      status: randPick(["available", "available", "in_use"]),
    } as any);
  }
  console.log(`  ✓ 15 fabric rolls`);

  // ─── 28. SAM Records ───
  console.log("⏱️ Seeding SAM records...");
  const operations = ["قص القماش", "تجهيز القطع", "خياطة الكتف", "خياطة الجانب", "تركيب الياقة", "تركيب الكم", "خياطة الأسفل", "كي", "تفتيش", "تغليف"];
  for (const model of models.slice(0, 3)) {
    for (const op of operations) {
      const sam = rand(0.5, 5);
      await db.insert(samRecords).values({
        modelId: model.id,
        operationName: op,
        samMinutes: String(sam),
        targetPerHour: Math.round(60 / sam),
        effectiveSam: String(sam * 1.15),
      } as any);
    }
  }
  console.log(`  ✓ SAM records seeded`);

  // ─── 29. Style-Color-Size Matrix ───
  console.log("🎨 Seeding style-color-size matrix...");
  const colors = ["أبيض", "أسود", "أحمر", "أزرق", "رمادي"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  for (const model of models.slice(0, 3)) {
    for (const color of colors) {
      for (let i = 0; i < sizes.length; i++) {
        await db.insert(styleColorSizeMatrix).values({
          modelId: model.id,
          styleCode: `${model.modelCode}-${color}`,
          color,
          size: sizes[i],
          sizeOrder: i + 1,
          quantity: rand(100, 500),
          unitPrice: String(rand(80, 300)),
          barcode: `${model.modelCode}${color.charCodeAt(0)}${sizes[i]}`,
        } as any);
      }
    }
  }
  console.log(`  ✓ Style-color-size matrix seeded`);

  // ─── 30. Production Forecasts ───
  console.log("📈 Seeding production forecasts...");
  for (let i = 0; i < 10; i++) {
    await db.insert(productionForecasts).values({
      modelId: randPick(models).id,
      lineId: randPick(lines).id,
      forecastType: randPick(["demand", "capacity", "material"]),
      period: monthStr(rand(1, 12)),
      predictedValue: String(rand(1000, 10000)),
      confidence: String(rand(70, 95)),
      algorithm: "linear_regression",
    } as any);
  }
  console.log(`  ✓ 10 forecasts`);

  // ─── 31. Audit Log ───
  console.log("📋 Seeding audit log...");
  const tables = ["employees", "departments", "productionOrders", "inventoryItems", "salesOrders"];
  const actions = ["INSERT", "UPDATE", "DELETE"] as const;
  for (let i = 0; i < 20; i++) {
    await db.insert(auditLog).values({
      tableName: randPick(tables),
      recordId: rand(1, 100),
      action: randPick(actions),
      changedByName: randPick(emps).fullName,
      oldValues: JSON.stringify({ status: "old" }),
      newValues: JSON.stringify({ status: "new" }),
    } as any);
  }
  console.log(`  ✓ 20 audit log entries`);

  // ─── 32. Work Orders ───
  console.log("🔨 Seeding work orders...");
  for (let i = 0; i < 15; i++) {
    const qty = rand(100, 1000);
    await db.insert(workOrders).values({
      orderNumber: `WO-${String(i + 1).padStart(4, "0")}`,
      productionOrderId: randPick(orders).id,
      modelId: randPick(models).id,
      lineId: randPick(lines).id,
      quantity: qty,
      completed: rand(0, qty),
      status: randPick(["in_progress", "pending", "completed"]),
      priority: randPick(["normal", "high"]),
    } as any);
  }
  console.log(`  ✓ 15 work orders`);

  // ─── 33. Bundles ───
  console.log("📦 Seeding bundles...");
  for (let i = 0; i < 30; i++) {
    await db.insert(bundles).values({
      bundleCode: `BN-${String(i + 1).padStart(5, "0")}`,
      modelId: randPick(models).id,
      size: randPick(sizes),
      color: randPick(colors),
      quantity: rand(10, 50),
      currentStage: randPick(stageNames),
      status: randPick(["cutting", "sewing", "ironing", "qc", "packed"]),
    } as any);
  }
  console.log(`  ✓ 30 bundles`);

  // ─── 34. QC Records ───
  console.log("✅ Seeding QC records...");
  for (let i = 0; i < 20; i++) {
    const checked = rand(50, 200);
    const passed = Math.floor(checked * rand(85, 99) / 100);
    await db.insert(qcRecords).values({
      orderId: randPick(orders).id,
      stage: randPick(["inline", "input", "output", "final"]),
      checkedQuantity: checked,
      passedQuantity: passed,
      defectedQuantity: checked - passed,
      date: daysAgo(rand(1, 30)),
    } as any);
  }
  console.log(`  ✓ 20 QC records`);

  // ─── 35. Finished Goods ───
  console.log("👕 Seeding finished goods...");
  const finishedGoodsWH = whs.find(w => w.type === "finished_goods") || whs[1];
  const finishedGoodsData = [
    { sku: "FG-001", modelId: models[0].id, modelName: models[0].name, color: "أبيض", size: "M", quantity: 500, availableQty: 450, reservedQty: 50, unitCost: "45.00", sellingPrice: "85.00", status: "in_stock" as const, warehouseId: finishedGoodsWH.id },
    { sku: "FG-002", modelId: models[1].id, modelName: models[1].name, color: "أزرق", size: "L", quantity: 300, availableQty: 300, reservedQty: 0, unitCost: "60.00", sellingPrice: "110.00", status: "in_stock" as const, warehouseId: finishedGoodsWH.id },
    { sku: "FG-003", modelId: models[2].id, modelName: models[2].name, color: "أسود", size: "XL", quantity: 400, availableQty: 380, reservedQty: 20, unitCost: "75.00", sellingPrice: "135.00", status: "in_stock" as const, warehouseId: finishedGoodsWH.id },
    { sku: "FG-004", modelId: models[3].id, modelName: models[3].name, color: "رمادي", size: "S", quantity: 200, availableQty: 200, reservedQty: 0, unitCost: "90.00", sellingPrice: "160.00", status: "in_stock" as const, warehouseId: finishedGoodsWH.id },
    { sku: "FG-005", modelId: models[4].id, modelName: models[4].name, color: "أحمر", size: "M", quantity: 150, availableQty: 120, reservedQty: 30, unitCost: "55.00", sellingPrice: "95.00", status: "in_stock" as const, warehouseId: finishedGoodsWH.id },
  ];
  for (const fg of finishedGoodsData) {
    await db.insert(finishedGoods).values(fg);
    // Add to inventoryItems with category finished_goods as well
    await db.insert(inventoryItems).values({
      sku: fg.sku,
      name: fg.modelName,
      category: "finished_goods",
      unit: "قطعة",
      quantity: fg.quantity,
      minStock: 50,
      reorderPoint: 100,
      unitCost: fg.unitCost,
      status: "in_stock",
    } as any);
  }
  console.log(`  ✓ 5 finished goods seeded`);

  // ─── 36. BOM and MRP Records ───
  console.log("🛠️ Seeding BOM and MRP Records...");
  const rawMaterials = await db.select().from(inventoryItems).where(sql`category != 'finished_goods'`);
  const seededModels = await db.select().from(productionModels);
  const seededOrders = await db.select().from(productionOrders);

  // Seed BOM for first 5 models
  for (const model of seededModels.slice(0, 5)) {
    const material1 = rawMaterials[rand(0, 4)];
    const material2 = rawMaterials[rand(5, 9)];
    if (material1 && material2) {
      await db.insert(bomRecords).values({
        modelId: model.id,
        itemId: material1.id,
        quantity: "1.500",
        unit: material1.unit,
        notes: "مادة أساسية"
      });
      await db.insert(bomRecords).values({
        modelId: model.id,
        itemId: material2.id,
        quantity: "0.250",
        unit: material2.unit,
        notes: "مادة مساعدة"
      });
    }
  }

  // Seed MRP for first 2 production orders to link them to raw materials
  for (const order of seededOrders.slice(0, 2)) {
    const material = rawMaterials[rand(0, 9)];
    if (material) {
      await db.insert(mrpRecords).values({
        productionOrderId: order.id,
        itemId: material.id,
        requiredQuantity: order.quantity * 2,
        availableQuantity: material.quantity || 100,
        shortage: Math.max(0, (order.quantity * 2) - (material.quantity || 0)),
        status: (material.quantity || 0) >= order.quantity * 2 ? "available" as const : "shortage" as const
      });
    }
  }
  console.log(`  ✓ BOM and MRP records seeded`);

  // ─── 37. General Ledger Double-Entry Transaction ───
  console.log("📓 Seeding General Ledger Journal Entry...");
  const cashAccount = dbAccts.find(a => a.code === "110000");
  const capitalAccount = dbAccts.find(a => a.code === "310000");
  if (cashAccount && capitalAccount) {
    const entryId = "JV-2025-001";
    const entryDate = new Date();
    
    // Balanced Double-Entry: Debit Cash (100,000) and Credit Capital (100,000)
    await db.insert(generalLedger).values({
      entryId,
      lineNumber: 1,
      date: entryDate,
      accountId: cashAccount.id,
      debit: "100000.00",
      credit: "0.00",
      sourceType: "manual_journal" as const,
      description: "إيداع رأس المال النقدي الافتتاحي في الخزينة",
      fiscalYear: "2025",
      period: "06-2025",
    } as any);

    await db.insert(generalLedger).values({
      entryId,
      lineNumber: 2,
      date: entryDate,
      accountId: capitalAccount.id,
      debit: "0.00",
      credit: "100000.00",
      sourceType: "manual_journal" as const,
      description: "إيداع رأس المال النقدي الافتتاحي في الخزينة",
      fiscalYear: "2025",
      period: "06-2025",
    } as any);
    console.log(`  ✓ GL Entry JV-2025-001 created (Balanced: 100,000)`);
  }

  const seededSuppliers = await db.select().from(suppliers);

  // Redefining colors and sizes locally for safety
  const mockColors = ["أبيض", "أسود", "أحمر", "أزرق", "رمادي"];
  const mockSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  // ─── 38. Users ───
  console.log("👤 Seeding system users...");
  await db.insert(users).values({ unionId: "usr_1", name: "أحمد المسؤول", email: "admin@horizon.eg", role: "admin" } as any);
  await db.insert(users).values({ unionId: "usr_2", name: "محمد المستخدم", email: "user@horizon.eg", role: "user" } as any);

  // ─── 39. Shift Assignments ───
  console.log("🕐 Seeding shift assignments...");
  for (const emp of emps) {
    await db.insert(shiftAssignments).values({
      employeeId: emp.id,
      shiftId: randPick(shiftRecs).id,
      startDate: daysAgo(30),
    } as any);
  }

  // ─── 40. Inventory Transactions ───
  console.log("📦 Seeding inventory transactions...");
  const seededInvItems = await db.select().from(inventoryItems);
  for (const item of seededInvItems) {
    await db.insert(inventoryTransactions).values({
      itemId: item.id,
      type: "in",
      quantity: item.quantity || 100,
      notes: "رصيد افتتاحي للمخزن",
      createdAt: daysAgo(30),
    } as any);
  }

  // ─── 41. Supply Orders & Supply Order Items ───
  console.log("🚚 Seeding supply orders...");
  const rawMaterialsOnly = seededInvItems.filter(i => i.category !== "finished_goods");
  for (let i = 0; i < 10; i++) {
    const supplier = randPick(seededSuppliers);
    const orderNum = `SPO-${String(i+1).padStart(4, "0")}`;
    await db.insert(supplyOrders).values({
      orderNumber: orderNum,
      supplierId: supplier.id,
      status: randPick(["received", "sent", "partial"]),
      totalAmount: "5000.00",
      expectedDate: daysAgo(-5),
      receivedDate: daysAgo(2),
    } as any);
    const order = (await db.select().from(supplyOrders).where(sql`orderNumber = ${orderNum}`))[0];
    const item1 = randPick(rawMaterialsOnly);
    if (order && item1) {
      await db.insert(supplyOrderItems).values({
        supplyOrderId: order.id,
        itemId: item1.id,
        quantity: rand(100, 500),
        unitPrice: item1.unitCost || "10.00",
        receivedQuantity: rand(50, 100),
      } as any);
    }
  }

  // ─── 42. Cutting Orders ───
  console.log("✂️ Seeding cutting orders...");
  const cuttingEmps = emps.filter(e => e.jobTitle.includes("قص") || e.role === "عامل");
  const cutWorker = cuttingEmps[0] || emps[0];
  for (let i = 0; i < 15; i++) {
    const model = randPick(models);
    await db.insert(cuttingOrders).values({
      orderNumber: `CO-${String(i+1).padStart(4, "0")}`,
      modelId: model.id,
      fabricDescription: "خامة قطن ممتازة",
      color: randPick(mockColors),
      size: randPick(mockSizes),
      quantity: rand(500, 2000),
      cutQuantity: rand(100, 500),
      status: randPick(["cutting", "completed", "pending"]),
      assignedTo: cutWorker.id,
      dueDate: daysAgo(-10),
    } as any);
  }

  // ─── 43. Bundle Tracking ───
  console.log("📍 Seeding bundle tracking...");
  const seededBundles = await db.select().from(bundles);
  for (const bundle of seededBundles.slice(0, 10)) {
    await db.insert(bundleTracking).values({
      bundleId: bundle.id,
      stage: bundle.currentStage || "قص",
      employeeId: randPick(emps).id,
      notes: "تم الفحص والمسح بنجاح",
    } as any);
  }

  // ─── 44. Challans & Challan Items ───
  console.log("🚛 Seeding challans...");
  for (let i = 0; i < 10; i++) {
    const challanNum = `CH-${String(i+1).padStart(4, "0")}`;
    await db.insert(challans).values({
      challanNumber: challanNum,
      type: "dispatch",
      customerName: randPick(crmCusts).name,
      totalItems: rand(100, 500),
      status: randPick(["shipped", "delivered", "ready"]),
      vehicleNumber: "ق ص أ 1234",
      driverName: "سيد أبو العلا",
      shippedAt: daysAgo(2),
    } as any);
    const challan = (await db.select().from(challans).where(sql`challanNumber = ${challanNum}`))[0];
    if (challan) {
      await db.insert(challanItems).values({
        challanId: challan.id,
        description: "تيشيرتات معبأة",
        quantity: rand(100, 500),
      } as any);
    }
  }

  // ─── 45. Subcontracts ───
  console.log("🤝 Seeding subcontracting contracts...");
  for (let i = 0; i < 10; i++) {
    const supplier = randPick(seededSuppliers);
    await db.insert(subcontracts).values({
      contractNumber: `SC-${String(i+1).padStart(4, "0")}`,
      supplierId: supplier.id,
      modelId: randPick(models).id,
      description: "تفصيل خياطة وتجهيز عينات عاجلة",
      quantity: rand(500, 2000),
      receivedQuantity: rand(100, 500),
      unitPrice: "15.00",
      totalAmount: "15000.00",
      status: randPick(["in_progress", "completed", "pending"]),
      startDate: daysAgo(10),
      endDate: daysAgo(-10),
    } as any);
  }

  // ─── 46. CRM Interactions ───
  console.log("📞 Seeding CRM interactions...");
  for (const customer of crmCusts) {
    await db.insert(crmInteractions).values({
      customerId: customer.id,
      type: randPick(["call", "meeting", "email"]),
      subject: "متابعة طلبية المبيعات",
      content: "تم الاتصال بالعميل وأفاد برغبته في زيادة كمية الطلبية القادمة بنسبة 20%",
      followUpDate: daysAgo(-7),
      createdBy: randPick(emps).id,
    } as any);
  }

  // ─── 47. Cost Calculations ───
  console.log("📊 Seeding cost calculations...");
  for (const model of models) {
    await db.insert(costCalculations).values({
      modelId: model.id,
      fabricCost: "25.00",
      laborCost: "15.00",
      overheadCost: "10.00",
      trimCost: "5.00",
      otherCost: "5.00",
      totalCost: "60.00",
      profitMargin: "25.00",
      sellingPrice: "75.00",
      minOrderQuantity: 100,
      notes: "حساب تكلفة تقديري بناء على عينات الموسم الماضي"
    } as any);
  }

  // ─── 48. Product Lifecycle (PLM) ───
  console.log("🔄 Seeding product lifecycle stages...");
  const lifecycleStages = ["concept", "design", "tech_pack", "sampling", "costing", "production"] as const;
  for (const model of models.slice(0, 5)) {
    for (let sIdx = 0; sIdx < lifecycleStages.length; sIdx++) {
      await db.insert(productLifecycle).values({
        modelId: model.id,
        stage: lifecycleStages[sIdx],
        stageOrder: sIdx + 1,
        status: sIdx < 4 ? "completed" as const : sIdx === 4 ? "in_progress" as const : "pending" as const,
        assignedTo: randPick(emps).id,
        startDate: daysAgo(15 - sIdx * 2),
        targetDate: daysAgo(-5),
      } as any);
    }
  }

  // ─── 49. Design Revisions & Sample Reviews ───
  console.log("📐 Seeding design revisions and sample reviews...");
  const seededTechPacks = await db.select().from(techPacks);
  for (const tp of seededTechPacks) {
    await db.insert(designRevisions).values({
      modelId: tp.modelId,
      techPackId: tp.id,
      revisionNumber: "1.1",
      changeDescription: "تعديل طول الكم بمقدار 2 سم بناء على طلب العميل",
      status: "approved",
    } as any);
    await db.insert(sampleReviews).values({
      modelId: tp.modelId,
      techPackId: tp.id,
      sampleType: "fit",
      size: "M",
      color: "أزرق",
      reviewerName: "جون دو",
      reviewDate: daysAgo(5),
      comments: "القياسات ممتازة ومطابقة للمواصفات",
      decision: "approved",
      status: "decided",
    } as any);
  }

  // ─── 50. Warehouse Bins ───
  console.log("🏭 Seeding warehouse bins...");
  for (const wh of whs) {
    for (let r = 1; r <= 3; r++) {
      await db.insert(warehouseBins).values({
        warehouseId: wh.id,
        binCode: `BIN-${wh.code}-R${r}`,
        aisle: "A",
        rack: String(r),
        shelf: "1",
        capacity: 1000,
        currentQty: 100,
        status: "partial",
      } as any);
    }
  }

  // ─── 51. Reorder Rules ───
  console.log("🔔 Seeding inventory reorder rules...");
  for (const item of rawMaterialsOnly.slice(0, 5)) {
    await db.insert(reorderRules).values({
      itemId: item.id,
      warehouseId: whs[0].id,
      supplierId: randPick(seededSuppliers).id,
      minStock: 100,
      maxStock: 1000,
      reorderPoint: 200,
      reorderQty: 500,
      autoReorder: true,
      status: "active",
    } as any);
  }

  // ─── 52. Cut Plans & Marker Plans ───
  console.log("📐 Seeding cut plans and marker plans...");
  for (let i = 0; i < 5; i++) {
    const order = randPick(orders);
    const model = randPick(models);
    const planNum = `CP-${String(i+1).padStart(4, "0")}`;
    await db.insert(cutPlans).values({
      planNumber: planNum,
      orderId: order.id,
      modelId: model.id,
      layCount: 50,
      plyHeight: 10,
      spreadType: "face_up",
      totalPieces: 500,
      status: "planned",
    } as any);
    const plan = (await db.select().from(cutPlans).where(sql`planNumber = ${planNum}`))[0];
    if (plan) {
      await db.insert(markerPlans).values({
        markerNumber: `MP-${plan.planNumber}`,
        cutPlanId: plan.id,
        modelId: plan.modelId,
        markerLength: "6.50",
        markerWidth: "1.50",
        fabricUtilization: "85.50",
        piecesPerMarker: 4,
        status: "approved",
      } as any);
    }
  }

  // ─── 53. Line Balancing ───
  console.log("📈 Seeding line balancing configurations...");
  for (const line of lines) {
    const model = randPick(models);
    await db.insert(lineBalancing).values({
      lineId: line.id,
      modelId: model.id,
      operationSequence: 1,
      operationName: "خياطة الكتف",
      samMinutes: "1.20",
      workstations: 2,
      operators: 2,
      targetOutput: 400,
      actualOutput: 380,
      efficiency: "95.00",
      bottleneck: false,
    } as any);
  }

  // ─── 54. Buyer Portal Users ───
  console.log("💻 Seeding buyer portal users...");
  for (const customer of crmCusts) {
    await db.insert(buyerPortalUsers).values({
      customerId: customer.id,
      fullName: `مشتري من ${customer.name}`,
      email: `buyer@${customer.email?.split("@")[1] || "buyer.eg"}`,
      password: "password_hash",
      role: "buyer_admin",
      status: "active",
    } as any);
  }

  // ─── 55. Purchase Requests & Items ───
  console.log("🛒 Seeding purchase requests...");
  for (let i = 0; i < 5; i++) {
    const prNum = `PR-${String(i+1).padStart(4, "0")}`;
    await db.insert(purchaseRequests).values({
      prNumber: prNum,
      department: "الخياطة",
      requestedBy: "أحمد طلبات",
      status: randPick(["approved", "pending_approval", "draft"]),
      priority: "normal",
      requiredDate: daysAgo(-15),
    } as any);
    const pr = (await db.select().from(purchaseRequests).where(sql`prNumber = ${prNum}`))[0];
    if (pr) {
      await db.insert(purchaseRequestItems).values({
        purchaseRequestId: pr.id,
        itemId: randPick(rawMaterialsOnly).id,
        quantity: rand(100, 1000),
        notes: "مطلوب للإنتاج المستقبلي",
      } as any);
    }
  }
  const seededPRs = await db.select().from(purchaseRequests);

  // ─── 56. Purchase Orders & Items ───
  console.log("📦 Seeding purchase orders...");
  for (let i = 0; i < 5; i++) {
    const supplier = randPick(seededSuppliers);
    const pr = seededPRs[i] || seededPRs[0];
    const poNum = `PO-${String(i+1).padStart(4, "0")}`;
    await db.insert(purchaseOrders).values({
      poNumber: poNum,
      supplierId: supplier.id,
      purchaseRequestId: pr?.id || null,
      orderDate: daysAgo(10),
      expectedDeliveryDate: daysAgo(-10),
      subtotal: "15000.00",
      totalAmount: "17100.00",
      status: randPick(["confirmed", "sent", "draft"]),
      paymentTerms: "30 يوم",
    } as any);
    const po = (await db.select().from(purchaseOrders).where(sql`poNumber = ${poNum}`))[0];
    if (po) {
      await db.insert(purchaseOrderItems).values({
        purchaseOrderId: po.id,
        itemId: randPick(rawMaterialsOnly).id,
        quantity: rand(500, 2000),
        unitPrice: "10.00",
        total: "15000.00",
      } as any);
    }
  }
  const seededPOs = await db.select().from(purchaseOrders);

  // ─── 57. RFQs, RFQ Items & Responses ───
  console.log("📝 Seeding RFQs...");
  for (let i = 0; i < 5; i++) {
    const pr = seededPRs[i] || seededPRs[0];
    const rfqNum = `RFQ-${String(i+1).padStart(4, "0")}`;
    await db.insert(rfqs).values({
      rfqNumber: rfqNum,
      purchaseRequestId: pr?.id || null,
      title: "شراء لوازم الخيوط والأزرار",
      description: "مطلوب عروض أسعار لتوريد خيوط بوليستر وأزرار بيضاء وسوداء",
      status: randPick(["bidding", "sent", "draft"]),
      deadline: daysAgo(-5),
    } as any);
    const rfq = (await db.select().from(rfqs).where(sql`rfqNumber = ${rfqNum}`))[0];
    if (rfq) {
      await db.insert(rfqItems).values({
        rfqId: rfq.id,
        itemId: randPick(rawMaterialsOnly).id,
        quantity: 1000,
        specifications: "مواصفات قياسية مضادة للقطع",
      } as any);
      for (const supplier of seededSuppliers.slice(0, 2)) {
        await db.insert(rfqResponses).values({
          rfqId: rfq.id,
          supplierId: supplier.id,
          unitPrice: "12.00",
          totalPrice: "12000.00",
          deliveryDays: 5,
        } as any);
      }
    }
  }

  // ─── 58. Goods Receipts & Items ───
  console.log("✅ Seeding goods receipts (GRN)...");
  for (let i = 0; i < 5; i++) {
    const po = seededPOs[i] || seededPOs[0];
    const supplier = randPick(seededSuppliers);
    const grNum = `GR-${String(i+1).padStart(4, "0")}`;
    if (po) {
      await db.insert(goodsReceipts).values({
        grNumber: grNum,
        purchaseOrderId: po.id,
        supplierId: supplier.id,
        receiptDate: daysAgo(2),
        invoiceNumber: `INV-${po.poNumber}`,
        subtotal: "15000.00",
        totalAmount: "17100.00",
        status: "fully_accepted",
      } as any);
      const gr = (await db.select().from(goodsReceipts).where(sql`grNumber = ${grNum}`))[0];
      if (gr) {
        await db.insert(goodsReceiptItems).values({
          goodsReceiptId: gr.id,
          purchaseOrderItemId: 1, // dummy
          itemId: randPick(rawMaterialsOnly).id,
          orderedQuantity: 1000,
          receivedQuantity: 1000,
          acceptedQuantity: 1000,
        } as any);
      }
    }
  }

  // ─── 59. Sales Pipeline Stages & Opportunities ───
  console.log("💰 Seeding sales pipeline and opportunities...");
  const pipelineStages = [
    { name: "فرصة جديدة", order: 1, color: "#3182ce", probability: "10.00" },
    { name: "تواصل أولي", order: 2, color: "#805ad5", probability: "30.00" },
    { name: "عرض فني ومالي", order: 3, color: "#dd6b20", probability: "60.00" },
    { name: "تفاوض نهائي", order: 4, color: "#319795", probability: "90.00" },
  ];
  for (const stage of pipelineStages) {
    await db.insert(salesPipelineStages).values(stage);
  }
  const dbStages = await db.select().from(salesPipelineStages);
  for (let i = 0; i < 10; i++) {
    await db.insert(salesOpportunities).values({
      title: `طلبية مبيعات تصدير - ${i+1}`,
      customerId: randPick(crmCusts).id,
      stageId: randPick(dbStages).id,
      expectedValue: "50000.00",
      probability: "50.00",
      expectedCloseDate: daysAgo(-30),
      status: "open",
    } as any);
  }

  // ─── 60. Sales Commissions ───
  console.log("💸 Seeding sales commissions...");
  const salesEmps = emps.filter(e => e.role.includes("مندوب") || e.jobTitle.includes("مبيعات"));
  const commissionWorker = salesEmps[0] || emps[0];
  const seededSalesOrders = await db.select().from(salesOrders);
  for (let i = 0; i < seededSalesOrders.length; i++) {
    await db.insert(salesCommissions).values({
      employeeId: commissionWorker.id,
      salesOrderId: seededSalesOrders[i].id,
      commissionRate: "5.00",
      saleAmount: seededSalesOrders[i].totalAmount || "10000",
      commissionAmount: String(Number(seededSalesOrders[i].totalAmount || 10000) * 0.05),
      isPaid: randPick([true, false]),
      period: "2025-06",
      notes: "حساب عمولة المبيعات للموسم الحالي",
    } as any);
  }

  // ─── 61. Shipments & Shipment Items ───
  console.log("📦 Seeding shipments...");
  for (let i = 0; i < 5; i++) {
    const order = seededSalesOrders[i] || seededSalesOrders[0];
    if (order) {
      const trkNum = `TRK-${String(i+1).padStart(6, "0")}`;
      await db.insert(shipments).values({
        trackingNumber: trkNum,
        salesOrderId: order.id,
        customerId: order.customerId,
        carrier: "DHL Egypt",
        shippingDate: daysAgo(3),
        estimatedDeliveryDate: daysAgo(-1),
        shippingCost: "500.00",
        status: "in_transit",
      } as any);
      const sh = (await db.select().from(shipments).where(sql`trackingNumber = ${trkNum}`))[0];
      if (sh) {
        await db.insert(shipmentItems).values({
          shipmentId: sh.id,
          salesOrderItemId: 1, // dummy
          itemId: randPick(rawMaterialsOnly).id,
          quantity: 100,
        } as any);
      }
    }
  }

  // ─── 62. Machine Maintenance Records ───
  console.log("⚙️ Seeding machine maintenance...");
  const seededMachines = await db.select().from(machines);
  for (const machine of seededMachines) {
    await db.insert(maintenanceRecords).values({
      machineId: machine.id,
      maintenanceType: randPick(["preventive", "corrective"]),
      title: "صيانة ماكينة دورية",
      description: "تنظيف الأجزاء الداخلية وتغيير الزيت وفحص السيور والتروس",
      scheduledDate: daysAgo(5),
      completedDate: daysAgo(5),
      cost: "250.00",
      technicianName: "المهندس عادل صيانة",
      status: "completed",
    } as any);
  }

  // ─── 63. Sales Invoices, GRNs & Purchase Invoices ───
  console.log("🧾 Seeding financial invoices (Sales & Purchase)...");
  // Sales Invoices
  for (let i = 0; i < seededSalesOrders.length; i++) {
    const order = seededSalesOrders[i];
    await db.insert(salesInvoices).values({
      invoiceNumber: `SINV-2025-${String(i+1).padStart(4, "0")}`,
      salesOrderId: order.id,
      customerId: order.customerId,
      issueDate: daysAgo(15),
      dueDate: daysAgo(-15),
      subtotal: order.totalAmount || "5000",
      vatAmount: String(Number(order.totalAmount || 5000) * 0.14),
      totalAmount: String(Number(order.totalAmount || 5000) * 1.14),
      status: "issued",
    } as any);
  }
  // GRNs (for purchase invoice references)
  for (let i = 0; i < 5; i++) {
    await db.insert(grns).values({
      grnNumber: `GRN-2025-${String(i+1).padStart(4, "0")}`,
      supplyOrderId: i+1, // dummy ref
      supplierId: seededSuppliers[0].id,
      receivedDate: daysAgo(5),
      subtotal: "10000.00",
      totalAmount: "11400.00",
      status: "fully_received",
    } as any);
  }
  const dbGRNs = await db.select().from(grns);
  // Purchase Invoices
  for (let i = 0; i < dbGRNs.length; i++) {
    await db.insert(purchaseInvoices).values({
      invoiceNumber: `PINV-2025-${String(i+1).padStart(4, "0")}`,
      grnId: dbGRNs[i].id,
      supplierId: dbGRNs[i].supplierId,
      issueDate: daysAgo(5),
      dueDate: daysAgo(-25),
      subtotal: "10000.00",
      totalAmount: "11400.00",
      status: "received",
    } as any);
  }
  const dbSalesInvoices = await db.select().from(salesInvoices);

  // ─── 64. Opening Balances ───
  console.log("💵 Seeding opening balances...");
  for (const acct of dbAccts) {
    await db.insert(openingBalances).values({
      fiscalYear: "2025",
      accountId: acct.id,
      debit: acct.code.startsWith("5") || acct.code.startsWith("1") ? "10000.00" : "0.00",
      credit: acct.code.startsWith("2") || acct.code.startsWith("3") || acct.code.startsWith("4") ? "10000.00" : "0.00",
      balance: "10000.00",
      posted: true,
    } as any);
  }

  // ─── 65. Treasury Accounts & Transactions ───
  console.log("💰 Seeding treasury accounts and logs...");
  const cashAcct = dbAccts.find(a => a.code === "110000");
  const bankAcct = dbAccts.find(a => a.code === "120000");
  await db.insert(treasuryAccounts).values({
    name: "الخزينة الرئيسية للمصنع",
    code: "TR-CASH-01",
    type: "cash",
    openingBalance: "50000.00",
    currentBalance: "50000.00",
    isDefault: true,
    accountId: cashAcct?.id || 1,
  } as any);
  await db.insert(treasuryAccounts).values({
    name: "حساب البنك الأهلي الجاري",
    code: "TR-BANK-01",
    type: "bank",
    bankName: "البنك الأهلي المصري",
    accountNumber: "12345678901234",
    openingBalance: "200000.00",
    currentBalance: "200000.00",
    isDefault: false,
    accountId: bankAcct?.id || 2,
  } as any);
  const dbTreasuries = await db.select().from(treasuryAccounts);
  for (const tr of dbTreasuries) {
    await db.insert(treasuryTransactions).values({
      treasuryAccountId: tr.id,
      type: "receipt",
      amount: "5000.00",
      date: daysAgo(2),
      reference: "رصيد افتتاح",
      partyType: "other",
      partyName: "الخزينة",
    } as any);
  }

  // ─── 66. Credit Limits & Aging Buckets ───
  console.log("💳 Seeding credit limits and debt aging...");
  for (const customer of crmCusts) {
    await db.insert(creditLimits).values({
      customerId: customer.id,
      creditLimit: "100000.00",
      paymentTermDays: 30,
      currentBalance: "15000.00",
      totalInvoiced: "25000.00",
      totalPaid: "10000.00",
      isActive: true,
    } as any);
    const customerInvoice = dbSalesInvoices.find(inv => inv.customerId === customer.id);
    if (customerInvoice) {
      await db.insert(agingBuckets).values({
        customerId: customer.id,
        invoiceId: customerInvoice.id,
        invoiceNumber: customerInvoice.invoiceNumber,
        invoiceDate: customerInvoice.issueDate,
        dueDate: customerInvoice.dueDate || daysAgo(-30),
        amount: customerInvoice.totalAmount,
        balance: customerInvoice.totalAmount,
        bucket1_30: customerInvoice.totalAmount,
      } as any);
    }
  }

  // ─── 67. Vouchers (Payment, Receipt, Journal & Lines) ───
  console.log("🎫 Seeding vouchers (payment, receipt, journal)...");
  for (let i = 0; i < 5; i++) {
    await db.insert(paymentVouchers).values({
      voucherNumber: `PV-${String(i+1).padStart(4, "0")}`,
      voucherDate: daysAgo(5),
      payeeName: "مصاريف الكهرباء والصيانة",
      payeeType: "other",
      amount: "1500.00",
      paymentMethod: "cash",
      status: "approved",
    } as any);
    await db.insert(receiptVouchers).values({
      voucherNumber: `RV-${String(i+1).padStart(4, "0")}`,
      voucherDate: daysAgo(5),
      payerName: "دفعة تحت الحساب العميل",
      payerType: "customer",
      payerId: crmCusts[0].id,
      amount: "5000.00",
      paymentMethod: "cash",
      status: "approved",
    } as any);
    const jvNum = `JV-${String(i+1).padStart(4, "0")}`;
    await db.insert(journalVouchers).values({
      voucherNumber: jvNum,
      voucherDate: daysAgo(5),
      description: "قيد إثبات استهلاك وإهلاك المعدات الشهري",
      totalDebit: "2000.00",
      totalCredit: "2000.00",
      status: "posted",
    } as any);
    const jv = (await db.select().from(journalVouchers).where(sql`voucherNumber = ${jvNum}`))[0];
    if (jv) {
      await db.insert(journalVoucherLines).values({
        journalVoucherId: jv.id,
        accountCode: "520000",
        accountName: "مصروفات إهلاك الأصول",
        debit: "2000.00",
        credit: "0.00",
      } as any);
      await db.insert(journalVoucherLines).values({
        journalVoucherId: jv.id,
        accountCode: "110000",
        accountName: "مجمع إهلاك الأصول",
        debit: "0.00",
        credit: "2000.00",
      } as any);
    }
  }

  // ─── 68. Defect Types ───
  console.log("❌ Seeding defect types...");
  const defects = [
    { code: "DEF-SEW-01", name: "خياطة مفكوكة", category: "sewing" as const, severity: "major" as const },
    { code: "DEF-CUT-01", name: "قص غير متساوي", category: "cutting" as const, severity: "critical" as const },
    { code: "DEF-FAB-01", name: "بقعة زيت في القماش", category: "appearance" as const, severity: "minor" as const },
    { code: "DEF-FIT-01", name: "خطأ في المقاس النهائي", category: "measurement" as const, severity: "major" as const },
  ];
  for (const d of defects) {
    await db.insert(defectTypes).values(d);
  }

  // ─── 69. Expense Categories & Expenses ───
  console.log("💸 Seeding expense records...");
  const categories = [
    { name: "إيجار المصنع والمنشآت", code: "EXP-RENT" },
    { name: "كهرباء ومياه وإنترنت", code: "EXP-UTIL" },
    { name: "رواتب ومكافآت العاملين", code: "EXP-SAL" },
    { name: "صيانة ماكينات ومعدات", code: "EXP-MAINT" },
  ];
  for (const cat of categories) {
    await db.insert(expenseCategories).values(cat);
  }
  const dbCategories = await db.select().from(expenseCategories);
  for (let i = 0; i < 5; i++) {
    const cat = randPick(dbCategories);
    await db.insert(expenses).values({
      expenseNumber: `EXP-${String(i+1).padStart(4, "0")}`,
      categoryId: cat.id,
      title: `فاتورة ${cat.name} لشهر يونيو`,
      amount: "5000.00",
      expenseDate: daysAgo(5),
      status: "paid",
      totalAmount: "5700.00",
      vatAmount: "700.00",
    } as any);
  }

  // ─── 70. Wastage Records ───
  console.log("♻️ Seeding wastage logs...");
  for (let i = 0; i < 5; i++) {
    await db.insert(wastageRecords).values({
      wastageNumber: `WST-${String(i+1).padStart(4, "0")}`,
      sourceType: "cutting",
      modelId: models[0].id,
      itemId: rawMaterialsOnly[0].id,
      wastageType: "end_bit",
      quantity: "1.500",
      unit: "متر",
      unitCost: "50.00",
      totalCost: "75.00",
      status: "approved",
      wastageDate: daysAgo(5),
    } as any);
  }

  // ─── 71. Sales Rep Visits & Orders ───
  console.log("🕴️ Seeding sales representative visits and orders...");
  const repWorker = salesEmps[0] || emps[0];
  for (let i = 0; i < 5; i++) {
    const customer = randPick(crmCusts);
    const visitNum = `VIS-${String(i+1).padStart(4, "0")}`;
    await db.insert(salesRepVisits).values({
      visitNumber: visitNum,
      salesRepId: repWorker.id,
      salesRepName: repWorker.fullName,
      customerId: customer.id,
      customerName: customer.name,
      visitType: "scheduled",
      status: "completed",
      scheduledDate: daysAgo(1),
      actualStartTime: daysAgo(1),
      purpose: "زيارة دورية لعرض المنتجات الجديدة ومتابعة الحسابات",
      outcome: "تم الاتفاق على طلبية جديدة بقيمة 15000 جنيه وتم تحصيل 5000 جنيه دفعة كاش",
    } as any);
    const visit = (await db.select().from(salesRepVisits).where(sql`visitNumber = ${visitNum}`))[0];
    if (visit) {
      await db.insert(salesRepOrders).values({
        orderNumber: `SRO-${String(i+1).padStart(4, "0")}`,
        salesRepId: repWorker.id,
        salesRepName: repWorker.fullName,
        visitId: visit.id,
        customerId: customer.id,
        customerName: customer.name,
        modelId: models[0].id,
        modelName: models[0].name,
        color: "أبيض",
        size: "M",
        quantity: 200,
        unitPrice: "75.00",
        totalAmount: "15000.00",
        grandTotal: "15000.00",
        status: "approved",
      } as any);
    }
  }

  // ─── 72. Quotations & Quotation Items ───
  console.log("📄 Seeding customer quotations...");
  for (let i = 0; i < 5; i++) {
    const customer = randPick(crmCusts);
    const qtNum = `QT-${String(i+1).padStart(4, "0")}`;
    await db.insert(quotations).values({
      quotationNumber: qtNum,
      customerId: customer.id,
      issueDate: daysAgo(10),
      expiryDate: daysAgo(-20),
      subtotal: "10000.00",
      totalAmount: "11400.00",
      status: randPick(["sent", "accepted", "draft"]),
    } as any);
    const qt = (await db.select().from(quotations).where(sql`quotationNumber = ${qtNum}`))[0];
    if (qt) {
      await db.insert(quotationItems).values({
        quotationId: qt.id,
        modelId: models[0].id,
        description: "تيشيرت قطن مميز مطرز بشعار العميل",
        quantity: 200,
        unitPrice: "50.00",
        lineTotal: "10000.00",
      } as any);
    }
  }

  // ─── 73. Activities (Audit Trail) ───
  console.log("📝 Seeding system activity logs...");
  for (let i = 0; i < 15; i++) {
    await db.insert(activities).values({
      userId: 1,
      userName: "أحمد المسؤول",
      action: randPick(["دخول النظام", "إنشاء طلبية مبيعات", "تعديل إعدادات"]),
      entityType: "system",
      description: "تفاصيل العملية والنشاط تمت بنجاح",
    } as any);
  }

  // ─── 74. Machine Depreciation ───
  console.log("📉 Seeding machine depreciation logs...");
  for (const machine of seededMachines) {
    await db.insert(machineDepreciation).values({
      machineId: machine.id,
      year: 2025,
      period: "06-2025",
      depreciationAmount: "500.00",
      accumulatedDepreciation: "2000.00",
      bookValue: "18000.00",
    } as any);
  }

  // ─── 75. Order Amendments ───
  console.log("✏️ Seeding sales order amendments...");
  for (let i = 0; i < 5; i++) {
    const order = seededSalesOrders[0];
    if (order) {
      await db.insert(orderAmendments).values({
        salesOrderId: order.id,
        fieldName: "quantity",
        oldValue: "500",
        newValue: "600",
        reason: "زيادة الطلب الفعلي من الفروع التابعة للعميل",
      } as any);
    }
  }

  // ─── 76. Delivery Reminders ───
  console.log("⏰ Seeding delivery reminders...");
  for (let i = 0; i < 5; i++) {
    const order = seededSalesOrders[0];
    if (order) {
      await db.insert(deliveryReminders).values({
        salesOrderId: order.id,
        reminderType: "7_days",
        sent: true,
        sentAt: daysAgo(1),
      } as any);
    }
  }

  // ─── 77. Fiscal Years ───
  console.log("📅 Seeding fiscal years...");
  await db.insert(fiscalYears).values({
    name: "FY-2025",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    status: "open",
    isCurrent: true,
  } as any);

  // ─── 78. Company Settings ───
  console.log("🏢 Seeding company profile settings...");
  await db.insert(companySettings).values({
    companyName: "شركة هورايزن للملابس الجاهزة والمنسوجات",
    companyNameEn: "Horizon Garment & Textiles Co.",
    address: "العاشر من رمضان، المنطقة الصناعية الثالثة",
    phone: "010-000-1111",
    email: "management@horizon.eg",
    taxNumber: "987-654-321",
    commercialRegister: "CR-12345",
    currency: "EGP",
  } as any);

  // ─── 79. Integration Logs ───
  console.log("🔗 Seeding automatic integration logs...");
  await db.insert(integrationLogs).values({
    event: "sales_order_sync",
    sourceModule: "sales",
    targetModule: "accounting",
    sourceNumber: "SO-0001",
    targetNumber: "JV-2025-0012",
    status: "success",
    details: "تم ترحيل وتأكيد الفاتورة بنجاح في نظام الحسابات والمخازن",
  } as any);

  console.log("\n✅ Seed complete! All tables populated with comprehensive mock data.");
}

seed().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
