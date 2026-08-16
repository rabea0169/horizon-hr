// ============================================================
//  نظام إدارة الموديولات — Module Registry
//  مُعاد هيكلته وفق 14 موديول رئيسي من وثيقة المتطلبات
// ============================================================

import { lazy, useState, useEffect, type ComponentType } from "react";

// ─── 14 فئة رئيسية تتوافق مع وثيقة المتطلبات ───
export type ModuleCategory =
  | "dashboard"           // 1. لوحة التحكم
  | "merchandising"       // 2. الميرتشندايزنج والمبيعات
  | "inventory"           // 3. المخزون والمشتريات
  | "bom"                 // 4. قوائم المواد BOM
  | "production"          // 5. التخطيط والإنتاج
  | "quality"             // 6. مراقبة الجودة
  | "hr"                  // 7. الموارد البشرية
  | "attendance"          // 8. الحضور والورديات
  | "payroll"             // 9. الرواتب والأجور
  | "accounting"          // 10. المحاسبة والمالية
  | "assets"              // 11. الأصول والصيانة
  | "reports"             // 12. التقارير والتحليلات
  | "system";             // 13. النظام والإعدادات

export type AppModule = {
  id: string;
  name: string;
  path: string;
  component: ComponentType;
  icon: string;
  category: ModuleCategory;
  enabled: boolean;
  price: number;
  description: string;
};

