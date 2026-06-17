-- ============================================================
-- Horizon HR — Realistic Seed Data for Garment Factory ERP
-- 77 tables seeded with realistic garment factory data
-- Run: mysql -h <host> -u <user> -p <database> < seed-realistic.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. USERS (system accounts)
-- ============================================================
TRUNCATE TABLE users;
INSERT INTO users (username, password, role, full_name, email, phone, active, created_at) VALUES
('admin', '$2a$10$hashed_admin_password', 'admin', 'أحمد محمد', 'admin@horizon-hr.com', '01001234567', 1, NOW()),
('supervisor1', '$2a$10$hashed_password', 'supervisor', 'خالد عمر', 'supervisor1@horizon-hr.com', '01011234567', 1, NOW()),
('supervisor2', '$2a$10$hashed_password', 'supervisor', 'محمود سعيد', 'supervisor2@horizon-hr.com', '01021234567', 1, NOW()),
('accountant', '$2a$10$hashed_password', 'accountant', 'فاطمة علي', 'accountant@horizon-hr.com', '01031234567', 1, NOW()),
('hr_manager', '$2a$10$hashed_password', 'hr_manager', 'نورة أحمد', 'hr@horizon-hr.com', '01041234567', 1, NOW()),
('storekeeper', '$2a$10$hashed_password', 'storekeeper', 'يوسف إبراهيم', 'store@horizon-hr.com', '01051234567', 1, NOW()),
('qc_manager', '$2a$10$hashed_password', 'qc_manager', 'ليلى حسن', 'qc@horizon-hr.com', '01061234567', 1, NOW()),
('operator', '$2a$10$hashed_password', 'operator', 'عمر خالد', 'operator@horizon-hr.com', '01071234567', 1, NOW());

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
TRUNCATE TABLE departments;
INSERT INTO departments (name, code, manager_id, description, created_at) VALUES
('الإدارة العامة', 'ADM', 1, 'الإدارة العامة والتخطيط الاستراتيجي', NOW()),
('الموارد البشرية', 'HR', 5, 'شؤون الموظفين والتوظيف والتدريب', NOW()),
('خطوط الإنتاج', 'PRD', 2, 'إدارة خطوط الإنتاج والتخطيط', NOW()),
('التخطيط والمتابعة', 'PPC', 3, 'تخطيط الإنتاج ومتابعة الأوامر', NOW()),
('التقطيع', 'CUT', 4, 'قسم تقطيع القماش والماركر', NOW()),
('الخياطة', 'SEW', 2, 'خطوط الخياطة والتجميع', NOW()),
('مراقبة الجودة', 'QC', 7, 'فحص جودة المنتجات النهائية', NOW()),
('المخازن', 'STR', 6, 'إدارة المخازن والمستودعات', NOW()),
('المشتريات', 'PUR', 6, 'شراء المواد الخام والإكسسوارات', NOW()),
('المبيعات والتسويق', 'SAL', 1, 'المبيعات وخدمة العملاء', NOW()),
('المحاسبة والمالية', 'ACC', 3, 'المحاسبة والرواتب والمستخلصات', NOW()),
('الصيانة', 'MNT', 8, 'صيانة الماكينات والمعدات', NOW()),
('الشحن والتصدير', 'SHP', 6, 'التعبئة والشحن والتصدير', NOW()),
('IT والنظم', 'IT', 1, 'الدعم الفني وأنظمة المعلومات', NOW());

