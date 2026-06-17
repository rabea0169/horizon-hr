const mysql = require('mysql2/promise');

const TABLES = [
  // 61. Company Settings
  `CREATE TABLE IF NOT EXISTS company_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    company_name_en VARCHAR(200),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(320),
    tax_number VARCHAR(50),
    commercial_register VARCHAR(50),
    vat_rate DECIMAL(5,2) DEFAULT 14,
    currency VARCHAR(10) DEFAULT 'EGP',
    fiscal_year_start DATE,
    fiscal_year_end DATE,
    logo TEXT,
    payment_terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 62. Purchase Requests
  `CREATE TABLE IF NOT EXISTS purchase_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pr_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100),
    requested_by VARCHAR(255),
    status ENUM('draft','pending_approval','approved','rejected','converted_to_po') DEFAULT 'draft' NOT NULL,
    priority ENUM('low','normal','high','urgent') DEFAULT 'normal' NOT NULL,
    required_date DATE,
    notes TEXT,
    approved_by BIGINT UNSIGNED,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 63. Purchase Request Items
  `CREATE TABLE IF NOT EXISTS purchase_request_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    purchase_request_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  // 64. GRNs
  `CREATE TABLE IF NOT EXISTS grns (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    grn_number VARCHAR(50) NOT NULL UNIQUE,
    supply_order_id BIGINT UNSIGNED NOT NULL,
    supplier_id BIGINT UNSIGNED NOT NULL,
    received_date DATE NOT NULL,
    invoice_number VARCHAR(50),
    invoice_date DATE,
    subtotal DECIMAL(12,2),
    vat_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    status ENUM('pending','partial','fully_received','rejected') DEFAULT 'pending' NOT NULL,
    notes TEXT,
    received_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 65. Sales Invoices
  `CREATE TABLE IF NOT EXISTS sales_invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    sales_order_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 14,
    vat_amount DECIMAL(12,2),
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    status ENUM('draft','issued','paid','partial','overdue','cancelled') DEFAULT 'draft' NOT NULL,
    payment_terms VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 66. Purchase Invoices
  `CREATE TABLE IF NOT EXISTS purchase_invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    grn_id BIGINT UNSIGNED NOT NULL,
    supplier_id BIGINT UNSIGNED NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 14,
    vat_amount DECIMAL(12,2),
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    status ENUM('draft','received','paid','partial','overdue','cancelled') DEFAULT 'draft' NOT NULL,
    withholding_tax DECIMAL(12,2) DEFAULT 0,
    customs_duty DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 67. Payment Vouchers
  `CREATE TABLE IF NOT EXISTS payment_vouchers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    voucher_date DATE NOT NULL,
    payee_name VARCHAR(255) NOT NULL,
    payee_type ENUM('supplier','employee','contractor','other') NOT NULL,
    payee_id BIGINT UNSIGNED,
    reference_invoice_id BIGINT UNSIGNED,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash','check','bank_transfer','credit_card') DEFAULT 'cash' NOT NULL,
    check_number VARCHAR(50),
    bank_name VARCHAR(100),
    description TEXT,
    status ENUM('draft','approved','paid','cancelled') DEFAULT 'draft' NOT NULL,
    approved_by BIGINT UNSIGNED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 68. Receipt Vouchers
  `CREATE TABLE IF NOT EXISTS receipt_vouchers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    voucher_date DATE NOT NULL,
    payer_name VARCHAR(255) NOT NULL,
    payer_type ENUM('customer','employee','other') NOT NULL,
    payer_id BIGINT UNSIGNED,
    reference_invoice_id BIGINT UNSIGNED,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash','check','bank_transfer','credit_card') DEFAULT 'cash' NOT NULL,
    check_number VARCHAR(50),
    bank_name VARCHAR(100),
    description TEXT,
    status ENUM('draft','approved','received','cancelled') DEFAULT 'draft' NOT NULL,
    approved_by BIGINT UNSIGNED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 69. Journal Vouchers
  `CREATE TABLE IF NOT EXISTS journal_vouchers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    voucher_date DATE NOT NULL,
    description TEXT,
    total_debit DECIMAL(12,2) NOT NULL,
    total_credit DECIMAL(12,2) NOT NULL,
    status ENUM('draft','posted','cancelled') DEFAULT 'draft' NOT NULL,
    posted_by BIGINT UNSIGNED,
    posted_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 70. Journal Voucher Lines
  `CREATE TABLE IF NOT EXISTS journal_voucher_lines (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    journal_voucher_id BIGINT UNSIGNED NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    debit DECIMAL(12,2) DEFAULT 0,
    credit DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    cost_center VARCHAR(100),
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  // 71. Maintenance Records
  `CREATE TABLE IF NOT EXISTS maintenance_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    machine_id BIGINT UNSIGNED NOT NULL,
    maintenance_type ENUM('preventive','corrective','overhaul') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    frequency ENUM('daily','weekly','monthly','quarterly','semi_annual','annual'),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    cost DECIMAL(12,2),
    parts_used TEXT,
    technician_name VARCHAR(255),
    downtime INT,
    status ENUM('scheduled','in_progress','completed','overdue','cancelled') DEFAULT 'scheduled' NOT NULL,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 72. Machine Depreciation
  `CREATE TABLE IF NOT EXISTS machine_depreciation (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    machine_id BIGINT UNSIGNED NOT NULL,
    year INT NOT NULL,
    period VARCHAR(20) NOT NULL,
    depreciation_amount DECIMAL(12,2) NOT NULL,
    accumulated_depreciation DECIMAL(12,2) NOT NULL,
    book_value DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  // 73. Order Amendments
  `CREATE TABLE IF NOT EXISTS order_amendments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_order_id BIGINT UNSIGNED NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    approved_by BIGINT UNSIGNED,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  // 74. Delivery Reminders
  `CREATE TABLE IF NOT EXISTS delivery_reminders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sales_order_id BIGINT UNSIGNED NOT NULL,
    reminder_type ENUM('7_days','3_days','1_day','overdue') NOT NULL,
    sent TINYINT(1) DEFAULT 0,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  // 75. Quotations
  `CREATE TABLE IF NOT EXISTS quotations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT UNSIGNED NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    subtotal DECIMAL(12,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 14,
    vat_amount DECIMAL(12,2),
    total_amount DECIMAL(12,2) NOT NULL,
    payment_terms VARCHAR(100),
    delivery_terms VARCHAR(100),
    status ENUM('draft','sent','accepted','rejected','expired') DEFAULT 'draft' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // 76. Quotation Items
  `CREATE TABLE IF NOT EXISTS quotation_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quotation_id BIGINT UNSIGNED NOT NULL,
    model_id BIGINT UNSIGNED,
    description VARCHAR(255),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  // 77. Defect Types
  `CREATE TABLE IF NOT EXISTS defect_types (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category ENUM('cutting','sewing','measurement','appearance','assembly','packaging') NOT NULL,
    severity ENUM('critical','major','minor') NOT NULL,
    description TEXT,
    is_system TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`
];

async function createTables() {
  const conn = await mysql.createConnection({
    host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
    port: 4000, user: '3MBKRYVvwZoxRUD.root',
    password: 'yZc3ehZrZaL5GcEJkJbCnHLKGPG6OF93',
    database: '19eb3aac-0b12-875c-8000-09f71b45fbd0',
    ssl: { rejectUnauthorized: true }, connectTimeout: 120000
  });

  let created = 0, failed = 0;
  for (const sql of TABLES) {
    try {
      await conn.execute(sql);
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      console.log(`+ ${tableName}`);
      created++;
    } catch (e) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      console.log(`! ${tableName}: ${e.message.substring(0, 80)}`);
      failed++;
    }
  }

  // Insert default company settings
  try {
    await conn.execute(
      `INSERT INTO company_settings (company_name, company_name_en, address, phone, email, tax_number, commercial_register, vat_rate, currency, fiscal_year_start, fiscal_year_end, payment_terms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['مصنع هورايزن', 'Horizon Factory', 'العاشر من رمضان، مصر', '015-555-7890', 'info@horizon-factory.com', '123456789', '56845', 14, 'EGP', '2026-01-01', '2026-12-31', 'آجل 30 يوم']
    );
    console.log('+ Default company settings');
  } catch (e) {
    console.log(`! Company settings: ${e.message.substring(0, 80)}`);
  }

  // Insert default defect types
  const defectTypes = [
    ['D-CUT-01', 'قص غير متساوي', 'cutting', 'major', 'عدم تساوي القطع المقصوصة'],
    ['D-CUT-02', 'عدم مطابقة المقاس', 'cutting', 'critical', 'المقاس لا يطابق المواصفات'],
    ['D-CUT-03', 'انحراف البترون', 'cutting', 'major', 'البترون منحرف عن الموقف الصحيح'],
    ['D-SEW-01', 'غرز مفكوكة', 'sewing', 'major', 'خيوط الغرز مفكوكة أو ضعيفة'],
    ['D-SEW-02', 'خياطة منحرفة', 'sewing', 'minor', 'خط الخياطة غير مستقيم'],
    ['D-SEW-03', 'شد غير متساوٍ', 'sewing', 'major', 'الشد في الخياطة غير متساوي'],
    ['D-SEW-04', 'تسرب خيط', 'sewing', 'minor', 'خيوط بارزة من الخياطة'],
    ['D-MEA-01', 'عدم مطابقة مقاسات Tech Pack', 'measurement', 'critical', 'المقاسات لا تطابق المواصفات'],
    ['D-APP-01', 'بقع على القماش', 'appearance', 'major', 'بقع واضحة على سطح الملابس'],
    ['D-APP-02', 'تباين في اللون', 'appearance', 'major', 'اختلاف في درجة اللون'],
    ['D-APP-03', 'خدوش', 'appearance', 'minor', 'خدوش على سطح الملابس'],
    ['D-ASS-01', 'زر مفقود', 'assembly', 'critical', 'عدم تركيب الزر'],
    ['D-ASS-02', 'سحاب معطل', 'assembly', 'critical', 'السحاب لا يعمل بشكل صحيح'],
  ];

  try {
    for (const dt of defectTypes) {
      await conn.execute(
        `INSERT INTO defect_types (code, name, category, severity, description, is_system) VALUES (?, ?, ?, ?, ?, ?)`,
        [...dt, 1]
      );
    }
    console.log(`+ ${defectTypes.length} defect types`);
  } catch (e) {
    console.log(`! Defect types: ${e.message.substring(0, 80)}`);
  }

  await conn.end();
  console.log(`\nDone: ${created} created, ${failed} failed`);
}

createTables().catch(e => { console.error(e.message); process.exit(1); });
