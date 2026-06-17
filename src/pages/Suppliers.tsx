import { useState } from "react";
import { useSuppliers, useSupplyOrders, type Supplier, type SupplyOrder } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Truck, Phone, Mail, MapPin, User } from "lucide-react";

const categoryLabels: Record<string, string> = {
  fabric: "أقمشة", thread: "خيوط", button: "أزرار", zipper: "سحابات",
  label: "تيكت", packaging: "تعبئة", other: "أخرى", general: "عام",
};

const categoryColors: Record<string, string> = {
  fabric: "bg-blue-500/15 text-blue-400", thread: "bg-cyan-500/15 text-cyan-400",
  button: "bg-amber-500/15 text-amber-400", zipper: "bg-gray-500/15 text-gray-400",
  label: "bg-purple-500/15 text-purple-400", packaging: "bg-emerald-500/15 text-emerald-400",
  other: "bg-pink-500/15 text-pink-400", general: "bg-teal-500/15 text-teal-400",
};

export default function Suppliers() {
  const { data: suppliers, create: createSupplier, update: updateSupplier, remove: removeSupplier } = useSuppliers();
  const { data: orders, create: createOrder, update: updateOrder, remove: removeOrder } = useSupplyOrders();

  const [search, setSearch] = useState("");
  const [supDialog, setSupDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [editingOrder, setEditingOrder] = useState<SupplyOrder | null>(null);

  const [supForm, setSupForm] = useState<{ code: string; name: string; contactPerson: string; phone: string; email: string; address: string; category: string; status: string; notes: string }>({ code: "", name: "", contactPerson: "", phone: "", email: "", address: "", category: "general", status: "active", notes: "" });
  const [orderForm, setOrderForm] = useState({ orderCode: "", supplierId: "", date: "", deliveryDate: "", notes: "" });
  const [orderItems, setOrderItems] = useState<{ itemName: string; quantity: string; unit: string; unitPrice: string }[]>([{ itemName: "", quantity: "", unit: "", unitPrice: "" }]);

  const resetSup = () => { setSupForm({ code: "", name: "", contactPerson: "", phone: "", email: "", address: "", category: "general", status: "active", notes: "" }); setEditingSup(null); };
  const resetOrder = () => { setOrderForm({ orderCode: "", supplierId: "", date: "", deliveryDate: "", notes: "" }); setOrderItems([{ itemName: "", quantity: "", unit: "", unitPrice: "" }]); setEditingOrder(null); };

  const handleSaveSup = () => {
    if (!supForm.name.trim()) return;
    if (editingSup) updateSupplier(editingSup.id, supForm);
    else createSupplier(supForm);
    setSupDialog(false); resetSup();
  };

  const handleSaveOrder = () => {
    if (!orderForm.supplierId || !orderForm.orderCode.trim()) return;
    const sup = suppliers.find((s) => String(s.id) === orderForm.supplierId);
    const items = orderItems.filter((i) => i.itemName.trim()).map((i) => ({
      id: Date.now() + Math.random(),
      itemName: i.itemName,
      quantity: Number(i.quantity) || 0,
      unit: i.unit,
      unitPrice: i.unitPrice,
      total: ((Number(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0)).toFixed(2),
    }));
    if (editingOrder) updateOrder(editingOrder.id, { ...orderForm, supplierId: Number(orderForm.supplierId), supplierName: sup?.name || "", items } as any);
    else createOrder({ ...orderForm, supplierId: Number(orderForm.supplierId), supplierName: sup?.name || "", items } as any);
    setOrderDialog(false); resetOrder();
  };

  const filteredSup = suppliers.filter((s) => s.name.includes(search) || s.code.includes(search));
  const filteredOrders = orders.filter((o) => o.supplierName.includes(search) || o.orderCode.includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>التوريد والموردين</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة الموردين وأوامر التوريد</p>
        </div>
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList className="w-full" style={{ background: "var(--bg-input)" }}>
          <TabsTrigger value="suppliers" className="flex-1">الموردين</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">أوامر التوريد</TabsTrigger>
        </TabsList>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <Button className="mr-auto gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { resetSup(); setSupDialog(true); }}>
              <Plus size={16} /> مورد جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSup.map((s) => (
              <Card key={s.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>{s.name}</CardTitle>
                    <Badge variant="outline" className={categoryColors[s.category]}>{categoryLabels[s.category]}</Badge>
                  </div>
                  <p className="text-xs font-mono" style={{ color: "var(--accent-color)" }}>{s.code}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {s.contactPerson && <p className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><User size={14} /> {s.contactPerson}</p>}
                  {s.phone && <p className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><Phone size={14} /> {s.phone}</p>}
                  {s.email && <p className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><Mail size={14} /> {s.email}</p>}
                  {s.address && <p className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><MapPin size={14} /> {s.address}</p>}
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditingSup(s); setSupForm({ code: s.code, name: s.name, contactPerson: s.contactPerson || "", phone: s.phone || "", email: s.email || "", address: s.address || "", category: s.category, status: s.status, notes: s.notes || "" }); setSupDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) removeSupplier(s.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredSup.length === 0 && (
              <div className="col-span-full text-center py-12" style={{ color: "var(--text-muted)" }}>
                <Truck size={32} className="mx-auto mb-3 opacity-50" /><p>لا يوجد موردين</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <Button className="mr-auto gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { resetOrder(); setOrderDialog(true); }}>
              <Plus size={16} /> أمر توريد جديد
            </Button>
          </div>

          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: "var(--border-color)" }}>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>كود الأمر</TableHead>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المورد</TableHead>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>التاريخ</TableHead>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الإجمالي</TableHead>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحالة</TableHead>
                      <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((o) => (
                      <TableRow key={o.id} style={{ borderColor: "var(--border-color)" }}>
                        <TableCell className="font-mono text-xs" style={{ color: "var(--accent-color)" }}>{o.orderCode}</TableCell>
                        <TableCell style={{ color: "var(--text-primary)" }}>{o.supplierName}</TableCell>
                        <TableCell style={{ color: "var(--text-secondary)" }}>{o.date}</TableCell>
                        <TableCell style={{ color: "var(--text-primary)" }}>{Number(o.total).toLocaleString()} ج</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={o.status === "received" ? "bg-emerald-500/15 text-emerald-400" : o.status === "pending" ? "bg-yellow-500/15 text-yellow-400" : o.status === "partial" ? "bg-blue-500/15 text-blue-400" : "bg-red-500/15 text-red-400"}>
                            {o.status === "pending" ? "معلق" : o.status === "partial" ? "جزئي" : o.status === "received" ? "مستلم" : "ملغي"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditingOrder(o); setOrderForm({ orderCode: o.orderCode, supplierId: String(o.supplierId), date: o.date, deliveryDate: o.deliveryDate || "", notes: o.notes || "" }); setOrderItems(o.items.map((i) => ({ itemName: i.itemName, quantity: String(i.quantity), unit: i.unit, unitPrice: i.unitPrice }))); setOrderDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) removeOrder(o.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8" style={{ color: "var(--text-muted)" }}>لا توجد أوامر توريد</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supplier Dialog */}
      <Dialog open={supDialog} onOpenChange={setSupDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editingSup ? "تعديل مورد" : "مورد جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الكود</Label><Input value={supForm.code} onChange={(e) => setSupForm({ ...supForm, code: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التصنيف</Label>
                <Select value={supForm.category} onValueChange={(v) => setSupForm({ ...supForm, category: v as Supplier["category"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-right">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الاسم</Label><Input value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الشخص المسؤول</Label><Input value={supForm.contactPerson} onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التليفون</Label><Input value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>البريد</Label><Input value={supForm.email} onChange={(e) => setSupForm({ ...supForm, email: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>العنوان</Label><Input value={supForm.address} onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>ملاحظات</Label><Input value={supForm.notes} onChange={(e) => setSupForm({ ...supForm, notes: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleSaveSup} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editingOrder ? "تعديل أمر توريد" : "أمر توريد جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>كود الأمر</Label><Input value={orderForm.orderCode} onChange={(e) => setOrderForm({ ...orderForm, orderCode: e.target.value })} className="text-right" placeholder="مثال: PO-001" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>المورد</Label>
                <Select value={orderForm.supplierId} onValueChange={(v) => setOrderForm({ ...orderForm, supplierId: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر المورد" /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)} className="text-right">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التاريخ</Label><Input type="date" value={orderForm.date} onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تاريخ التسليم</Label><Input type="date" value={orderForm.deliveryDate} onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>الأصناف</Label>
              {orderItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <div className="col-span-5"><Input placeholder="الصنف" value={item.itemName} onChange={(e) => { const updated = [...orderItems]; updated[idx].itemName = e.target.value; setOrderItems(updated); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                  <div className="col-span-2"><Input placeholder="كمية" value={item.quantity} onChange={(e) => { const updated = [...orderItems]; updated[idx].quantity = e.target.value; setOrderItems(updated); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                  <div className="col-span-2"><Input placeholder="وحدة" value={item.unit} onChange={(e) => { const updated = [...orderItems]; updated[idx].unit = e.target.value; setOrderItems(updated); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                  <div className="col-span-3"><Input placeholder="السعر" value={item.unitPrice} onChange={(e) => { const updated = [...orderItems]; updated[idx].unitPrice = e.target.value; setOrderItems(updated); }} className="text-right text-xs" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setOrderItems([...orderItems, { itemName: "", quantity: "", unit: "", unitPrice: "" }])} style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
                <Plus size={12} className="ml-1" /> صنف
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleSaveOrder} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
