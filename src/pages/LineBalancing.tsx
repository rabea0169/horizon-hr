import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Factory, Users, Zap, Target, ArrowRight } from "lucide-react";

const OP_STORAGE = "hr_line_ops";
function loadOps(): any[] { try { return JSON.parse(localStorage.getItem(OP_STORAGE) || "[]"); } catch { return []; } }
function saveOps(d: any[]) { localStorage.setItem(OP_STORAGE, JSON.stringify(d)); }

const SKILL_COLORS: Record<string, string> = { novice: "bg-gray-500/15 text-gray-400", intermediate: "bg-blue-500/15 text-blue-400", expert: "bg-emerald-500/15 text-emerald-400" };
const SKILL_LABELS: Record<string, string> = { novice: "مبتدئ", intermediate: "متوسط", expert: "خبير" };

export default function LineBalancing() {
  const [tab, setTab] = useState<"balancing" | "operators" | "wip">("balancing");
  const [operations, setOperations] = useState<any[]>(loadOps);
  // WIP data managed through default state
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", sam: "", station: "", skill: "intermediate", machine: "" });
  const [lineConfig, setLineConfig] = useState({ model: "T-Shirt Basic", hours: "8", operators: "20" });

  const persistOps = (d: any[]) => { setOperations(d); saveOps(d); };
  const createOp = () => { persistOps([{ id: Date.now(), ...form, sam: Number(form.sam) || 0 }, ...operations]); setDialog(false); reset(); };
  const updateOp = () => { if (!editing) return; persistOps(operations.map(o => o.id === editing.id ? { ...o, ...form, sam: Number(form.sam) || 0 } : o)); setDialog(false); reset(); };
  const removeOp = (id: number) => { if (!confirm("حذف؟")) return; persistOps(operations.filter(o => o.id !== id)); };
  const reset = () => { setEditing(null); setForm({ name: "", sam: "", station: "", skill: "intermediate", machine: "" }); };

  // Line Balancing Calculations
  const totalSAM = operations.reduce((s, o) => s + (Number(o.sam) || 0), 0);
  const cycleTime = (Number(lineConfig.hours) * 60) / (Number(lineConfig.operators) || 1);
  const targetOutput = Math.floor((Number(lineConfig.hours) * 60) / (totalSAM || 1));
  const lineEfficiency = totalSAM > 0 ? Math.min(100, (cycleTime / (totalSAM / Math.max(operations.length, 1))) * 100) : 0;
  const bottleneck = operations.length > 0 ? operations.reduce((max, o) => Number(o.sam) > Number(max.sam) ? o : max, operations[0]) : null;

  // Default operators if none
  const defaultOps = [
    { id: 1, name: "محمد علي", skill: "expert", machine: "Overlock 4T", station: 1, status: "active" },
    { id: 2, name: "أحمد حسن", skill: "intermediate", machine: "Flatlock", station: 2, status: "active" },
    { id: 3, name: "خالد محمود", skill: "expert", machine: "Single Needle", station: 3, status: "active" },
    { id: 4, name: "سعاد إبراهيم", skill: "intermediate", machine: "Buttonhole", station: 4, status: "break" },
    { id: 5, name: "فاطمة عمر", skill: "novice", machine: "Overlock 4T", station: 5, status: "active" },
  ];
  const [operators] = useState(defaultOps);

  // WIP stages
  const defaultWip = [
    { stage: "قص (Cutting)", wip: 1200, capacity: 1500, bottleneck: false },
    { stage: "خياطة — الكتف (Sewing-Shoulder)", wip: 850, capacity: 1000, bottleneck: false },
    { stage: "خياطة — الجانب (Sewing-Side)", wip: 720, capacity: 900, bottleneck: true },
    { stage: "كي (Ironing)", wip: 600, capacity: 800, bottleneck: false },
    { stage: "تفتيش نهائي (Final QC)", wip: 450, capacity: 700, bottleneck: false },
    { stage: "تغليف (Packing)", wip: 380, capacity: 600, bottleneck: false },
  ];
  const [wipStages] = useState(defaultWip);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Line Balancing + WIP</h2>
        <div className="flex gap-2">
          <Button variant={tab === "balancing" ? "default" : "outline"} size="sm" onClick={() => setTab("balancing")} style={tab === "balancing" ? { background: "var(--accent-color)" } : {}}><Factory size={14} /> توزيع العمليات</Button>
          <Button variant={tab === "operators" ? "default" : "outline"} size="sm" onClick={() => setTab("operators")} style={tab === "operators" ? { background: "var(--accent-color)" } : {}}><Users size={14} /> العمال</Button>
          <Button variant={tab === "wip" ? "default" : "outline"} size="sm" onClick={() => setTab("wip")} style={tab === "wip" ? { background: "var(--accent-color)" } : {}}><Target size={14} /> WIP</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold">{operations.length}</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>عمليات</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold">{totalSAM.toFixed(2)}</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>SAM إجمالي</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold">{cycleTime.toFixed(1)}د</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Cycle Time</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold" style={{ color: lineEfficiency >= 80 ? "#2D6B5E" : "#E85D4A" }}>{lineEfficiency.toFixed(1)}%</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>كفاءة الخط</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-lg font-bold">{targetOutput}</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>هدف يومي</p></CardContent></Card>
      </div>

      {bottleneck && (
        <Card style={{ background: "rgba(232,93,74,0.08)", borderColor: "#E85D4A" }}>
          <CardContent className="p-3 flex items-center gap-2"><Zap size={16} className="text-red-400" /><span className="text-sm"><span className="font-bold">Bottleneck:</span> {bottleneck.name} — SAM: {Number(bottleneck.sam).toFixed(3)}د</span></CardContent>
        </Card>
      )}

      {tab === "balancing" && (
        <>
          <div className="flex gap-2 mb-2">
            <Input placeholder="الموديل" value={lineConfig.model} onChange={e => setLineConfig({ ...lineConfig, model: e.target.value })} className="max-w-[150px]" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <Input placeholder="ساعات" value={lineConfig.hours} onChange={e => setLineConfig({ ...lineConfig, hours: e.target.value })} className="w-20" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <Input placeholder="عمال" value={lineConfig.operators} onChange={e => setLineConfig({ ...lineConfig, operators: e.target.value })} className="w-20" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <Button className="mr-auto gap-1 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={14} /> عملية</Button>
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
            <Table>
              <TableHeader><TableRow><TableHead className="text-right">#</TableHead><TableHead className="text-right">العملية</TableHead><TableHead className="text-right">SAM (د)</TableHead><TableHead className="text-right">المحطة</TableHead><TableHead className="text-right">الماكينة</TableHead><TableHead className="text-right">عمال</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {operations.map((op, i) => {
                  const opsNeeded = Math.max(1, Math.ceil(Number(op.sam) / Math.max(cycleTime, 0.1)));
                  return (
                    <TableRow key={op.id} style={bottleneck?.id === op.id ? { background: "rgba(232,93,74,0.05)" } : {}}>
                      <TableCell>{i + 1}</TableCell><TableCell className="font-medium">{op.name}</TableCell><TableCell>{Number(op.sam).toFixed(3)}</TableCell>
                      <TableCell>{op.station}</TableCell><TableCell>{op.machine}</TableCell><TableCell>{opsNeeded}</TableCell>
                      <TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditing(op); setForm({ name: op.name, sam: String(op.sam), station: op.station, skill: op.skill, machine: op.machine }); setDialog(true); }}><Pencil size={12} /></Button><Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => removeOp(op.id)}><Trash2 size={12} /></Button></div></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {operations.length === 0 && <div className="text-center py-8" style={{ color: "var(--text-muted)" }}><Factory size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد عمليات — أضف أول عملية</p></div>}
        </>
      )}

      {tab === "operators" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {operators.map(op => (
            <Card key={op.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{op.name}</span>
                  <Badge variant="outline" className={op.status === "active" ? "bg-emerald-500/15 text-emerald-400" : op.status === "break" ? "bg-yellow-500/15 text-yellow-400" : "bg-gray-500/15 text-gray-400"}>{op.status === "active" ? "يعمل" : op.status === "break" ? "استراحة" : "غائب"}</Badge>
                </div>
                <div className="flex gap-2"><Badge variant="outline" className={SKILL_COLORS[op.skill]}>{SKILL_LABELS[op.skill]}</Badge><span className="text-xs" style={{ color: "var(--text-muted)" }}>{op.machine}</span></div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>محطة {op.station}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "wip" && (
        <div className="space-y-3">
          {wipStages.map((stage, i) => {
            const pct = Math.min(100, (stage.wip / stage.capacity) * 100);
            const isBottleneck = stage.bottleneck;
            return (
              <Card key={i} style={{ background: isBottleneck ? "rgba(232,93,74,0.05)" : "var(--bg-card)", borderColor: isBottleneck ? "#E85D4A" : "var(--border-color)" }}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{stage.stage}</span>
                      {isBottleneck && <Badge variant="outline" className="bg-red-500/15 text-red-400">Bottleneck</Badge>}
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{stage.wip.toLocaleString()} / {stage.capacity.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: isBottleneck ? "#E85D4A" : pct > 90 ? "#C4933F" : "#2D6B5E" }} /></div>
                  {i < wipStages.length - 1 && <div className="flex justify-center mt-1"><ArrowRight size={12} style={{ color: "var(--text-muted)" }} className="rotate-90" /></div>}
                </CardContent>
              </Card>
            );
          })}
          <div className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>إجمالي WIP: {wipStages.reduce((s, st) => s + st.wip, 0).toLocaleString()} قطعة</div>
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
          <DialogHeader><DialogTitle className="text-right">{editing ? "تعديل" : "عملية جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-right" dir="rtl">
            <div className="space-y-1"><Label>العملية</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>SAM (دقيقة)</Label><Input type="number" step="0.001" value={form.sam} onChange={e => setForm({ ...form, sam: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label>المحطة</Label><Input type="number" value={form.station} onChange={e => setForm({ ...form, station: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="space-y-1"><Label>الماكينة</Label><Input value={form.machine} onChange={e => setForm({ ...form, machine: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={editing ? updateOp : createOp} className="text-white" style={{ background: "var(--accent-color)" }}>{editing ? "تحديث" : "حفظ"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
