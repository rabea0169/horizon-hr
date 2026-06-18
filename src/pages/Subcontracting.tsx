import { useState } from "react";
import { useSubcontracts, useProductionModels, type Subcontract } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

const typeLabels: Record<string, string> = { embroidery: "تطريز", printing: "طباعة", washing: "غسيل", finishing: "تشطيب", other: "أخرى" };
const typeColors: Record<string, string> = { embroidery: "bg-purple-500/15 text-purple-400", printing: "bg-blue-500/15 text-blue-400", washing: "bg-cyan-500/15 text-cyan-400", finishing: "bg-emerald-500/15 text-emerald-400", other: "bg-gray-500/15 text-gray-400" };
const statusColors: Record<string, string> = { pending: "bg-yellow-500/15 text-yellow-400", sent: "bg-blue-500/15 text-blue-400", in_progress: "bg-amber-500/15 text-amber-400", returned: "bg-emerald-500/15 text-emerald-400", billed: "bg-gray-500/15 text-gray-400" };
const statusLabels: Record<string, string> = { pending: "معلق", sent: "مرسل", in_progress: "جاري", returned: "مستلم", billed: "مفوتر" };

export default function Subcontracting() {
  const { data: subcontracts, create, update, remove } = useSubcontracts();
  const { data: models } = useProductionModels();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Subcontract | null>(null);
  const [form, setForm] = useState({ code: "", type: "embroidery" as Subcontract["type"], contractorName: "", phone: "", modelId: "", quantity: "", sentDate: "", expectedReturn: "", unitPrice: "", notes: "" });

  const reset = () => { setForm({ code: "", type: "embroidery", contractorName: "", phone: "", modelId: "", quantity: "", sentDate: "", expectedReturn: "", unitPrice: "", notes: "" }); setEditing(null); };

  const handleSave = () => {
    if (!form.code.trim() || !form.contractorName.trim()) return;
    const model = models.find((m) => String(m.id) === form.modelId);
    const data = { code: form.code, type: form.type, contractorName: form.contractorName, phone: form.phone, modelId: model?.id, modelName: model?.name, quantity: Number(form.quantity) || 0, sentDate: form.sentDate, expectedReturn: form.expectedReturn || undefined, unitPrice: form.unitPrice, notes: form.notes, status: "pending" as const };
    if (editing) update(editing.id, data);
    else create(data);
    setDialog(false); reset();
  };

  const filtered = subcontracts.filter((s) => String(s.code ?? "").includes(search) || String(s.contractorName ?? "").includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>التشغيل الخارجي</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تتبع التشغيل الخارجي (تطريز، طباعة، غسيل)</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { reset(); setDialog(true); }}><Plus size={16} /> جديد</Button>
      </div>

      <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>كود</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>النوع</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المقاول</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الموديل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الكمية</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الإجمالي</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحالة</TableHead>
                  <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-mono text-xs" style={{ color: "var(--accent-color)" }}>{s.code}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${typeColors[s.type]}`}>{typeLabels[s.type]}</Badge></TableCell>
                    <TableCell style={{ color: "var(--text-primary)" }}>{s.contractorName}</TableCell>
                    <TableCell style={{ color: "var(--text-secondary)" }}>{s.modelName || "—"}</TableCell>
                    <TableCell style={{ color: "var(--text-secondary)" }}>{s.quantity}</TableCell>
                    <TableCell style={{ color: "var(--text-primary)" }}>{Number(s.total).toLocaleString()} ج</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[s.status]}>{statusLabels[s.status]}</Badge></TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(s); setForm({ code: s.code || "", type: s.type, contractorName: s.contractorName || "", phone: s.phone || "", modelId: s.modelId ? String(s.modelId) : "", quantity: String(s.quantity), sentDate: s.sentDate || "", expectedReturn: s.expectedReturn || "", unitPrice: s.unitPrice || "", notes: s.notes || "" }); setDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) remove(s.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8" style={{ color: "var(--text-muted)" }}>لا توجد سجلات</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل" : "تشغيل خارجي جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>كود</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="text-right" placeholder="SUB-001" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Subcontract["type"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-right">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>المقاول</Label><Input value={form.contractorName} onChange={(e) => setForm({ ...form, contractorName: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تليفون</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الموديل</Label>
                <Select value={form.modelId} onValueChange={(v) => setForm({ ...form, modelId: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{models.map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الكمية</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>سعر الوحدة</Label><Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تاريخ الإرسال</Label><Input type="date" value={form.sentDate} onChange={(e) => setForm({ ...form, sentDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تاريخ العودة المتوقع</Label><Input type="date" value={form.expectedReturn} onChange={(e) => setForm({ ...form, expectedReturn: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
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
