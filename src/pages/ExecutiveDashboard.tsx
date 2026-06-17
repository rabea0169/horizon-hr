import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package, Factory, AlertTriangle, Target, Zap } from "lucide-react";

const COLORS = ["#4A2C3F", "#E85D4A", "#2D6B5E", "#C4933F", "#8B4513"];

const revenueData = [
  { day: "1", revenue: 32000 }, { day: "2", revenue: 38000 }, { day: "3", revenue: 29000 }, { day: "4", revenue: 42000 },
  { day: "5", revenue: 35000 }, { day: "6", revenue: 31000 }, { day: "7", revenue: 45000 }, { day: "8", revenue: 48000 },
  { day: "9", revenue: 39000 }, { day: "10", revenue: 44000 }, { day: "11", revenue: 41000 }, { day: "12", revenue: 47000 },
];

const efficiencyData = [
  { line: "L1", efficiency: 82 }, { line: "L2", efficiency: 76 }, { line: "L3", efficiency: 88 },
  { line: "L4", efficiency: 71 }, { line: "L5", efficiency: 85 },
];

const defectData = [
  { name: "غرز مفكوكة", value: 35 }, { name: "عدم مطابقة مقاس", value: 28 },
  { name: "خياطة منحرفة", value: 20 }, { name: "بقع قماش", value: 12 }, { name: "أخرى", value: 5 },
];

const lowStock = [
  { item: "Cotton Poplin 240gsm", stock: 120, min: 200 },
  { item: "Denim 12oz", stock: 45, min: 100 },
  { item: "Poly Thread 40/2", stock: 80, min: 150 },
  { item: "Elastic Band 2cm", stock: 200, min: 300 },
];

const topWorkers = [
  { name: "محمد علي", pieces: 3240, quality: 98, skill: "Expert" },
  { name: "فاطمة عمر", pieces: 3100, quality: 97, skill: "Expert" },
  { name: "أحمد حسن", pieces: 2950, quality: 94, skill: "Intermediate" },
  { name: "خالد محمود", pieces: 2880, quality: 96, skill: "Expert" },
  { name: "سعاد إبراهيم", pieces: 2750, quality: 95, skill: "Intermediate" },
];

export default function ExecutiveDashboard() {
  const [period, setPeriod] = useState("week");

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">لوحة تحكم المدير التنفيذي</h2>
        <div className="flex gap-1">
          {["day", "week", "month"].map(p => (
            <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)} style={period === p ? { background: "var(--accent-color)" } : {}}>
              {p === "day" ? "يوم" : p === "week" ? "أسبوع" : "شهر"}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>الإيرادات اليومية</span><DollarSign size={14} className="text-emerald-400" /></div>
            <p className="text-xl font-bold mt-1">47,000</p>
            <div className="flex items-center gap-1 text-xs text-emerald-400"><TrendingUp size={10} />+12%</div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>إنتاج اليوم</span><Package size={14} style={{ color: "var(--accent-color)" }} /></div>
            <p className="text-xl font-bold mt-1">3,240</p>
            <div className="flex items-center gap-1 text-xs text-emerald-400"><TrendingUp size={10} />+8%</div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>كفاءة الخطوط</span><Factory size={14} className="text-blue-400" /></div>
            <p className="text-xl font-bold mt-1">80.4%</p>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>الهدف: 85%</div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>OTD</span><Target size={14} className="text-yellow-400" /></div>
            <p className="text-xl font-bold mt-1">87.2%</p>
            <div className="flex items-center gap-1 text-xs text-yellow-400"><TrendingDown size={10} />-2%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <h3 className="text-sm font-bold mb-2">الإيرادات — يونيو 2026</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="day" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} />
                  <Bar dataKey="revenue" fill="#4A2C3F" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <h3 className="text-sm font-bold mb-2">كفاءة الخطوط</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="line" stroke="var(--text-muted)" /><YAxis domain={[60, 100]} stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} />
                  <Bar dataKey="efficiency" fill="#2D6B5E" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Defects + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <h3 className="text-sm font-bold mb-2">Top 5 عيوب</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={defectData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>{defectData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><AlertTriangle size={14} className="text-yellow-400" /> مخزون منخفض</h3>
            <div className="space-y-2">
              {lowStock.map((item, i) => {
                const pct = (item.stock / item.min) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1"><span>{item.item}</span><span>{item.stock} / {item.min} رول</span></div>
                    <div className="w-full bg-white/10 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: pct < 50 ? "#E85D4A" : pct < 75 ? "#C4933F" : "#2D6B5E" }} /></div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Workers */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-3">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Zap size={14} style={{ color: "var(--accent-color)" }} /> Top 5 عمال — يونيو 2026</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {topWorkers.map((w, i) => (
              <div key={i} className="p-3 rounded-lg border" style={{ borderColor: "var(--border-color)", background: i === 0 ? "rgba(74,44,63,0.15)" : "transparent" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold" style={{ color: "var(--accent-color)" }}>#{i + 1}</span>
                  <span className="text-sm font-medium">{w.name}</span>
                </div>
                <p className="text-lg font-bold">{w.pieces.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>قطعة</p>
                <div className="flex justify-between text-xs mt-1"><span style={{ color: "var(--text-muted)" }}>جودة: {w.quality}%</span><Badge variant="outline" className="bg-emerald-500/15 text-emerald-400">{w.skill}</Badge></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost per piece */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-3">
          <h3 className="text-sm font-bold mb-2">تكلفة القطعة — 6 نماذج</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { model: "T-Shirt Basic", cost: 45, fabric: 20, labor: 18, overhead: 7 },
              { model: "Polo Shirt", cost: 62, fabric: 28, labor: 24, overhead: 10 },
              { model: "Hoodie", cost: 85, fabric: 40, labor: 30, overhead: 15 },
              { model: "Dress Shirt", cost: 72, fabric: 32, labor: 28, overhead: 12 },
              { model: "Shorts", cost: 38, fabric: 15, labor: 16, overhead: 7 },
              { model: "Jacket", cost: 120, fabric: 55, labor: 42, overhead: 23 },
            ].map((m, i) => (
              <div key={i} className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.model}</p>
                <p className="text-lg font-bold" style={{ color: "var(--accent-color)" }}>{m.cost}</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>ج.م</p>
                <div className="flex gap-1 justify-center mt-1"><span className="text-[9px] px-1 rounded" style={{ background: "#4A2C3F" }}>F</span><span className="text-[9px] px-1 rounded" style={{ background: "#2D6B5E" }}>L</span><span className="text-[9px] px-1 rounded" style={{ background: "#E85D4A" }}>O</span></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Needed for the button component used inline
import { Button } from "@/components/ui/button";
