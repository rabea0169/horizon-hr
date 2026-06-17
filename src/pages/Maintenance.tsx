import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";

const typeColors: Record<string, string> = { preventive: "bg-blue-500/15 text-blue-400", corrective: "bg-red-500/15 text-red-400", overhaul: "bg-purple-500/15 text-purple-400" };
const typeLabels: Record<string, string> = { preventive: "وقائية", corrective: "إصلاحية", overhaul: "عمرة" };
const statusColors: Record<string, string> = { scheduled: "bg-yellow-500/15 text-yellow-400", in_progress: "bg-blue-500/15 text-blue-400", completed: "bg-emerald-500/15 text-emerald-400", overdue: "bg-red-500/15 text-red-400", cancelled: "bg-gray-500/15 text-gray-400" };
const statusLabels: Record<string, string> = { scheduled: "مجدولة", in_progress: "جارية", completed: "مكتملة", overdue: "متأخرة", cancelled: "ملغاة" };

const STORAGE_KEY = "hr_maintenance";
function loadData(): any[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveData(data: any[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

export default function Maintenance() {
  const [data, setData] = useState<any[]>(loadData);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState({ machineName: "", maintenanceType: "preventive" as string, title: "", description: "", scheduledDate: new Date().toISOString().split("T")[0], cost: "", technicianName: "", downtime: "", frequency: "monthly" as string, status: "scheduled", nextDueDate: "", notes: "" });

  const persist = (newData: any[]) => { setData(newData); saveData(newData); };
  const create = () => { persist([{ id: Date.now(), ...form, cost: Number(form.cost) || 0, downtime: Number(form.downtime) || 0 }, ...data]); setDialog(false); reset(); };
  const update = () => { if (!editing) return; persist(data.map(d => d.id === editing.id ? { ...d, ...form, cost: Number(form.cost) || 0, downtime: Number(form.downtime) || 0 } : d)); setDialog(false); reset(); };
  const remove = (id: number) => { if (!confirm("حذف عملية الصيانة؟")) return; persist(data.filter(d => d.id !== id)); };
  const reset = () => { setEditing(null); setForm({ machineName: "", maintenanceType: "preventive", title: "", description: "", scheduledDate: new Date().toISOString().split("T")[0], cost: "", technicianName: "", downtime: "", frequency: "monthly", status: "scheduled", nextDueDate: "", notes: "" }); };

  const filtered = data.filter(d => {
    const matchSearch = !search || d.title?.includes(search) || d.machineName?.includes(search);
    const matchType = typeFilter === "all" || d.maintenanceType === typeFilter;
    return matchSearch && matchType;
  });
  const overdueCount = data.filter(d => d.status === "overdue").length;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">الصيانة والمعدات</h2><Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> صيانة جديدة</Button></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4 flex items-center gap-3"><Wrench size={20} className="text-blue-400" /><div><p className="text-2xl font-bold">{data.length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الصيانات</p></div></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4 flex items-center gap-3"><AlertTriangle size={20} className="text-red-400" /><div><p className="text-2xl font-bold text-red-400">{overdueCount}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>متأخرة</p></div></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400" /><div><p className="text-2xl font-bold">{data.filter(d => d.status === "completed").length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>مكتملة</p></div></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.reduce((s, d) => s + (Number(d.cost) || 0), 0).toLocaleString()} ج.م</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>تكلفة الصيانة</p></CardContent></Card>
      </div>
      <div className="flex gap-3">
        <Input placeholder="بحث باسم الماكينة أو العنوان..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-32" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="preventive">وقائية</SelectItem><SelectItem value="corrective">إصلاحية</SelectItem><SelectItem value="overhaul">عمرة</SelectItem></SelectContent></Select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(m => (
          <Card key={m.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Wrench size={16} style={{ color: "var(--accent-color)" }} /><span className="font-semibold text-sm">{m.title}</span></div>
                <div className="flex gap-1"><Badge variant="outline" className={typeColors[m.maintenanceType]}>{typeLabels[m.maintenanceType]}</Badge><Badge variant="outline" className={statusColors[m.status]}>{statusLabels[m.status]}</Badge></div>
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}><span style={{ color: "var(--text-muted)" }}>الماكينة:</span> {m.machineName}</div>
              <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}><span>مجدولة: {m.scheduledDate}</span>{m.technicianName && <span>الفني: {m.technicianName}</span>}{m.downtime && <span>توقف: {m.downtime} ساعة</span>}</div>
              <div className="flex items-center justify-between"><div className="text-sm font-bold">{Number(m.cost).toLocaleString()} ج.م</div><div className="flex gap-1"><Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(m); setForm({ ...m }); setDialog(true); }}><Pencil size={14} /></Button><Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => remove(m.id)}><Trash2 size={14} /></Button></div></div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><Wrench size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد عمليات صيانة</p></div>}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
          <DialogHeader><DialogTitle className="text-right">{editing ? "تعديل صيانة" : "صيانة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-right" dir="rtl">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>الماكينة</Label><Input value={form.machineName} onChange={e => setForm({ ...form, machineName: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>نوع الصيانة</Label><Select value={form.maintenanceType} onValueChange={v => setForm({ ...form, maintenanceType: v })}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="preventive">وقائية</SelectItem><SelectItem value="corrective">إصلاحية</SelectItem><SelectItem value="overhaul">عمرة</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label>العنوان</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label>الوصف</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>تاريخ مجدول</Label><Input type="date" value={form.scheduledDate} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>التكرار</Label><Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">يومي</SelectItem><SelectItem value="weekly">أسبوعي</SelectItem><SelectItem value="monthly">شهري</SelectItem><SelectItem value="quarterly">ربع سنوي</SelectItem><SelectItem value="semi_annual">نصف سنوي</SelectItem><SelectItem value="annual">سنوي</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>التكلفة</Label><Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>الفني</Label><Input value={form.technicianName} onChange={e => setForm({ ...form, technicianName: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>توقف (ساعة)</Label><Input type="number" value={form.downtime} onChange={e => setForm({ ...form, downtime: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={editing ? update : create} className="text-white" style={{ background: "var(--accent-color)" }}>{editing ? "تحديث" : "حفظ"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
