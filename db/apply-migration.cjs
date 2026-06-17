const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
  const conn = await mysql.createConnection({
    host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
    port: 4000,
    user: '3MBKRYVvwZoxRUD.root',
    password: 'yZc3ehZrZaL5GcEJkJbCnHLKGPG6OF93',
    database: '19eb3aac-0b12-875c-8000-09f71b45fbd0',
    ssl: { rejectUnauthorized: true },
    connectTimeout: 60000,
    acquireTimeout: 60000,
  });

  // Read and execute migration SQL
  const files = fs.readdirSync('./db/migrations').filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(`./db/migrations/${file}`, 'utf8');
    const stmts = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
    for (const stmt of stmts) {
      try {
        await conn.execute(stmt);
        process.stdout.write('.');
      } catch(e) {
        if (e.message.includes('Duplicate') || e.message.includes('already exists')) {
          process.stdout.write('s'); // skip
        } else {
          process.stdout.write('E');
        }
      }
    }
    console.log(`  ${file} done`);
  }

  await conn.end();
  console.log('\nMigration complete!');
}

run().catch(e => { console.error(e.message.substring(0, 200)); process.exit(1); });