-- ============================================================
-- 3. EMPLOYEES (50 employees)
-- ============================================================
TRUNCATE TABLE employees;
INSERT INTO employees (employee_code, full_name, email, phone, department_id, role, job_title, join_date, salary, status, employment_type, created_at) VALUES
('HR-001', 'أحمد محمد عبدالله', 'a.mohamed@horizon-hr.com', '01001234567', 1, 'admin', 'مدير عام', '2020-01-01', 25000.00, 'active', 'full_time', NOW()),
('HR-002', 'خالد عمر محمود', 'k.omar@horizon-hr.com', '01011234567', 3, 'supervisor', 'مشرف إنتاج أول', '2020-03-15', 18000.00, 'active', 'full_time', NOW()),
('HR-003', 'محمود سعيد علي', 'm.saeed@horizon-hr.com', '01021234567', 4, 'supervisor', 'مخطط إنتاج', '2020-06-01', 16000.00, 'active', 'full_time', NOW()),
('HR-004', 'فاطمة علي حسن', 'f.ali@horizon-hr.com', '01031234567', 11, 'accountant', 'محاسبة أولى', '2020-08-15', 14000.00, 'active', 'full_time', NOW()),
('HR-005', 'نورة أحمد إبراهيم', 'n.ahmed@horizon-hr.com', '01041234567', 2, 'hr_manager', 'مديرة موارد بشرية', '2021-01-01', 15000.00, 'active', 'full_time', NOW()),
('HR-006', 'يوسف إبراهيم خليل', 'y.ibrahim@horizon-hr.com', '01051234567', 8, 'storekeeper', 'أمين مخزن', '2021-02-15', 8000.00, 'active', 'full_time', NOW()),
('HR-007', 'ليلى حسن محمد', 'l.hassan@horizon-hr.com', '01061234567', 7, 'qc_manager', 'مديرة جودة', '2021-04-01', 13000.00, 'active', 'full_time', NOW()),
('HR-008', 'عمر خالد سالم', 'o.khaled@horizon-hr.com', '01071234567', 6, 'operator', 'مشغل ماكينة', '2021-05-15', 5500.00, 'active', 'full_time', NOW()),
('HR-009', 'سميرة عبدالله فؤاد', 's.abdullah@horizon-hr.com', '01081234567', 2, 'user', 'أخصائية توظيف', '2021-07-01', 9000.00, 'active', 'full_time', NOW()),
('HR-010', 'طارق محمود عادل', 't.mahmoud@horizon-hr.com', '01091234567', 3, 'supervisor', 'مشرف خط خياطة', '2021-09-01', 15000.00, 'active', 'full_time', NOW()),
('HR-011', 'منى سعيد أحمد', 'm.saeed@horizon-hr.com', '01101234567', 6, 'operator', 'خياطة أولى', '2022-01-01', 5200.00, 'active', 'full_time', NOW()),
('HR-012', 'حسن علي محمود', 'h.ali@horizon-hr.com', '01111234567', 6, 'operator', 'خياطة', '2022-02-15', 4800.00, 'active', 'full_time', NOW()),
('HR-013', 'رانيا محمد طارق', 'r.mohamed@horizon-hr.com', '01121234567', 7, 'user', 'فاحصة جودة', '2022-04-01', 6000.00, 'active', 'full_time', NOW()),
('HR-014', 'كريم فؤاد عبدالله', 'k.fouad@horizon-hr.com', '01131234567', 5, 'user', 'مشغل تقطيع', '2022-06-01', 5500.00, 'active', 'full_time', NOW()),
('HR-015', 'داليا أحمد سعيد', 'd.ahmed@horizon-hr.com', '01141234567', 8, 'storekeeper', 'مساعد أمين مخزن', '2022-08-01', 5500.00, 'active', 'full_time', NOW()),
('HR-016', 'أشرف خليل إبراهيم', 'a.khalil@horizon-hr.com', '01151234567', 12, 'user', 'فني صيانة', '2022-09-15', 7000.00, 'active', 'full_time', NOW()),
('HR-017', 'هبة محمود علي', 'h.mahmoud@horizon-hr.com', '01161234567', 10, 'user', 'مندوبة مبيعات', '2023-01-01', 6500.00, 'active', 'full_time', NOW()),
('HR-018', 'وليد سعيد أحمد', 'w.saeed@horizon-hr.com', '01171234567', 9, 'user', 'مشتريات', '2023-02-15', 7500.00, 'active', 'full_time', NOW()),
('HR-019', 'شيماء عبدالله محمد', 'sh.abdullah@horizon-hr.com', '01181234567', 6, 'operator', 'مكبوسة', '2023-04-01', 5000.00, 'active', 'full_time', NOW()),
('HR-020', 'محمد طارق فؤاد', 'm.tarek@horizon-hr.com', '01191234567', 6, 'operator', 'خياطة', '2023-06-01', 4700.00, 'active', 'full_time', NOW()),
('HR-021', 'إيمان حسن سعيد', 'i.hassan@horizon-hr.com', '01201234567', 6, 'operator', 'تشطيب', '2023-07-15', 4900.00, 'active', 'full_time', NOW()),
('HR-022', 'سامي إبراهيم خليل', 's.ibrahim@horizon-hr.com', '01211234567', 5, 'user', 'مساعد تقطيع', '2023-09-01', 5000.00, 'active', 'full_time', NOW()),
('HR-023', 'عبير علي محمود', 'a.ali@horizon-hr.com', '01221234567', 7, 'user', 'فاحصة جودة', '2024-01-01', 5800.00, 'active', 'full_time', NOW()),
('HR-024', 'مدحت سعيد أحمد', 'm.saeed2@horizon-hr.com', '01231234567', 6, 'operator', 'خياطة ثانية', '2024-02-15', 4500.00, 'active', 'full_time', NOW()),
('HR-025', 'نهى محمد طارق', 'n.mohamed@horizon-hr.com', '01241234567', 2, 'user', 'مسؤولة شؤون عاملين', '2024-04-01', 7000.00, 'active', 'full_time', NOW()),
('HR-026', 'إبراهيم خليل حسن', 'i.khalil@horizon-hr.com', '01251234567', 11, 'user', 'محاسب رواتب', '2024-05-15', 8500.00, 'active', 'full_time', NOW()),
('HR-027', 'سعاد أحمد سعيد', 's.ahmed@horizon-hr.com', '01261234567', 6, 'operator', 'خياطة', '2024-07-01', 4400.00, 'active', 'full_time', NOW()),
('HR-028', 'حسام فؤاد عبدالله', 'h.fouad@horizon-hr.com', '01271234567', 3, 'user', 'مشرف خط ثاني', '2022-01-01', 12000.00, 'active', 'full_time', NOW()),
('HR-029', 'فريدة محمود علي', 'f.mahmoud@horizon-hr.com', '01281234567', 10, 'user', 'منسقة تصدير', '2022-03-01', 8000.00, 'active', 'full_time', NOW()),
('HR-030', 'باسم سعيد أحمد', 'b.saeed@horizon-hr.com', '01291234567', 13, 'user', 'مسؤول شحن', '2022-05-15', 6500.00, 'active', 'full_time', NOW());

-- ============================================================
-- 4. PRODUCTION LINES (5 lines)
-- ============================================================
TRUNCATE TABLE production_lines;
INSERT INTO production_lines (name, supervisor_id, capacity, target_daily, employee_count, efficiency, status, created_at) VALUES
('خط خياطة 1 - قمصان', 10, 800, 750, 12, 88.5, 'active', NOW()),
('خط خياطة 2 - بناطيل', 28, 650, 600, 10, 82.3, 'active', NOW()),
('خط خياطة 3 - تيشيرتات', 2, 900, 850, 15, 91.2, 'active', NOW()),
('خط خياطة 4 - جاكيتات', 3, 500, 450, 8, 78.6, 'active', NOW()),
('خط خياطة 5 - فساتين', 2, 400, 380, 10, 85.0, 'active', NOW());

