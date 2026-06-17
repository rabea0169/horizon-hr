import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Brain, TrendingUp, Package, DollarSign, Factory, AlertTriangle, Lightbulb, Target } from "lucide-react";

const salesForecast = [
  { month: "يناير", actual: 850, predicted: 820 },
  { month: "فبراير", actual: 920, predicted: 880 },
  { month: "مارس", actual: 780, predicted: 810 },
  { month: "أبريل", actual: 980, predicted: 950 },
  { month: "مايو", actual: 1050, predicted: 1020 },
  { month: "يونيو", actual: 1120, predicted: 1100 },
  { month: "يوليو", actual: null, predicted: 1180 },
  { month: "أغسطس", actual: null, predicted: 1250 },
  { month: "سبتمبر", actual: null, predicted: 1210 },
];

const productionEfficiency = [
  { line: "L1", current: 82, predicted: 85, gap: +3 },
  { line: "L2", current: 76, predicted: 82, gap: +6 },
  { line: "L3", current: 88, predicted: 87, gap: -1 },
  { line: "L4", current: 71, predicted: 78, gap: +7 },
  { line: "L5", current: 85, predicted: 86, gap: +1 },
];

const purchaseRecommendations = [
  { item: "Cotton Poplin 240gsm", currentStock: 120, predictedNeed: 350, orderQty: 500, urgency: "high", reason: "3 أوامر بيع جديدة + رصيد منخفض" },
  { item: "Denim 12oz", currentStock: 45, predictedNeed: 200, orderQty: 300, urgency: "high", reason: "موسم الشتاء قادم + رصيد حرج" },
  { item: "Poly Thread 40/2", currentStock: 80, predictedNeed: 150, orderQty: 200, urgency: "medium", reason: "استهلاك شهري ثابت" },
  { item: "Elastic Band 2cm", currentStock: 200, predictedNeed: 180, orderQty: 0, urgency: "low", reason: "الرصيد كافٍ للشهرين القادمين" },
  { item: "Labels - Woven", currentStock: 500, predictedNeed: 400, orderQty: 0, urgency: "low", reason: "الرصيد مريح" },
];

const bottleneckPrediction = [
  { operation: "Join Shoulder", currentSam: 0.45, predictedSam: 0.42, workers: 2, suggestion: "إضافة عامل" },
  { operation: "Attach Sleeve", currentSam: 0.38, predictedSam: 0.38, workers: 2, suggestion: "تدريب" },
  { operation: "Hem Bottom", currentSam: 0.52, predictedSam: 0.48, workers: 1, suggestion: "إضافة عامل + تدريب" },
];

export default function AIPredictions() {
  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Brain size={20} style={{ color: "var(--accent-color)" }} /><h2 className="text-xl font-bold">تحليلات الذكاء الاصطناعي</h2></div>
        <Badge variant="outline" className="bg-purple-500/15 text-purple-400">نموذج ML v2.4</Badge>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><DollarSign size={16} style={{ color: "var(--accent-color)" }} /><p className="text-2xl font-bold mt-1">1,180K</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>توقع يوليو</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><Factory size={16} className="text-blue-400" /><p className="text-2xl font-bold mt-1">83.6%</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>متوسط كفاءة متوقع</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><Package size={16} className="text-yellow-400" /><p className="text-2xl font-bold mt-1">2</p><p className="text-xs text-red-400">طلبات شراء عاجلة</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><Target size={16} className="text-emerald-400" /><p className="text-2xl font-bold mt-1">94.2%</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>دقة التوقعات</p></CardContent></Card>
      </div>

      {/* Sales Forecast */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <h3 className="font-bold mb-2 flex items-center gap-2"><TrendingUp size={16} style={{ color: "var(--accent-color)" }} /> توقع المبيعات — آلاف ج.م</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesForecast}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="month" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} />
                <Area type="monotone" dataKey="actual" name="فعلي" stroke="#4A2C3F" fill="#4A2C3F" fillOpacity={0.3} /><Area type="monotone" dataKey="predicted" name="متوقع" stroke="#E85D4A" fill="#E85D4A" fillOpacity={0.1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>الشريط الأحمر المتقطع = توقع ML للأشهر القادمة | دقة النموذج: 94.2%</p>
        </CardContent>
      </Card>

      {/* Production Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Factory size={16} className="text-blue-400" /> كفاءة الخطوط — الحالي vs المتوقع</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productionEfficiency}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="line" stroke="var(--text-muted)" /><YAxis domain={[60, 95]} stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} />
                  <Bar dataKey="current" name="الحالي" fill="#4A2C3F" radius={[4,4,0,0]} /><Bar dataKey="predicted" name="المتوقع" fill="#2D6B5E" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bottleneck Predictions */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-400" /> توقع الاختناقات</h3>
            <div className="space-y-2">
              {bottleneckPrediction.map((b, i) => (
                <div key={i} className="p-2 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
                  <div className="flex justify-between"><span className="text-sm font-medium">{b.operation}</span><span className="text-xs" style={{ color: "var(--text-muted)" }}>{b.workers} عامل</span></div>
                  <div className="flex gap-3 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    <span>SAM: {b.currentSam} → <span className="text-emerald-400">{b.predictedSam}</span></span>
                    {b.suggestion && <span className="text-yellow-400">{b.suggestion}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Recommendations */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-yellow-400" /> توصيات الشراء الذكية</h3>
          <div className="space-y-2">
            {purchaseRecommendations.map((rec, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border-color)", background: rec.urgency === "high" ? "rgba(232,93,74,0.05)" : rec.urgency === "medium" ? "rgba(196,147,63,0.05)" : "transparent" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{rec.item}</span>
                    <Badge variant="outline" className={rec.urgency === "high" ? "bg-red-500/15 text-red-400" : rec.urgency === "medium" ? "bg-yellow-500/15 text-yellow-400" : "bg-emerald-500/15 text-emerald-400"}>
                      {rec.urgency === "high" ? "عاجل" : rec.urgency === "medium" ? "متوسط" : "منخفض"}
                    </Badge>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{rec.reason}</p>
                  <div className="flex gap-4 text-xs mt-1">
                    <span>الرصيد: <span className={rec.currentStock < 100 ? "text-red-400" : ""}>{rec.currentStock}</span></span>
                    <span>الحاجة المتوقعة: {rec.predictedNeed}</span>
                    {rec.orderQty > 0 && <span className="text-emerald-400">مقترح: {rec.orderQty}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
