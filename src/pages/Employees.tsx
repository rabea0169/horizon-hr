import { useState } from "react";
import { useEmployees, useDepartments } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { exportToCSV } from "@/lib/export";
import { Search, Plus, Pencil, Trash2, Users, ChevronLeft, ChevronRight, Download } from "lucide-react";

const statusStyles: Record<string, string> = { active: "badge-active", on_leave: "badge-on-leave", inactive: "badge-inactive", terminated: "badge-terminated" };
const statusLabels: Record<string, string> = { active: "نشط", on_leave: "في إجازة", inactive: "غير نشط", terminated: "منتهي الخدمة" };
const empTypeLabels: Record<string, string> = { full_time: "دوام كامل", part_time: "دوام جزئي", contract: "عقد", intern: "متدرب" };
const salaryTypeLabels: Record<string, string> = { monthly: "شهري", piece_rate: "قطعة", mixed: "مدمج" };
const salaryTypeStyles: Record<string, string> = { monthly: "bg-blue-500/15 text-blue-400 border-blue-500/20", piece_rate: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", mixed: "bg-amber-500/15 text-amber-400 border-amber-500/20" };

export default function Employees() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ employeeCode: string; fullName: string; email: string; phone: string; departmentId: string; role: string; jobTitle: string; joinDate: string; salary: string; status: string; employmentType: string; salaryType: string }>({ employeeCode: "", fullName: "", email: "", phone: "", departmentId: "", role: "", jobTitle: "", joinDate: "", salary: "", status: "active", employmentType: "full_time", salaryType: "monthly" });

  const { data: employees, create, update, remove } = useEmployees();
  const { data: departments } = useDepartments();

  const pageSize = 10;
  const filtered = employees.filter((e) => {
    const matchSearch = !search || e.fullName.includes(search) || e.email.includes(search) || e.employeeCode.includes(search);
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const reset = () => { setForm({ employeeCode: "", fullName: "", email: "", phone: "", departmentId: "", role: "", jobTitle: "", joinDate: "", salary: "", status: "active", employmentType: "full_time", salaryType: "monthly" }); setEditingId(null); };

  const handleEdit = (emp: typeof employees[0]) => {
    setForm({ employeeCode: emp.employeeCode, fullName: emp.fullName, email: emp.email, phone: emp.phone || "", departmentId: emp.departmentId ? String(emp.departmentId) : "", role: emp.role, jobTitle: emp.jobTitle, joinDate: emp.joinDate, salary: emp.salary || "", status: emp.status, employmentType: emp.employmentType, salaryType: emp.salaryType || "monthly" });
    setEditingId(emp.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, departmentId: form.departmentId ? Number(form.departmentId) : undefined, salary: form.salary || undefined };
    if (editingId) { update(editingId, payload); }
    else { create({ ...payload, departmentId: payload.departmentId, salary: payload.salary, avatar: undefined }); }
    setIsDialogOpen(false);
    reset();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>الموظفين</h2><p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة بيانات الموظفين</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => { exportToCSV("employees", ["كود", "الاسم", "البريد", "الهاتف", "المسمى", "القسم", "الحالة", "نوع التوظيف", "نوع الراتب", "الراتب", "تاريخ الانضمام"], filtered.map((e) => [e.employeeCode, e.fullName, e.email, e.phone || "", e.jobTitle, departments.find((d) => d.id === e.departmentId)?.name || "", e.status, e.employmentType, salaryTypeLabels[e.salaryType || "monthly"], e.salary || "", e.joinDate])); }}><Download size={16} className="ml-1.5" /> تصدير</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={reset}><Plus size={16} className="ml-1.5" />إضافة موظف</Button></DialogTrigger>
          <DialogContent className="theme-card text-white max-w-lg max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle className="text-white text-right">{editingId ? "تعديل موظف" : "إضافة موظف"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-right">
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-white/70">كود الموظف</Label><Input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} className="theme-input text-right" required /></div><div className="space-y-2"><Label className="text-white/70">الاسم الكامل</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="theme-input text-right" required /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-white/70">البريد الإلكتروني</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="theme-input text-right" required /></div><div className="space-y-2"><Label className="text-white/70">رقم الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="theme-input text-right" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-white/70">القسم</Label><Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}><SelectTrigger className="theme-input text-right"><SelectValue placeholder="اختر القسم" /></SelectTrigger><SelectContent className="theme-input">{departments.map((d) => <SelectItem key={d.id} value={String(d.id)} className="text-white text-right">{d.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label className="text-white/70">المسمى الوظيفي</Label><Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="theme-input text-right" required /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label className="text-white/70">الدور</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="theme-input text-right" required /></div><div className="space-y-2"><Label className="text-white/70">تاريخ الانضمام</Label><Input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} className="theme-input text-right" required /></div></div>
              <div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label className="text-white/70">الراتب</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="theme-input text-right" /></div><div className="space-y-2"><Label className="text-white/70">نوع التوظيف</Label><Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v as typeof form.employmentType })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{Object.entries(empTypeLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-right">{v}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label className="text-white/70">نوع الراتب</Label><Select value={form.salaryType} onValueChange={(v) => setForm({ ...form, salaryType: v as typeof form.salaryType })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{Object.entries(salaryTypeLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-right">{v}</SelectItem>)}</SelectContent></Select></div></div>
              <div className="space-y-2"><Label className="text-white/70">الحالة</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-right">{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button><Button type="submit" className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white">{editingId ? "تحديث" : "حفظ"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm"><Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" /><Input placeholder="بحث في الموظفين..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pr-9 bg-[#1C1C1E] border-white/[0.08] text-white text-right" /></div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}><SelectTrigger className="w-40 bg-[#1C1C1E] border-white/[0.08] text-white text-right"><SelectValue placeholder="الحالة" /></SelectTrigger><SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><SelectItem value="all" className="text-white text-right">جميع الحالات</SelectItem>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-white text-right">{v}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table><TableHeader><TableRow className="border-white/[0.08] hover:bg-transparent"><TableHead className="text-white/50 font-medium text-right">الموظف</TableHead><TableHead className="text-white/50 font-medium text-right">القسم</TableHead><TableHead className="text-white/50 font-medium text-right">المسمى الوظيفي</TableHead><TableHead className="text-white/50 font-medium text-right">الحالة</TableHead><TableHead className="text-white/50 font-medium text-right">نوع الراتب</TableHead><TableHead className="text-white/50 font-medium text-right">تاريخ الانضمام</TableHead><TableHead className="text-white/50 font-medium text-left">إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {paged.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-white/40"><Users size={32} className="mx-auto mb-3 opacity-50" /><p>لا يوجد موظفين</p></TableCell></TableRow>
                : paged.map((emp) => (
                  <TableRow key={emp.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <TableCell><div className="flex items-center gap-3"><Avatar className="w-8 h-8"><AvatarFallback className="bg-[#4A2C3F] text-white text-xs">{(emp.fullName || "").charAt(0)}</AvatarFallback></Avatar><div className="text-right"><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{emp.fullName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{emp.employeeCode}</p></div></div></TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{departments.find((d) => d.id === emp.departmentId)?.name || "—"}</TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{emp.jobTitle}</TableCell>
                    <TableCell><Badge variant="outline" className={statusStyles[emp.status]}>{statusLabels[emp.status]}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={salaryTypeStyles[emp.salaryType || "monthly"]}>{salaryTypeLabels[emp.salaryType || "monthly"]}</Badge></TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-muted)" }}>{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString("ar-EG") : "—"}</TableCell>
                    <TableCell className="text-left"><div className="flex items-center justify-start gap-1"><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40 hover:text-white" onClick={() => handleEdit(emp)}><Pencil size={14} /></Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40 hover:text-red-400 hover:bg-red-500/10" onClick={() => { if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) remove(emp.id); }}><Trash2 size={14} /></Button></div></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08]"><p className="text-xs" style={{ color: "var(--text-muted)" }}>صفحة {page} من {totalPages}</p><div className="flex items-center gap-1"><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronLeft size={14} /></Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronRight size={14} /></Button></div></div>}
      </CardContent></Card>
    </div>
  );
}