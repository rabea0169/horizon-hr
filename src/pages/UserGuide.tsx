import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search, BookOpen, Play, MousePointer,
  AlertCircle, ChevronDown, ChevronUp,
  Clock, DollarSign, FileText, HelpCircle
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  content: Array<{
    subtitle: string;
    steps: string[];
    tip?: string;
  }>;
}

const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "بدء الاستخدام",
    icon: Play,
    color: "#10B981",
    content: [
      {
        subtitle: "تسجيل الدخول",
        steps: [
          "افتح المتصفح وأدخل عنوان النظام",
          "اختر دورك من الأدوار المتاحة (مدير، مشرف، محاسب، عامل)",
          "اضغط على \"تسجيل الدخول\" — البيانات مسبقة التعبئة للتجربة",
          "ستنتقل تلقائياً إلى لوحة التحكم الرئيسية",
        ],
        tip: "يمكنك تغيير كلمة المرور من صفحة الحساب الشخصي",
      },
      {
        subtitle: "التنقل في الواجهة",
        steps: [
          "القائمة الجانبية على اليمين تحتوي على كل الموديولات",
          "استخدم حقل البحث في أعلى القائمة للوصول السريع (اختصار: Alt+K)",
          "اختصارات سريعة: Alt+1 إلى Alt+9 للموديولات المثبتة",
          "اضغط على السهم بجوار كل فئة لإظهار/إخفاء الموديولات",
        ],
      },
    ],
  },
  {
    id: "attendance",
    title: "تسجيل الحضور والانصراف",
    icon: Clock,
    color: "#3B82F6",
    content: [
      {
        subtitle: "تسجيل الحضور",
        steps: [
          "اذهب إلى موديول \"الحضور والانصراف\"",
          "اضغط على \"تسجيل حضور جديد\"",
          "اختر الموظف من القائمة أو امسح QR code",
          "يتم تسجيل وقت الدخول تلقائياً",
        ],
        tip: "الحضور قبل 7:00 ص يُسجل كـ \"حاضر\"، بعدها \"متأخر\"",
      },
      {
        subtitle: "تسجيل الانصراف",
        steps: [
          "في نفس اليوم، اضغط \"تسجيل خروج\"",
          "يتم حساب ساعات العمل والأوفرتايم تلقائياً",
          "الخروج بعد 17:00 يُحسب أوفرتايم",
        ],
      },
      {
        subtitle: "طلب إجازة",
        steps: [
          "اذهب إلى \"الإجازات\" واضغط \"إجازة جديدة\"",
          "اختر نوع الإجازة (سنوية، مرضية، طارئة)",
          "حدد تاريخ البداية والنهاية",
          "أضف السبب ثم أرسل للموافقة",
        ],
      },
    ],
  },
  {
    id: "payroll",
    title: "الرواتب والمستحقات",
    icon: DollarSign,
    color: "#F59E0B",
    content: [
      {
        subtitle: "عرض الراتب",
        steps: [
          "اذهب إلى \"الرواتب\" من القائمة الجانبية",
          "اختر الشهر والسنة من الفلاتر",
          "ستظهر تفاصيل: الراتب الأساسي + الأوفرتايم + المكافآت - الاستقطاعات",
        ],
      },
      {
        subtitle: "طلب سلفة",
        steps: [
          "من \"السلف\" اضغط \"طلب سلفة جديدة\"",
          "أدخل المبلغ والسبب",
          "الحد الأقصى للسلفة = 50% من الراتب الأساسي",
          "تُخصم السلفة على أقساط من الراتب الشهري",
        ],
        tip: "السلف تُحتسب تلقائياً في كشف الراتب الشهري",
      },
    ],
  },
  {
    id: "production",
    title: "متابعة الإنتاج",
    icon: FileText,
    color: "#E85D4A",
    content: [
      {
        subtitle: "لوحة الإنتاج المباشر",
        steps: [
          "اذهب إلى \"الإنتاج المباشر\" من القائمة",
          "سترى جميع خطوط الإنتاج مع كفاءتها الحية",
          "الألوان: 🟢 يعمل | 🟡 صيانة | 🔴 متوقف",
          "يتم التحديث كل 5 ثوانٍ تلقائياً",
        ],
      },
      {
        subtitle: "تسجيل إنتاج يومي",
        steps: [
          "اذهب إلى \"الإنتاج اليومي\"",
          "اختر خط الإنتاج وأمر الإنتاج",
          "أدخل الكمية المُنتجة والمعيبة",
          "يتم حساب الكفاءة تلقائياً",
        ],
      },
      {
        subtitle: "تتبع الباندلز",
        steps: [
          "استخدم \"تتبع الباندلز\" لمسح QR code",
          "كل bundle له QR code فريد",
          "المسح يُحدث المرحلة تلقائياً (تقطيع → خياطة → كي → تعبئة)",
        ],
        tip: "يمكنك توليد QR codes جديدة من موديول \"توليد باركود\"",
      },
    ],
  },
  {
    id: "barcode",
    title: "الباركود وQR Codes",
    icon: MousePointer,
    color: "#8B5CF6",
    content: [
      {
        subtitle: "توليد ملصقات",
        steps: [
          "اذهب إلى \"توليد باركود\"",
          "اختر نوع الكود: QR أو Barcode",
          "أدخل بيانات الـ Bundle أو اختر من القائمة",
          "اضغط \"توليد\" ثم \"طباعة\" للطباعة المباشرة",
        ],
      },
      {
        subtitle: "مسح الباركود",
        steps: [
          "اذهب إلى \"ماسح الباركود\"",
          "اضغط \"تشغيل الكاميرا\" ووجه الكاميرا نحو QR code",
          "أو أدخل الكود يدوياً في حقل الإدخال",
          "يتم البحث عن الـ Bundle وتحديث حالته",
        ],
        tip: "تدعم الكاميرا BarcodeDetector API في Chrome وEdge",
      },
    ],
  },
  {
    id: "help",
    title: "المساعدة والدعم",
    icon: HelpCircle,
    color: "#607D8B",
    content: [
      {
        subtitle: "اختصارات الكيبورد",
        steps: [
          "Alt + K: تركيز حقل البحث",
          "Alt + 1..9: فتح موديول من الاختصارات السريعة",
          "Escape: إغلاق القائمة/البحث",
          "Ctrl + P: طباعة الصفحة الحالية",
        ],
      },
      {
        subtitle: "تخصيص القائمة",
        steps: [
          "اشرك (hover) على أي موديول في القائمة",
          "اضغط على أيقونة 📌 لتثبيته في الاختصارات السريعة",
          "الموديولات المثبتة تظهر أعلى القائمة دائماً",
          "التفضيلات تُحفظ تلقائياً",
        ],
      },
      {
        subtitle: "الإبلاغ عن مشكلة",
        steps: [
          "اذهب إلى \"اختبار الجودة\" من القائمة",
          "اضغط \"بدء الاختبار\" لفحص جميع الأنظمة",
          "انسخ نتائج الاختبار وأرسلها للدعم الفني",
          "أو تواصل على: support@horizon-hr.com",
        ],
      },
    ],
  },
];

