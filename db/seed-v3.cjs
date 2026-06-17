// Use Drizzle ORM for seeding (matches schema.ts exactly)
require('dotenv/config');
const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');
const schema = require('./schema.cjs');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

async function seed() {
  const client = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(client, { schema, mode: 'planetscale' });

  console.log('🌱 Seeding with Drizzle ORM...');

  // 1. Departments
  const deptData = [
    { name: 'الإدارة', description: 'الإدارة العليا', color: '#4A2C3F' },
    { name: 'الخياطة', description: 'خطوط الإنتاج', color: '#059669' },
    { name: 'القص', description: 'قسم القص', color: '#D97706' },
    { name: 'الكي والتغليف', description: 'التعبئة', color: '#7C3AED' },
    { name: 'مراقبة الجودة', description: 'الجودة', color: '#DC2626' },
    { name: 'المستودع', description: 'المخزن', color: '#2563EB' },
    { name: 'المالية', description: 'الحسابات', color: '#0891B2' },
    { name: 'المبيعات', description: 'المبيعات', color: '#BE185D' },
  ];
  for (const d of deptData) await db.insert(schema.departments).values(d);
  const depts = await db.select().from(schema.departments);
  const deptIds = depts.map(r => r.id);
  console.log(`  ✓ ${deptIds.length} departments`);

  // 2. Employees
  const names = ['أحمد محمد','محمد أحمد','محمود إبراهيم','خالد سعيد','عمر حسن','فاطمة علي','سارة محمود','نورا خالد','هاني عادل','تامر فؤاد','سامي جمال','وليد عبدالله','إيمان سالم','ريم أسامة','كريم نادر','دعاء طارق','ياسر منصور','رانيا عصام','هشام مجدي','سمر كمال'];
  const roles = ['مدير','مشرف','فني','عامل','محاسب','مندوب'];
  const jobs = ['مدير مصنع','مشرف خط','خياط','قصاص','كواية','فني جودة','محاسب','مندوب مبيعات','عامل مستودع'];
  for (let i = 0; i < names.length; i++) {
    await db.insert(schema.employees).values({
      employeeCode: `EMP${String(i+1).padStart(3,'0')}`,
      fullName: names[i], email: `emp${i+1}@factory.local`,
      phone: `01${rand(0,9)}${rand(10000000,99999999)}`,
      departmentId: pick(deptIds), role: pick(roles), jobTitle: pick(jobs),
      joinDate: daysAgo(rand(30,1000)), salary: String(rand(3000,15000)),
      status: pick(['active','active','active','on_leave','inactive']),
      employmentType: pick(['full_time','full_time','contract']),
      salaryType: pick(['monthly','monthly','piece_rate']),
    });
  }
  const emps = await db.select().from(schema.employees);
  const empIds = emps.map(r => r.id);
  console.log(`  ✓ ${empIds.length} employees`);

  // 3. Production Lines
  for (const l of [['خط الخياطة أ','sewing',50],['خط الخياطة ب','sewing',45],['خط القص','cutting',30],['خط الكي','ironing',40],['خط التغليف','packing',60]]) {
    await db.insert(schema.productionLines).values({ name: l[0], lineType: l[1], capacity: l[2] });
  }
  const lines = await db.select().from(schema.productionLines);
  const lineIds = lines.map(r => r.id);
  console.log(`  ✓ ${lineIds.length} lines`);

  // 4. Production Models
  const models = [
    { modelCode: 'MDL-001', name: 'تيشيرت قطن', category: 'ملابس علوية' },
    { modelCode: 'MDL-002', name: 'قميص رسمي', category: 'ملابس رسمية' },
    { modelCode: 'MDL-003', name: 'بنطلون جينز', category: 'ملابس سفلية' },
    { modelCode: 'MDL-004', name: 'جاكت شتوي', category: 'معاطف' },
    { modelCode: 'MDL-005', name: 'فستان صيفي', category: 'فساتين' },
    { modelCode: 'MDL-006', name: 'بلوزة حريمي', category: 'ملابس علوية' },
  ];
  for (const m of models) await db.insert(schema.productionModels).values(m);
  const modelRecs = await db.select().from(schema.productionModels);
  const modelIds = modelRecs.map(r => r.id);
  console.log(`  ✓ ${modelIds.length} models`);

  // 5. Production Orders
  const customers = ['H&M','Zara','Max','LC Waikiki','DeFacto'];
  for (let i = 0; i < 12; i++) {
    await db.insert(schema.productionOrders).values({
      orderCode: `PO-${String(i+1).padStart(4,'0')}`,
      styleName: `${pick(['تيشيرت','قميص','بنطلون','جاكت','فستان'])} ${pick(['صيفي','شتوي'])}`,
      customerName: pick(customers), quantity: rand(500,5000),
      lineId: pick(lineIds), status: pick(['in_progress','pending','completed']),
      startDate: daysAgo(rand(1,60)), priority: pick(['normal','high']),
    });
  }
  const orders = await db.select().from(schema.productionOrders);
  const orderIds = orders.map(r => r.id);
  console.log(`  ✓ ${orderIds.length} orders`);

  // 6. Attendance
  const activeEmps = emps.filter(e => e.status === 'active');
  for (let d = 0; d < 30; d++) {
    const date = daysAgo(d);
    if (date.getDay() === 5) continue;
    for (const emp of activeEmps.slice(0, 15)) {
      await db.insert(schema.attendance).values({
        employeeId: emp.id, date,
        status: pick(['present','present','present','late','absent']),
        hoursWorked: String(rand(7,9)),
      });
    }
  }
  console.log('  ✓ Attendance');

  // 7. Daily Production
  for (let d = 0; d < 30; d++) {
    const date = daysAgo(d);
    if (date.getDay() === 5) continue;
    for (const lid of lineIds) {
      await db.insert(schema.dailyProduction).values({
        lineId: lid, orderId: pick(orderIds), date,
        produced: rand(50,500), defected: rand(0,20), workersCount: rand(10,45),
        hoursWorked: String(rand(7,9)),
      });
    }
  }
  console.log('  ✓ Daily production');

  // 8. Machines
  const machineData = [
    { machineCode: 'MC-001', name: 'ماكينة خياطة Juki', type: 'sewing', brand: 'Juki' },
    { machineCode: 'MC-002', name: 'ماكينة خياطة Brother', type: 'sewing', brand: 'Brother' },
    { machineCode: 'MC-003', name: 'ماكينة أوفر', type: 'overlock', brand: 'Juki' },
    { machineCode: 'MC-004', name: 'ماكينة قص', type: 'cutting', brand: 'Eastman' },
    { machineCode: 'MC-005', name: 'مكواة بخار', type: 'ironing', brand: 'Pony' },
  ];
  for (const m of machineData) {
    await db.insert(schema.machines).values({
      ...m, lineId: pick(lineIds), cost: String(rand(5000,50000)),
      status: pick(['operational','operational','operational','maintenance','broken']),
      nextMaintenance: daysAgo(rand(-30,90)),
    });
  }
  console.log(`  ✓ ${machineData.length} machines`);

  // 9. Inventory
  const invItems = [
    { sku: 'FAB-001', name: 'قماش قطن أبيض', category: 'fabric', unit: 'متر', minStock: 100, reorderPoint: 50 },
    { sku: 'FAB-002', name: 'قماش قطن أسود', category: 'fabric', unit: 'متر', minStock: 80 },
    { sku: 'FAB-003', name: 'قماش جينز', category: 'fabric', unit: 'متر', minStock: 50 },
    { sku: 'THR-001', name: 'خيط بوليستر', category: 'thread', unit: 'بكرة', minStock: 200 },
    { sku: 'ZIP-001', name: 'سحاب معدني', category: 'zipper', unit: 'متر', minStock: 100 },
  ];
  for (const item of invItems) {
    await db.insert(schema.inventoryItems).values({
      ...item, quantity: rand(item.minStock, item.minStock * 5),
      unitCost: String(rand(5,100)), status: 'in_stock',
    });
  }
  console.log(`  ✓ ${invItems.length} inventory items`);

  // 10. Suppliers
  for (const s of [['النيل للأقمشة','محمد النيل'],['مصر للخيوط','أحمد سعيد'],['العبور للإكسسوارات','خالد عبور']]) {
    await db.insert(schema.suppliers).values({ name: s[0], contactPerson: s[1], status: 'active' });
  }
  console.log('  ✓ 3 suppliers');

  // 11. CRM Customers
  for (const c of [['H&M Egypt','wholesale'],['Zara Egypt','wholesale'],['Max Fashion','corporate'],['LC Waikiki','wholesale']]) {
    await db.insert(schema.crmCustomers).values({ name: c[0], customerType: c[1], status: 'active' });
  }
  const custs = await db.select().from(schema.crmCustomers);
  const custIds = custs.map(r => r.id);
  console.log(`  ✓ ${custIds.length} customers`);

  // 12. Sales Orders
  for (let i = 0; i < 10; i++) {
    const qty = rand(100, 2000), price = rand(50, 300);
    await db.insert(schema.salesOrders).values({
      orderNumber: `SO-${String(i+1).padStart(4,'0')}`, customerId: pick(custIds),
      modelId: pick(modelIds), quantity: qty, unitPrice: String(price),
      totalAmount: String(qty * price), status: pick(['pending','confirmed','shipped','delivered']),
      orderDate: daysAgo(rand(1,90)),
    });
  }
  console.log('  ✓ 10 sales orders');

  // 13. Print & System Settings
  await db.insert(schema.printSettings).values({
    companyName: 'مصنع هورايزن', address: 'العاشر من رمضان',
    phone: '015-555-7890', email: 'info@horizon-factory.com',
  });
  for (const s of [['factory_name','Horizon Factory'],['currency','EGP']]) {
    await db.insert(schema.systemSettings).values({ key: s[0], value: s[1] });
  }
  console.log('  ✓ Settings');

  // 14. Payroll
  for (const emp of emps) {
    await db.insert(schema.payrollRecords).values({
      employeeId: emp.id, month: '2025-06',
      basicSalary: String(rand(3000,15000)), bonus: String(rand(0,2000)),
      deductions: String(rand(0,1000)), netPay: String(rand(2500,16000)), status: 'processed',
    });
  }
  console.log(`  ✓ ${emps.length} payroll records`);

  // 15. Model Stages
  const stages = ['قص','تجهيز','خياطة','كي','تفتيش','تغليف'];
  for (const m of modelIds) {
    for (let i = 0; i < stages.length; i++) {
      await db.insert(schema.modelStages).values({ modelId: m, name: stages[i], sequence: i+1, unitPrice: String(rand(2,15)) });
    }
  }
  console.log('  ✓ Model stages');

  // 16. Product Lifecycle
  const lcStages = ['concept','design','tech_pack','sampling','costing','buyer_approval','bulk_fabric','cutting','production','finishing','qc_final','packing','shipped'];
  for (const m of modelIds.slice(0, 3)) {
    for (let i = 0; i < lcStages.length; i++) {
      await db.insert(schema.productLifecycle).values({
        modelId: m, stage: lcStages[i], stageOrder: i+1,
        status: i < 8 ? 'completed' : i === 8 ? 'in_progress' : 'pending',
      });
    }
  }
  console.log('  ✓ Product lifecycle');

  await client.end();
  console.log('\n✅ Seed complete!');
}

seed().catch(e => { console.error(e.message.substring(0, 300)); process.exit(1); });