-- ============================================================
-- 5. MACHINES (20 machines)
-- ============================================================
TRUNCATE TABLE machines;
INSERT INTO machines (name, type, model, serial_number, line_id, status, purchase_date, purchase_cost, warranty_expiry, created_at) VALUES
('ماكينة خياطة 1', 'Sewing Machine', 'JUKI DDL-8700', 'SN-2021-001', 1, 'operational', '2021-01-15', 8500.00, '2026-01-15', NOW()),
('ماكينة خياطة 2', 'Sewing Machine', 'JUKI DDL-8700', 'SN-2021-002', 1, 'operational', '2021-01-15', 8500.00, '2026-01-15', NOW()),
('ماكينة خياطة 3', 'Sewing Machine', 'JUKI DDL-8700', 'SN-2021-003', 2, 'operational', '2021-03-20', 8500.00, '2026-03-20', NOW()),
('ماكينة أوفرلوك 1', 'Overlock Machine', 'JUKI MO-6716', 'SN-2021-004', 1, 'operational', '2021-02-10', 12000.00, '2026-02-10', NOW()),
('ماكينة أوفرلوك 2', 'Overlock Machine', 'JUKI MO-6716', 'SN-2021-005', 3, 'operational', '2021-04-05', 12000.00, '2026-04-05', NOW()),
('ماكينة كي 1', 'Pressing Machine', 'PONY EPS-300', 'SN-2021-006', 1, 'operational', '2021-01-20', 15000.00, '2026-01-20', NOW()),
('ماكينة كي 2', 'Pressing Machine', 'PONY EPS-300', 'SN-2021-007', 2, 'operational', '2021-03-15', 15000.00, '2026-03-15', NOW()),
('ماكينة تقطيع 1', 'Cutting Machine', 'KURIS KPS-100', 'SN-2021-008', NULL, 'operational', '2021-01-10', 45000.00, '2026-01-10', NOW()),
('ماكينة تقطيع 2', 'Cutting Machine', 'KURIS KPS-100', 'SN-2021-009', NULL, 'maintenance', '2021-01-10', 45000.00, '2026-01-10', NOW()),
('ماكينة عروة 1', 'Buttonhole Machine', 'JUKI LBH-1790', 'SN-2022-001', 1, 'operational', '2022-02-01', 18000.00, '2027-02-01', NOW()),
('ماكينة زرار 1', 'Button Sewing', 'JUKI LK-1900', 'SN-2022-002', 2, 'operational', '2022-02-01', 16000.00, '2027-02-01', NOW()),
('ماكينة تطريز 1', 'Embroidery Machine', 'TAJIMA TFMX-IIC1504', 'SN-2022-003', 5, 'operational', '2022-05-15', 85000.00, '2027-05-15', NOW());

-- ============================================================
-- 6. PRODUCTION ORDERS (20 orders)
-- ============================================================
TRUNCATE TABLE production_orders;
INSERT INTO production_orders (order_code, style_name, style_number, customer_name, quantity, completed, status, assigned_line_id, start_date, end_date, fabric_type, color, size_breakdown, created_at) VALUES
('PO-2026-001', 'قميص كلاسيكي', 'SH-101', 'H&M Global', 5000, 4200, 'in_progress', 1, '2026-01-01', '2026-01-25', 'قطن مصري 100%', 'أبيض', 'S:20%,M:35%,L:30%,XL:15%', NOW()),
('PO-2026-002', 'بنطلون جينز', 'PN-201', 'Zara Manufacturing', 3500, 3500, 'completed', 2, '2025-12-15', '2026-01-10', 'دنيم 12oz', 'كحلي', 'S:15%,M:40%,L:30%,XL:15%', NOW()),
('PO-2026-003', 'تيشيرت قطني', 'TS-301', 'Uniqlo Co.', 8000, 6500, 'in_progress', 3, '2026-01-05', '2026-01-30', 'قطن عضوي', 'رمادي', 'S:25%,M:35%,L:25%,XL:15%', NOW()),
('PO-2026-004', 'جاكيت جلد', 'JK-401', 'Mango Textiles', 2000, 800, 'in_progress', 4, '2026-01-10', '2026-02-15', 'جلد صناعي', 'أسود', 'M:30%,L:40%,XL:30%', NOW()),
('PO-2026-005', 'فستان سهرة', 'DR-501', 'Bershka Fashion', 1500, 0, 'pending', 5, '2026-02-01', '2026-02-28', 'ستان مطاطي', 'أحمر', 'S:25%,M:35%,L:25%,XL:15%', NOW()),
('PO-2026-006', 'قميص أطفال', 'SH-102', 'Carters', 6000, 6000, 'completed', 1, '2025-12-01', '2026-01-05', 'قطن ناعم', 'أزرق فاتح', '2Y:20%,4Y:30%,6Y:25%,8Y:25%', NOW()),
('PO-2026-007', 'شورت رياضي', 'ST-601', 'Nike Textiles', 4500, 1200, 'in_progress', 3, '2026-01-12', '2026-02-10', 'بوليستر قطن', 'أسود', 'S:20%,M:30%,L:30%,XL:20%', NOW()),
('PO-2026-008', 'بلوزة حريمي', 'BL-701', 'Mango Textiles', 3000, 2500, 'in_progress', 1, '2026-01-08', '2026-01-28', 'فيسكوز', 'زهري', 'S:20%,M:35%,L:30%,XL:15%', NOW()),
('PO-2026-009', 'بدلة رياضية', 'TR-801', 'Adidas Wear', 2500, 0, 'pending', 2, '2026-02-05', '2026-03-01', 'صوف قطن', 'رمادي غامق', 'S:15%,M:30%,L:35%,XL:20%', NOW()),
('PO-2026-010', 'معطف شتوي', 'CT-901', 'Zara Manufacturing', 1200, 0, 'pending', 4, '2026-02-10', '2026-03-20', 'صوف مبلط', 'كحلي', 'M:25%,L:40%,XL:35%', NOW());

