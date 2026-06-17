import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Package, CheckCircle, AlertTriangle, User, CalendarDays } from "lucide-react";

const DEMO_DATA = {
  name: "أحمد محمد",
  code: "EMP-0012",
  department: "خياطة",
  line: "Line 3",
  machine: "Overlock 4T",
  skillLevel: "Expert",
  joinDate: "2024-03-15",
  // Today's production
  todayPieces: 142,
  todayTarget: 150,
  todayDefects: 3,
  hourlyRate: [18, 22, 19, 25, 20, 15, 23, 24, 21, 20, 22, 24],
  // This month
  monthPieces: 3240,
  monthTarget: 3300,
  monthSalary: 4850,
  baseSalary: 3500,
  pieceRateEarnings: 920,
  qualityBonus: 280,
  overtimePay: 150,
  // Attendance this month
  presentDays: 22,
  lateDays: 2,
  absentDays: 0,
  leavesUsed: 2,
  leavesBalance: 18,
  // Quality
  qualityScore: 96,
  defectRate: 1.8,
  reworkRate: 0.5,
};

export default function WorkerPortal() {
  const [workerCode, setWorkerCode] = useState("EMP-0012");
  const [authenticated, setAuthenticated] = useState(true);
  const d = DEMO_DATA;

  if (!authenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-sm" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-6 space-y-4">
            <div className="text-center"><User size={40} className="mx-auto mb-2" style={{ color: "var(--accent-color)" }} /><h2 className="text-lg font-bold">بوابة العامل</h2></div>
            <Input placeholder="كود العامل..." value={workerCode} onChange={e => setWorkerCode(e.target.value)} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <Button className="w-full text-white" style={{ background: "var(--accent-color)" }} onClick={() => setAuthenticated(true)}>دخول</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--accent-color)" }}>
            <User size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{d.name}</h2>
            <div className="flex gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>{d.code}</span><span>•</span><span>{d.department}</span><span>•</span><span>{d.line}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400">{d.skillLevel}</Badge>
          <Button size="sm" variant="outline" onClick={() => setAuthenticated(false)}>تبديل</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1"><Package size={14} style={{ color: "var(--accent-color)" }} /><span className="text-xs" style={{ color: "var(--text-muted)" }}>إنتاج اليوم</span></div>
            <p className="text-xl font-bold">{d.todayPieces}<span className="text-xs font-normal mr-1" style={{ color: "var(--text-muted)" }}>/ {d.todayTarget}</span></p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1"><div className="h-1.5 rounded-full" style={{ width: `${(d.todayPieces / d.todayTarget) * 100}%`, background: "var(--accent-color)" }} /></div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-emerald-400" /><span className="text-xs" style={{ color: "var(--text-muted)" }}>الراتب الشهري</span></div>
            <p className="text-xl font-bold text-emerald-400">{d.monthSalary.toLocaleString()}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>ج.م</p>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1"><CheckCircle size={14} className="text-blue-400" /><span className="text-xs" style={{ color: "var(--text-muted)" }}>جودة</span></div>
            <p className="text-xl font-bold text-blue-400">{d.qualityScore}%</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>نسبة القبول</p>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1"><CalendarDays size={14} className="text-yellow-400" /><span className="text-xs" style={{ color: "var(--text-muted)" }}>الحضور</span></div>
            <p className="text-xl font-bold">{d.presentDays}<span className="text-xs font-normal mr-1" style={{ color: "var(--text-muted)" }}>/ 24</span></p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{d.lateDays} تأخر • {d.absentDays} غياب</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="w-full" style={{ background: "var(--bg-card)" }}>
          <TabsTrigger value="today" className="flex-1">اليوم</TabsTrigger>
          <TabsTrigger value="month" className="flex-1">الشهر</TabsTrigger>
          <TabsTrigger value="salary" className="flex-1">الراتب</TabsTrigger>
          <TabsTrigger value="quality" className="flex-1">الجودة</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3 mt-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
              <p className="text-2xl font-bold" style={{ color: "var(--accent-color)" }}>{d.todayPieces}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>قطعة اليوم</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
              <p className="text-2xl font-bold">{d.todayTarget}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>الهدف</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
              <p className="text-2xl font-bold text-red-400">{d.todayDefects}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>عيوب</p>
            </div>
          </div>
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4">
              <h3 className="text-sm font-bold mb-3">الإنتاج الساعي</h3>
              <div className="flex items-end gap-1 h-32">
                {d.hourlyRate.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t" style={{ height: `${(h / 30) * 100}px`, background: h >= 20 ? "var(--accent-color)" : "rgba(232,93,74,0.6)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{i + 8}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-3 mt-3">
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>إجمالي الإنتاج</span><span className="font-bold">{d.monthPieces.toLocaleString()} قطعة</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>الهدف</span><span>{d.monthTarget.toLocaleString()} قطعة</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>نسبة الإنجاز</span><span className="font-bold" style={{ color: d.monthPieces >= d.monthTarget ? "#2D6B5E" : "#C4933F" }}>{((d.monthPieces / d.monthTarget) * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>أيام الحضور</span><span>{d.presentDays} يوم</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>أيام التأخر</span><span className="text-yellow-400">{d.lateDays} يوم</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>الإجازات المستخدمة</span><span>{d.leavesUsed} / 20</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>رصيد الإجازات</span><span className="text-emerald-400">{d.leavesBalance} يوم</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-3 mt-3">
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>الراتب الأساسي</span><span>{d.baseSalary.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>أجر القطعة</span><span className="text-emerald-400">+{d.pieceRateEarnings.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>علاوة الجودة</span><span className="text-emerald-400">+{d.qualityBonus.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>إضافي</span><span className="text-emerald-400">+{d.overtimePay.toLocaleString()} ج.م</span></div>
              <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: "var(--border-color)" }}><span>الإجمالي</span><span style={{ color: "var(--accent-color)" }}>{d.monthSalary.toLocaleString()} ج.م</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-3 mt-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
              <p className="text-2xl font-bold text-blue-400">{d.qualityScore}%</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>الجودة</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
              <p className="text-2xl font-bold text-yellow-400">{d.defectRate}%</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>نسبة العيوب</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-card)" }}>
              <p className="text-2xl font-bold text-emerald-400">{d.reworkRate}%</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إعادة عمل</p>
            </div>
          </div>
          <Card style={{ background: d.qualityScore >= 95 ? "rgba(45,107,94,0.1)" : d.qualityScore >= 90 ? "rgba(196,147,63,0.1)" : "rgba(232,93,74,0.1)", borderColor: d.qualityScore >= 95 ? "#2D6B5E" : d.qualityScore >= 90 ? "#C4933F" : "#E85D4A" }}>
            <CardContent className="p-3 flex items-center gap-2">
              {d.qualityScore >= 95 ? <CheckCircle size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-yellow-400" />}
              <span className="text-sm">{d.qualityScore >= 95 ? "أداء ممتاز! مؤهل لعلاوة الجودة +15%" : d.qualityScore >= 90 ? "أداء جيد. يمكن التحسين." : "يحتاج تحسين. تدريب مقترح."}</span>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
