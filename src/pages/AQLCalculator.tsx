import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, ShieldCheck, CheckCircle2 } from "lucide-react";

// MIL-STD-105E Single Sampling Plan (General Inspection Level II)
const AQL_TABLE: Record<string, Record<number, { sample: number; accept: number; reject: number }>> = {
  "0.65": {
    500: { sample: 50, accept: 0, reject: 1 },
    1200: { sample: 80, accept: 1, reject: 2 },
    3200: { sample: 125, accept: 2, reject: 3 },
    10000: { sample: 200, accept: 3, reject: 4 },
    35000: { sample: 315, accept: 5, reject: 6 },
    150000: { sample: 500, accept: 7, reject: 8 },
  },
  "1.0": {
    500: { sample: 50, accept: 1, reject: 2 },
    1200: { sample: 80, accept: 2, reject: 3 },
    3200: { sample: 125, accept: 3, reject: 4 },
    10000: { sample: 200, accept: 5, reject: 6 },
    35000: { sample: 315, accept: 7, reject: 8 },
    150000: { sample: 500, accept: 10, reject: 11 },
  },
  "1.5": {
    500: { sample: 50, accept: 1, reject: 2 },
    1200: { sample: 80, accept: 3, reject: 4 },
    3200: { sample: 125, accept: 5, reject: 6 },
    10000: { sample: 200, accept: 7, reject: 8 },
    35000: { sample: 315, accept: 10, reject: 11 },
    150000: { sample: 500, accept: 14, reject: 15 },
  },
  "2.5": {
    500: { sample: 50, accept: 2, reject: 3 },
    1200: { sample: 80, accept: 5, reject: 6 },
    3200: { sample: 125, accept: 7, reject: 8 },
    10000: { sample: 200, accept: 10, reject: 11 },
    35000: { sample: 315, accept: 14, reject: 15 },
    150000: { sample: 500, accept: 21, reject: 22 },
  },
  "4.0": {
    500: { sample: 50, accept: 3, reject: 4 },
    1200: { sample: 80, accept: 7, reject: 8 },
    3200: { sample: 125, accept: 10, reject: 11 },
    10000: { sample: 200, accept: 14, reject: 15 },
    35000: { sample: 315, accept: 21, reject: 22 },
    150000: { sample: 500, accept: 21, reject: 22 },
  },
};

function getSamplePlan(lotSize: number, aql: string) {
  const table = AQL_TABLE[aql];
  if (!table) return null;
  const thresholds = Object.keys(table).map(Number).sort((a, b) => a - b);
  const threshold = thresholds.find(t => lotSize <= t) || thresholds[thresholds.length - 1];
  return table[threshold];
}

export default function AQLCalculator() {
  const [lotSize, setLotSize] = useState("5000");
  const [aql, setAql] = useState("2.5");
  const [inspectionLevel, setInspectionLevel] = useState("II");
  const [type, setType] = useState("normal");
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const ls = Number(lotSize);
    if (!ls || ls <= 0) return;
    const plan = getSamplePlan(ls, aql);
    if (!plan) return;
    setResult({ lotSize: ls, aql, inspectionLevel, type, ...plan });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2"><ShieldCheck size={20} style={{ color: "var(--accent-color)" }} /><h2 className="text-xl font-bold">حساب AQL Sampling — MIL-STD-105E</h2></div>

      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>حجم الدفعة (Lot Size)</Label><Input type="number" value={lotSize} onChange={e => setLotSize(e.target.value)} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label>AQL %</Label>
              <Select value={aql} onValueChange={setAql}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="0.65">0.65 (Critical)</SelectItem><SelectItem value="1.0">1.0</SelectItem><SelectItem value="1.5">1.5 (Major)</SelectItem><SelectItem value="2.5">2.5</SelectItem><SelectItem value="4.0">4.0 (Minor)</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Inspection Level</Label>
              <Select value={inspectionLevel} onValueChange={setInspectionLevel}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="I">I (Reduced)</SelectItem><SelectItem value="II">II (General — Normal)</SelectItem><SelectItem value="III">III (Tightened)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>نوع الفحص</Label>
              <Select value={type} onValueChange={setType}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="tightened">Tightened</SelectItem><SelectItem value="reduced">Reduced</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full text-white" style={{ background: "var(--accent-color)" }} onClick={calculate}><Calculator size={16} /> حساب</Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card style={{ background: "rgba(74,44,63,0.15)", borderColor: "var(--accent-color)" }}><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{result.sample}</p><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>حجم العينة</p></CardContent></Card>
          <Card style={{ background: "rgba(45,107,94,0.15)", borderColor: "#2D6B5E" }}><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-emerald-400">{result.accept}</p><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>حد القبول (Ac)</p></CardContent></Card>
          <Card style={{ background: "rgba(232,93,74,0.15)", borderColor: "#E85D4A" }}><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-400">{result.reject}</p><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>حد الرفض (Re)</p></CardContent></Card>
          <Card style={{ background: "rgba(196,147,63,0.15)", borderColor: "#C4933F" }}><CardContent className="p-4 text-center"><p className="text-3xl font-bold" style={{ color: "#C4933F" }}>{((result.sample / result.lotSize) * 100).toFixed(1)}%</p><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>نسبة العينة</p></CardContent></Card>
        </div>
      )}

      {result && (
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-bold flex items-center gap-2"><CheckCircle2 size={16} style={{ color: "var(--accent-color)" }} /> قاعدة القرار</h3>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>إذا عدد العيوب في العينة ≤ <span className="font-bold text-emerald-400">{result.accept}</span> → القبول ✅</p>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>إذا عدد العيوب في العينة ≥ <span className="font-bold text-red-400">{result.reject}</span> → الرفض ❌</p>
            <div className="border-t pt-2 mt-2 space-y-1" style={{ borderColor: "var(--border-color)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>مثال: فحص {result.sample} قطعة عشوائية من {result.lotSize.toLocaleString()} قطعة</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>AQL {result.aql}% = نقطة جودة مقبولة عالمياً</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Reference */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <h3 className="font-bold mb-3">جدول مرجعي سريع</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { aql: "0.65", use: "عيوب حرجة (Critical) — اختبار آمان", color: "bg-red-500/15 text-red-400" },
              { aql: "1.5", use: "عيوب رئيسية (Major) — قص، خياطة", color: "bg-yellow-500/15 text-yellow-400" },
              { aql: "2.5", use: "عيوب بسيطة (Minor) — مظهرية", color: "bg-blue-500/15 text-blue-400" },
              { aql: "4.0", use: "عيوب طفيفة — تغليف، ملصقات", color: "bg-emerald-500/15 text-emerald-400" },
            ].map((item) => (
              <div key={item.aql} className="p-2 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
                <Badge variant="outline" className={item.color}>{item.aql}%</Badge>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{item.use}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
