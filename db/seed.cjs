// Seed with correct camelCase column names (matching Drizzle schema)
const mysql = require('mysql2/promise');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };

async function seed() {
  const conn = await mysql.createConnection({
    host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
    port: 4000, user: '3MBKRYVvwZoxRUD.root',
    password: 'yZc3ehZrZaL5GcEJkJbCnHLKGPG6OF93',
    database: '19eb3aac-0b12-875c-8000-09f71b45fbd0',
    ssl: { rejectUnauthorized: true }
  });

  const q = (sql, params) => conn.execute(sql, params);

  // 1. Departments
  for (const d of [['الإدارة','الإدارة العليا','#4A2C3F'],['الخياطة','خطوط الإنتاج','#059669'],['القص','قسم القص','#D97706'],['الكي والتغليف','التعبئة','#7C3AED'],['مراقبة الجودة','الجودة','#DC2626'],['المستودع','المخزن','#2563EB'],['المالية','الحسابات','#0891B2'],['المبيعات','المبيعات','#BE185D']])
    await q('INSERT INTO departments (name, description, color) VALUES (?, ?, ?)', d);
  const [depts] = await conn.execute('SELECT id FROM departments');
  console.log('+D' + depts.length);

  // 2. Employees
  const names = ['أحمد محمد','محمد أحمد','محمود إبراهيم','خالد سعيد','عمر حسن','فاطمة علي','سارة محمود','نورا خالد','هاني عادل','تامر فؤاد','سامي جمال','وليد عبدالله','إيمان سالم','ريم أسامة','كريم نادر','دعاء طارق','ياسر منصور','رانيا عصام','هشام مجدي','سمر كمال'];
  const roles = ['مدير','مشرف','فني','عامل','محاسب','مندوب'];
  const jobs = ['مدير مصنع','مشرف خط','خياط','قصاص','كواية','فني جودة','محاسب','مندوب مبيعات','عامل مستودع'];
  const dids = depts.map(r => r.id);
  for (let i = 0; i < names.length; i++) {
    await q('INSERT INTO employees (employeeCode, fullName, email, phone, departmentId, role, jobTitle, joinDate, salary, status, employmentType, salaryType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['EMP' + String(i+1).padStart(3,'0'), names[i], 'emp' + (i+1) + '@factory.local', '01' + rand(0,9) + rand(10000000,99999999), pick(dids), pick(roles), pick(jobs), ago(rand(30,1000)), String(rand(3000,15000)), pick(['active','active','active','on_leave','inactive']), pick(['full_time','full_time','contract']), pick(['monthly','monthly','piece_rate'])]);
  }
  const [emps] = await conn.execute('SELECT id, status, salaryType FROM employees');
  const eids = emps.map(r => r.id);
  console.log('+E' + eids.length);

  // 3. Production Lines
  for (const l of [['خط الخياطة أ','sewing',50],['خط الخياطة ب','sewing',45],['خط القص','cutting',30],['خط الكي','ironing',40],['خط التغليف','packing',60]])
    await q('INSERT INTO productionLines (name, lineType, capacity) VALUES (?, ?, ?)', l);
  const [lines] = await conn.execute('SELECT id FROM productionLines');
  const lids = lines.map(r => r.id);
  console.log('+L' + lids.length);

  // 4. Production Models
  for (const m of [['MDL-001','تيشيرت قطن','ملابس علوية'],['MDL-002','قميص رسمي','ملابس رسمية'],['MDL-003','بنطلون جينز','ملابس سفلية'],['MDL-004','جاكت شتوي','معاطف'],['MDL-005','فستان صيفي','فساتين'],['MDL-006','بلوزة حريمي','ملابس علوية']])
    await q('INSERT INTO productionModels (modelCode, name, category) VALUES (?, ?, ?)', m);
  const [models] = await conn.execute('SELECT id FROM productionModels');
  const mids = models.map(r => r.id);
  console.log('+M' + mids.length);

  // 5. Production Orders
  const custs = ['H&M','Zara','Max','LC Waikiki','DeFacto'];
  for (let i = 0; i < 12; i++)
    await q('INSERT INTO productionOrders (orderCode, styleName, customerName, quantity, lineId, status, startDate, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['PO-' + String(i+1).padStart(4,'0'), pick(['تيشيرت','قميص','بنطلون','جاكت','فستان']) + ' ' + pick(['صيفي','شتوي']), pick(custs), rand(500,5000), pick(lids), pick(['in_progress','pending','completed']), ago(rand(1,60)), pick(['normal','high'])]);
  const [ords] = await conn.execute('SELECT id FROM productionOrders');
  const oids = ords.map(r => r.id);
  console.log('+O' + oids.length);

  // 6. Attendance
  const active = emps.filter(e => e.status === 'active');
  for (let d = 0; d < 30; d++) { const dt = ago(d); if (new Date(dt).getDay() === 5) continue;
    for (const e of active.slice(0,15)) await q('INSERT INTO attendance (employeeId, date, status, hoursWorked) VALUES (?, ?, ?, ?)', [e.id, dt, pick(['present','present','present','late','absent']), pick(['7','7.5','8','8.5','9'])]);
  }
  console.log('+Att');

  // 7. Daily Production
  for (let d = 0; d < 30; d++) { const dt = ago(d); if (new Date(dt).getDay() === 5) continue;
    for (const lid of lids) await q('INSERT INTO dailyProduction (lineId, orderId, date, produced, defected, workersCount, hoursWorked) VALUES (?, ?, ?, ?, ?, ?, ?)', [lid, pick(oids), dt, rand(50,500), rand(0,20), rand(10,45), String(rand(7,9))]);
  }
  console.log('+DP');

  // 8. Machines
  for (const m of [['MC-001','ماكينة خياطة Juki','sewing','Juki'],['MC-002','ماكينة خياطة Brother','sewing','Brother'],['MC-003','ماكينة أوفر','overlock','Juki'],['MC-004','ماكينة قص','cutting','Eastman'],['MC-005','مكواة بخار','ironing','Pony']])
    await q('INSERT INTO machines (machineCode, name, type, brand, lineId, cost, status, nextMaintenance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [m[0], m[1], m[2], m[3], pick(lids), String(rand(5000,50000)), pick(['operational','operational','operational','maintenance','broken']), ago(rand(-30,90))]);
  console.log('+Mach');

  // 9. Inventory
  for (const i of [['FAB-001','قماش قطن أبيض','fabric','متر',100],['FAB-002','قماش قطن أسود','fabric','متر',80],['FAB-003','قماش جينز','fabric','متر',50],['THR-001','خيط بوليستر','thread','بكرة',200],['ZIP-001','سحاب معدني','zipper','متر',100]])
    await q('INSERT INTO inventoryItems (sku, name, category, unit, quantity, minStock, unitCost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [i[0], i[1], i[2], i[3], rand(i[4], i[4]*5), i[4], String(rand(5,100)), 'in_stock']);
  console.log('+Inv');

  // 10. CRM + Sales
  for (const c of [['H&M Egypt','wholesale'],['Zara Egypt','wholesale'],['Max Fashion','corporate'],['LC Waikiki','wholesale']]) await q('INSERT INTO crmCustomers (name, customerType, status) VALUES (?, ?, ?)', [c[0], c[1], 'active']);
  const [crmR] = await conn.execute('SELECT id FROM crmCustomers');
  for (let i = 0; i < 10; i++) { const qy = rand(100,2000), pr = rand(50,300); await q('INSERT INTO salesOrders (orderNumber, customerId, modelId, quantity, unitPrice, totalAmount, status, orderDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ['SO-' + String(i+1).padStart(4,'0'), pick(crmR.map(r=>r.id)), pick(mids), qy, String(pr), String(qy*pr), pick(['pending','confirmed','shipped','delivered']), ago(rand(1,90))]); }
  console.log('+CRM+Sales');

  // 11. Payroll + Advances + Bonus
  for (const e of emps) await q('INSERT INTO payrollRecords (employeeId, month, basicSalary, bonus, deductions, netPay, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [e.id, '2025-06', String(rand(3000,15000)), String(rand(0,2000)), String(rand(0,1000)), String(rand(2500,16000)), 'processed']);
  for (let i = 0; i < 10; i++) await q('INSERT INTO advances (employeeId, amount, reason, status) VALUES (?, ?, ?, ?)', [pick(eids), String(rand(500,5000)), pick(['ظروف طارئة','مصاريف علاج']), pick(['approved','pending'])]);
  for (let i = 0; i < 15; i++) await q('INSERT INTO bonusPenalties (employeeId, type, category, amount, reason, month) VALUES (?, ?, ?, ?, ?, ?)', [pick(eids), pick(['bonus','penalty']), pick(['حضور','إنتاج','جودة']), String(rand(100,2000)), pick(['مكافأة حضور','جزاء تأخير']), '2025-' + String(rand(1,6)).padStart(2,'0')]);
  console.log('+Pay+Adv+Bon');

  // 12. Model Stages + Product Lifecycle + SAM
  const stgs = ['قص','تجهيز','خياطة','كي','تفتيش','تغليف'];
  for (const m of mids) for (let i = 0; i < stgs.length; i++) await q('INSERT INTO modelStages (modelId, name, sequence, unitPrice) VALUES (?, ?, ?, ?)', [m, stgs[i], i+1, String(rand(2,15))]);
  const lcs = ['concept','design','tech_pack','sampling','costing','buyer_approval','bulk_fabric','cutting','production','finishing','qc_final','packing','shipped'];
  for (const m of mids.slice(0,3)) for (let i = 0; i < lcs.length; i++) await q('INSERT INTO productLifecycle (modelId, stage, stageOrder, status) VALUES (?, ?, ?, ?)', [m, lcs[i], i+1, i < 8 ? 'completed' : i === 8 ? 'in_progress' : 'pending']);
  const ops = ['قص القماش','تجهيز','خياطة الكتف','خياطة الجانب','تركيب الياقة','تركيب الكم','خياطة الأسفل','كي','تفتيش','تغليف'];
  for (const m of mids.slice(0,2)) for (const o of ops) { const sm = rand(5,50)/10; await q('INSERT INTO samRecords (modelId, operationName, samMinutes, targetPerHour, effectiveSam) VALUES (?, ?, ?, ?, ?)', [m, o, String(sm), Math.round(60/sm), String(sm*1.15)]); }
  console.log('+Stages+LC+SAM');

  // 13. QC + Bundles + Cost
  for (let i = 0; i < 15; i++) { const ch = rand(50,200), pa = Math.floor(ch * rand(85,99) / 100); await q('INSERT INTO qcRecords (orderId, stage, checkedQuantity, passedQuantity, defectedQuantity, date) VALUES (?, ?, ?, ?, ?, ?)', [pick(oids), pick(['inline','input','output','final']), ch, pa, ch-pa, ago(rand(1,30))]); }
  const sz = ['XS','S','M','L','XL','XXL']; const cl = ['أبيض','أسود','أحمر','أزرق'];
  for (let i = 0; i < 20; i++) await q('INSERT INTO bundles (bundleCode, modelId, size, color, quantity, currentStage, status) VALUES (?, ?, ?, ?, ?, ?, ?)', ['BN-' + String(i+1).padStart(5,'0'), pick(mids), pick(sz), pick(cl), rand(10,50), pick(stgs), pick(['cutting','sewing','ironing'])]);
  for (const m of mids.slice(0,3)) { const fc = rand(20,50), lc = rand(15,40), oc = rand(10,30), tc = rand(5,20), tot = fc+lc+oc+tc; await q('INSERT INTO costCalculations (modelId, fabricCost, laborCost, overheadCost, trimCost, totalCost, sellingPrice) VALUES (?, ?, ?, ?, ?, ?, ?)', [m, String(fc), String(lc), String(oc), String(tc), String(tot), String(Math.round(tot*1.3))]); }
  console.log('+QC+Bundles+Cost');

  // 14. Settings
  await q('INSERT INTO printSettings (companyName, address, phone, email, headerText, footerText) VALUES (?, ?, ?, ?, ?, ?)', ['مصنع هورايزن', 'العاشر من رمضان', '015-555-7890', 'info@horizon-factory.com', 'مصنع هورايزن', 'شكراً لتعاملكم']);
  for (const s of [['factory_name','Horizon Factory'],['currency','EGP']]) await q('INSERT INTO systemSettings (key, value) VALUES (?, ?)', s);
  console.log('+Settings');

  await conn.end();
  console.log('\n✅ Seed complete!');
}
seed().catch(e => { console.error(e.message.substring(0, 300)); process.exit(1); });
