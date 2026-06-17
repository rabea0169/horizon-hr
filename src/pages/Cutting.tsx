import { useState } from "react";
import { useCuttingOrders, useProductionModels, useEmployees, type CuttingOrder } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Scissors, CheckCircle2 } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "معلق", color: "bg-yellow-500/15 text-yellow-400" },
  in_progress: { label: "جاري", color: "bg-blue-500/15 text-blue-400" },
  completed: { label: "مكتمل", color: "bg-emerald-500/15 text-emerald-400" },
};

const defaultStages = [
  { name: "فرد القماش" },
  { name: "التخطيط" },
  { name: "القص" },
  { name: "الفرز" },
  { name: "التجميع" },
];

export default function Cutting() {
  const { data: cuttingOrders, create, update, remove, toggleStage } = useCuttingOrders();
  const { data: models } = useProductionModels();
  const { data: employees } = useEmployees();

  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<CuttingOrder | null>(null);
  const [form, setForm] = useState({
    orderCode: "", modelId: "", layers: "", totalPieces: "", date: "", cutterId: "", notes: "",
  });

  const reset = () => {
    setForm({ orderCode: "", modelId: "", layers: "", totalPieces: "", date: "", cutterId: "", notes: "" });
    setEditing(null);
  };

  const handleSave = () => {
    if (!form.orderCode.trim()) return;
    const model = models.find((m) => String(m.id) === form.modelId);
    const cutter = employees.find((e) => String(e.id) === form.cutterId);
    const stages = defaultStages.map((s, i) => ({ id: Date.now() + i, name: s.name, completed: false }));

    if (editing) {
      update(editing.id, {
        orderCode: form.orderCode,
        modelId: model?.id,
        modelName: model?.name,
        layers: Number(form.layers) || 0,
        totalPieces: Number(form.totalPieces) || 0,
        goodPieces: Number(form.totalPieces) || 0,
        defectedPieces: 0,
        date: form.date,
        cutterId: cutter?.id,
        cutterName: cutter?.fullName,
        notes: form.notes,
      });
    } else {
      create({
        orderCode: form.orderCode,
        modelId: model?.id,
        modelName: model?.name,
        layers: Number(form.layers) || 0,
        totalPieces: Number(form.totalPieces) || 0,
        goodPieces: Number(form.totalPieces) || 0,
        defectedPieces: 0,
        date: form.date,
        status: "pending",
        stages,
        cutterId: cutter?.id,
        cutterName: cutter?.fullName,
        notes: form.notes,
      });
    }
    setDialog(false); reset();
  };

  const cutters = employees.filter((e) => e.departmentId === 1 || e.jobTitle.includes("قص"));
  const filtered = cuttingOrders.filter((o) => o.orderCode.includes(search) || (o.modelName && o.modelName.includes(search)));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>موديول القص</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة أوامر قص الأقمشة وتتبع مراحلها</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}>
          <Plus size={16} /> أمر قص جديد
        </Button>
      </div>

      <Input placeholder="بحث بكود الأمر أو الموديل..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((order) => {
          const s = statusConfig[order.status];
          return (
            <Card key={order.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors size={16} style={{ color: "var(--accent-color)" }} />
                    <CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>{order.orderCode}</CardTitle>
                  </div>
                  <Badge variant="outline" className={s.color}>{s.label}</Badge>
                </div>
                {order.modelName && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{order.modelName}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>طبقات</p>
                    <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{order.layers}</p>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي</p>
                    <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{order.totalPieces}</p>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>سليم</p>
                    <p className="text-lg font-bold text-green-400">{order.goodPieces}</p>
                  </div>
                </div>

                {/* Stages */}
                <div className="space-y-1">
                  {order.stages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-2 p-1.5 rounded" style={{ background: stage.completed ? "rgba(16,185,129,0.1)" : "var(--bg-primary)" }}>
                      <Checkbox checked={stage.completed} onCheckedChange={() => toggleStage(order.id, stage.id)} className="data-[state=checked]:bg-emerald-500" />
                      <span className={`text-xs flex-1 ${stage.completed ? "line-through" : ""}`} style={{ color: stage.completed ? "var(--text-muted)" : "var(--text-primary)" }}>{stage.name}</span>
                      {stage.completed && <CheckCircle2 size={12} className="text-emerald-400" />}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{order.date}</span>
                  {order.cutterName && <span>القصاص: {order.cutterName}</span>}
                </div>

                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(order); setForm({ orderCode: order.orderCode, modelId: order.modelId ? String(order.modelId) : "", layers: String(order.layers), totalPieces: String(order.totalPieces), date: order.date, cutterId: order.cutterId ? String(order.cutterId) : "", notes: order.notes || "" }); setDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف أمر القص؟")) remove(order.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12" style={{ color: "var(--text-muted)" }}>
            <Scissors size={32} className="mx-auto mb-3 opacity-50" /><p>لا توجد أوامر قص</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل أمر قص" : "أمر قص جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>كود الأمر</Label><Input value={form.orderCode} onChange={(e) => setForm({ ...form, orderCode: e.target.value })} className="text-right" placeholder="مثال: CUT-001" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الموديل</Label>
                <Select value={form.modelId} onValueChange={(v) => setForm({ ...form, modelId: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    {models.map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>عدد الطبقات</Label><Input type="number" value={form.layers} onChange={(e) => setForm({ ...form, layers: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>عدد القطع</Label><Input type="number" value={form.totalPieces} onChange={(e) => setForm({ ...form, totalPieces: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>القصاص</Label>
                <Select value={form.cutterId} onValueChange={(v) => setForm({ ...form, cutterId: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    {cutters.map((e) => <SelectItem key={e.id} value={String(e.id)} className="text-right">{e.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
