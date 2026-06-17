import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { FileText, TrendingUp, AlertTriangle, Clock, Package, DollarSign, Factory, CheckCircle, Truck, BarChart3, PieChart as PieIcon } from "lucide-react";

type ReportTab = "hourly" | "efficiency" | "pareto" | "pending-po" | "pending-so" | "otd" | "financial" | "profit" | "line-output" | "inventory-cat" | "cost-trend";

const COLORS = ["#4A2C3F", "#E85D4A", "#2D6B5E", "#C4933F", "#8B4513", "#5C4033", "#D4A574", "#1C1C1E", "#7B3F58", "#4A6741"];

const HOURLY_DATA = [
  { hour: "8AM", line1: 45, line2: 38, line3: 52, line4: 30 },
  { hour: "9AM", line1: 52, line2: 42, line3: 58, line4: 35 },
  { hour: "10AM", line1: 48, line2: 45, line3: 55, line4: 38 },
  { hour: "11AM", line1: 55, line2: 48, line3: 60, line4: 42 },
  { hour: "12PM", line1: 50, line2: 44, line3: 57, line4: 40 },
  { hour: "1PM", line1: 30, line2: 28, line3: 35, line4: 25 },
  { hour: "2PM", line1: 53, line2: 46, line3: 59, line4: 41 },
  { hour: "3PM", line1: 56, line2: 49, line3: 62, line4: 43 },
  { hour: "4PM", line1: 51, line2: 44, line3: 57, line4: 39 },
];

const EFFICIENCY_DATA = [
  { date: "Jun 1", line1: 72, line2: 68, line3: 75, target: 80 },
  { date: "Jun 2", line1: 75, line2: 70, line3: 78, target: 80 },
  { date: "Jun 3", line1: 78, line2: 74, line3: 82, target: 80 },
  { date: "Jun 4", line1: 80, line2: 76, line3: 83, target: 80 },
  { date: "Jun 5", line1: 82, line2: 78, line3: 85, target: 80 },
  { date: "Jun 6", line1: 79, line2: 73, line3: 81, target: 80 },
  { date: "Jun 7", line1: 83, line2: 80, line3: 86, target: 80 },
  { date: "Jun 8", line1: 85, line2: 82, line3: 88, target: 80 },
  { date: "Jun 9", line1: 81, line2: 77, line3: 84, target: 80 },
  { date: "Jun 10", line1: 84, line2: 80, line3: 87, target: 80 },
  { date: "Jun 11", line1: 86, line2: 83, line3: 89, target: 80 },
  { date: "Jun 12", line1: 88, line2: 85, line3: 91, target: 80 },
];

const DEFECT_DATA = [
  { name: "غرز مفكوكة", value: 35, category: "sewing" },
  { name: "عدم مطابقة مقاس", value: 28, category: "measurement" },
  { name: "خياطة منحرفة", value: 20, category: "sewing" },
  { name: "بقع على القماش", value: 15, category: "appearance" },
  { name: "انحراف البترون", value: 12, category: "cutting" },
  { name: "تباين لون", value: 8, category: "appearance" },
  { name: "شد غير متساوٍ", value: 6, category: "sewing" },
  { name: "أخرى", value: 5, category: "other" },
];

const OTD_DATA = [
  { month: "يناير", onTime: 85, late: 15 },
  { month: "فبراير", onTime: 88, late: 12 },
  { month: "مارس", onTime: 82, late: 18 },
  { month: "أبريل", onTime: 90, late: 10 },
  { month: "مايو", onTime: 87, late: 13 },
  { month: "يونيو", onTime: 92, late: 8 },
];

const PROFIT_DATA = [
  { month: "يناير", revenue: 850000, cost: 620000, profit: 230000 },
  { month: "فبراير", revenue: 920000, cost: 680000, profit: 240000 },
  { month: "مارس", revenue: 780000, cost: 590000, profit: 190000 },
  { month: "أبريل", revenue: 980000, cost: 710000, profit: 270000 },
  { month: "مايو", revenue: 1050000, cost: 740000, profit: 310000 },
  { month: "يونيو", revenue: 1120000, cost: 780000, profit: 340000 },
];

const INV_CAT_DATA = [
  { name: "أقمشة رئيسية", value: 450, pct: 35 },
  { name: "أقمشة مساعدة", value: 180, pct: 14 },
  { name: "خيوط", value: 220, pct: 17 },
  { name: "إكسسوارات", value: 160, pct: 12 },
  { name: "ملصقات", value: 120, pct: 9 },
  { name: "تغليف", value: 100, pct: 8 },
  { name: "خردة", value: 65, pct: 5 },
];

