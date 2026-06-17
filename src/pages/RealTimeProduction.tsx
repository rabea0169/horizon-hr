import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Factory, Activity, TrendingUp, Users, Clock, AlertTriangle,
  Play, Pause, RotateCcw, ChevronDown, ChevronUp, Zap,
  Target, BarChart3, Timer, CheckCircle, XCircle, Gauge
} from "lucide-react";

/** Live line status */
interface LiveLine {
  lineId: number;
  lineName: string;
  supervisorName: string;
  status: "running" | "stopped" | "maintenance" | "idle";
  targetDaily: number;
  producedToday: number;
  defectedToday: number;
  workersPresent: number;
  workersTotal: number;
  efficiency: number;
  hourlyRate: number; // pieces per hour
  lastUpdate: Date;
  trend: "up" | "down" | "stable";
  currentOrder?: string;
  currentModel?: string;
}

/** Animated counter */
function LiveCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const t0 = Date.now();
    startRef.current = t0;
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    prevRef.current = value;
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

/** Status badge */
function StatusBadge({ status }: { status: LiveLine["status"] }) {
  const config = {
    running: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Play, label: "يعمل" },
    stopped: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: Pause, label: "متوقف" },
    maintenance: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle, label: "صيانة" },
    idle: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Timer, label: "خامل" },
  };
  const c = config[status];
  const Icon = c.icon;
  return <Badge variant="outline" className={`gap-1 ${c.color}`}><Icon size={10} /> {c.label}</Badge>;
}

/** Efficiency gauge bar */
function EfficiencyBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : value >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

/** Trend indicator */
function TrendIndicator({ trend, value }: { trend: "up" | "down" | "stable"; value: string }) {
  const colors = { up: "text-emerald-400", down: "text-red-400", stable: "text-gray-400" };
  return <span className={`text-xs ${colors[trend]}`}>{trend === "up" ? "▲" : trend === "down" ? "▼" : "●"} {value}</span>;
}

