// ═══════════════════════════════════════════════════════════════
//  Opening Balances — الأرصدة الافتتاحية
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { BookOpen, Lock, Plus, Unlock } from "lucide-react";

export default function OpeningBalancesPage() {
  const { toast } = useToast();
  const [fiscalYear, setFiscalYear] = useState("2025");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ accountId: "", debit: "0", credit: "0", reference: "", notes: "" });

  const utils = trpc.useUtils();
  const { data: balances } = trpc.openingBalance.list.useQuery({ fiscalYear });
  const { data: accountsList } = trpc.account.list.useQuery();

  const create = trpc.openingBalance.create.useMutation({
    onSuccess: () => { toast({ title: "تم" }); utils.openingBalance.list.invalidate(); setIsAddOpen(false); setForm({ accountId: "", debit: "0", credit: "0", reference: "", notes: "" }); },
  });
  const post = trpc.openingBalance.post.useMutation({
    onSuccess: () => { toast({ title: "تم الترحيل" }); utils.openingBalance.list.invalidate(); },
  });

  const totalDebit = balances?.reduce((s, b) => s + parseFloat(b.debit?.toString() || "0"), 0) ?? 0;
  const totalCredit = balances?.reduce((s, b) => s + parseFloat(b.credit?.toString() || "0"), 0) ?? 0;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الأرصدة الافتتاحية</h1>
          <p className="text-muted-foreground">بداية السنة المالية {fiscalYear}</p>
        </div>
        <div className="flex gap-2">
          {isAddOpen ? null : <Button className="gap-1" onClick={() => setIsAddOpen(true)}><Plus className="h-4 w-4" /> إضافة رصيد</Button>}
        </div>
      </div>

      {/* Status Card */}
      <Card className={isBalanced ? "border-2 border-green-500 bg-green-50" : "border-2 border-red-500 bg-red-50"}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isBalanced ? <Lock className="h-6 w-6 text-green-600" /> : <Unlock className="h-6 w-6 text-red-600" />}
              <div>
                <p className={`font-bold ${isBalanced ? "text-green-700" : "text-red-700"}`}>{isBalanced ? "الأرصدة متوازنة" : "الأرصدة غير متوازنة!"}</p>
                <p className="text-sm text-muted-foreground">إجمالي المدين: {totalDebit.toLocaleString()} | إجمالي الدائن: {totalCredit.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">الفرق</p>
              <p className={`text-xl font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>{Math.abs(totalDebit - totalCredit).toLocaleString()} ج.م</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Form */}
      {isAddOpen && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> إضافة رصيد جديد</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select className="border rounded-md px-3 py-2" value={form.accountId} onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}>
                <option value="">اختر الحساب</option>
                {accountsList?.map(a => <option key={a.id} value={a.id.toString()}>{a.code} — {a.name}</option>)}
              </select>
              <Input type="number" placeholder="مدين" value={form.debit} onChange={e => setForm(p => ({ ...p, debit: e.target.value }))} />
              <Input type="number" placeholder="دائن" value={form.credit} onChange={e => setForm(p => ({ ...p, credit: e.target.value }))} />
              <Input placeholder="الإشارة" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  if (!form.accountId) { toast({ title: "خطأ", description: "اختر الحساب", variant: "destructive" }); return; }
                  create.mutate({ fiscalYear, accountId: Number(form.accountId), debit: form.debit, credit: form.credit, reference: form.reference || undefined, notes: form.notes || undefined });
                }} disabled={create.isPending}>حفظ</Button>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>إلغاء</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balances Table */}
      <Card>
        <CardHeader><CardTitle>الأرصدة الافتتاحية — {fiscalYear}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>الحساب</TableHead><TableHead>مدين</TableHead><TableHead>دائن</TableHead><TableHead>الرصيد</TableHead><TableHead>الإشارة</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
            <TableBody>
              {balances?.length ? balances.map(b => {
                const acc = accountsList?.find(a => a.id === b.accountId);
                return (
                  <TableRow key={b.id}>
                    <TableCell><span className="font-mono text-xs mr-1">{acc?.code}</span>{acc?.name || "غير معروف"}</TableCell>
                    <TableCell className="text-right">{parseFloat(b.debit?.toString() || "0").toLocaleString()}</TableCell>
                    <TableCell className="text-right">{parseFloat(b.credit?.toString() || "0").toLocaleString()}</TableCell>
                    <TableCell className="font-bold">{parseFloat(b.balance?.toString() || "0").toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{b.reference || "-"}</TableCell>
                    <TableCell>{b.posted ? <Badge className="bg-green-100 text-green-700 gap-1"><Lock className="h-3 w-3" /> مرحل</Badge> : <Badge variant="outline">مسودة</Badge>}</TableCell>
                    <TableCell>{!b.posted && <Button size="sm" variant="outline" onClick={() => post.mutate({ id: b.id, postedBy: 1 })}>ترحيل</Button>}</TableCell>
                  </TableRow>
                );
              }) : <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">لا توجد أرصدة</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
