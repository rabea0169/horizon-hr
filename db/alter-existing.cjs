const mysql = require('mysql2/promise');

const ALTERATIONS = [
  // Employees: add skill level
  `ALTER TABLE employees ADD COLUMN IF NOT EXISTS skill_level ENUM('novice','intermediate','expert') DEFAULT 'intermediate'`,
  `ALTER TABLE employees ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(50)`,
  `ALTER TABLE employees ADD COLUMN IF NOT EXISTS machine_bonus_rate DECIMAL(5,2) DEFAULT 0`,
  `ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2)`,

  // Sales Orders: add missing fields
  `ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tolerance VARCHAR(10) DEFAULT '±5%'`,
  `ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100)`,
  `ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipment_date DATE`,
  `ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EGP'`,
  `ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS size_breakdown TEXT`,
  `ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS color_breakdown TEXT`,

  // CRM Customers: add missing fields
  `ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100)`,
  `ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS grade ENUM('A','B','C') DEFAULT 'B'`,
  `ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2)`,

  // Suppliers: add missing fields
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_type ENUM('local','imported') DEFAULT 'local'`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100)`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS evaluation_grade ENUM('A','B','C') DEFAULT 'B'`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lead_time_days INT DEFAULT 7`,

  // Inventory Items: add missing fields
  `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS max_stock INT DEFAULT 0`,
  `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS opening_balance INT DEFAULT 0`,
  `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS bin_location VARCHAR(100)`,
  `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS gsm DECIMAL(6,2)`,
  `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS fabric_width DECIMAL(6,2)`,

  // Production Models: add missing fields
  `ALTER TABLE production_models ADD COLUMN IF NOT EXISTS tech_pack_id BIGINT UNSIGNED`,
  `ALTER TABLE production_models ADD COLUMN IF NOT EXISTS size_ratio VARCHAR(50)`,
  `ALTER TABLE production_models ADD COLUMN IF NOT EXISTS color_options TEXT`,

  // BOM Records: add missing fields
  `ALTER TABLE bom_records ADD COLUMN IF NOT EXISTS size VARCHAR(20)`,
  `ALTER TABLE bom_records ADD COLUMN IF NOT EXISTS color VARCHAR(50)`,
  `ALTER TABLE bom_records ADD COLUMN IF NOT EXISTS marker_efficiency DECIMAL(5,2)`,

  // QC Records: add missing fields for AQL
  `ALTER TABLE qc_records ADD COLUMN IF NOT EXISTS aql_level VARCHAR(20)`,
  `ALTER TABLE qc_records ADD COLUMN IF NOT EXISTS sample_size INT`,
  `ALTER TABLE qc_records ADD COLUMN IF NOT EXISTS accept_limit INT`,
  `ALTER TABLE qc_records ADD COLUMN IF NOT EXISTS reject_limit INT`,
  `ALTER TABLE qc_records ADD COLUMN IF NOT EXISTS defect_details TEXT`,
  `ALTER TABLE qc_records ADD COLUMN IF NOT EXISTS inspection_type ENUM('incoming','cutting','inline','final')`,

  // Payroll: add missing fields
  `ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS pieces_produced INT DEFAULT 0`,
  `ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS piece_rate_amount DECIMAL(12,2) DEFAULT 0`,
  `ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS machine_bonus DECIMAL(12,2) DEFAULT 0`,
  `ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS quality_bonus DECIMAL(12,2) DEFAULT 0`,
  `ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS speed_bonus DECIMAL(12,2) DEFAULT 0`,
  `ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS overtime_amount DECIMAL(12,2) DEFAULT 0`,
  `ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS insurance_deduction DECIMAL(12,2) DEFAULT 0`,
  `ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS quality_penalty DECIMAL(12,2) DEFAULT 0`,

  // Production Orders: add missing fields
  `ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS size_breakdown TEXT`,
  `ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS color_breakdown TEXT`,

  // Supply Orders: add missing fields
  `ALTER TABLE supply_orders ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 14`,
  `ALTER TABLE supply_orders ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12,2) DEFAULT 0`,
  `ALTER TABLE supply_orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100)`,

  // Challans: add missing fields
  `ALTER TABLE challans ADD COLUMN IF NOT EXISTS delivery_date DATE`,

  // Print Settings: add missing fields
  `ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50)`,
];

async function alterTables() {
  const conn = await mysql.createConnection({
    host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
    port: 4000, user: '3MBKRYVvwZoxRUD.root',
    password: 'yZc3ehZrZaL5GcEJkJbCnHLKGPG6OF93',
    database: '19eb3aac-0b12-875c-8000-09f71b45fbd0',
    ssl: { rejectUnauthorized: true }, connectTimeout: 120000
  });

  let applied = 0, skipped = 0;
  for (const sql of ALTERATIONS) {
    try {
      await conn.execute(sql);
      applied++;
    } catch (e) {
      if (e.message.includes('Duplicate column')) {
        skipped++;
      } else {
        console.log(`! ${e.message.substring(0, 100)}`);
      }
    }
  }

  await conn.end();
  console.log(`Done: ${applied} applied, ${skipped} already exist`);
}

alterTables().catch(e => { console.error(e.message); process.exit(1); });
