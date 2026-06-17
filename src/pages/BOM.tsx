import { useState } from "react";
import { useBOMRecords, useProductionModels, type BOMRecord } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package, Layers, X } from "lucide-react";

const catLabels: Record<string, string> = { fabric: "قماش", thread: "خيط", button: "زرار", zipper: "سحاب", label: "تيكت", packaging: "تعبئة", other: "أخرى" };
const catColors: Record<string, string> = {
  fabric: "bg-blue-500/15 text-blue-400", thread: "bg-cyan-500/15 text-cyan-400",
  button: "bg-amber-500/15 text-amber-400", zipper: "bg-gray-500/15 text-gray-400",
  label: "bg-purple-500/15 text-purple-400", packaging: "bg-emerald-500/15 text-emerald-400",
  other: "bg-pink-500/15 text-pink-400",
};

export default function BOM() {
  const { data: boms, create, update, remove } = useBOMRecords();
  const { data: models } = useProductionModels();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<BOMRecord | null>(null);
  const [form, setForm] = useState<{ modelId: string; items: { materialName: string; category: string; quantity: string; unit: string; unitPrice: string; notes: string }[] }>({ modelId: "", items: [{ materialName: "", category: "fabric", quantity: "", unit: "", unitPrice: "", notes: "" }] });

  const reset = () => { setForm({ modelId: "", items: [{ materialName: "", category: "fabric", quantity: "", unit: "", unitPrice: "", notes: "" }] }); setEditing(null); };

  const handleSave = () => {
    if (!form.modelId) return;
    const model = models.find((m) => String(m.id) === form.modelId);
    const items = form.items.filter((i) => i.materialName.trim()).map((i, idx) => ({
      id: Date.now() + idx,
      materialName: i.materialName,
      category: i.category,
      quantity: Number(i.quantity) || 0,
      unit: i.unit,
      unitPrice: i.unitPrice,
      total: ((Number(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0)).toFixed(2),
      notes: i.notes,
    }));
    if (editing) update(editing.id, { modelId: model?.id || 0, modelName: model?.name || "", modelCode: model?.code || "", items });
    else create({ modelId: model?.id || 0, modelName: model?.name || "", modelCode: model?.code || "", items });
    setDialog(false); reset();
  };

  const filtered = boms.filter((b) => b.modelName.includes(search) || b.modelCode.includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Bill of Materials</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>قوائم مواد كل موديل</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> BOM جديد</Button>
      </div>

      <Input placeholder="بحث بالموديل..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <div className="space-y-4">
        {filtered.map((bom) => (
          <Card key={bom.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={16} style={{ color: "var(--accent-color)" }} />
                  <CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>{bom.modelName}</CardTitle>
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>({bom.modelCode})</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(bom); setForm({ modelId: String(bom.modelId), items: bom.items.map((i) => ({ materialName: i.materialName, category: i.category, quantity: String(i.quantity), unit: i.unit, unitPrice: i.unitPrice, notes: i.notes || "" })) }); setDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) remove(bom.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: "var(--border-color)" }}>
                    <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المادة</TableHead>
                    <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>التصنيف</TableHead>
                    <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الكمية</TableHead>
                    <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>السعر</TableHead>
                    <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bom.items.map((item) => (
                    <TableRow key={item.id} style={{ borderColor: "var(--border-color)" }}>
                      <TableCell style={{ color: "var(--text-primary)" }}>{item.materialName}</TableCell>
                      <TableCell><Badge variant="outline" className={catColors[item.category]}>{catLabels[item.category]}</Badge></TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>{item.quantity} {item.unit}</TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>{parseFloat(item.unitPrice).toFixed(2)} ج</TableCell>
                      <TableCell className="font-bold" style={{ color: "var(--text-primary)" }}>{Number(item.total).toFixed(2)} ج</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center pt-3 border-t mt-2" style={{ borderColor: "var(--border-color)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>آخر تحديث: {new Date(bom.updatedAt).toLocaleDateString("ar-EG")}</span>
                <span className="text-lg font-bold text-amber-400">تكلفة المواد: {Number(bom.totalMaterialCost).toFixed(2)} ج</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><Layers size={32} className="mx-auto mb-3 opacity-50" /><p>لا توجد قوائم مواد</p></div>}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل BOM" : "BOM جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <Label style={{ color: "var(--text-secondary)" }}>الموديل</Label>
              <Select value={form.modelId} onValueChange={(v) => setForm({ ...form, modelId: v })}>
                <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{models.map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.items.map((item, idx) => (
              <div key={idx} className="space-y-2 p-3 rounded" style={{ background: "var(--bg-primary)" }}>
                <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>مادة #{idx + 1}</span>{idx > 0 && <Button size="sm" variant="ghost" className="h-5 w-5" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}><X size={12} className="text-red-400" /></Button>}</div>
                <Input placeholder="اسم المادة" value={item.materialName} onChange={(e) => { const updated = [...form.items]; updated[idx].materialName = e.target.value; setForm({ ...form, items: updated }); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                <div className="grid grid-cols-3 gap-2">
                  <Select value={item.category} onValueChange={(v) => { const updated = [...form.items]; updated[idx].category = v as typeof item.category; setForm({ ...form, items: updated }); }}>
                    <SelectTrigger className="text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                    <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{Object.entries(catLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-right text-xs">{v}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="كمية" value={item.quantity} onChange={(e) => { const updated = [...form.items]; updated[idx].quantity = e.target.value; setForm({ ...form, items: updated }); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                  <Input placeholder="وحدة" value={item.unit} onChange={(e) => { const updated = [...form.items]; updated[idx].unit = e.target.value; setForm({ ...form, items: updated }); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                </div>
                <Input placeholder="سعر الوحدة" value={item.unitPrice} onChange={(e) => { const updated = [...form.items]; updated[idx].unitPrice = e.target.value; setForm({ ...form, items: updated }); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setForm({ ...form, items: [...form.items, { materialName: "", category: "fabric", quantity: "", unit: "", unitPrice: "", notes: "" }] })} style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}><Plus size={12} className="ml-1" /> مادة</Button>
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
