import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useEmployees, usePerformanceReviews, useAttendance, useDepartments, useProductionLines, useProductionOrders, useDailyProduction, useMachines, useAdvances } from "@/hooks/useLocalData";
import { isModuleEnabled } from "../modules.config";
import { Users, Clock, ArrowUpRight, ArrowDownRight, Factory, TrendingUp, Cog, HandCoins, UserCheck } from "lucide-react";

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);
  useEffect(() => {
    startTime.current = null;
    const timeoutId = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTime.current) startTime.current = timestamp;
        const progress = Math.min((timestamp - startTime.current) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (ref.current) ref.current.textContent = Math.round(value * eased).toString();
        if (progress < 1) rafId.current = requestAnimationFrame(animate);
      };
      rafId.current = requestAnimationFrame(animate);
    }, 100);
    return () => { clearTimeout(timeoutId); cancelAnimationFrame(rafId.current); };
  }, [value, duration]);
  return <span ref={ref}>0</span>;
}

function KpiCard({ title, value, icon: Icon, subtitle, subtitleType }: { title: string; value: number; icon: React.ElementType; subtitle?: string; subtitleType?: "positive" | "negative" | "neutral" }) {
  return (
    <Card className="theme-card animate-fade-in-up">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-white/45">{title}</p>
            <p className="text-3xl font-bold font-mono text-white"><AnimatedNumber value={value} /></p>
            {subtitle && <p className={`text-xs flex items-center gap-1 ${subtitleType === "positive" ? "text-green-400" : subtitleType === "negative" ? "text-red-400" : "text-white/50"}`}>{subtitleType === "positive" && <ArrowUpRight size={12} />}{subtitleType === "negative" && <ArrowDownRight size={12} />}{subtitle}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#4A2C3F]/30 flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-[#E85D4A]" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChart({ data }: { data: { name: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (<div className="space-y-3">{data.map((item, i) => (<div key={i} className="space-y-1"><div className="flex justify-between text-sm"><span className="text-white/70">{item.name}</span><span className="text-white font-medium">{item.value}</span></div><div className="h-2 bg-white/[0.06] rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color || "#4A2C3F", transitionDelay: `${i * 80}ms` }} /></div></div>))}</div>);
}

export default function Dashboard() {
  // Module flags — control which sections render
  const hasEmployees = isModuleEnabled("employees");
  const hasAttendance = isModuleEnabled("attendance");
  const hasFactory = isModuleEnabled("factory");
  const hasProductionModels = isModuleEnabled("production-models");
  const hasMachines = isModuleEnabled("machines");
  const hasAdvances = isModuleEnabled("advances");
  const hasPerformance = isModuleEnabled("performance");
  // Data hooks — safely load data for enabled modules
  const { data: employees } = useEmployees();
  const { data: attendance } = useAttendance();
  const { data: departments } = useDepartments();
  const { data: lines } = useProductionLines();
  const { data: orders } = useProductionOrders();
  const { data: dailyProd } = useDailyProduction();
  const { data: machines } = useMachines();
  const { data: advances } = useAdvances();
  const { data: reviews } = usePerformanceReviews();

  // KPI Calculations
  const totalEmps = employees.length;
  const activeEmps = employees.filter((e) => e.status === "active").length;
  const onLeaveEmps = employees.filter((e) => e.status === "on_leave").length;
  const todayPresent = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const todayLate = attendance.filter((a) => a.status === "late").length;
  const todayAbsent = attendance.filter((a) => a.status === "absent").length;
  const activeLines = lines.filter((l) => l.status === "active").length;
  const inProgressOrders = orders.filter((o) => o.status === "in_progress").length;
  const totalProduced = dailyProd.reduce((sum, d) => sum + d.produced, 0);
  const totalDefected = dailyProd.reduce((sum, d) => sum + d.defected, 0);
  const defectRate = totalProduced > 0 ? ((totalDefected / totalProduced) * 100).toFixed(1) : "0";
  const brokenMachines = machines.filter((m) => m.status === "broken").length;
  const pendingAdvances = advances.filter((a) => a.status === "pending").length;

  // Build KPI cards dynamically based on enabled modules
  const kpiCards: { title: string; value: number; icon: React.ElementType; subtitle: string; subtitleType: "positive" | "negative" | "neutral" }[] = [];

  if (hasEmployees) {
    kpiCards.push({ title: "إجمالي العمال", value: totalEmps, icon: Users, subtitle: `${activeEmps} نشط`, subtitleType: "positive" });
  }
  if (hasFactory) {
    kpiCards.push({ title: "خطوط نشطة", value: activeLines, icon: Factory, subtitle: `${inProgressOrders} أمر قيد التنفيذ`, subtitleType: "positive" });
  }
  if (hasProductionModels) {
    kpiCards.push({ title: "إجمالي الإنتاج", value: totalProduced, icon: TrendingUp, subtitle: `نسبة العيوب ${defectRate}%`, subtitleType: Number(defectRate) <= 5 ? "positive" : "negative" });
  }
  if (hasAdvances) {
    kpiCards.push({ title: "سلف معلقة", value: pendingAdvances, icon: HandCoins, subtitle: "بانتظار الموافقة", subtitleType: "neutral" });
  }
  // If no specific modules, show a default KPI
  if (kpiCards.length === 0) {
    kpiCards.push({ title: "مرحباً", value: 0, icon: Users, subtitle: "قم بتفعيل الموديولات من الإعدادات", subtitleType: "neutral" });
  }

  // Department chart data
  const deptCounts: Record<string, number> = {};
  employees.forEach((e) => { if (e.departmentId) { const d = departments.find((d) => d.id === e.departmentId); if (d) deptCounts[d.name] = (deptCounts[d.name] || 0) + 1; } });
  const deptData = Object.entries(deptCounts).map(([name, value], i) => ({ name, value, color: ["#4A2C3F", "#6B3A5A", "#8B4870", "#AB5680", "#E85D4A", "#059669", "#D97706"][i % 7] }));

  // Production lines data for chart
  const lineProduction = lines.map((line) => {
    const lineProd = dailyProd.filter((d) => d.lineId === line.id).reduce((sum, d) => sum + d.produced, 0);
    return { name: line.name.split(" - ")[0], value: lineProd, color: "#4A2C3F" };
  }).filter((l) => l.value > 0);

  // Recent in-progress orders
  const recentOrders = orders.filter((o) => o.status === "in_progress").slice(0, 3);

  // Upcoming reviews
  const upcomingReviews = reviews.filter((r) => r.status === "pending").slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* KPI Row — dynamic based on enabled modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{kpiCards.map((kpi, i) => (<div key={i} style={{ animationDelay: `${i * 0.05}s` }}><KpiCard {...kpi} /></div>))}</div>

      {/* Charts Row — conditionally render based on modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Employees by Department */}
        {hasEmployees && (
          <Card className="theme-card"><CardContent className="p-5"><p className="text-sm font-medium text-white/70 mb-4">العمال حسب القسم</p><BarChart data={deptData.length > 0 ? deptData : [{ name: "خياطة", value: 6, color: "#4A2C3F" }, { name: "قص", value: 2, color: "#E85D4A" }, { name: "كي", value: 2, color: "#6B3A5A" }, { name: "جودة", value: 1, color: "#8B4870" }, { name: "مستودع", value: 1, color: "#AB5680" }]} /></CardContent></Card>
        )}
        {/* Production by Line */}
        {hasFactory && (
          <Card className="theme-card"><CardContent className="p-5"><p className="text-sm font-medium text-white/70 mb-4">الإنتاج حسب الخط</p><BarChart data={lineProduction.length > 0 ? lineProduction : [{ name: "خط أ", value: 420, color: "#4A2C3F" }, { name: "خط ب", value: 280, color: "#6B3A5A" }, { name: "خط كي", value: 450, color: "#E85D4A" }]} /></CardContent></Card>
        )}
        {/* Attendance Summary */}
        {hasAttendance && (
          <Card className="theme-card"><CardContent className="p-5"><p className="text-sm font-medium text-white/70 mb-4">ملخص الحضور اليوم</p>
            <div className="space-y-3">
              {[{ label: "حاضرون", count: todayPresent, color: "bg-green-500" }, { label: "متأخرون", count: todayLate, color: "bg-yellow-500" }, { label: "غائبون", count: todayAbsent, color: "bg-red-500" }, { label: "في إجازة", count: onLeaveEmps, color: "bg-blue-500" }].map((item) => (
                <div key={item.label}><div className="flex justify-between text-sm"><span className="text-white/70">{item.label}</span><span className="text-white font-medium">{item.count}</span></div><div className="h-2 bg-white/[0.06] rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.count / Math.max(totalEmps, 1)) * 100}%` }} /></div></div>
              ))}
            </div>
          </CardContent></Card>
        )}
      </div>

      {/* Orders & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Production Orders */}
        {hasProductionModels && (
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-white/70 mb-4">أوامر الإنتاج القائمة</p>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-4">لا توجد أوامر قيد التنفيذ</p>
                ) : recentOrders.map((order) => {
                  const progress = order.quantity > 0 ? Math.round((order.completed / order.quantity) * 100) : 0;
                  return (
                    <div key={order.id} className="py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-right">
                          <p className="text-sm text-white/80 font-medium">{order.orderCode} - {order.styleName}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{order.customerName} | {order.assignedLineName || "—"}</p>
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-[#4A2C3F] rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-white/40 mt-1 text-right">{order.completed} / {order.quantity} قطعة</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activities */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-white/70 mb-4">ملخص سريع</p>
            <div className="space-y-3">
              {hasEmployees && (
                <div className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-green-400"><UserCheck size={14} /></div>
                  <div className="flex-1 min-w-0 text-right"><p className="text-sm text-white/80">{activeEmps} عامل نشط من أصل {totalEmps}</p></div>
                </div>
              )}
              {hasAttendance && (
                <div className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-blue-400"><Clock size={14} /></div>
                  <div className="flex-1 min-w-0 text-right"><p className="text-sm text-white/80">{todayPresent} حاضر، {todayLate} متأخر، {todayAbsent} غائب</p></div>
                </div>
              )}
              {hasFactory && (
                <div className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-purple-400"><Factory size={14} /></div>
                  <div className="flex-1 min-w-0 text-right"><p className="text-sm text-white/80">{activeLines} خط نشط، {inProgressOrders} أمر قيد التنفيذ</p></div>
                </div>
              )}
              {hasMachines && (
                <div className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                  <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center ${brokenMachines > 0 ? "text-red-400" : "text-green-400"}`}><Cog size={14} /></div>
                  <div className="flex-1 min-w-0 text-right"><p className="text-sm text-white/80">{brokenMachines > 0 ? `${brokenMachines} ماكينة تحتاج صيانة` : "جميع الماكينات تعمل"}</p></div>
                </div>
              )}
              {hasAdvances && (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#E85D4A]"><HandCoins size={14} /></div>
                  <div className="flex-1 min-w-0 text-right"><p className="text-sm text-white/80">{pendingAdvances} طلب سلفة بانتظار الموافقة</p></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews & Machines Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Reviews */}
        {hasPerformance && (
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-white/70 mb-4">التقييمات القادمة</p>
              <div className="space-y-3">
                {upcomingReviews.length === 0 ? <p className="text-sm text-white/40 text-center py-4">لا توجد تقييمات معلقة</p> : upcomingReviews.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#4A2C3F]/30 flex items-center justify-center text-xs font-medium text-white">{r.employeeName.charAt(0)}</div>
                    <div className="flex-1 min-w-0 text-right"><p className="text-sm text-white/80">{r.employeeName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>المراجع: {r.reviewerName}</p></div>
                    <span className="text-xs text-[#E85D4A] whitespace-nowrap">{r.period}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Machine Status */}
        {hasMachines && (
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-white/70 mb-4">حالة الماكينات</p>
              <div className="space-y-3">
                {[
                  { label: "تعمل", count: machines.filter((m) => m.status === "operational").length, color: "bg-green-500" },
                  { label: "صيانة", count: machines.filter((m) => m.status === "maintenance").length, color: "bg-yellow-500" },
                  { label: "معطلة", count: machines.filter((m) => m.status === "broken").length, color: "bg-red-500" },
                  { label: "خاملة", count: machines.filter((m) => m.status === "idle").length, color: "bg-white/20" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-white/70 flex-1 text-right">{item.label}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.count}</span>
                  </div>
                ))}
                {machines.filter((m) => m.nextMaintenance && new Date(m.nextMaintenance) < new Date()).length > 0 && (
                  <p className="text-xs text-red-400 text-right mt-2">
                    ⚠️ {machines.filter((m) => m.nextMaintenance && new Date(m.nextMaintenance) < new Date()).length} ماكينة متأخرة في الصيانة
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
