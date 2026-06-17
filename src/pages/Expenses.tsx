// ═══════════════════════════════════════════════════════════════
//  Expenses Page — المصاريف التشغيلية
//  إدارة المصاريف: كهرباء، إيجار، مياه، صيانة، وغيرها
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import {
  DollarSign, TrendingUp, Receipt, Filter, Plus, Search,
  Zap, Home, Droplets, Wrench, Truck, Wifi, Phone,
  CircleDollarSign, CalendarDays, AlertTriangle,
} from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  paid: "مدفوع",
};

const categoryIcons: Record<string, typeof Zap> = {
  electricity: Zap,
  rent: Home,
  water: Droplets,
  maintenance: Wrench,
  transport: Truck,
  internet: Wifi,
  phone: Phone,
  other: CircleDollarSign,
};

const paymentMethods: Record<string, string> = {
  cash: "نقدي",
  check: "شيك",
  bank_transfer: "تحويل بنكي",
  credit_card: "بطاقة ائتمان",
  other: "أخرى",
};

export default function Expenses() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  // Form state
  const [formData, setFormData] = useState({
    expenseNumber: "", categoryId: 0, title: "", description: "",
    amount: "", expenseDate: "", paymentMethod: "cash",
    payee: "", receiptNumber: "", isRecurring: false,
    recurringFrequency: "", vatAmount: "0", totalAmount: "", notes: "",
  });

  const utils = trpc.useUtils();
  const { data: categories } = trpc.expenseCategory.list.useQuery();
  const { data: expenses, isLoading } = trpc.expense.list.useQuery({
    categoryId: categoryFilter !== "__all__" ? Number(categoryFilter) : undefined,
    status: statusFilter !== "__all__" ? statusFilter : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    search: search || undefined,
  });

  const { data: summary } = trpc.expense.summary.useQuery(
    { fromDate: fromDate || "2024-01-01", toDate: toDate || "2025-12-31" },
    { enabled: activeTab === "dashboard" }
  );

  const createExpense = trpc.expense.create.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم إضافة المصروف بنجاح" });
      utils.expense.list.invalidate();
      setIsAddOpen(false);
      resetForm();
    },
  });

  const approveExpense = trpc.expense.approve.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم اعتماد المصروف" });
      utils.expense.list.invalidate();
    },
  });

  const updateStatus = trpc.expense.update.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم تحديث الحالة" });
      utils.expense.list.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({
      expenseNumber: "", categoryId: 0, title: "", description: "",
      amount: "", expenseDate: "", paymentMethod: "cash",
      payee: "", receiptNumber: "", isRecurring: false,
      recurringFrequency: "", vatAmount: "0", totalAmount: "", notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.expenseNumber || !formData.title || !formData.amount || !formData.expenseDate) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createExpense.mutate({
      ...formData,
      categoryId: Number(formData.categoryId),
      amount: formData.amount,
      totalAmount: formData.totalAmount || formData.amount,
    });
  };

  // Auto-calculate VAT
  const calcVAT = (amount: string) => {
    const amt = parseFloat(amount) || 0;
    const vat = (amt * 0.14).toFixed(2);
    const total = (amt + parseFloat(vat)).toFixed(2);
    setFormData(prev => ({ ...prev, vatAmount: vat, totalAmount: total }));
  };

  const totalAmount = useMemo(() =>
    expenses?.reduce((sum, e) => sum + parseFloat(e.totalAmount?.toString() || "0"), 0) ?? 0,
  [expenses]);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المصاريف التشغيلية</h1>
          <p className="text-muted-foreground">إدارة مصاريف المصنع الشهرية</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> مصروف جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>إضافة مصروف جديد</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm">رقم المصروف *</label>
                <Input value={formData.expenseNumber} onChange={e => setFormData(p => ({ ...p, expenseNumber: e.target.value }))} placeholder="EXP-2025-001" />
              </div>
              <div>
                <label className="text-sm">الفئة *</label>
                <Select value={formData.categoryId.toString()} onValueChange={v => setFormData(p => ({ ...p, categoryId: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">التاريخ *</label>
                <Input type="date" value={formData.expenseDate} onChange={e => setFormData(p => ({ ...p, expenseDate: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm">العنوان *</label>
                <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="مثال: فاتورة الكهرباء - يناير 2025" />
              </div>
              <div className="col-span-2">
                <label className="text-sm">الوصف</label>
                <Input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="تفاصيل إضافية" />
              </div>
              <div>
                <label className="text-sm">المبلغ *</label>
                <Input type="number" value={formData.amount} onChange={e => { setFormData(p => ({ ...p, amount: e.target.value })); calcVAT(e.target.value); }} placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm">ضريبة القيمة المضافة</label>
                <Input type="number" value={formData.vatAmount} readOnly className="bg-muted" />
              </div>
              <div>
                <label className="text-sm">الإجمالي</label>
                <Input type="number" value={formData.totalAmount} readOnly className="bg-muted font-bold" />
              </div>
              <div>
                <label className="text-sm">طريقة الدفع</label>
                <Select value={formData.paymentMethod} onValueChange={v => setFormData(p => ({ ...p, paymentMethod: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethods).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">المستفيد</label>
                <Input value={formData.payee} onChange={e => setFormData(p => ({ ...p, payee: e.target.value }))} placeholder="اسم الجهة المستفيدة" />
              </div>
              <div>
                <label className="text-sm">رقم الإيصال</label>
                <Input value={formData.receiptNumber} onChange={e => setFormData(p => ({ ...p, receiptNumber: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-sm">ملاحظات</label>
                <Input value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit} disabled={createExpense.isPending}>
              {createExpense.isPending ? "جاري الحفظ..." : "حفظ المصروف"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المصاريف</p>
                <p className="text-2xl font-bold">{totalAmount.toLocaleString()} ج.م</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full"><DollarSign className="h-6 w-6 text-red-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد المصاريف</p>
                <p className="text-2xl font-bold">{expenses?.length ?? 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full"><Receipt className="h-6 w-6 text-blue-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط المصروف</p>
                <p className="text-2xl font-bold">
                  {expenses?.length ? (totalAmount / expenses.length).toFixed(0) : 0} ج.م
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full"><TrendingUp className="h-6 w-6 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                <p className="text-2xl font-bold">
                  {expenses?.filter(e => e.status === "pending").length ?? 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full"><AlertTriangle className="h-6 w-6 text-yellow-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">قائمة المصاريف</TabsTrigger>
          <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="الفئة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" placeholder="من" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                <Input type="date" placeholder="إلى" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" /> سجل المصاريف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم المصروف</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                  ) : !expenses?.length ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد مصاريف</TableCell></TableRow>
                  ) : (
                    expenses.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-mono text-sm">{expense.expenseNumber}</TableCell>
                        <TableCell className="font-medium">{expense.title}</TableCell>
                        <TableCell>
                          {categories?.find(c => c.id === expense.categoryId)?.name || "-"}
                        </TableCell>
                        <TableCell className="font-bold">{parseFloat(expense.totalAmount?.toString() || "0").toLocaleString()} ج.م</TableCell>
                        <TableCell className="text-sm">{expense.expenseDate?.toString()}</TableCell>
                        <TableCell className="text-sm">{paymentMethods[expense.paymentMethod || "cash"] || expense.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[expense.status || "draft"]}>
                            {statusLabels[expense.status || "draft"]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {expense.status === "pending" && (
                              <Button size="sm" variant="outline" className="h-8 text-xs"
                                onClick={() => approveExpense.mutate({ id: expense.id, approvedBy: 1 })}>
                                اعتماد
                              </Button>
                            )}
                            {expense.status === "approved" && (
                              <Button size="sm" variant="outline" className="h-8 text-xs bg-green-50"
                                onClick={() => updateStatus.mutate({ id: expense.id, status: "paid" })}>
                                دفع
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>ملخص المصاريف</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span>إجمالي المصاريف المدفوعة</span>
                  <span className="font-bold">
                    {parseFloat(summary?.summary?.totalExpenses?.toString() || "0").toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>عدد المصاريف</span>
                  <span className="font-bold">{summary?.summary?.count?.toString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط المصروف</span>
                  <span className="font-bold">
                    {parseFloat(summary?.summary?.avgExpense?.toString() || "0").toFixed(2)} ج.م
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>حسب الفئة</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {summary?.byCategory?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <span>{categories?.find(c => c.id === item.categoryId)?.name || "غير معروف"}</span>
                    <span className="font-bold">{parseFloat(item.total?.toString() || "0").toLocaleString()} ج.م</span>
                  </div>
                )) || <p className="text-muted-foreground text-center">لا توجد بيانات</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" /> فئات المصاريف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories?.map(cat => (
                  <Card key={cat.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold">{cat.name}</h3>
                          <p className="text-sm text-muted-foreground">{cat.code}</p>
                        </div>
                      </div>
                      {cat.budgetLimit && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">الميزانية: {parseFloat(cat.budgetLimit).toLocaleString()} ج.م</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )) || <p className="text-muted-foreground col-span-3 text-center">لا توجد فئات</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