export default function UserGuide() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["getting-started"]));

  const toggleSection = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredSections = search
    ? guideSections.filter((s) =>
        s.title.includes(search) ||
        s.content.some((c) => c.subtitle.includes(search) || c.steps.some((step) => step.includes(search)))
      )
    : guideSections;

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <BookOpen size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">دليل المستخدم</h2>
        <p className="text-sm text-white/40">كل ما تحتاج لمعرفته لاستخدام Horizon HR بفعالية</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="البحث في الدليل..."
          className="theme-input text-right pr-10"
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filteredSections.map((section) => {
          const isOpen = expanded.has(section.id);
          const Icon = section.icon;
          return (
            <Card key={section.id} className="theme-card overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: section.color + "20" }}>
                    <Icon size={18} style={{ color: section.color }} />
                  </div>
                  <span className="font-semibold text-white">{section.title}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
              </button>

              {isOpen && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  {section.content.map((item, idx) => (
                    <div key={idx} className="pr-4 border-r-2" style={{ borderColor: section.color + "30" }}>
                      <h4 className="text-sm font-medium text-white/80 mb-2">{item.subtitle}</h4>
                      <ol className="space-y-1.5">
                        {item.steps.map((step, sIdx) => (
                          <li key={sIdx} className="text-xs text-white/50 flex gap-2">
                            <span className="text-white/20 flex-shrink-0">{sIdx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      {item.tip && (
                        <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <AlertCircle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-amber-400/70">{item.tip}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="text-center py-12 text-white/30">
            <Search size={32} className="mx-auto mb-3" />
            <p className="text-sm">لا توجد نتائج للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
