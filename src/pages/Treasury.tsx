// ═══════════════════════════════════════════════════════════════
//  Treasury — الخزينة (صناديق + بنوك)
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
import { Wallet, Landmark, ArrowDownLeft, ArrowUpRight, Plus, TrendingUp, Clock } from "lucide-react";

const typeLabels: Record<string, string> = { cash: "صندوق نقد", bank: "حساب بنكي", check: "شيكات", other: "أخرى" };
const typeIcons: Record<string, typeof Wallet> = { cash: Wallet, bank: Landmark, check: Clock, other: TrendingUp };

export default function Treasury() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("accounts");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTrxOpen, setIsTrxOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("__all__");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [accForm, setAccForm] = useState({ name: "", code: "", type: "cash" as string, bankName: "", accountNumber: "", currency: "EGP", openingBalance: "0" });
  const [trxForm, setTrxForm] = useState({ treasuryAccountId: "", type: "receipt" as string, amount: "", date: "", partyName: "", description: "", documentNumber: "" });

  const utils = trpc.useUtils();
  const { data: accountsList } = trpc.treasury.listAccounts.useQuery();
  const { data: transactions } = trpc.treasury.listTransactions.useQuery(
    { treasuryAccountId: selectedAccount !== "__all__" ? Number(selectedAccount) : undefined, fromDate: fromDate || undefined, toDate: toDate || undefined },
    { enabled: activeTab === "transactions" }
  );
  const { data: cashFlow } = trpc.treasury.cashFlow.useQuery(
    { fromDate: fromDate || "2025-01-01", toDate: toDate || "2025-12-31" },
    { enabled: activeTab === "cashflow" }
  );

  const createAccount = trpc.treasury.createAccount.useMutation({
    onSuccess: () => { toast({ title: "تم" }); utils.treasury.listAccounts.invalidate(); setIsAddOpen(false); },
  });
  const createTrx = trpc.treasury.createTransaction.useMutation({
    onSuccess: () => { toast({ title: "تم" }); utils.treasury.listTransactions.invalidate(); utils.treasury.listAccounts.invalidate(); setIsTrxOpen(false); },
  });

  const totalBalance = accountsList?.reduce((s, a) => s + parseFloat(a.currentBalance?.toString() || "0"), 0) ?? 0;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الخزينة</h1>
          <p className="text-muted-foreground">إدارة النقدية والبنوك</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isTrxOpen} onOpenChange={setIsTrxOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-1"><ArrowDownLeft className="h-4 w-4" /> حركة</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>حركة خزينة جديدة</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={trxForm.treasuryAccountId} onValueChange={v => setTrxForm(p => ({ ...p, treasuryAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="الحساب" /></SelectTrigger>
                  <SelectContent>{accountsList?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name} ({parseFloat(a.currentBalance?.toString() || "0").toLocaleString()})</SelectItem>)}</SelectContent>
                </Select>
                <Select value={trxForm.type} onValueChange={v => setTrxForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
                  <SelectContent><SelectItem value="receipt">مقبوضات</SelectItem><SelectItem value="payment">مدفوعات</SelectItem></SelectContent>
                </Select>
                <Input type="number" placeholder="المبلغ *" value={trxForm.amount} onChange={e => setTrxForm(p => ({ ...p, amount: e.target.value }))} />
                <Input type="date" value={trxForm.date} onChange={e => setTrxForm(p => ({ ...p, date: e.target.value }))} />
                <Input placeholder="من/إلى" value={trxForm.partyName} onChange={e => setTrxForm(p => ({ ...p, partyName: e.target.value }))} />
                <Input placeholder="وصف" value={trxForm.description} onChange={e => setTrxForm(p => ({ ...p, description: e.target.value }))} />
                <Input placeholder="رقم المستند" value={trxForm.documentNumber} onChange={e => setTrxForm(p => ({ ...p, documentNumber: e.target.value }))} />
                <Button className="w-full" onClick={() => {
                  if (!trxForm.treasuryAccountId || !trxForm.amount || !trxForm.date) { toast({ title: "خطأ", description: "املأ الحقول المطلوبة", variant: "destructive" }); return; }
                  createTrx.mutate({ ...trxForm, type: trxForm.type as any, treasuryAccountId: Number(trxForm.treasuryAccountId), amount: trxForm.amount, date: trxForm.date, partyName: trxForm.partyName || undefined, description: trxForm.description || undefined, documentNumber: trxForm.documentNumber || undefined });
                }} disabled={createTrx.isPending}>{createTrx.isPending ? "جاري..." : "حفظ"}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild><Button className="gap-1"><Plus className="h-4 w-4" /> حساب</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>حساب خزينة جديد</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="الاسم *" value={accForm.name} onChange={e => setAccForm(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder="الكود *" value={accForm.code} onChange={e => setAccForm(p => ({ ...p, code: e.target.value }))} />
                <Select value={accForm.type} onValueChange={v => setAccForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                {accForm.type === "bank" && <><Input placeholder="اسم البنك" value={accForm.bankName} onChange={e => setAccForm(p => ({ ...p, bankName: e.target.value }))} /><Input placeholder="رقم الحساب" value={accForm.accountNumber} onChange={e => setAccForm(p => ({ ...p, accountNumber: e.target.value }))} /></>}
                <Input type="number" placeholder="الرصيد الافتتاحي" value={accForm.openingBalance} onChange={e => setAccForm(p => ({ ...p, openingBalance: e.target.value }))} />
                <Button className="w-full" onClick={() => {
                  if (!accForm.name || !accForm.code) { toast({ title: "خطأ", description: "املأ الحقول المطلوبة", variant: "destructive" }); return; }
                  createAccount.mutate({ name: accForm.name, code: accForm.code, type: accForm.type as any, bankName: accForm.bankName || undefined, accountNumber: accForm.accountNumber || undefined, openingBalance: accForm.openingBalance });
                }} disabled={createAccount.isPending}>{createAccount.isPending ? "جاري..." : "حفظ"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">الرصيد الإجمالي</p><p className="text-2xl font-bold">{totalBalance.toLocaleString()} ج.م</p></div><div className="p-3 bg-green-50 rounded-full"><Wallet className="h-6 w-6 text-green-500" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">عدد الحسابات</p><p className="text-2xl font-bold">{accountsList?.length ?? 0}</p></div><div className="p-3 bg-blue-50 rounded-full"><Landmark className="h-6 w-6 text-blue-500" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">المقبوضات</p><p className="text-2xl font-bold text-green-600">{parseFloat(cashFlow?.receipts?.total?.toString() || "0").toLocaleString()}</p></div><div className="p-3 bg-green-50 rounded-full"><ArrowDownLeft className="h-6 w-6 text-green-500" /></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">المدفوعات</p><p className="text-2xl font-bold text-red-600">{parseFloat(cashFlow?.payments?.total?.toString() || "0").toLocaleString()}</p></div><div className="p-3 bg-red-50 rounded-full"><ArrowUpRight className="h-6 w-6 text-red-500" /></div></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="accounts" className="gap-1"><Wallet className="h-4 w-4" /> الحسابات</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1"><ArrowDownLeft className="h-4 w-4" /> الحركات</TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-1"><TrendingUp className="h-4 w-4" /> التدفق النقدي</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accountsList?.map(a => {
              const Icon = typeIcons[a.type] || Wallet;
              const balance = parseFloat(a.currentBalance?.toString() || "0");
              return (
                <Card key={a.id} className={a.isDefault ? "border-2 border-primary" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><Icon className="h-5 w-5 text-primary" /></div>
                      <div><h3 className="font-bold">{a.name}</h3><p className="text-xs text-muted-foreground">{typeLabels[a.type]}</p></div>
                    </div>
                    <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>{balance.toLocaleString()} ج.م</p>
                    {a.bankName && <p className="text-xs text-muted-foreground mt-1">{a.bankName} — {a.accountNumber}</p>}
                  </CardContent>
                </Card>
              );
            }) || <p className="text-muted-foreground col-span-3 text-center">لا توجد حسابات</p>}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card><CardContent className="pt-4"><div className="grid grid-cols-3 gap-3">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}><SelectTrigger><SelectValue placeholder="الحساب" /></SelectTrigger><SelectContent><SelectItem value="__all__">الكل</SelectItem>{accountsList?.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent></Select>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="من" /><Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} placeholder="إلى" />
          </div></CardContent></Card>
          <Card><CardHeader><CardTitle>سجل الحركات</CardTitle></CardHeader><CardContent>
            <Table><TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>النوع</TableHead><TableHead>المبلغ</TableHead><TableHead>من/إلى</TableHead><TableHead>المستند</TableHead><TableHead>الوصف</TableHead></TableRow></TableHeader>
            <TableBody>{transactions?.map(t => (
              <TableRow key={t.id}><TableCell>{t.date?.toString()}</TableCell><TableCell><Badge className={t.type === "receipt" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{t.type === "receipt" ? "مقبوضات" : "مدفوعات"}</Badge></TableCell>
                <TableCell className={`font-bold ${t.type === "receipt" ? "text-green-600" : "text-red-600"}`}>{parseFloat(t.amount?.toString() || "0").toLocaleString()}</TableCell><TableCell>{t.partyName || "-"}</TableCell><TableCell className="font-mono text-xs">{t.documentNumber || "-"}</TableCell><TableCell className="text-sm">{t.description || "-"}</TableCell>
              </TableRow>
            )) || <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">لا توجد حركات</TableCell></TableRow>}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card><CardHeader><CardTitle>ملخص التدفق النقدي</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="flex justify-between p-3 bg-green-50 rounded-lg"><span>إجمالي المقبوضات</span><span className="font-bold text-green-700">{parseFloat(cashFlow?.receipts?.total?.toString() || "0").toLocaleString()} ج.م</span></div>
            <div className="flex justify-between p-3 bg-red-50 rounded-lg"><span>إجمالي المدفوعات</span><span className="font-bold text-red-700">{parseFloat(cashFlow?.payments?.total?.toString() || "0").toLocaleString()} ج.م</span></div>
            <div className="h-px" />
            <div className={`flex justify-between p-4 rounded-lg border-2 ${(cashFlow?.netFlow ?? 0) >= 0 ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500"}`}>
              <span className="font-bold text-lg">صافي التدفق</span><span className={`text-xl font-bold ${(cashFlow?.netFlow ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>{(cashFlow?.netFlow ?? 0).toLocaleString()} ج.م</span>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
