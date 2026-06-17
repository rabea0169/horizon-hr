import { useState } from "react";
import { useSalesOrders, type SalesOrder } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400", confirmed: "bg-blue-500/15 text-blue-400",
  in_production: "bg-purple-500/15 text-purple-400", ready: "bg-cyan-500/15 text-cyan-400",
  dispatched: "bg-amber-500/15 text-amber-400", delivered: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
};
const statusLabels: Record<string, string> = {
  pending: "معلق", confirmed: "مؤكد", in_production: "في الإنتاج", ready: "جاهز",
  dispatched: "مشحون", delivered: "مسلم", cancelled: "ملغي",
};

export default function SalesOrders() {
  const { data: salesOrders, create, update, remove } = useSalesOrders();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<SalesOrder | null>(null);
  const [form, setForm] = useState({ orderCode: "", customerName: "", customerPhone: "", customerAddress: "", date: "", deliveryDate: "", advance: "", status: "pending" as SalesOrder["status"], notes: "" });
  const [items, setItems] = useState<{ modelName: string; size: string; color: string; quantity: string; unitPrice: string }[]>([{ modelName: "", size: "", color: "", quantity: "", unitPrice: "" }]);

  const reset = () => { setForm({ orderCode: "", customerName: "", customerPhone: "", customerAddress: "", date: "", deliveryDate: "", advance: "", status: "pending", notes: "" }); setItems([{ modelName: "", size: "", color: "", quantity: "", unitPrice: "" }]); setEditing(null); };

  const handleSave = () => {
    if (!form.orderCode.trim() || !form.customerName.trim()) return;
    const orderItems = items.filter((i) => i.modelName.trim()).map((i, idx) => ({ id: Date.now() + idx, modelName: i.modelName, size: i.size, color: i.color, quantity: Number(i.quantity) || 0, unitPrice: i.unitPrice, total: ((Number(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0)).toFixed(2) }));
    if (editing) update(editing.id, { ...form, items: orderItems });
    else create({ ...form, items: orderItems });
    setDialog(false); reset();
  };

  const filtered = salesOrders.filter((o) => (o.orderCode || "").includes(search) || (o.customerName || "").includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>أوامر البيع</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>أوامر البيع من العملاء</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> أمر بيع جديد</Button>
      </div>

      <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>كود</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>العميل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>التاريخ</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الإجمالي</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المتبقي</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحالة</TableHead>
                  <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-mono text-xs" style={{ color: "var(--accent-color)" }}>{o.orderCode}</TableCell>
                    <TableCell style={{ color: "var(--text-primary)" }}>{o.customerName}</TableCell>
                    <TableCell style={{ color: "var(--text-secondary)" }}>{o.date}</TableCell>
                    <TableCell style={{ color: "var(--text-primary)" }}>{Number(o.totalAmount).toLocaleString()} ج</TableCell>
                    <TableCell style={{ color: Number(o.balance) > 0 ? "#E85D4A" : "var(--text-secondary)" }}>{Number(o.balance).toLocaleString()} ج</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[o.status]}>{statusLabels[o.status]}</Badge></TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(o); setForm({ orderCode: o.orderCode, customerName: o.customerName, customerPhone: o.customerPhone || "", customerAddress: o.customerAddress || "", date: o.date, deliveryDate: o.deliveryDate || "", advance: o.advance, status: o.status, notes: o.notes || "" }); setItems((o.items || []).map((i) => ({ modelName: i.modelName || "", size: i.size || "", color: i.color || "", quantity: String(i.quantity || 0), unitPrice: i.unitPrice || "" }))); setDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) remove(o.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>لا توجد أوامر بيع</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل" : "أمر بيع جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>كود</Label><Input value={form.orderCode} onChange={(e) => setForm({ ...form, orderCode: e.target.value })} className="text-right" placeholder="SO-001" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>العميل</Label><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تليفون</Label><Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>عنوان</Label><Input value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التسليم</Label><Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>عربون</Label><Input type="number" value={form.advance} onChange={(e) => setForm({ ...form, advance: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الحالة</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SalesOrder["status"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-right">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                <div className="col-span-4"><Input placeholder="الموديل" value={item.modelName} onChange={(e) => { const u = [...items]; u[idx].modelName = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="col-span-2"><Input placeholder="مقاس" value={item.size} onChange={(e) => { const u = [...items]; u[idx].size = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="col-span-2"><Input placeholder="لون" value={item.color} onChange={(e) => { const u = [...items]; u[idx].color = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="col-span-2"><Input placeholder="كمية" value={item.quantity} onChange={(e) => { const u = [...items]; u[idx].quantity = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="col-span-2"><Input placeholder="سعر" value={item.unitPrice} onChange={(e) => { const u = [...items]; u[idx].unitPrice = e.target.value; setItems(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setItems([...items, { modelName: "", size: "", color: "", quantity: "", unitPrice: "" }])} style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}><Plus size={12} className="ml-1" /> صنف</Button>
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
