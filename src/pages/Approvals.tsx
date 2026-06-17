import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, DollarSign, ShoppingCart, UserCheck } from "lucide-react";

const STORAGE_KEY = "hr_approvals";

const DEFAULT_APPROVALS = [
  { id: 1, type: "po", title: "أمر شراء #PO-0008", requester: "ممدوح السيد", amount: 75000, description: "شراء 5000 رول قطن مصري 240gsm — مورد: النيل للغزل", date: "2026-06-12", status: "pending", approvers: ["مدير النظام"], currentLevel: 1 },
  { id: 2, type: "advance", title: "سلفية #AD-0045", requester: "أحمد محمود (EMP-008)", amount: 2000, description: "سلفية طارئة — عائلي", date: "2026-06-11", status: "pending", approvers: ["مشرف", "محاسب"], currentLevel: 0 },
  { id: 3, type: "leave", title: "إجازة #LV-0012", requester: "فاطمة عمر (EMP-003)", amount: 0, description: "إجازة سنوية 5 أيام — 15-19 يونيو", date: "2026-06-10", status: "approved", approvers: ["مشرف"], currentLevel: 1 },
  { id: 4, type: "maintenance", title: "صيانة عاجلة #MN-0003", requester: "مهندس الصيانة", amount: 15000, description: "تغيير موتور ماكينة Single Needle #5 — عطل مفاجئ", date: "2026-06-11", status: "pending", approvers: ["مدير إنتاج", "مدير النظام"], currentLevel: 0 },
  { id: 5, type: "po", title: "أمر شراء #PO-0007", requester: "ممدوح السيد", amount: 35000, description: "خيوط بوليستر 40/2 — 1000 بكرة", date: "2026-06-10", status: "approved", approvers: ["مدير النظام"], currentLevel: 1 },
  { id: 6, type: "advance", title: "سلفية #AD-0044", requester: "محمد علي (EMP-012)", amount: 500, description: "سلفية — دفعة مدرسة", date: "2026-06-09", status: "rejected", approvers: ["مشرف", "محاسب"], currentLevel: 2 },
];

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function save(d: any[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  po: { label: "أمر شراء", color: "bg-blue-500/15 text-blue-400", icon: ShoppingCart },
  advance: { label: "سلفية", color: "bg-yellow-500/15 text-yellow-400", icon: DollarSign },
  leave: { label: "إجازة", color: "bg-purple-500/15 text-purple-400", icon: UserCheck },
  maintenance: { label: "صيانة", color: "bg-red-500/15 text-red-400", icon: Clock },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "معلق", color: "bg-yellow-500/15 text-yellow-400" },
  approved: { label: "معتمد", color: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "مرفوض", color: "bg-red-500/15 text-red-400" },
};

export default function Approvals() {
  const [data, setData] = useState<any[]>(load().length > 0 ? load() : DEFAULT_APPROVALS);
  const [filter, setFilter] = useState("pending");

  const persist = (d: any[]) => { setData(d); save(d); };

  const approve = (id: number) => persist(data.map(a => {
    if (a.id === id) {
      const nextLevel = a.currentLevel + 1;
      if (nextLevel >= a.approvers.length) return { ...a, status: "approved", currentLevel: nextLevel };
      return { ...a, currentLevel: nextLevel };
    }
    return a;
  }));
  const reject = (id: number) => persist(data.map(a => a.id === id ? { ...a, status: "rejected", currentLevel: a.approvers.length } : a));

  const filtered = filter === "all" ? data : data.filter(a => a.status === filter);
  const pendingCount = data.filter(a => a.status === "pending").length;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">نظام الموافقات</h2>
          {pendingCount > 0 && <Badge variant="outline" className="bg-yellow-500/15 text-yellow-400">{pendingCount} معلق</Badge>}
        </div>
        <div className="flex gap-1">
          {["pending", "approved", "rejected", "all"].map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} style={filter === f ? { background: "var(--accent-color)" } : {}}>
              {f === "pending" ? "معلق" : f === "approved" ? "معتمد" : f === "rejected" ? "مرفوض" : "الكل"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(a => {
          const tc = typeConfig[a.type] || typeConfig.po;
          const sc = statusConfig[a.status] || statusConfig.pending;
          const Icon = tc.icon;
          const isPending = a.status === "pending";
          const progress = a.approvers.length > 0 ? ((a.currentLevel || 0) / a.approvers.length) * 100 : 0;

          return (
            <Card key={a.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={tc.color.split(" ")[1]} />
                    <span className="font-medium text-sm">{a.title}</span>
                    <Badge variant="outline" className={tc.color}>{tc.label}</Badge>
                    <Badge variant="outline" className={sc.color}>{sc.label}</Badge>
                  </div>
                  {a.amount > 0 && <span className="font-bold" style={{ color: "var(--accent-color)" }}>{a.amount.toLocaleString()} ج.م</span>}
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{a.requester} — {a.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>الموافقون: {a.approvers.join(" → ")}</span>
                  </div>
                </div>
                {isPending && (
                  <>
                    <div className="w-full bg-white/10 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, background: "var(--accent-color)" }} /></div>
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1 text-white bg-emerald-600 hover:bg-emerald-700" onClick={() => approve(a.id)}><CheckCircle size={12} /> موافقة ({a.approvers[a.currentLevel]})</Button>
                      <Button size="sm" variant="ghost" className="gap-1 text-red-400" onClick={() => reject(a.id)}><XCircle size={12} /> رفض</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><CheckCircle size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد طلبات</p></div>}
    </div>
  );
}
