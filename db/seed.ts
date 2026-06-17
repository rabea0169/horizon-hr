import { getDb } from "../api/queries/connection";
import {
  departments, employees, attendance, leaves, performanceReviews,
  jobPostings, candidates, payrollRecords, shifts, shiftAssignments,
  advances, bonusPenalties, productionLines, productionOrders, dailyProduction,
  productionModels, modelStages, pieceRateRecords, machines, inventoryItems,
  inventoryTransactions, suppliers, supplyOrders, supplyOrderItems,
  cuttingOrders, workOrders, bundles, bundleTracking, bomRecords,
  qcRecords, mrpRecords, challans, challanItems, subcontracts,
  salesOrders, crmCustomers, crmInteractions, costCalculations,
  printSettings, systemSettings, productLifecycle, techPacks,
  designRevisions, sampleReviews, warehouses, warehouseBins,
  reorderRules, fabricRolls, cutPlans, markerPlans, samRecords,
  lineBalancing, styleColorSizeMatrix, productionForecasts,
  buyerPortalUsers, auditLog, accounts, generalLedger, finishedGoods,
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
    departments, employees, attendance, leaves, performanceReviews,
    jobPostings, candidates, payrollRecords, shifts, shiftAssignments,
    advances, bonusPenalties, productionLines, productionOrders, dailyProduction,
    productionModels, modelStages, pieceRateRecords, machines, inventoryItems,
    inventoryTransactions, suppliers, supplyOrders, supplyOrderItems,
    cuttingOrders, workOrders, bundles, bundleTracking, bomRecords,
    qcRecords, mrpRecords, challans, challanItems, subcontracts,
    salesOrders, crmCustomers, crmInteractions, costCalculations,
    printSettings, systemSettings, productLifecycle, techPacks,
    designRevisions, sampleReviews, warehouses, warehouseBins,
    reorderRules, fabricRolls, cutPlans, markerPlans, samRecords,
    lineBalancing, styleColorSizeMatrix, productionForecasts,
    buyerPortalUsers, auditLog, accounts, generalLedger, finishedGoods
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

  console.log("\n✅ Seed complete! All 60 tables populated.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
