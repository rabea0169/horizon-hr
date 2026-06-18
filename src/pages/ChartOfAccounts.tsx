// ═══════════════════════════════════════════════════════════════
//  Chart of Accounts — شجرة الحسابات
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
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
import { BookOpen, Plus, Search, TreePine, Scale, ArrowDownUp, BarChart3 } from "lucide-react";

const typeLabels: Record<string, string> = {
  asset: "أصل", liability: "خصم", equity: "حقوق ملكية",
  revenue: "إيراد", expense: "مصروف", cost_of_sales: "تكلفة مبيعات",
};
const typeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-700", liability: "bg-red-100 text-red-700",
  equity: "bg-purple-100 text-purple-700", revenue: "bg-green-100 text-green-700",
  expense: "bg-orange-100 text-orange-700", cost_of_sales: "bg-yellow-100 text-yellow-700",
};

export default function ChartOfAccounts() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [activeTab, setActiveTab] = useState("chart");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fiscalYear] = useState("2025");
  const [form, setForm] = useState({ code: "", name: "", nameEn: "", type: "asset" as string, category: "current_asset" as string, parentId: "", openingBalance: "0", notes: "" });

  const utils = trpc.useUtils();
  const { data: accountsList, isLoading } = trpc.account.list.useQuery({ type: typeFilter !== "__all__" ? typeFilter : undefined, search: search || undefined });
  const { data: tb } = trpc.account.trialBalance.useQuery({ fiscalYear }, { enabled: activeTab === "trial" });
  const { data: incomeStmt } = trpc.account.incomeStatement.useQuery({ fiscalYear }, { enabled: activeTab === "income" });
  const { data: bs } = trpc.account.balanceSheet.useQuery({ fiscalYear }, { enabled: activeTab === "balance" });

  const create = trpc.account.create.useMutation({
    onSuccess: () => { toast({ title: "تم" }); utils.account.list.invalidate(); setIsAddOpen(false); },
  });

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">النظام المحاسبي</h1>
          <p className="text-muted-foreground">شجرة الحسابات — القوائم المالية</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> حساب جديد</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>إضافة حساب</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="الكود *" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
                <Input placeholder="الاسم بالإنجليزي" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} />
              </div>
              <Input placeholder="اسم الحساب *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="الرصيد الافتتاحي" value={form.openingBalance} onChange={e => setForm(p => ({ ...p, openingBalance: e.target.value }))} />
              <Input placeholder="ملاحظات" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              <Button className="w-full" onClick={() => {
                if (!form.code || !form.name) { toast({ title: "خطأ", description: "املأ الحقول المطلوبة", variant: "destructive" }); return; }
                create.mutate({ code: form.code, name: form.name, nameEn: form.nameEn || undefined, type: form.type as any, category: form.category as any, openingBalance: form.openingBalance, notes: form.notes || undefined });
              }} disabled={create.isPending}>{create.isPending ? "جاري..." : "حفظ"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="chart" className="gap-1"><TreePine className="h-4 w-4" /> شجرة الحسابات</TabsTrigger>
          <TabsTrigger value="trial" className="gap-1"><Scale className="h-4 w-4" /> ميزان المراجعة</TabsTrigger>
          <TabsTrigger value="income" className="gap-1"><ArrowDownUp className="h-4 w-4" /> قائمة الدخل</TabsTrigger>
          <TabsTrigger value="balance" className="gap-1"><BarChart3 className="h-4 w-4" /> الميزانية العمومية</TabsTrigger>
        </TabsList>

        {/* Chart of Accounts */}
        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative"><Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" /></div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
                  <SelectContent><SelectItem value="__all__">الكل</SelectItem>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> شجرة الحسابات</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>الكود</TableHead><TableHead>الاسم</TableHead><TableHead>النوع</TableHead><TableHead>الرصيد الافتتاحي</TableHead><TableHead>الرصيد الحالي</TableHead><TableHead>الحالة</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">جاري...</TableCell></TableRow>
                    : !accountsList?.length ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد حسابات</TableCell></TableRow>
                      : accountsList.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-sm font-bold">{a.code}</TableCell>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell><Badge className={typeColors[a.type] || "bg-gray-100"}>{typeLabels[a.type]}</Badge></TableCell>
                          <TableCell>{parseFloat(a.openingBalance?.toString() || "0").toLocaleString()}</TableCell>
                          <TableCell className="font-bold">{parseFloat(a.currentBalance?.toString() || "0").toLocaleString()}</TableCell>
                          <TableCell>{a.isActive ? <Badge className="bg-green-100 text-green-700">نشط</Badge> : <Badge variant="secondary">معطل</Badge>}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> ميزان المراجعة — السنة {fiscalYear}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>الحساب</TableHead><TableHead>مدين</TableHead><TableHead>دائن</TableHead><TableHead>الرصيد</TableHead></TableRow></TableHeader>
                <TableBody>
                  {!tb?.length ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                    : tb.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell><span className="font-mono text-xs mr-2">{row.code}</span>{row.name}</TableCell>
                        <TableCell className="text-right">{row.totalDebit?.toLocaleString?.() || "0"}</TableCell>
                        <TableCell className="text-right">{row.totalCredit?.toLocaleString?.() || "0"}</TableCell>
                        <TableCell className={`text-right font-bold ${row.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>{row.balance?.toLocaleString?.() || "0"}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ArrowDownUp className="h-5 w-5" /> قائمة الدخل</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!incomeStmt ? <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p> : (
                <>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg"><span className="font-medium">الإيرادات</span><span className="font-bold text-green-700">{incomeStmt.revenue?.toLocaleString()} ج.م</span></div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg"><span className="font-medium">تكلفة المبيعات</span><span className="font-bold text-red-700">{incomeStmt.costOfSales?.toLocaleString()} ج.م</span></div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"><span className="font-bold">إجمالي الربح</span><span className="font-bold text-blue-700">{incomeStmt.grossProfit?.toLocaleString()} ج.م</span></div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg"><span className="font-medium">المصروفات العامة</span><span className="font-bold text-orange-700">{incomeStmt.expenses?.toLocaleString()} ج.م</span></div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg"><span className="font-medium">إيرادات أخرى</span><span className="font-bold text-purple-700">{incomeStmt.otherIncome?.toLocaleString()} ج.م</span></div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg"><span className="font-medium">مصروفات أخرى</span><span className="font-bold text-red-700">{incomeStmt.otherExpense?.toLocaleString()} ج.م</span></div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                    <span className="text-lg font-bold">صافي الدخل</span>
                    <span className={`text-xl font-bold ${incomeStmt.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>{incomeStmt.netIncome?.toLocaleString()} ج.م</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> الميزانية العمومية</CardTitle></CardHeader>
            <CardContent>
              {!bs ? <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p> : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-blue-600 mb-3">الأصول</h3>
                    <div className="flex justify-between p-2 bg-blue-50 rounded"><span>الأصول المتداولة</span><span className="font-bold">{bs.currentAssets?.toLocaleString()} ج.م</span></div>
                    <div className="flex justify-between p-2"><span>الأصول الثابتة</span><span className="font-bold">{bs.fixedAssets?.toLocaleString()} ج.م</span></div>
                    <div className="h-px my-2" />
                    <div className="flex justify-between p-2 font-bold text-lg"><span>إجمالي الأصول</span><span className="text-blue-700">{bs.totalAssets?.toLocaleString()} ج.م</span></div>
                  </div>
                  <div className="h-px" />
                  <div>
                    <h3 className="text-lg font-bold text-red-600 mb-3">الخصوم وحقوق الملكية</h3>
                    <div className="flex justify-between p-2 bg-red-50 rounded"><span>الخصوم المتداولة</span><span className="font-bold">{bs.currentLiabilities?.toLocaleString()} ج.م</span></div>
                    <div className="flex justify-between p-2"><span>الخصوم طويلة الأجل</span><span className="font-bold">{bs.longTermLiabilities?.toLocaleString()} ج.م</span></div>
                    <div className="flex justify-between p-2 bg-purple-50 rounded"><span>حقوق الملكية</span><span className="font-bold">{bs.equity?.toLocaleString()} ج.م</span></div>
                    <div className="h-px my-2" />
                    <div className="flex justify-between p-2 font-bold text-lg"><span>إجمالي الخصوم + حقوق الملكية</span><span className="text-red-700">{bs.totalLiabilitiesAndEquity?.toLocaleString()} ج.م</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
