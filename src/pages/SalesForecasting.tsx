import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from "lucide-react";

interface ForecastData {
  month: string;
  actual: number;
  forecast: number;
  variance: number;
}

const mockData: Record<string, ForecastData[]> = {
  "2026": [
    { month: "يناير", actual: 285000, forecast: 300000, variance: -5 },
    { month: "فبراير", actual: 310000, forecast: 320000, variance: -3.1 },
    { month: "مارس", actual: 350000, forecast: 340000, variance: 2.9 },
    { month: "أبريل", actual: 290000, forecast: 330000, variance: -12.1 },
    { month: "مايو", actual: 380000, forecast: 360000, variance: 5.6 },
    { month: "يونيو", actual: 0, forecast: 400000, variance: 0 },
    { month: "يوليو", actual: 0, forecast: 420000, variance: 0 },
    { month: "أغسطس", actual: 0, forecast: 380000, variance: 0 },
    { month: "سبتمبر", actual: 0, forecast: 450000, variance: 0 },
    { month: "أكتوبر", actual: 0, forecast: 480000, variance: 0 },
    { month: "نوفمبر", actual: 0, forecast: 520000, variance: 0 },
    { month: "ديسمبر", actual: 0, forecast: 550000, variance: 0 },
  ],
};

export default function SalesForecasting() {
  const [year, setYear] = useState("2026");
  const data = mockData[year] || [];
  const completedData = data.filter(d => d.actual > 0);
  const avgGrowth = completedData.length > 1
    ? ((completedData[completedData.length - 1].actual - completedData[0].actual) / completedData[0].actual * 100)
    : 0;
  const totalActual = completedData.reduce((sum, d) => sum + d.actual, 0);
  const totalForecast = data.reduce((sum, d) => sum + d.forecast, 0);
  const remainingForecast = totalForecast - totalActual;

  const maxValue = Math.max(...data.map(d => Math.max(d.actual || 0, d.forecast)));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>توقعات المبيعات</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تحليل الأداء والتوقعات المستقبلية</p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32 text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} style={{ color: "var(--accent-color)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الفعلي</span>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--accent-color)" }}>{totalActual.toLocaleString("ar-EG")} ج.م</p>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} style={{ color: "var(--accent-color)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>التوقع السنوي</span>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--accent-color)" }}>{totalForecast.toLocaleString("ar-EG")} ج.م</p>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} style={{ color: "var(--accent-color)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>المتبقي</span>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--accent-color)" }}>{remainingForecast.toLocaleString("ar-EG")} ج.م</p>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              {avgGrowth >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-red-500" />}
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>معدل النمو</span>
            </div>
            <p className={`text-lg font-bold ${avgGrowth >= 0 ? "text-emerald-500" : "text-red-500"}`}>{avgGrowth.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>فعلي vs توقع - {year}</h3>
          <div className="space-y-3">
            {data.map((d, i) => {
              const actualPct = d.actual > 0 ? (d.actual / maxValue) * 100 : 0;
              const forecastPct = (d.forecast / maxValue) * 100;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-primary)" }} className="w-16">{d.month}</span>
                    <div className="flex-1 mx-3">
                      <div className="flex gap-1">
                        {d.actual > 0 && (
                          <div className="h-5 rounded flex items-center justify-end px-1 text-xs text-white font-medium transition-all" style={{ width: `${actualPct}%`, background: "var(--accent-color)", minWidth: d.actual > 0 ? 40 : 0 }}>
                            {(d.actual / 1000).toFixed(0)}k
                          </div>
                        )}
                        <div className="h-5 rounded border-2 border-dashed flex items-center justify-end px-1 text-xs font-medium" style={{ width: `${forecastPct - actualPct}%`, borderColor: "var(--text-muted)", color: "var(--text-muted)", minWidth: 30 }}>
                          {(d.forecast / 1000).toFixed(0)}k
                        </div>
                      </div>
                    </div>
                    {d.variance !== 0 && (
                      <span className={`w-12 text-right text-xs ${d.variance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {d.variance > 0 ? "+" : ""}{d.variance}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: "var(--accent-color)" }} /><span className="text-xs" style={{ color: "var(--text-muted)" }}>فعلي</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border-2 border-dashed" style={{ borderColor: "var(--text-muted)" }} /><span className="text-xs" style={{ color: "var(--text-muted)" }}>توقع</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Analysis */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>التحليل الموسمي</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { season: "Q1 (شتاء)", months: "يناير - مارس", trend: "ارتفاع تدريجي", icon: TrendingUp },
              { season: "Q2 (ربيع)", months: "أبريل - يونيو", trend: "ذروة الموسم", icon: TrendingUp },
              { season: "Q3 (صيف)", months: "يوليو - سبتمبر", trend: "استقرار", icon: BarChart3 },
              { season: "Q4 (خريف)", months: "أكتوبر - ديسمبر", trend: "أعلى المبيعات", icon: TrendingUp },
            ].map(({ season, months, trend, icon: Icon }) => (
              <div key={season} className="p-3 rounded-lg" style={{ background: "var(--bg-body)", border: "1px solid var(--border-color)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{season}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{months}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Icon size={14} style={{ color: "var(--accent-color)" }} />
                  <span className="text-xs" style={{ color: "var(--accent-color)" }}>{trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
