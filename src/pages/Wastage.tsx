// ═══════════════════════════════════════════════════════════════
//  Wastage Page — حساب الهالك
//  تتبع الهالك في القص والخياطة والتشطيب
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
  Scissors, AlertTriangle, TrendingDown, CheckCircle,
  Plus, Search, Gauge, BarChart3,
} from "lucide-react";

const sourceLabels: Record<string, string> = {
  cutting: "القص",
  sewing: "الخياطة",
  ironing: "الكي",
  finishing: "التشطيب",
  qc_reject: "رفض الجودة",
  damage: "تلف",
  expiry: "انتهاء صلاحية",
};

const wastageTypeLabels: Record<string, string> = {
  end_bit: "بقايا الطرف",
  defect: "عيب",
  shrinkage: "انكماش",
  overcut: "قص زائد",
  miscut: "قص خاطئ",
  thread_waste: "هالك خيط",
  oil_stain: "بقعة زيت",
  other: "أخرى",
};

const statusConfig: Record<string, { color: string; label: string }> = {
  reported: { color: "bg-blue-100 text-blue-700", label: "مُبلّغ" },
  under_review: { color: "bg-yellow-100 text-yellow-700", label: "قيد المراجعة" },
  approved: { color: "bg-green-100 text-green-700", label: "معتمد" },
  rejected: { color: "bg-red-100 text-red-700", label: "مرفوض" },
  resolved: { color: "bg-gray-100 text-gray-700", label: "محلول" },
};

