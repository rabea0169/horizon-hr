// ═══════════════════════════════════════════════════════════════
//  Finished Goods Page — مخزن المنتج النهائي
//  تتبع المنتجات الجاهزة للتسليم
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import {
  Package, PackageCheck, PackageSearch, PackageX, Truck,
  Search, Plus, ArrowUpDown, Boxes, MapPin,
} from "lucide-react";

const statusConfig: Record<string, { color: string; label: string; icon: typeof Package }> = {
  in_stock: { color: "bg-green-100 text-green-700", label: "متاح", icon: PackageCheck },
  reserved: { color: "bg-yellow-100 text-yellow-700", label: "محجوز", icon: Package },
  picked: { color: "bg-blue-100 text-blue-700", label: "تم الالتقاط", icon: ArrowUpDown },
  packed: { color: "bg-purple-100 text-purple-700", label: "معبأ", icon: Boxes },
  shipped: { color: "bg-indigo-100 text-indigo-700", label: "تم الشحن", icon: Truck },
  delivered: { color: "bg-green-100 text-green-700", label: "تم التسليم", icon: PackageCheck },
  returned: { color: "bg-red-100 text-red-700", label: "مرتجع", icon: PackageX },
  quarantine: { color: "bg-orange-100 text-orange-700", label: "حجز", icon: PackageSearch },
};

