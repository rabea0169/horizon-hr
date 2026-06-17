import { useMemo } from "react";
import { useEmployees, useAttendance, useSalesOrders, useCostRecords, useQCRecords, useProductionModels } from "@/hooks/useLocalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, ShoppingCart, AlertTriangle, CheckCircle, DollarSign, Package, Target } from "lucide-react";

export default function AdvancedBI() {
  const { data: employees } = useEmployees();
  const { data: attendance } = useAttendance();
  const { data: salesOrders } = useSalesOrders();
  const { data: costRecords } = useCostRecords();
  const { data: qcRecords } = useQCRecords();
  const { data: models } = useProductionModels();

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance.filter((a) => a.date === today);

  // KPIs
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const todayPresent = todayAttendance.filter((a) => a.status === "present" || a.status === "late").length;
  const totalSales = salesOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const avgDefectRate = qcRecords.length > 0 ? (qcRecords.reduce((s, r) => s + Number(r.defectRate), 0) / qcRecords.length).toFixed(1) : "0";
  const totalRevenue = salesOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.totalAmount), 0);
  const pendingOrders = salesOrders.filter((o) => o.status === "pending" || o.status === "confirmed").length;
  const inProdOrders = salesOrders.filter((o) => o.status === "in_production").length;

  // Top models by cost
  const modelCostSummary = useMemo(() => {
    const map = new Map<string, { name: string; cost: number; count: number }>();
    costRecords.forEach((r) => { const e = map.get(r.modelName) || { name: r.modelName, cost: 0, count: 0 }; e.cost += Number(r.totalCost); e.count++; map.set(r.modelName, e); });
    return Array.from(map.values()).sort((a, b) => b.cost - a.cost).slice(0, 5);
  }, [costRecords]);

  // QC trend
  const qcByStage = useMemo(() => {
    const stages = ["fabric", "cutting", "sewing", "pressing", "packing"] as const;
    return stages.map((s) => {
      const records = qcRecords.filter((r) => r.stage === s);
      const avgRate = records.length > 0 ? (records.reduce((sum, r) => sum + Number(r.defectRate), 0) / records.length).toFixed(1) : "0";
      return { stage: s, label: { fabric: "قماش", cutting: "قص", sewing: "خياطة", pressing: "كي", packing: "تغليف" }[s], count: records.length, avgRate };
    });
  }, [qcRecords]);

  // Sales by status
  const salesByStatus = useMemo(() => {
    const statuses = ["pending", "confirmed", "in_production", "ready", "dispatched", "delivered"] as const;
    return statuses.map((s) => ({ status: s, count: salesOrders.filter((o) => o.status === s).length, amount: salesOrders.filter((o) => o.status === s).reduce((sum, o) => sum + Number(o.totalAmount), 0) }));
  }, [salesOrders]);

  // Attendance this week
  const thisWeekAttendance = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().split("T")[0]); }
    return days.map((date) => ({ date: date.slice(5), present: attendance.filter((a) => a.date === date && (a.status === "present" || a.status === "late")).length, absent: attendance.filter((a) => a.date === date && a.status === "absent").length }));
  }, [attendance]);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>لوحة التحليلات المتقدمة</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>KPIs وتحليلات الأداء</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "الموظفين النشطين", value: activeEmployees, icon: Users, color: "#60A5FA" },
          { label: "حاضرين اليوم", value: todayPresent, icon: CheckCircle, color: "#34D399" },
          { label: "إجمالي المبيعات", value: `${totalSales.toLocaleString()} ج`, icon: DollarSign, color: "#FBBF24" },
          { label: "متوسط نسبة العيب", value: `${avgDefectRate}%`, icon: AlertTriangle, color: Number(avgDefectRate) > 5 ? "#E85D4A" : "#A78BFA" },
        ].map((kpi) => (
          <Card key={kpi.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <kpi.icon size={20} style={{ color: kpi.color }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{kpi.label}</p>
              </div>
              <p className="text-2xl font-bold mt-2" style={{ color: kpi.color }}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إيرادات مسلمة", value: `${totalRevenue.toLocaleString()} ج`, icon: TrendingUp, color: "#34D399" },
          { label: "أوامر معلقة", value: pendingOrders, icon: Target, color: "#FBBF24" },
          { label: "في الإنتاج", value: inProdOrders, icon: Package, color: "#A78BFA" },
          { label: "موديلات نشطة", value: models.filter((m) => m.status === "active").length, icon: ShoppingCart, color: "#60A5FA" },
        ].map((kpi) => (
          <Card key={kpi.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <kpi.icon size={18} style={{ color: kpi.color }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{kpi.label}</p>
              </div>
              <p className="text-xl font-bold mt-2" style={{ color: kpi.color }}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Models by Cost */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>أعلى الموديلات تكلفة</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {modelCostSummary.length === 0 && <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>لا توجد بيانات</p>}
            {modelCostSummary.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{m.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (m.cost / (modelCostSummary[0]?.cost || 1)) * 100)}%`, background: "var(--accent-color)" }} />
                  </div>
                  <span className="text-sm font-bold text-amber-400">{m.cost.toLocaleString()} ج</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* QC by Stage */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>جودة حسب المرحلة</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {qcByStage.map((s) => (
              <div key={s.stage} className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{s.label}</Badge>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.count} فحص</span>
                  <span className={`text-sm font-bold ${Number(s.avgRate) > 5 ? "text-red-400" : "text-green-400"}`}>{s.avgRate}%</span>
                </div>
              </div>
            ))}
            {qcByStage.every((s) => s.count === 0) && <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>لا توجد بيانات QC</p>}
          </CardContent>
        </Card>

        {/* Sales Pipeline */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>خط أنابيب المبيعات</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {salesByStatus.filter((s) => s.count > 0).map((s) => (
              <div key={s.status} className="flex items-center justify-between p-2 rounded" style={{ background: "var(--bg-primary)" }}>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.status === "pending" ? "معلق" : s.status === "confirmed" ? "مؤكد" : s.status === "in_production" ? "في الإنتاج" : s.status === "ready" ? "جاهز" : s.status === "dispatched" ? "مشحون" : "مسلم"}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px]">{s.count} أمر</Badge>
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.amount.toLocaleString()} ج</span>
                </div>
              </div>
            ))}
            {salesByStatus.every((s) => s.count === 0) && <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>لا توجد أوامر بيع</p>}
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>الحضور (آخر 7 أيام)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-28">
              {thisWeekAttendance.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col gap-0.5">
                    <div className="w-full rounded-t" style={{ height: `${Math.max(4, (d.present / Math.max(1, activeEmployees)) * 80)}px`, background: "#34D399" }} />
                    <div className="w-full rounded-b" style={{ height: `${Math.max(2, (d.absent / Math.max(1, activeEmployees)) * 80)}px`, background: "#E85D4A" }} />
                  </div>
                  <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{d.date}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#34D399" }} /><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>حاضر</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#E85D4A" }} /><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>غائب</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