export default function Wastage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  // Form
  const [form, setForm] = useState({
    wastageNumber: "", sourceType: "cutting", sourceId: "",
    modelId: "", productionOrderId: "", lineId: "",
    itemId: "", fabricRollId: "", wastageType: "end_bit",
    quantity: "", unit: "meter", unitCost: "", totalCost: "",
    percentOfInput: "", standardPercent: "5",
    reason: "", correctiveAction: "", wastageDate: "", notes: "",
  });

  const utils = trpc.useUtils();
  const { data: records, isLoading } = trpc.wastage.list.useQuery({
    sourceType: sourceFilter !== "__all__" ? sourceFilter : undefined,
    status: statusFilter !== "__all__" ? statusFilter : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const { data: summary } = trpc.wastage.summary.useQuery(
    { fromDate: fromDate || "2024-01-01", toDate: toDate || "2025-12-31" },
    { enabled: activeTab === "dashboard" }
  );

  const { data: lines } = trpc.productionLine.list.useQuery();
  const { data: models } = trpc.productionModel.list.useQuery();

  const createMutation = trpc.wastage.create.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم تسجيل الهالك بنجاح" });
      utils.wastage.list.invalidate();
      setIsAddOpen(false);
    },
  });

  const updateMutation = trpc.wastage.update.useMutation({
    onSuccess: () => {
      toast({ title: "تم", description: "تم تحديث السجل" });
      utils.wastage.list.invalidate();
    },
  });

  const handleSubmit = () => {
    if (!form.wastageNumber || !form.quantity || !form.wastageDate) {
      toast({ title: "خطأ", description: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      wastageNumber: form.wastageNumber,
      sourceType: form.sourceType as any,
      sourceId: form.sourceId ? Number(form.sourceId) : undefined,
      modelId: form.modelId ? Number(form.modelId) : undefined,
      productionOrderId: form.productionOrderId ? Number(form.productionOrderId) : undefined,
      lineId: form.lineId ? Number(form.lineId) : undefined,
      itemId: form.itemId ? Number(form.itemId) : undefined,
      fabricRollId: form.fabricRollId ? Number(form.fabricRollId) : undefined,
      wastageType: form.wastageType as any,
      quantity: form.quantity,
      unit: form.unit,
      unitCost: form.unitCost || undefined,
      totalCost: form.totalCost || undefined,
      percentOfInput: form.percentOfInput || undefined,
      standardPercent: form.standardPercent || undefined,
      reason: form.reason || undefined,
      correctiveAction: form.correctiveAction || undefined,
      wastageDate: form.wastageDate,
      notes: form.notes || undefined,
    });
  };

  const totalWastageCost = useMemo(() =>
    records?.reduce((s, r) => s + parseFloat(r.totalCost?.toString() || "0"), 0) ?? 0,
  [records]);

  const avgPercent = useMemo(() =>
    records?.length ? (records.reduce((s, r) => s + parseFloat(r.percentOfInput?.toString() || "0"), 0) / records.length).toFixed(2) : "0",
  [records]);

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">حساب الهالك</h1>
          <p className="text-muted-foreground">تتبع الهالك في القص والإنتاج ومقارنته بالمعايير</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> تسجيل هالك</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>تسجيل هالك جديد</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm">الرقم *</label><Input value={form.wastageNumber} onChange={e => setForm(p => ({ ...p, wastageNumber: e.target.value }))} placeholder="WST-001" /></div>
              <div>
                <label className="text-sm">مصدر الهالك *</label>
                <Select value={form.sourceType} onValueChange={v => setForm(p => ({ ...p, sourceType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">نوع الهالك *</label>
                <Select value={form.wastageType} onValueChange={v => setForm(p => ({ ...p, wastageType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(wastageTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">خط الإنتاج</label>
                <Select value={form.lineId} onValueChange={v => setForm(p => ({ ...p, lineId: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الخط" /></SelectTrigger>
                  <SelectContent>{lines?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">الموديل</label>
                <Select value={form.modelId} onValueChange={v => setForm(p => ({ ...p, modelId: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الموديل" /></SelectTrigger>
                  <SelectContent>{models?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm">التاريخ *</label><Input type="date" value={form.wastageDate} onChange={e => setForm(p => ({ ...p, wastageDate: e.target.value }))} /></div>
              <div><label className="text-sm">الكمية *</label><Input type="number" step="0.001" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} /></div>
              <div><label className="text-sm">الوحدة</label>
                <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meter">متر</SelectItem>
                    <SelectItem value="kg">كجم</SelectItem>
                    <SelectItem value="piece">قطعة</SelectItem>
                    <SelectItem value="yard">ياردة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm">% من الإدخال</label><Input type="number" step="0.01" value={form.percentOfInput} onChange={e => setForm(p => ({ ...p, percentOfInput: e.target.value }))} /></div>
              <div><label className="text-sm">% المعياري</label><Input type="number" value={form.standardPercent} onChange={e => setForm(p => ({ ...p, standardPercent: e.target.value }))} /></div>
              <div><label className="text-sm">تكلفة الوحدة</label><Input type="number" value={form.unitCost} onChange={e => setForm(p => ({ ...p, unitCost: e.target.value }))} /></div>
              <div className="col-span-2"><label className="text-sm">السبب</label><Input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="سبب الهالك..." /></div>
              <div className="col-span-2"><label className="text-sm">الإجراء التصحيحي</label><Input value={form.correctiveAction} onChange={e => setForm(p => ({ ...p, correctiveAction: e.target.value }))} placeholder="الإجراء المتخذ..." /></div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "جاري الحفظ..." : "تسجيل"}
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
                <p className="text-sm text-muted-foreground">إجمالي تكلفة الهالك</p>
                <p className="text-2xl font-bold text-red-600">{totalWastageCost.toLocaleString()} ج.م</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full"><TrendingDown className="h-6 w-6 text-red-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد السجلات</p>
                <p className="text-2xl font-bold">{records?.length ?? 0}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full"><AlertTriangle className="h-6 w-6 text-orange-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متوسط % الهالك</p>
                <p className="text-2xl font-bold">{avgPercent}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full"><Gauge className="h-6 w-6 text-blue-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ضمن المعيار</p>
                <p className="text-2xl font-bold text-green-600">
                  {records?.filter(r => r.isWithinStandard).length ?? 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full"><CheckCircle className="h-6 w-6 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">سجل الهالك</TabsTrigger>
          <TabsTrigger value="dashboard">لوحة التحكم</TabsTrigger>
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
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger><SelectValue placeholder="المصدر" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">الكل</SelectItem>
                    {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Scissors className="h-5 w-5" /> سجل الهالك</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرقم</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>% الهالك</TableHead>
                    <TableHead>% المعياري</TableHead>
                    <TableHead>التكلفة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                  ) : !records?.length ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد سجلات</TableCell></TableRow>
                  ) : (
                    records.map(record => {
                      const cfg = statusConfig[record.status || "reported"];
                      const pct = parseFloat(record.percentOfInput?.toString() || "0");
                      const std = parseFloat(record.standardPercent?.toString() || "0");
                      const overStd = std > 0 && pct > std;
                      return (
                        <TableRow key={record.id} className={overStd ? "bg-red-50/50" : ""}>
                          <TableCell className="font-mono text-xs">{record.wastageNumber}</TableCell>
                          <TableCell>{sourceLabels[record.sourceType] || record.sourceType}</TableCell>
                          <TableCell>{wastageTypeLabels[record.wastageType] || record.wastageType}</TableCell>
                          <TableCell>{record.quantity} {record.unit}</TableCell>
                          <TableCell className={overStd ? "text-red-600 font-bold" : ""}>
                            {pct.toFixed(2)}%
                            {overStd && <AlertTriangle className="inline h-3 w-3 mr-1 text-red-500" />}
                          </TableCell>
                          <TableCell>{std > 0 ? `${std.toFixed(2)}%` : "-"}</TableCell>
                          <TableCell>{parseFloat(record.totalCost?.toString() || "0").toLocaleString()} ج.م</TableCell>
                          <TableCell><Badge className={cfg?.color}>{cfg?.label}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {record.status === "reported" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs"
                                  onClick={() => updateMutation.mutate({ id: record.id, status: "under_review" })}>
                                  مراجعة
                                </Button>
                              )}
                              {record.status === "under_review" && (
                                <>
                                  <Button size="sm" variant="outline" className="h-8 text-xs bg-green-50"
                                    onClick={() => updateMutation.mutate({ id: record.id, status: "approved" })}>
                                    اعتماد
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 text-xs bg-red-50"
                                    onClick={() => updateMutation.mutate({ id: record.id, status: "rejected" })}>
                                    رفض
                                  </Button>
                                </>
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
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> حسب المصدر</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {summary?.bySource?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <span>{sourceLabels[item.sourceType?.toString() || ""] || item.sourceType}</span>
                    </div>
                    <div className="text-left">
                      <span className="font-bold block">{parseFloat(item.totalCost?.toString() || "0").toLocaleString()} ج.م</span>
                      <span className="text-xs text-muted-foreground">{item.count?.toString() || 0} حالة</span>
                    </div>
                  </div>
                )) || <p className="text-muted-foreground text-center">لا توجد بيانات</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>ملخص الهالك</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span>إجمالي السجلات</span>
                  <span className="font-bold">{summary?.summary?.totalRecords?.toString() || 0}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>إجمالي التكلفة</span>
                  <span className="font-bold text-red-600">
                    {parseFloat(summary?.summary?.totalWastageCost?.toString() || "0").toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>إجمالي الكمية</span>
                  <span className="font-bold">{parseFloat(summary?.summary?.totalQuantity?.toString() || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>متوسط % الهالك</span>
                  <span className="font-bold">{parseFloat(summary?.summary?.avgPercent?.toString() || "0").toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>ضمن المعيار / خارج المعيار</span>
                  <span className="font-bold">
                    <span className="text-green-600">{summary?.summary?.withinStandard?.toString() || 0}</span>
                    {" / "}
                    <span className="text-red-600">{summary?.summary?.outsideStandard?.toString() || 0}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
