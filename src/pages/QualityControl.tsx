import { useState } from "react";
import { useQCRecords, useBundles, useProductionModels, type QCRecord } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2 } from "lucide-react";

const stageLabels: Record<string, string> = { fabric: "قماش", cutting: "قص", sewing: "خياطة", pressing: "كي", packing: "تغليف" };
const statusColors: Record<string, string> = { pass: "bg-emerald-500/15 text-emerald-400", fail: "bg-red-500/15 text-red-400", rework: "bg-yellow-500/15 text-yellow-400" };

export default function QualityControl() {
  const { data: qcRecords, create, update, remove } = useQCRecords();
  const { data: bundles } = useBundles();
  const { data: models } = useProductionModels();
  const [search] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<QCRecord | null>(null);
  const [form, setForm] = useState({ inspectionCode: "", stage: "sewing" as QCRecord["stage"], modelId: "", bundleId: "", inspectedBy: "", date: "", checkedQty: "", passedQty: "", failedQty: "", status: "pass" as QCRecord["status"], notes: "" });
  const [defects, setDefects] = useState<{ type: string; description: string; severity: string; count: string }[]>([]);

  const reset = () => { setForm({ inspectionCode: "", stage: "sewing", modelId: "", bundleId: "", inspectedBy: "", date: "", checkedQty: "", passedQty: "", failedQty: "", status: "pass", notes: "" }); setDefects([]); setEditing(null); };

  const handleSave = () => {
    if (!form.inspectionCode.trim()) return;
    const model = models.find((m) => String(m.id) === form.modelId);
    const bundle = bundles.find((b) => String(b.id) === form.bundleId);
    const qcDefects = defects.filter((d) => d.type.trim()).map((d, i) => ({ id: Date.now() + i, type: d.type, description: d.description, severity: d.severity as QCRecord["defects"][0]["severity"], count: Number(d.count) || 0 }));
    const data = { inspectionCode: form.inspectionCode, stage: form.stage, modelId: model?.id, modelName: model?.name, bundleId: bundle?.id, bundleCode: bundle?.bundleCode, inspectedBy: form.inspectedBy, date: form.date, checkedQty: Number(form.checkedQty) || 0, passedQty: Number(form.passedQty) || 0, failedQty: Number(form.failedQty) || 0, status: form.status, notes: form.notes, defects: qcDefects };
    if (editing) update(editing.id, data);
    else create(data);
    setDialog(false); reset();
  };

  const filtered = qcRecords.filter((r) => r.inspectionCode.includes(search) || r.modelName?.includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>مراقبة الجودة</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>فحص جودة في 5 مراحل (قماش — قص — خياطة — كي — تغليف)</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> فحص جديد</Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="w-full" style={{ background: "var(--bg-input)" }}>
          <TabsTrigger value="all" className="flex-1">الكل</TabsTrigger>
          {Object.entries(stageLabels).map(([k, v]) => <TabsTrigger key={k} value={k} className="flex-1">{v}</TabsTrigger>)}
        </TabsList>
        {["all", ...Object.keys(stageLabels)].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: "var(--border-color)" }}>
                        <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>كود</TableHead>
                        <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المرحلة</TableHead>
                        <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الموديل</TableHead>
                        <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>مفحوص</TableHead>
                        <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>سليم</TableHead>
                        <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>معيب</TableHead>
                        <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>نسبة العيب</TableHead>
                        <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>النتيجة</TableHead>
                        <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.filter((r) => tab === "all" || r.stage === tab).map((r) => (
                        <TableRow key={r.id} style={{ borderColor: "var(--border-color)" }}>
                          <TableCell className="font-mono text-xs" style={{ color: "var(--accent-color)" }}>{r.inspectionCode}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{stageLabels[r.stage]}</Badge></TableCell>
                          <TableCell style={{ color: "var(--text-primary)" }}>{r.modelName || "—"}</TableCell>
                          <TableCell style={{ color: "var(--text-secondary)" }}>{r.checkedQty}</TableCell>
                          <TableCell className="text-green-400">{r.passedQty}</TableCell>
                          <TableCell className="text-red-400">{r.failedQty}</TableCell>
                          <TableCell style={{ color: Number(r.defectRate) > 5 ? "#E85D4A" : "var(--text-secondary)" }}>{r.defectRate}%</TableCell>
                          <TableCell><Badge variant="outline" className={statusColors[r.status]}>{r.status === "pass" ? "مقبول" : r.status === "fail" ? "مرفوض" : "إعادة عمل"}</Badge></TableCell>
                          <TableCell className="text-left">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(r); setForm({ inspectionCode: r.inspectionCode, stage: r.stage, modelId: r.modelId ? String(r.modelId) : "", bundleId: r.bundleId ? String(r.bundleId) : "", inspectedBy: r.inspectedBy, date: r.date, checkedQty: String(r.checkedQty), passedQty: String(r.passedQty), failedQty: String(r.failedQty), status: r.status, notes: r.notes || "" }); setDefects(r.defects.map((d) => ({ type: d.type, description: d.description, severity: d.severity, count: String(d.count) }))); setDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) remove(r.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل فحص" : "فحص جودة جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>كود الفحص</Label><Input value={form.inspectionCode} onChange={(e) => setForm({ ...form, inspectionCode: e.target.value })} className="text-right" placeholder="QC-001" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>المرحلة</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as QCRecord["stage"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{Object.entries(stageLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-right">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الموديل</Label>
                <Select value={form.modelId} onValueChange={(v) => setForm({ ...form, modelId: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{models.map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الباندل</Label>
                <Select value={form.bundleId} onValueChange={(v) => setForm({ ...form, bundleId: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{bundles.map((b) => <SelectItem key={b.id} value={String(b.id)} className="text-right">{b.bundleCode}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>مفحوص</Label><Input type="number" value={form.checkedQty} onChange={(e) => setForm({ ...form, checkedQty: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>سليم</Label><Input type="number" value={form.passedQty} onChange={(e) => setForm({ ...form, passedQty: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>معيب</Label><Input type="number" value={form.failedQty} onChange={(e) => setForm({ ...form, failedQty: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>النتيجة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as QCRecord["status"] })}>
                <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <SelectItem value="pass" className="text-right">مقبول</SelectItem>
                  <SelectItem value="fail" className="text-right">مرفوض</SelectItem>
                  <SelectItem value="rework" className="text-right">إعادة عمل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الفاحص</Label><Input value={form.inspectedBy} onChange={(e) => setForm({ ...form, inspectedBy: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>العيوب</Label>
              {defects.map((d, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <div className="col-span-4"><Input placeholder="نوع العيب" value={d.type} onChange={(e) => { const u = [...defects]; u[idx].type = e.target.value; setDefects(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                  <div className="col-span-4"><Input placeholder="وصف" value={d.description} onChange={(e) => { const u = [...defects]; u[idx].description = e.target.value; setDefects(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                  <div className="col-span-2"><Select value={d.severity} onValueChange={(v) => { const u = [...defects]; u[idx].severity = v; setDefects(u); }}><SelectTrigger className="text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minor">بسيط</SelectItem><SelectItem value="major">كبير</SelectItem><SelectItem value="critical">حرج</SelectItem></SelectContent></Select></div>
                  <div className="col-span-2"><Input placeholder="عدد" value={d.count} onChange={(e) => { const u = [...defects]; u[idx].count = e.target.value; setDefects(u); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setDefects([...defects, { type: "", description: "", severity: "minor", count: "" }])} style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}><Plus size={12} className="ml-1" /> عيب</Button>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>ملاحظات</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleSave} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
