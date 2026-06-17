import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Pencil, Trash2, Receipt, ShoppingCart } from "lucide-react";

const VAT_RATE = 14;
const S_SALES = "hr_invoices_sales";
const S_PURCHASE = "hr_invoices_purchase";

function loadSales(): any[] { try { return JSON.parse(localStorage.getItem(S_SALES) || "[]"); } catch { return []; } }
function saveSales(d: any[]) { localStorage.setItem(S_SALES, JSON.stringify(d)); }
function loadPurchase(): any[] { try { return JSON.parse(localStorage.getItem(S_PURCHASE) || "[]"); } catch { return []; } }
function savePurchase(d: any[]) { localStorage.setItem(S_PURCHASE, JSON.stringify(d)); }

const statusColors: Record<string, string> = { draft: "bg-gray-500/15 text-gray-400", issued: "bg-blue-500/15 text-blue-400", paid: "bg-emerald-500/15 text-emerald-400", partial: "bg-yellow-500/15 text-yellow-400", overdue: "bg-red-500/15 text-red-400", cancelled: "bg-gray-500/15 text-gray-400" };
const statusLabels: Record<string, string> = { draft: "مسودة", issued: "مصدرة", paid: "مدفوعة", partial: "جزئي", overdue: "متأخرة", cancelled: "ملغاة" };

type TabType = "sales" | "purchase";

