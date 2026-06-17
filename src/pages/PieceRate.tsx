import { useState, useMemo } from "react";
import { useEmployees, usePieceRateRecords, useProductionModels, useBonusPenalties, useAdvances } from "@/hooks/useLocalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/export";
import { Calculator, Download, Printer, UserCheck, Package, Coins, Plus, Trash2, Layers } from "lucide-react";

export default function PieceRatePage() {
  const [selectedMonth, setSelectedMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; });
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");

  const { data: employees } = useEmployees();
  const { data: pieceRecords, create, remove } = usePieceRateRecords();
  const { data: models } = useProductionModels();
  const { data: bonuses } = useBonusPenalties();
  const { data: advances } = useAdvances();

  // Dialog state
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    modelId: "",
    stageId: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "1",
  });

  const activeWorkers = employees.filter((e) => e.status === "active");

  // Filter records
  const filteredRecords = useMemo(() => {
    return pieceRecords.filter((r) => {
      const matchMonth = r.date.startsWith(selectedMonth);
      const matchEmp = selectedEmployee === "all" || String(r.employeeId) === selectedEmployee;
      const matchModel = selectedModel === "all" || String(r.modelId) === selectedModel;
      return matchMonth && matchEmp && matchModel;
    });
  }, [pieceRecords, selectedMonth, selectedEmployee, selectedModel]);

  // Per-worker summary
  const workerPayroll = useMemo(() => {
    return activeWorkers.map((emp) => {
      const empRecords = filteredRecords.filter((r) => r.employeeId === emp.id);
      const piecePay = empRecords.reduce((sum, r) => sum + Number(r.total), 0);
      const totalPieces = empRecords.reduce((sum, r) => sum + r.quantity, 0);
      const basicPay = Number(emp.salary || 0);
      const empBonuses = bonuses.filter((b) => b.employeeId === emp.id && b.type === "bonus" && b.date.startsWith(selectedMonth)).reduce((sum, b) => sum + Number(b.amount), 0);
      const empPenalties = bonuses.filter((b) => b.employeeId === emp.id && b.type === "penalty" && b.date.startsWith(selectedMonth)).reduce((sum, b) => sum + Number(b.amount), 0);
      const empAdvDeduction = advances.filter((a) => a.employeeId === emp.id && a.status === "approved" && a.monthlyDeduction).reduce((sum, a) => sum + Number(a.monthlyDeduction), 0);
      const totalPay = basicPay + piecePay + empBonuses - empPenalties - empAdvDeduction;

      return {
        ...emp,
        pieces: totalPieces,
        piecePay,
        basicPay,
        bonuses: empBonuses,
        penalties: empPenalties,
        advances: empAdvDeduction,
        totalPay,
        records: empRecords,
      };
    }).filter((w) => w.pieces > 0 || w.basicPay > 0);
  }, [activeWorkers, filteredRecords, bonuses, advances, selectedMonth]);

  const grandTotal = workerPayroll.reduce((sum, w) => sum + w.totalPay, 0);
  const totalPieces = workerPayroll.reduce((sum, w) => sum + w.pieces, 0);
  const totalPiecePay = workerPayroll.reduce((sum, w) => sum + w.piecePay, 0);

  // Selected model stages
  const selectedModelData = models.find((m) => String(m.id) === form.modelId);
  const stages = selectedModelData?.stages || [];

  const handleAddRecord = () => {
    const emp = employees.find((e) => String(e.id) === form.employeeId);
    const model = models.find((m) => String(m.id) === form.modelId);
    const stage = model?.stages.find((s) => String(s.id) === form.stageId);
    if (!emp || !model || !stage) return;

    create({
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      date: form.date,
      modelId: model.id,
      modelName: model.name,
      stageId: stage.id,
      stageName: stage.name,
      quantity: Number(form.quantity),
      unitPrice: stage.unitPrice,
    });
    setAddDialog(false);
    setForm({ employeeId: "", modelId: "", stageId: "", date: new Date().toISOString().split("T")[0], quantity: "1" });
  };

  const handleExport = () => {
    exportToCSV(
      `piece_rate_${selectedMonth}`,
      ["التاريخ", "كود العامل", "الاسم", "الموديل", "المرحلة", "سعر القطعة", "الكمية", "الإجمالي"],
      filteredRecords.map((r) => [r.date, r.employeeCode, r.employeeName, r.modelName, r.stageName, r.unitPrice, String(r.quantity), r.total])
    );
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Print header */}
      <div className="print-only hidden text-center mb-8">
        <h1 className="text-2xl font-bold text-black">مصنع Horizon للملابس الجاهزة</h1>
        <p className="text-lg text-black mt-2">كشف أجور بالقطعة - {selectedMonth}</p>
        <p className="text-sm text-gray-600 mt-1">تاريخ الطباعة: {new Date().toLocaleDateString("ar-EG")}</p>
        <hr className="my-4 border-gray-300" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>الأجر بالقطعة</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>حساب رواتب العمال بناءً على الموديل والمرحلة الإنتاجية</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setForm({ ...form, date: new Date().toISOString().split("T")[0] }); setAddDialog(true); }}>
            <Plus size={16} className="ml-1" /> إضافة إنتاج
          </Button>
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={handleExport}><Download size={16} className="ml-1" /> تصدير</Button>
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={handlePrint}><Printer size={16} className="ml-1" /> طباعة</Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 no-print flex-wrap">
        <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-48" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-56 text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="كل العمال" /></SelectTrigger>
          <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <SelectItem value="all" className="text-right">كل العمال</SelectItem>
            {activeWorkers.map((e) => <SelectItem key={e.id} value={String(e.id)} className="text-right">{e.fullName} ({e.employeeCode})</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-56 text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="كل الموديلات" /></SelectTrigger>
          <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <SelectItem value="all" className="text-right">كل الموديلات</SelectItem>
            {models.map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي العمال", value: workerPayroll.length, icon: UserCheck, color: "var(--text-primary)" },
          { label: "إجمالي القطع", value: totalPieces.toLocaleString(), icon: Package, color: "#60A5FA" },
          { label: "أجر القطع", value: `${totalPiecePay.toLocaleString()} ج`, icon: Calculator, color: "#A78BFA" },
          { label: "إجمالي الرواتب", value: `${grandTotal.toLocaleString()} ج`, icon: Coins, color: "#34D399" },
        ].map((item) => (
          <Card key={item.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <item.icon size={18} style={{ color: item.color }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              </div>
              <p className="text-2xl font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Layers size={16} /> سجلات الإنتاج بالقطعة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>التاريخ</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>العامل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الموديل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المرحلة</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>سعر القطعة</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الكمية</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الإجمالي</TableHead>
                  <TableHead className="text-left no-print" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                      <Calculator size={32} className="mx-auto mb-3 opacity-50" />
                      <p>لا توجد سجلات أجر قطعة للفترة المحددة</p>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.map((r) => (
                  <TableRow key={r.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.date}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.employeeName}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.employeeCode}</p>
                    </TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-primary)" }}>{r.modelName}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-color)" + "20", color: "var(--accent-color)" }}>{r.stageName}</span>
                    </TableCell>
                    <TableCell className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{parseFloat(r.unitPrice).toFixed(2)} ج</TableCell>
                    <TableCell className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{r.quantity}</TableCell>
                    <TableCell className="text-sm font-bold text-green-400">{Number(r.total).toLocaleString()} ج</TableCell>
                    <TableCell className="text-left no-print">
                      <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف السجل؟")) remove(r.id); }}>
                        <Trash2 size={14} className="text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Summary Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Coins size={16} /> ملخص الرواتب
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>كود</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الاسم</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>القطع</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>أجر القطع</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>أساسي</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>مكافآت</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>خصومات</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>سلف</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الصافي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerPayroll.map((w) => (
                  <TableRow key={w.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{w.employeeCode}</TableCell>
                    <TableCell className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{w.fullName}</TableCell>
                    <TableCell className="text-sm" style={{ color: "#60A5FA" }}>{w.pieces}</TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{w.piecePay.toLocaleString()} ج</TableCell>
                    <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{w.basicPay.toLocaleString()} ج</TableCell>
                    <TableCell className="text-sm text-green-400">+{w.bonuses.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-red-400">-{w.penalties.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-yellow-400">-{w.advances.toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-bold text-green-400">{w.totalPay.toLocaleString()} ج</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Print footer */}
          <div className="print-only hidden p-4 border-t border-gray-300">
            <div className="flex justify-between text-sm text-black">
              <span>إجمالي القطع: {totalPieces.toLocaleString()}</span>
              <span className="font-bold">إجمالي الرواتب: {grandTotal.toLocaleString()} ج</span>
            </div>
            <div className="mt-8 flex justify-between text-sm text-black">
              <div className="text-center"><p className="mb-8">توقيع المحاسب</p><p>_______________</p></div>
              <div className="text-center"><p className="mb-8">توقيع مدير المصنع</p><p>_______________</p></div>
            </div>
          </div>

          {/* Digital total */}
          <div className="no-print p-4 border-t flex justify-between items-center" style={{ borderColor: "var(--border-color)" }}>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{workerPayroll.length} عامل</span>
            <span className="text-lg font-bold text-green-400">الإجمالي: {grandTotal.toLocaleString()} ج</span>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-md" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle className="text-right" style={{ color: "var(--text-primary)" }}>إضافة إنتاج بالقطعة</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4 text-right">
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>العامل</Label>
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر العامل" /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  {activeWorkers.map((e) => <SelectItem key={e.id} value={String(e.id)} className="text-right">{e.fullName} ({e.employeeCode})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>الموديل</Label>
              <Select value={form.modelId} onValueChange={(v) => setForm({ ...form, modelId: v, stageId: "" })}>
                <SelectTrigger className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر الموديل" /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  {models.filter((m) => m.status === "active").map((m) => <SelectItem key={m.id} value={String(m.id)} className="text-right">{m.name} ({m.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {stages.length > 0 && (
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>المرحلة</Label>
                <Select value={form.stageId} onValueChange={(v) => setForm({ ...form, stageId: v })}>
                  <SelectTrigger className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    {stages.map((s) => <SelectItem key={s.id} value={String(s.id)} className="text-right">{s.name} ({parseFloat(s.unitPrice).toFixed(2)} ج/قطعة)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>التاريخ</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>الكمية (قطعة)</Label>
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleAddRecord} disabled={!form.employeeId || !form.modelId || !form.stageId} className="text-white" style={{ background: "var(--accent-color)" }}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