/** Sparkline mini chart */
function Sparkline({ data, color = "#10B981" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="h-8 w-20 bg-white/5 rounded" />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${8 - ((v - min) / range) * 8}`).join(" ");
  return (
    <svg width="64" height="12" className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="60" cy={8 - ((data[data.length - 1] - min) / range) * 8} r="2" fill={color} />
    </svg>
  );
}

export default function RealTimeProduction() {
  const utils = trpc.useUtils();
  const { data: lines } = trpc.productionLine.list.useQuery();
  const { data: dailyProd } = trpc.dailyProduction.list.useQuery();
  const { data: attendance } = trpc.attendance.list.useQuery();
  const { data: orders } = trpc.productionOrder.list.useQuery();

  const [selectedLine, setSelectedLine] = useState<number | "all">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [expandedLine, setExpandedLine] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Auto-refresh (simulates real-time) ──
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      utils.productionLine.list.invalidate();
      utils.dailyProduction.list.invalidate();
      utils.attendance.list.invalidate();
      setLastRefresh(new Date());
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, utils]);

  // ── Build live lines data ──
  const liveLines: LiveLine[] = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return (lines ?? []).map((line: any) => {
      const lineProd = (dailyProd ?? []).filter((d: any) => d.lineId === line.id && d.date?.startsWith?.(today));
      const producedToday = lineProd.reduce((s: number, d: any) => s + (d.produced || 0), 0);
      const defectedToday = lineProd.reduce((s: number, d: any) => s + (d.defected || 0), 0);
      const workersPresent = (attendance ?? []).filter((a: any) => a.status === "present" || a.status === "late").length;
      const targetDaily = line.capacity || line.targetDaily || 500;
      const efficiency = targetDaily > 0 ? Math.round((producedToday / targetDaily) * 100) : 0;
      const hourlyRate = producedToday / (new Date().getHours() - 8 || 1);
      const activeOrder = (orders ?? []).find((o: any) => o.assignedLineId === line.id && o.status === "in_progress");

      // Simulated trend based on last hour
      const trend = efficiency > 85 ? "up" as const : efficiency < 50 ? "down" as const : "stable" as const;

      return {
        lineId: line.id,
        lineName: line.name,
        supervisorName: line.supervisor?.fullName || line.supervisorName || "غير محدد",
        status: (line.status === "active" ? "running" : line.status === "maintenance" ? "maintenance" : "idle") as LiveLine["status"],
        targetDaily,
        producedToday,
        defectedToday,
        workersPresent,
        workersTotal: line.employeeCount || workersPresent + 5,
        efficiency,
        hourlyRate: Math.round(hourlyRate * 10) / 10,
        lastUpdate: new Date(),
        trend,
        currentOrder: activeOrder?.orderCode,
        currentModel: activeOrder?.styleName,
      };
    });
  }, [lines, dailyProd, attendance, orders]);

  // ── Filter lines ──
  const filteredLines = selectedLine === "all" ? liveLines : liveLines.filter((l) => l.lineId === selectedLine);

  // ── Factory totals ──
  const totals = useMemo(() => {
    const totalTarget = liveLines.reduce((s, l) => s + l.targetDaily, 0);
    const totalProduced = liveLines.reduce((s, l) => s + l.producedToday, 0);
    const totalDefected = liveLines.reduce((s, l) => s + l.defectedToday, 0);
    const activeLines = liveLines.filter((l) => l.status === "running").length;
    const totalWorkers = liveLines.reduce((s, l) => s + l.workersPresent, 0);
    const avgEfficiency = liveLines.length > 0 ? Math.round(liveLines.reduce((s, l) => s + l.efficiency, 0) / liveLines.length) : 0;
    return { totalTarget, totalProduced, totalDefected, activeLines, totalLines: liveLines.length, totalWorkers, avgEfficiency };
  }, [liveLines]);

  // ── Historical sparkline data (simulated) ──
  const sparkData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const base = totals.totalProduced / 12;
      return Math.round(base + (Math.random() - 0.5) * base * 0.4);
    });
  }, [totals.totalProduced, lastRefresh]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl" onClick={() => {}}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Activity size={20} className="text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              الإنتاج المباشر
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </Badge>
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA")} | تحديث كل {refreshInterval} ثوانٍ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={String(refreshInterval)} onValueChange={(v) => setRefreshInterval(Number(v))}>
            <SelectTrigger className="theme-input text-right text-xs h-8 w-28">
              <Timer size={12} className="ml-1" /> <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">كل 2 ثانية</SelectItem>
              <SelectItem value="5">كل 5 ثوانٍ</SelectItem>
              <SelectItem value="10">كل 10 ثوانٍ</SelectItem>
              <SelectItem value="30">كل 30 ثانية</SelectItem>
              <SelectItem value="60">كل دقيقة</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
            className={`h-8 text-xs gap-1 ${autoRefresh ? "text-white" : ""}`}
            style={autoRefresh ? { background: "var(--accent-color)" } : {}}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap size={12} /> {autoRefresh ? "إيقاف التحديث" : "تشغيل التحديث"}
          </Button>

          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => {
            utils.productionLine.list.invalidate();
            utils.dailyProduction.list.invalidate();
            setLastRefresh(new Date());
            toast.success("تم التحديث اليدوي");
          }}>
            <RotateCcw size={12} /> تحديث
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "إجمالي المُنتج", value: totals.totalProduced, icon: Factory, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "الهدف اليومي", value: totals.totalTarget, icon: Target, color: "text-white/70", bg: "bg-white/5" },
          { label: "الكفاءة المتوسطة", value: `${totals.avgEfficiency}%`, icon: Gauge, color: totals.avgEfficiency >= 85 ? "text-emerald-400" : "text-amber-400", bg: totals.avgEfficiency >= 85 ? "bg-emerald-500/10" : "bg-amber-500/10" },
          { label: "خطوط نشطة", value: `${totals.activeLines}/${totals.totalLines}`, icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "العمال الحاضرين", value: totals.totalWorkers, icon: Users, color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "العيوب", value: totals.totalDefected, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((kpi, i) => (
          <Card key={i} className="theme-card" style={{ borderColor: "var(--border-color)" }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon size={14} className={kpi.color} />
                </div>
                <p className="text-[10px] text-white/40">{kpi.label}</p>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>
                {typeof kpi.value === "number" ? <LiveCounter value={kpi.value} duration={800} /> : kpi.value}
              </p>
              <Sparkline data={sparkData} color={kpi.color.includes("emerald") ? "#10B981" : kpi.color.includes("blue") ? "#3B82F6" : "#F59E0B"} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Line Filter ── */}
      <div className="flex items-center gap-3">
        <Select value={String(selectedLine)} onValueChange={(v) => setSelectedLine(v === "all" ? "all" : Number(v))}>
          <SelectTrigger className="theme-input text-right h-9 w-56">
            <Factory size={14} className="ml-1" /> <SelectValue placeholder="جميع الخطوط" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الخطوط ({liveLines.length})</SelectItem>
            {liveLines.map((l) => (
              <SelectItem key={l.lineId} value={String(l.lineId)}>{l.lineName} — {l.status === "running" ? "🟢" : "🔴"}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {liveLines.filter((l) => l.status === "running").length > 0 && (
          <Badge className="bg-emerald-500/10 text-emerald-400 gap-1">
            <Play size={10} /> {liveLines.filter((l) => l.status === "running").length} خط يعمل
          </Badge>
        )}
        {liveLines.filter((l) => l.status === "maintenance").length > 0 && (
          <Badge className="bg-amber-500/10 text-amber-400 gap-1">
            <AlertTriangle size={10} /> {liveLines.filter((l) => l.status === "maintenance").length} تحت الصيانة
          </Badge>
        )}
      </div>

      {/* ── Live Lines Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLines.map((line) => {
          const isExpanded = expandedLine === line.lineId;
          const defectRate = line.producedToday > 0 ? ((line.defectedToday / line.producedToday) * 100).toFixed(1) : "0";

          return (
            <Card
              key={line.lineId}
              className="theme-card transition-all hover:border-white/10"
              style={{ borderColor: "var(--border-color)", borderLeft: `3px solid ${line.status === "running" ? "#10B981" : line.status === "maintenance" ? "#F59E0B" : "#EF4444"}` }}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white/90">{line.lineName}</h3>
                      <StatusBadge status={line.status} />
                    </div>
                    <p className="text-[10px] text-white/40">المشرف: {line.supervisorName}</p>
                    {line.currentOrder && (
                      <p className="text-[10px] text-white/50 mt-0.5">📋 {line.currentOrder} {line.currentModel ? `| 👕 ${line.currentModel}` : ""}</p>
                    )}
                  </div>
                  <TrendIndicator trend={line.trend} value={`${line.efficiency}%`} />
                </div>

                {/* Efficiency bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white/40">الكفاءة</span>
                    <span className={`font-bold ${line.efficiency >= 85 ? "text-emerald-400" : line.efficiency >= 60 ? "text-amber-400" : "text-red-400"}`}>
                      {line.efficiency}%
                    </span>
                  </div>
                  <EfficiencyBar value={line.efficiency} />
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                    <p className="text-[10px] text-white/40 mb-0.5">مُنتج</p>
                    <p className="text-sm font-bold text-blue-400"><LiveCounter value={line.producedToday} /></p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                    <p className="text-[10px] text-white/40 mb-0.5">هدف</p>
                    <p className="text-sm font-bold text-white/70">{line.targetDaily.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                    <p className="text-[10px] text-white/40 mb-0.5">الساعة</p>
                    <p className="text-sm font-bold text-violet-400">{line.hourlyRate}</p>
                  </div>
                </div>

                {/* Workers + Defect */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1 text-[10px] text-white/40">
                    <Users size={10} />
                    <span>{line.workersPresent}/{line.workersTotal} عامل</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-red-400/60">
                    <XCircle size={10} />
                    <span>{defectRate}% عيوب</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400/60">
                    <CheckCircle size={10} />
                    <span>{line.producedToday - line.defectedToday} صالح</span>
                  </div>
                </div>

                {/* Expand button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-7 text-[10px] text-white/30 hover:text-white/60"
                  onClick={() => setExpandedLine(isExpanded ? null : line.lineId)}
                >
                  {isExpanded ? <><ChevronUp size={12} className="ml-1" /> إخفاء التفاصيل</> : <><ChevronDown size={12} className="ml-1" /> عرض التفاصيل</>}
                </Button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 space-y-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">نسبة العيوب</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, Number(defectRate) * 5)}%` }} />
                        </div>
                        <span className="text-red-400 font-mono">{defectRate}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">السرعة/ساعة</span>
                      <span className="text-violet-400 font-mono">{line.hourlyRate} قطعة</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">القطع الصالحة</span>
                      <span className="text-emerald-400 font-mono">{line.producedToday - line.defectedToday}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">القطع المعيبة</span>
                      <span className="text-red-400 font-mono">{line.defectedToday}</span>
                    </div>
                    {line.currentOrder && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">الأمر الحالي</span>
                        <span className="text-blue-400 font-mono">{line.currentOrder}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredLines.length === 0 && (
          <div className="col-span-full text-center py-12 text-white/30">
            <Factory size={48} className="mx-auto mb-3" />
            <p className="text-sm">لا توجد خطوط إنتاج مسجلة</p>
            <p className="text-xs mt-1">أضف خطوط إنتاج من صفحة "خطوط الإنتاج"</p>
          </div>
        )}
      </div>
    </div>
  );
}
