import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ClipboardCheck } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  partial: "bg-blue-500/15 text-blue-400",
  fully_received: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};
const statusLabels: Record<string, string> = { pending: "معلق", partial: "جزئي", fully_received: "مستلم بالكامل", rejected: "مرفوض" };

const STORAGE_KEY = "hr_grns";
const VAT_RATE = 14;

function loadData(): any[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveData(data: any[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

export default function GRN() {
  const [data, setData] = useState<any[]>(loadData);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ grnNumber: "", supplierName: "", invoiceNumber: "", subtotal: "", receivedDate: new Date().toISOString().split("T")[0], status: "pending", notes: "" });

  const persist = (newData: any[]) => { setData(newData); saveData(newData); };
  const create = () => {
    const id = Date.now();
    const grnNumber = form.grnNumber || "GRN-" + String(id).slice(-6);
    const subtotal = Number(form.subtotal) || 0;
    const vatAmount = subtotal * VAT_RATE / 100;
    const totalAmount = subtotal + vatAmount;
    persist([{ id, grnNumber, supplierName: form.supplierName, invoiceNumber: form.invoiceNumber, subtotal, vatAmount, totalAmount, receivedDate: form.receivedDate, status: form.status, notes: form.notes }, ...data]);
    setDialog(false); reset();
  };
  const update = () => { if (!editing) return; const subtotal = Number(form.subtotal) || 0; const vatAmount = subtotal * VAT_RATE / 100; persist(data.map(d => d.id === editing.id ? { ...d, ...form, subtotal, vatAmount, totalAmount: subtotal + vatAmount } : d)); setDialog(false); reset(); };
  const remove = (id: number) => { if (!confirm("حذف إشعار الاستلام؟")) return; persist(data.filter(d => d.id !== id)); };
  const reset = () => { setEditing(null); setForm({ grnNumber: "", supplierName: "", invoiceNumber: "", subtotal: "", receivedDate: new Date().toISOString().split("T")[0], status: "pending", notes: "" }); };

  const filtered = data.filter(d => d.grnNumber?.includes(search) || d.supplierName?.includes(search));
  const totalReceived = data.filter(d => d.status === "fully_received").reduce((s, d) => s + Number(d.totalAmount), 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">إشعارات استلام بضاعة (GRN)</h2>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> GRN جديد</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي GRN</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.filter(d => d.status === "fully_received").length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>مستلم بالكامل</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.filter(d => d.status === "pending").length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>معلق</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{totalReceived.toLocaleString()} ج.م</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>قيمة المستلم</p></CardContent></Card>
      </div>
      <Input placeholder="بحث برقم GRN أو المورد..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(g => (
          <Card key={g.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><ClipboardCheck size={16} style={{ color: "var(--accent-color)" }} /><span className="font-semibold text-sm">{g.grnNumber}</span></div>
                <Badge variant="outline" className={statusColors[g.status]}>{statusLabels[g.status]}</Badge>
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}><span style={{ color: "var(--text-muted)" }}>المورد:</span> {g.supplierName}</div>
              {g.invoiceNumber && <div className="text-xs" style={{ color: "var(--text-muted)" }}>فاتورة مورد: {g.invoiceNumber}</div>}
              <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}><span>تاريخ: {g.receivedDate}</span><span>الإجمالي: {Number(g.totalAmount).toLocaleString()} ج.م</span></div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>القيمة: {Number(g.subtotal).toLocaleString()} ج.م | VAT ({VAT_RATE}%): {Number(g.vatAmount).toLocaleString()} ج.م</div>
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(g); setForm({ grnNumber: g.grnNumber, supplierName: g.supplierName, invoiceNumber: g.invoiceNumber, subtotal: String(g.subtotal), receivedDate: g.receivedDate, status: g.status, notes: g.notes }); setDialog(true); }}><Pencil size={14} /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => remove(g.id)}><Trash2 size={14} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><ClipboardCheck size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد إشعارات استلام</p></div>}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
          <DialogHeader><DialogTitle className="text-right">{editing ? "تعديل GRN" : "GRN جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-right" dir="rtl">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>رقم GRN</Label><Input value={form.grnNumber} onChange={e => setForm({ ...form, grnNumber: e.target.value })} placeholder="تلقائي" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>المورد</Label><Input value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>رقم فاتورة المورد</Label><Input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>القيمة الفرعية</Label><Input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>تاريخ الاستلام</Label><Input type="date" value={form.receivedDate} onChange={e => setForm({ ...form, receivedDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pending">معلق</SelectItem><SelectItem value="partial">جزئي</SelectItem><SelectItem value="fully_received">مستلم بالكامل</SelectItem><SelectItem value="rejected">مرفوض</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={editing ? update : create} className="text-white" style={{ background: "var(--accent-color)" }}>{editing ? "تحديث" : "حفظ"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
