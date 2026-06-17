import { useState } from "react";
import { useProductionLines, useProductionOrders, useDailyProduction, useEmployees } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCSV } from "@/lib/export";
import { Factory, Plus, Package, TrendingUp, Users, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, ClipboardList, Download } from "lucide-react";

const orderStatusStyles: Record<string, string> = {
  pending: "badge-pending",
  in_progress: "badge-active",
  completed: "badge-approved",
  cancelled: "badge-inactive",
};
const orderStatusLabels: Record<string, string> = {
  pending: "معلقة",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

const lineStatusStyles: Record<string, string> = {
  active: "badge-active",
  maintenance: "badge-pending",
  inactive: "badge-inactive",
};
const lineStatusLabels: Record<string, string> = {
  active: "نشط",
  maintenance: "صيانة",
  inactive: "متوقف",
};

export default function FactoryPage() {
  const [activeTab, setActiveTab] = useState("lines");
  const [page, setPage] = useState(1);
  const [isLineDialogOpen, setIsLineDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);

  const [lineForm, setLineForm] = useState({ name: "", supervisorId: "", targetDaily: "500" });
  const [orderForm, setOrderForm] = useState({ orderCode: "", customerName: "", styleName: "", sizeBreakdown: "", quantity: "", startDate: "", deadline: "", assignedLineId: "" });
  const [prodForm, setProdForm] = useState({ lineId: "", orderId: "", produced: "", defected: "0", workersPresent: "", notes: "" });

  const { data: lines, create: createLine, update: updateLine } = useProductionLines();
  const { data: orders, create: createOrder, update: updateOrder } = useProductionOrders();
  const { data: dailyProd, create: createDailyProd } = useDailyProduction();
  const { data: employees } = useEmployees();

  const pageSize = 10;
  const activeLines = lines.filter((l) => l.status === "active").length;
  const inProgressOrders = orders.filter((o) => o.status === "in_progress").length;
  const totalProduced = dailyProd.reduce((sum, d) => sum + d.produced, 0);
  const totalDefected = dailyProd.reduce((sum, d) => sum + d.defected, 0);
  const defectRate = totalProduced > 0 ? ((totalDefected / totalProduced) * 100).toFixed(1) : "0";
  const today = new Date().toISOString().split("T")[0];

  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  const handleCreateLine = () => {
    const sup = employees.find((e) => e.id === Number(lineForm.supervisorId));
    createLine({
      name: lineForm.name,
      supervisorId: sup?.id,
      supervisorName: sup?.fullName,
      targetDaily: Number(lineForm.targetDaily),
      status: "active",
    });
    setIsLineDialogOpen(false);
    setLineForm({ name: "", supervisorId: "", targetDaily: "500" });
  };

  const handleCreateOrder = () => {
    const line = lines.find((l) => l.id === Number(orderForm.assignedLineId));
    createOrder({
      orderCode: orderForm.orderCode,
      customerName: orderForm.customerName,
      styleName: orderForm.styleName,
      sizeBreakdown: orderForm.sizeBreakdown,
      quantity: Number(orderForm.quantity),
      startDate: orderForm.startDate,
      deadline: orderForm.deadline,
      status: "pending",
      assignedLineId: line?.id,
      assignedLineName: line?.name,
    });
    setIsOrderDialogOpen(false);
    setOrderForm({ orderCode: "", customerName: "", styleName: "", sizeBreakdown: "", quantity: "", startDate: "", deadline: "", assignedLineId: "" });
  };

  const handleCreateDailyProd = () => {
    const line = lines.find((l) => l.id === Number(prodForm.lineId));
    const order = orders.find((o) => o.id === Number(prodForm.orderId));
    createDailyProd({
      date: today,
      lineId: Number(prodForm.lineId),
      lineName: line?.name || "",
      orderId: Number(prodForm.orderId),
      orderCode: order?.orderCode || "",
      produced: Number(prodForm.produced),
      defected: Number(prodForm.defected),
      workersPresent: Number(prodForm.workersPresent),
      notes: prodForm.notes,
    });
    // Update order completed
    if (order) {
      updateOrder(order.id, { completed: order.completed + Number(prodForm.produced) });
    }
    setIsProductionDialogOpen(false);
    setProdForm({ lineId: "", orderId: "", produced: "", defected: "0", workersPresent: "", notes: "" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>إدارة المصنع</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>خطوط الإنتاج والطلبات والإنتاج اليومي</p>
        </div>
        <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => { exportToCSV("production", ["التاريخ", "الخط", "الأمر", "المُنتج", "العيوب", "العاملين"], dailyProd.map((d) => [d.date, d.lineName, d.orderCode, String(d.produced), String(d.defected), String(d.workersPresent)])); }}><Download size={16} className="ml-1.5" /> تصدير الإنتاج</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "خطوط نشطة", value: activeLines, icon: Factory, color: "text-green-400" },
          { label: "طلبات قيد التنفيذ", value: inProgressOrders, icon: Package, color: "text-blue-400" },
          { label: "إجمالي الإنتاج", value: totalProduced.toLocaleString(), icon: TrendingUp, color: "text-white" },
          { label: "نسبة العيوب", value: `${defectRate}%`, icon: defectRate > "5" ? AlertTriangle : CheckCircle, color: defectRate > "5" ? "text-red-400" : "text-green-400" },
        ].map((item) => (
          <Card key={item.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <item.icon size={18} className={`${item.color}`} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              </div>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1C1C1E] border border-white/[0.08]">
          <TabsTrigger value="lines" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50">خطوط الإنتاج</TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50">أوامر الإنتاج</TabsTrigger>
          <TabsTrigger value="daily" className="data-[state=active]:bg-[#4A2C3F] data-[state=active]:text-white text-white/50">الإنتاج اليومي</TabsTrigger>
        </TabsList>

        {/* Lines Tab */}
        <TabsContent value="lines" className="mt-4 space-y-4">
          <Dialog open={isLineDialogOpen} onOpenChange={setIsLineDialogOpen}>
            <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsLineDialogOpen(true)}>
              <Plus size={16} className="ml-1.5" /> إضافة خط إنتاج
            </Button>
            <DialogContent className="theme-card text-white max-w-lg">
              <DialogHeader><DialogTitle className="text-white text-right">خط إنتاج جديد</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4 text-right">
                <div className="space-y-2"><Label className="text-white/70">اسم الخط</Label><Input value={lineForm.name} onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })} className="theme-input text-right" placeholder="مثال: خط خياطة أ" /></div>
                <div className="space-y-2"><Label className="text-white/70">المشرف</Label><Select value={lineForm.supervisorId} onValueChange={(v) => setLineForm({ ...lineForm, supervisorId: v })}><SelectTrigger className="theme-input text-right"><SelectValue placeholder="اختر المشرف" /></SelectTrigger><SelectContent className="theme-input">{employees.filter((e) => e.status === "active").map((e) => <SelectItem key={e.id} value={String(e.id)} className="text-white text-right">{e.fullName}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-white/70">الهدف اليومي</Label><Input type="number" value={lineForm.targetDaily} onChange={(e) => setLineForm({ ...lineForm, targetDaily: e.target.value })} className="theme-input text-right" /></div>
                <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsLineDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!lineForm.name} onClick={handleCreateLine}>إضافة</Button></div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lines.map((line) => (
              <Card key={line.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{line.name}</h3>
                        <Badge variant="outline" className={lineStatusStyles[line.status]}>{lineStatusLabels[line.status]}</Badge>
                      </div>
                      <p className="text-xs text-white/50 mt-1">المشرف: {line.supervisorName || "—"}</p>
                    </div>
                    <Factory size={20} className="text-[#E85D4A]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.08]">
                    <div className="text-center">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>الهدف اليومي</p>
                      <p className="text-sm font-semibold text-white">{line.targetDaily}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>العاملين</p>
                      <p className="text-sm font-semibold text-white flex items-center justify-center gap-1"><Users size={12} /> {line.employeeCount}</p>
                    </div>
                    <div className="text-center">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-[#E85D4A]" onClick={() => updateLine(line.id, { status: line.status === "active" ? "maintenance" : "active" })}>{line.status === "active" ? "تعطيل" : "تفعيل"}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4 space-y-4">
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsOrderDialogOpen(true)}>
              <Plus size={16} className="ml-1.5" /> أمر إنتاج جديد
            </Button>
            <DialogContent className="theme-card text-white max-w-lg">
              <DialogHeader><DialogTitle className="text-white text-right">أمر إنتاج جديد</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4 text-right">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">كود الأمر</Label><Input value={orderForm.orderCode} onChange={(e) => setOrderForm({ ...orderForm, orderCode: e.target.value })} className="theme-input text-right" placeholder="ORD-2026-XXX" /></div>
                  <div className="space-y-2"><Label className="text-white/70">العميل</Label><Input value={orderForm.customerName} onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })} className="theme-input text-right" /></div>
                </div>
                <div className="space-y-2"><Label className="text-white/70">اسم الموديل</Label><Input value={orderForm.styleName} onChange={(e) => setOrderForm({ ...orderForm, styleName: e.target.value })} className="theme-input text-right" /></div>
                <div className="space-y-2"><Label className="text-white/70">المقاسات والكميات</Label><Input value={orderForm.sizeBreakdown} onChange={(e) => setOrderForm({ ...orderForm, sizeBreakdown: e.target.value })} className="theme-input text-right" placeholder="S:100 M:200 L:100" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">الكمية الإجمالية</Label><Input type="number" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} className="theme-input text-right" /></div>
                  <div className="space-y-2"><Label className="text-white/70">خط الإنتاج</Label><Select value={orderForm.assignedLineId} onValueChange={(v) => setOrderForm({ ...orderForm, assignedLineId: v })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{lines.filter((l) => l.status === "active").map((l) => <SelectItem key={l.id} value={String(l.id)} className="text-white text-right">{l.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">تاريخ البدء</Label><Input type="date" value={orderForm.startDate} onChange={(e) => setOrderForm({ ...orderForm, startDate: e.target.value })} className="theme-input text-right" /></div>
                  <div className="space-y-2"><Label className="text-white/70">الموعد النهائي</Label><Input type="date" value={orderForm.deadline} onChange={(e) => setOrderForm({ ...orderForm, deadline: e.target.value })} className="theme-input text-right" /></div>
                </div>
                <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsOrderDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!orderForm.orderCode || !orderForm.customerName || !orderForm.styleName} onClick={handleCreateOrder}>إنشاء</Button></div>
              </div>
            </DialogContent>
          </Dialog>

          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.08] hover:bg-transparent">
                      <TableHead className="text-white/50 font-medium text-right">كود الأمر</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">العميل</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">الموديل</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">الكمية</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">التقدم</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">الحالة</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">الخط</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => {
                      const progress = order.quantity > 0 ? Math.round((order.completed / order.quantity) * 100) : 0;
                      return (
                        <TableRow key={order.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                          <TableCell className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{order.orderCode}</TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{order.customerName}</TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{order.styleName}</TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{order.completed}/{order.quantity}</TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            <div className="w-24 h-2 bg-white/[0.08] rounded-full overflow-hidden">
                              <div className="h-full bg-[#4A2C3F] rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{progress}%</span>
                          </TableCell>
                          <TableCell><Badge variant="outline" className={orderStatusStyles[order.status]}>{orderStatusLabels[order.status]}</Badge></TableCell>
                          <TableCell className="text-sm" style={{ color: "var(--text-muted)" }}>{order.assignedLineName || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.08]">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>صفحة {page} من {totalPages}</p>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronRight size={14} /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronLeft size={14} /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily Production Tab */}
        <TabsContent value="daily" className="mt-4 space-y-4">
          <Dialog open={isProductionDialogOpen} onOpenChange={setIsProductionDialogOpen}>
            <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsProductionDialogOpen(true)}>
              <Plus size={16} className="ml-1.5" /> تسجيل إنتاج اليوم
            </Button>
            <DialogContent className="theme-card text-white max-w-lg">
              <DialogHeader><DialogTitle className="text-white text-right">تسجيل إنتاج يومي - {today}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4 text-right">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">خط الإنتاج</Label><Select value={prodForm.lineId} onValueChange={(v) => setProdForm({ ...prodForm, lineId: v })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{lines.filter((l) => l.status === "active").map((l) => <SelectItem key={l.id} value={String(l.id)} className="text-white text-right">{l.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-white/70">أمر الإنتاج</Label><Select value={prodForm.orderId} onValueChange={(v) => setProdForm({ ...prodForm, orderId: v })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{orders.filter((o) => o.status !== "completed").map((o) => <SelectItem key={o.id} value={String(o.id)} className="text-white text-right">{o.orderCode} - {o.styleName}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">المُنتج</Label><Input type="number" value={prodForm.produced} onChange={(e) => setProdForm({ ...prodForm, produced: e.target.value })} className="theme-input text-right" /></div>
                  <div className="space-y-2"><Label className="text-white/70">العيوب</Label><Input type="number" value={prodForm.defected} onChange={(e) => setProdForm({ ...prodForm, defected: e.target.value })} className="theme-input text-right" /></div>
                  <div className="space-y-2"><Label className="text-white/70">العاملين</Label><Input type="number" value={prodForm.workersPresent} onChange={(e) => setProdForm({ ...prodForm, workersPresent: e.target.value })} className="theme-input text-right" /></div>
                </div>
                <div className="space-y-2"><Label className="text-white/70">ملاحظات</Label><Input value={prodForm.notes} onChange={(e) => setProdForm({ ...prodForm, notes: e.target.value })} className="theme-input text-right" /></div>
                <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsProductionDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!prodForm.lineId || !prodForm.orderId || !prodForm.produced} onClick={handleCreateDailyProd}>تسجيل</Button></div>
              </div>
            </DialogContent>
          </Dialog>

          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.08] hover:bg-transparent">
                      <TableHead className="text-white/50 font-medium text-right">التاريخ</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">الخط</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">الأمر</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">المُنتج</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">العيوب</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">نسبة العيوب</TableHead>
                      <TableHead className="text-white/50 font-medium text-right">العاملين</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyProd.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-white/40">
                          <ClipboardList size={32} className="mx-auto mb-3 opacity-50" />
                          <p>لا توجد سجلات إنتاج</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyProd.sort((a, b) => b.date.localeCompare(a.date)).map((record) => {
                        const rate = record.produced > 0 ? ((record.defected / record.produced) * 100).toFixed(1) : "0";
                        return (
                          <TableRow key={record.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                            <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.date}</TableCell>
                            <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.lineName}</TableCell>
                            <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.orderCode}</TableCell>
                            <TableCell className="text-sm font-medium text-green-400">{record.produced}</TableCell>
                            <TableCell className="text-sm text-red-400">{record.defected}</TableCell>
                            <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{rate}%</TableCell>
                            <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.workersPresent}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
