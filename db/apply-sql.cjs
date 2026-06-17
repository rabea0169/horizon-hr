const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
  const conn = await mysql.createConnection({
    host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
    port: 4000, user: '3MBKRYVvwZoxRUD.root',
    password: 'yZc3ehZrZaL5GcEJkJbCnHLKGPG6OF93',
    database: '19eb3aac-0b12-875c-8000-09f71b45fbd0',
    ssl: { rejectUnauthorized: true },
    multipleStatements: false
  });

  // Read and parse SQL
  let sql = fs.readFileSync('db/migrations/0000_flashy_marten_broadcloak.sql', 'utf8');
  // Remove DROP statements
  sql = sql.replace(/DROP TABLE.*?;/gs, '');
  // Split by statement-breakpoint
  const stmts = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

  let success = 0, fail = 0;
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i].replace(/\/\*.*?\*\//gs, '').trim();
    if (!stmt) continue;
    try {
      await conn.execute(stmt);
      success++;
      process.stdout.write('.');
    } catch(e) {
      fail++;
      // Only log real errors, not duplicates
      if (!e.message.includes('Duplicate') && !e.message.includes('already exists')) {
        process.stdout.write(`E${i}`);
      } else {
        process.stdout.write('d');
      }
    }
  }

  await conn.end();
  console.log(`\nSuccess: ${success}, Fail: ${fail}`);
}

run().catch(console.error);
