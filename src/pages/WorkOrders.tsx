import { useState } from "react";
import { useWorkOrders, useProductionModels, useBOMRecords, type WorkOrder } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, ClipboardList, CheckCircle2 } from "lucide-react";

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "عاجل", color: "bg-red-500/15 text-red-400" },
  high: { label: "عالي", color: "bg-orange-500/15 text-orange-400" },
  normal: { label: "عادي", color: "bg-blue-500/15 text-blue-400" },
  low: { label: "منخفض", color: "bg-gray-500/15 text-gray-400" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "معلق", color: "bg-yellow-500/15 text-yellow-400" },
  in_progress: { label: "جاري", color: "bg-blue-500/15 text-blue-400" },
  completed: { label: "مكتمل", color: "bg-emerald-500/15 text-emerald-400" },
  on_hold: { label: "متوقف", color: "bg-gray-500/15 text-gray-400" },
};

export default function WorkOrders() {
  const { data: workOrders, create, update, remove, toggleStage } = useWorkOrders();
  const { data: models } = useProductionModels();
  const { data: boms } = useBOMRecords();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState({ orderCode: "", modelId: "", bomId: "", quantity: "", priority: "normal" as WorkOrder["priority"], startDate: "", notes: "" });

  const reset = () => { setForm({ orderCode: "", modelId: "", bomId: "", quantity: "", priority: "normal", startDate: "", notes: "" }); setEditing(null); };

  const handleSave = () => {
    if (!form.orderCode.trim() || !form.modelId) return;
    const model = models.find((m) => String(m.id) === form.modelId);
    const data = { orderCode: form.orderCode, modelId: model?.id, modelName: model?.name, bomId: form.bomId ? Number(form.bomId) : undefined, quantity: Number(form.quantity) || 0, priority: form.priority, startDate: form.startDate, notes: form.notes, status: "pending" as const };
    if (editing) update(editing.id, data);
    else create(data);
    setDialog(false); reset();
  };

  const filtered = workOrders.filter((o) => String(o.orderCode ?? "").includes(search) || String(o.modelName ?? "").includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>أوامر الشغل</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>أوامر إنتاج مفصلة مرتبطة بالـ BOM</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> أمر جديد</Button>
      </div>

      <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((o) => {
          const p = priorityConfig[o.priority];
          const s = statusConfig[o.status];
          return (
            <Card key={o.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><ClipboardList size={16} style={{ color: "var(--accent-color)" }} /><CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>{o.orderCode}</CardTitle></div>
                  <div className="flex gap-1"><Badge variant="outline" className={s.color}>{s.label}</Badge><Badge variant="outline" className={p.color}>{p.label}</Badge></div>
                </div>
                {o.modelName && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{o.modelName} — الكمية: {o.quantity}</p>}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  {o.stages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-2 p-1.5 rounded" style={{ background: stage.completed ? "rgba(16,185,129,0.1)" : "var(--bg-primary)" }}>
                      <Checkbox checked={stage.completed} onCheckedChange={() => toggleStage(o.id, stage.id)} className="data-[state=checked]:bg-emerald-500" />
                      <span className={`text-xs flex-1 ${stage.completed ? "line-through" : ""}`} style={{ color: stage.completed ? "var(--text-muted)" : "var(--text-primary)" }}>{stage.name}</span>
                      {stage.completed && <CheckCircle2 size={12} className="text-emerald-400" />}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>البداية: {o.startDate}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6" onClick={() => { setEditing(o); setForm({ orderCode: o.orderCode, modelId: o.modelId ? String(o.modelId) : "", bomId: o.bomId ? String(o.bomId) : "", quantity: String(o.quantity), priority: o.priority, startDate: o.startDate, notes: o.notes || "" }); setDialog(true); }}><Pencil size={12} style={{ color: "var(--text-muted)" }} /></Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6" onClick={() => { if (confirm("حذف؟")) remove(o.id); }}><Trash2 size={12} className="text-red-400" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center py-12" style={{ color: "var(--text-muted)" }}><ClipboardList size={32} className="mx-auto mb-3 opacity-50" /><p>لا توجد أوامر شغل</p></div>}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل" : "أمر شغل جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>كود الأمر</Label><Input value={form.orderCode} onChange={(e) => setForm({ ...form, orderCode: e.target.value })} className="text-right" placeholder="WO-001" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الموديل</Label>
              <Select value={form.modelId} onValueChange={(v) => setForm({ ...form, modelId: v })}>
                <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{models.map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>BOM</Label>
              <Select value={form.bomId} onValueChange={(v) => setForm({ ...form, bomId: v })}>
                <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر (اختياري)" /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{boms.map((b) => <SelectItem key={b.id} value={String(b.id)} className="text-right">{b.modelName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الكمية</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الأولوية</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as WorkOrder["priority"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    <SelectItem value="urgent" className="text-right">عاجل</SelectItem>
                    <SelectItem value="high" className="text-right">عالي</SelectItem>
                    <SelectItem value="normal" className="text-right">عادي</SelectItem>
                    <SelectItem value="low" className="text-right">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تاريخ البداية</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>ملاحظات</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleSave} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
