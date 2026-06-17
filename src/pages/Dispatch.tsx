import { useState } from "react";
import { useChallans, type Challan } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const statusColors: Record<string, string> = { draft: "bg-gray-500/15 text-gray-400", ready: "bg-blue-500/15 text-blue-400", dispatched: "bg-amber-500/15 text-amber-400", delivered: "bg-emerald-500/15 text-emerald-400" };
const typeLabels: Record<string, string> = { dispatch: "صرف", return: "مرتجع", internal: "داخلي" };

export default function Dispatch() {
  const { data: challans, create, update, remove } = useChallans();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Challan | null>(null);
  const [form, setForm] = useState<{ challanCode: string; type: string; customerName: string; date: string; vehicleNo: string; driverName: string; notes: string }>({ challanCode: "", type: "dispatch", customerName: "", date: "", vehicleNo: "", driverName: "", notes: "" });
  const [items, setItems] = useState<{ modelName: string; size: string; color: string; quantity: string; bundleCodes: string }[]>([{ modelName: "", size: "", color: "", quantity: "", bundleCodes: "" }]);

  const reset = () => { setForm({ challanCode: "", type: "dispatch", customerName: "", date: "", vehicleNo: "", driverName: "", notes: "" }); setItems([{ modelName: "", size: "", color: "", quantity: "", bundleCodes: "" }]); setEditing(null); };

  const handleSave = () => {
    if (!form.challanCode.trim()) return;
    const challanItems = items.filter((i) => i.modelName.trim()).map((i, idx) => ({ id: Date.now() + idx, modelName: i.modelName, size: i.size, color: i.color, quantity: Number(i.quantity) || 0, bundleCodes: i.bundleCodes.split(",").filter(Boolean) }));
    if (editing) update(editing.id, { ...form, items: challanItems } as any);
    else create({ ...form, items: challanItems } as any);
    setDialog(false); reset();
  };

  const filtered = challans.filter((c) => c.challanCode.includes(search) || c.customerName?.includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>إذن صرف وتوصيل</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تتبع الشحنات وإذن الصرف (Challan)</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> Challan جديد</Button>
      </div>

      <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>كود</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>النوع</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>العميل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>التاريخ</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الكمية</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحالة</TableHead>
                  <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-mono text-xs" style={{ color: "var(--accent-color)" }}>{c.challanCode}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[c.type]}</Badge></TableCell>
                    <TableCell style={{ color: "var(--text-primary)" }}>{c.customerName || "—"}</TableCell>
                    <TableCell style={{ color: "var(--text-secondary)" }}>{c.date}</TableCell>
                    <TableCell style={{ color: "var(--text-primary)" }}>{c.totalQty}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[c.status]}>{c.status === "draft" ? "مسودة" : c.status === "ready" ? "جاهز" : c.status === "dispatched" ? "مشحون" : "مسلم"}</Badge></TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setForm({ challanCode: c.challanCode, type: c.type, customerName: c.customerName || "", date: c.date, vehicleNo: c.vehicleNo || "", driverName: c.driverName || "", notes: c.notes || "" }); setItems(c.items.map((i) => ({ modelName: i.modelName, size: i.size, color: i.color, quantity: String(i.quantity), bundleCodes: i.bundleCodes.join(",") }))); setDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) remove(c.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>لا توجد سجلات</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل" : "Challan جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>كود</Label><Input value={form.challanCode} onChange={(e) => setForm({ ...form, challanCode: e.target.value })} className="text-right" placeholder="CH-001" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Challan["type"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-right">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>العميل</Label><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>رقم المركبة</Label><Input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>السائق</Label><Input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                <div className="col-span-4"><Input placeholder="الموديل" value={item.modelName} onChange={(e) => { const u = [...items]; u[idx].modelName = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="col-span-2"><Input placeholder="مقاس" value={item.size} onChange={(e) => { const u = [...items]; u[idx].size = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="col-span-2"><Input placeholder="لون" value={item.color} onChange={(e) => { const u = [...items]; u[idx].color = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="col-span-2"><Input placeholder="كمية" value={item.quantity} onChange={(e) => { const u = [...items]; u[idx].quantity = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="col-span-2">{idx > 0 && <Button size="sm" variant="ghost" className="h-6 w-6" onClick={() => setItems(items.filter((_, i) => i !== idx))}><X size={10} className="text-red-400" /></Button>}</div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setItems([...items, { modelName: "", size: "", color: "", quantity: "", bundleCodes: "" }])} style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}><Plus size={12} className="ml-1" /> صنف</Button>
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
