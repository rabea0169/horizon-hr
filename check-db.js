const mysql = require("mysql2/promise");
require("dotenv").config();

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute("SELECT id, employeeCode, role, passwordHash FROM employees WHERE employeeCode = 'admin'");
  console.log("Admin Row in Database:", rows);
  await conn.end();
}

run().catch(console.error);
