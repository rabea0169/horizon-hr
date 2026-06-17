import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, CheckCircle, Calculator, User } from "lucide-react";
import { useSalesCommissions, useCommissionStats, useCreateCommission, useMarkCommissionPaid, useBulkCreateCommissions } from "@/hooks/useLocalData";

export default function SalesCommissions() {
  const { data: commissions, isLoading } = useSalesCommissions();
  const { data: stats } = useCommissionStats();
  const createMutation = useCreateCommission();
  const markPaidMutation = useMarkCommissionPaid();
  const bulkCreateMutation = useBulkCreateCommissions();

  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [form, setForm] = useState({ employeeId: "", commissionRate: "5", saleAmount: "", commissionAmount: "", period: "", notes: "" });
  const [bulkForm, setBulkForm] = useState({ employeeId: "", period: "", rate: "5" });

  const filtered = (commissions || []).filter((c: any) => {
    return !search || c.employee?.fullName?.includes(search) || c.period?.includes(search);
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>عمولات المبيعات</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة وحساب عمولات مندوبي المبيعات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setBulkDialog(true)}>
            <Calculator size={16} /> حساب جماعي
          </Button>
          <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setForm({ employeeId: "", commissionRate: "5", saleAmount: "", commissionAmount: "", period: "", notes: "" }); setDialog(true); }}>
            <Plus size={16} /> عمولة جديدة
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "إجمالي العمولات", value: stats.total, icon: DollarSign, color: "var(--accent-color)" },
            { label: "المدفوعة", value: stats.paid, icon: CheckCircle, color: "#10B981" },
            { label: "المستحقة", value: stats.unpaid, icon: DollarSign, color: "#F59E0B" },
            { label: "إجمالي المبالغ", value: `${Number(stats.totalAmount).toLocaleString("ar-EG")} ج.م`, icon: DollarSign, color: "var(--accent-color)" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color, opacity: 0.15 }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Input placeholder="بحث بالموظف أو الفترة..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">الفترة</TableHead>
                  <TableHead className="text-right">نسبة العمولة</TableHead>
                  <TableHead className="text-right">مبلغ البيع</TableHead>
                  <TableHead className="text-right">العمولة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8">لا توجد عمولات</TableCell></TableRow>
                : filtered.map((c: any) => (
                  <TableRow key={c.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell><div className="flex items-center gap-2"><User size={14} style={{ color: "var(--accent-color)" }} /><span>{c.employee?.fullName || "-"}</span></div></TableCell>
                    <TableCell>{c.period}</TableCell>
                    <TableCell>{c.commissionRate}%</TableCell>
                    <TableCell>{Number(c.saleAmount).toLocaleString("ar-EG")} ج.م</TableCell>
                    <TableCell className="font-medium" style={{ color: "var(--accent-color)" }}>{Number(c.commissionAmount).toLocaleString("ar-EG")} ج.م</TableCell>
                    <TableCell><Badge className={c.isPaid ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}>{c.isPaid ? "مدفوعة" : "مستحقة"}</Badge></TableCell>
                    <TableCell>
                      {!c.isPaid && (
                        <Button size="sm" variant="ghost" className="text-emerald-500" onClick={() => markPaidMutation.mutate({ id: c.id })}>
                          <CheckCircle size={14} className="ml-1" /> دفع
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md" dir="rtl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>عمولة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الموظف ID</label><Input value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} placeholder="1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>نسبة العمولة %</label><Input value={form.commissionRate} onChange={e => { const r = e.target.value; setForm({ ...form, commissionRate: r, commissionAmount: String((parseFloat(form.saleAmount) || 0) * (parseFloat(r) || 0) / 100) }); }} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>مبلغ البيع</label><Input value={form.saleAmount} onChange={e => { const a = e.target.value; setForm({ ...form, saleAmount: a, commissionAmount: String((parseFloat(a) || 0) * (parseFloat(form.commissionRate) || 0) / 100) }); }} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>مبلغ العمولة</label><Input value={form.commissionAmount} readOnly className="text-right font-medium" style={{ background: "var(--bg-body)", borderColor: "var(--border-color)", color: "var(--accent-color)" }} /></div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الفترة (MM-YYYY)</label><Input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="06-2026" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={() => createMutation.mutate({ ...form, employeeId: Number(form.employeeId), commissionRate: form.commissionRate, saleAmount: form.saleAmount, commissionAmount: form.commissionAmount }, { onSuccess: () => setDialog(false) })} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Dialog */}
      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent className="max-w-md" dir="rtl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>حساب عمولات جماعية</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>سيتم حساب عمولات تلقائية لجميع أوامر البيع المسلمة للموظف المحدد.</p>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الموظف ID</label><Input value={bulkForm.employeeId} onChange={e => setBulkForm({ ...bulkForm, employeeId: e.target.value })} placeholder="1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الفترة</label><Input value={bulkForm.period} onChange={e => setBulkForm({ ...bulkForm, period: e.target.value })} placeholder="06-2026" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>نسبة العمولة %</label><Input value={bulkForm.rate} onChange={e => setBulkForm({ ...bulkForm, rate: e.target.value })} placeholder="5" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={() => bulkCreateMutation.mutate({ employeeId: Number(bulkForm.employeeId), period: bulkForm.period, rate: bulkForm.rate }, { onSuccess: () => setBulkDialog(false) })} className="text-white" style={{ background: "var(--accent-color)" }}>حساب</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
