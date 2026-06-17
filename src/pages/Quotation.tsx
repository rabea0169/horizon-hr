import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, FileText, X } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400",
  sent: "bg-blue-500/15 text-blue-400",
  accepted: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  expired: "bg-yellow-500/15 text-yellow-400",
};
const statusLabels: Record<string, string> = { draft: "مسودة", sent: "مرسل", accepted: "مقبول", rejected: "مرفوض", expired: "منتهي" };

const STORAGE_KEY = "hr_quotations";

function loadData(): any[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveData(data: any[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

const VAT_RATE = 14;

export default function Quotation() {
  const [data, setData] = useState<any[]>(loadData);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ customerName: "", subtotal: "", discountAmount: "0", paymentTerms: "آجل 30 يوم", deliveryTerms: "EXW", status: "draft" as string, items: [] as any[], notes: "" });
  const [itemForm, setItemForm] = useState({ description: "", quantity: "", unitPrice: "" });

  const persist = (newData: any[]) => { setData(newData); saveData(newData); };

  const create = () => {
    const subtotal = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const vatAmount = subtotal * VAT_RATE / 100;
    const totalAmount = subtotal + vatAmount;
    const id = Date.now();
    const qtnNumber = "QTN-" + String(id).slice(-6);
    const newItem = { id, quotationNumber: qtnNumber, issueDate: new Date().toISOString().split("T")[0], expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], ...form, subtotal, vatAmount, totalAmount };
    persist([newItem, ...data]);
    setDialog(false); reset();
  };
  const update = () => { if (!editing) return; const subtotal = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0); const vatAmount = subtotal * VAT_RATE / 100; const totalAmount = subtotal + vatAmount; persist(data.map(d => d.id === editing.id ? { ...d, ...form, subtotal, vatAmount, totalAmount } : d)); setDialog(false); reset(); };
  const remove = (id: number) => { if (!confirm("حذف العرض؟")) return; persist(data.filter(d => d.id !== id)); };
  const reset = () => { setEditing(null); setForm({ customerName: "", subtotal: "", discountAmount: "0", paymentTerms: "آجل 30 يوم", deliveryTerms: "EXW", status: "draft", items: [], notes: "" }); setItemForm({ description: "", quantity: "", unitPrice: "" }); };

  const addItem = () => { if (!itemForm.description || !itemForm.quantity || !itemForm.unitPrice) return; const lineTotal = Number(itemForm.quantity) * Number(itemForm.unitPrice); setForm(prev => ({ ...prev, items: [...prev.items, { ...itemForm, quantity: Number(itemForm.quantity), unitPrice: Number(itemForm.unitPrice), lineTotal }] })); setItemForm({ description: "", quantity: "", unitPrice: "" }); };
  const removeItem = (idx: number) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const filtered = data.filter(d => d.quotationNumber?.includes(search) || d.customerName?.includes(search));
  const totalValue = data.filter(d => d.status === "accepted").reduce((s, d) => s + Number(d.totalAmount), 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">عروض الأسعار</h2>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}>
          <Plus size={16} /> عرض سعر جديد
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4"><p className="text-2xl font-bold">{data.length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي العروض</p></CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4"><p className="text-2xl font-bold">{data.filter(d => d.status === "accepted").length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>المقبولة</p></CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4"><p className="text-2xl font-bold">{data.filter(d => d.status === "sent").length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>المرسلة</p></CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4"><p className="text-2xl font-bold">{totalValue.toLocaleString()} ج.م</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>قيمة المقبولة</p></CardContent>
        </Card>
      </div>

      <Input placeholder="بحث برقم العرض أو العميل..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((q) => (
          <Card key={q.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText size={16} style={{ color: "var(--accent-color)" }} /><span className="font-semibold text-sm">{q.quotationNumber}</span></div>
                <Badge variant="outline" className={statusColors[q.status]}>{statusLabels[q.status]}</Badge>
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}><span style={{ color: "var(--text-muted)" }}>العميل:</span> {q.customerName}</div>
              <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>تاريخ: {q.issueDate}</span><span>انتهاء: {q.expiryDate}</span><span>VAT: {VAT_RATE}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold" style={{ color: "var(--accent-color)" }}>{Number(q.totalAmount).toLocaleString()} ج.م</div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(q); setForm({ ...q }); setDialog(true); }}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => remove(q.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p>لا توجد عروض أسعار</p>
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
          <DialogHeader><DialogTitle className="text-right">{editing ? "تعديل عرض سعر" : "عرض سعر جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 text-right" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>العميل</Label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>شروط الدفع</Label>
                <Select value={form.paymentTerms} onValueChange={v => setForm({ ...form, paymentTerms: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="نقدي">نقدي</SelectItem><SelectItem value="آجل 30 يوم">آجل 30 يوم</SelectItem><SelectItem value="آجل 60 يوم">آجل 60 يوم</SelectItem><SelectItem value="آجل 90 يوم">آجل 90 يوم</SelectItem><SelectItem value="LC">LC</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>

            <div className="border rounded-lg p-3 space-y-2" style={{ borderColor: "var(--border-color)" }}>
              <p className="text-sm font-medium">البنود</p>
              <div className="flex gap-2">
                <Input placeholder="وصف" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="flex-1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                <Input placeholder="كمية" type="number" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} className="w-20" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                <Input placeholder="سعر" type="number" value={itemForm.unitPrice} onChange={e => setItemForm({ ...itemForm, unitPrice: e.target.value })} className="w-24" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                <Button size="sm" onClick={addItem} style={{ background: "var(--accent-color)" }}><Plus size={14} /></Button>
              </div>
              {form.items.length > 0 && (
                <Table><TableHeader><TableRow><TableHead className="text-right">الوصف</TableHead><TableHead className="text-right">الكمية</TableHead><TableHead className="text-right">السعر</TableHead><TableHead className="text-right">الإجمالي</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>{form.items.map((item, i) => (
                    <TableRow key={i}><TableCell>{item.description}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.unitPrice}</TableCell><TableCell>{item.lineTotal?.toLocaleString()}</TableCell><TableCell><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => removeItem(i)}><X size={12} /></Button></TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </div>
            {form.items.length > 0 && (
              <div className="text-sm space-y-1" style={{ color: "var(--text-muted)" }}>
                <div className="flex justify-between"><span>الإجمالي:</span><span>{form.items.reduce((s, i) => s + i.lineTotal, 0).toLocaleString()} ج.م</span></div>
                <div className="flex justify-between"><span>VAT {VAT_RATE}%:</span><span>{(form.items.reduce((s, i) => s + i.lineTotal, 0) * VAT_RATE / 100).toLocaleString()} ج.م</span></div>
                <div className="flex justify-between font-bold" style={{ color: "var(--text-primary)" }}><span>الإجمالي بعد VAT:</span><span>{(form.items.reduce((s, i) => s + i.lineTotal, 0) * (1 + VAT_RATE / 100)).toLocaleString()} ج.م</span></div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">{editing && <Button variant="outline" onClick={() => { setForm({ ...form, status: "sent" }); }}>إرسال</Button>}<Button onClick={editing ? update : create} className="text-white" style={{ background: "var(--accent-color)" }}>{editing ? "تحديث" : "حفظ"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
