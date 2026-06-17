import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Calculator, Timer, Factory, TrendingUp, Zap } from "lucide-react";

const STORAGE_KEY = "hr_sam_records";
function loadData(): any[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveData(data: any[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

export default function SAMCalculator() {
  const [data, setData] = useState<any[]>(loadData);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [tab, setTab] = useState<"sam" | "balancing">("sam");
  const [form, setForm] = useState({ operationName: "", machineType: "", samMinutes: "", allowancePercent: "15", difficulty: "medium" as string, targetPerHour: "" });
  const [modelName, setModelName] = useState("T-Shirt Basic");
  const [workingHours, setWorkingHours] = useState("8");
  const [operators, setOperators] = useState("20");

  const persist = (d: any[]) => { setData(d); saveData(d); };
  const create = () => {
    const sam = Number(form.samMinutes) || 0;
    const allowance = Number(form.allowancePercent) || 15;
    const effectiveSam = sam * (1 + allowance / 100);
    const tph = Math.floor(60 / effectiveSam);
    persist([{ id: Date.now(), ...form, samMinutes: sam, allowancePercent: allowance, effectiveSam, targetPerHour: tph }, ...data]);
    setDialog(false); reset();
  };
  const update = () => { if (!editing) return; const sam = Number(form.samMinutes) || 0; const allowance = Number(form.allowancePercent) || 15; const effectiveSam = sam * (1 + allowance / 100); const tph = Math.floor(60 / effectiveSam); persist(data.map(d => d.id === editing.id ? { ...d, ...form, samMinutes: sam, allowancePercent: allowance, effectiveSam, targetPerHour: tph } : d)); setDialog(false); reset(); };
  const remove = (id: number) => { if (!confirm("حذف العملية؟")) return; persist(data.filter(d => d.id !== id)); };
  const reset = () => { setEditing(null); setForm({ operationName: "", machineType: "", samMinutes: "", allowancePercent: "15", difficulty: "medium", targetPerHour: "" }); };

  // Line Balancing Calculations
  const totalSAM = data.reduce((s, d) => s + (Number(d.effectiveSam) || 0), 0);
  const taktTime = Number(workingHours) * 60 / (Number(operators) || 1);
  const totalTarget = Math.floor((Number(workingHours) * 60) / (totalSAM || 1));
  const efficiency = totalSAM > 0 ? Math.min(100, (taktTime / totalSAM) * 100) : 0;

  const bottleneck = data.length > 0 ? data.reduce((max, d) => Number(d.effectiveSam) > Number(max.effectiveSam) ? d : max, data[0]) : null;

  const difficultyColors: Record<string, string> = { low: "bg-emerald-500/15 text-emerald-400", medium: "bg-yellow-500/15 text-yellow-400", high: "bg-red-500/15 text-red-400" };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">حساب SAM + Line Balancing</h2>
        <div className="flex gap-2">
          <Button variant={tab === "sam" ? "default" : "outline"} size="sm" onClick={() => setTab("sam")} style={tab === "sam" ? { background: "var(--accent-color)" } : {}}><Timer size={14} /> SAM</Button>
          <Button variant={tab === "balancing" ? "default" : "outline"} size="sm" onClick={() => setTab("balancing")} style={tab === "balancing" ? { background: "var(--accent-color)" } : {}}><Factory size={14} /> Line Balancing</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold">{data.length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>عمليات</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold">{totalSAM.toFixed(2)}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>دقيقة SAM إجمالي</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold">{totalTarget}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>هدف يومي</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold" style={{ color: efficiency >= 80 ? "#2D6B5E" : "#E85D4A" }}>{efficiency.toFixed(1)}%</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>كفاءة الخط</p></CardContent></Card>
      </div>

      {tab === "sam" && (
        <>
          <div className="flex justify-between">
            <Input placeholder="اسم الموديل" value={modelName} onChange={e => setModelName(e.target.value)} className="max-w-xs text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> عملية جديدة</Button>
          </div>

          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-right">العملية</TableHead><TableHead className="text-right">الماكينة</TableHead><TableHead className="text-right">SAM (د)</TableHead><TableHead className="text-right">Allowance</TableHead><TableHead className="text-right">Effective SAM</TableHead><TableHead className="text-right">الهدف/س</TableHead><TableHead className="text-right">الصعوبة</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.operationName}</TableCell>
                    <TableCell>{d.machineType}</TableCell>
                    <TableCell>{Number(d.samMinutes).toFixed(3)}</TableCell>
                    <TableCell>{d.allowancePercent}%</TableCell>
                    <TableCell className="font-bold" style={{ color: "var(--accent-color)" }}>{Number(d.effectiveSam).toFixed(3)}</TableCell>
                    <TableCell>{d.targetPerHour}</TableCell>
                    <TableCell><Badge variant="outline" className={difficultyColors[d.difficulty]}>{d.difficulty === "low" ? "سهل" : d.difficulty === "medium" ? "متوسط" : "صعب"}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditing(d); setForm({ operationName: d.operationName, machineType: d.machineType, samMinutes: String(d.samMinutes), allowancePercent: String(d.allowancePercent), difficulty: d.difficulty, targetPerHour: String(d.targetPerHour) }); setDialog(true); }}><Pencil size={12} /></Button><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => remove(d.id)}><Trash2 size={12} /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data.length === 0 && <div className="text-center py-8" style={{ color: "var(--text-muted)" }}><Calculator size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد عمليات — أضف أول عملية SAM</p></div>}
        </>
      )}

      {tab === "balancing" && (
        <div className="space-y-4">
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2"><Factory size={16} style={{ color: "var(--accent-color)" }} /> إعدادات الخط</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label>اسم الموديل</Label><Input value={modelName} onChange={e => setModelName(e.target.value)} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="space-y-1"><Label>ساعات العمل/يوم</Label><Input type="number" value={workingHours} onChange={e => setWorkingHours(e.target.value)} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                <div className="space-y-1"><Label>عدد العمال</Label><Input type="number" value={operators} onChange={e => setOperators(e.target.value)} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Bottleneck Alert */}
          {bottleneck && (
            <Card style={{ background: bottleneck && Number(bottleneck.effectiveSam) > taktTime ? "rgba(232,93,74,0.1)" : "var(--bg-card)", borderColor: bottleneck && Number(bottleneck.effectiveSam) > taktTime ? "#E85D4A" : "var(--border-color)" }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2"><Zap size={16} style={{ color: bottleneck && Number(bottleneck.effectiveSam) > taktTime ? "#E85D4A" : "var(--accent-color)" }} /><span className="font-bold">Bottleneck (الاختناق):</span></div>
                <div className="mt-1 text-sm">{bottleneck.operationName} — SAM: {Number(bottleneck.effectiveSam).toFixed(3)} د | الهدف: {bottleneck.targetPerHour}/ساعة</div>
                {Number(bottleneck.effectiveSam) > taktTime && <div className="text-xs mt-1 text-red-400">تحذير: هذه العملية أبطأ من Takt Time المطلوب!</div>}
              </CardContent>
            </Card>
          )}

          {/* Balancing Table */}
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-right">#</TableHead><TableHead className="text-right">العملية</TableHead><TableHead className="text-right">SAM (د)</TableHead><TableHead className="text-right">Takt Time</TableHead>
                <TableHead className="text-right">العمال</TableHead><TableHead className="text-right">الهدف</TableHead><TableHead className="text-right">الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.map((d, i) => {
                  const ops = Math.max(1, Math.ceil(Number(d.effectiveSam) / Math.max(taktTime, 0.1)));
                  const target = Math.floor(60 / Number(d.effectiveSam));
                  const isBottleneck = d.id === bottleneck?.id;
                  return (
                    <TableRow key={d.id} style={isBottleneck ? { background: "rgba(232,93,74,0.05)" } : {}}>
                      <TableCell>{i + 1}</TableCell><TableCell className="font-medium">{d.operationName}</TableCell><TableCell>{Number(d.effectiveSam).toFixed(3)}</TableCell>
                      <TableCell>{taktTime.toFixed(2)}</TableCell><TableCell>{ops}</TableCell><TableCell>{target}/س</TableCell>
                      <TableCell>{isBottleneck ? <Badge variant="outline" className="bg-red-500/15 text-red-400">Bottleneck</Badge> : <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400">متوازن</Badge>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2"><TrendingUp size={16} style={{ color: "var(--accent-color)" }} /> ملخص Line Balancing</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي SAM</p><p className="font-bold">{totalSAM.toFixed(3)} د</p></div>
                <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Takt Time</p><p className="font-bold">{taktTime.toFixed(2)} د</p></div>
                <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>الهدف اليومي</p><p className="font-bold">{totalTarget} قطعة</p></div>
                <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>كفاءة الخط</p><p className="font-bold" style={{ color: efficiency >= 80 ? "#2D6B5E" : "#E85D4A" }}>{efficiency.toFixed(1)}%</p></div>
                <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>العمال المطلوبين</p><p className="font-bold">{Math.ceil(totalSAM / Math.max(taktTime, 0.1))}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
          <DialogHeader><DialogTitle className="text-right">{editing ? "تعديل عملية" : "عملية SAM جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-right" dir="rtl">
            <div className="space-y-1"><Label>اسم العملية</Label><Input value={form.operationName} onChange={e => setForm({ ...form, operationName: e.target.value })} placeholder="مثال: Join Shoulder" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>نوع الماكينة</Label><Input value={form.machineType} onChange={e => setForm({ ...form, machineType: e.target.value })} placeholder="مثال: Overlock 4T" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>SAM (دقيقة)</Label><Input type="number" step="0.001" value={form.samMinutes} onChange={e => setForm({ ...form, samMinutes: e.target.value })} placeholder="0.450" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Allowance %</Label><Input type="number" value={form.allowancePercent} onChange={e => setForm({ ...form, allowancePercent: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>الصعوبة</Label><Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">سهل</SelectItem><SelectItem value="medium">متوسط</SelectItem><SelectItem value="high">صعب</SelectItem></SelectContent></Select></div>
            </div>
            {form.samMinutes && form.allowancePercent && (
              <div className="border rounded p-2 text-sm space-y-1" style={{ borderColor: "var(--border-color)" }}>
                <div className="flex justify-between"><span>SAM الأساسي:</span><span>{Number(form.samMinutes).toFixed(3)} د</span></div>
                <div className="flex justify-between"><span>Allowance ({form.allowancePercent}%):</span><span>{(Number(form.samMinutes) * Number(form.allowancePercent) / 100).toFixed(3)} د</span></div>
                <div className="flex justify-between font-bold" style={{ color: "var(--accent-color)" }}><span>Effective SAM:</span><span>{(Number(form.samMinutes) * (1 + Number(form.allowancePercent) / 100)).toFixed(3)} د</span></div>
                <div className="flex justify-between"><span>الهدف/ساعة:</span><span>{Math.floor(60 / (Number(form.samMinutes) * (1 + Number(form.allowancePercent) / 100)))} قطعة</span></div>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={editing ? update : create} className="text-white" style={{ background: "var(--accent-color)" }}>{editing ? "تحديث" : "حفظ"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
