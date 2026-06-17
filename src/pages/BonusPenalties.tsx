import { useState } from "react";
import { useBonusPenalties, useEmployees, type BonusPenalty } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";

const categoryLabels: Record<string, string> = {
  attendance: "حضور",
  production: "إنتاج",
  quality: "جودة",
  behavior: "سلوك",
  overtime: "عمل إضافي",
  other: "أخرى",
};

const categoryColors: Record<string, string> = {
  attendance: "bg-blue-500/20 text-blue-400",
  production: "bg-green-500/20 text-green-400",
  quality: "bg-purple-500/20 text-purple-400",
  behavior: "bg-yellow-500/20 text-yellow-400",
  overtime: "bg-orange-500/20 text-orange-400",
  other: "bg-white/[0.04] text-white/60",
};

export default function BonusPenaltiesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "bonus" as "bonus" | "penalty", amount: "", reason: "", category: "production" as BonusPenalty["category"] });

  const { data: records, create, remove } = useBonusPenalties();
  const { data: employees } = useEmployees();

  const totalBonuses = records.filter((r) => r.type === "bonus").reduce((sum, r) => sum + Number(r.amount), 0);
  const totalPenalties = records.filter((r) => r.type === "penalty").reduce((sum, r) => sum + Number(r.amount), 0);

  const handleCreate = () => {
    const emp = employees.find((e) => e.id === Number(form.employeeId));
    if (!emp) return;
    create({
      employeeId: Number(form.employeeId),
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      type: form.type,
      amount: form.amount,
      date: new Date().toISOString().split("T")[0],
      reason: form.reason,
      category: form.category,
    });
    setIsDialogOpen(false);
    setForm({ employeeId: "", type: "bonus", amount: "", reason: "", category: "production" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>المكافآت والخصومات</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة مكافآت وخصومات العمال</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsDialogOpen(true)}>
            <Plus size={16} className="ml-1.5" /> إضافة سجل
          </Button>
          <DialogContent className="theme-card text-white max-w-lg">
            <DialogHeader><DialogTitle className="text-white text-right">مكافأة أو خصم جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4 text-right">
              <div className="space-y-2"><Label className="text-white/70">الموظف</Label><Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}><SelectTrigger className="theme-input text-right"><SelectValue placeholder="اختر الموظف" /></SelectTrigger><SelectContent className="theme-input">{employees.filter((e) => e.status === "active").map((e) => <SelectItem key={e.id} value={String(e.id)} className="text-white text-right">{e.fullName} - {e.employeeCode}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-white/70">النوع</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "bonus" | "penalty" })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input"><SelectItem value="bonus" className="text-white text-right">مكافأة</SelectItem><SelectItem value="penalty" className="text-white text-right">خصم</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-white/70">المبلغ (جنيه)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="theme-input text-right" /></div>
              </div>
              <div className="space-y-2"><Label className="text-white/70">التصنيف</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as BonusPenalty["category"] })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{Object.entries(categoryLabels).map(([k, l]) => <SelectItem key={k} value={k} className="text-white text-right">{l}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-white/70">السبب</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="theme-input text-right" /></div>
              <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!form.employeeId || !form.amount} onClick={handleCreate}>إضافة</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <TrendingUp size={18} className="text-green-400" />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي المكافآت</p>
            </div>
            <p className="text-2xl font-bold text-green-400 mt-1">{totalBonuses.toLocaleString()} ج</p>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 text-right">
            <div className="flex items-center justify-between">
              <TrendingDown size={18} className="text-red-400" />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الخصومات</p>
            </div>
            <p className="text-2xl font-bold text-red-400 mt-1">{totalPenalties.toLocaleString()} ج</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium text-right">الموظف</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">النوع</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">المبلغ</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">التصنيف</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">السبب</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">التاريخ</TableHead>
                  <TableHead className="text-white/50 font-medium text-left">حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-white/40">
                      <Award size={32} className="mx-auto mb-3 opacity-50" />
                      <p>لا توجد سجلات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.sort((a, b) => b.date.localeCompare(a.date)).map((record) => (
                    <TableRow key={record.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{record.employeeName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{record.employeeCode}</p></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={record.type === "bonus" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                          {record.type === "bonus" ? "مكافأة" : "خصم"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-sm font-semibold ${record.type === "bonus" ? "text-green-400" : "text-red-400"}`}>
                        {record.type === "bonus" ? "+" : "-"}{Number(record.amount).toLocaleString()} ج
                      </TableCell>
                      <TableCell><span className={`px-2 py-0.5 rounded text-xs ${categoryColors[record.category]}`}>{categoryLabels[record.category]}</span></TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.reason}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-muted)" }}>{record.date}</TableCell>
                      <TableCell className="text-left"><Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(record.id)}><Trash2 size={14} /></Button></TableCell>
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
