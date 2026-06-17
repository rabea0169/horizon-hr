import { useState } from "react";
import { useAttendance, useEmployees, type AttendancePermission, type AttendanceRecord } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, UserCheck, UserX, CalendarClock, LogIn, LogOut, CheckCircle2, ChevronLeft, ChevronRight, Pencil, Sandwich, Stethoscope, AlertCircle, Coffee } from "lucide-react";

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  present: { label: "حاضر", className: "badge-present", icon: UserCheck },
  late: { label: "متأخر", className: "badge-late", icon: Clock },
  absent: { label: "غائب", className: "badge-absent", icon: UserX },
  on_leave: { label: "في إجازة", className: "bg-blue-500/20 text-blue-400", icon: CalendarClock },
  half_day: { label: "نصف يوم", className: "bg-purple-500/20 text-purple-400", icon: Clock },
};

const permissionTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  lunch: { label: "غداء", icon: Sandwich, color: "text-amber-400 bg-amber-500/10" },
  emergency: { label: "طارئ", icon: AlertCircle, color: "text-red-400 bg-red-500/10" },
  personal: { label: "شخصي", icon: Coffee, color: "text-blue-400 bg-blue-500/10" },
  medical: { label: "طبي", icon: Stethoscope, color: "text-emerald-400 bg-emerald-500/10" },
  other: { label: "آخر", icon: Clock, color: "text-gray-400 bg-gray-500/10" },
};

function formatTime(t?: string) {
  if (!t) return "—";
  return t;
}

