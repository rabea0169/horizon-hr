// ═══════════════════════════════════════════════════════════════
//  Sales Rep Mobile App — تطبيق مندوب المبيعات
//  واجهة محسّنة للموبايل: زيارات — طلبات — تحصيل — GPS
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import {
  MapPin, Navigation, Phone, Calendar, Clock, DollarSign,
  Plus, CheckCircle, TrendingUp, Users, Package, Target,
  ChevronRight, ClipboardList, CreditCard,
  RefreshCw, Smartphone, UserCheck,
} from "lucide-react";

const visitTypeLabels: Record<string, string> = {
  scheduled: "مجدول",
  unplanned: "غير مخطط",
  follow_up: "متابعة",
  complaint: "شكوى",
  delivery: "تسليم",
  collection: "تحصيل",
};

const visitTypeColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  unplanned: "bg-gray-100 text-gray-700",
  follow_up: "bg-purple-100 text-purple-700",
  complaint: "bg-red-100 text-red-700",
  delivery: "bg-green-100 text-green-700",
  collection: "bg-yellow-100 text-yellow-700",
};

const statusLabels: Record<string, string> = {
  planned: "مخطط",
  in_progress: "جاري",
  completed: "منتهي",
  cancelled: "ملغي",
  no_show: "لم يحضر",
};

