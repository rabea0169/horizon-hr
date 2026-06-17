import { useState, useMemo } from "react";
import { useCostRecords, useProductionModels, type CostRecord } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Calculator, TrendingUp, Package } from "lucide-react";

export default function CostCalculation() {
  const { data: costRecords, create, update, remove } = useCostRecords();
  const { data: models } = useProductionModels();

  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<CostRecord | null>(null);
  const [form, setForm] = useState({
    modelId: "", date: "", fabricCost: "", threadCost: "", accessoriesCost: "", packagingCost: "",
    cuttingLabor: "", sewingLabor: "", pressingLabor: "", packagingLabor: "",
    overheadCost: "", targetQuantity: "", notes: "",
  });

  const reset = () => {
    setForm({ modelId: "", date: "", fabricCost: "", threadCost: "", accessoriesCost: "", packagingCost: "", cuttingLabor: "", sewingLabor: "", pressingLabor: "", packagingLabor: "", overheadCost: "", targetQuantity: "", notes: "" });
    setEditing(null);
  };

  const handleSave = () => {
    if (!form.modelId || !form.date) return;
    const model = models.find((m) => String(m.id) === form.modelId);
    const data = {
      modelId: model?.id || 0,
      modelName: model?.name || "",
      date: form.date,
      fabricCost: form.fabricCost || "0",
      threadCost: form.threadCost || "0",
      accessoriesCost: form.accessoriesCost || "0",
      packagingCost: form.packagingCost || "0",
      cuttingLabor: form.cuttingLabor || "0",
      sewingLabor: form.sewingLabor || "0",
      pressingLabor: form.pressingLabor || "0",
      packagingLabor: form.packagingLabor || "0",
      overheadCost: form.overheadCost || "0",
      targetQuantity: Number(form.targetQuantity) || 0,
      notes: form.notes,
    };
    if (editing) update(editing.id, data);
    else create(data);
    setDialog(false); reset();
  };

  const filtered = costRecords.filter((r) => r.modelName.includes(search));

  // Summary stats
  const totalCosts = useMemo(() => filtered.reduce((sum, r) => sum + Number(r.totalCost), 0), [filtered]);
  const avgCost = filtered.length > 0 ? (totalCosts / filtered.length).toFixed(2) : "0";

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>حساب تكاليف الإنتاج</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>حساب تكلفة الموديل بالتفصيل (خامات + أجور + عاملات)</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}>
          <Plus size={16} /> تكلفة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)" + "20" }}>
              <Calculator size={20} style={{ color: "var(--accent-color)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{filtered.length}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>سجلات تكلفة</p>
            </div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)" + "20" }}>
              <TrendingUp size={20} style={{ color: "var(--accent-color)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{Number(avgCost).toLocaleString()}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>متوسط التكلفة</p>
            </div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)" + "20" }}>
              <Package size={20} style={{ color: "var(--accent-color)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{totalCosts.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي التكاليف</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Input placeholder="بحث بالموديل..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      {/* Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الموديل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>التاريخ</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>خامات</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>أجور</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>عاملة</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>إجمالي</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>للقطعة</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الكمية</TableHead>
                  <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const labor = parseFloat(r.cuttingLabor) + parseFloat(r.sewingLabor) + parseFloat(r.pressingLabor) + parseFloat(r.packagingLabor);
                  return (
                    <TableRow key={r.id} style={{ borderColor: "var(--border-color)" }}>
                      <TableCell style={{ color: "var(--text-primary)" }}>{r.modelName}</TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>{r.date}</TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>{(parseFloat(r.fabricCost) + parseFloat(r.threadCost) + parseFloat(r.accessoriesCost) + parseFloat(r.packagingCost)).toLocaleString()}</TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>{labor.toLocaleString()}</TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>{parseFloat(r.overheadCost).toLocaleString()}</TableCell>
                      <TableCell className="font-bold" style={{ color: "var(--text-primary)" }}>{Number(r.totalCost).toLocaleString()} ج</TableCell>
                      <TableCell className="font-bold text-amber-400">{Number(r.costPerPiece).toFixed(2)} ج</TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>{r.targetQuantity}</TableCell>
                      <TableCell className="text-left">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(r); setForm({ modelId: String(r.modelId), date: r.date, fabricCost: r.fabricCost, threadCost: r.threadCost, accessoriesCost: r.accessoriesCost, packagingCost: r.packagingCost, cuttingLabor: r.cuttingLabor, sewingLabor: r.sewingLabor, pressingLabor: r.pressingLabor, packagingLabor: r.packagingLabor, overheadCost: r.overheadCost, targetQuantity: String(r.targetQuantity), notes: r.notes || "" }); setDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) remove(r.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8" style={{ color: "var(--text-muted)" }}>لا توجد سجلات تكلفة</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((r) => {
          const matTotal = parseFloat(r.fabricCost) + parseFloat(r.threadCost) + parseFloat(r.accessoriesCost) + parseFloat(r.packagingCost);
          const laborTotal = parseFloat(r.cuttingLabor) + parseFloat(r.sewingLabor) + parseFloat(r.pressingLabor) + parseFloat(r.packagingLabor);
          const matPct = r.totalCost !== "0" ? ((matTotal / Number(r.totalCost)) * 100).toFixed(0) : "0";
          const laborPct = r.totalCost !== "0" ? ((laborTotal / Number(r.totalCost)) * 100).toFixed(0) : "0";
          const overPct = r.totalCost !== "0" ? ((parseFloat(r.overheadCost) / Number(r.totalCost)) * 100).toFixed(0) : "0";

          return (
            <Card key={r.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>{r.modelName} — تفاصيل التكلفة</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                    <p style={{ color: "var(--text-muted)" }}>خامات</p>
                    <p className="font-bold text-blue-400">{matTotal.toLocaleString()} ({matPct}%)</p>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                    <p style={{ color: "var(--text-muted)" }}>أجور</p>
                    <p className="font-bold text-emerald-400">{laborTotal.toLocaleString()} ({laborPct}%)</p>
                  </div>
                  <div className="p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                    <p style={{ color: "var(--text-muted)" }}>عاملة</p>
                    <p className="font-bold text-amber-400">{parseFloat(r.overheadCost).toLocaleString()} ({overPct}%)</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>تكلفة القطعة:</span>
                  <span className="text-lg font-bold text-amber-400">{Number(r.costPerPiece).toFixed(2)} ج</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل تكلفة" : "تكلفة إنتاج جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الموديل</Label>
                <Select value={form.modelId} onValueChange={(v) => setForm({ ...form, modelId: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    {models.map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تكلفة القماش</Label><Input type="number" value={form.fabricCost} onChange={(e) => setForm({ ...form, fabricCost: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تكلفة الخيوط</Label><Input type="number" value={form.threadCost} onChange={(e) => setForm({ ...form, threadCost: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>إكسسوارات</Label><Input type="number" value={form.accessoriesCost} onChange={(e) => setForm({ ...form, accessoriesCost: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تعبئة</Label><Input type="number" value={form.packagingCost} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>أجر القص</Label><Input type="number" value={form.cuttingLabor} onChange={(e) => setForm({ ...form, cuttingLabor: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>أجر الخياطة</Label><Input type="number" value={form.sewingLabor} onChange={(e) => setForm({ ...form, sewingLabor: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>أجر الكي</Label><Input type="number" value={form.pressingLabor} onChange={(e) => setForm({ ...form, pressingLabor: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>أجر التعبئة</Label><Input type="number" value={form.packagingLabor} onChange={(e) => setForm({ ...form, packagingLabor: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تكاليف عامة</Label><Input type="number" value={form.overheadCost} onChange={(e) => setForm({ ...form, overheadCost: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الكمية المستهدفة</Label><Input type="number" value={form.targetQuantity} onChange={(e) => setForm({ ...form, targetQuantity: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
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
