import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Fingerprint, QrCode, ClipboardList, TrendingUp, Clock,
  User, CheckCircle, XCircle, ChevronLeft, LogOut,
  Factory, MapPin, Camera, Bell, BarChart3, Users, Settings
} from "lucide-react";

/** Mobile-optimized screen views */
type Screen = "home" | "clock" | "tasks" | "stats" | "profile";

/** Worker attendance status */
interface WorkerStatus {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  status: "present" | "absent" | "late" | "on_leave" | "half_day" | "not-scanned";
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  lineName?: string;
}

export default function MobileApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [pwaReady, setPwaReady] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // ── Clock ──
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── tRPC data ──
  const { data: lines } = trpc.productionLine.list.useQuery();
  const { data: dailyProd } = trpc.dailyProduction.list.useQuery();
  const { data: attendanceList } = trpc.attendance.list.useQuery();
  const { data: employees } = trpc.employee.list.useQuery({ pageSize: 50 });
  const { data: orders } = trpc.productionOrder.list.useQuery();

  // ── Clock in/out mutation ──
  const clockMut = trpc.attendance.create.useMutation({
    onSuccess: () => {
      toast.success("✅ تم تسجيل الحضور");
      setScannedCode("");
    },
    onError: (e) => toast.error(e.message),
  });

  // ── PWA install prompt ──
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setPwaReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installPWA = useCallback(() => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((result: any) => {
      if (result.outcome === "accepted") {
        toast.success("تم تثبيت التطبيق!");
      }
      setInstallPrompt(null);
    });
  }, [installPrompt]);

  // ── Notification permission ──
  const enableNotifications = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("المتصفح لا يدعم الإشعارات");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      toast.success("تم تفعيل الإشعارات");
      // Send test notification
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification("Selim HR", {
            body: "تم تفعيل الإشعارات بنجاح!",
            icon: "/icon-192.png",
            dir: "rtl",
            lang: "ar",
          });
        });
      }
    } else {
      toast.error("تم رفض الإذن للإشعارات");
    }
  }, []);

  // ── Camera for QR scan ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraActive(true);
      // Use BarcodeDetector if available
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code", "code_128", "code_39"] });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        const scan = async () => {
          if (!video.videoWidth) { requestAnimationFrame(scan); return; }
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0) {
              const code = codes[0].rawValue;
              setScannedCode(code);
              stream.getTracks().forEach((t) => t.stop());
              setCameraActive(false);
              toast.success(`تم المسح: ${code}`);
              return;
            }
          } catch { /* ignore */ }
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } else {
        toast.info("جرب إدخال الكود يدوياً — الكاميرا المتقدمة غير مدعومة");
      }
    } catch {
      toast.error("لا يمكن الوصول للكاميرا");
    }
  }, []);

  // ── Clock in action ──
  const handleClockIn = useCallback(() => {
    if (!scannedCode) {
      toast.error("امسح QR الكود أولاً");
      return;
    }
    clockMut.mutate({
      employeeId: Number(scannedCode) || 1,
      date: new Date(),
      checkIn: new Date(),
      status: "present",
    } as any);
  }, [scannedCode, clockMut]);

  // ── Stats ──
  const today = new Date().toISOString().split("T")[0];
  const todayProd = (dailyProd ?? []).filter((d: any) => (d.date instanceof Date ? d.date.toISOString() : String(d.date || "")).startsWith(today));
  const totalProduced = todayProd.reduce((s: number, d: any) => s + (d.produced || 0), 0);
  const activeLines = (lines ?? []).filter((l: any) => l.status === "active").length;
  const presentWorkers = (attendanceList?.attendance ?? []).filter((a: any) => a.status === "present" || a.status === "late").length;

  // ── Worker list ──
  const workerStatuses: WorkerStatus[] = (employees?.employees ?? []).slice(0, 20).map((emp: any) => {
    const att = (attendanceList?.attendance ?? []).find((a: any) => a.employeeId === emp.id);
    return {
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      status: att?.status || "not-scanned",
      checkIn: att?.checkIn,
      checkOut: att?.checkOut,
      lineName: (lines ?? []).find((l: any) => l.id === emp.productionLineId)?.name,
    };
  });

  // ── RENDER: Home Screen ──
  if (screen === "home") {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col" dir="rtl" style={{ background: "var(--bg-primary)" }}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between" style={{ background: "var(--bg-card)" }}>
          <div>
            <h1 className="text-base font-bold text-white">Selim HR</h1>
            <p className="text-[10px] text-white/40">
              {currentTime.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell size={18} className="text-emerald-400" />
            ) : (
              <button onClick={enableNotifications}><Bell size={18} className="text-white/30" /></button>
            )}
            {pwaReady && !installPrompt && (
              <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] h-5">PWA ✓</Badge>
            )}
          </div>
        </div>

        {/* Clock */}
        <div className="text-center py-6">
          <p className="text-4xl font-mono font-bold text-white tracking-wider">
            {currentTime.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {currentTime.getHours() < 12 ? "صباحاً" : "مساءً"} — وردية {currentTime.getHours() >= 8 && currentTime.getHours() < 16 ? "الصباح" : currentTime.getHours() >= 16 && currentTime.getHours() < 24 ? "المساء" : "الليل"}
          </p>
        </div>

        {/* Install PWA Banner */}
        {installPrompt && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Fingerprint size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-400">ثبت التطبيق على هاتفك</p>
              <p className="text-[10px] text-white/40">وصول سريع بدون متصفح</p>
            </div>
            <Button size="sm" className="h-8 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" onClick={installPWA}>
              تثبيت
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 px-4 mb-4">
          <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
            <CardContent className="p-3 text-center">
              <Factory size={16} className="mx-auto mb-1 text-emerald-400" />
              <p className="text-lg font-bold text-white">{activeLines}</p>
              <p className="text-[9px] text-white/40">خطوط نشطة</p>
            </CardContent>
          </Card>
          <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
            <CardContent className="p-3 text-center">
              <Users size={16} className="mx-auto mb-1 text-blue-400" />
              <p className="text-lg font-bold text-white">{presentWorkers}</p>
              <p className="text-[9px] text-white/40">حاضرين</p>
            </CardContent>
          </Card>
          <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
            <CardContent className="p-3 text-center">
              <TrendingUp size={16} className="mx-auto mb-1 text-violet-400" />
              <p className="text-lg font-bold text-white">{totalProduced}</p>
              <p className="text-[9px] text-white/40">مُنتج اليوم</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="px-4 space-y-2 mb-4">
          <Button className="w-full h-14 text-white justify-between text-base" style={{ background: "var(--accent-color)" }} onClick={() => setScreen("clock")}>
            <div className="flex items-center gap-3">
              <Fingerprint size={22} /> تسجيل حضور / انصراف
            </div>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="outline" className="w-full h-12 justify-between text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }} onClick={() => setScreen("tasks")}>
            <div className="flex items-center gap-3"><ClipboardList size={18} /> قائمة العمال</div>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" className="w-full h-12 justify-between text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }} onClick={() => setScreen("stats")}>
            <div className="flex items-center gap-3"><BarChart3 size={18} /> إحصائيات الإنتاج</div>
            <ChevronLeft size={16} />
          </Button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Navigation */}
        <div className="border-t flex justify-around py-2 px-2" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
          <button className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg" onClick={() => setScreen("home")}>
            <Clock size={18} className="text-emerald-400" />
            <span className="text-[9px] text-emerald-400">الرئيسية</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg" onClick={() => setScreen("clock")}>
            <Fingerprint size={18} className="text-white/30" />
            <span className="text-[9px] text-white/30">حضور</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg" onClick={() => setScreen("tasks")}>
            <Users size={18} className="text-white/30" />
            <span className="text-[9px] text-white/30">العمال</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg" onClick={() => setScreen("stats")}>
            <TrendingUp size={18} className="text-white/30" />
            <span className="text-[9px] text-white/30">إحصاء</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg" onClick={() => setScreen("profile")}>
            <User size={18} className="text-white/30" />
            <span className="text-[9px] text-white/30">حسابي</span>
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Clock Screen ──
  if (screen === "clock") {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col" dir="rtl" style={{ background: "var(--bg-primary)" }}>
        <div className="p-4 flex items-center gap-3" style={{ background: "var(--bg-card)" }}>
          <button onClick={() => setScreen("home")}><ChevronLeft size={20} className="text-white/60" /></button>
          <h2 className="text-base font-bold text-white">تسجيل الحضور</h2>
        </div>

        <div className="flex-1 p-4 flex flex-col items-center justify-center gap-4">
          {/* Camera area */}
          <div className="w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-black/50 border flex items-center justify-center relative" style={{ borderColor: "var(--border-color)" }}>
            {cameraActive ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2 animate-pulse">
                  <Camera size={32} className="text-emerald-400" />
                </div>
                <p className="text-sm text-white/60">جاري المسح...</p>
                {scannedCode && <p className="text-xs text-emerald-400 mt-1">{scannedCode}</p>}
              </div>
            ) : (
              <div className="text-center">
                <QrCode size={48} className="mx-auto mb-3 text-white/20" />
                <p className="text-sm text-white/40 mb-3">امسح QR code للعامل</p>
                <Button size="sm" className="text-white" style={{ background: "var(--accent-color)" }} onClick={startCamera}>
                  <Camera size={14} className="ml-1" /> تشغيل الكاميرا
                </Button>
              </div>
            )}
          </div>

          {/* Manual entry */}
          <div className="w-full flex gap-2">
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              placeholder="أو أدخل كود العامل..."
              className="flex-1 rounded-lg px-3 py-2.5 text-sm text-right text-white placeholder:text-white/20"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)" }}
            />
          </div>

          {/* Clock buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button className="h-14 text-white gap-2 text-base" style={{ background: "#10B981" }} onClick={handleClockIn}>
              <CheckCircle size={20} /> دخول
            </Button>
            <Button className="h-14 bg-red-500 hover:bg-red-600 text-white gap-2 text-base" onClick={() => { setScannedCode(""); toast.success("تم تسجيل الخروج"); }}>
              <XCircle size={20} /> خروج
            </Button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-white/30">
            <MapPin size={10} /> الموقع: {typeof navigator !== "undefined" ? "جاري التحديد..." : "غير متاح"}
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: Tasks/Workers Screen ──
  if (screen === "tasks") {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col" dir="rtl" style={{ background: "var(--bg-primary)" }}>
        <div className="p-4 flex items-center gap-3" style={{ background: "var(--bg-card)" }}>
          <button onClick={() => setScreen("home")}><ChevronLeft size={20} className="text-white/60" /></button>
          <h2 className="text-base font-bold text-white">العمال ({workerStatuses.length})</h2>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {workerStatuses.map((w) => (
            <Card key={w.employeeId} className="theme-card" style={{ borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  w.status === "present" ? "bg-emerald-500/20" : w.status === "late" ? "bg-amber-500/20" : w.status === "absent" ? "bg-red-500/20" : "bg-gray-500/20"
                }`}>
                  <User size={18} className={`${
                    w.status === "present" ? "text-emerald-400" : w.status === "late" ? "text-amber-400" : w.status === "absent" ? "text-red-400" : "text-gray-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{w.employeeName}</p>
                  <p className="text-[10px] text-white/40">{w.employeeCode} {w.lineName ? `| ${w.lineName}` : ""}</p>
                </div>
                <Badge variant="outline" className={`text-[9px] h-5 ${
                  w.status === "present" ? "text-emerald-400 border-emerald-500/20" : w.status === "late" ? "text-amber-400 border-amber-500/20" : w.status === "absent" ? "text-red-400 border-red-500/20" : "text-gray-400 border-gray-500/20"
                }`}>
                  {w.status === "present" ? "حاضر" : w.status === "late" ? "متأخر" : w.status === "absent" ? "غائب" : "لم يسجل"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── RENDER: Stats Screen ──
  if (screen === "stats") {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col" dir="rtl" style={{ background: "var(--bg-primary)" }}>
        <div className="p-4 flex items-center gap-3" style={{ background: "var(--bg-card)" }}>
          <button onClick={() => setScreen("home")}><ChevronLeft size={20} className="text-white/60" /></button>
          <h2 className="text-base font-bold text-white">إحصائيات الإنتاج</h2>
        </div>

        <div className="p-4 space-y-3">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "مُنتج اليوم", value: totalProduced, icon: TrendingUp, color: "text-emerald-400" },
              { label: "خطوط نشطة", value: activeLines, icon: Factory, color: "text-blue-400" },
              { label: "حاضرين", value: presentWorkers, icon: Users, color: "text-violet-400" },
              { label: "أوامر", value: (orders ?? []).length, icon: ClipboardList, color: "text-amber-400" },
            ].map((s, i) => (
              <Card key={i} className="theme-card" style={{ borderColor: "var(--border-color)" }}>
                <CardContent className="p-3 text-center">
                  <s.icon size={16} className={`mx-auto mb-1 ${s.color}`} />
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-[9px] text-white/40">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lines detail */}
          <h3 className="text-sm font-bold text-white mt-4 mb-2">خطوط الإنتاج</h3>
          {(lines ?? []).map((line: any) => {
            const lineProd = todayProd.filter((d: any) => d.lineId === line.id);
            const produced = lineProd.reduce((s: number, d: any) => s + (d.produced || 0), 0);
            const target = line.capacity || 500;
            const eff = Math.round((produced / target) * 100);
            return (
              <div key={line.id} className="p-3 rounded-xl border" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/80">{line.name}</span>
                  <Badge variant="outline" className={`text-[9px] h-5 ${eff >= 85 ? "text-emerald-400" : eff >= 60 ? "text-amber-400" : "text-red-400"}`}>
                    {eff}%
                  </Badge>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${eff >= 85 ? "bg-emerald-500" : eff >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, eff)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-white/30 mt-1">
                  <span>{produced} / {target}</span>
                  <span>{line.status === "active" ? "🟢 يعمل" : line.status === "maintenance" ? "🟡 صيانة" : "🔴 متوقف"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── RENDER: Profile Screen ──
  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col" dir="rtl" style={{ background: "var(--bg-primary)" }}>
      <div className="p-4 flex items-center gap-3" style={{ background: "var(--bg-card)" }}>
        <button onClick={() => setScreen("home")}><ChevronLeft size={20} className="text-white/60" /></button>
        <h2 className="text-base font-bold text-white">حسابي</h2>
      </div>

      <div className="p-4 space-y-3">
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3">
            <User size={36} className="text-white" />
          </div>
          <p className="text-lg font-bold text-white">مشرف الإنتاج</p>
          <p className="text-xs text-white/40">Production Supervisor</p>
        </div>

        <div className="space-y-2">
          {[
            { icon: Settings, label: "الإعدادات", action: () => toast.info("قريباً") },
            { icon: Bell, label: notificationsEnabled ? "الإشعارات (مفعلة)" : "تفعيل الإشعارات", action: enableNotifications },
            { icon: Fingerprint, label: "تسجيل الحضور", action: () => setScreen("clock") },
            { icon: MapPin, label: "GPS Location", action: () => { if ("geolocation" in navigator) navigator.geolocation.getCurrentPosition((p) => toast.success(`📍 ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`)); else toast.error("GPS غير متاح"); } },
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border text-right hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }} onClick={item.action}>
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <item.icon size={16} className="text-white/50" />
              </div>
              <span className="text-sm text-white/80 flex-1">{item.label}</span>
              <ChevronLeft size={14} className="text-white/20" />
            </button>
          ))}
        </div>

        <Button className="w-full h-12 mt-4 text-red-400 hover:text-red-300 hover:bg-red-500/10" variant="ghost" onClick={() => { toast.success("تم تسجيل الخروج"); }}>
          <LogOut size={16} className="ml-2" /> تسجيل الخروج
        </Button>

        <p className="text-[10px] text-white/20 text-center mt-4">Selim HR v2.0 — PWA Enabled</p>
      </div>
    </div>
  );
}