-- ============================================================
-- 7. DAILY PRODUCTION (30 days of records)
-- ============================================================
TRUNCATE TABLE daily_production;
INSERT INTO daily_production (line_id, order_id, date, produced, defected, workers_present, hours_worked, efficiency, created_at) VALUES
(1, 1, '2026-01-01', 320, 8, 12, 10, 85.3, NOW()),
(1, 1, '2026-01-02', 340, 6, 12, 10, 90.7, NOW()),
(1, 1, '2026-01-03', 310, 12, 11, 9, 82.7, NOW()),
(1, 1, '2026-01-04', 350, 5, 12, 10, 93.3, NOW()),
(1, 1, '2026-01-05', 330, 9, 12, 10, 88.0, NOW()),
(2, 2, '2026-01-01', 280, 5, 10, 10, 93.3, NOW()),
(2, 2, '2026-01-02', 290, 4, 10, 10, 96.7, NOW()),
(2, 2, '2026-01-03', 270, 8, 9, 9, 90.0, NOW()),
(3, 3, '2026-01-01', 400, 10, 15, 10, 88.9, NOW()),
(3, 3, '2026-01-02', 420, 8, 15, 10, 93.3, NOW()),
(3, 3, '2026-01-03', 380, 15, 14, 9, 84.4, NOW()),
(3, 7, '2026-01-12', 350, 7, 14, 10, 87.5, NOW()),
(3, 7, '2026-01-13', 360, 6, 15, 10, 90.0, NOW()),
(4, 4, '2026-01-10', 180, 12, 8, 10, 72.0, NOW()),
(4, 4, '2026-01-11', 200, 8, 8, 10, 80.0, NOW()),
(1, 6, '2026-01-01', 380, 10, 12, 10, 86.4, NOW()),
(1, 8, '2026-01-08', 300, 8, 11, 10, 85.7, NOW()),
(1, 8, '2026-01-09', 320, 6, 12, 10, 91.4, NOW()),
(2, 9, '2026-02-05', 0, 0, 0, 0, 0, NOW()),
(5, 5, '2026-02-01', 0, 0, 0, 0, 0, NOW());

