import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search } from "lucide-react";

const STORAGE_KEY = "hr_audit_log";

const actionLabels: Record<string, string> = { INSERT: "إضافة", UPDATE: "تعديل", DELETE: "حذف", LOGIN: "تسجيل دخول", LOGOUT: "تسجيل خروج", EXPORT: "تصدير", PRINT: "طباعة" };
const actionColors: Record<string, string> = {
  INSERT: "bg-emerald-500/15 text-emerald-400",
  UPDATE: "bg-blue-500/15 text-blue-400",
  DELETE: "bg-red-500/15 text-red-400",
  LOGIN: "bg-purple-500/15 text-purple-400",
  LOGOUT: "bg-gray-500/15 text-gray-400",
  EXPORT: "bg-cyan-500/15 text-cyan-400",
  PRINT: "bg-amber-500/15 text-amber-400",
};

function loadData(): any[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export default function AuditLog() {
  const [data] = useState<any[]>(loadData().length > 0 ? loadData() : getDefaultLogs());
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const filtered = data.filter(d => {
    const matchSearch = !search || d.description?.includes(search) || d.userName?.includes(search) || d.entityType?.includes(search);
    const matchAction = actionFilter === "all" || d.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">سجل العمليات (Audit Log)</h2></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {["INSERT", "UPDATE", "DELETE", "LOGIN", "EXPORT"].map(a => (
          <Card key={a} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-3"><p className="text-xl font-bold">{data.filter(d => d.action === a).length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{actionLabels[a]}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md"><Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} /><Input placeholder="بحث باسم المستخدم أو نوع العملية..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue placeholder="الإجراء" /></SelectTrigger>
          <SelectContent><SelectItem value="all">الكل</SelectItem>{Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        {filtered.map((log, i) => (
          <Card key={i} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-3 flex items-center gap-3">
              <Shield size={16} style={{ color: "var(--accent-color)" }} />
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-medium text-sm">{log.userName || "النظام"}</span><Badge variant="outline" className={actionColors[log.action]}>{actionLabels[log.action]}</Badge></div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{log.description} | {log.entityType} #{log.entityId} | {log.createdAt}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><Shield size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد عمليات مسجلة</p></div>}
    </div>
  );
}

function getDefaultLogs() {
  const logs = [
    { action: "LOGIN", entityType: "users", entityId: 1, description: "تسجيل دخول مدير النظام", userName: "مدير النظام", createdAt: "2026-06-12 08:00:00" },
    { action: "INSERT", entityType: "sales_orders", entityId: 1, description: "إنشاء أمر بيع جديد SO-0001", userName: "الميرتشندايزر", createdAt: "2026-06-12 09:15:00" },
    { action: "INSERT", entityType: "employees", entityId: 5, description: "إضافة عامل جديد: أحمد محمد", userName: "HR Officer", createdAt: "2026-06-12 10:30:00" },
    { action: "UPDATE", entityType: "production_orders", entityId: 3, description: "تحديث حالة أمر الإنتاج PO-0003 إلى قيد التنفيذ", userName: "مدير الإنتاج", createdAt: "2026-06-12 11:00:00" },
    { action: "INSERT", entityType: "qc_records", entityId: 2, description: "إضافة فحص جودة — Final Inspection", userName: "مشرف الجودة", createdAt: "2026-06-12 13:45:00" },
    { action: "DELETE", entityType: "inventory_items", entityId: 4, description: "حذف صنف مخزون FAB-004", userName: "أمين المخزن", createdAt: "2026-06-12 14:20:00" },
    { action: "UPDATE", entityType: "payroll_records", entityId: 7, description: "معالجة كشف راتب يونيو 2026", userName: "محاسب الرواتب", createdAt: "2026-06-12 15:00:00" },
    { action: "EXPORT", entityType: "reports", entityId: 1, description: "تصدير تقرير الإنتاج اليومي", userName: "مدير النظام", createdAt: "2026-06-12 16:30:00" },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  return logs;
}
