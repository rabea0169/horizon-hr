import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePurchaseOrders, usePurchaseOrderStats, useCreatePurchaseOrder, useUpdatePurchaseOrderStatus, useDeletePurchaseOrder } from "@/hooks/useLocalData";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400",
  sent: "bg-blue-500/15 text-blue-400",
  confirmed: "bg-emerald-500/15 text-emerald-400",
  partially_received: "bg-amber-500/15 text-amber-400",
  fully_received: "bg-purple-500/15 text-purple-400",
  cancelled: "bg-red-500/15 text-red-400",
  closed: "bg-cyan-500/15 text-cyan-400",
};
const statusLabels: Record<string, string> = {
  draft: "مسودة", sent: "مرسل", confirmed: "مؤكد",
  partially_received: "استلام جزئي", fully_received: "مستلم كامل",
  cancelled: "ملغي", closed: "مغلق",
};

export default function PurchaseOrders() {
  const { data: orders, isLoading } = usePurchaseOrders();
  const { data: stats } = usePurchaseOrderStats();
  const createMutation = useCreatePurchaseOrder();
  const updateStatusMutation = useUpdatePurchaseOrderStatus();
  const deleteMutation = useDeletePurchaseOrder();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ poNumber: "", supplierId: "1", orderDate: "", expectedDeliveryDate: "", subtotal: "", vatRate: "14", shippingCost: "0", totalAmount: "", paymentTerms: "", notes: "" });

  const filtered = (orders || []).filter((o: any) => {
    const matchSearch = !search || o.poNumber?.includes(search);
    const matchStatus = statusFilter === "__all__" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = () => {
    if (!form.poNumber.trim()) return;
    const subtotal = parseFloat(form.subtotal) || 0;
    const vatRate = parseFloat(form.vatRate) || 14;
    const vatAmount = subtotal * (vatRate / 100);
    const shippingCost = parseFloat(form.shippingCost) || 0;
    const total = subtotal + vatAmount + shippingCost;
    createMutation.mutate({ 
      ...form, 
      supplierId: Number(form.supplierId) || 1,
      subtotal: String(subtotal), 
      vatAmount: String(vatAmount), 
      totalAmount: String(total),
      items: []
    }, { onSuccess: () => setDialog(false) });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>أوامر الشراء</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة أوامر الشراء للموردين</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setForm({ poNumber: "", supplierId: "1", orderDate: "", expectedDeliveryDate: "", subtotal: "", vatRate: "14", shippingCost: "0", totalAmount: "", paymentTerms: "", notes: "" }); setDialog(true); }}>
          <Plus size={16} /> أمر شراء جديد
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["total", "sent", "confirmed", "fullyReceived"].map(key => (
            <Card key={key} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--accent-color)" }}>{String((stats as any)[key] || 0)}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{statusLabels[key] || key}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="بحث برقم الأمر..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
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
                  <TableHead className="text-right">رقم الأمر</TableHead>
                  <TableHead className="text-right">المورد</TableHead>
                  <TableHead className="text-right">تاريخ الطلب</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8">لا توجد أوامر شراء</TableCell></TableRow>
                : filtered.map((o: any) => (
                  <TableRow key={o.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-medium">{o.poNumber}</TableCell>
                    <TableCell>{o.supplier?.name || "-"}</TableCell>
                    <TableCell>{o.orderDate ? new Date(o.orderDate).toLocaleDateString("ar-EG") : "-"}</TableCell>
                    <TableCell className="font-medium">{parseFloat(o.totalAmount || 0).toLocaleString("ar-EG")} ج.م</TableCell>
                    <TableCell><Badge className={statusColors[o.status] || ""}>{statusLabels[o.status] || o.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Select value={o.status} onValueChange={v => updateStatusMutation.mutate({ id: o.id, status: v as any })}>
                          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => { if (confirm("هل أنت متأكد؟")) deleteMutation.mutate({ id: o.id }); }}><Trash2 size={14} /></Button>
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
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>أمر شراء جديد</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>رقم الأمر *</label><Input value={form.poNumber} onChange={e => setForm({ ...form, poNumber: e.target.value })} placeholder="PO-001" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>المورد</label><Input value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} placeholder="معرف المورد" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>تاريخ الطلب</label><Input type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>تاريخ التسليم المتوقع</label><Input type="date" value={form.expectedDeliveryDate} onChange={e => setForm({ ...form, expectedDeliveryDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الإجمالي</label><Input value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} placeholder="0.00" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>ضريبة %</label><Input value={form.vatRate} onChange={e => setForm({ ...form, vatRate: e.target.value })} placeholder="14" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>شحن</label><Input value={form.shippingCost} onChange={e => setForm({ ...form, shippingCost: e.target.value })} placeholder="0" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>شروط الدفع</label><Input value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} placeholder="30 يوم" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>ملاحظات</label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