const orderStatusLabels: Record<string, string> = {
  draft: "مسودة",
  submitted: "مُرسل",
  approved: "معتمد",
  in_production: "قيد الإنتاج",
  ready: "جاهز",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

export default function SalesRepApp() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("visits");
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: string; lng: string } | null>(null);

  // Visit form
  const [visitForm, setVisitForm] = useState({
    visitNumber: "", salesRepId: "1", salesRepName: "مندوب المبيعات",
    customerId: "", customerName: "", customerPhone: "", customerAddress: "",
    visitType: "scheduled", scheduledDate: "", scheduledTime: "", purpose: "",
  });

  // Order form
  const [orderForm, setOrderForm] = useState({
    orderNumber: "", salesRepId: "1", salesRepName: "مندوب المبيعات",
    visitId: "", customerName: "", customerPhone: "", customerAddress: "",
    modelName: "", color: "", size: "", quantity: "", unitPrice: "",
    totalAmount: "", discountPercent: "0", vatRate: "14", grandTotal: "",
    deliveryDate: "", deliveryAddress: "", specialInstructions: "",
  });

  const utils = trpc.useUtils();
  const salesRepId = 1; // Current logged in sales rep

  const { data: visits, isLoading: visitsLoading } = trpc.salesRepVisit.list.useQuery({
    salesRepId,
  });

  const { data: orders, isLoading: ordersLoading } = trpc.salesRepOrder.list.useQuery({
    salesRepId,
  });

  const { data: visitSummary } = trpc.salesRepVisit.summary.useQuery({
    salesRepId, fromDate: "2025-01-01", toDate: "2025-12-31",
  });

  const { data: customers } = trpc.crm.list.useQuery();
  const { data: models } = trpc.productionModel.list.useQuery();

  const createVisit = trpc.salesRepVisit.create.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم إضافة الزيارة" });
      utils.salesRepVisit.list.invalidate();
      setIsVisitDialogOpen(false);
    },
  });

  const startVisit = trpc.salesRepVisit.startVisit.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم بدء الزيارة" });
      utils.salesRepVisit.list.invalidate();
    },
  });

  const completeVisit = trpc.salesRepVisit.completeVisit.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم إنهاء الزيارة" });
      utils.salesRepVisit.list.invalidate();
      setSelectedVisitId(null);
    },
  });

  const createOrder = trpc.salesRepOrder.create.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم إنشاء الطلب" });
      utils.salesRepOrder.list.invalidate();
      setIsOrderDialogOpen(false);
    },
  });

  const submitOrder = trpc.salesRepOrder.submit.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم إرسال الطلب" });
      utils.salesRepOrder.list.invalidate();
    },
  });

  // Get GPS location
  const getGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude.toFixed(8),
            lng: pos.coords.longitude.toFixed(8),
          });
          toast({ title: "تم", description: "تم تحديد الموقع" });
        },
        () => toast({ title: "خطأ", description: "تعذر تحديد الموقع", variant: "destructive" })
      );
    }
  };

  // Auto-calculate order totals
  const calcOrder = (updates: Partial<typeof orderForm>) => {
    const newForm = { ...orderForm, ...updates };
    const qty = parseFloat(newForm.quantity) || 0;
    const price = parseFloat(newForm.unitPrice) || 0;
    const discPct = parseFloat(newForm.discountPercent) || 0;
    const vat = parseFloat(newForm.vatRate) || 14;

    const subtotal = qty * price;
    const discAmt = subtotal * (discPct / 100);
    const afterDisc = subtotal - discAmt;
    const vatAmt = afterDisc * (vat / 100);
    const grand = afterDisc + vatAmt;

    setOrderForm({
      ...newForm,
      totalAmount: subtotal.toFixed(2),
      grandTotal: grand.toFixed(2),
    });
  };

  const selectedVisit = visits?.find(v => v.id === selectedVisitId);

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* App Header - Mobile Style */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">مندوب المبيعات</h1>
            <p className="text-blue-100 text-sm flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> أحمد محمد — كود: REP-001
            </p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs text-blue-200">{new Date().toLocaleDateString("ar-EG")}</p>
          <p className="text-lg font-bold">{visitSummary?.summary?.completedVisits?.toString() || 0} زيارة</p>
        </div>
      </div>

      {/* Quick Stats - Mobile Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">الزيارات</p>
                <p className="text-lg font-bold">{visitSummary?.summary?.totalVisits?.toString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">مكتملة</p>
                <p className="text-lg font-bold">{visitSummary?.summary?.completedVisits?.toString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">الطلبات</p>
                <p className="text-lg font-bold">{visitSummary?.summary?.ordersTaken?.toString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">التحصيل</p>
                <p className="text-lg font-bold">
                  {parseFloat(visitSummary?.summary?.totalPayments?.toString() || "0").toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="visits" className="gap-1"><Navigation className="h-4 w-4" /> الزيارات</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1"><ClipboardList className="h-4 w-4" /> الطلبات</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1"><TrendingUp className="h-4 w-4" /> الأداء</TabsTrigger>
        </TabsList>

        {/* VISITS TAB */}
        <TabsContent value="visits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">زيارات اليوم</h2>
            <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> زيارة</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>زيارة جديدة</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="رقم الزيارة" value={visitForm.visitNumber} onChange={e => setVisitForm(p => ({ ...p, visitNumber: e.target.value }))} />
                  <Select value={visitForm.visitType} onValueChange={v => setVisitForm(p => ({ ...p, visitType: v }))}>
                    <SelectTrigger><SelectValue placeholder="نوع الزيارة" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(visitTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={visitForm.customerId} onValueChange={v => {
                    const c = customers?.find(cu => cu.id.toString() === v);
                    setVisitForm(p => ({ ...p, customerId: v, customerName: c?.name || "", customerPhone: c?.phone || "", customerAddress: c?.address || "" }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                    <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="اسم العميل" value={visitForm.customerName} onChange={e => setVisitForm(p => ({ ...p, customerName: e.target.value }))} />
                  <Input placeholder="هاتف العميل" value={visitForm.customerPhone} onChange={e => setVisitForm(p => ({ ...p, customerPhone: e.target.value }))} />
                  <Input placeholder="عنوان العميل" value={visitForm.customerAddress} onChange={e => setVisitForm(p => ({ ...p, customerAddress: e.target.value }))} />
                  <Input type="date" value={visitForm.scheduledDate} onChange={e => setVisitForm(p => ({ ...p, scheduledDate: e.target.value }))} />
                  <Input type="time" value={visitForm.scheduledTime} onChange={e => setVisitForm(p => ({ ...p, scheduledTime: e.target.value }))} />
                  <Input placeholder="الغرض من الزيارة" value={visitForm.purpose} onChange={e => setVisitForm(p => ({ ...p, purpose: e.target.value }))} />
                  <Button className="w-full" onClick={() => {
                    if (!visitForm.visitNumber || !visitForm.customerName || !visitForm.scheduledDate) {
                      toast({ title: "خطأ", description: "املأ الحقول المطلوبة", variant: "destructive" });
                      return;
                    }
                    createVisit.mutate({
                      visitNumber: visitForm.visitNumber,
                      salesRepId: Number(visitForm.salesRepId),
                      salesRepName: visitForm.salesRepName,
                      customerId: visitForm.customerId ? Number(visitForm.customerId) : undefined,
                      customerName: visitForm.customerName,
                      customerPhone: visitForm.customerPhone || undefined,
                      customerAddress: visitForm.customerAddress || undefined,
                      visitType: visitForm.visitType as any,
                      scheduledDate: visitForm.scheduledDate,
                      scheduledTime: visitForm.scheduledTime || undefined,
                      purpose: visitForm.purpose || undefined,
                    });
                  }} disabled={createVisit.isPending}>
                    {createVisit.isPending ? "جاري..." : "حفظ الزيارة"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Visits List */}
          {visitsLoading ? (
            <p className="text-center text-muted-foreground">جاري التحميل...</p>
          ) : !visits?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد زيارات</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {visits.map(visit => (
                <Card key={visit.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedVisitId(visit.id)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={visitTypeColors[visit.visitType || "scheduled"]}>
                            {visitTypeLabels[visit.visitType || "scheduled"]}
                          </Badge>
                          <Badge variant="outline">{statusLabels[visit.status || "planned"]}</Badge>
                        </div>
                        <h3 className="font-bold">{visit.customerName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {visit.customerAddress}
                        </p>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {visit.scheduledDate?.toString()}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {visit.scheduledTime}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {visit.status === "planned" && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="flex-1 gap-1" variant="outline"
                          onClick={(e) => { e.stopPropagation(); getGPS(); startVisit.mutate({ id: visit.id, gpsLatitude: gpsLocation?.lat, gpsLongitude: gpsLocation?.lng }); }}>
                          <Navigation className="h-3 w-3" /> بدء
                        </Button>
                      </div>
                    )}
                    {visit.status === "in_progress" && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="flex-1 gap-1 bg-green-600"
                          onClick={(e) => { e.stopPropagation(); setSelectedVisitId(visit.id); }}>
                          <CheckCircle className="h-3 w-3" /> إنهاء
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ORDERS TAB */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">طلبات المبيعات</h2>
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> طلب</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>طلب بيع جديد</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="رقم الطلب" value={orderForm.orderNumber} onChange={e => setOrderForm(p => ({ ...p, orderNumber: e.target.value }))} />
                  <Input placeholder="اسم العميل *" value={orderForm.customerName} onChange={e => setOrderForm(p => ({ ...p, customerName: e.target.value }))} />
                  <Input placeholder="هاتف العميل" value={orderForm.customerPhone} onChange={e => setOrderForm(p => ({ ...p, customerPhone: e.target.value }))} />
                  <Input placeholder="عنوان التوصيل" value={orderForm.deliveryAddress} onChange={e => setOrderForm(p => ({ ...p, deliveryAddress: e.target.value }))} />
                  <Select value={orderForm.modelName} onValueChange={v => setOrderForm(p => ({ ...p, modelName: v }))}>
                    <SelectTrigger><SelectValue placeholder="الموديل" /></SelectTrigger>
                    <SelectContent>{models?.map(m => <SelectItem key={m.id} value={m.name || ""}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="اللون" value={orderForm.color} onChange={e => setOrderForm(p => ({ ...p, color: e.target.value }))} />
                    <Input placeholder="المقاس" value={orderForm.size} onChange={e => setOrderForm(p => ({ ...p, size: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="الكمية *" value={orderForm.quantity} onChange={e => calcOrder({ quantity: e.target.value })} />
                    <Input type="number" placeholder="سعر الوحدة *" value={orderForm.unitPrice} onChange={e => calcOrder({ unitPrice: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="الخصم %" value={orderForm.discountPercent} onChange={e => calcOrder({ discountPercent: e.target.value })} />
                    <Input type="number" placeholder="VAT %" value={orderForm.vatRate} onChange={e => calcOrder({ vatRate: e.target.value })} />
                  </div>
                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>الإجمالي:</span>
                      <span className="font-bold">{orderForm.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>الصافي (شامل VAT):</span>
                      <span className="font-bold text-lg text-green-600">{orderForm.grandTotal} ج.م</span>
                    </div>
                  </div>
                  <Input type="date" placeholder="تاريخ التسليم" value={orderForm.deliveryDate} onChange={e => setOrderForm(p => ({ ...p, deliveryDate: e.target.value }))} />
                  <Input placeholder="تعليمات خاصة" value={orderForm.specialInstructions} onChange={e => setOrderForm(p => ({ ...p, specialInstructions: e.target.value }))} />
                  <Button className="w-full" onClick={() => {
                    if (!orderForm.orderNumber || !orderForm.customerName || !orderForm.quantity || !orderForm.unitPrice) {
                      toast({ title: "خطأ", description: "املأ الحقول المطلوبة", variant: "destructive" });
                      return;
                    }
                    createOrder.mutate({
                      orderNumber: orderForm.orderNumber,
                      salesRepId: Number(orderForm.salesRepId),
                      salesRepName: orderForm.salesRepName,
                      customerName: orderForm.customerName,
                      customerPhone: orderForm.customerPhone || undefined,
                      customerAddress: orderForm.deliveryAddress || undefined,
                      modelName: orderForm.modelName || undefined,
                      color: orderForm.color || undefined,
                      size: orderForm.size || undefined,
                      quantity: Number(orderForm.quantity),
                      unitPrice: orderForm.unitPrice,
                      totalAmount: orderForm.totalAmount,
                      discountPercent: orderForm.discountPercent,
                      vatRate: orderForm.vatRate,
                      vatAmount: (parseFloat(orderForm.grandTotal) - parseFloat(orderForm.totalAmount || "0")).toFixed(2),
                      grandTotal: orderForm.grandTotal,
                      deliveryDate: orderForm.deliveryDate || undefined,
                      deliveryAddress: orderForm.deliveryAddress || undefined,
                      specialInstructions: orderForm.specialInstructions || undefined,
                    });
                  }} disabled={createOrder.isPending}>
                    {createOrder.isPending ? "جاري..." : "إنشاء الطلب"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {ordersLoading ? (
            <p className="text-center text-muted-foreground">جاري التحميل...</p>
          ) : !orders?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد طلبات</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">{order.orderNumber}</span>
                          <Badge variant={order.status === "draft" ? "outline" : "default"}>
                            {orderStatusLabels[order.status || "draft"]}
                          </Badge>
                          {order.syncedToErp && <Badge className="bg-green-100 text-green-700 gap-1"><RefreshCw className="h-3 w-3" /> متزامن</Badge>}
                        </div>
                        <h3 className="font-bold mt-1">{order.customerName}</h3>
                        <p className="text-sm text-muted-foreground">{order.modelName} — {order.color} / {order.size}</p>
                        <p className="text-sm">{order.quantity} قطعة × {parseFloat(order.unitPrice?.toString() || "0").toLocaleString()} ج.م</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-green-600">{parseFloat(order.grandTotal?.toString() || "0").toLocaleString()} ج.م</p>
                      </div>
                    </div>
                    {order.status === "draft" && (
                      <div className="mt-3">
                        <Button size="sm" className="w-full" onClick={() => submitOrder.mutate({ id: order.id })}>
                          <RefreshCw className="h-3 w-3 ml-1" /> إرسال الطلب
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> أداء المندوب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{visitSummary?.summary?.totalVisits?.toString() || 0}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الزيارات</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{visitSummary?.summary?.completedVisits?.toString() || 0}</p>
                  <p className="text-sm text-muted-foreground">زيارات مكتملة</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <Package className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">{visitSummary?.summary?.ordersTaken?.toString() || 0}</p>
                  <p className="text-sm text-muted-foreground">طلبات محققة</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <CreditCard className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold">
                    {parseFloat(visitSummary?.summary?.totalPayments?.toString() || "0").toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">التحصيل (ج.م)</p>
                </div>
              </div>

              {visitSummary?.summary?.totalVisits && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">نسبة الإنجاز</p>
                  <div className="w-full bg-muted rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (Number(visitSummary.summary.completedVisits) / Number(visitSummary.summary.totalVisits)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {Math.round((Number(visitSummary.summary.completedVisits) / Number(visitSummary.summary.totalVisits)) * 100)}% مكتمل
                  </p>
                </div>
              )}

              {visitSummary?.summary?.totalOrderAmount && (
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">إجمالي مبيعات الزيارات</span>
                    <span className="text-xl font-bold text-green-600">
                      {parseFloat(visitSummary.summary.totalOrderAmount.toString()).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visit Detail / Complete Dialog */}
      {selectedVisit && selectedVisit.status === "in_progress" && (
        <Dialog open={!!selectedVisitId && selectedVisit.status === "in_progress"} onOpenChange={() => setSelectedVisitId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>إنهاء الزيارة</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">العميل: <strong>{selectedVisit.customerName}</strong></p>
              <p className="text-sm text-muted-foreground">بدأت: {selectedVisit.actualStartTime?.toLocaleString?.() || "-"}</p>
              <Input placeholder="نتيجة الزيارة *" id="visitOutcome" />
              <Input placeholder="ملاحظات" id="visitNotes" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="قيمة الطلب" id="visitOrderAmt" />
                <Input type="number" placeholder="مبلغ التحصيل" id="visitPayment" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1" onClick={getGPS}>
                  <MapPin className="h-4 w-4" /> GPS
                </Button>
                {gpsLocation && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    {gpsLocation.lat}, {gpsLocation.lng}
                  </span>
                )}
              </div>
              <Button
                className="w-full bg-green-600"
                onClick={() => {
                  const outcome = (document.getElementById("visitOutcome") as HTMLInputElement)?.value;
                  const notes = (document.getElementById("visitNotes") as HTMLInputElement)?.value;
                  const orderAmt = (document.getElementById("visitOrderAmt") as HTMLInputElement)?.value;
                  const payment = (document.getElementById("visitPayment") as HTMLInputElement)?.value;
                  if (!outcome) {
                    toast({ title: "خطأ", description: "أدخل نتيجة الزيارة", variant: "destructive" });
                    return;
                  }
                  completeVisit.mutate({
                    id: selectedVisit.id,
                    outcome,
                    notes: notes || undefined,
                    orderTaken: !!orderAmt,
                    orderAmount: orderAmt || undefined,
                    paymentCollected: payment || undefined,
                    gpsLatitude: gpsLocation?.lat,
                    gpsLongitude: gpsLocation?.lng,
                  });
                }}
                disabled={completeVisit.isPending}
              >
                {completeVisit.isPending ? "جاري..." : "إنهاء الزيارة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