const COST_TREND = [
  { month: "يناير", fabric: 45, labor: 35, overhead: 20, total: 100 },
  { month: "فبراير", fabric: 46, labor: 34, overhead: 20, total: 100 },
  { month: "مارس", fabric: 48, labor: 33, overhead: 19, total: 100 },
  { month: "أبريل", fabric: 44, labor: 36, overhead: 20, total: 100 },
  { month: "مايو", fabric: 47, labor: 34, overhead: 19, total: 100 },
  { month: "يونيو", fabric: 43, labor: 37, overhead: 20, total: 100 },
];

const PENDING_ORDERS = [
  { id: "SO-0001", customer: "ABC Trading", qty: 5000, deliveryDate: "2026-06-15", daysLeft: 3, status: "urgent" },
  { id: "SO-0003", customer: "Nile Garments", qty: 3200, deliveryDate: "2026-06-18", daysLeft: 6, status: "warning" },
  { id: "SO-0005", customer: "Delta Fashions", qty: 8500, deliveryDate: "2026-06-22", daysLeft: 10, status: "normal" },
  { id: "SO-0007", customer: "Euro Style", qty: 1200, deliveryDate: "2026-06-25", daysLeft: 13, status: "normal" },
];

const statusBadge: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-500/15 text-red-400", label: "عاجل" },
  warning: { color: "bg-yellow-500/15 text-yellow-400", label: "تنبيه" },
  normal: { color: "bg-emerald-500/15 text-emerald-400", label: "عادي" },
};

