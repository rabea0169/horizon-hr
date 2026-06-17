import { useState } from "react";
import { useMRPRecords, type MRPRecord } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Package } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sufficient: { label: "كافي", color: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle2 },
  low: { label: "منخفض", color: "bg-yellow-500/15 text-yellow-400", icon: AlertTriangle },
  critical: { label: "حرج", color: "bg-red-500/15 text-red-400", icon: AlertTriangle },
  order_needed: { label: "يحتاج طلب", color: "bg-blue-500/15 text-blue-400", icon: Package },
};

export default function MRP() {
  const { data: mrpRecords, create, update, remove } = useMRPRecords();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<MRPRecord | null>(null);
  const [form, setForm] = useState({ materialName: "", category: "", currentStock: "", minLevel: "", requiredQty: "", unit: "", status: "sufficient" as MRPRecord["status"], productionOrders: "" });

  const reset = () => { setForm({ materialName: "", category: "", currentStock: "", minLevel: "", requiredQty: "", unit: "", status: "sufficient", productionOrders: "" }); setEditing(null); };

  const handleSave = () => {
    if (!form.materialName.trim()) return;
    const data = { materialName: form.materialName, category: form.category, currentStock: Number(form.currentStock) || 0, minLevel: Number(form.minLevel) || 0, requiredQty: Number(form.requiredQty) || 0, unit: form.unit, status: form.status, productionOrders: form.productionOrders.split(",").filter(Boolean), lastUpdated: new Date().toISOString() };
    if (editing) update(editing.id, data);
    else create(data);
    setDialog(false); reset();
  };

  const filtered = mrpRecords.filter((r) => r.materialName.includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>تخطيط احتياجات المواد (MRP)</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تخطيط تلقائي لاحتياجات المواد الخام</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> مادة جديدة</Button>
      </div>

      <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المادة</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>التصنيف</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المخزون</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحد الأدنى</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المطلوب</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحالة</TableHead>
                  <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const s = statusConfig[r.status];
                  const SI = s.icon;
                  return (
                    <TableRow key={r.id} style={{ borderColor: "var(--border-color)" }}>
                      <TableCell style={{ color: "var(--text-primary)" }}>{r.materialName}</TableCell>
                      <TableCell style={{ color: "var(--text-secondary)" }}>{r.category}</TableCell>
                      <TableCell style={{ color: r.currentStock < r.minLevel ? "#E85D4A" : "var(--text-secondary)" }}>{r.currentStock} {r.unit}</TableCell>
                      <TableCell style={{ color: "var(--text-muted)" }}>{r.minLevel}</TableCell>
                      <TableCell style={{ color: "var(--text-primary)" }}>{r.requiredQty}</TableCell>
                      <TableCell><Badge variant="outline" className={`${s.color} gap-1`}><SI size={10} />{s.label}</Badge></TableCell>
                      <TableCell className="text-left">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(r); setForm({ materialName: r.materialName, category: r.category, currentStock: String(r.currentStock), minLevel: String(r.minLevel), requiredQty: String(r.requiredQty), unit: r.unit, status: r.status, productionOrders: r.productionOrders.join(",") }); setDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) remove(r.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>لا توجد مواد</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل" : "مادة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>اسم المادة</Label><Input value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التصنيف</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الوحدة</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>المخزون</Label><Input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الحد الأدنى</Label><Input type="number" value={form.minLevel} onChange={(e) => setForm({ ...form, minLevel: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>المطلوب</Label><Input type="number" value={form.requiredQty} onChange={(e) => setForm({ ...form, requiredQty: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
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
