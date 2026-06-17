import { useState } from "react";
import { useLeaves, useEmployees } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCSV } from "@/lib/export";
import { CalendarDays, Plus, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Download } from "lucide-react";

const leaveTypeLabels: Record<string, string> = { annual: "سنوية", sick: "مرضية", maternity: "وضع", paternity: "أبوة", unpaid: "بدون راتب", emergency: "طارئة", bereavement: "وفاة" };
const statusStyles: Record<string, string> = { pending: "badge-pending", approved: "badge-approved", rejected: "badge-rejected", cancelled: "badge-inactive" };
const statusLabels: Record<string, string> = { pending: "معلقة", approved: "موافق", rejected: "مرفوض", cancelled: "ملغية" };

export default function Leaves() {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", leaveType: "annual" as keyof typeof leaveTypeLabels, startDate: "", endDate: "", reason: "" });

  const { data: leaves, update } = useLeaves();
  const { data: employees } = useEmployees();
  const pageSize = 15;

  const filtered = activeTab === "all" ? leaves : leaves.filter((l) => l.status === activeTab);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = { pending: leaves.filter((l) => l.status === "pending").length, approved: leaves.filter((l) => l.status === "approved").length, rejected: leaves.filter((l) => l.status === "rejected").length };

  const handleCreate = () => {
    const emp = employees.find((e) => e.id === Number(form.employeeId));
    if (!emp || !form.startDate || !form.endDate) return;
    const days = Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const newLeave = { id: Date.now(), employeeId: emp.id, employeeName: emp.fullName, employeeCode: emp.employeeCode, leaveType: form.leaveType, startDate: form.startDate, endDate: form.endDate, days, reason: form.reason, status: "pending" as const };
    const stored = JSON.parse(localStorage.getItem("hr_leaves") || "[]");
    stored.unshift(newLeave);
    localStorage.setItem("hr_leaves", JSON.stringify(stored));
    window.location.reload();
  };

  const handleExport = () => {
    const data = activeTab === "all" ? leaves : leaves.filter((l) => l.status === activeTab);
    exportToCSV("leaves", ["كود", "الاسم", "النوع", "من", "إلى", "الأيام", "السبب", "الحالة"], data.map((l) => [l.employeeCode, l.employeeName, l.leaveType, l.startDate, l.endDate, String(l.days), l.reason || "", l.status]));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>إدارة الإجازات</h2><p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة طلبات إجازات الموظفين</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={handleExport}><Download size={16} className="ml-1.5" /> تصدير</Button>
          <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsDialogOpen(true)}><Plus size={16} className="ml-1.5" />طلب إجازة جديد</Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="theme-card text-white">
          <DialogHeader><DialogTitle className="text-white text-right">طلب إجازة جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 text-right">
            <div className="space-y-2"><Label className="text-white/70">الموظف</Label><Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}><SelectTrigger className="theme-input text-right"><SelectValue placeholder="اختر الموظف" /></SelectTrigger><SelectContent className="theme-input">{employees.filter((e) => e.status === "active").map((e) => <SelectItem key={e.id} value={String(e.id)} className="text-white text-right">{e.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-white/70">نوع الإجازة</Label><Select value={form.leaveType} onValueChange={(v) => setForm({ ...form, leaveType: v as typeof form.leaveType })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{Object.entries(leaveTypeLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-right">{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-white/70">من تاريخ</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="theme-input text-right" /></div><div className="space-y-2"><Label className="text-white/70">إلى تاريخ</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="theme-input text-right" /></div></div>
            <div className="space-y-2"><Label className="text-white/70">السبب</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="theme-input text-right" placeholder="سبب الإجازة..." /></div>
            <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!form.employeeId || !form.startDate || !form.endDate} onClick={handleCreate}>تقديم الطلب</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "معلقة", value: stats.pending, icon: Clock, color: "text-yellow-400" }, { label: "موافق", value: stats.approved, icon: CheckCircle2, color: "text-green-400" }, { label: "مرفوض", value: stats.rejected, icon: XCircle, color: "text-red-400" }].map((s) => { const I = s.icon; return <Card key={s.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-4 flex items-center gap-3"><I size={20} className={s.color} /><div className="text-right"><p className="text-xs text-white/45 uppercase">{s.label}</p><p className="text-xl font-bold text-white">{s.value}</p></div></CardContent></Card>; })}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
        <TabsList className="bg-[#1C1C1E] border border-white/[0.08]"><TabsTrigger value="all" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50">الكل</TabsTrigger><TabsTrigger value="pending" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50">معلقة</TabsTrigger><TabsTrigger value="approved" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50">موافق</TabsTrigger><TabsTrigger value="rejected" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50">مرفوض</TabsTrigger></TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table><TableHeader><TableRow className="border-white/[0.08] hover:bg-transparent"><TableHead className="text-white/50 font-medium text-right">الموظف</TableHead><TableHead className="text-white/50 font-medium text-right">النوع</TableHead><TableHead className="text-white/50 font-medium text-right">الفترة</TableHead><TableHead className="text-white/50 font-medium text-right">الأيام</TableHead><TableHead className="text-white/50 font-medium text-right">الحالة</TableHead><TableHead className="text-white/50 font-medium text-left">إجراءات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paged.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-white/40"><CalendarDays size={32} className="mx-auto mb-3 opacity-50" /><p>لا توجد طلبات إجازات</p></TableCell></TableRow>
                    : paged.map((l) => (
                      <TableRow key={l.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                        <TableCell><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{l.employeeName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{l.employeeCode}</p></TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{leaveTypeLabels[l.leaveType] || l.leaveType}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{new Date(l.startDate).toLocaleDateString("ar-EG")} — {new Date(l.endDate).toLocaleDateString("ar-EG")}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{l.days} يوم</TableCell>
                        <TableCell><Badge variant="outline" className={statusStyles[l.status]}>{statusLabels[l.status]}</Badge></TableCell>
                        <TableCell className="text-left">
                          {l.status === "pending" && <div className="flex items-center justify-start gap-1"><Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-400 hover:bg-green-500/10" onClick={() => update(l.id, { status: "approved" })}><CheckCircle2 size={14} /></Button><Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10" onClick={() => update(l.id, { status: "rejected" })}><XCircle size={14} /></Button></div>}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08]"><p className="text-xs" style={{ color: "var(--text-muted)" }}>صفحة {page} من {totalPages}</p><div className="flex items-center gap-1"><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronRight size={14} /></Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronLeft size={14} /></Button></div></div>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
