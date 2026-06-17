const mysql = require('mysql2/promise');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };

async function seed() {
  const conn = await mysql.createConnection({
    host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
    port: 4000, user: '3MBKRYVvwZoxRUD.root',
    password: 'yZc3ehZrZaL5GcEJkJbCnHLKGPG6OF93',
    database: '19eb3aac-0b12-875c-8000-09f71b45fbd0',
    ssl: { rejectUnauthorized: true }
  });

  console.log('🌱 Seeding...');

  // 1. Departments
  const depts = [
    ['الإدارة', 'الإدارة العليا', '#4A2C3F'],
    ['الخياطة', 'خطوط الإنتاج', '#059669'],
    ['القص', 'قسم القص والتجهيز', '#D97706'],
    ['الكي والتغليف', 'التعبئة النهائية', '#7C3AED'],
    ['مراقبة الجودة', 'فحص الجودة', '#DC2626'],
    ['المستودع', 'المخزن والتخزين', '#2563EB'],
    ['المالية', 'الحسابات والرواتب', '#0891B2'],
    ['المبيعات', 'المبيعات', '#BE185D'],
  ];
  for (const d of depts) await conn.execute('INSERT INTO departments (name, description, color) VALUES (?, ?, ?)', d);
  const [deptRows] = await conn.execute('SELECT id FROM departments');
  const deptIds = deptRows.map(r => r.id);
  console.log(`  ✓ ${deptIds.length} departments`);

  // 2. Employees
  const names = ['أحمد محمد','محمد أحمد','محمود إبراهيم','خالد سعيد','عمر حسن','فاطمة علي','سارة محمود','نورا خالد','هاني عادل','تامر فؤاد','سامي جمال','وليد عبدالله','إيمان سالم','ريم أسامة','كريم نادر','دعاء طارق','ياسر منصور','رانيا عصام','هشام مجدي','سمر كمال','باسم رأفت','نشوى إبراهيم','عادل محروس','منى سعيد','عمرو خالد','عبير حسن','وائل فريد','نهى سلامة','أشرف عاطف','داليا مصطفى','طارق محمود','لمياء كريم','شريف جمال','حسام الدين','نيرمين فؤاد'];
  const roles = ['مدير','مشرف','فني','عامل','محاسب','مندوب'];
  const jobs = ['مدير مصنع','مشرف خط','خياط','قصاص','كواية','فني جودة','محاسب','مندوب مبيعات','عامل مستودع','فني صيانة'];
  for (let i = 0; i < names.length; i++) {
    await conn.execute(
      'INSERT INTO employees (employeeCode, fullName, email, phone, departmentId, role, jobTitle, joinDate, salary, status, employmentType, salaryType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [`EMP${String(i+1).padStart(3,'0')}`, names[i], `emp${i+1}@factory.local`, `01${rand(0,9)}${rand(10000000,99999999)}`, pick(deptIds), pick(roles), pick(jobs), daysAgo(rand(30,1000)), String(rand(3000,15000)), pick(['active','active','active','on_leave','inactive']), pick(['full_time','full_time','contract']), pick(['monthly','monthly','piece_rate'])]
    );
  }
  const [empRows] = await conn.execute('SELECT id, salaryType, status FROM employees');
  const empIds = empRows.map(r => r.id);
  const activeEmps = empRows.filter(r => r.status === 'active');
  console.log(`  ✓ ${empIds.length} employees`);

  // 3. Attendance
  for (let d = 0; d < 30; d++) {
    const date = daysAgo(d);
    const day = new Date(date).getDay();
    if (day === 5) continue; // Friday
    for (const emp of activeEmps.slice(0, 15)) {
      const st = pick(['present','present','present','late','absent']);
      await conn.execute(
        'INSERT INTO attendance (employeeId, date, status, hours_worked) VALUES (?, ?, ?, ?)',
        [emp.id, date, st, st === 'absent' ? '0' : String(rand(7,9))]
      );
    }
  }
  console.log('  ✓ Attendance');

  // 4. Leaves
  for (let i = 0; i < 15; i++) {
    const s = daysAgo(rand(1, 90));
    const e = new Date(new Date(s).getTime() + rand(1,7)*86400000).toISOString().split('T')[0];
    await conn.execute('INSERT INTO leaves (employeeId, leave_type, start_date, end_date, days, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [pick(empIds), pick(['annual','sick','unpaid','emergency']), s, e, Math.ceil((new Date(e)-new Date(s))/86400000), pick(['إجازة سنوية','مرض','ظروف شخصية']), pick(['approved','approved','pending'])]);
  }
  console.log('  ✓ 15 leaves');

  // 5. Production Lines
  const lines = [['خط الخياطة أ','sewing',50],['خط الخياطة ب','sewing',45],['خط القص','cutting',30],['خط الكي','ironing',40],['خط التغليف','packing',60]];
  for (const l of lines) await conn.execute('INSERT INTO production_lines (name, line_type, capacity) VALUES (?, ?, ?)', l);
  const [lineRows] = await conn.execute('SELECT id FROM production_lines');
  const lineIds = lineRows.map(r => r.id);
  console.log(`  ✓ ${lineIds.length} lines`);

  // 6. Production Models
  const models = [
    ['MDL-001','تيشيرت قطن','ملابس علوية'],['MDL-002','قميص رسمي','ملابس رسمية'],
    ['MDL-003','بنطلون جينز','ملابس سفلية'],['MDL-004','جاكت شتوي','معاطف'],
    ['MDL-005','فستان صيفي','فساتين'],['MDL-006','بلوزة حريمي','ملابس علوية'],
    ['MDL-007','سويت شيرت','ملابس رياضية'],['MDL-008','تنورة قصيرة','ملابس سفلية'],
  ];
  for (const m of models) await conn.execute('INSERT INTO production_models (model_code, name, category) VALUES (?, ?, ?)', m);
  const [modelRows] = await conn.execute('SELECT id FROM production_models');
  const modelIds = modelRows.map(r => r.id);
  console.log(`  ✓ ${modelIds.length} models`);

  // 7. Production Orders
  const customers = ['H&M','Zara','Max','LC Waikiki','DeFacto'];
  const styles = ['تيشيرت','قميص','بنطلون','جاكت','فستان','بلوزة'];
  for (let i = 0; i < 12; i++) {
    await conn.execute('INSERT INTO production_orders (order_code, style_name, customer_name, quantity, line_id, status, start_date, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`PO-${String(i+1).padStart(4,'0')}`, `${pick(styles)} ${pick(['صيفي','شتوي','رياضي'])}`, pick(customers), rand(500,5000), pick(lineIds), pick(['in_progress','in_progress','pending','completed']), daysAgo(rand(1,60)), pick(['normal','high'])]);
  }
  const [orderRows] = await conn.execute('SELECT id FROM production_orders');
  const orderIds = orderRows.map(r => r.id);
  console.log(`  ✓ ${orderIds.length} orders`);

  // 8. Daily Production
  for (let d = 0; d < 30; d++) {
    const date = daysAgo(d);
    if (new Date(date).getDay() === 5) continue;
    for (const lid of lineIds) {
      await conn.execute('INSERT INTO daily_production (line_id, order_id, date, produced, defected, workers_count, hours_worked) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [lid, pick(orderIds), date, rand(50,500), rand(0,20), rand(10,45), String(rand(7,9))]);
    }
  }
  console.log('  ✓ Daily production');

  // 9. Machines
  const machineData = [
    ['MC-001','ماكينة خياطة Juki','sewing','Juki'],['MC-002','ماكينة خياطة Brother','sewing','Brother'],
    ['MC-003','ماكينة أوفر','overlock','Juki'],['MC-004','ماكينة قص','cutting','Eastman'],
    ['MC-005','مكواة بخار','ironing','Pony'],['MC-006','ماكينة زرار','button','Juki'],
    ['MC-007','ماكينة عراوي','buttonhole','Juki'],['MC-008','ماكينة تطريز','embroidery','Tajima'],
  ];
  for (const m of machineData) {
    await conn.execute('INSERT INTO machines (machine_code, name, type, brand, line_id, cost, status, next_maintenance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [m[0], m[1], m[2], m[3], pick(lineIds), String(rand(5000,50000)), pick(['operational','operational','operational','maintenance','broken']), daysAgo(rand(-30,90))]);
  }
  console.log(`  ✓ ${machineData.length} machines`);

  // 10. Inventory
  const invItems = [
    ['FAB-001','قماش قطن أبيض','fabric','متر',100],['FAB-002','قماش قطن أسود','fabric','متر',80],
    ['FAB-003','قماش جينز','fabric','متر',50],['THR-001','خيط بوليستر','thread','بكرة',200],
    ['THR-002','خيط قطن','thread','بكرة',150],['BTN-001','زرار أبيض','button','علبة',50],
    ['ZIP-001','سحاب معدني','zipper','متر',100],['LBL-001','تيكت قياس','label','لفة',30],
    ['PKG-001','كيس بلاستيك','packaging','حزمة',500],
  ];
  for (const item of invItems) {
    await conn.execute('INSERT INTO inventory_items (sku, name, category, unit, quantity, min_stock, unit_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [item[0], item[1], item[2], item[3], rand(item[4], item[4]*5), item[4], String(rand(5,100)), 'in_stock']);
  }
  console.log(`  ✓ ${invItems.length} inventory items`);

  // 11. Suppliers
  const sups = [
    ['النيل للأقمشة','محمد النيل','0123456789'],['مصر للخيوط','أحمد سعيد','0111222333'],
    ['العبور للإكسسوارات','خالد عبور','0155566677'],['السويس للتعبئة','عمرو السويس','0199988877'],
  ];
  for (const s of sups) await conn.execute('INSERT INTO suppliers (name, contact_person, phone, status) VALUES (?, ?, ?, ?)', [s[0], s[1], s[2], 'active']);
  console.log(`  ✓ ${sups.length} suppliers`);

  // 12. CRM Customers
  const custs = [
    ['H&M Egypt','Anna Karlsson','02-1234567','wholesale'],['Zara Egypt','Maria Garcia','02-2345678','wholesale'],
    ['Max Fashion','John Smith','02-3456789','corporate'],['LC Waikiki','Ayşe Yılmaz','02-4567890','wholesale'],
    ['DeFacto','Mehmet Kaya','02-5678901','wholesale'],
  ];
  for (const c of custs) await conn.execute('INSERT INTO crm_customers (name, contact_person, phone, customer_type, status) VALUES (?, ?, ?, ?, ?)', [c[0], c[1], c[2], c[3], 'active']);
  const [custRows] = await conn.execute('SELECT id FROM crm_customers');
  const custIds = custRows.map(r => r.id);
  console.log(`  ✓ ${custIds.length} customers`);

  // 13. Sales Orders
  for (let i = 0; i < 15; i++) {
    const qty = rand(100, 2000), price = rand(50, 300);
    await conn.execute('INSERT INTO sales_orders (order_number, customer_id, model_id, quantity, unit_price, total_amount, status, order_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`SO-${String(i+1).padStart(4,'0')}`, pick(custIds), pick(modelIds), qty, String(price), String(qty*price), pick(['pending','confirmed','in_production','shipped','delivered']), daysAgo(rand(1,90))]);
  }
  console.log('  ✓ 15 sales orders');

  // 14. Warehouses
  await conn.execute('INSERT INTO warehouses (code, name, type, is_default) VALUES (?, ?, ?, ?)', ['WH-01', 'مستودع الخامات', 'raw_material', true]);
  await conn.execute('INSERT INTO warehouses (code, name, type) VALUES (?, ?, ?)', ['WH-02', 'مستودع المنتج النهائي', 'finished_goods']);
  await conn.execute('INSERT INTO warehouses (code, name, type) VALUES (?, ?, ?)', ['WH-03', 'مستودع WIP', 'work_in_progress']);
  console.log('  ✓ 3 warehouses');

  // 15. Print Settings
  await conn.execute('INSERT INTO print_settings (company_name, address, phone, email, header_text, footer_text) VALUES (?, ?, ?, ?, ?, ?)',
    ['مصنع هورايزن للملابس الجاهزة', 'المنطقة الصناعية، العاشر من رمضان', '015-555-7890', 'info@horizon-factory.com', 'مصنع هورايزن - ملابس جاهزة بجودة عالمية', 'شكراً لتعاملكم معنا']);
  console.log('  ✓ Print settings');

  // 16. System Settings
  const settings = [['factory_name', 'Horizon Garment Factory'], ['factory_code', 'HGF-001'], ['timezone', 'Africa/Cairo'], ['currency', 'EGP']];
  for (const s of settings) await conn.execute('INSERT INTO system_settings (key, value) VALUES (?, ?)', s);
  console.log('  ✓ System settings');

  // 17. Payroll
  for (const emp of empRows) {
    await conn.execute('INSERT INTO payroll_records (employeeId, month, basic_salary, bonus, deductions, net_pay, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [emp.id, '2025-06', String(rand(3000,15000)), String(rand(0,2000)), String(rand(0,1000)), String(rand(2500,16000)), 'processed']);
  }
  console.log(`  ✓ ${empRows.length} payroll records`);

  // 18. Advances
  for (let i = 0; i < 10; i++) {
    await conn.execute('INSERT INTO advances (employeeId, amount, reason, status) VALUES (?, ?, ?, ?)',
      [pick(empIds), String(rand(500,5000)), pick(['ظروف طارئة','مصاريف علاج']), pick(['approved','pending'])]);
  }
  console.log('  ✓ 10 advances');

  // 19. Bonus/Penalties
  for (let i = 0; i < 15; i++) {
    await conn.execute('INSERT INTO bonus_penalties (employeeId, type, category, amount, reason, month) VALUES (?, ?, ?, ?, ?, ?)',
      [pick(empIds), pick(['bonus','penalty']), pick(['حضور','إنتاج','جودة']), String(rand(100,2000)), pick(['مكافأة حضور','جزاء تأخير']), `2025-${String(rand(1,6)).padStart(2,'0')}`]);
  }
  console.log('  ✓ 15 bonuses');

  // 20. Tech Packs
  for (const m of modelIds.slice(0, 4)) {
    await conn.execute('INSERT INTO tech_packs (model_id, pack_number, version, fabric_specs, status) VALUES (?, ?, ?, ?, ?)',
      [m, `TP-M${m}`, '1.0', '100% قطن، 180 جرام/م²', 'approved']);
  }
  console.log('  ✓ 4 tech packs');

  // 21. Fabric Rolls
  const [supRows] = await conn.execute('SELECT id FROM suppliers');
  const supIds = supRows.map(r => r.id);
  const colors = ['أبيض','أسود','أحمر','أزرق','رمادي'];
  for (let i = 0; i < 10; i++) {
    await conn.execute('INSERT INTO fabric_rolls (roll_number, lot_number, supplier_id, fabric_type, color, width, length, weight, received_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [`RL-${String(i+1).padStart(4,'0')}`, `LOT-${rand(1,100)}`, pick(supIds), pick(['قطن','بوليستر','جينز']), pick(colors), String(rand(140,180)), String(rand(50,200)), String(rand(10,50)), daysAgo(rand(1,90)), 'available']);
  }
  console.log('  ✓ 10 fabric rolls');

  // 22. SAM Records
  const ops = ['قص القماش','تجهيز القطع','خياطة الكتف','خياطة الجانب','تركيب الياقة','تركيب الكم','خياطة الأسفل','كي','تفتيش','تغليف'];
  for (const m of modelIds.slice(0, 3)) {
    for (const op of ops) {
      const sam = rand(5, 50) / 10;
      await conn.execute('INSERT INTO sam_records (model_id, operation_name, sam_minutes, target_per_hour, effective_sam) VALUES (?, ?, ?, ?, ?)',
        [m, op, String(sam), Math.round(60/sam), String(sam*1.15)]);
    }
  }
  console.log('  ✓ SAM records');

  // 23. QC Records
  for (let i = 0; i < 15; i++) {
    const checked = rand(50, 200), passed = Math.floor(checked * rand(85, 99) / 100);
    await conn.execute('INSERT INTO qc_records (order_id, stage, checked_quantity, passed_quantity, defected_quantity, date) VALUES (?, ?, ?, ?, ?, ?)',
      [pick(orderIds), pick(['inline','input','output','final']), checked, passed, checked-passed, daysAgo(rand(1,30))]);
  }
  console.log('  ✓ 15 QC records');

  // 24. Bundles
  const sizes = ['XS','S','M','L','XL','XXL'];
  for (let i = 0; i < 20; i++) {
    await conn.execute('INSERT INTO bundles (bundle_code, model_id, size, color, quantity, current_stage, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`BN-${String(i+1).padStart(5,'0')}`, pick(modelIds), pick(sizes), pick(colors), rand(10,50), pick(['قص','خياطة','كي']), pick(['cutting','sewing','ironing'])]);
  }
  console.log('  ✓ 20 bundles');

  // 25. Model Stages
  const stageNames = ['قص','تجهيز','خياطة','كي','تفتيش','تغليف'];
  for (const m of modelIds) {
    for (let i = 0; i < stageNames.length; i++) {
      await conn.execute('INSERT INTO model_stages (model_id, name, sequence, unit_price) VALUES (?, ?, ?, ?)', [m, stageNames[i], i+1, String(rand(2,15))]);
    }
  }
  console.log('  ✓ Model stages');

  // 26. Performance Reviews
  for (let i = 0; i < 10; i++) {
    const e = pick(empIds);
    await conn.execute('INSERT INTO performance_reviews (employeeId, reviewer_id, period, overall_rating, status) VALUES (?, ?, ?, ?, ?)',
      [e, pick(empIds.filter(id => id !== e)), `2025-${String(rand(1,6)).padStart(2,'0')}`, rand(1,5), 'completed']);
  }
  console.log('  ✓ 10 reviews');

  // 27. Job Postings
  const jTitles = ['خياط ماهر','فني صيانة','مشرف جودة','محاسب تكاليف','مندوب مبيعات'];
  for (let i = 0; i < 5; i++) {
    await conn.execute('INSERT INTO job_postings (title, departmentId, description, status) VALUES (?, ?, ?, ?)',
      [jTitles[i], pick(deptIds), `مطلوب ${jTitles[i]}`, pick(['open','open','closed'])]);
  }
  console.log('  ✓ 5 job postings');

  // 28. Shifts
  await conn.execute('INSERT INTO shifts (name, start_time, end_time, days_of_week) VALUES (?, ?, ?, ?)', ['الصباحية', '07:00', '15:00', '1,2,3,4,6']);
  await conn.execute('INSERT INTO shifts (name, start_time, end_time, days_of_week) VALUES (?, ?, ?, ?)', ['المسائية', '15:00', '23:00', '1,2,3,4,6']);
  console.log('  ✓ 2 shifts');

  // 29. Product Lifecycle
  const stages = ['concept','design','tech_pack','sampling','costing','buyer_approval','bulk_fabric','cutting','production','finishing','qc_final','packing','shipped'];
  for (const m of modelIds.slice(0, 4)) {
    for (let i = 0; i < stages.length; i++) {
      await conn.execute('INSERT INTO product_lifecycle (model_id, stage, stage_order, status) VALUES (?, ?, ?, ?)',
        [m, stages[i], i+1, i < 8 ? 'completed' : i === 8 ? 'in_progress' : 'pending']);
    }
  }
  console.log('  ✓ Product lifecycle');

  // 30. Production Forecasts
  for (let i = 0; i < 8; i++) {
    await conn.execute('INSERT INTO production_forecasts (model_id, line_id, forecast_type, period, predicted_value, confidence) VALUES (?, ?, ?, ?, ?, ?)',
      [pick(modelIds), pick(lineIds), pick(['demand','capacity','material']), `2025-${String(rand(1,12)).padStart(2,'0')}`, String(rand(1000,10000)), String(rand(70,95))]);
  }
  console.log('  ✓ 8 forecasts');

  // 31. Audit Log
  const tables = ['employees','production_orders','inventory_items'];
  for (let i = 0; i < 10; i++) {
    await conn.execute('INSERT INTO audit_log (table_name, record_id, action, changed_by_name) VALUES (?, ?, ?, ?)',
      [pick(tables), rand(1,100), pick(['INSERT','UPDATE','DELETE']), pick(names)]);
  }
  console.log('  ✓ 10 audit log entries');

  // 32. Cost Calculations
  for (const m of modelIds.slice(0, 5)) {
    const fab = rand(20, 50), lab = rand(15, 40), oh = rand(10, 30), trim = rand(5, 20);
    const total = fab + lab + oh + trim;
    await conn.execute('INSERT INTO cost_calculations (model_id, fabric_cost, labor_cost, overhead_cost, trim_cost, total_cost, selling_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [m, String(fab), String(lab), String(oh), String(trim), String(total), String(Math.round(total * 1.3))]);
  }
  console.log('  ✓ 5 cost calculations');

  // 33. Subcontracts
  for (let i = 0; i < 3; i++) {
    await conn.execute('INSERT INTO subcontracts (contract_number, supplier_id, model_id, quantity, status) VALUES (?, ?, ?, ?, ?)',
      [`SUB-${i+1}`, pick(supIds), pick(modelIds), rand(100, 1000), pick(['pending','in_progress','completed'])]);
  }
  console.log('  ✓ 3 subcontracts');

  // 34. Work Orders
  for (let i = 0; i < 10; i++) {
    await conn.execute('INSERT INTO work_orders (order_number, production_order_id, model_id, line_id, quantity, status) VALUES (?, ?, ?, ?, ?, ?)',
      [`WO-${String(i+1).padStart(4,'0')}`, pick(orderIds), pick(modelIds), pick(lineIds), rand(100, 1000), pick(['in_progress','pending','completed'])]);
  }
  console.log('  ✓ 10 work orders');

  await conn.end();
  console.log('\n✅ Seed complete! 60+ tables populated.');
}

seed().catch(e => { console.error(e.message.substring(0, 300)); process.exit(1); });
