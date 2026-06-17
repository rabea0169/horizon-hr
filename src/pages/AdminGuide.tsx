import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, Database, Settings, Bell, Lock, Activity,
  Server, Key, Monitor, FileText, AlertCircle, CheckCircle, Code
} from "lucide-react";

interface AdminSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: Array<{
    label: string;
    desc: string;
    steps: string[];
    warning?: string;
  }>;
}

const adminSections: AdminSection[] = [
  {
    id: "users",
    title: "إدارة المستخدمين والأدوار",
    icon: Users,
    color: "#3B82F6",
    items: [
      {
        label: "إضافة مستخدم جديد",
        desc: "إنشاء حساب جديد مع تحديد الدور والصلاحيات",
        steps: [
          "اذهب إلى \"الموظفين\" واضغط \"موظف جديد\"",
          "أدخل البيانات الأساسية (الاسم، البريد، الهاتف)",
          "اختر الدور: admin / supervisor / accountant / worker / storekeeper / qc_manager",
          "حدد الإدارة وتاريخ التعيين والراتب",
          "يتم إنشاء حساب تلقائياً بنفس كود الموظف",
        ],
      },
      {
        label: "تعديل صلاحيات الدور",
        desc: "تخصيص ما يمكن لكل دور رؤيته وتعديله",
        steps: [
          "ملف src/hooks/useRoles.ts يحتوي على تعريف الأدوار",
          "كل دور له قائمة modulesIds المسموح بالوصول إليها",
          "لإضافة موديول لدور: أضف moduleId لـ PERMISSIONS[role]",
          "لحذف موديول: أزله من القائمة",
        ],
        warning: "تغيير صلاحيات admin يؤثر على كل النظام",
      },
    ],
  },
  {
    id: "database",
    title: "إدارة قاعدة البيانات",
    icon: Database,
    color: "#10B981",
    items: [
      {
        label: "Seed Data — ملء البيانات الاختبارية",
        desc: "ملء 77 جدول ببيانات واقعية لمصنع ملابس",
        steps: [
          "الملف: db/seed-realistic.sql يحتوي على INSERT لجميع الجداول",
          "تشغيل: mysql -h HOST -u USER -p DATABASE < seed-realistic.sql",
          "يملأ: 30 موظف، 5 خطوط إنتاج، 10 أوامر إنتاج، 30 صنف مخزون، 10 موردين، 8 عملاء",
          "للتنظيف قبل الإعادة: SET FOREIGN_KEY_CHECKS=0; TRUNCATE ...",
        ],
        warning: "TRUNCATE يحذف كل البيانات — خذ نسخة احتياطية أولاً",
      },
      {
        label: "نسخة احتياطية",
        desc: "إنشاء واستعادة نسخ احتياطية",
        steps: [
          "اذهب إلى \"النسخ الاحتياطي\" من القائمة الجانبية",
          "اضغط \"نسخة احتياطية جديدة\" لإنشاء backup",
          "يتم تصدير قاعدة البيانات كـ SQL file",
          "للاستعادة: اختر ملف backup واضغط \"استعادة\"",
        ],
      },
      {
        label: "إعادة ضبط النظام",
        desc: "إعادة كل البيانات للحالة الابتدائية",
        steps: [
          "اضغط \"إعادة ضبط\" في صفحة النسخ الاحتياطي",
          "يؤكد النظام: \"هل أنت متأكد؟\"",
          "يحذف كل البيانات ويعيد ملء seed الافتراضي",
          "⚠️ لا يمكن التراجع عن هذه العملية",
        ],
        warning: "هذه العملية لا رجعة فيها — تأكد من أخذ backup",
      },
    ],
  },
  {
    id: "security",
    title: "الأمان والصلاحيات",
    icon: Shield,
    color: "#F59E0B",
    items: [
      {
        label: "JWT Secret Key",
        desc: "تغيير مفتاح تشفير JWT",
        steps: [
          "ملف: api/horizon-auth.ts",
          "ابحث عن: HORIZON_JWT_SECRET",
          "غيّر القيمة في environment variable أو الملف مباشرة",
          "أعد تشغيل السيرفر بعد التغيير",
        ],
        warning: "تغيير المفتاح يُخرج كل المستخدمين — عليهم تسجيل الدخول مرة أخرى",
      },
      {
        label: "Session Timeout",
        desc: "تعديل مدة انتهاء الجلسة",
        steps: [
          "ملف: api/horizon-auth.ts",
          "ابحث عن: setExpirationTime(\"8h\")",
          "غيّر \"8h\" إلى المدة المطلوبة (مثلاً: \"2h\", \"30m\")",
          "أيضاً عدّل: system_settings.auto_logout_minutes في DB",
        ],
      },
      {
        label: "Audit Logging",
        desc: "تفعيل/تعطيل تتبع الأنشطة",
        steps: [
          "كل عمليات CRUD تُسجل تلقائياً في جدول activities",
          "الملف: api/middleware.ts يحتوي على unified user shape",
          "للاستعلام: SELECT * FROM activities ORDER BY created_at DESC",
          "الفلتر حسب المستخدم: WHERE user_id = ?",
        ],
      },
    ],
  },
  {
    id: "system",
    title: "إعدادات النظام",
    icon: Settings,
    color: "#8B5CF6",
    items: [
      {
        label: "بيانات الشركة",
        desc: "تعديل اسم الشركة والعنوان والشعار",
        steps: [
          "اذهب إلى \"إعدادات النظام\"",
          "قسم \"بيانات الشركة\": الاسم، العنوان، الهاتف، البريد",
          "رقم الضريبي (Tax Number) للفواتير",
          "الشعار (Logo): ارفع صورة PNG/JPG",
        ],
      },
      {
        label: "ساعات العمل",
        desc: "تعديل بداية ونهاية الدوام والأوفرتايم",
        steps: [
          "working_hours_start: بداية الدوام (افتراضي: 07:00)",
          "working_hours_end: نهاية الدوام (افتراضي: 17:00)",
          "overtime_rate: معامل الأوفرتايم (افتراضي: 1.5)",
          "max_overtime_daily: الحد الأقصى (افتراضي: 4 ساعات)",
        ],
      },
      {
        label: "إشعارات WhatsApp",
        desc: "تفعيل الإشعارات عبر WhatsApp Business API",
        steps: [
          "اذهب إلى \"إشعارات الواتساب\"",
          "أدخل API Key من WhatsApp Business",
          "اختصار الرقم من رسالة تجريبية",
          "فعل القواعد المطلوبة (حضور، غياب، إجازات)",
        ],
      },
    ],
  },
  {
    id: "monitoring",
    title: "المراقبة والتقارير",
    icon: Activity,
    color: "#E85D4A",
    items: [
      {
        label: "اختبار شامل (QA Testing)",
        desc: "فحص جميع الـ Routers والـ Endpoints",
        steps: [
          "اذهب إلى \"اختبار الجودة\" من القائمة",
          "اضغط \"بدء الاختبار\" — يختبر 27 endpoint",
          "يُظهر: نسبة النجاح، سرعة الاستجابة، عدد السجلات",
          "أي فشل يظهر بالتفصيل مع رسالة الخطأ",
        ],
      },
      {
        label: "تقارير الأداء",
        desc: "متابعة أداء النظام والخطوط",
        steps: [
          "\"التقارير\" → \"تقارير الإنتاج\": كفاءة كل خط",
          "\"تقارير\" → \"تقارير الجودة\": نسبة العيوب",
          "\"تقارير\" → \"تقارير الحضور\": الغياب والتأخر",
          "\"تقارير\" → \"التحليلات\": رؤى AI",
        ],
      },
      {
        label: "سجل الأنشطة (Audit Log)",
        desc: "تتبع كل عمليات المستخدمين",
        steps: [
          "\"سجل المراجعة\" يعرض كل العمليات مع IP والوقت",
          "فلتر حسب المستخدم أو نوع العملية أو التاريخ",
          "تصدير كـ PDF أو Excel",
          "يحتفظ بالسجل لمدة سنة تلقائياً",
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "حل المشاكل",
    icon: AlertCircle,
    color: "#EF4444",
    items: [
      {
        label: "الصفحة سوداء / تطبيق لا يعمل",
        desc: "Error Boundary — ما هو وكيف يعمل",
        steps: [
          "المكون: src/components/ErrorBoundary.tsx يحمي التطبيق",
          "عند أي crash: يظهر واجهة احترافية بدلاً من شاشة سوداء",
          "المستخدم يضغط \"إعادة المحاولة\" أو \"الرئيسية\"",
          "الأخطاء تُطبع في Console للمسؤول",
        ],
      },
      {
        label: "خطأ في اتصال الباك اند",
        desc: "tRPC connection failed",
        steps: [
          "تحقق من حالة السيرفر: API → status في صفحة الاختبار",
          "تحقق من JWT token: sessionStorage.hr_auth_token",
          "اضغط F12 → Network → تأكد من /api/trpc/* requests",
          "إذا كان 401: أعد تسجيل الدخول (token منتهي)",
        ],
      },
      {
        label: "بيانات لا تظهر في الصفحة",
        desc: "Debugging data flow",
        steps: [
          "افحص seed data: هل الجدول مملوء؟ (صفحة الاختبار)",
          "افحص tRPC query: هل البيانات تصل من API؟",
          "افحص useApiData: هل Hook يستدعي tRPC بشكل صحيح؟",
          "Console → React DevTools → Components",
        ],
      },
      {
        label: "بطء في الأداء",
        desc: "Performance optimization",
        steps: [
          "صفحة الاختبار تُظهر زمن كل endpoint",
          "إذا كان >500ms: فعل pagination (LIMIT) في query",
          "أضف indexing على الأعمدة المستخدمة في WHERE",
          "استخدم TiDB Cloud analytics لـ slow queries",
        ],
      },
    ],
  },
];

export default function AdminGuide() {
  const [activeTab, setActiveTab] = useState("users");
  const section = adminSections.find((s) => s.id === activeTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Shield size={32} className="text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">دليل المسؤول</h2>
        <p className="text-sm text-white/40">إدارة النظام والأمان والصيانة</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1" style={{ background: "var(--bg-input)" }}>
          {adminSections.map((s) => {
            const Icon = s.icon;
            return (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="flex items-center gap-1.5 px-3 py-2 text-xs data-[state=active]:text-white"
                style={{ color: "var(--text-muted)" }}
              >
                <Icon size={13} style={{ color: activeTab === s.id ? s.color : undefined }} />
                {s.title}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {adminSections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            {section.items.map((item, idx) => (
              <Card key={idx} className="theme-card" style={{ borderColor: "var(--border-color)" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <div className="w-2 h-2 rounded-full" style={{ background: section.color }} />
                    {item.label}
                    <Badge variant="outline" className="text-[9px] h-4">{item.desc}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-1.5">
                    {item.steps.map((step, sIdx) => (
                      <li key={sIdx} className="text-xs text-white/60 flex gap-2">
                        <span className="text-white/20 flex-shrink-0 w-5 text-right">{sIdx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {item.warning && (
                    <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <AlertCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-red-400/70">{item.warning}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
