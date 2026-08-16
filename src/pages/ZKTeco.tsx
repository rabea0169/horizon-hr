import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fingerprint, Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function ZKTeco() {
  const [connected, setConnected] = useState(true);
  const [deviceIp, setDeviceIp] = useState("192.168.1.201");
  const [port, setPort] = useState("4370");
  
  const todayStr = new Date().toISOString().split("T")[0];

  // Query real database data
  const { data: employeesData } = trpc.employee.list.useQuery();
  const { data: attendanceData, refetch: refetchAttendance, isRefetching } = trpc.attendance.list.useQuery({
    date: todayStr,
  });

  const checkInMut = trpc.attendance.checkIn.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدخول بنجاح");
      refetchAttendance();
    },
  });

  const checkOutMut = trpc.attendance.checkOut.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الخروج بنجاح");
      refetchAttendance();
    },
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [swipeNotes, setSwipeNotes] = useState("بصمة الاصبع ZKTeco");

  const handleConnect = () => {
    setConnected(prev => !prev);
    toast.success(connected ? "تم فصل الجهاز" : "تم الاتصال بجهاز البصمة");
  };

  const handleSync = () => {
    refetchAttendance();
    toast.success("تمت مزامنة السجلات مع قاعدة البيانات");
  };

  const handleSimulatorCheckIn = () => {
    if (!selectedEmployeeId) {
      toast.error("يرجى اختيار موظف للمحاكاة");
      return;
    }
    checkInMut.mutate({
      employeeId: Number(selectedEmployeeId),
      date: todayStr,
      status: "present",
      notes: swipeNotes,
    });
  };

  const handleSimulatorCheckOut = (recordId: number) => {
    checkOutMut.mutate({ id: recordId });
  };

  const logs = attendanceData?.attendance ?? [];
  const employees = employeesData?.employees ?? [];

  const presentCount = logs.filter(l => l.status === "present" || l.status === "late").length;
  const lateCount = logs.filter(l => l.status === "late").length;
  const absentCount = logs.filter(l => l.status === "absent").length;

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-sans text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">تكامل جهاز البصمة ZKTeco</h2>
        <Badge variant="outline" className={connected ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}>
          {connected ? <Wifi size={12} className="ml-1" /> : <WifiOff size={12} className="ml-1" />} 
          {connected ? "متصل" : "غير متصل"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Device Config */}
        <Card className="border md:col-span-2" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold flex items-center gap-2 justify-end"><Fingerprint size={16} style={{ color: "var(--accent-color)" }} /> إعدادات اتصال الجهاز</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>IP الجهاز</Label><input value={deviceIp} onChange={e => setDeviceIp(e.target.value)} className="w-full text-center h-9 rounded-md border text-sm" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>المنفذ</Label><input value={port} onChange={e => setPort(e.target.value)} className="w-full text-center h-9 rounded-md border text-sm" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>الموديل</Label>
                <Select defaultValue="iface800">
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    <SelectItem value="iface800">iFace800</SelectItem>
                    <SelectItem value="k40">K40 Pro</SelectItem>
                    <SelectItem value="uface800">uFace800</SelectItem>
                    <SelectItem value="g3">G3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-start pt-2">
              <Button className="gap-1 text-white" style={{ background: connected ? "#2D6B5E" : "var(--accent-color)" }} onClick={handleConnect}>
                {connected ? <CheckCircle size={14} /> : <Wifi size={14} />} {connected ? "فصل الاتصال" : "اتصال"}
              </Button>
              <Button variant="outline" className="gap-1" disabled={!connected || isRefetching} onClick={handleSync}>
                <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} /> مزامنة السجلات {isRefetching && "..."}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hardware Simulator Tool */}
        <Card className="border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold flex items-center gap-2 justify-end text-amber-400"><Fingerprint size={16} /> محاكاة تمرير الكارت</h3>
            <div className="space-y-2 text-right">
              <Label>اختر الموظف</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={String(emp.id)}>{emp.fullName} ({emp.employeeCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ملاحظة تمرير الكارت</Label>
              <input value={swipeNotes} onChange={e => setSwipeNotes(e.target.value)} className="w-full text-right h-9 rounded-md border text-sm px-2" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
            <Button className="w-full text-white bg-amber-600 hover:bg-amber-700 mt-2" disabled={!connected} onClick={handleSimulatorCheckIn}>
              <ArrowUpRight size={14} className="ml-1" /> تسجيل حضور (Check-In)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-2xl font-bold text-emerald-400">{presentCount}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>حاضرين</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-2xl font-bold text-yellow-400">{lateCount}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>متأخرين</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-2xl font-bold text-red-400">{absentCount}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>غائبين</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-2xl font-bold">{logs.length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الحركات</p></CardContent></Card>
      </div>

      {/* Logs Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <div className="flex justify-between mb-3 items-center">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>تاريخ اليوم: {todayStr}</span>
            <h3 className="font-bold">سجلات الحضور الفعلية المتلقاة</h3>
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">وقت الدخول</TableHead>
                  <TableHead className="text-right">وقت الخروج</TableHead>
                  <TableHead className="text-right">ملاحظات البصمة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>لا توجد سجلات حضور اليوم بعد.</TableCell>
                  </TableRow>
                ) : (
                  logs.map(l => {
                    const isCheckedOut = !!l.checkOut;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs text-right">{l.employee?.employeeCode || "—"}</TableCell>
                        <TableCell className="text-right">{l.employee?.fullName || "—"}</TableCell>
                        <TableCell className="text-right">{l.checkIn ? new Date(l.checkIn).toLocaleTimeString("ar-EG") : "—"}</TableCell>
                        <TableCell className="text-right">{l.checkOut ? new Date(l.checkOut).toLocaleTimeString("ar-EG") : "—"}</TableCell>
                        <TableCell className="text-right text-xs" style={{ color: "var(--text-muted)" }}>{l.notes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={l.status === "present" ? "bg-emerald-500/15 text-emerald-400" : l.status === "late" ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}>
                            {l.status === "present" ? "حاضر" : l.status === "late" ? "متأخر" : "غائب"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          {!isCheckedOut && (
                            <Button size="sm" variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10 gap-1" onClick={() => handleSimulatorCheckOut(l.id)}>
                              <ArrowDownLeft size={12} /> خروج (Check-Out)
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Auto Rules */}
      <Card style={{ background: "rgba(45,107,94,0.08)", borderColor: "#2D6B5E" }}>
        <CardContent className="p-4">
          <h3 className="font-bold mb-2 flex items-center gap-2 justify-end"><AlertTriangle size={16} className="text-yellow-400" /> قواعد حساب التأخير والغياب</h3>
          <div className="text-sm space-y-1 text-right" style={{ color: "var(--text-primary)" }}>
            <p>• الدخول قبل 8:00 = <span className="text-emerald-400">حاضر</span></p>
            <p>• الدخول بعد 8:05 = <span className="text-yellow-400">متأخر</span> (خصم 1/8 يوم)</p>
            <p>• عدم التسجيل = <span className="text-red-400">غائب</span> (يوم كامل)</p>
            <p>• التسجيل مرة واحدة فقط = <span className="text-yellow-400">غياب نصفي</span></p>
            <p>• 3 أيام غياب متتالية = <span className="text-red-400">تنبيه HR تلقائي</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
