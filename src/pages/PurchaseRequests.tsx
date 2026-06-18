import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import { usePurchaseRequests, usePurchaseRequestStats, useCreatePurchaseRequest, useUpdatePurchaseRequest, useApprovePurchaseRequest, useRejectPurchaseRequest, useDeletePurchaseRequest } from "@/hooks/useLocalData";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-400",
  pending_approval: "bg-yellow-500/15 text-yellow-400",
  approved: "bg-emerald-500/15 text-emerald-400",
  rejected: "bg-red-500/15 text-red-400",
  converted_to_po: "bg-blue-500/15 text-blue-400",
};
const statusLabels: Record<string, string> = {
  draft: "مسودة", pending_approval: "بانتظار الموافقة", approved: "معتمد",
  rejected: "مرفوض", converted_to_po: "محول لأمر شراء",
};
const priorityLabels: Record<string, string> = { low: "منخفض", normal: "عادي", high: "عالي", urgent: "عاجل" };

export default function PurchaseRequests() {
  const { data: requests, isLoading } = usePurchaseRequests();
  const { data: stats } = usePurchaseRequestStats();
  const createMutation = useCreatePurchaseRequest();
  const updateMutation = useUpdatePurchaseRequest();
  const approveMutation = useApprovePurchaseRequest();
  const rejectMutation = useRejectPurchaseRequest();
  const deleteMutation = useDeletePurchaseRequest();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ prNumber: "", department: "", requestedBy: "", priority: "normal" as string, requiredDate: "", notes: "" });
  const [items] = useState([{ itemId: 1, quantity: "1", notes: "" }]);

  const filtered = (requests || []).filter((r: any) => {
    const matchSearch = !search || r.prNumber?.includes(search) || r.department?.includes(search);
    const matchStatus = statusFilter === "__all__" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = () => {
    if (!form.prNumber.trim()) return;
    const data = { ...form, items: items.filter(i => i.quantity && Number(i.quantity) > 0).map(i => ({ ...i, quantity: Number(i.quantity) })) };
    if (editing) updateMutation.mutate({ id: editing.id, ...data }, { onSuccess: () => { setDialog(false); setEditing(null); } });
    else createMutation.mutate(data, { onSuccess: () => setDialog(false) });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>طلبات الشراء</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة طلبات الشراء الداخلية</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setEditing(null); setForm({ prNumber: "", department: "", requestedBy: "", priority: "normal", requiredDate: "", notes: "" }); setDialog(true); }}>
          <Plus size={16} /> طلب شراء جديد
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="بحث برقم الطلب..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}>
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">كل الحالات</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">الأولوية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ التسليم</TableHead>
                  <TableHead className="text-right">ملاحظات</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">لا توجد طلبات شراء</TableCell></TableRow>
                ) : filtered.map((r: any) => (
                  <TableRow key={r.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-medium">{r.prNumber}</TableCell>
                    <TableCell>{r.department || "-"}</TableCell>
                    <TableCell><Badge variant="outline">{priorityLabels[r.priority as string] || r.priority}</Badge></TableCell>
                    <TableCell><Badge className={statusColors[r.status] || ""}>{statusLabels[r.status] || r.status}</Badge></TableCell>
                    <TableCell>{r.requiredDate ? new Date(r.requiredDate).toLocaleDateString("ar-EG") : "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.notes || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {r.status === "pending_approval" && (
                          <>
                            <Button size="icon" variant="ghost" className="text-emerald-500 hover:text-emerald-400" onClick={() => approveMutation.mutate({ id: r.id, approvedBy: 1 })}>
                              <CheckCircle size={16} />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-400" onClick={() => rejectMutation.mutate({ id: r.id })}>
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="text-blue-500 hover:text-blue-400" onClick={() => { setEditing(r); setForm({ ...r, priority: r.priority || "normal" }); setDialog(true); }}>
                          <Pencil size={16} />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-400" onClick={() => { if (confirm("هل أنت متأكد من الحذف؟")) deleteMutation.mutate({ id: r.id }); }}>
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

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" dir="rtl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل طلب شراء" : "طلب شراء جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>رقم الطلب *</label><Input value={form.prNumber} onChange={e => setForm({ ...form, prNumber: e.target.value })} placeholder="PR-001" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>القسم</label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="قص، خياطة..." className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>مقدم الطلب</label><Input value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>الأولوية</label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>تاريخ التسليم المطلوب</label><Input type="date" value={form.requiredDate} onChange={e => setForm({ ...form, requiredDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>ملاحظات</label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={handleSave} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