export default function FinishedGoodsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [warehouseFilter, setWarehouseFilter] = useState("__all__");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form
  const [form, setForm] = useState({
    sku: "", modelId: "", modelName: "", color: "", size: "",
    barcode: "", warehouseId: "", quantity: "", unitCost: "",
    totalCost: "", sellingPrice: "", customerId: "", customerName: "",
    productionDate: "", qualityGrade: "a", notes: "",
  });

  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.finishedGoods.list.useQuery({
    status: statusFilter !== "__all__" ? statusFilter : undefined,
    warehouseId: warehouseFilter !== "__all__" ? Number(warehouseFilter) : undefined,
    search: search || undefined,
  });
  const { data: summary } = trpc.finishedGoods.summary.useQuery();
  const { data: warehousesList } = trpc.warehouse.list.useQuery();
  const { data: models } = trpc.productionModel.list.useQuery();
  const { data: customers } = trpc.crm.list.useQuery();

  const createMutation = trpc.finishedGoods.create.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم إضافة المنتج بنجاح" });
      utils.finishedGoods.list.invalidate();
      utils.finishedGoods.summary.invalidate();
      setIsAddOpen(false);
    },
  });

  const updateMutation = trpc.finishedGoods.update.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم تحديث المنتج" });
      utils.finishedGoods.list.invalidate();
    },
  });

  const handleSubmit = () => {
    if (!form.sku || !form.modelName || !form.warehouseId || !form.quantity) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      sku: form.sku,
      modelId: Number(form.modelId) || 0,
      modelName: form.modelName,
      color: form.color,
      size: form.size,
      barcode: form.barcode || undefined,
      warehouseId: Number(form.warehouseId),
      quantity: Number(form.quantity),
      unitCost: form.unitCost || undefined,
      totalCost: form.totalCost || undefined,
      sellingPrice: form.sellingPrice || undefined,
      customerName: form.customerName || undefined,
      productionDate: form.productionDate || undefined,
      qualityGrade: form.qualityGrade as "a" | "b" | "c",
      notes: form.notes || undefined,
    });
  };

  const totalQty = useMemo(() => items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0, [items]);
  const totalValue = useMemo(() => items?.reduce((s, i) => s + parseFloat(i.totalCost?.toString() || "0"), 0) ?? 0, [items]);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مخزن المنتج النهائي</h1>
          <p className="text-muted-foreground">تتبع المنتجات الجاهزة والمخزونة</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> إضافة منتج</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>إضافة منتج نهائي جديد</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm">SKU *</label><Input value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} placeholder="FG-001-RED-M" /></div>
              <div>
                <label className="text-sm">الموديل *</label>
                <Select value={form.modelId} onValueChange={v => {
                  const m = models?.find(mo => mo.id.toString() === v);
                  setForm(p => ({ ...p, modelId: v, modelName: m?.name || "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder="اختر الموديل" /></SelectTrigger>
                  <SelectContent>{models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm">اللون *</label><Input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="أحمر" /></div>
              <div><label className="text-sm">المقاس *</label><Input value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))} placeholder="M" /></div>
              <div><label className="text-sm">الباركود</label><Input value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} /></div>
              <div>
                <label className="text-sm">المخزن *</label>
                <Select value={form.warehouseId} onValueChange={v => setForm(p => ({ ...p, warehouseId: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                  <SelectContent>{warehousesList?.map(w => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm">الكمية *</label><Input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} /></div>
              <div>
                <label className="text-sm">درجة الجودة</label>
                <Select value={form.qualityGrade} onValueChange={v => setForm(p => ({ ...p, qualityGrade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A — ممتاز</SelectItem>
                    <SelectItem value="b">B — جيد</SelectItem>
                    <SelectItem value="c">C — مقبول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm">تكلفة الوحدة</label><Input type="number" value={form.unitCost} onChange={e => setForm(p => ({ ...p, unitCost: e.target.value }))} /></div>
              <div><label className="text-sm">سعر البيع</label><Input type="number" value={form.sellingPrice} onChange={e => setForm(p => ({ ...p, sellingPrice: e.target.value }))} /></div>
              <div><label className="text-sm">العميل</label>
                <Select value={form.customerId} onValueChange={v => {
                  const c = customers?.find(cu => cu.id.toString() === v);
                  setForm(p => ({ ...p, customerId: v, customerName: c?.name || "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm">تاريخ الإنتاج</label><Input type="date" value={form.productionDate} onChange={e => setForm(p => ({ ...p, productionDate: e.target.value }))} /></div>
              <div className="col-span-2"><label className="text-sm">ملاحظات</label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الكمية</p>
                <p className="text-2xl font-bold">{totalQty.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full"><Boxes className="h-6 w-6 text-blue-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي القيمة</p>
                <p className="text-2xl font-bold">{totalValue.toLocaleString()} ج.م</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full"><PackageCheck className="h-6 w-6 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الأصناف</p>
                <p className="text-2xl font-bold">{items?.length ?? 0}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full"><Package className="h-6 w-6 text-purple-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المحجوز</p>
                <p className="text-2xl font-bold">{items?.reduce((s, i) => s + (i.reservedQty || 0), 0) ?? 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full"><Package className="h-6 w-6 text-yellow-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث باسم الموديل..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">الكل</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger><SelectValue placeholder="المخزن" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">الكل</SelectItem>
                {warehousesList?.map(w => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Boxes className="h-5 w-5" /> المنتجات النهائية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>الموديل</TableHead>
                <TableHead>اللون/المقاس</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>متاح/محجوز</TableHead>
                <TableHead>التكلفة</TableHead>
                <TableHead>سعر البيع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
              ) : !items?.length ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد منتجات</TableCell></TableRow>
              ) : (
                items.map(item => {
                  const cfg = statusConfig[item.status || "in_stock"];
                  const Icon = cfg?.icon || Package;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.modelName}</TableCell>
                      <TableCell className="text-sm">{item.color} / {item.size}</TableCell>
                      <TableCell className="font-bold">{item.quantity}</TableCell>
                      <TableCell className="text-sm">
                        <span className="text-green-600">{item.availableQty}</span>
                        {" / "}
                        <span className="text-yellow-600">{item.reservedQty}</span>
                      </TableCell>
                      <TableCell>{parseFloat(item.unitCost?.toString() || "0").toLocaleString()} ج.م</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {item.sellingPrice ? `${parseFloat(item.sellingPrice.toString()).toLocaleString()} ج.م` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cfg?.color}><Icon className="h-3 w-3 ml-1" />{cfg?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {item.status === "in_stock" && (
                            <Button size="sm" variant="outline" className="h-8 text-xs"
                              onClick={() => updateMutation.mutate({ id: item.id, status: "reserved" })}>
                              حجز
                            </Button>
                          )}
                          {item.status === "reserved" && (
                            <Button size="sm" variant="outline" className="h-8 text-xs"
                              onClick={() => updateMutation.mutate({ id: item.id, status: "picked" })}>
                              التقاط
                            </Button>
                          )}
                          {item.status === "in_stock" && (
                            <Button size="sm" variant="outline" className="h-8 text-xs bg-blue-50"
                              onClick={() => updateMutation.mutate({ id: item.id, status: "shipped" })}>
                              شحن
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Warehouse Summary */}
      {summary?.byWarehouse && summary.byWarehouse.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5" /> حسب المخزن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summary.byWarehouse.map((w, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {warehousesList?.find(wh => wh.id === w.warehouseId)?.name || `مخزن #${w.warehouseId}`}
                  </p>
                  <p className="text-xl font-bold">{w.count?.toString() || 0} صنف</p>
                  <p className="text-sm">{w.totalQty?.toString() || 0} قطعة</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