// ─── lazy imports for all pages ───
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdvancedBI = lazy(() => import("./pages/AdvancedBI"));
const Kiosk = lazy(() => import("./pages/Kiosk"));
const Machines = lazy(() => import("./pages/Machines"));
const PrintSettings = lazy(() => import("./pages/PrintSettings"));
const Settings = lazy(() => import("./pages/Settings"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const Approvals = lazy(() => import("./pages/Approvals"));
const BackupRestore = lazy(() => import("./pages/BackupRestore"));
const WhatsAppNotifications = lazy(() => import("./pages/WhatsAppNotifications"));
const AIPredictions = lazy(() => import("./pages/AIPredictions"));
const MobileApp = lazy(() => import("./pages/MobileApp"));
const ServerSetup = lazy(() => import("./pages/ServerSetup"));
const QATesting = lazy(() => import("./pages/QATesting"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const AdminGuide = lazy(() => import("./pages/AdminGuide"));

const HRHub = lazy(() => import("./pages/hubs/HRHub"));
const ProductionHub = lazy(() => import("./pages/hubs/ProductionHub"));
const InventoryHub = lazy(() => import("./pages/hubs/InventoryHub"));
const AccountingHub = lazy(() => import("./pages/hubs/AccountingHub"));
const SalesHub = lazy(() => import("./pages/hubs/SalesHub"));

// ─── Module Registry — 14 موديول رئيسي ───

export const ALL_MODULES: AppModule[] = [
  // ═══════════════════════════════════════
  //  1. لوحة التحكم (Dashboard)
  // ═══════════════════════════════════════
  {
    id: "dashboard",
    name: "لوحة التحكم",
    path: "/",
    component: Dashboard,
    icon: "LayoutDashboard",
    category: "dashboard",
    enabled: true,
    price: 0,
    description: "نظرة شاملة على KPIs والمؤشرات الرئيسية",
  },
  {
    id: "executive",
    name: "لوحة المدير التنفيذي",
    path: "/executive",
    component: ExecutiveDashboard,
    icon: "TrendingUp",
    category: "dashboard",
    enabled: true,
    price: 0,
    description: "KPIs متقدمة — إيرادات — كفاءة — تكلفة القطعة",
  },

  // ═══════════════════════════════════════
  //  2. الميرتشندايزنج والمبيعات
  //     (Merchandising, Sales Orders, CRM, Dispatch)
  // ═══════════════════════════════════════
  {
    id: "sales-orders",
    name: "أوامر البيع",
    path: "/sales-orders",
    component: SalesHub,
    icon: "ShoppingCart",
    category: "merchandising",
    enabled: true,
    price: 2500,
    description: "Sales Orders — أوامر البيع والعملاء",
  },
  {
    id: "crm",
    name: "العملاء",
    path: "/crm",
    component: SalesHub,
    icon: "UserCheck",
    category: "merchandising",
    enabled: true,
    price: 2000,
    description: "CRM — إدارة علاقات العملاء والمشترين",
  },
  {
    id: "dispatch",
    name: "الصرف والتوصيل",
    path: "/dispatch",
    component: SalesHub,
    icon: "ScanBarcode",
    category: "merchandising",
    enabled: true,
    price: 1500,
    description: "إذن صرف بضاعة (Challan/GDN)",
  },
  {
    id: "quotation",
    name: "عروض الأسعار",
    path: "/quotation",
    component: SalesHub,
    icon: "FileText",
    category: "merchandising",
    enabled: true,
    price: 2000,
    description: "عروض أسعار صالحة 30 يوم مع VAT 14%",
  },
  {
    id: "sales-pipeline",
    name: "خط البيع",
    path: "/sales-pipeline",
    component: SalesHub,
    icon: "TrendingUp",
    category: "merchandising",
    enabled: true,
    price: 3000,
    description: "إدارة فرص البيع وخطوط البيع",
  },
  {
    id: "sales-forecasting",
    name: "توقعات المبيعات",
    path: "/sales-forecasting",
    component: SalesHub,
    icon: "BarChart3",
    category: "merchandising",
    enabled: true,
    price: 2500,
    description: "تحليل وتواردات المبيعات المستقبلية",
  },
  {
    id: "sales-commissions",
    name: "عمولات المبيعات",
    path: "/sales-commissions",
    component: SalesHub,
    icon: "DollarSign",
    category: "merchandising",
    enabled: true,
    price: 2000,
    description: "حساب وإدارة عمولات مندوبي المبيعات",
  },
  {
    id: "shipping-delivery",
    name: "الشحن والتوصيل",
    path: "/shipping-delivery",
    component: SalesHub,
    icon: "Truck",
    category: "merchandising",
    enabled: true,
    price: 2500,
    description: "تتبع الشحنات والتوصيل للعملاء",
  },
  {
    id: "purchase-requests",
    name: "طلبات الشراء",
    path: "/purchase-requests",
    component: InventoryHub,
    icon: "FileText",
    category: "inventory",
    enabled: true,
    price: 2000,
    description: "طلبات الشراء الداخلية ومسار الموافقة",
  },
  {
    id: "purchase-orders",
    name: "أوامر الشراء",
    path: "/purchase-orders",
    component: InventoryHub,
    icon: "ShoppingCart",
    category: "inventory",
    enabled: true,
    price: 2500,
    description: "إدارة أوامر الشراء للموردين",
  },
  {
    id: "rfq",
    name: "عروض أسعار الموردين",
    path: "/rfq",
    component: InventoryHub,
    icon: "MessageSquare",
    category: "inventory",
    enabled: true,
    price: 2000,
    description: "طلب ومقارنة عروض الأسعار من الموردين",
  },
  {
    id: "goods-receipt",
    name: "إيصالات الاستلام",
    path: "/goods-receipt",
    component: InventoryHub,
    icon: "PackageCheck",
    category: "inventory",
    enabled: true,
    price: 2000,
    description: "تسجيل وفحص استلام البضائع من الموردين",
  },
  {
    id: "sales-rep-app",
    name: "مندوب المبيعات",
    path: "/sales-rep",
    component: SalesHub,
    icon: "Smartphone",
    category: "merchandising",
    enabled: true,
    price: 3000,
    description: "تطبيق مندوب المبيعات — زيارات — طلبات — GPS",
  },

  // ═══════════════════════════════════════
  //  3. المخزون والمشتريات
  //     (Inventory, Suppliers, MRP, Subcontracting)
  // ═══════════════════════════════════════
  {
    id: "inventory",
    name: "المخزون",
    path: "/inventory",
    component: InventoryHub,
    icon: "Boxes",
    category: "inventory",
    enabled: true,
    price: 2000,
    description: "إدارة المخزون — استلام وصرف وتحويل",
  },
  {
    id: "mrp",
    name: "تخطيط المواد",
    path: "/mrp",
    component: InventoryHub,
    icon: "PackageSearch",
    category: "inventory",
    enabled: true,
    price: 2000,
    description: "MRP — تخطيط احتياجات المواد الخام",
  },
  {
    id: "suppliers",
    name: "الموردين",
    path: "/suppliers",
    component: InventoryHub,
    icon: "Truck",
    category: "inventory",
    enabled: true,
    price: 1500,
    description: "إدارة الموردين و أوامر الشراء (PO)",
  },
  {
    id: "subcontracting",
    name: "التشغيل الخارجي",
    path: "/subcontracting",
    component: InventoryHub,
    icon: "ExternalLink",
    category: "inventory",
    enabled: true,
    price: 1500,
    description: "تتبع التشغيل الخارجي (Outsourcing)",
  },
  {
    id: "finished-goods",
    name: "مخزن المنتج النهائي",
    path: "/finished-goods",
    component: SalesHub,
    icon: "PackageCheck",
    category: "inventory",
    enabled: true,
    price: 2000,
    description: "تتبع المنتجات الجاهزة — تسليم — شحن",
  },
  {
    id: "grn",
    name: "استلام بضاعة (GRN)",
    path: "/grn",
    component: InventoryHub,
    icon: "ClipboardCheck",
    category: "inventory",
    enabled: true,
    price: 2000,
    description: "إشعار استلام بضاعة مع VAT 14%",
  },

  // ═══════════════════════════════════════
  //  4. قوائم المواد BOM
  // ═══════════════════════════════════════
  {
    id: "bom",
    name: "قوائم المواد",
    path: "/bom",
    component: ProductionHub,
    icon: "Layers",
    category: "bom",
    enabled: true,
    price: 2500,
    description: "Bill of Materials — قائمة مواد كل موديل",
  },
  {
    id: "cad-viewer",
    name: "عارض CAD",
    path: "/cad-viewer",
    component: ProductionHub,
    icon: "Monitor",
    category: "bom",
    enabled: true,
    price: 2500,
    description: "عرض واستيراد ملفات DXF و Marker Plans من Gerber/Lectra",
  },

  // ═══════════════════════════════════════
  //  5. التخطيط والإنتاج
  //     (Production Lines, Models, Cutting, Work Orders, QR Tracking)
  // ═══════════════════════════════════════
  {
    id: "factory",
    name: "خطوط الإنتاج",
    path: "/factory",
    component: ProductionHub,
    icon: "Factory",
    category: "production",
    enabled: true,
    price: 1500,
    description: "إدارة خطوط الإنتاج والمقصات",
  },
  {
    id: "production-models",
    name: "الموديلات",
    path: "/production-models",
    component: ProductionHub,
    icon: "Tag",
    category: "production",
    enabled: true,
    price: 2000,
    description: "إدارة موديلات الملابس والـ Tech Packs",
  },
  {
    id: "cutting",
    name: "القص",
    path: "/cutting",
    component: ProductionHub,
    icon: "Scissors",
    category: "production",
    enabled: true,
    price: 1500,
    description: "أوامر القص وخطط الماركر",
  },
  {
    id: "work-orders",
    name: "أوامر الشغل",
    path: "/work-orders",
    component: ProductionHub,
    icon: "FileCheck",
    category: "production",
    enabled: true,
    price: 2000,
    description: "أوامر التشغيل (Job Orders) مرتبطة بالـ BOM",
  },
  {
    id: "qr-tracking",
    name: "تتبع الباندلز",
    path: "/qr-tracking",
    component: ProductionHub,
    icon: "QrCode",
    category: "production",
    enabled: true,
    price: 3000,
    description: "QR Code لكل باندل — تتبع عبر مراحل الإنتاج",
  },
  {
    id: "barcode-generator",
    name: "توليد باركود",
    path: "/barcode-generator",
    component: ProductionHub,
    icon: "Tag",
    category: "production",
    enabled: true,
    price: 1500,
    description: "توليد وطباعة QR/Barcode ملصقات للـ Bundles",
  },
  {
    id: "barcode-scanner",
    name: "ماسح الباركود",
    path: "/barcode-scanner",
    component: ProductionHub,
    icon: "ScanLine",
    category: "production",
    enabled: true,
    price: 1500,
    description: "مسح QR/Barcode بالكاميرا — تحديث مراحل الإنتاج",
  },
  {
    id: "realtime-production",
    name: "الإنتاج المباشر",
    path: "/realtime-production",
    component: ProductionHub,
    icon: "Activity",
    category: "production",
    enabled: true,
    price: 3500,
    description: "تتبع إنتاجي حقيقي — كفاءة خطوط الإنتاج مباشرة",
  },
  {
    id: "wastage",
    name: "الهالك",
    path: "/wastage",
    component: SalesHub,
    icon: "Scissors",
    category: "production",
    enabled: true,
    price: 1500,
    description: "حساب وتحليل الهالك — القص — الخياطة — المعايير",
  },

  // ═══════════════════════════════════════
  //  6. مراقبة الجودة (QMS / AQL)
  // ═══════════════════════════════════════
  {
    id: "quality-control",
    name: "الجودة",
    path: "/quality-control",
    component: ProductionHub,
    icon: "ShieldCheck",
    category: "quality",
    enabled: true,
    price: 2500,
    description: "فحص جودة — Incoming / Inline / Final + AQL",
  },
  {
    id: "aql-calculator",
    name: "حساب AQL",
    path: "/aql-calculator",
    component: ProductionHub,
    icon: "Shield",
    category: "quality",
    enabled: true,
    price: 1500,
    description: "MIL-STD-105E — Sample Size — Acceptance Criteria",
  },

  // ═══════════════════════════════════════
  //  7. الموارد البشرية
  // ═══════════════════════════════════════
  {
    id: "employees",
    name: "العمال",
    path: "/employees",
    component: HRHub,
    icon: "Users",
    category: "hr",
    enabled: true,
    price: 1500,
    description: "بيانات العمال والموظفين والمهارات",
  },
  {
    id: "departments",
    name: "الأقسام",
    path: "/departments",
    component: HRHub,
    icon: "Building2",
    category: "hr",
    enabled: true,
    price: 800,
    description: "تنظيم أقسام المصنع والهيكل الإداري",
  },
  {
    id: "recruitment",
    name: "التعيين",
    path: "/recruitment",
    component: HRHub,
    icon: "Briefcase",
    category: "hr",
    enabled: true,
    price: 1200,
    description: "طلبات التوظيف والمتقدمين",
  },
  {
    id: "performance",
    name: "التقييم",
    path: "/performance",
    component: HRHub,
    icon: "TrendingUp",
    category: "hr",
    enabled: true,
    price: 1000,
    description: "تقييم أداء الموظفين الدوري",
  },
  {
    id: "leaves",
    name: "الإجازات",
    path: "/leaves",
    component: HRHub,
    icon: "CalendarDays",
    category: "hr",
    enabled: true,
    price: 1000,
    description: "إدارة الإجازات السنوية والمرضية والطارئة",
  },

  // ═══════════════════════════════════════
  //  8. الحضور والورديات
  // ═══════════════════════════════════════
  {
    id: "attendance",
    name: "الحضور والغياب",
    path: "/attendance",
    component: HRHub,
    icon: "Clock",
    category: "attendance",
    enabled: true,
    price: 2000,
    description: "تتبع الحضور والانصراف (يدوي + بصمة)",
  },
  {
    id: "shifts",
    name: "الورديات",
    path: "/shifts",
    component: HRHub,
    icon: "Sun",
    category: "attendance",
    enabled: true,
    price: 1200,
    description: "إدارة نظام الورديات المتعددة",
  },
  {
    id: "shift-report",
    name: "تقرير الوردية",
    path: "/shift-report",
    component: HRHub,
    icon: "ClipboardList",
    category: "attendance",
    enabled: true,
    price: 800,
    description: "تقارير أداء كل وردية إنتاجية",
  },
  {
    id: "kiosk",
    name: "جهاز الحضور",
    path: "/kiosk",
    component: Kiosk,
    icon: "Monitor",
    category: "attendance",
    enabled: true,
    price: 1500,
    description: "واجهة الحضور السريع (Kiosk Mode)",
  },
  {
    id: "worker-portal",
    name: "بوابة العامل",
    path: "/worker-portal",
    component: HRHub,
    icon: "User",
    category: "attendance",
    enabled: true,
    price: 1500,
    description: "كل عامل يرى: إنتاجه / راتبه / الحضور / الجودة",
  },
  {
    id: "zkteco",
    name: "بصمة ZKTeco",
    path: "/zkteco",
    component: HRHub,
    icon: "Fingerprint",
    category: "attendance",
    enabled: true,
    price: 3000,
    description: "ربط جهاز البصمة — سحب بيانات — حساب تأخير/غياب",
  },

  // ═══════════════════════════════════════
  //  9. الرواتب والأجور
  // ═══════════════════════════════════════
  {
    id: "payroll",
    name: "كشف الرواتب",
    path: "/payroll",
    component: AccountingHub,
    icon: "CreditCard",
    category: "payroll",
    enabled: true,
    price: 2000,
    description: "كشف الرواتب الشهري — الأجر بالوقت",
  },
  {
    id: "piece-rate",
    name: "أجر القطعة",
    path: "/piece-rate",
    component: AccountingHub,
    icon: "Calculator",
    category: "payroll",
    enabled: true,
    price: 2500,
    description: "حساب أجر القطعة (Piece Rate) + SAM",
  },
  {
    id: "advances",
    name: "السلف",
    path: "/advances",
    component: AccountingHub,
    icon: "Wallet",
    category: "payroll",
    enabled: true,
    price: 1000,
    description: "إدارة سلف وسلفيات العمال",
  },
  {
    id: "bonuses",
    name: "المكافآت والخصومات",
    path: "/bonuses",
    component: AccountingHub,
    icon: "Award",
    category: "payroll",
    enabled: true,
    price: 1000,
    description: "مكافآت الجودة والسرعة — خصومات الغياب والتأخير",
  },

  // ═══════════════════════════════════════
  //  10. المحاسبة والمالية
  // ═══════════════════════════════════════
  {
    id: "cost-calculation",
    name: "تكاليف الإنتاج",
    path: "/cost-calculation",
    component: AccountingHub,
    icon: "TrendingUp",
    category: "accounting",
    enabled: true,
    price: 3000,
    description: "حساب تكلفة الموديل — Fabric + Labor + Overhead",
  },
  {
    id: "expenses",
    name: "المصاريف التشغيلية",
    path: "/expenses",
    component: AccountingHub,
    icon: "Receipt",
    category: "accounting",
    enabled: true,
    price: 1500,
    description: "إدارة المصاريف — كهرباء — إيجار — مياه — صيانة",
  },
  {
    id: "financial",
    name: "التقارير المالية",
    path: "/financial",
    component: AccountingHub,
    icon: "BarChart3",
    category: "accounting",
    enabled: true,
    price: 2000,
    description: "التقارير المالية — VAT 14% — المستخلصات",
  },
  {
    id: "invoices",
    name: "الفواتير",
    path: "/invoices",
    component: AccountingHub,
    icon: "Receipt",
    category: "accounting",
    enabled: true,
    price: 2500,
    description: "فواتير مبيعات ومشتريات مع VAT 14%",
  },
  {
    id: "vouchers",
    name: "المستخلصات",
    path: "/vouchers",
    component: AccountingHub,
    icon: "Banknote",
    category: "accounting",
    enabled: true,
    price: 2000,
    description: "مستخلصات صرف وقبض + شيكات وتحويلات",
  },
  {
    id: "audit-log",
    name: "سجل العمليات",
    path: "/audit-log",
    component: AuditLog,
    icon: "Shield",
    category: "accounting",
    enabled: true,
    price: 1000,
    description: "Audit Log — تتبع كل عمليات المستخدمين",
  },
  {
    id: "chart-of-accounts",
    name: "الحسابات والقوائم المالية",
    path: "/chart-of-accounts",
    component: AccountingHub,
    icon: "BookOpen",
    category: "accounting",
    enabled: true,
    price: 3000,
    description: "شجرة الحسابات — ميزان المراجعة — قائمة الدخل — الميزانية العمومية",
  },
  {
    id: "treasury",
    name: "الخزينة",
    path: "/treasury",
    component: AccountingHub,
    icon: "Wallet",
    category: "accounting",
    enabled: true,
    price: 2500,
    description: "صناديق — بنوك — مقبوضات — مدفوعات — تدفق نقدي",
  },
  {
    id: "opening-balances",
    name: "الأرصدة الافتتاحية",
    path: "/opening-balances",
    component: AccountingHub,
    icon: "Lock",
    category: "accounting",
    enabled: true,
    price: 1500,
    description: "بداية السنة المالية — ترحيل الأرصدة",
  },
  {
    id: "aging-credit",
    name: "المديونيات والائتمان",
    path: "/aging-credit",
    component: AccountingHub,
    icon: "Timer",
    category: "accounting",
    enabled: true,
    price: 2500,
    description: "Aging Report — سقف الائتمان — فحص الائتمان",
  },

  // ═══════════════════════════════════════
  //  11. الأصول والصيانة
  // ═══════════════════════════════════════
  {
    id: "machines",
    name: "الماكينات والصيانة",
    path: "/machines",
    component: Machines,
    icon: "Cog",
    category: "assets",
    enabled: true,
    price: 1200,
    description: "تتبع الماكينات — صيانة وقائية وإصلاحية",
  },
  {
    id: "maintenance",
    name: "جدول الصيانة",
    path: "/maintenance",
    component: Maintenance,
    icon: "Wrench",
    category: "assets",
    enabled: true,
    price: 1500,
    description: "صيانة وقائية / إصلاحية / عمرة كاملة",
  },

  // ═══════════════════════════════════════
  //  12. التقارير والتحليلات (BI)
  // ═══════════════════════════════════════
  {
    id: "advanced-bi",
    name: "لوحة BI",
    path: "/advanced-bi",
    component: AdvancedBI,
    icon: "PieChart",
    category: "reports",
    enabled: true,
    price: 2500,
    description: "KPIs — تحليلات متقدمة — OTD — Line Efficiency",
  },
  {
    id: "reports",
    name: "التقارير الشاملة",
    path: "/reports",
    component: Reports,
    icon: "BarChart3",
    category: "reports",
    enabled: true,
    price: 2000,
    description: "11 تقرير: إنتاج ساعي — كفاءة — Pareto — OTD — مالي",
  },
  {
    id: "notifications",
    name: "التنبيهات",
    path: "/notifications",
    component: Notifications,
    icon: "Bell",
    category: "reports",
    enabled: true,
    price: 0,
    description: "تنبيهات: تأخر تسليم — مخزون منخفض — صيانة — غياب — AQL",
  },
  {
    id: "whatsapp-notifications",
    name: "إشعارات WhatsApp",
    path: "/whatsapp-notifications",
    component: WhatsAppNotifications,
    icon: "MessageCircle",
    category: "reports",
    enabled: true,
    price: 2000,
    description: "إشعارات WhatsApp/SMS — تسليم — مخزون — حضور",
  },
  {
    id: "ai-predictions",
    name: "تحليلات الذكاء الاصطناعي",
    path: "/ai-predictions",
    component: AIPredictions,
    icon: "Brain",
    category: "reports",
    enabled: true,
    price: 3000,
    description: "توقع المبيعات — تحسين الإنتاج — توصيات الشراء",
  },
  {
    id: "qa-testing",
    name: "اختبار الجودة",
    path: "/qa-testing",
    component: QATesting,
    icon: "Shield",
    category: "reports",
    enabled: true,
    price: 0,
    description: "اختبار شامل — فحص الأمان والأداء",
  },
  {
    id: "user-guide",
    name: "دليل المستخدم",
    path: "/user-guide",
    component: UserGuide,
    icon: "BookOpen",
    category: "reports",
    enabled: true,
    price: 0,
    description: "دليل الاستخدام مع اختصارات ونصائح",
  },
  {
    id: "admin-guide",
    name: "دليل المسؤول",
    path: "/admin-guide",
    component: AdminGuide,
    icon: "Shield",
    category: "system",
    enabled: true,
    price: 0,
    description: "إدارة النظام والأمان وقاعدة البيانات",
  },
  {
    id: "sam-calculator",
    name: "SAM Calculator",
    path: "/sam-calculator",
    component: ProductionHub,
    icon: "Calculator",
    category: "production",
    enabled: true,
    price: 2500,
    description: "حساب SAM — Line Balancing — Bottleneck Detection",
  },
  {
    id: "line-balancing",
    name: "Line Balancing + WIP",
    path: "/line-balancing",
    component: ProductionHub,
    icon: "GitBranch",
    category: "production",
    enabled: true,
    price: 3000,
    description: "توزيع العمليات — Operator Allocation — WIP Tracking",
  },

  // ═══════════════════════════════════════
  //  13. النظام والإعدادات
  // ═══════════════════════════════════════
  {
    id: "print-settings",
    name: "إعدادات الطباعة",
    path: "/print-settings",
    component: PrintSettings,
    icon: "Printer",
    category: "system",
    enabled: true,
    price: 500,
    description: "تخصيص ترويسة وتذييل المطبوعات",
  },
  {
    id: "approvals",
    name: "نظام الموافقات",
    path: "/approvals",
    component: Approvals,
    icon: "CheckCircle",
    category: "system",
    enabled: true,
    price: 0,
    description: "موافقات: أمر شراء — سلفية — إجازة — صيانة",
  },
  {
    id: "backup-restore",
    name: "نسخ احتياطي",
    path: "/backup-restore",
    component: BackupRestore,
    icon: "Database",
    category: "system",
    enabled: true,
    price: 0,
    description: "نسخ احتياطي يومي — 30 نسخة — استعادة بنقرة واحدة",
  },
  {
    id: "settings",
    name: "إعدادات النظام",
    path: "/settings",
    component: Settings,
    icon: "Settings",
    category: "system",
    enabled: true,
    price: 0,
    description: "إعدادات عامة — نسخ احتياطي — صلاحيات — لغة",
  },
  {
    id: "mobile-app",
    name: "تطبيق الموبايل",
    path: "/mobile",
    component: MobileApp,
    icon: "Smartphone",
    category: "system",
    enabled: true,
    price: 0,
    description: "PWA — حضور بالكاميرا — GPS — إشعارات",
  },
  {
    id: "server-setup",
    name: "إعداد الخادم",
    path: "/server-setup",
    component: ServerSetup,
    icon: "Server",
    category: "system",
    enabled: true,
    price: 0,
    description: "إعداد خادم النظام واختبار الاتصال بين الأجهزة",
  },
];

// ─── helpers ───

export function getEnabledModules(): AppModule[] {
  let disabledIds: string[] = [];
  try {
    const stored = localStorage.getItem("disabled_modules");
    if (stored) {
      disabledIds = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse disabled modules from localStorage", e);
  }
  return ALL_MODULES.filter((m) => m.enabled && !disabledIds.includes(m.id));
}

export function useEnabledModules() {
  const [modules, setModules] = useState<AppModule[]>(() => getEnabledModules());

  useEffect(() => {
    const handleUpdate = () => {
      setModules(getEnabledModules());
    };
    window.addEventListener("modules_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("modules_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return modules;
}

// خريطة تحويل الفئات القديمة (14 فئة) إلى الفئات الست الرئيسية لنظام الـ ERP
export type ERPCategory = "dashboard" | "hr" | "inventory" | "production" | "accounting" | "sales" | "system";

export const categoryMapping: Record<ModuleCategory, ERPCategory> = {
  dashboard: "dashboard",
  hr: "hr",
  attendance: "hr",
  payroll: "hr",
  inventory: "inventory",
  bom: "production",
  production: "production",
  quality: "production",
  accounting: "accounting",
  assets: "accounting",
  merchandising: "sales",
  reports: "dashboard", // التقارير تدرج تحت فئة لوحة التحكم
  system: "system",
};

const categoryLabels: Record<ERPCategory, string> = {
  dashboard: "الرئيسية والتحليلات",
  hr: "👥 الموارد البشرية (HR)",
  inventory: "📦 المخازن والمشتريات (Inventory)",
  production: "🏭 التصنيع والإنتاج (Manufacturing)",
  accounting: "💰 الحسابات المالية (Accounting)",
  sales: "🤝 إدارة العلاقات والمبيعات (Sales & CRM)",
  system: "⚙️ الإعدادات والنظام (Settings)",
};

const categoryOrder: ERPCategory[] = [
  "dashboard",
  "hr",
  "inventory",
  "production",
  "accounting",
  "sales",
  "system",
];

export const collapsibleCategories: ERPCategory[] = [
  "hr",
  "inventory",
  "production",
  "accounting",
  "sales",
  "system",
];

export function getModulesByCategory(enabled: AppModule[] = getEnabledModules()): {
  title: string;
  category: ERPCategory;
  modules: AppModule[];
  collapsible: boolean;
}[] {
  const grouped = new Map<ERPCategory, AppModule[]>();
  enabled.forEach((m) => {
    const erpCat = categoryMapping[m.category] || "system";
    const list = grouped.get(erpCat) || [];
    list.push(m);
    grouped.set(erpCat, list);
  });

  return categoryOrder
    .map((cat) => ({
      title: categoryLabels[cat],
      category: cat,
      modules: grouped.get(cat) || [],
      collapsible: collapsibleCategories.includes(cat),
    }))
    .filter((g) => g.modules.length > 0);
}

export function isModuleEnabled(id: string): boolean {
  return getEnabledModules().some((m) => m.id === id);
}

export function getModulePriceTotal(): number {
  return getEnabledModules().reduce((sum, m) => sum + m.price, 0);
}
