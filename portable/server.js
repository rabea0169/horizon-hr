#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
// Horizon HR - Portable Server
// خادم محلي يعمل من USB بدون تثبيت
// يستخدم SQLite كقاعدة بيانات محلية
// ══════════════════════════════════════════════════════════════

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORTABLE_DIR = process.env.PORTABLE_DIR || path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(PORTABLE_DIR, '..', 'dist', 'public');
const DB_DIR = path.join(PORTABLE_DIR, 'data');
const DB_FILE = path.join(DB_DIR, 'horizon_hr.db');

// التأكد من وجود مجلد البيانات
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
};

// إنشاء قاعدة بيانات SQLite بسيطة إن لم تكن موجودة
function initDatabase() {
  try {
    const sqlite3 = require('better-sqlite3');
    const db = new sqlite3(DB_FILE);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeCode TEXT UNIQUE,
        fullName TEXT NOT NULL,
        department TEXT,
        jobTitle TEXT,
        phone TEXT,
        salary REAL DEFAULT 0,
        salaryType TEXT DEFAULT 'monthly',
        status TEXT DEFAULT 'active',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId INTEGER,
        date TEXT,
        checkIn TEXT,
        checkOut TEXT,
        status TEXT DEFAULT 'present'
      );
      
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        code TEXT UNIQUE,
        quantity INTEGER DEFAULT 0,
        minStock INTEGER DEFAULT 10,
        unit TEXT DEFAULT 'piece',
        price REAL DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS production_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        department TEXT,
        capacity INTEGER,
        status TEXT DEFAULT 'active'
      );
      
      CREATE TABLE IF NOT EXISTS sales_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNumber TEXT UNIQUE,
        customerName TEXT,
        totalAmount REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        orderDate TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poNumber TEXT UNIQUE,
        supplier TEXT,
        totalAmount REAL DEFAULT 0,
        status TEXT DEFAULT 'draft',
        orderDate TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS server_settings (
        id INTEGER PRIMARY KEY,
        serverName TEXT DEFAULT 'Horizon HR Local',
        port INTEGER DEFAULT 3000,
        allowRemote INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // بيانات ابتدائية
    const existingEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get();
    if (existingEmployees.count === 0) {
      const insertEmployee = db.prepare('INSERT INTO employees (employeeCode, fullName, department, jobTitle, phone, salary) VALUES (?, ?, ?, ?, ?, ?)');
      insertEmployee.run('EMP001', 'أحمد محمد', 'خياطة', 'خياط', '01001234567', 5000);
      insertEmployee.run('EMP002', 'محمد خالد', 'قص', 'مشغل ماكينة', '01002345678', 5500);
      insertEmployee.run('EMP003', 'فاطمة أحمد', 'جودة', 'فاحصة جودة', '01003456789', 4800);
      
      const insertInventory = db.prepare('INSERT INTO inventory (name, code, quantity, minStock, unit, price) VALUES (?, ?, ?, ?, ?, ?)');
      insertInventory.run('قماش قطني أبيض', 'FAB-001', 500, 100, 'متر', 25);
      insertInventory.run('خيط بوليستر', 'THR-001', 200, 50, 'بكرة', 15);
      insertInventory.run('أزرار بلاستيك', 'BTN-001', 1000, 200, 'قطعة', 0.5);
      insertInventory.run('سحاب معدني', 'ZIP-001', 300, 50, 'قطعة', 3);
      
      db.prepare('INSERT INTO server_settings (id, serverName, port, allowRemote) VALUES (1, ?, ?, 1)').run('Horizon HR Local', 3000);
    }
    
    db.close();
    console.log('[✓] قاعدة البيانات جاهزة');
    return true;
  } catch (err) {
    console.warn('[⚠️] SQLite غير متوفر:', err.message);
    console.log('[ℹ️]  جاري العمل بدون قاعدة بيانات (وضع Demo)');
    return false;
  }
}

