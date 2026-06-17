import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ArrowUpRight, ArrowDownLeft, Banknote } from "lucide-react";

const S_PAYMENT = "hr_vouchers_payment";
const S_RECEIPT = "hr_vouchers_receipt";
function loadPayment(): any[] { try { return JSON.parse(localStorage.getItem(S_PAYMENT) || "[]"); } catch { return []; } }
function savePayment(d: any[]) { localStorage.setItem(S_PAYMENT, JSON.stringify(d)); }
function loadReceipt(): any[] { try { return JSON.parse(localStorage.getItem(S_RECEIPT) || "[]"); } catch { return []; } }
function saveReceipt(d: any[]) { localStorage.setItem(S_RECEIPT, JSON.stringify(d)); }

const statusColors: Record<string, string> = { draft: "bg-gray-500/15 text-gray-400", approved: "bg-blue-500/15 text-blue-400", paid: "bg-emerald-500/15 text-emerald-400", received: "bg-emerald-500/15 text-emerald-400", cancelled: "bg-red-500/15 text-red-400" };
const statusLabels: Record<string, string> = { draft: "مسودة", approved: "معتمد", paid: "مصروف", received: "مستلم", cancelled: "ملغاة" };

type TabType = "payment" | "receipt";

export default function Vouchers() {
  const [tab, setTab] = useState<TabType>("payment");
  const [payData, setPayData] = useState<any[]>(loadPayment);
  const [recData, setRecData] = useState<any[]>(loadReceipt);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ voucherNumber: "", payeeName: "", amount: "", paymentMethod: "cash" as string, checkNumber: "", bankName: "", description: "", status: "draft", notes: "" });

  const data = tab === "payment" ? payData : recData;
  const setData = tab === "payment" ? setPayData : setRecData;
  const persist = (d: any[]) => { setData(d); if (tab === "payment") savePayment(d); else saveReceipt(d); };

  const create = () => {
    const id = Date.now();
    const vNum = form.voucherNumber || (tab === "payment" ? "PV-" : "RV-") + String(id).slice(-6);
    const { voucherNumber: _, ...restForm } = form;
    persist([{ id, voucherNumber: vNum, voucherDate: new Date().toISOString().split("T")[0], ...restForm, amount: Number(form.amount) || 0 }, ...data]);
    setDialog(false); reset();
  };
  const update = () => { if (!editing) return; persist(data.map(d => d.id === editing.id ? { ...d, ...form, amount: Number(form.amount) || 0 } : d)); setDialog(false); reset(); };
  const remove = (id: number) => { if (!confirm("حذف المستخلص؟")) return; persist(data.filter(d => d.id !== id)); };
  const reset = () => { setEditing(null); setForm({ voucherNumber: "", payeeName: "", amount: "", paymentMethod: "cash", checkNumber: "", bankName: "", description: "", status: "draft", notes: "" }); };

  const filtered = data.filter(d => d.voucherNumber?.includes(search) || d.payeeName?.includes(search));
  const totalAmount = data.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">المستخلصات المحاسبية</h2><Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> مستخلص جديد</Button></div>
      <div className="flex gap-2">
        <Button variant={tab === "payment" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setTab("payment")} style={tab === "payment" ? { background: "var(--accent-color)" } : {}}><ArrowUpRight size={14} /> صرف</Button>
        <Button variant={tab === "receipt" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setTab("receipt")} style={tab === "receipt" ? { background: "var(--accent-color)" } : {}}><ArrowDownLeft size={14} /> قبض</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي المستخلصات</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{totalAmount.toLocaleString()} ج.م</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>القيمة الإجمالية</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4"><p className="text-2xl font-bold">{data.filter(d => ["paid", "received"].includes(d.status)).length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>مُنفذة</p></CardContent></Card>
      </div>
      <Input placeholder="بحث برقم المستخلص أو الاسم..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(v => (
          <Card key={v.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Banknote size={16} style={{ color: "var(--accent-color)" }} /><span className="font-semibold text-sm">{v.voucherNumber}</span></div>
                <Badge variant="outline" className={statusColors[v.status]}>{statusLabels[v.status]}</Badge>
              </div>
              <div className="text-sm" style={{ color: "var(--text-primary)" }}><span style={{ color: "var(--text-muted)" }}>{tab === "payment" ? "المستفيد" : "المسدد"}:</span> {v.payeeName}</div>
              <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}><span>التاريخ: {v.voucherDate}</span><span>الطريقة: {v.paymentMethod === "cash" ? "نقدي" : v.paymentMethod === "check" ? "شيك" : v.paymentMethod === "bank_transfer" ? "تحويل بنكي" : "كارت"}</span></div>
              <div className="flex items-center justify-between"><div className="text-sm font-bold" style={{ color: "var(--accent-color)" }}>{Number(v.amount).toLocaleString()} ج.م</div><div className="flex gap-1"><Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(v); setForm({ voucherNumber: v.voucherNumber, payeeName: v.payeeName, amount: String(v.amount), paymentMethod: v.paymentMethod, checkNumber: v.checkNumber || "", bankName: v.bankName || "", description: v.description || "", status: v.status, notes: v.notes || "" }); setDialog(true); }}><Pencil size={14} /></Button><Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => remove(v.id)}><Trash2 size={14} /></Button></div></div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><Banknote size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد مستخلصات</p></div>}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
          <DialogHeader><DialogTitle className="text-right">{editing ? "تعديل مستخلص" : (tab === "payment" ? "مستخلص صرف" : "مستخلص قبض")}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-right" dir="rtl">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>الرقم</Label><Input value={form.voucherNumber} onChange={e => setForm({ ...form, voucherNumber: e.target.value })} placeholder="تلقائي" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>{tab === "payment" ? "المستفيد" : "المسدد"}</Label><Input value={form.payeeName} onChange={e => setForm({ ...form, payeeName: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>المبلغ</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>طريقة الدفع</Label><Select value={form.paymentMethod} onValueChange={v => setForm({ ...form, paymentMethod: v })}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">نقدي</SelectItem><SelectItem value="check">شيك</SelectItem><SelectItem value="bank_transfer">تحويل بنكي</SelectItem><SelectItem value="credit_card">كارت</SelectItem></SelectContent></Select></div>
            </div>
            {form.paymentMethod === "check" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>رقم الشيك</Label><Input value={form.checkNumber} onChange={e => setForm({ ...form, checkNumber: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="space-y-1"><Label>البنك</Label><Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              </div>
            )}
            <div className="space-y-1"><Label>البيان</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={editing ? update : create} className="text-white" style={{ background: "var(--accent-color)" }}>{editing ? "تحديث" : "حفظ"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
