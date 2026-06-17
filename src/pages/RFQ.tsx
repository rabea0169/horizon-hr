import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send, Trophy, Trash2, FileText, Gavel } from "lucide-react";
import { useRFQs, useRFQStats, useCreateRFQ, useUpdateRFQStatus, useAddRFQResponse, useAwardRFQResponse } from "@/hooks/useLocalData";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400",
  sent: "bg-blue-500/15 text-blue-400",
  bidding: "bg-amber-500/15 text-amber-400",
  evaluated: "bg-purple-500/15 text-purple-400",
  awarded: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
};
const statusLabels: Record<string, string> = {
  draft: "مسودة", sent: "مرسل", bidding: "تقديم عروض",
  evaluated: "مقيم", awarded: "مُسند", cancelled: "ملغي",
};

export default function RFQ() {
  const { data: rfqs, isLoading } = useRFQs();
  const { data: stats } = useRFQStats();
  const createMutation = useCreateRFQ();
  const addResponseMutation = useAddRFQResponse();
  const awardMutation = useAwardRFQResponse();
  const updateStatusMutation = useUpdateRFQStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [dialog, setDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [form, setForm] = useState({ rfqNumber: "", title: "", description: "", deadline: "", deliveryTerms: "", paymentTerms: "", notes: "" });
  const [responseForm, setResponseForm] = useState({ supplierId: "", unitPrice: "", totalPrice: "", deliveryDays: "", validityDays: "30", notes: "" });

  const filtered = (rfqs || []).filter((r: any) => {
    const matchSearch = !search || r.rfqNumber?.includes(search) || r.title?.includes(search);
    const matchStatus = statusFilter === "__all__" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>عروض الأسعار (RFQ)</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>طلبات عروض الأسعار من الموردين</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setForm({ rfqNumber: "", title: "", description: "", deadline: "", deliveryTerms: "", paymentTerms: "", notes: "" }); setDialog(true); }}>
          <Plus size={16} /> طلب عرض سعر جديد
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(stats).filter(([k]) => k !== "total").map(([key, value]) => (
            <Card key={key} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--accent-color)" }}>{String(value)}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{statusLabels[key] || key}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">كل الحالات</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right">رقم RFQ</TableHead>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">الموعد النهائي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8">لا توجد طلبات</TableCell></TableRow>
                : filtered.map((r: any) => (
                  <TableRow key={r.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-medium">{r.rfqNumber}</TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell>{r.deadline ? new Date(r.deadline).toLocaleDateString("ar-EG") : "-"}</TableCell>
                    <TableCell><Badge className={statusColors[r.status] || ""}>{statusLabels[r.status] || r.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {r.status === "sent" || r.status === "bidding" ? (
                          <Button size="icon" variant="ghost" className="text-emerald-500" onClick={() => { setSelectedRFQ(r); setResponseDialog(true); }}>
                            <Send size={16} />
                          </Button>
                        ) : null}
                        {r.status === "bidding" && (
                          <Button size="icon" variant="ghost" className="text-purple-500" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "evaluated" })}>
                            <Gavel size={16} />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "cancelled" })}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" dir="rtl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>طلب عرض سعر جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الرقم</label><Input value={form.rfqNumber} onChange={e => setForm({ ...form, rfqNumber: e.target.value })} placeholder="RFQ-001" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الموعد النهائي</label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>العنوان *</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="شراء أقمشة قطنية" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الوصف</label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>شروط التسليم</label><Input value={form.deliveryTerms} onChange={e => setForm({ ...form, deliveryTerms: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>شروط الدفع</label><Input value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={() => createMutation.mutate(form, { onSuccess: () => setDialog(false) })} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
        <DialogContent className="max-w-md" dir="rtl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>تقديم عرض سعر من مورد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>معرف المورد</label><Input value={responseForm.supplierId} onChange={e => setResponseForm({ ...responseForm, supplierId: e.target.value })} placeholder="1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>سعر الوحدة</label><Input value={responseForm.unitPrice} onChange={e => setResponseForm({ ...responseForm, unitPrice: e.target.value })} placeholder="0.00" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الإجمالي</label><Input value={responseForm.totalPrice} onChange={e => setResponseForm({ ...responseForm, totalPrice: e.target.value })} placeholder="0.00" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>أيام التسليم</label><Input value={responseForm.deliveryDays} onChange={e => setResponseForm({ ...responseForm, deliveryDays: e.target.value })} placeholder="7" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>صلاحية العرض (يوم)</label><Input value={responseForm.validityDays} onChange={e => setResponseForm({ ...responseForm, validityDays: e.target.value })} placeholder="30" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>ملاحظات</label><Input value={responseForm.notes} onChange={e => setResponseForm({ ...responseForm, notes: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => selectedRFQ && addResponseMutation.mutate({ rfqId: selectedRFQ.id, supplierId: Number(responseForm.supplierId), unitPrice: responseForm.unitPrice, totalPrice: responseForm.totalPrice, deliveryDays: Number(responseForm.deliveryDays) || undefined, validityDays: Number(responseForm.validityDays) || undefined, notes: responseForm.notes }, { onSuccess: () => setResponseDialog(false) })} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ العرض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
