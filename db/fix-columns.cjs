const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
    port: 4000, user: '3MBKRYVvwZoxRUD.root',
    password: 'yZc3ehZrZaL5GcEJkJbCnHLKGPG6OF93',
    database: '19eb3aac-0b12-875c-8000-09f71b45fbd0',
    ssl: { rejectUnauthorized: true }
  });

  const fixes = [
    // attendance
    "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE",
    "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes TEXT",
    // employees
    "ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_type ENUM('monthly','piece_rate','mixed') DEFAULT 'monthly'",
    "ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type ENUM('full_time','part_time','contract','intern') DEFAULT 'full_time'",
    "ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar TEXT",
    "ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id BIGINT UNSIGNED",
    // Add other missing columns
    "ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS reorder_point INT DEFAULT 0",
    "ALTER TABLE production_lines ADD COLUMN IF NOT EXISTS supervisor_id BIGINT UNSIGNED",
  ];

  for (const f of fixes) {
    try { await conn.execute(f); process.stdout.write('.'); }
    catch(e) { process.stdout.write('x'); }
  }

  await conn.end();
  console.log('\nColumns fixed!');
}
run().catch(console.error);
