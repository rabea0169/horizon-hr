# دليل إعداد MySQL لنظام Horizon HR

## 📋 المحتويات
1. [تثبيت MySQL](#تثبيت-mysql)
2. [إنشاء قاعدة البيانات](#إنشاء-قاعدة-البيانات)
3. [إنشاء مستخدم جديد](#إنشاء-مستخدم-جديد)
4. [اختبار الاتصال](#اختبار-الاتصال)
5. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🔧 تثبيت MySQL

### على Windows:

1. **تحميل MySQL:**
   - اذهب إلى [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
   - حمّل "MySQL Community Server" (الإصدار 8.0 أو أعلى)
   - اختر Windows (x86, 64-bit) MSI Installer

2. **التثبيت:**
   - افتح ملف التثبيت
   - اختر "Setup Type" → "Server only" (أو "Complete")
   - اتبع الخطوات
   - عند السؤال عن "MySQL Server Instance Configuration":
     - اختر "Standalone MySQL Server"
     - Port: `3306` (الافتراضي)
     - Windows Service: اختر "Install as Windows Service"
   - عند السؤال عن كلمة المرور: ضع كلمة مرور قوية للمستخدم `root`

3. **التحقق من التثبيت:**
   ```bash
   mysql --version
   ```

### على macOS:

```bash
# استخدم Homebrew
brew install mysql

# ابدأ MySQL
brew services start mysql

# تحقق من التثبيت
mysql --version
```

### على Linux (Ubuntu/Debian):

```bash
# تثبيت MySQL Server
sudo apt-get update
sudo apt-get install mysql-server

# ابدأ MySQL
sudo systemctl start mysql

# تحقق من التثبيت
mysql --version
```

---

## 🗄️ إنشاء قاعدة البيانات

### الطريقة الأولى: استخدام MySQL Command Line

```bash
# افتح MySQL Command Line
mysql -u root -p

# أدخل كلمة المرور عند الطلب
```

ثم اكتب الأوامر التالية:

```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE horizon_hr 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- تحقق من الإنشاء
SHOW DATABASES;

-- اخرج
EXIT;
```

### الطريقة الثانية: استخدام MySQL Workbench

1. افتح MySQL Workbench
2. اتصل بـ MySQL Server (استخدم root و كلمة المرور)
3. اضغط على `File` → `New Query Tab`
4. اكتب:
   ```sql
   CREATE DATABASE horizon_hr 
   CHARACTER SET utf8mb4 
   COLLATE utf8mb4_unicode_ci;
   ```
5. اضغط `Ctrl+Enter` لتنفيذ الأمر

---

## 👤 إنشاء مستخدم جديد

### الطريقة الأولى: Command Line

```bash
mysql -u root -p
```

ثم اكتب:

```sql
-- إنشاء مستخدم جديد
CREATE USER 'hr_user'@'localhost' IDENTIFIED BY 'strong_password_123';

-- إعطاء الصلاحيات
GRANT ALL PRIVILEGES ON horizon_hr.* TO 'hr_user'@'localhost';

-- تطبيق التغييرات
FLUSH PRIVILEGES;

-- تحقق من الإنشاء
SELECT User, Host FROM mysql.user;

-- اخرج
EXIT;
```

### الطريقة الثانية: MySQL Workbench

1. في الجانب الأيسر، اضغط على `Users and Privileges`
2. اضغط على `Add Account`
3. ملأ البيانات:
   - **Login Name:** `hr_user`
   - **Limit to Hosts Matching:** `localhost`
   - **Password:** `strong_password_123`
   - **Confirm Password:** `strong_password_123`
4. اذهب إلى تبويب `Schema Privileges`
5. اضغط `Add Entry`
6. اختر `horizon_hr`
7. اضغط على `Select "ALL"` لإعطاء جميع الصلاحيات
8. اضغط `Apply`

---

## 🔗 اختبار الاتصال

### اختبار الاتصال بـ root:

```bash
mysql -u root -p -h localhost -e "SELECT 1;"
```

### اختبار الاتصال بـ hr_user:

```bash
mysql -u hr_user -p -h localhost -e "SELECT 1;"
```

إذا ظهرت النتيجة `1`، فالاتصال ناجح ✓

---

## 📝 تحديث ملف .env

بعد إنشاء قاعدة البيانات والمستخدم، عدّل ملف `.env`:

```env
# Database Configuration
DATABASE_URL=mysql://hr_user:strong_password_123@localhost:3306/horizon_hr

# أو إذا كنت تستخدم root
# DATABASE_URL=mysql://root:root_password@localhost:3306/horizon_hr
```

---

## 🧪 اختبار الاتصال من Node.js

```bash
# في مجلد المشروع
npm install

# اختبر الاتصال
npm run db:generate
npm run db:push
```

إذا نجحت الأوامر، فقاعدة البيانات جاهزة ✓

---

## 🐛 استكشاف الأخطاء

### المشكلة: "Access denied for user 'root'@'localhost'"

**السبب:** كلمة المرور خاطئة أو لم تُعيّن

**الحل:**
```bash
# إعادة تعيين كلمة المرور (Windows)
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';"

# أو استخدم MySQL Workbench
```

### المشكلة: "Can't connect to MySQL server"

**السبب:** MySQL Server غير مشغّل

**الحل:**

**على Windows:**
```bash
# ابدأ MySQL Service
net start MySQL80

# أو استخدم Services (services.msc)
```

**على macOS:**
```bash
brew services start mysql
```

**على Linux:**
```bash
sudo systemctl start mysql
```

### المشكلة: "Unknown database 'horizon_hr'"

**السبب:** قاعدة البيانات لم تُنشأ

**الحل:** اتبع خطوات [إنشاء قاعدة البيانات](#إنشاء-قاعدة-البيانات)

### المشكلة: "Port 3306 is already in use"

**السبب:** هناك تطبيق آخر يستخدم المنفذ 3306

**الحل:**

**على Windows:**
```bash
# ابحث عن العملية التي تستخدم المنفذ
netstat -ano | findstr :3306

# قتل العملية (استبدل PID برقم العملية)
taskkill /PID <PID> /F

# أو غيّر المنفذ في MySQL
```

**على Linux/macOS:**
```bash
# ابحث عن العملية
lsof -i :3306

# قتل العملية
kill -9 <PID>
```

### المشكلة: "Drizzle migration failed"

**السبب:** قد تكون هناك مشكلة في الاتصال أو في schema

**الحل:**
```bash
# تحقق من الاتصال أولاً
mysql -u hr_user -p -h localhost -e "SELECT 1;"

# ثم حاول مجدداً
npm run db:push

# إذا استمرت المشكلة، حاول إعادة تعيين
npm run db:generate
npm run db:push
```

---

## 💾 النسخ الاحتياطية

### إنشاء نسخة احتياطية:

```bash
# على Windows
mysqldump -u root -p horizon_hr > backup.sql

# على Linux/macOS
mysqldump -u root -p horizon_hr > backup.sql
```

### استعادة النسخة الاحتياطية:

```bash
# على Windows
mysql -u root -p horizon_hr < backup.sql

# على Linux/macOS
mysql -u root -p horizon_hr < backup.sql
```

---

## 📊 أدوات مفيدة

### MySQL Workbench
- [تحميل](https://www.mysql.com/products/workbench/)
- واجهة رسومية لإدارة MySQL

### HeidiSQL
- [تحميل](https://www.heidisql.com/)
- أداة خفيفة لإدارة قواعد البيانات

### DBeaver
- [تحميل](https://dbeaver.io/)
- أداة قوية لإدارة جميع أنواع قواعد البيانات

---

## 📚 موارد إضافية

- [MySQL Official Documentation](https://dev.mysql.com/doc/)
- [MySQL Tutorial](https://www.w3schools.com/mysql/)
- [Drizzle ORM MySQL Guide](https://orm.drizzle.team/docs/get-started-mysql)

---

**آخر تحديث:** يونيو 2026