const tabs: { key: ReportTab; label: string; icon: any }[] = [
  { key: "hourly", label: "إنتاج ساعي", icon: Clock },
  { key: "efficiency", label: "كفاءة الخط", icon: Factory },
  { key: "pareto", label: "Pareto العيوب", icon: AlertTriangle },
  { key: "pending-po", label: "PO معلقة", icon: Package },
  { key: "pending-so", label: "SO معلقة", icon: Truck },
  { key: "otd", label: "OTD التسليم", icon: CheckCircle },
  { key: "financial", label: "القيمة المضافة", icon: DollarSign },
  { key: "profit", label: "الربحية", icon: TrendingUp },
  { key: "line-output", label: "إنتاجية الخطوط", icon: BarChart3 },
  { key: "inventory-cat", label: "المخزون", icon: PieIcon },
  { key: "cost-trend", label: "تكلفة القطعة", icon: FileText },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>("hourly");
  const [period, setPeriod] = useState("daily");

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <CardContent className="p-4">
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{title}</h3>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">التقارير والتحليلات المتقدمة</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">يومي</SelectItem>
            <SelectItem value="weekly">أسبوعي</SelectItem>
            <SelectItem value="monthly">شهري</SelectItem>
            <SelectItem value="quarterly">ربع سنوي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <Button
              key={t.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="gap-1"
              onClick={() => setActiveTab(t.key)}
              style={isActive ? { background: "var(--accent-color)", color: "white" } : { borderColor: "var(--border-color)", color: "var(--text-muted)" }}
            >
              <Icon size={14} />
              {t.label}
            </Button>
          );
        })}
      </div>

      {/* Report content */}
      {activeTab === "hourly" && (
        <ChartCard title="تقرير الإنتاج الساعي — يونيو 2026">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_DATA}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="hour" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                <Bar dataKey="line1" name="Line 1" fill="#4A2C3F" /><Bar dataKey="line2" name="Line 2" fill="#E85D4A" /><Bar dataKey="line3" name="Line 3" fill="#2D6B5E" /><Bar dataKey="line4" name="Line 4" fill="#C4933F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {activeTab === "efficiency" && (
        <ChartCard title="كفاءة خطوط الإنتاج % — الهدف 80%">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EFFICIENCY_DATA}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="date" stroke="var(--text-muted)" /><YAxis domain={[60, 95]} stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="line1" name="Line 1" stroke="#4A2C3F" strokeWidth={2} /><Line type="monotone" dataKey="line2" name="Line 2" stroke="#E85D4A" strokeWidth={2} /><Line type="monotone" dataKey="line3" name="Line 3" stroke="#2D6B5E" strokeWidth={2} />
                <Line type="monotone" dataKey="target" name="الهدف" stroke="#C4933F" strokeDasharray="5 5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {activeTab === "pareto" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Pareto Chart — العيوب الأكثر تكراراً">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEFECT_DATA} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis type="number" stroke="var(--text-muted)" /><YAxis dataKey="name" type="category" width={120} stroke="var(--text-muted)" style={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                  <Bar dataKey="value" name="عدد الحالات" fill="#E85D4A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="توزيع العيوب حسب القسم">
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={DEFECT_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{DEFECT_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === "pending-so" && (
        <ChartCard title="أوامر البيع المعلقة — Pending SO Report">
          <div className="space-y-2">
            {PENDING_ORDERS.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div>
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{o.id}</span><Badge variant="outline" className={statusBadge[o.status].color}>{statusBadge[o.status].label}</Badge></div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{o.customer} — {o.qty.toLocaleString()} قطعة</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{o.deliveryDate}</div>
                  <div className="text-xs" style={{ color: o.daysLeft <= 3 ? "#E85D4A" : o.daysLeft <= 7 ? "#C4933F" : "var(--text-muted)" }}>{o.daysLeft} يوم متبقي</div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {activeTab === "pending-po" && (
        <ChartCard title="أوامر الشراء المعلقة — Pending PO Report">
          <div className="space-y-2">
            {[
              { id: "PO-0001", supplier: "Al-Amal Textile", item: "Cotton Poplin 240gsm", qty: 5000, eta: "2026-06-14", days: 2, status: "urgent" },
              { id: "PO-0003", supplier: "Egyptian Cotton Co", item: "Denim 12oz", qty: 2000, eta: "2026-06-20", days: 8, status: "warning" },
              { id: "PO-0005", supplier: "Nile Thread Mills", item: "Polyester Thread 40/2", qty: 1000, eta: "2026-06-25", days: 13, status: "normal" },
            ].map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div>
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{o.id}</span><Badge variant="outline" className={statusBadge[o.status].color}>{statusBadge[o.status].label}</Badge></div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{o.supplier} — {o.item}</div>
                </div>
                <div className="text-right"><div className="text-sm">{o.qty.toLocaleString()}</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>ETA: {o.eta}</div></div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {activeTab === "otd" && (
        <ChartCard title="On-Time Delivery % — التسليم في الموعد">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={OTD_DATA}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="month" stroke="var(--text-muted)" /><YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                <Bar dataKey="onTime" name="في الموعد" stackId="a" fill="#2D6B5E" /><Bar dataKey="late" name="متأخر" stackId="a" fill="#E85D4A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2 text-sm font-bold" style={{ color: "#2D6B5E" }}>متوسط OTD: 87.2%</div>
        </ChartCard>
      )}

      {activeTab === "financial" && (
        <ChartCard title="القيمة المضافة — VAT 14%">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PROFIT_DATA}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="month" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#4A2C3F" fill="#4A2C3F" fillOpacity={0.3} /><Area type="monotone" dataKey="cost" name="التكلفة" stroke="#E85D4A" fill="#E85D4A" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {activeTab === "profit" && (
        <ChartCard title="تحليل الربحية — Profitability Analysis">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROFIT_DATA}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="month" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                <Bar dataKey="revenue" name="الإيرادات" fill="#4A2C3F" /><Bar dataKey="cost" name="التكلفة" fill="#E85D4A" /><Bar dataKey="profit" name="الربح" fill="#2D6B5E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center"><p className="text-lg font-bold" style={{ color: "#4A2C3F" }}>{PROFIT_DATA.reduce((s, d) => s + d.revenue, 0).toLocaleString()}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الإيرادات</p></div>
            <div className="text-center"><p className="text-lg font-bold" style={{ color: "#E85D4A" }}>{PROFIT_DATA.reduce((s, d) => s + d.cost, 0).toLocaleString()}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي التكلفة</p></div>
            <div className="text-center"><p className="text-lg font-bold" style={{ color: "#2D6B5E" }}>{PROFIT_DATA.reduce((s, d) => s + d.profit, 0).toLocaleString()}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الربح</p></div>
          </div>
        </ChartCard>
      )}

      {activeTab === "line-output" && (
        <ChartCard title="إنتاجية الخطوط — Line Output">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_DATA}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="hour" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                <Bar dataKey="line1" name="Line 1" fill="#4A2C3F" /><Bar dataKey="line2" name="Line 2" fill="#E85D4A" /><Bar dataKey="line3" name="Line 3" fill="#2D6B5E" /><Bar dataKey="line4" name="Line 4" fill="#C4933F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {activeTab === "inventory-cat" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="توزيع المخزون حسب التصنيف">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={INV_CAT_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{INV_CAT_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <div className="space-y-2">
            {INV_CAT_DATA.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} /><span className="text-sm">{item.name}</span></div>
                <div className="text-right"><span className="font-bold text-sm">{item.value}</span><span className="text-xs mr-2" style={{ color: "var(--text-muted)" }}>({item.pct}%)</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "cost-trend" && (
        <ChartCard title="تكلفة القطعة — Cost per Piece Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={COST_TREND}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" /><XAxis dataKey="month" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="fabric" name="الأقمشة" stackId="a" stroke="#4A2C3F" fill="#4A2C3F" fillOpacity={0.4} /><Area type="monotone" dataKey="labor" name="العمالة" stackId="a" stroke="#2D6B5E" fill="#2D6B5E" fillOpacity={0.4} /><Area type="monotone" dataKey="overhead" name="مصاريف تشغيل" stackId="a" stroke="#E85D4A" fill="#E85D4A" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
