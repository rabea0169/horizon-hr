import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { useGoodsReceipts, useGoodsReceiptStats, useCreateGoodsReceipt, useUpdateGoodsReceiptStatus } from "@/hooks/useLocalData";

const statusColors: Record<string, string> = {
  pending_inspection: "bg-yellow-500/15 text-yellow-400",
  partially_accepted: "bg-amber-500/15 text-amber-400",
  fully_accepted: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
};
const statusLabels: Record<string, string> = {
  pending_inspection: "بانتظار الفحص", partially_accepted: "قبول جزئي",
  fully_accepted: "قبول كامل", rejected: "مرفوض",
};

export default function GoodsReceipt() {
  const { data: receipts, isLoading } = useGoodsReceipts();
  const { data: stats } = useGoodsReceiptStats();
  const createMutation = useCreateGoodsReceipt();
  const updateStatusMutation = useUpdateGoodsReceiptStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ grNumber: "", purchaseOrderId: "", supplierId: "", receiptDate: "", invoiceNumber: "", subtotal: "", vatAmount: "", totalAmount: "", receivedBy: "", notes: "" });

  const filtered = (receipts || []).filter((r: any) => {
    const matchSearch = !search || r.grNumber?.includes(search);
    const matchStatus = statusFilter === "__all__" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>إيصالات الاستلام</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تسجيل ومراقبة استلام البضائع من الموردين</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setForm({ grNumber: "", purchaseOrderId: "", supplierId: "", receiptDate: "", invoiceNumber: "", subtotal: "", vatAmount: "", totalAmount: "", receivedBy: "", notes: "" }); setDialog(true); }}>
          <Plus size={16} /> استلام جديد
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["pendingInspection", "partiallyAccepted", "fullyAccepted"].map(key => (
            <Card key={key} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--accent-color)" }}>{String((stats as any)[key] || 0)}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{statusLabels[key.replace(/([A-Z])/g, '_$1').toLowerCase()] || key}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="بحث برقم الاستلام..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
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
                  <TableHead className="text-right">رقم الاستلام</TableHead>
                  <TableHead className="text-right">أمر الشراء</TableHead>
                  <TableHead className="text-right">المورد</TableHead>
                  <TableHead className="text-right">تاريخ الاستلام</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8">لا توجد إيصالات</TableCell></TableRow>
                : filtered.map((r: any) => (
                  <TableRow key={r.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-medium">{r.grNumber}</TableCell>
                    <TableCell>{r.purchaseOrderId}</TableCell>
                    <TableCell>{r.supplier?.name || "-"}</TableCell>
                    <TableCell>{r.receiptDate ? new Date(r.receiptDate).toLocaleDateString("ar-EG") : "-"}</TableCell>
                    <TableCell className="font-medium">{parseFloat(r.totalAmount || 0).toLocaleString("ar-EG")} ج.م</TableCell>
                    <TableCell><Badge className={statusColors[r.status] || ""}>{statusLabels[r.status] || r.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {r.status === "pending_inspection" && (
                          <>
                            <Button size="icon" variant="ghost" className="text-emerald-500" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "fully_accepted" })}><CheckCircle size={16} /></Button>
                            <Button size="icon" variant="ghost" className="text-amber-500" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "partially_accepted" })}><AlertTriangle size={16} /></Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => updateStatusMutation.mutate({ id: r.id, status: "rejected" })}><FileText size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" dir="rtl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>إيصال استلام جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>رقم الاستلام</label><Input value={form.grNumber} onChange={e => setForm({ ...form, grNumber: e.target.value })} placeholder="GR-001" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>رقم الفاتورة</label><Input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>أمر الشراء ID</label><Input value={form.purchaseOrderId} onChange={e => setForm({ ...form, purchaseOrderId: e.target.value })} placeholder="1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>المورد ID</label><Input value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} placeholder="1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>تاريخ الاستلام</label><Input type="date" value={form.receiptDate} onChange={e => setForm({ ...form, receiptDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الإجمالي</label><Input value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} placeholder="0.00" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الضريبة</label><Input value={form.vatAmount} onChange={e => setForm({ ...form, vatAmount: e.target.value })} placeholder="0.00" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الصافي</label><Input value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} placeholder="0.00" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>المستلم</label><Input value={form.receivedBy} onChange={e => setForm({ ...form, receivedBy: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={() => createMutation.mutate({ ...form, purchaseOrderId: Number(form.purchaseOrderId), supplierId: Number(form.supplierId), items: [] }, { onSuccess: () => setDialog(false) })} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
