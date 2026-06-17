import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Server, Wifi, WifiOff, Save, TestTube, Smartphone,
  Laptop, Tablet, RefreshCw, CheckCircle, AlertTriangle, Usb, Info
} from "lucide-react";

// Auto-detect local IP
function detectLocalIP(): string {
  // Try window.location first
  const host = window.location.hostname;
  if (host && host !== 'localhost' && !host.includes('kimi.page')) {
    return host;
  }
  // For portable mode, check common patterns
  const stored = localStorage.getItem('hr_server_url');
  if (stored) {
    try {
      return new URL(stored).hostname;
    } catch { /* ignore */ }
  }
  return 'localhost';
}

// Default ports to try
const DEFAULT_PORTS = [3000, 8080, 5000, 5173];

// Server URL builder
function buildServerUrl(ip: string, port: number): string {
  return `http://${ip}:${port}`;
}

interface PingResult {
  url: string;
  status: "success" | "error" | "timeout" | "checking";
  latency?: number;
  message?: string;
}

export default function ServerSetup() {
  const [serverIP, setServerIP] = useState(detectLocalIP());
  const [serverPort, setServerPort] = useState(3000);
  const [serverUrl, setServerUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState(localStorage.getItem("hr_server_url") || "");
  const [pingResults, setPingResults] = useState<PingResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({
    online: navigator.onLine,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  });

  useEffect(() => {
    setServerUrl(buildServerUrl(serverIP, serverPort));
  }, [serverIP, serverPort]);

  useEffect(() => {
    const handler = () => setNetworkInfo(prev => ({ ...prev, online: navigator.onLine }));
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  const pingServer = useCallback(async (url: string): Promise<PingResult> => {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${url}/api/ping`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      const latency = Math.round(performance.now() - start);
      if (response.ok) {
        return { url, status: "success", latency, message: `استجابة ${latency}ms` };
      }
      return { url, status: "error", latency, message: `خطأ HTTP ${response.status}` };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { url, status: "timeout", message: "انتهى الوقت (5 ثواني)" };
      }
      return { url, status: "error", message: err.message || "خطأ اتصال" };
    }
  }, []);

  const testConnection = useCallback(async () => {
    setPingResults([{ url: serverUrl, status: "checking" }]);
    const result = await pingServer(serverUrl);
    setPingResults([result]);
  }, [serverUrl, pingServer]);

  const scanPorts = useCallback(async () => {
    setIsScanning(true);
    setPingResults(DEFAULT_PORTS.map(port => ({
      url: buildServerUrl(serverIP, port),
      status: "checking" as const,
    })));

    const results: PingResult[] = [];
    for (const port of DEFAULT_PORTS) {
      const url = buildServerUrl(serverIP, port);
      const result = await pingServer(url);
      results.push(result);
      setPingResults([...results]);
    }
    setIsScanning(false);

    // Auto-select first successful port
    const success = results.find(r => r.status === "success");
    if (success) {
      const matchedPort = DEFAULT_PORTS.find(p => success.url.includes(`:${p}`));
      if (matchedPort) setServerPort(matchedPort);
    }
  }, [serverIP, pingServer]);

  const saveServerUrl = useCallback(() => {
    localStorage.setItem("hr_server_url", serverUrl);
    setSavedUrl(serverUrl);
  }, [serverUrl]);

  const clearServerUrl = useCallback(() => {
    localStorage.removeItem("hr_server_url");
    setSavedUrl("");
  }, []);

  const getDeviceIcon = () => {
    const ua = networkInfo.userAgent.toLowerCase();
    if (ua.includes("android")) return <Smartphone size={20} />;
    if (ua.includes("iphone") || ua.includes("ipad")) return <Smartphone size={20} />;
    if (ua.includes("mobile")) return <Smartphone size={20} />;
    if (networkInfo.platform.toLowerCase().includes("mac")) return <Laptop size={20} />;
    return <Laptop size={20} />;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            <Server className="inline ml-2" size={24} />
            إعداد الخادم والاتصال
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            اضبط عنوان الخادم واختبر الاتصال من هذا الجهاز
          </p>
        </div>
        <Badge variant={networkInfo.online ? "default" : "destructive"} className="gap-1">
          {networkInfo.online ? <Wifi size={14} /> : <WifiOff size={14} />}
          {networkInfo.online ? "متصل بالإنترنت" : "غير متصل"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Server Configuration Card */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Server size={18} /> إعدادات الخادم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Server IP */}
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>
                عنوان IP الخادم
              </label>
              <Input
                value={serverIP}
                onChange={e => setServerIP(e.target.value)}
                placeholder="192.168.1.100"
                className="text-left font-mono"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                ادخل IP الخادم المحلي أو domain. للوضع المحلي اتركه localhost.
              </p>
            </div>

            {/* Server Port */}
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>
                المنفذ (Port)
              </label>
              <Input
                type="number"
                value={serverPort}
                onChange={e => setServerPort(Number(e.target.value))}
                placeholder="3000"
                className="text-left font-mono"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Generated URL */}
            <div className="p-3 rounded-lg font-mono text-sm" style={{ background: "var(--bg-body)", border: "1px solid var(--border-color)" }}>
              <span style={{ color: "var(--text-muted)" }}>الرابط الكامل:</span>{" "}
              <span style={{ color: "var(--accent-color)" }}>{serverUrl}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={testConnection}
                disabled={pingResults.some(r => r.status === "checking")}
                className="gap-2 text-white"
                style={{ background: "var(--accent-color)" }}
              >
                <TestTube size={16} /> اختبر الاتصال
              </Button>
              <Button
                onClick={scanPorts}
                disabled={isScanning}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} /> فحص المنافذ
              </Button>
              <Button
                onClick={saveServerUrl}
                variant="outline"
                className="gap-2"
              >
                <Save size={16} /> حفظ
              </Button>
            </div>

            {/* Saved URL */}
            {savedUrl && (
              <div className="p-2 rounded-lg text-sm flex items-center justify-between" style={{ background: "#f0fff4", border: "1px solid #c6f6d5" }}>
                <span className="text-emerald-700">
                  <CheckCircle size={14} className="inline ml-1" />
                  محفوظ: {savedUrl}
                </span>
                <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={clearServerUrl}>
                  مسح
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Info Card */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              {getDeviceIcon()} معلومات هذا الجهاز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded" style={{ background: "var(--bg-body)" }}>
                <span style={{ color: "var(--text-muted)" }}>المنصة:</span>{" "}
                <span style={{ color: "var(--text-primary)" }}>{networkInfo.platform}</span>
              </div>
              <div className="p-2 rounded" style={{ background: "var(--bg-body)" }}>
                <span style={{ color: "var(--text-muted)" }}>الاتصال:</span>{" "}
                <span style={{ color: networkInfo.online ? "#38a169" : "#c53030" }}>
                  {networkInfo.online ? "متصل" : "غير متصل"}
                </span>
              </div>
              <div className="p-2 rounded" style={{ background: "var(--bg-body)" }}>
                <span style={{ color: "var(--text-muted)" }}>النوع:</span>{" "}
                <span style={{ color: "var(--text-primary)" }}>
                  {/Mobi/.test(networkInfo.userAgent) ? "هاتف/تابلت" : "كمبيوتر"}
                </span>
              </div>
              <div className="p-2 rounded" style={{ background: "var(--bg-body)" }}>
                <span style={{ color: "var(--text-muted)" }}>المتصفح:</span>{" "}
                <span style={{ color: "var(--text-primary)" }}>
                  {networkInfo.userAgent.includes("Chrome") ? "Chrome" :
                   networkInfo.userAgent.includes("Safari") ? "Safari" :
                   networkInfo.userAgent.includes("Firefox") ? "Firefox" : "آخر"}
                </span>
              </div>
            </div>

            <Separator style={{ background: "var(--border-color)" }} />

            {/* Current Page Origin */}
            <div className="p-2 rounded font-mono text-xs" style={{ background: "var(--bg-body)" }}>
              <span style={{ color: "var(--text-muted)" }}>الرابط الحالي:</span>{" "}
              <span style={{ color: "var(--accent-color)" }}>{window.location.origin}</span>
            </div>

            {/* Portable Mode Indicator */}
            {window.location.protocol === "file:" && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "#fffaf0", border: "1px solid #fbd38d" }}>
                <AlertTriangle size={16} className="inline ml-1 text-amber-500" />
                <span className="text-amber-700">الوضع المحمول: يعمل من ملف محلي</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ping Results */}
      {pingResults.length > 0 && (
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <TestTube size={18} /> نتائج الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pingResults.map((result, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{
                  background: result.status === "success" ? "#f0fff4" :
                    result.status === "checking" ? "var(--bg-body)" :
                    "#fff5f5",
                  border: `1px solid ${result.status === "success" ? "#c6f6d5" :
                    result.status === "checking" ? "var(--border-color)" :
                    "#fed7d7"}`,
                }}>
                  <div className="flex-shrink-0">
                    {result.status === "success" && <CheckCircle size={20} className="text-emerald-500" />}
                    {result.status === "checking" && <RefreshCw size={20} className="animate-spin" style={{ color: "var(--accent-color)" }} />}
                    {result.status === "error" && <WifiOff size={20} className="text-red-500" />}
                    {result.status === "timeout" && <AlertTriangle size={20} className="text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {result.url}
                    </p>
                    <p className="text-xs" style={{ color: result.status === "success" ? "#38a169" : result.status === "checking" ? "var(--text-muted)" : "#c53030" }}>
                      {result.message || (result.status === "checking" ? "جاري الفحص..." : "خطأ")}
                    </p>
                  </div>
                  {result.status === "success" && (
                    <Badge className="bg-emerald-500/15 text-emerald-500 flex-shrink-0">
                      {result.latency}ms
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Connect Guide */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Info size={18} /> كيف تصل من أجهزة أخرى
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-lg space-y-2" style={{ background: "var(--bg-body)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent-color)" }}>1</div>
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>شغّل الخادم</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                على الكمبيوتر الرئيسي، شغّل <code>start.bat</code> (Windows) أو <code>./start.sh</code> (Linux/Mac). اتركه يعمل.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-lg space-y-2" style={{ background: "var(--bg-body)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent-color)" }}>2</div>
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>نفس شبكة WiFi</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                تأكد أن الهاتف/التابلت على نفس شبكة WiFi مثل الكمبيوتر. افتح إعدادات WiFi لمعرفة الشبكة.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-lg space-y-2" style={{ background: "var(--bg-body)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--accent-color)" }}>3</div>
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>افتح الرابط</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                على الهاتف، افتح المتصفح وادخل رابط الخادم المحلي مثل: <code className="text-xs">http://192.168.1.100:3000</code>
              </p>
            </div>
          </div>

          <Separator className="my-4" style={{ background: "var(--border-color)" }} />

          {/* Devices Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Laptop, label: "كمبيوتر", desc: "localhost:3000", color: "#4a5568" },
              { icon: Tablet, label: "تابلت", desc: "IP:3000", color: "#2c5282" },
              { icon: Smartphone, label: "هاتف أندرويد", desc: "IP:3000 أو APK", color: "#38a169" },
              { icon: Usb, label: "USB محمول", desc: "بدون تثبيت", color: "#d69e2e" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="p-3 rounded-lg text-center" style={{ background: "var(--bg-body)", border: "1px solid var(--border-color)" }}>
                <Icon size={24} style={{ color }} className="mx-auto mb-1" />
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
