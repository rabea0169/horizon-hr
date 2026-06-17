// ============================================================
//  نظام إدارة الموديولات — Module Registry
//  مُعاد هيكلته وفق 14 موديول رئيسي من وثيقة المتطلبات
// ============================================================

import { lazy, type ComponentType } from "react";

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
const Employees = lazy(() => import("./pages/Employees"));
const Departments = lazy(() => import("./pages/Departments"));
const Recruitment = lazy(() => import("./pages/Recruitment"));
const Performance = lazy(() => import("./pages/Performance"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Shifts = lazy(() => import("./pages/Shifts"));
const ShiftReport = lazy(() => import("./pages/ShiftReport"));
const Leaves = lazy(() => import("./pages/Leaves"));
const Kiosk = lazy(() => import("./pages/Kiosk"));
const Factory = lazy(() => import("./pages/Factory"));
const ProductionModels = lazy(() => import("./pages/ProductionModels"));
const Cutting = lazy(() => import("./pages/Cutting"));
const WorkOrders = lazy(() => import("./pages/WorkOrders"));
const QRTracking = lazy(() => import("./pages/QRTracking"));
const BOM = lazy(() => import("./pages/BOM"));
const Machines = lazy(() => import("./pages/Machines"));
const QualityControl = lazy(() => import("./pages/QualityControl"));
const MRP = lazy(() => import("./pages/MRP"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Payroll = lazy(() => import("./pages/Payroll"));
const PieceRate = lazy(() => import("./pages/PieceRate"));
const CostCalculation = lazy(() => import("./pages/CostCalculation"));
const FinancialReport = lazy(() => import("./pages/FinancialReport"));
const Advances = lazy(() => import("./pages/Advances"));
const BonusPenalties = lazy(() => import("./pages/BonusPenalties"));
const SalesOrders = lazy(() => import("./pages/SalesOrders"));
const CRM = lazy(() => import("./pages/CRM"));
const SalesPipeline = lazy(() => import("./pages/SalesPipeline"));
const SalesForecasting = lazy(() => import("./pages/SalesForecasting"));
const SalesCommissions = lazy(() => import("./pages/SalesCommissions"));
const PurchaseRequests = lazy(() => import("./pages/PurchaseRequests"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const RFQ = lazy(() => import("./pages/RFQ"));
const GoodsReceipt = lazy(() => import("./pages/GoodsReceipt"));
const ShippingDelivery = lazy(() => import("./pages/ShippingDelivery"));
const Dispatch = lazy(() => import("./pages/Dispatch"));
const Subcontracting = lazy(() => import("./pages/Subcontracting"));
const PrintSettings = lazy(() => import("./pages/PrintSettings"));
const Settings = lazy(() => import("./pages/Settings"));
const Quotation = lazy(() => import("./pages/Quotation"));
const GRN = lazy(() => import("./pages/GRN"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Vouchers = lazy(() => import("./pages/Vouchers"));
const Reports = lazy(() => import("./pages/Reports"));
const SAMCalculator = lazy(() => import("./pages/SAMCalculator"));
const WorkerPortal = lazy(() => import("./pages/WorkerPortal"));
const AQLCalculator = lazy(() => import("./pages/AQLCalculator"));
const LineBalancing = lazy(() => import("./pages/LineBalancing"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const Approvals = lazy(() => import("./pages/Approvals"));
const ZKTeco = lazy(() => import("./pages/ZKTeco"));
const BackupRestore = lazy(() => import("./pages/BackupRestore"));
const WhatsAppNotifications = lazy(() => import("./pages/WhatsAppNotifications"));
const AIPredictions = lazy(() => import("./pages/AIPredictions"));
const BarcodeGenerator = lazy(() => import("./pages/BarcodeGenerator"));
const BarcodeScanner = lazy(() => import("./pages/BarcodeScanner"));
const CADViewer = lazy(() => import("./pages/CADViewer"));
const RealTimeProduction = lazy(() => import("./pages/RealTimeProduction"));
const MobileApp = lazy(() => import("./pages/MobileApp"));
const ServerSetup = lazy(() => import("./pages/ServerSetup"));
const QATesting = lazy(() => import("./pages/QATesting"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const AdminGuide = lazy(() => import("./pages/AdminGuide"));
const Expenses = lazy(() => import("./pages/Expenses"));
const FinishedGoods = lazy(() => import("./pages/FinishedGoods"));
const Wastage = lazy(() => import("./pages/Wastage"));
const SalesRepApp = lazy(() => import("./pages/SalesRepApp"));
const ChartOfAccounts = lazy(() => import("./pages/ChartOfAccounts"));
const Treasury = lazy(() => import("./pages/Treasury"));
const OpeningBalances = lazy(() => import("./pages/OpeningBalances"));
const AgingCredit = lazy(() => import("./pages/AgingCredit"));

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
    component: SalesOrders,
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
    component: CRM,
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
    component: Dispatch,
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
    component: Quotation,
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
    component: SalesPipeline,
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
    component: SalesForecasting,
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
    component: SalesCommissions,
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
    component: ShippingDelivery,
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
    component: PurchaseRequests,
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
    component: PurchaseOrders,
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
    component: RFQ,
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
    component: GoodsReceipt,
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
    component: SalesRepApp,
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
    component: Inventory,
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
    component: MRP,
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
    component: Suppliers,
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
    component: Subcontracting,
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
    component: FinishedGoods,
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
    component: GRN,
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
    component: BOM,
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
    component: CADViewer,
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
    component: Factory,
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
    component: ProductionModels,
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
    component: Cutting,
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
    component: WorkOrders,
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
    component: QRTracking,
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
    component: BarcodeGenerator,
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
    component: BarcodeScanner,
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
    component: RealTimeProduction,
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
    component: Wastage,
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
    component: QualityControl,
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
    component: AQLCalculator,
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
    component: Employees,
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
    component: Departments,
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
    component: Recruitment,
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
    component: Performance,
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
    component: Leaves,
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
    component: Attendance,
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
    component: Shifts,
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
    component: ShiftReport,
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
    component: WorkerPortal,
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
    component: ZKTeco,
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
    component: Payroll,
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
    component: PieceRate,
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
    component: Advances,
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
    component: BonusPenalties,
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
    component: CostCalculation,
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
    component: Expenses,
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
    component: FinancialReport,
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
    component: Invoices,
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
    component: Vouchers,
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
    component: ChartOfAccounts,
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
    component: Treasury,
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
    component: OpeningBalances,
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
    component: AgingCredit,
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
    component: SAMCalculator,
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
    component: LineBalancing,
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
  return ALL_MODULES.filter((m) => m.enabled);
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
  sales: "sales",
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

export function getModulesByCategory(): {
  title: string;
  category: ERPCategory;
  modules: AppModule[];
  collapsible: boolean;
}[] {
  const enabled = getEnabledModules();

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
  return ALL_MODULES.find((m) => m.id === id)?.enabled ?? false;
}

export function getModulePriceTotal(): number {
  return getEnabledModules().reduce((sum, m) => sum + m.price, 0);
}
