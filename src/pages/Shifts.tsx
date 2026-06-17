import { useState } from "react";
import { useShifts, useEmployees } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Plus, Users, Sun, Moon, Sunrise } from "lucide-react";

const shiftIcons: Record<string, typeof Sun> = {
  "الوردية الصباحية": Sun,
  "الوردية المسائية": Moon,
  "الوردية الليلية": Sunrise,
};

export default function ShiftsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", startTime: "", endTime: "", breakMinutes: "60", days: "السبت-الخميس" });

  const { data: shifts, create } = useShifts();
  const { data: employees } = useEmployees();

  const handleCreate = () => {
    create({
      name: form.name,
      startTime: form.startTime,
      endTime: form.endTime,
      breakMinutes: Number(form.breakMinutes),
      days: form.days,
    });
    setIsDialogOpen(false);
    setForm({ name: "", startTime: "", endTime: "", breakMinutes: "60", days: "السبت-الخميس" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>إدارة الورديات</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>نظام ورديات العمل</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsDialogOpen(true)}>
            <Plus size={16} className="ml-1.5" /> إضافة وردية
          </Button>
          <DialogContent className="theme-card text-white max-w-lg">
            <DialogHeader><DialogTitle className="text-white text-right">وردية جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4 text-right">
              <div className="space-y-2"><Label className="text-white/70">اسم الوردية</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="theme-input text-right" placeholder="مثال: وردية مسائية" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-white/70">بداية العمل</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="theme-input text-right" /></div>
                <div className="space-y-2"><Label className="text-white/70">نهاية العمل</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="theme-input text-right" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-white/70">استراحة (دقيقة)</Label><Input type="number" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })} className="theme-input text-right" /></div>
                <div className="space-y-2"><Label className="text-white/70">أيام العمل</Label><Input value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} className="theme-input text-right" /></div>
              </div>
              <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!form.name || !form.startTime || !form.endTime} onClick={handleCreate}>إضافة</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.map((shift) => {
          const ShiftIcon = shiftIcons[shift.name] || Clock;
          const shiftEmployees = employees.filter((e) => e.shiftId === shift.id);
          return (
            <Card key={shift.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <ShiftIcon size={18} className="text-[#E85D4A]" />
                      <h3 className="text-sm font-semibold text-white">{shift.name}</h3>
                    </div>
                    <p className="text-xs text-white/50 mt-1">{shift.days}</p>
                  </div>
                  <Badge variant="outline" className="badge-active">نشطة</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.08]">
                  <div className="text-center">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>من</p>
                    <p className="text-sm font-semibold text-white">{shift.startTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>إلى</p>
                    <p className="text-sm font-semibold text-white">{shift.endTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>استراحة</p>
                    <p className="text-sm font-semibold text-white">{shift.breakMinutes} د</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-white/50 flex items-center gap-1"><Users size={12} /> {shiftEmployees.length} عامل</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>ساعات: {(() => { const [sh, sm] = shift.startTime.split(":").map(Number); const [eh, em] = shift.endTime.split(":").map(Number); let diff = (eh * 60 + em) - (sh * 60 + sm); if (diff < 0) diff += 24 * 60; return ((diff - shift.breakMinutes) / 60).toFixed(1); })()} س</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Employee Assignment Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-white mb-4 text-right">توزيع العمال على الورديات</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium text-right">الوردية</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">كود الموظف</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الاسم</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">المسمى الوظيفي</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">القسم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.filter((e) => e.shiftId && e.status === "active").map((emp) => {
                  const shift = shifts.find((s) => s.id === emp.shiftId);
                  return (
                    <TableRow key={emp.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell><Badge variant="outline" className="bg-[#4A2C3F]/20 text-white border-[#4A2C3F]/40">{shift?.name || "—"}</Badge></TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{emp.employeeCode}</TableCell>
                      <TableCell className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{emp.fullName}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{emp.jobTitle}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{emp.department?.name || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
