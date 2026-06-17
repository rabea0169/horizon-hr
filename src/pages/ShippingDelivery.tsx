import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Truck, PackageCheck, PackageX, MapPin, Phone } from "lucide-react";
import { useShipments, useShippingStats, useCreateShipment, useUpdateShipmentStatus } from "@/hooks/useLocalData";

const statusColors: Record<string, string> = {
  pending: "bg-gray-500/15 text-gray-400",
  picked: "bg-blue-500/15 text-blue-400",
  in_transit: "bg-amber-500/15 text-amber-400",
  out_for_delivery: "bg-purple-500/15 text-purple-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
  returned: "bg-red-500/15 text-red-400",
  cancelled: "bg-red-500/15 text-red-400",
};
const statusLabels: Record<string, string> = {
  pending: "معلق", picked: "تم الالتقاط", in_transit: "في الطريق",
  out_for_delivery: "خارج للتوصيل", delivered: "مسلم", returned: "مرتجع", cancelled: "ملغي",
};

export default function ShippingDelivery() {
  const { data: shipments, isLoading } = useShipments();
  const { data: stats } = useShippingStats();
  const createMutation = useCreateShipment();
  const updateStatusMutation = useUpdateShipmentStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ trackingNumber: "", salesOrderId: "", customerId: "", carrier: "", shippingDate: "", estimatedDeliveryDate: "", shippingAddress: "", shippingCost: "", recipientName: "", recipientPhone: "", notes: "" });

  const filtered = (shipments || []).filter((s: any) => {
    const matchSearch = !search || s.trackingNumber?.includes(search);
    const matchStatus = statusFilter === "__all__" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>الشحن والتوصيل</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة عمليات الشحن وتتبع التوصيل</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setForm({ trackingNumber: "", salesOrderId: "", customerId: "", carrier: "", shippingDate: "", estimatedDeliveryDate: "", shippingAddress: "", shippingCost: "", recipientName: "", recipientPhone: "", notes: "" }); setDialog(true); }}>
          <Plus size={16} /> شحنة جديدة
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "الإجمالي", value: stats.total, icon: Truck },
            { label: "معلقة", value: stats.pending, icon: PackageCheck },
            { label: "في الطريق", value: stats.inTransit, icon: Truck },
            { label: "مسلمة", value: stats.delivered, icon: PackageCheck },
            { label: "مرتجعة", value: stats.returned, icon: PackageX },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)", opacity: 0.15 }}>
                  <Icon size={20} style={{ color: "var(--accent-color)" }} />
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: "var(--accent-color)" }}>{value}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="بحث برقم التتبع..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
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
                  <TableHead className="text-right">رقم التتبع</TableHead>
                  <TableHead className="text-right">الناقل</TableHead>
                  <TableHead className="text-right">تاريخ الشحن</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-center">تحديث</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8">لا توجد شحنات</TableCell></TableRow>
                : filtered.map((s: any) => (
                  <TableRow key={s.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-medium">{s.trackingNumber}</TableCell>
                    <TableCell>{s.carrier || "-"}</TableCell>
                    <TableCell>{s.shippingDate ? new Date(s.shippingDate).toLocaleDateString("ar-EG") : "-"}</TableCell>
                    <TableCell>{Number(s.shippingCost || 0).toLocaleString("ar-EG")} ج.م</TableCell>
                    <TableCell><Badge className={statusColors[s.status] || ""}>{statusLabels[s.status] || s.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {s.status !== "delivered" && s.status !== "cancelled" && (
                          <Select value={s.status} onValueChange={v => updateStatusMutation.mutate({ id: s.id, status: v as any })}>
                            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {s.status === "delivered" && <PackageCheck size={16} className="text-emerald-500" />}
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
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>شحنة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>رقم التتبع *</label><Input value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} placeholder="TRK-001" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الناقل</label><Input value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} placeholder="Aramex, Bosta..." className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>أمر البيع ID</label><Input value={form.salesOrderId} onChange={e => setForm({ ...form, salesOrderId: e.target.value })} placeholder="1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>العميل ID</label><Input value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} placeholder="1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>تاريخ الشحن</label><Input type="date" value={form.shippingDate} onChange={e => setForm({ ...form, shippingDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>تاريخ التسليم المتوقع</label><Input type="date" value={form.estimatedDeliveryDate} onChange={e => setForm({ ...form, estimatedDeliveryDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>عنوان الشحن</label><Input value={form.shippingAddress} onChange={e => setForm({ ...form, shippingAddress: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>التكلفة</label><Input value={form.shippingCost} onChange={e => setForm({ ...form, shippingCost: e.target.value })} placeholder="0" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>المستلم</label><Input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الهاتف</label><Input value={form.recipientPhone} onChange={e => setForm({ ...form, recipientPhone: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={() => createMutation.mutate({ ...form, salesOrderId: Number(form.salesOrderId), customerId: Number(form.customerId), shippingCost: form.shippingCost || "0", items: [] }, { onSuccess: () => setDialog(false) })} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
