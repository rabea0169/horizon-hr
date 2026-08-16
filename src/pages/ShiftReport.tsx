import { useState, useMemo } from "react";
import { useShifts, useEmployees, useAttendance, useDailyProduction } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToCSV } from "@/lib/export";
import { ClipboardList, Download, Users, Clock, TrendingUp, CalendarDays, Printer } from "lucide-react";

export default function ShiftReportPage() {
  const [selectedShiftId, setSelectedShiftId] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const { data: shifts } = useShifts();
  const { data: employees } = useEmployees();
  const { data: attendance } = useAttendance();
  const { data: dailyProd } = useDailyProduction();


  const shiftEmployees = useMemo(() => {
    let emps = employees.filter((e) => e.status === "active");
    if (selectedShiftId !== "all") {
      emps = emps.filter((e) => e.shiftId === Number(selectedShiftId));
    }
    return emps;
  }, [employees, selectedShiftId]);

  const shiftAttendance = useMemo(() => {
    const empIds = new Set(shiftEmployees.map((e) => e.id));
    return attendance.filter((a) => empIds.has(a.employeeId) && a.date === selectedDate);
  }, [attendance, shiftEmployees, selectedDate]);

  const presentCount = shiftAttendance.filter((a) => a.status === "present" || a.status === "late").length;
  const absentCount = shiftAttendance.filter((a) => a.status === "absent").length;
  // Production by lines associated with shift workers
  const dayProduction = dailyProd.filter((d) => d.date === selectedDate);
  const totalProduced = dayProduction.reduce((sum, d) => sum + d.produced, 0);


  const handleExport = () => {
    exportToCSV(
      `shift_report_${selectedDate}`,
      ["كود الموظف", "الاسم", "المسمى الوظيفي", "القسم", "الوردية", "حالة الحضور", "دخول", "خروج", "الساعات"],
      shiftEmployees.map((emp) => {
        const att = shiftAttendance.find((a) => a.employeeId === emp.id);
        const shift = shifts.find((s) => s.id === emp.shiftId);
        return [
          emp.employeeCode,
          emp.fullName,
          emp.jobTitle,
          emp.department?.name || "—",
          shift?.name || "—",
          att ? (att.status === "present" ? "حاضر" : att.status === "late" ? "متأخر" : att.status === "absent" ? "غائب" : "في إجازة") : "غير مسجل",
          att?.checkIn || "—",
          att?.checkOut || "—",
          att?.hoursWorked || "—",
        ];
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Print header */}
      <div className="print-only hidden text-center mb-4">
        <h1 className="text-xl font-bold text-black">مصنع سليم للملابس الجاهزة</h1>
        <p className="text-lg text-black mt-1">تقرير الوردية - {selectedDate}</p>
        <hr className="my-3 border-gray-300" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>تقرير الوردية</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تقرير يومي لكل وردية: حضور + إنتاج</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={handleExport}><Download size={16} className="ml-1.5" /> تصدير CSV</Button>
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => window.print()}><Printer size={16} className="ml-1.5" /> طباعة</Button>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <CalendarDays size={16} className="text-white/50" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 bg-[#2C2C2E] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm text-right" />
          </div>
          <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
            <SelectTrigger className="flex-1 bg-[#2C2C2E] border-white/[0.08] text-white text-right"><SelectValue placeholder="كل الورديات" /></SelectTrigger>
            <SelectContent className="theme-input">
              <SelectItem value="all" className="text-white text-right">كل الورديات</SelectItem>
              {shifts.map((s) => <SelectItem key={s.id} value={String(s.id)} className="text-white text-right">{s.name} ({s.startTime} - {s.endTime})</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "العمال", value: shiftEmployees.length, icon: Users, color: "text-white" },
          { label: "حاضرون", value: presentCount, icon: Clock, color: "text-green-400" },
          { label: "غائبون", value: absentCount, icon: Clock, color: "text-red-400" },
          { label: "إنتاج اليوم", value: totalProduced, icon: TrendingUp, color: "text-blue-400" },
        ].map((item) => (
          <Card key={item.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <item.icon size={16} className={item.color} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              </div>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="p-4 border-b border-white/[0.08]"><h3 className="text-sm font-semibold text-white text-right flex items-center gap-2"><ClipboardList size={16} className="text-[#E85D4A]" /> سجل الحضور - {selectedDate}</h3></div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium text-right">كود</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الاسم</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">المسمى</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الوردية</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الحالة</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">دخول</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">خروج</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">ساعات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftEmployees.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-white/40"><Users size={32} className="mx-auto mb-3 opacity-50" /><p>لا يوجد عمال في هذه الوردية</p></TableCell></TableRow>
                ) : shiftEmployees.map((emp) => {
                  const att = shiftAttendance.find((a) => a.employeeId === emp.id);
                  const shift = shifts.find((s) => s.id === emp.shiftId);
                  const statusColors: Record<string, string> = { present: "text-green-400", late: "text-yellow-400", absent: "text-red-400", on_leave: "text-blue-400", half_day: "text-orange-400" };
                  const statusLabels: Record<string, string> = { present: "حاضر", late: "متأخر", absent: "غائب", on_leave: "إجازة", half_day: "نصف يوم" };
                  return (
                    <TableRow key={emp.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{emp.employeeCode}</TableCell>
                      <TableCell className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{emp.fullName}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{emp.jobTitle}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{shift?.name || "—"}</TableCell>
                      <TableCell className={`text-sm font-medium ${att ? statusColors[att.status] : "text-white/30"}`}>{att ? statusLabels[att.status] : "غير مسجل"}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{att?.checkIn || "—"}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{att?.checkOut || "—"}</TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{att?.hoursWorked || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Production Summary */}
      {dayProduction.length > 0 && (
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-0">
            <div className="p-4 border-b border-white/[0.08]"><h3 className="text-sm font-semibold text-white text-right flex items-center gap-2"><TrendingUp size={16} className="text-green-400" /> إنتاج اليوم حسب الخط</h3></div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.08] hover:bg-transparent">
                    <TableHead className="text-white/50 font-medium text-right">الخط</TableHead>
                    <TableHead className="text-white/50 font-medium text-right">الأمر</TableHead>
                    <TableHead className="text-white/50 font-medium text-right">المُنتج</TableHead>
                    <TableHead className="text-white/50 font-medium text-right">العيوب</TableHead>
                    <TableHead className="text-white/50 font-medium text-right">نسبة العيوب</TableHead>
                    <TableHead className="text-white/50 font-medium text-right">العاملين</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayProduction.map((d) => {
                    const rate = d.produced > 0 ? ((d.defected / d.produced) * 100).toFixed(1) : "0";
                    return (
                      <TableRow key={d.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{d.lineName}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{d.orderCode}</TableCell>
                        <TableCell className="text-sm font-medium text-green-400">{d.produced}</TableCell>
                        <TableCell className="text-sm text-red-400">{d.defected}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{rate}%</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{d.workersPresent}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
