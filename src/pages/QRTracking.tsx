import { useState } from "react";
import { useBundles, useProductionModels } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, QrCode, CheckCircle2, ScanLine } from "lucide-react";

const statusColors: Record<string, string> = {
  in_progress: "bg-blue-500/15 text-blue-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  qc_failed: "bg-red-500/15 text-red-400",
};

export default function QRTracking() {
  const { data: bundles, create, remove, scanStage } = useBundles();
  const { data: models } = useProductionModels();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [scanDialog, setScanDialog] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [form, setForm] = useState({ modelId: "", size: "", color: "", quantity: "" });

  const filtered = bundles.filter((b) => b.bundleCode.includes(search) || b.modelName?.includes(search));

  const handleCreate = () => {
    const model = models.find((m) => String(m.id) === form.modelId);
    if (!model) return;
    const id = Date.now();
    create({ modelId: model.id, modelName: model.name, size: form.size, color: form.color, quantity: Number(form.quantity) || 0, bundleCode: `B-${String(id).slice(-6)}` });
    setDialog(false);
    setForm({ modelId: "", size: "", color: "", quantity: "" });
  };

  const handleScan = () => {
    const bundle = bundles.find((b) => b.qrData === scanInput || b.bundleCode === scanInput);
    if (!bundle) { alert("Bundle not found!"); return; }
    const nextStage = bundle.stages.find((s) => !s.completed);
    if (nextStage) {
      scanStage(bundle.id, nextStage.id, "Operator");
      alert(`Stage "${nextStage.name}" scanned successfully!`);
    } else {
      alert("All stages completed!");
    }
    setScanDialog(false);
    setScanInput("");
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>QR Bundle Tracking</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تتبع الباندلز بباركود في كل مرحلة إنتاج</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setScanDialog(true)}><ScanLine size={16} /> مسح</Button>
          <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => setDialog(true)}><Plus size={16} /> باندل جديد</Button>
        </div>
      </div>

      <Input placeholder="بحث بكود الباندل..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((b) => (
          <Card key={b.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode size={16} style={{ color: "var(--accent-color)" }} />
                  <CardTitle className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>{b.bundleCode}</CardTitle>
                </div>
                <Badge variant="outline" className={statusColors[b.status]}>{b.status === "in_progress" ? "جاري" : b.status === "completed" ? "مكتمل" : "مرفوض QC"}</Badge>
              </div>
              {b.modelName && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{b.modelName} — {b.size} — {b.color}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center p-4 rounded" style={{ background: "var(--bg-primary)" }}>
                <div className="text-center">
                  <QrCode size={64} style={{ color: "var(--accent-color)" }} />
                  <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>{b.qrData}</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {b.stages.map((s) => (
                  <div key={s.id} className={`text-center p-1.5 rounded text-[10px] ${s.completed ? "bg-emerald-500/20 text-emerald-400" : ""}`} style={{ background: s.completed ? undefined : "var(--bg-primary)", color: s.completed ? undefined : "var(--text-muted)" }}>
                    {s.completed ? <CheckCircle2 size={14} className="mx-auto mb-0.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 mx-auto mb-0.5" style={{ borderColor: "var(--border-color)" }} />}
                    {s.name}
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>الكمية: {b.quantity}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6" onClick={() => { if (confirm("حذف؟")) remove(b.id); }}><Trash2 size={12} className="text-red-400" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12" style={{ color: "var(--text-muted)" }}><QrCode size={32} className="mx-auto mb-3 opacity-50" /><p>لا توجد باندلز</p></div>}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>باندل جديد</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الموديل</Label>
              <Select value={form.modelId} onValueChange={(v) => setForm({ ...form, modelId: v })}>
                <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{models.map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>المقاس</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>اللون</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الكمية</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleCreate} className="text-white" style={{ background: "var(--accent-color)" }}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Dialog */}
      <Dialog open={scanDialog} onOpenChange={setScanDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>مسح QR Code</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>كود الباندل أو QR</Label><Input value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="ادخل الكود..." className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleScan} className="text-white" style={{ background: "var(--accent-color)" }}><ScanLine size={14} className="ml-1" /> مسح</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