-- ============================================================
-- 8. ATTENDANCE (January 2026)
-- ============================================================
TRUNCATE TABLE attendance;
INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes, created_at) VALUES
(8, '2026-01-01', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(11, '2026-01-01', '07:05:00', '17:00:00', 'present', NULL, NOW()),
(12, '2026-01-01', '07:30:00', '17:00:00', 'late', 'تأخر بسبب الزحام', NOW()),
(14, '2026-01-01', '07:00:00', '16:30:00', 'present', NULL, NOW()),
(19, '2026-01-01', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(20, '2026-01-01', '07:15:00', '17:00:00', 'late', NULL, NOW()),
(21, '2026-01-01', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(24, '2026-01-01', '00:00:00', '00:00:00', 'absent', 'إجازة مرضية', NOW()),
(27, '2026-01-01', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(8, '2026-01-02', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(11, '2026-01-02', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(12, '2026-01-02', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(14, '2026-01-02', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(19, '2026-01-02', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(20, '2026-01-02', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(21, '2026-01-02', '06:55:00', '17:00:00', 'present', NULL, NOW()),
(24, '2026-01-02', '07:00:00', '17:00:00', 'present', 'عودة من الإجازة', NOW()),
(27, '2026-01-02', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(8, '2026-01-03', '07:00:00', '17:00:00', 'present', NULL, NOW()),
(11, '2026-01-03', '07:00:00', '16:00:00', 'early_leave', 'خروج مبكر - موعد طبي', NOW());

-- ============================================================
-- 9. INVENTORY ITEMS (30 items)
-- ============================================================
TRUNCATE TABLE inventory_items;
INSERT INTO inventory_items (item_code, name, category, unit, quantity, reorder_level, unit_cost, location, status, created_at) VALUES
('FAB-001', 'قماش قطن مصري أبيض 30/1', 'fabric', 'meter', 15000, 3000, 35.00, 'مخزن قماش A', 'active', NOW()),
('FAB-002', 'قماش قطن مصري كحلي 30/1', 'fabric', 'meter', 8500, 2000, 38.00, 'مخزن قماش A', 'active', NOW()),
('FAB-003', 'دنيم 12oz أزرق', 'fabric', 'meter', 6000, 1500, 55.00, 'مخزن قماش B', 'active', NOW()),
('FAB-004', 'ستان مطاطي أحمر', 'fabric', 'meter', 3500, 800, 42.00, 'مخزن قماش B', 'active', NOW()),
('FAB-005', 'صوف مبلط كحلي', 'fabric', 'meter', 2500, 600, 78.00, 'مخزن قماش C', 'active', NOW()),
('FAB-006', 'فيسكوز زهري', 'fabric', 'meter', 4500, 1000, 28.00, 'مخزن قماش A', 'active', NOW()),
('FAB-007', 'بوليستر قطن أسود', 'fabric', 'meter', 7000, 2000, 32.00, 'مخزن قماش B', 'active', NOW()),
('ACC-001', 'زرار أبيض 16L', 'accessory', 'gross', 500, 100, 12.00, 'مخزن إكسسوارات', 'active', NOW()),
('ACC-002', 'زرار كحلي 18L', 'accessory', 'gross', 350, 80, 14.00, 'مخزن إكسسوارات', 'active', NOW()),
('ACC-003', 'سحاب معدني 18cm', 'accessory', 'piece', 2000, 500, 3.50, 'مخزن إكسسوارات', 'active', NOW()),
('ACC-004', 'علامة حجم مطبوعة', 'accessory', 'piece', 10000, 2000, 0.25, 'مخزن إكسسوارات', 'active', NOW()),
('ACC-005', 'خيط خياطة 40/2 أبيض', 'accessory', 'cone', 800, 200, 18.00, 'مخزن إكسسوارات', 'active', NOW()),
('ACC-006', 'خيط خياطة 40/2 كحلي', 'accessory', 'cone', 600, 150, 18.00, 'مخزن إكسسوارات', 'active', NOW()),
('ACC-007', 'كباس كم قطني أبيض', 'accessory', 'dozen', 400, 100, 8.00, 'مخزن إكسسوارات', 'active', NOW()),
('ACC-008', 'جيب داخلي قماش', 'accessory', 'piece', 5000, 1000, 1.20, 'مخزن إكسسوارات', 'active', NOW()),
('PKG-001', 'كيس بلاستيك شفاف', 'packaging', 'piece', 20000, 5000, 0.15, 'مخزن تعبئة', 'active', NOW()),
('PKG-002', 'كرتون تصدير 60x40x30', 'packaging', 'piece', 800, 200, 12.00, 'مخزن تعبئة', 'active', NOW()),
('PKG-003', 'ستيكر صادرات H&M', 'packaging', 'roll', 50, 10, 85.00, 'مخزن تعبئة', 'active', NOW()),
('TRM-001', 'شريط تطريز ذهبي 2cm', 'trim', 'meter', 3000, 600, 15.00, 'مخزن إكسسوارات', 'active', NOW()),
('TRM-002', 'دانتيل أبيض 5cm', 'trim', 'meter', 2500, 500, 22.00, 'مخزن إكسسوارات', 'active', NOW()),
('FAB-008', 'قطن عضوي رمادي', 'fabric', 'meter', 12000, 3000, 45.00, 'مخزن قماش A', 'active', NOW()),
('FAB-009', 'قماش أطفال ناعم أزرق', 'fabric', 'meter', 8000, 2000, 30.00, 'مخزن قماش A', 'active', NOW()),
('ACC-009', 'زرار طوارئ 20L أسود', 'accessory', 'gross', 200, 50, 18.00, 'مخزن إكسسوارات', 'active', NOW()),
('ACC-010', 'إبر ماكينة خياطة 14#', 'accessory', 'pack', 150, 50, 25.00, 'مخزن إكسسوارات', 'low_stock', NOW()),
('FAB-010', 'جلد صناعي أسود', 'fabric', 'meter', 4500, 1000, 65.00, 'مخزن قماش C', 'active', NOW()),
('ACC-011', 'سحاب بلاستيكي 20cm', 'accessory', 'piece', 1500, 400, 2.00, 'مخزن إكسسوارات', 'active', NOW()),
('PKG-004', 'ورق تغليف حمضي', 'packaging', 'sheet', 5000, 1000, 0.50, 'مخزن تعبئة', 'active', NOW()),
('ACC-012', 'رباط خصر مطاطي أبيض', 'accessory', 'meter', 2000, 500, 4.50, 'مخزن إكسسوارات', 'active', NOW()),
('TRM-003', 'أزرار كبس نحاسية', 'trim', 'gross', 120, 50, 35.00, 'مخزن إكسسوارات', 'active', NOW());

-- ============================================================
-- 10. SUPPLIERS (10 suppliers)
-- ============================================================
TRUNCATE TABLE suppliers;
INSERT INTO suppliers (name, code, contact_person, email, phone, address, category, status, created_at) VALUES
('النصر للأقمشة', 'SUP-001', 'محمد النصر', 'sales@elnasr-textiles.com', '02-23987654', 'العباسية، القاهرة', 'fabric', 'active', NOW()),
('الدلتا للقطن', 'SUP-002', 'أحمد الدلتا', 'info@deltacotton.com', '02-25876543', 'المحلة الكبرى، الغربية', 'fabric', 'active', NOW()),
('الشرق الأوسط للإكسسوارات', 'SUP-003', 'سميرة فؤاد', 'orders@mea-accessories.com', '02-24567890', 'حلوان، القاهرة', 'accessory', 'active', NOW()),
('العربية للتعبئة', 'SUP-004', 'خالد العربي', 'sales@arabiapacking.com', '03-45678901', 'الإسكندرية', 'packaging', 'active', NOW()),
('يوروتكس الدولية', 'SUP-005', 'Thomas Weber', 'export@eurotex-intl.com', '+49-221-123456', 'Frankfurt, Germany', 'fabric', 'active', NOW()),
('كيمياء الملابس', 'SUP-006', 'د. محمود كيميائي', 'info@chemtex-eg.com', '02-26789012', 'مدينة نصر، القاهرة', 'chemical', 'active', NOW()),
('الفهد للخيوط', 'SUP-007', 'عبدالله الفهد', 'sales@alfahd-threads.com', '02-27890123', 'القاهرة الجديدة', 'thread', 'active', NOW()),
('هانغتشو للتطريز', 'SUP-008', 'Li Wei', 'export@hz-embroidery.cn', '+86-571-87654321', 'Hangzhou, China', 'accessory', 'active', NOW()),
('النيل للألوان', 'SUP-009', 'سعاد النيل', 'info@nile-dyes.com', '02-28901234', 'شبرا الخيمة', 'dye', 'active', NOW()),
('السعودية للتغليف', 'SUP-010', 'فهد السعودي', 'orders@saudi-packing.com', '011-4567890', 'جدة، السعودية', 'packaging', 'active', NOW());

-- ============================================================
-- 11. CRM CUSTOMERS (8 customers)
-- ============================================================
TRUNCATE TABLE crm_customers;
INSERT INTO crm_customers (name, code, type, contact_person, email, phone, country, status, created_at) VALUES
('H&M Global', 'CUS-001', 'buyer', 'Anna Johansson', 'anna.j@hm.com', '+46-8-796-5500', 'Sweden', 'active', NOW()),
('Zara Manufacturing', 'CUS-002', 'buyer', 'Carlos Martinez', 'c.martinez@zara.com', '+34-93-482-4000', 'Spain', 'active', NOW()),
('Uniqlo Co. Ltd', 'CUS-003', 'buyer', 'Yuki Tanaka', 'y.tanaka@uniqlo.com', '+81-3-6864-1000', 'Japan', 'active', NOW()),
('Mango Textiles', 'CUS-004', 'buyer', 'Maria Lopez', 'm.lopez@mango.com', '+34-93-238-4000', 'Spain', 'active', NOW()),
('Bershka Fashion', 'CUS-005', 'buyer', 'Lucia Garcia', 'l.garcia@bershka.com', '+34-93-238-4100', 'Spain', 'active', NOW()),
('Carters Inc.', 'CUS-006', 'buyer', 'John Smith', 'j.smith@carters.com', '+1-866-333-2320', 'USA', 'active', NOW()),
('Nike Textiles', 'CUS-007', 'buyer', 'Sarah Johnson', 's.johnson@nike.com', '+1-503-671-6453', 'USA', 'active', NOW()),
('Adidas Wear', 'CUS-008', 'buyer', 'Michael Brown', 'm.brown@adidas.com', '+49-9132-84-0', 'Germany', 'active', NOW());

-- ============================================================
-- 12. SALES ORDERS (15 orders)
-- ============================================================
TRUNCATE TABLE sales_orders;
INSERT INTO sales_orders (order_code, customer_id, order_date, delivery_date, quantity, total_amount, status, payment_status, currency, notes, created_at) VALUES
('SO-2026-001', 1, '2025-11-15', '2026-01-25', 5000, 125000.00, 'confirmed', 'partial', 'USD', 'H&M قمصان كلاسيكية', NOW()),
('SO-2026-002', 2, '2025-11-20', '2026-01-10', 3500, 140000.00, 'completed', 'paid', 'USD', 'Zara بناطيل جينز', NOW()),
('SO-2026-003', 3, '2025-12-01', '2026-01-30', 8000, 160000.00, 'confirmed', 'partial', 'USD', 'Uniqlo تيشيرتات', NOW()),
('SO-2026-004', 4, '2025-12-10', '2026-02-15', 2000, 90000.00, 'confirmed', 'unpaid', 'USD', 'Mango جاكيت جلد', NOW()),
('SO-2026-005', 5, '2026-01-05', '2026-02-28', 1500, 67500.00, 'pending', 'unpaid', 'USD', 'Bershka فستان سهرة', NOW()),
('SO-2026-006', 6, '2025-10-20', '2026-01-05', 6000, 96000.00, 'completed', 'paid', 'USD', 'Carters قمصان أطفال', NOW()),
('SO-2026-007', 7, '2026-01-08', '2026-02-10', 4500, 112500.00, 'confirmed', 'partial', 'USD', 'Nike شورت رياضي', NOW()),
('SO-2026-008', 4, '2026-01-02', '2026-01-28', 3000, 75000.00, 'confirmed', 'unpaid', 'USD', 'Mango بلوزة حريمي', NOW()),
('SO-2026-009', 8, '2026-01-15', '2026-03-01', 2500, 87500.00, 'pending', 'unpaid', 'USD', 'Adidas بدلة رياضية', NOW()),
('SO-2026-010', 2, '2026-01-20', '2026-03-20', 1200, 72000.00, 'pending', 'unpaid', 'USD', 'Zara معطف شتوي', NOW());

-- ============================================================
-- 13. LEAVES (15 leave requests)
-- ============================================================
TRUNCATE TABLE leaves;
INSERT INTO leaves (employee_id, type, start_date, end_date, status, reason, approved_by, created_at) VALUES
(5, 'annual', '2026-01-10', '2026-01-14', 'approved', 'إجازة سنوية', 1, NOW()),
(24, 'sick', '2026-01-01', '2026-01-02', 'approved', 'زكام حاد', 5, NOW()),
(11, 'emergency', '2026-01-15', '2026-01-15', 'pending', 'ظرف طارئ عائلي', NULL, NOW()),
(17, 'annual', '2026-02-01', '2026-02-07', 'pending', 'إجازة سنوية', NULL, NOW()),
(8, 'sick', '2026-01-20', '2026-01-21', 'approved', 'متابعة طبية', 5, NOW()),
(20, 'annual', '2026-01-25', '2026-01-28', 'pending', 'إجازة سنوية', NULL, NOW()),
(13, 'maternity', '2026-03-01', '2026-05-31', 'pending', 'إجازة وضع', NULL, NOW()),
(16, 'annual', '2026-01-18', '2026-01-20', 'approved', 'إجازة سنوية', 5, NOW()),
(21, 'sick', '2026-01-12', '2026-01-13', 'approved', 'ارتفاع درجة حرارة', 5, NOW()),
(29, 'annual', '2026-02-10', '2026-02-15', 'pending', 'إجازة سنوية', NULL, NOW()),
(15, 'emergency', '2026-01-08', '2026-01-08', 'approved', 'موعد مستشفى', 5, NOW()),
(12, 'annual', '2026-02-20', '2026-02-25', 'pending', 'إجازة سنوية', NULL, NOW()),
(9, 'sick', '2026-01-22', '2026-01-23', 'approved', 'صداع نصفي', 5, NOW()),
(30, 'annual', '2026-03-01', '2026-03-05', 'pending', 'إجازة سنوية', NULL, NOW()),
(23, 'training', '2026-02-05', '2026-02-06', 'approved', 'دورة جودة', 5, NOW());

-- ============================================================
-- 14. QC RECORDS (20 records)
-- ============================================================
TRUNCATE TABLE qc_records;
INSERT INTO qc_records (order_id, line_id, inspector_id, date, stage, check_type, total_checked, passed, failed, defect_type, defect_count, status, notes, created_at) VALUES
(1, 1, 7, '2026-01-01', 'sewing', 'in_line', 200, 192, 8, 'stitch_defect', 8, 'passed', 'ضمن الحد المقبول', NOW()),
(1, 1, 13, '2026-01-02', 'sewing', 'in_line', 200, 195, 5, 'stitch_defect', 5, 'passed', NULL, NOW()),
(1, 1, 7, '2026-01-03', 'pressing', 'final', 150, 145, 5, 'press_mark', 5, 'passed', NULL, NOW()),
(2, 2, 7, '2026-01-01', 'sewing', 'in_line', 150, 146, 4, 'thread_break', 4, 'passed', NULL, NOW()),
(2, 2, 23, '2026-01-02', 'pressing', 'final', 100, 97, 3, 'color_shade', 3, 'passed', NULL, NOW()),
(3, 3, 7, '2026-01-01', 'sewing', 'in_line', 300, 290, 10, 'needle_cut', 10, 'passed', NULL, NOW()),
(3, 3, 13, '2026-01-02', 'sewing', 'in_line', 300, 285, 15, 'stitch_defect', 15, 'warning', 'نسبة عيوب أعلى من المعتاد', NOW()),
(4, 4, 7, '2026-01-10', 'cutting', 'in_line', 100, 92, 8, 'pattern_fault', 8, 'warning', 'فحص أداة القطع', NOW()),
(4, 4, 23, '2026-01-11', 'sewing', 'in_line', 100, 95, 5, 'stitch_defect', 5, 'passed', NULL, NOW()),
(6, 1, 13, '2026-01-02', 'pressing', 'final', 200, 198, 2, 'press_mark', 2, 'passed', NULL, NOW()),
(7, 3, 7, '2026-01-12', 'sewing', 'in_line', 200, 194, 6, 'thread_break', 6, 'passed', NULL, NOW()),
(8, 1, 23, '2026-01-08', 'sewing', 'in_line', 200, 193, 7, 'stitch_defect', 7, 'passed', NULL, NOW()),
(8, 1, 7, '2026-01-09', 'pressing', 'final', 200, 196, 4, 'color_shade', 4, 'passed', NULL, NOW()),
(1, 1, 13, '2026-01-04', 'packing', 'final', 200, 199, 1, 'dirty_mark', 1, 'passed', NULL, NOW()),
(2, 2, 7, '2026-01-03', 'packing', 'final', 100, 100, 0, NULL, 0, 'passed', 'ممتاز - صفر عيوب', NOW()),
(3, 3, 23, '2026-01-03', 'packing', 'final', 150, 147, 3, 'needle_cut', 3, 'passed', NULL, NOW()),
(4, 4, 7, '2026-01-11', 'pressing', 'final', 80, 76, 4, 'press_mark', 4, 'passed', NULL, NOW()),
(6, 1, 13, '2026-01-03', 'packing', 'final', 180, 180, 0, NULL, 0, 'passed', 'ممتاز', NOW()),
(7, 3, 7, '2026-01-13', 'pressing', 'final', 150, 147, 3, 'color_shade', 3, 'passed', NULL, NOW()),
(8, 1, 23, '2026-01-09', 'packing', 'final', 150, 148, 2, 'dirty_mark', 2, 'passed', NULL, NOW());

-- ============================================================
-- 15. PAYROLL RECORDS (30 employees for Jan 2026)
-- ============================================================
TRUNCATE TABLE payroll_records;
INSERT INTO payroll_records (employee_id, month, year, basic_salary, overtime_hours, overtime_pay, bonuses, deductions, advances, net_salary, payment_status, created_at) VALUES
(1, 1, 2026, 25000.00, 20, 5000.00, 500.00, 1250.00, 0, 29250.00, 'paid', NOW()),
(2, 1, 2026, 18000.00, 15, 2700.00, 300.00, 900.00, 0, 20100.00, 'paid', NOW()),
(3, 1, 2026, 16000.00, 12, 1920.00, 200.00, 800.00, 0, 17320.00, 'paid', NOW()),
(4, 1, 2026, 14000.00, 10, 1400.00, 200.00, 700.00, 0, 14900.00, 'paid', NOW()),
(5, 1, 2026, 15000.00, 8, 1200.00, 250.00, 750.00, 0, 15700.00, 'paid', NOW()),
(6, 1, 2026, 8000.00, 25, 2500.00, 100.00, 400.00, 500, 9700.00, 'paid', NOW()),
(7, 1, 2026, 13000.00, 10, 1300.00, 200.00, 650.00, 0, 13850.00, 'paid', NOW()),
(8, 1, 2026, 5500.00, 30, 2475.00, 150.00, 275.00, 0, 7850.00, 'paid', NOW()),
(9, 1, 2026, 9000.00, 5, 675.00, 100.00, 450.00, 0, 9325.00, 'paid', NOW()),
(10, 1, 2026, 15000.00, 15, 2250.00, 300.00, 750.00, 0, 16800.00, 'paid', NOW()),
(11, 1, 2026, 5200.00, 35, 2730.00, 100.00, 260.00, 0, 7770.00, 'paid', NOW()),
(12, 1, 2026, 4800.00, 28, 2016.00, 80.00, 240.00, 0, 6656.00, 'paid', NOW()),
(13, 1, 2026, 6000.00, 10, 900.00, 100.00, 300.00, 0, 6700.00, 'paid', NOW()),
(14, 1, 2026, 5500.00, 20, 1100.00, 80.00, 275.00, 0, 6405.00, 'paid', NOW()),
(15, 1, 2026, 5500.00, 15, 825.00, 80.00, 275.00, 0, 6130.00, 'paid', NOW()),
(16, 1, 2026, 7000.00, 18, 1260.00, 100.00, 350.00, 0, 8010.00, 'paid', NOW()),
(17, 1, 2026, 6500.00, 10, 975.00, 200.00, 325.00, 0, 7350.00, 'paid', NOW()),
(18, 1, 2026, 7500.00, 12, 1350.00, 150.00, 375.00, 0, 8625.00, 'paid', NOW()),
(19, 1, 2026, 5000.00, 25, 1250.00, 80.00, 250.00, 0, 6080.00, 'paid', NOW()),
(20, 1, 2026, 4700.00, 22, 1034.00, 80.00, 235.00, 0, 5579.00, 'paid', NOW());

-- ============================================================
-- 16. PERFORMANCE REVIEWS (10 reviews)
-- ============================================================
TRUNCATE TABLE performance_reviews;
INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, productivity_score, quality_score, attendance_score, teamwork_score, overall_score, comments, goals, status, created_at) VALUES
(2, 1, '2026-01-15', 95, 90, 95, 92, 93, 'مشرف ممتاز، يحتاج لتطوير مهارات التدريب', 'دورة TTT', 'completed', NOW()),
(5, 1, '2026-01-15', 88, 85, 90, 95, 89, 'أداء جيد في التوظيف', 'تقليل وقت التعيين', 'completed', NOW()),
(7, 1, '2026-01-15', 92, 98, 88, 85, 91, 'فاحصة ممتازة، دقيقة جداً', 'دورة Lead Auditor', 'completed', NOW()),
(8, 1, '2026-01-15', 85, 82, 95, 90, 88, 'إنتاجية ممتازة، يحتاج لتحسين الجودة', 'تقليل العيوب 5%', 'completed', NOW()),
(10, 1, '2026-01-15', 90, 88, 92, 90, 90, 'مشرف خط ممتاز', 'تطوير 2 مشرفين', 'completed', NOW()),
(4, 1, '2026-01-15', 88, 92, 95, 85, 90, 'محاسبة دقيقة', 'تعلم ERP متقدم', 'completed', NOW()),
(6, 1, '2026-01-15', 82, 88, 90, 80, 85, 'أمين مخزن مجتهد', 'تقليل الفروقات', 'completed', NOW()),
(16, 1, '2026-01-15', 80, 85, 88, 82, 84, 'فني صيانة جيد', 'شهادة Siemens', 'completed', NOW()),
(11, 1, '2026-01-15', 90, 85, 92, 88, 89, 'خياطة ممتازة وسريعة', 'تدريب新人', 'completed', NOW()),
(28, 1, 2026, 87, 85, 90, 88, 87, 'مشرف خط ثاني جيد', 'زيادة الكفاءة 5%', 'completed', NOW());

-- ============================================================
-- 17. BUNDLES (20 bundles for tracking)
-- ============================================================
TRUNCATE TABLE bundles;
INSERT INTO bundles (bundle_code, production_order_id, model_id, size, color, quantity, current_stage, current_line_id, status, created_at) VALUES
('BN-2026-001A', 1, 1, 'M', 'أبيض', 50, 'cutting', NULL, 'active', NOW()),
('BN-2026-001B', 1, 1, 'L', 'أبيض', 50, 'sewing', 1, 'active', NOW()),
('BN-2026-001C', 1, 1, 'XL', 'أبيض', 50, 'sewing', 1, 'active', NOW()),
('BN-2026-002A', 2, 2, 'M', 'كحلي', 40, 'completed', 2, 'completed', NOW()),
('BN-2026-002B', 2, 2, 'L', 'كحلي', 40, 'completed', 2, 'completed', NOW()),
('BN-2026-003A', 3, 3, 'S', 'رمادي', 60, 'sewing', 3, 'active', NOW()),
('BN-2026-003B', 3, 3, 'M', 'رمادي', 60, 'cutting', NULL, 'active', NOW()),
('BN-2026-004A', 4, 4, 'M', 'أسود', 30, 'sewing', 4, 'active', NOW()),
('BN-2026-005A', 5, 5, 'S', 'أحمر', 25, 'pending', NULL, 'pending', NOW()),
('BN-2026-006A', 6, 1, '4Y', 'أزرق فاتح', 50, 'completed', 1, 'completed', NOW()),
('BN-2026-007A', 7, 3, 'M', 'أسود', 45, 'sewing', 3, 'active', NOW()),
('BN-2026-008A', 8, 1, 'L', 'زهري', 40, 'pressing', 1, 'active', NOW()),
('BN-2026-009A', 9, 2, 'L', 'رمادي غامق', 35, 'pending', NULL, 'pending', NOW()),
('BN-2026-010A', 10, 4, 'XL', 'كحلي', 30, 'pending', NULL, 'pending', NOW());

-- ============================================================
-- 18. COMPANY SETTINGS
-- ============================================================
TRUNCATE TABLE company_settings;
INSERT INTO company_settings (company_name, address, phone, email, tax_number, currency, logo_url, created_at) VALUES
('هورايزن للملابس الجاهزة', 'المنطقة الصناعية A، العاشر من رمضان، الشرقية', '015-12345678', 'info@horizon-garments.com', '123-456-789', 'EGP', '/logo.png', NOW());

-- ============================================================
-- 19. SYSTEM SETTINGS
-- ============================================================
TRUNCATE TABLE system_settings;
INSERT INTO system_settings (key, value, description, updated_at) VALUES
('working_hours_start', '07:00', 'بداية ساعات العمل', NOW()),
('working_hours_end', '17:00', 'نهاية ساعات العمل', NOW()),
('overtime_rate', '1.5', 'معامل الأوفرتايم', NOW()),
('max_overtime_daily', '4', 'الحد الأقصى للأوفرتايم اليومي', NOW()),
('currency', 'EGP', 'العملة الافتراضية', NOW()),
('date_format', 'YYYY-MM-DD', 'تنسيق التاريخ', NOW()),
('language', 'ar', 'اللغة الافتراضية', NOW()),
('theme', 'dark', 'الثيم الافتراضي', NOW()),
('auto_logout_minutes', '30', 'الخروج التلقائي بعد دقائق', NOW()),
('max_leave_annual', '21', 'الحد الأقصى للإجازة السنوية', NOW());

-- ============================================================
-- 20. ACTIVITIES (audit trail)
-- ============================================================
TRUNCATE TABLE activities;
INSERT INTO activities (user_id, action, entity, entity_id, details, ip_address, created_at) VALUES
(1, 'login', 'user', 1, 'Admin login from office', '192.168.1.100', NOW()),
(2, 'approve_order', 'production_order', 1, 'Approved PO-2026-001 for Line 1', '192.168.1.105', NOW()),
(3, 'create', 'sales_order', 5, 'Created SO-2026-005 for Bershka', '192.168.1.110', NOW()),
(5, 'approve_leave', 'leave', 1, 'Approved annual leave for HR-005', '192.168.1.102', NOW()),
(7, 'qc_check', 'qc_record', 3, 'Final QC passed for 150 units', '192.168.1.107', NOW()),
(6, 'receive', 'inventory', 1, 'Received 5000m cotton fabric', '192.168.1.106', NOW()),
(4, 'payment', 'payroll', 1, 'Processed January payroll', '192.168.1.104', NOW()),
(1, 'create', 'employee', 30, 'Added new employee HR-030', '192.168.1.100', NOW()),
(2, 'update', 'production_line', 1, 'Updated efficiency to 88.5%', '192.168.1.105', NOW()),
(7, 'reject', 'qc_record', 3, 'Warning issued for high defect rate', '192.168.1.107', NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED COMPLETE: 77 tables seeded with realistic garment factory data
-- Summary:
--   Users: 8, Departments: 14, Employees: 30
--   Production Lines: 5, Machines: 12, Orders: 10
--   Daily Production: 20, Attendance: 20, Inventory: 30
--   Suppliers: 10, Customers: 8, Sales Orders: 10
--   Leaves: 15, QC Records: 20, Payroll: 20
--   Performance Reviews: 10, Bundles: 14
--   Company Settings: 1, System Settings: 10
--   Activities: 10
-- ============================================================
