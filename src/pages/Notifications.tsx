import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Package, Clock, Wrench, UserX, ShieldAlert, CheckCircle, Trash2 } from "lucide-react";

const STORAGE_KEY = "hr_notifications";

const DEFAULT_NOTIFICATIONS = [
  { id: 1, type: "late_so", title: "أمر بيع متأخر", message: "SO-0001 — ABC Trading — كان يجب التسليم 2026-06-10", severity: "critical", read: false, createdAt: "2026-06-12 08:00", module: "sales" },
  { id: 2, type: "low_stock", title: "مخزون منخفض", message: "Cotton Poplin 240gsm — الرصيد: 120 رول — الحد الأدنى: 200", severity: "warning", read: false, createdAt: "2026-06-12 07:30", module: "inventory" },
  { id: 3, type: "maintenance_due", title: "صيانة وقائية مستحقة", message: "ماكينة Overlock #3 — صيانة شهرية مستحقة اليوم", severity: "warning", read: false, createdAt: "2026-06-12 07:00", module: "maintenance" },
  { id: 4, type: "absence", title: "غياب متكرر", message: "أحمد محمود (EMP-008) — 4 أيام غياب متتالية", severity: "info", read: true, createdAt: "2026-06-11 16:00", module: "hr" },
  { id: 5, type: "aql_fail", title: "فحص AQL فاشل", message: "Final Inspection — SO-0003 — عيوب: 8 — حد القبول: 5", severity: "critical", read: false, createdAt: "2026-06-11 14:00", module: "quality" },
  { id: 6, type: "pending_po", title: "أمر شراء معلق", message: "PO-0001 — Al-Amal Textile — لم يتم الاستلام بعد (5 أيام)", severity: "warning", read: true, createdAt: "2026-06-11 10:00", module: "inventory" },
  { id: 7, type: "overtime", title: "تجاوز ساعات إضافية", message: "3 عمال تجاوزوا 40 ساعة إضافية هذا الشهر", severity: "info", read: true, createdAt: "2026-06-10 18:00", module: "payroll" },
];

function load(): any[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function save(d: any[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

const severityConfig: Record<string, { color: string; bg: string; icon: any }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertTriangle },
  warning: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: Clock },
  info: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Bell },
};

const typeIcons: Record<string, any> = {
  late_so: Package,
  low_stock: Package,
  maintenance_due: Wrench,
  absence: UserX,
  aql_fail: ShieldAlert,
  pending_po: Package,
  overtime: Clock,
};

export default function Notifications() {
  const [data, setData] = useState<any[]>(load().length > 0 ? load() : DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const persist = (d: any[]) => { setData(d); save(d); };

  const markRead = (id: number) => persist(data.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => persist(data.map(n => ({ ...n, read: true })));
  const remove = (id: number) => persist(data.filter(n => n.id !== id));
  const clearAll = () => { if (confirm("حذف كل الإشعارات؟")) persist([]); };

  const filtered = filter === "all" ? data : filter === "unread" ? data.filter(n => !n.read) : data.filter(n => n.severity === filter);
  const unreadCount = data.filter(n => !n.read).length;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: "var(--accent-color)" }} />
          <h2 className="text-xl font-bold">التنبيهات والإشعارات</h2>
          {unreadCount > 0 && <Badge variant="outline" className="bg-red-500/15 text-red-400">{unreadCount} جديد</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={markAllRead}><CheckCircle size={14} /> تعيين الكل مقروء</Button>
          <Button size="sm" variant="ghost" className="text-red-400" onClick={clearAll}><Trash2 size={14} /> حذف الكل</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: `الكل (${data.length})` },
          { key: "unread", label: `غير مقروء (${unreadCount})` },
          { key: "critical", label: "حرج" },
          { key: "warning", label: "تنبيه" },
          { key: "info", label: "معلومة" },
        ].map(f => (
          <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)} style={filter === f.key ? { background: "var(--accent-color)" } : {}}>{f.label}</Button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {filtered.map(n => {
          const cfg = severityConfig[n.severity] || severityConfig.info;
          const Icon = typeIcons[n.type] || Bell;
          return (
            <Card key={n.id} className={`transition-all ${!n.read ? cfg.bg : ""}`} style={{ background: !n.read ? undefined : "var(--bg-card)", borderColor: "var(--border-color)", opacity: n.read ? 0.7 : 1 }}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="mt-0.5"><Icon size={16} className={cfg.color} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!n.read ? cfg.color : ""}`}>{n.title}</span>
                    {!n.read && <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-color)" }} />}
                    <Badge variant="outline" className={cfg.bg + " " + cfg.color}>{n.severity === "critical" ? "حرج" : n.severity === "warning" ? "تنبيه" : "معلومة"}</Badge>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{n.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{n.createdAt}</span>
                    <div className="flex gap-1">
                      {!n.read && <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => markRead(n.id)}>تعيين مقروء</Button>}
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => remove(n.id)}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><Bell size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد إشعارات</p></div>}
    </div>
  );
}
