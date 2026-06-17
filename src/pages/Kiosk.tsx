import { useState, useEffect, useRef } from "react";
import { useEmployees, useAttendance } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { LogIn, LogOut, UserCheck, Clock, CheckCircle, AlertCircle, ScanLine, Keyboard } from "lucide-react";

export default function KioskPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [showEmployeeQR, setShowEmployeeQR] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: employees } = useEmployees();
  const { data: attendance, save: saveAttendance } = useAttendance();

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const findTodayRecord = (empId: number) => attendance.find((a) => a.employeeId === empId && a.date === today);

  // Auto-focus input in scan mode
  useEffect(() => {
    if (mode === "scan" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, message]);

  const handleCheckIn = () => {
    const emp = employees.find((e) => e.employeeCode.toLowerCase() === code.toLowerCase());
    if (!emp) {
      setMessage({ text: "كود غير صحيح!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const existing = findTodayRecord(emp.id);
    if (existing?.checkIn) {
      setMessage({ text: `سبق التسجيل: ${emp.fullName} دخل ${existing.checkIn}`, type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (existing) {
      const updated = attendance.map((a) => a.id === existing.id ? { ...a, checkIn: timeStr, status: "present" as const } : a);
      saveAttendance(updated);
    } else {
      saveAttendance([...attendance, {
        id: Date.now(),
        employeeId: emp.id,
        employeeName: emp.fullName,
        employeeCode: emp.employeeCode,
        date: today,
        checkIn: timeStr,
        status: "present",
      }]);
    }
    setMessage({ text: `✓ دخول: ${emp.fullName} - ${timeStr}`, type: "success" });
    setCode("");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCheckOut = () => {
    const emp = employees.find((e) => e.employeeCode.toLowerCase() === code.toLowerCase());
    if (!emp) {
      setMessage({ text: "كود غير صحيح!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const existing = findTodayRecord(emp.id);
    if (!existing || !existing.checkIn) {
      setMessage({ text: "لم يتم تسجيل الدخول!", type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (existing.checkOut) {
      setMessage({ text: `سبق التسجيل: ${emp.fullName} خرج ${existing.checkOut}`, type: "error" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const [inH, inM] = existing.checkIn.split(":").map(Number);
    const [outH, outM] = timeStr.split(":").map(Number);
    let diffMin = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMin < 0) diffMin += 24 * 60;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    const hoursStr = `${hours}.${Math.round((mins / 60) * 10)}`;

    const updated = attendance.map((a) => a.id === existing.id ? { ...a, checkOut: timeStr, hoursWorked: hoursStr } : a);
    saveAttendance(updated);
    setMessage({ text: `✓ خروج: ${emp.fullName} - ${timeStr} (${hoursStr}س)`, type: "success" });
    setCode("");
    setTimeout(() => setMessage(null), 3000);
  };

  const todayRecords = attendance.filter((a) => a.date === today);
  const presentCount = todayRecords.filter((a) => a.status === "present" || a.status === "late").length;

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#4A2C3F] flex items-center justify-center mx-auto mb-4">
          <Clock size={32} style={{ color: "var(--text-primary)" }} />
        </div>
        <h1 className="text-2xl font-bold text-white">جهاز تسجيل الحضور</h1>
        <p className="text-white/50 mt-1">مصنع Horizon للملابس الجاهزة</p>
        <p className="text-4xl font-mono text-white/80 mt-2">{timeStr}</p>
        <p className="text-sm text-white/40">{new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4 no-print">
        <Button variant={mode === "scan" ? "default" : "outline"} className={mode === "scan" ? "bg-[#4A2C3F]" : "border-white/[0.08] text-white"} onClick={() => setMode("scan")}><ScanLine size={16} className="ml-1.5" /> مسح QR</Button>
        <Button variant={mode === "manual" ? "default" : "outline"} className={mode === "manual" ? "bg-[#4A2C3F]" : "border-white/[0.08] text-white"} onClick={() => setMode("manual")}><Keyboard size={16} className="ml-1.5" /> كتابة</Button>
        <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setShowEmployeeQR(!showEmployeeQR)}>QR للعمال</Button>
      </div>

      {/* Status message */}
      {message && (
        <div className={`w-full max-w-md mb-4 p-4 rounded-xl flex items-center gap-3 ${message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {message.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* QR Scan Mode - hidden input that captures barcode scanner input */}
      {mode === "scan" && (
        <div className="w-full max-w-md">
          <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-2xl p-8 text-center">
            <ScanLine size={48} className="text-[#E85D4A] mx-auto mb-4" />
            <p className="text-white font-medium mb-2">امسح QR Code أو الباركود</p>
            <p className="text-sm text-white/40 mb-4">جهاز الماسح متصل - انتقر هنا للتركيز</p>
            <Input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCheckIn();
              }}
              placeholder="..."
              className="bg-[#2C2C2E] border-white/[0.08] text-white text-center text-xl tracking-widest h-14 opacity-50"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button className="h-12 bg-green-600 hover:bg-green-700 text-white" onClick={handleCheckIn} disabled={!code}><LogIn size={18} className="ml-2" /> دخول</Button>
              <Button className="h-12 bg-[#E85D4A] hover:bg-[#d64e3c] text-white" onClick={handleCheckOut} disabled={!code}><LogOut size={18} className="ml-2" /> خروج</Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <div className="w-full max-w-md space-y-4">
          <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-2xl p-6">
            <label className="block text-sm text-white/70 mb-2 text-right">أدخل كود الموظف</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleCheckIn(); }} placeholder="مثال: EMP001" className="bg-[#2C2C2E] border-white/[0.08] text-white text-center text-2xl tracking-widest h-14" autoFocus />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button className="h-14 bg-green-600 hover:bg-green-700 text-white text-lg" onClick={handleCheckIn} disabled={!code}><LogIn size={20} className="ml-2" /> دخول</Button>
              <Button className="h-14 bg-[#E85D4A] hover:bg-[#d64e3c] text-white text-lg" onClick={handleCheckOut} disabled={!code}><LogOut size={20} className="ml-2" /> خروج</Button>
            </div>
          </div>
        </div>
      )}

      {/* Employee QR Codes */}
      {showEmployeeQR && (
        <div className="w-full max-w-4xl mt-6">
          <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-sm text-white/70 mb-4 text-right">اكواد QR للعمال (اطبعها وضعها على كروت العمال)</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-80 overflow-y-auto p-2">
              {employees.filter((e) => e.status === "active").map((emp) => (
                <div key={emp.id} className="bg-white rounded-lg p-3 text-center">
                  <QRCodeSVG value={emp.employeeCode} size={80} className="mx-auto" />
                  <p className="text-black text-xs font-bold mt-2">{emp.fullName}</p>
                  <p className="text-gray-500 text-[10px]">{emp.employeeCode}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="w-full max-w-md mt-4 space-y-3">
        <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-2xl p-4">
          <div className="flex items-center justify-between text-right">
            <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>حاضرون اليوم</p><p className="text-2xl font-bold text-green-400">{presentCount}</p></div>
            <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي العمال</p><p className="text-2xl font-bold text-white">{employees.filter((e) => e.status === "active").length}</p></div>
            <UserCheck size={32} className="text-white/20" />
          </div>
        </div>

        <div className="bg-[#1C1C1E] border border-white/[0.08] rounded-2xl p-4">
          <p className="text-xs text-white/45 mb-3 text-right">آخر التسجيلات</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {todayRecords.sort((a, b) => (b.checkIn || "").localeCompare(a.checkIn || "")).slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.employeeName}</span>
                <div className="flex gap-3 text-xs text-white/50">
                  <span className="text-green-400">{r.checkIn || "—"}</span>
                  <span className="text-[#E85D4A]">{r.checkOut || "—"}</span>
                </div>
              </div>
            ))}
            {todayRecords.length === 0 && <p className="text-xs text-white/30 text-center py-2">لا توجد تسجيلات</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