function calcDuration(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [page, setPage] = useState(1);
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [checkInData, setCheckInData] = useState({
    employeeId: "",
    status: "present" as "present" | "late" | "absent" | "on_leave" | "half_day",
    manualCheckIn: "",
    manualCheckOut: "",
    isManual: false,
  });

  // Permission dialog
  const [permDialog, setPermDialog] = useState(false);
  const [permData, setPermData] = useState({
    recordId: 0,
    type: "lunch" as AttendancePermission["type"],
    startTime: "",
    endTime: "",
    note: "",
  });

  // Edit dialog for manual entry
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    recordId: 0,
    manualCheckIn: "",
    manualCheckOut: "",
  });

  const { data: attendanceRecords, save } = useAttendance();
  const { data: employees } = useEmployees();
  const pageSize = 20;

  const filtered = attendanceRecords.filter((a) => a.date === selectedDate);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const todayPresent = filtered.filter((a) => a.status === "present" || a.status === "late").length;
  const todayLate = filtered.filter((a) => a.status === "late").length;
  const todayAbsent = filtered.filter((a) => a.status === "absent").length;
  const todayOnLeave = filtered.filter((a) => a.status === "on_leave").length;

  const handleBulkMark = (status: "present" | "absent") => {
    const activeEmps = employees.filter((e) => e.status === "active");
    const existingIds = new Set(filtered.map((a) => a.employeeId));
    const newRecords = activeEmps.filter((e) => !existingIds.has(e.id)).map((e) => ({
      id: Date.now() + e.id,
      employeeId: e.id,
      employeeName: e.fullName,
      employeeCode: e.employeeCode,
      date: selectedDate,
      status,
      checkIn: status === "present" ? "08:00" : undefined,
      checkOut: status === "present" ? "16:00" : undefined,
      hoursWorked: status === "present" ? "8" : undefined,
    }));
    if (newRecords.length > 0) save([...attendanceRecords, ...newRecords]);
  };

  const handleCheckIn = () => {
    const emp = employees.find((e) => e.id === Number(checkInData.employeeId));
    if (!emp) return;

    const record: Record<string, unknown> = {
      id: Date.now(),
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      date: selectedDate,
      status: checkInData.status,
    };

    if (checkInData.isManual && checkInData.manualCheckIn) {
      record.manualEntry = true;
      record.manualCheckIn = checkInData.manualCheckIn;
      record.checkIn = checkInData.manualCheckIn;
      if (checkInData.manualCheckOut) {
        record.manualCheckOut = checkInData.manualCheckOut;
        record.checkOut = checkInData.manualCheckOut;
        // Calculate hours
        const mins = calcDuration(checkInData.manualCheckIn, checkInData.manualCheckOut);
        const perms = record.permissions as AttendancePermission[] || [];
        const permMins = perms.reduce((acc: number, p: AttendancePermission) => acc + p.duration, 0);
        const netMins = Math.max(0, mins - permMins);
        record.hoursWorked = (netMins / 60).toFixed(1);
      }
    } else {
      record.checkIn = "08:00";
    }

    save([...attendanceRecords.filter((a) => !(a.employeeId === emp.id && a.date === selectedDate)), record as AttendanceRecord]);
    setCheckInDialog(false);
    setCheckInData({ employeeId: "", status: "present", manualCheckIn: "", manualCheckOut: "", isManual: false });
  };

  const handleCheckOut = (id: number) => {
    save(attendanceRecords.map((a) => {
      if (a.id !== id) return a;
      const checkOut = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const checkIn = a.manualCheckIn || a.checkIn || "08:00";
      const mins = calcDuration(checkIn, checkOut);
      const permMins = (a.permissions || []).reduce((acc, p) => acc + p.duration, 0);
      const netMins = Math.max(0, mins - permMins);
      return { ...a, checkOut, manualCheckOut: a.manualEntry ? checkOut : undefined, hoursWorked: (netMins / 60).toFixed(1) };
    }));
  };

  const openPermissionDialog = (recordId: number) => {
    setPermData({ recordId, type: "lunch", startTime: "12:00", endTime: "13:00", note: "" });
    setPermDialog(true);
  };

  const handleAddPermission = () => {
    if (!permData.startTime || !permData.endTime) return;
    const duration = calcDuration(permData.startTime, permData.endTime);
    if (duration <= 0) return;

    const permission: AttendancePermission = {
      id: Date.now(),
      type: permData.type,
      startTime: permData.startTime,
      endTime: permData.endTime,
      duration,
      note: permData.note,
    };

    save(attendanceRecords.map((a) => {
      if (a.id !== permData.recordId) return a;
      const perms = [...(a.permissions || []), permission];
      // Recalculate hours if checkout exists
      let hoursWorked = a.hoursWorked;
      const checkIn = a.manualCheckIn || a.checkIn;
      const checkOut = a.manualCheckOut || a.checkOut;
      if (checkIn && checkOut) {
        const totalMins = calcDuration(checkIn, checkOut);
        const permMins = perms.reduce((acc, p) => acc + p.duration, 0);
        hoursWorked = (Math.max(0, totalMins - permMins) / 60).toFixed(1);
      }
      return { ...a, permissions: perms, hoursWorked };
    }));
    setPermDialog(false);
  };

  const removePermission = (recordId: number, permId: number) => {
    save(attendanceRecords.map((a) => {
      if (a.id !== recordId) return a;
      const perms = (a.permissions || []).filter((p) => p.id !== permId);
      let hoursWorked = a.hoursWorked;
      const checkIn = a.manualCheckIn || a.checkIn;
      const checkOut = a.manualCheckOut || a.checkOut;
      if (checkIn && checkOut) {
        const totalMins = calcDuration(checkIn, checkOut);
        const permMins = perms.reduce((acc, p) => acc + p.duration, 0);
        hoursWorked = (Math.max(0, totalMins - permMins) / 60).toFixed(1);
      }
      return { ...a, permissions: perms, hoursWorked };
    }));
  };

  const openEditDialog = (record: AttendanceRecord) => {
    setEditData({
      recordId: record.id,
      manualCheckIn: record.manualCheckIn || record.checkIn || "",
      manualCheckOut: record.manualCheckOut || record.checkOut || "",
    });
    setEditDialog(true);
  };

  const handleSaveEdit = () => {
    save(attendanceRecords.map((a) => {
      if (a.id !== editData.recordId) return a;
      const updated: Record<string, unknown> = { ...a, manualEntry: true };
      if (editData.manualCheckIn) {
        updated.manualCheckIn = editData.manualCheckIn;
        updated.checkIn = editData.manualCheckIn;
      }
      if (editData.manualCheckOut) {
        updated.manualCheckOut = editData.manualCheckOut;
        updated.checkOut = editData.manualCheckOut;
      }
      // Recalculate hours
      const cin = (updated.manualCheckIn || updated.checkIn) as string;
      const cout = (updated.manualCheckOut || updated.checkOut) as string;
      if (cin && cout) {
        const totalMins = calcDuration(cin, cout);
        const permMins = ((updated.permissions as AttendancePermission[]) || []).reduce((acc: number, p: AttendancePermission) => acc + p.duration, 0);
        updated.hoursWorked = (Math.max(0, totalMins - permMins) / 60).toFixed(1);
      }
      return updated as AttendanceRecord;
    }));
    setEditDialog(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>الحضور والانصراف</h2><p className="text-sm" style={{ color: "var(--text-muted)" }}>تتبع سجلات الحضور اليومية — إدخال يدوي واستئذان</p></div>
        <div className="flex items-center gap-3">
          <Input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }} className="w-40" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          <Button size="sm" variant="outline" onClick={() => { setSelectedDate(new Date().toISOString().split("T")[0]); setPage(1); }} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>اليوم</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "حاضر", value: todayPresent, icon: UserCheck, color: "text-green-400 bg-green-500/10" },
          { label: "متأخر", value: todayLate, icon: Clock, color: "text-yellow-400 bg-yellow-500/10" },
          { label: "غائب", value: todayAbsent, icon: UserX, color: "text-red-400 bg-red-500/10" },
          { label: "في إجازة", value: todayOnLeave, icon: CalendarClock, color: "text-blue-400 bg-blue-500/10" },
        ].map((s) => { const I = s.icon; return (
          <Card key={s.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}><I size={18} /></div>
              </div>
            </CardContent>
          </Card>
        ); })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-2">
          <Button size="sm" className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/20" onClick={() => handleBulkMark("present")}><CheckCircle2 size={14} className="ml-1.5" />تسجيل الكل حاضر</Button>
          <Button size="sm" className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/20" onClick={() => handleBulkMark("absent")}><UserX size={14} className="ml-1.5" />تسجيل الكل غائب</Button>
        </div>
        <Button size="sm" className="mr-auto gap-1 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setCheckInData({ employeeId: "", status: "present", manualCheckIn: "", manualCheckOut: "", isManual: false }); setCheckInDialog(true); }}>
          <LogIn size={14} /> تسجيل دخول يدوي
        </Button>
      </div>

      {/* Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الموظف</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحضور</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الانصراف</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحالة</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الساعات</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الاستئذان</TableHead>
                  <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                      <Clock size={32} className="mx-auto mb-3 opacity-50" /><p>لا توجد سجلات حضور لهذا اليوم</p>
                    </TableCell>
                  </TableRow>
                ) : paged.map((r) => {
                  const s = statusConfig[r.status];
                  const I = s?.icon || Clock;
                  const perms = r.permissions || [];
                  return (
                    <TableRow key={r.id} style={{ borderColor: "var(--border-color)" }}>
                      <TableCell>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.employeeName}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.employeeCode}</p>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {r.manualEntry && <Badge variant="outline" className="text-[9px] ml-1 bg-purple-500/10 text-purple-400 border-purple-500/20">يدوي</Badge>}
                        {formatTime(r.checkIn)}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatTime(r.checkOut)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s?.className || "badge-present"}><I size={10} className="ml-1" />{s?.label || r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.hoursWorked || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {perms.length === 0 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>}
                          {perms.map((p) => {
                            const pc = permissionTypeConfig[p.type];
                            const PI = pc?.icon || Clock;
                            return (
                              <Badge key={p.id} variant="outline" className={`text-[9px] gap-0.5 ${pc?.color || ""}`}>
                                <PI size={8} />
                                {pc?.label} {p.startTime}-{p.endTime}
                                <button onClick={() => removePermission(r.id, p.id)} className="mr-0.5 hover:text-red-400"><span className="text-red-400">×</span></button>
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" style={{ color: "var(--accent-color)" }} onClick={() => openPermissionDialog(r.id)}>
                            <Coffee size={12} /> استئذان
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" style={{ color: "var(--text-muted)" }} onClick={() => openEditDialog(r)}>
                            <Pencil size={12} />
                          </Button>
                          {!r.checkOut && r.checkIn && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-[#E85D4A] hover:bg-[#E85D4A]/10 gap-1" onClick={() => handleCheckOut(r.id)}>
                              <LogOut size={12} /> خروج
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border-color)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>صفحة {page} من {totalPages}</p>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" style={{ color: "var(--text-muted)" }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronRight size={14} /></Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" style={{ color: "var(--text-muted)" }} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronLeft size={14} /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
        <DialogContent className="max-w-md" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle className="text-right" style={{ color: "var(--text-primary)" }}>تسجيل دخول يدوي</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 text-right">
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>الموظف</Label>
              <Select value={checkInData.employeeId} onValueChange={(v) => setCheckInData({ ...checkInData, employeeId: v })}>
                <SelectTrigger className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  {employees.filter((e) => e.status === "active").map((e) => <SelectItem key={e.id} value={String(e.id)} className="text-right">{e.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>الحالة</Label>
              <Select value={checkInData.status} onValueChange={(v) => setCheckInData({ ...checkInData, status: v as typeof checkInData.status })}>
                <SelectTrigger className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <SelectItem value="present" className="text-right">حاضر</SelectItem>
                  <SelectItem value="late" className="text-right">متأخر</SelectItem>
                  <SelectItem value="absent" className="text-right">غائب</SelectItem>
                  <SelectItem value="on_leave" className="text-right">في إجازة</SelectItem>
                  <SelectItem value="half_day" className="text-right">نصف يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Manual toggle */}
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "var(--bg-primary)" }}>
              <input
                type="checkbox"
                id="manualCheck"
                checked={checkInData.isManual}
                onChange={(e) => setCheckInData({ ...checkInData, isManual: e.target.checked })}
                className="w-4 h-4 accent-[#4A2C3F]"
              />
              <Label htmlFor="manualCheck" style={{ color: "var(--text-primary)" }}>إدخال يدوي لساعات الحضور والانصراف</Label>
            </div>
            {checkInData.isManual && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label style={{ color: "var(--text-secondary)" }}>ساعة الحضور</Label>
                  <Input type="time" value={checkInData.manualCheckIn} onChange={(e) => setCheckInData({ ...checkInData, manualCheckIn: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: "var(--text-secondary)" }}>ساعة الانصراف</Label>
                  <Input type="time" value={checkInData.manualCheckOut} onChange={(e) => setCheckInData({ ...checkInData, manualCheckOut: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCheckInDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
              <Button className="flex-1 text-white" style={{ background: "var(--accent-color)" }} disabled={!checkInData.employeeId} onClick={handleCheckIn}>تسجيل</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={permDialog} onOpenChange={setPermDialog}>
        <DialogContent className="max-w-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle className="text-right" style={{ color: "var(--text-primary)" }}>إضافة استئذان</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 text-right">
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>نوع الاستئذان</Label>
              <Select value={permData.type} onValueChange={(v) => setPermData({ ...permData, type: v as AttendancePermission["type"] })}>
                <SelectTrigger className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <SelectItem value="lunch" className="text-right">غداء</SelectItem>
                  <SelectItem value="emergency" className="text-right">طارئ</SelectItem>
                  <SelectItem value="personal" className="text-right">شخصي</SelectItem>
                  <SelectItem value="medical" className="text-right">طبي</SelectItem>
                  <SelectItem value="other" className="text-right">آخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>من وقت</Label>
                <Input type="time" value={permData.startTime} onChange={(e) => setPermData({ ...permData, startTime: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>إلى وقت</Label>
                <Input type="time" value={permData.endTime} onChange={(e) => setPermData({ ...permData, endTime: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>ملاحظة</Label>
              <Input value={permData.note} onChange={(e) => setPermData({ ...permData, note: e.target.value })} placeholder="اختياري" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
              <Button onClick={handleAddPermission} className="text-white" style={{ background: "var(--accent-color)" }}>إضافة</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle className="text-right" style={{ color: "var(--text-primary)" }}>تعديل ساعات الحضور/الانصراف</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 text-right">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>ساعة الحضور</Label>
                <Input type="time" value={editData.manualCheckIn} onChange={(e) => setEditData({ ...editData, manualCheckIn: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>ساعة الانصراف</Label>
                <Input type="time" value={editData.manualCheckOut} onChange={(e) => setEditData({ ...editData, manualCheckOut: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
              <Button onClick={handleSaveEdit} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
