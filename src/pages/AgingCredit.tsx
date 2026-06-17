// ═══════════════════════════════════════════════════════════════
//  Aging & Credit — تقرير المديونيات + سقف الائتمان
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { AlertTriangle, CreditCard, ShieldAlert, Timer, UserCheck } from "lucide-react";

export default function AgingCredit() {
  const { toast } = useToast();
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const [checkCustomerId, setCheckCustomerId] = useState("");
  const [checkAmount, setCheckAmount] = useState("");
  const [isSetLimitOpen, setIsSetLimitOpen] = useState(false);
  const [limitForm, setLimitForm] = useState({ customerId: "", creditLimit: "", paymentTermDays: "30", warningPercent: "80" });

  const utils = trpc.useUtils();
  const { data: aging } = trpc.aging.calculate.useQuery({ asOfDate });
  const { data: creditLimits } = trpc.creditLimit.list.useQuery();
  const { data: customers } = trpc.crm.list.useQuery();

  const { data: creditCheck } = trpc.creditLimit.checkLimit.useQuery(
    { customerId: Number(checkCustomerId), requestedAmount: checkAmount },
    { enabled: !!checkCustomerId && !!checkAmount }
  );

  const createLimit = trpc.creditLimit.create.useMutation({
    onSuccess: () => { toast({ title: "تم" }); utils.creditLimit.list.invalidate(); setIsSetLimitOpen(false); },
  });

  const getBucketColor = (days: number) => {
    if (days <= 30) return "bg-green-100 text-green-700";
    if (days <= 60) return "bg-yellow-100 text-yellow-700";
    if (days <= 90) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المديونيات والائتمان</h1>
          <p className="text-muted-foreground">تقرير Aging + سقف الائتمان</p>
        </div>
        <Dialog open={isSetLimitOpen} onOpenChange={setIsSetLimitOpen}>
          <DialogTrigger asChild><Button>تحديد سقف</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>تحديد سقف ائتمان</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <select className="w-full border rounded-md px-3 py-2" value={limitForm.customerId} onChange={e => setLimitForm(p => ({ ...p, customerId: e.target.value }))}>
                <option value="">اختر العميل</option>
                {customers?.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
              </select>
              <Input type="number" placeholder="سقف الائتمان (ج.م) *" value={limitForm.creditLimit} onChange={e => setLimitForm(p => ({ ...p, creditLimit: e.target.value }))} />
              <Input type="number" placeholder="أيام السداد" value={limitForm.paymentTermDays} onChange={e => setLimitForm(p => ({ ...p, paymentTermDays: e.target.value }))} />
              <Input type="number" placeholder="نسبة التحذير %" value={limitForm.warningPercent} onChange={e => setLimitForm(p => ({ ...p, warningPercent: e.target.value }))} />
              <Button className="w-full" onClick={() => {
                if (!limitForm.customerId || !limitForm.creditLimit) { toast({ title: "خطأ", description: "املأ الحقول المطلوبة", variant: "destructive" }); return; }
                createLimit.mutate({ customerId: Number(limitForm.customerId), creditLimit: limitForm.creditLimit, paymentTermDays: Number(limitForm.paymentTermDays), warningPercent: limitForm.warningPercent });
              }} disabled={createLimit.isPending}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credit Check Tool */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> فحص الائتمان</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="border rounded-md px-3 py-2" value={checkCustomerId} onChange={e => setCheckCustomerId(e.target.value)}>
              <option value="">اختر العميل</option>
              {customers?.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
            </select>
            <Input type="number" placeholder="مبلغ الطلب (ج.م)" value={checkAmount} onChange={e => setCheckAmount(e.target.value)} />
            <div className="flex items-center gap-2">
              {creditCheck && (
                <Badge className={creditCheck.allowed ? (creditCheck.usage > 80 ? "bg-yellow-100 text-yellow-700 gap-1" : "bg-green-100 text-green-700") : "bg-red-100 text-red-700 gap-1"}>
                  {creditCheck.allowed ? <UserCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {creditCheck.message}
                  {creditCheck.usage !== undefined && ` (${creditCheck.usage.toFixed(1)}%)`}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Limits */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> سقوف الائتمان</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creditLimits?.map(cl => {
              const cust = customers?.find(c => c.id === cl.customerId);
              const limit = parseFloat(cl.creditLimit?.toString() || "0");
              const current = parseFloat(cl.currentBalance?.toString() || "0");
              const usage = limit > 0 ? (current / limit) * 100 : 0;
              return (
                <Card key={cl.id} className={usage > 80 ? "border-red-500 border-2" : ""}>
                  <CardContent className="pt-4">
                    <h3 className="font-bold">{cust?.name || `عميل #${cl.customerId}`}</h3>
                    <p className="text-sm text-muted-foreground">سقف: {limit.toLocaleString()} ج.م</p>
                    <p className="text-sm text-muted-foreground">الرصيد: {current.toLocaleString()} ج.م</p>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${usage > 90 ? "bg-red-500" : usage > 80 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(100, usage)}%` }} />
                    </div>
                    <p className={`text-sm mt-1 font-bold ${usage > 80 ? "text-red-600" : "text-green-600"}`}>{usage.toFixed(1)}% مستخدم</p>
                  </CardContent>
                </Card>
              );
            }) || <p className="text-muted-foreground col-span-3 text-center">لا توجد سقوف</p>}
          </div>
        </CardContent>
      </Card>

      {/* Aging Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" /> تقرير المديونيات حسب العمر (Aging)</CardTitle>
          <div className="flex gap-2 mt-2">
            <Input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="w-auto" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>الرصيد الإجمالي</TableHead>
                <TableHead>1-30 يوم</TableHead>
                <TableHead>31-60 يوم</TableHead>
                <TableHead>61-90 يوم</TableHead>
                <TableHead>+90 يوم</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aging?.summary?.length ? aging.summary.map((s: any) => {
                const hasOverdue = s.bucket90_plus > 0 || s.bucket61_90 > 0;
                return (
                  <TableRow key={s.customerId}>
                    <TableCell className="font-medium">{customers?.find(c => c.id === s.customerId)?.name || `عميل #${s.customerId}`}</TableCell>
                    <TableCell className="font-bold">{s.totalBalance?.toLocaleString()} ج.م</TableCell>
                    <TableCell className="text-green-600">{s.bucket1_30?.toLocaleString()}</TableCell>
                    <TableCell className="text-yellow-600">{s.bucket31_60?.toLocaleString()}</TableCell>
                    <TableCell className="text-orange-600">{s.bucket61_90?.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600 font-bold">{s.bucket90_plus?.toLocaleString()}</TableCell>
                    <TableCell>
                      {hasOverdue ? <Badge className="bg-red-100 text-red-700 gap-1"><AlertTriangle className="h-3 w-3" /> متأخر</Badge>
                        : <Badge className="bg-green-100 text-green-700">جيد</Badge>}
                    </TableCell>
                  </TableRow>
                );
              }) : <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      {aging?.details?.length ? (
        <Card>
          <CardHeader><CardTitle>تفاصيل الفواتير المستحقة</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>رقم الفاتورة</TableHead><TableHead>العميل</TableHead><TableHead>تاريخ الاستحقاق</TableHead><TableHead>المبلغ</TableHead><TableHead>المسدد</TableHead><TableHead>المتبقي</TableHead><TableHead>أيام التأخير</TableHead></TableRow></TableHeader>
              <TableBody>
                {aging.details.filter((d: any) => d.balance > 0).map((d: any) => (
                  <TableRow key={d.invoiceId}>
                    <TableCell className="font-mono text-xs">{d.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{customers?.find(c => c.id === d.customerId)?.name || "-"}</TableCell>
                    <TableCell>{d.dueDate?.toString() || "-"}</TableCell>
                    <TableCell>{d.amount?.toLocaleString()} ج.م</TableCell>
                    <TableCell className="text-green-600">{d.amountPaid?.toLocaleString()}</TableCell>
                    <TableCell className="font-bold">{d.balance?.toLocaleString()} ج.م</TableCell>
                    <TableCell><Badge className={getBucketColor(d.daysOverdue)}>{d.daysOverdue} يوم</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
