const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function run() {
  const hash = "$2b$10$3GSYX5vz6xELcV.mZTX1FujtZLKZN4gNIWKbCS7lzyDvQ1ug7VIO2";
  const match = bcrypt.compareSync("admin123", hash);
  console.log("Does admin123 match hash?", match);

  // Let's also check other possible common passwords like 'admin', '123456'
  console.log("Does admin match hash?", bcrypt.compareSync("admin", hash));
  console.log("Does 123456 match hash?", bcrypt.compareSync("123456", hash));
}

run().catch(console.error);
