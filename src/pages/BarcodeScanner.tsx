import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Camera, ScanLine, Search, Check, X, Clock, Package,
  ArrowRight, AlertCircle, Smartphone, Zap
} from "lucide-react";

/** Recent scan log entry */
interface ScanLogEntry {
  id: string;
  bundleCode: string;
  bundleId?: number;
  modelName?: string;
  stage: string;
  timestamp: Date;
  status: "success" | "error" | "pending";
  message?: string;
  lineName?: string;
}

export default function BarcodeScanner() {
  // ── tRPC ──
  const scanMut = trpc.barcode.scanBundle.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ تم المسح: ${data.previousStage} → ${data.newStage}`);
      addLogEntry(lastCode.current, "success", `${data.previousStage} → ${data.newStage}`);
    },
    onError: (err) => {
      toast.error(`❌ ${err.message}`);
      addLogEntry(lastCode.current, "error", err.message);
    },
  });
  const { data: bundleInfo, isFetching } = trpc.barcode.getBundleByCode.useQuery(
    { bundleCode: previewCode },
    { enabled: !!previewCode && previewCode.length > 3 }
  );

  // ── Camera refs ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCode = useRef<string>("");

  // ── State ──
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [selectedStage, setSelectedStage] = useState("Sewing");
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);
  const [torchOn, setTorchOn] = useState(false);

  // ── Camera control ──
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      toast.success("📷 الكاميرا تعمل");
      startScanning();
    } catch {
      toast.error("⚠️ لا يمكن الوصول للكاميرا — تأكد من إعطاء الإذن");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Torch toggle ──
  const toggleTorch = useCallback(async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn } as any],
        });
        setTorchOn(!torchOn);
      }
    } catch {
      toast.error("الفلاش غير مدعوم على هذا الجهاز");
    }
  }, [torchOn]);

  // ── QR scanning via canvas frame analysis ──
  const startScanning = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try BarcodeDetector API (Chrome 83+ on Android)
      if ("BarcodeDetector" in window) {
        (window as any).BarcodeDetector.detect(canvas).then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            handleDetectedCode(code);
          }
        }).catch(() => {});
      } else {
        // Fallback: try to decode QR using jsQR if available
        // For now, we'll use manual entry as fallback
      }
    }, 500);
  }, []);

  // ── Handle detected code ──
  const handleDetectedCode = useCallback((code: string) => {
    if (!code || code === lastCode.current) return;
    lastCode.current = code;
    setPreviewCode(code);
    setManualCode(code);

    // Auto-scan after a short delay
    setTimeout(() => {
      scanMut.mutate({
        bundleCode: code,
        stage: selectedStage,
        scannerType: "qr",
      });
    }, 300);
  }, [selectedStage, scanMut]);

  // ── Manual scan ──
  const handleManualScan = useCallback(() => {
    if (!manualCode.trim()) {
      toast.error("أدخل كود البندل");
      return;
    }
    lastCode.current = manualCode.trim();
    setPreviewCode(manualCode.trim());
    scanMut.mutate({
      bundleCode: manualCode.trim(),
      stage: selectedStage,
      scannerType: "barcode",
    });
  }, [manualCode, selectedStage, scanMut]);

  // ── Add to scan log ──
  const addLogEntry = useCallback((code: string, status: "success" | "error" | "pending", message?: string) => {
    setScanLog((prev) => [{
      id: `${Date.now()}-${Math.random()}`,
      bundleCode: code,
      bundleId: bundleInfo?.id,
      modelName: bundleInfo?.modelName,
      stage: selectedStage,
      timestamp: new Date(),
      status,
      message,
    }, ...prev].slice(0, 50));
  }, [bundleInfo, selectedStage]);

  // ── Capture from camera (snapshot decode) ──
  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob for processing
    canvas.toBlob((blob) => {
      if (!blob) return;
      // Try BarcodeDetector
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code", "code_128", "code_39", "ean_13"] });
        detector.detect(canvas).then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            handleDetectedCode(barcodes[0].rawValue);
          } else {
            toast.error("لم يتم العثور على باركود في الصورة");
          }
        }).catch(() => {
          toast.error("فشل في تحليل الصورة");
        });
      } else {
        toast.info("BarcodeDetector API غير متاح — استخدم الإدخال اليدوي");
      }
    }, "image/jpeg");
  }, [handleDetectedCode]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>ماسح الباركود</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>مسح QR/Barcode للـ Bundles عبر الكاميرا أو الإدخال اليدوي</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={cameraActive ? "default" : "outline"} className={cameraActive ? "bg-green-500/20 text-green-400" : ""}>
            {cameraActive ? "🟢 الكاميرا نشطة" : "🔴 الكاميرا متوقفة"}
          </Badge>
          <Badge variant="outline">{scanLog.filter((s) => s.status === "success").length} نجاح</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Camera Panel ── */}
        <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Camera size={14} /> الكاميرا
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Video preview */}
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
              {cameraActive ? (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/30 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400" />
                      {/* Scan line animation */}
                      <div className="absolute left-0 right-0 h-0.5 bg-green-400/60 animate-scan" style={{ top: "50%" }} />
                    </div>
                  </div>
                  {/* Controls overlay */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <Button size="sm" className="bg-white/20 backdrop-blur text-white hover:bg-white/30" onClick={captureSnapshot}>
                      <ScanLine size={14} className="ml-1" /> التقاط
                    </Button>
                    <Button size="sm" className="bg-white/20 backdrop-blur text-white hover:bg-white/30" onClick={toggleTorch}>
                      <Zap size={14} className="ml-1" /> {torchOn ? "إطفاء" : "فلاش"}
                    </Button>
                    <Button size="sm" variant="destructive" className="bg-red-500/60" onClick={stopCamera}>
                      <X size={14} />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-white/40">
                  <Camera size={48} className="mx-auto mb-3" />
                  <p className="text-sm mb-3">الكاميرا متوقفة</p>
                  <Button size="sm" className="text-white" style={{ background: "var(--accent-color)" }} onClick={startCamera}>
                    <Smartphone size={14} className="ml-1" /> تشغيل الكاميرا
                  </Button>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {/* Stage selector */}
            <div className="flex gap-2 flex-wrap">
              {["Cutting", "Sewing", "Pressing", "Packing", "QC", "Dispatch"].map((stage) => (
                <Button
                  key={stage}
                  size="sm"
                  variant={selectedStage === stage ? "default" : "outline"}
                  className={`text-xs h-7 ${selectedStage === stage ? "text-white" : ""}`}
                  style={selectedStage === stage ? { background: "var(--accent-color)" } : {}}
                  onClick={() => setSelectedStage(stage)}
                >
                  {stage}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Manual Entry + Bundle Preview ── */}
        <div className="space-y-6">
          {/* Manual entry */}
          <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-white">
                <Search size={14} /> إدخال يدوي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="أدخل كود البندل..."
                  className="theme-input text-right flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
                />
                <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={handleManualScan} disabled={scanMut.isPending}>
                  {scanMut.isPending ? <Clock size={14} className="animate-spin" /> : <ScanLine size={14} />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bundle preview */}
          {previewCode && (
            <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">معلومات البندل</CardTitle>
              </CardHeader>
              <CardContent>
                {isFetching ? (
                  <p className="text-sm text-white/40">جاري البحث...</p>
                ) : bundleInfo ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">الكود</span>
                      <span className="text-sm font-mono text-white/80">{bundleInfo.bundleCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">الموديل</span>
                      <span className="text-sm text-white/80">{(bundleInfo as any).model?.name || bundleInfo.modelName || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">المرحلة الحالية</span>
                      <Badge variant="outline" className="text-xs">{(bundleInfo as any).currentStage || "Cutting"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">الكمية</span>
                      <span className="text-sm text-white/80">{bundleInfo.quantity}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle size={16} />
                    <p className="text-sm">لم يتم العثور على بندل بهذا الكود</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scan Log */}
          <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center justify-between">
                <span className="flex items-center gap-2"><Clock size={14} /> سجل المسح ({scanLog.length})</span>
                {scanLog.length > 0 && (
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] text-white/40" onClick={() => setScanLog([])}>مسح</Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[280px] overflow-auto space-y-1">
                {scanLog.length === 0 && (
                  <p className="text-sm text-white/30 text-center py-4">لا توجد عمليات مسح بعد</p>
                )}
                {scanLog.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/[0.03]" style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.status === "success" ? "bg-green-400" : entry.status === "error" ? "bg-red-400" : "bg-yellow-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white/70 truncate">{entry.bundleCode}</span>
                        <ArrowRight size={10} className="text-white/30" />
                        <Badge variant="outline" className="text-[9px] h-4 px-1">{entry.stage}</Badge>
                      </div>
                      {entry.message && <p className="text-[10px] text-white/40 truncate">{entry.message}</p>}
                    </div>
                    <span className="text-[10px] text-white/30 flex-shrink-0">
                      {entry.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