// API Router بسيط
function handleAPI(req, res, pathname) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // CORS
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];
  const isAllowed = origin && (
    allowedOrigins.includes(origin) || 
    origin.startsWith('file://') || 
    origin.startsWith('app://') || 
    origin.startsWith('capacitor://')
  );
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API: معلومات الخادم
  if (pathname === '/api/server-info') {
    const ip = getLocalIP();
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'running',
      serverName: 'Horizon HR Portable',
      version: '1.0.0',
      port: PORT,
      localUrl: `http://localhost:${PORT}`,
      networkUrl: `http://${ip}:${PORT}`,
      database: fs.existsSync(DB_FILE) ? 'sqlite' : 'demo',
      dataDir: DB_DIR,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // API: قائمة الموظفين
  if (pathname === '/api/employees') {
    try {
      const sqlite3 = require('better-sqlite3');
      const db = new sqlite3(DB_FILE);
      const employees = db.prepare('SELECT * FROM employees ORDER BY id DESC').all();
      db.close();
      res.writeHead(200);
      res.end(JSON.stringify(employees));
    } catch {
      res.writeHead(200);
      res.end(JSON.stringify([]));
    }
    return;
  }
  
  // API: قائمة المخزون
  if (pathname === '/api/inventory') {
    try {
      const sqlite3 = require('better-sqlite3');
      const db = new sqlite3(DB_FILE);
      const items = db.prepare('SELECT * FROM inventory ORDER BY id DESC').all();
      db.close();
      res.writeHead(200);
      res.end(JSON.stringify(items));
    } catch {
      res.writeHead(200);
      res.end(JSON.stringify([]));
    }
    return;
  }
  
  // API: إحصائيات
  if (pathname === '/api/stats') {
    try {
      const sqlite3 = require('better-sqlite3');
      const db = new sqlite3(DB_FILE);
      const employees = db.prepare('SELECT COUNT(*) as count FROM employees').get();
      const inventory = db.prepare('SELECT COUNT(*) as count FROM inventory').get();
      const lowStock = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE quantity <= minStock').get();
      const orders = db.prepare('SELECT COUNT(*) as count FROM sales_orders').get();
      db.close();
      res.writeHead(200);
      res.end(JSON.stringify({
        employees: employees.count,
        inventory: inventory.count,
        lowStock: lowStock.count,
        orders: orders.count
      }));
    } catch {
      res.writeHead(200);
      res.end(JSON.stringify({ employees: 0, inventory: 0, lowStock: 0, orders: 0 }));
    }
    return;
  }
  
  // API: فحص الاتصال (Ping)
  if (pathname === '/api/ping') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

// الحصول على IP المحلي
function getLocalIP() {
  try {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch { /* ignore */ }
  return 'localhost';
}

// خادم HTTP الرئيسي
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // API requests
  if (pathname.startsWith('/api/')) {
    handleAPI(req, res, pathname);
    return;
  }
  
  // Static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(PUBLIC_DIR, filePath);
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // SPA fallback
      if (ext === '' || ext === '.html') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, indexContent) => {
          if (err2) {
            res.writeHead(500);
            res.end('Server Error');
            return;
          }
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.writeHead(200);
          res.end(indexContent);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', ext === '.html' ? 'no-cache' : 'public, max-age=31536000');
    res.writeHead(200);
    res.end(content);
  });
});

// تشغيل الخادم
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ Horizon HR Portable Server يعمل!                       ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  🌐 المحلي:     http://localhost:${PORT}                    ║`);
  console.log(`║  📡 الشبكة:     http://${ip}:${PORT}                        ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📱 للهاتف: نفس شبكة WiFi ← افتح الرابط أعلاه             ║');
  console.log('║  🛑 Ctrl+C لإيقاف الخادم                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  initDatabase();
  
  // فتح المتصفح تلقائياً
  setTimeout(() => {
    try {
      const platform = process.platform;
      const url = `http://localhost:${PORT}`;
      if (platform === 'win32') execSync(`start ${url}`, { stdio: 'ignore' });
      else if (platform === 'darwin') execSync(`open ${url}`, { stdio: 'ignore' });
      else execSync(`xdg-open ${url}`, { stdio: 'ignore' });
    } catch { /* ignore */ }
  }, 2000);
});

// إيقاف نظيف
process.on('SIGINT', () => {
  console.log('\n[👋] إيقاف الخادم...');
  server.close(() => {
    process.exit(0);
  });
});
