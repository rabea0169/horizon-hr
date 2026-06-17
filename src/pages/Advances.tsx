import { useState } from "react";
import { useAdvances, useEmployees } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Plus, HandCoins, CheckCircle, XCircle, Clock } from "lucide-react";

const statusStyles: Record<string, string> = {
  pending: "badge-pending",
  approved: "badge-approved",
  rejected: "badge-inactive",
  repaid: "bg-blue-500/20 text-blue-400",
};
const statusLabels: Record<string, string> = {
  pending: "معلقة",
  approved: "تمت الموافقة",
  rejected: "مرفوضة",
  repaid: "تم السداد",
};

export default function AdvancesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", amount: "", reason: "", repaymentMonths: "1" });

  const { data: advances, create, update } = useAdvances();
  const { data: employees } = useEmployees();

  const totalPending = advances.filter((a) => a.status === "pending").reduce((sum, a) => sum + Number(a.amount), 0);
  const totalApproved = advances.filter((a) => a.status === "approved").reduce((sum, a) => sum + Number(a.amount), 0);
  const totalRepaid = advances.filter((a) => a.status === "repaid").reduce((sum, a) => sum + Number(a.amount), 0);

  const handleCreate = () => {
    const emp = employees.find((e) => e.id === Number(form.employeeId));
    if (!emp) return;
    create({
      employeeId: Number(form.employeeId),
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      amount: form.amount,
      date: new Date().toISOString().split("T")[0],
      reason: form.reason,
      status: "pending",
      repaymentMonths: Number(form.repaymentMonths),
      monthlyDeduction: (Number(form.amount) / Number(form.repaymentMonths)).toFixed(0),
    });
    setIsDialogOpen(false);
    setForm({ employeeId: "", amount: "", reason: "", repaymentMonths: "1" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>السلف والسلفيات</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة سلف الموظفين والعمال</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsDialogOpen(true)}>
            <Plus size={16} className="ml-1.5" /> طلب سلفة
          </Button>
          <DialogContent className="theme-card text-white max-w-lg">
            <DialogHeader><DialogTitle className="text-white text-right">طلب سلفة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4 text-right">
              <div className="space-y-2"><Label className="text-white/70">الموظف</Label><Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}><SelectTrigger className="theme-input text-right"><SelectValue placeholder="اختر الموظف" /></SelectTrigger><SelectContent className="theme-input">{employees.filter((e) => e.status === "active").map((e) => <SelectItem key={e.id} value={String(e.id)} className="text-white text-right">{e.fullName} - {e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-white/70">المبلغ (جنيه)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="theme-input text-right" /></div>
              <div className="space-y-2"><Label className="text-white/70">سبب السلفة</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="theme-input text-right" /></div>
              <div className="space-y-2"><Label className="text-white/70">عدد أشهر السداد</Label><Input type="number" min={1} max={12} value={form.repaymentMonths} onChange={(e) => setForm({ ...form, repaymentMonths: e.target.value })} className="theme-input text-right" /></div>
              {form.amount && form.repaymentMonths && Number(form.repaymentMonths) > 0 && (
                <p className="text-xs text-white/50 text-right">القسط الشهري: {(Number(form.amount) / Number(form.repaymentMonths)).toFixed(0)} جنيه</p>
              )}
              <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!form.employeeId || !form.amount} onClick={handleCreate}>تقديم الطلب</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "معلقة", value: `${totalPending.toLocaleString()} ج`, icon: Clock, color: "text-yellow-400" },
          { label: "تمت الموافقة", value: `${totalApproved.toLocaleString()} ج`, icon: HandCoins, color: "text-green-400" },
          { label: "تم السداد", value: `${totalRepaid.toLocaleString()} ج`, icon: CheckCircle, color: "text-blue-400" },
        ].map((item) => (
          <Card key={item.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <item.icon size={18} className={item.color} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              </div>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium text-right">الموظف</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">المبلغ</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">التاريخ</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">السبب</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">القسط الشهري</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الحالة</TableHead>
                  <TableHead className="text-white/50 font-medium text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-white/40">
                      <Wallet size={32} className="mx-auto mb-3 opacity-50" />
                      <p>لا توجد سلف مسجلة</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  advances.sort((a, b) => b.date.localeCompare(a.date)).map((adv) => (
                    <TableRow key={adv.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{adv.employeeName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{adv.employeeCode}</p></TableCell>
                      <TableCell className="text-sm font-semibold text-white">{Number(adv.amount).toLocaleString()} ج</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{adv.date}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{adv.reason || "—"}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{adv.monthlyDeduction ? `${Number(adv.monthlyDeduction).toLocaleString()} ج × ${adv.repaymentMonths} شهر` : "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={statusStyles[adv.status]}>{statusLabels[adv.status]}</Badge></TableCell>
                      <TableCell className="text-left">
                        {adv.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400 hover:text-green-300" onClick={() => update(adv.id, { status: "approved" })}><CheckCircle size={14} /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => update(adv.id, { status: "rejected" })}><XCircle size={14} /></Button>
                          </div>
                        )}
                        {adv.status === "approved" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-400 hover:text-blue-300" onClick={() => update(adv.id, { status: "repaid" })}>تسديد</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