export default function Invoices() {
  const [tab, setTab] = useState<TabType>("sales");
  const [salesData, setSalesData] = useState<any[]>(loadSales);
  const [purchaseData, setPurchaseData] = useState<any[]>(loadPurchase);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ invoiceNumber: "", customerName: "", subtotal: "", vatRate: "14", discountAmount: "0", paymentTerms: "آجل 30 يوم", status: "draft", dueDate: "", notes: "" });

  const data = tab === "sales" ? salesData : purchaseData;
  const setData = tab === "sales" ? setSalesData : setPurchaseData;
  const persist = (d: any[]) => { setData(d); if (tab === "sales") saveSales(d); else savePurchase(d); };

  const computeTotals = () => {
    const subtotal = Number(form.subtotal) || 0;
    const discount = Number(form.discountAmount) || 0;
    const vat = (subtotal - discount) * (Number(form.vatRate) || VAT_RATE) / 100;
    return { subtotal, discount, vat, total: subtotal - discount + vat };
  };
  const create = () => {
    const t = computeTotals();
    const id = Date.now();
    const invNumber = form.invoiceNumber || (tab === "sales" ? "INV-S-" : "INV-P-") + String(id).slice(-6);
    const { invoiceNumber: _, ...restForm } = form;
    persist([{ id, invoiceNumber: invNumber, issueDate: new Date().toISOString().split("T")[0], ...restForm, vatAmount: t.vat, totalAmount: t.total }, ...data]);
    setDialog(false); reset();
  };
  const update = () => { if (!editing) return; const t = computeTotals(); persist(data.map(d => d.id === editing.id ? { ...d, ...form, vatAmount: t.vat, totalAmount: t.total } : d)); setDialog(false); reset(); };
  const remove = (id: number) => { if (!confirm("حذف الفاتورة؟")) return; persist(data.filter(d => d.id !== id)); };
  const reset = () => { setEditing(null); setForm({ invoiceNumber: "", customerName: "", subtotal: "", vatRate: "14", discountAmount: "0", paymentTerms: "آجل 30 يوم", status: "draft", dueDate: "", notes: "" }); };

  const filtered = data.filter(d => d.invoiceNumber?.includes(search) || d.customerName?.includes(search));
  const totalOutstanding = data.filter(d => ["issued", "partial", "overdue"].includes(d.status)).reduce((s, d) => s + (Number(d.totalAmount) - Number(d.amountPaid || 0)), 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">الفواتير</h2><Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> فاتورة جديدة</Button></div>
      <div className="flex gap-2">
        <Button variant={tab === "sales" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setTab("sales")} style={tab === "sales" ? { background: "var(--accent-color)" } : {}}><Receipt size={14} /> مبيعات</Button>
        <Button variant={tab === "purchase" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setTab("purchase")} style={tab === "purchase" ? { background: "var(--accent-color)" } : {}}><ShoppingCart size={14} /> مشتريات</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الفواتير</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.filter(d => d.status === "paid").length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>مدفوعة</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.filter(d => ["issued", "partial", "overdue"].includes(d.status)).length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>غير مدفوعة</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{totalOutstanding.toLocaleString()} ج.م</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>المستحق</p></CardContent></Card>
      </div>
      <Input placeholder="بحث برقم الفاتورة أو العميل/المورد..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(inv => (
          <Card key={inv.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText size={16} style={{ color: "var(--accent-color)" }} /><span className="font-semibold text-sm">{inv.invoiceNumber}</span></div>
                <Badge variant="outline" className={statusColors[inv.status]}>{statusLabels[inv.status]}</Badge>
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}><span style={{ color: "var(--text-muted)" }}>{tab === "sales" ? "العميل" : "المورد"}:</span> {inv.customerName}</div>
              <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)" }}><span>تاريخ: {inv.issueDate}</span>{inv.dueDate && <span>استحقاق: {inv.dueDate}</span>}</div>
              <div className="text-xs space-y-0.5" style={{ color: "var(--text-muted)" }}>
                <div className="flex justify-between max-w-[200px]"><span>القيمة:</span><span>{Number(inv.subtotal).toLocaleString()}</span></div>
                <div className="flex justify-between max-w-[200px]"><span>خصم:</span><span>{Number(inv.discountAmount).toLocaleString()}</span></div>
                <div className="flex justify-between max-w-[200px]"><span>VAT ({inv.vatRate || VAT_RATE}%):</span><span>{Number(inv.vatAmount).toLocaleString()}</span></div>
                <div className="flex justify-between max-w-[200px] font-bold" style={{ color: "var(--text-primary)" }}><span>الإجمالي:</span><span>{Number(inv.totalAmount).toLocaleString()} ج.م</span></div>
              </div>
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(inv); setForm({ invoiceNumber: inv.invoiceNumber, customerName: inv.customerName, subtotal: String(inv.subtotal), vatRate: String(inv.vatRate), discountAmount: String(inv.discountAmount), paymentTerms: inv.paymentTerms, status: inv.status, dueDate: inv.dueDate, notes: inv.notes }); setDialog(true); }}><Pencil size={14} /></Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => remove(inv.id)}><Trash2 size={14} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><FileText size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد فواتير</p></div>}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
          <DialogHeader><DialogTitle className="text-right">{editing ? "تعديل فاتورة" : (tab === "sales" ? "فاتورة مبيعات" : "فاتورة مشتريات")}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-right" dir="rtl">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>رقم الفاتورة</Label><Input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="تلقائي" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>{tab === "sales" ? "العميل" : "المورد"}</Label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>القيمة الفرعية</Label><Input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>نسبة VAT %</Label><Input type="number" value={form.vatRate} onChange={e => setForm({ ...form, vatRate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>خصم</Label><Input type="number" value={form.discountAmount} onChange={e => setForm({ ...form, discountAmount: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>تاريخ الاستحقاق</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger><SelectContent>{Object.keys(statusLabels).map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>شروط الدفع</Label><Select value={form.paymentTerms} onValueChange={v => setForm({ ...form, paymentTerms: v })}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="نقدي">نقدي</SelectItem><SelectItem value="آجل 30 يوم">آجل 30 يوم</SelectItem><SelectItem value="آجل 60 يوم">آجل 60 يوم</SelectItem><SelectItem value="آجل 90 يوم">آجل 90 يوم</SelectItem><SelectItem value="LC">LC</SelectItem></SelectContent></Select></div>
            </div>
            <div className="border rounded p-2 space-y-1 text-sm" style={{ borderColor: "var(--border-color)" }}>
              <div className="flex justify-between"><span>القيمة:</span><span>{computeTotals().subtotal.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between"><span>الخصم:</span><span>{computeTotals().discount.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between"><span>VAT ({form.vatRate || VAT_RATE}%):</span><span>{computeTotals().vat.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between font-bold" style={{ color: "var(--accent-color)" }}><span>الإجمالي:</span><span>{computeTotals().total.toLocaleString()} ج.م</span></div>
            </div>
          </div>
          <DialogFooter><Button onClick={editing ? update : create} className="text-white" style={{ background: "var(--accent-color)" }}>{editing ? "تحديث" : "حفظ"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
