import { useState, useMemo } from "react";
import { usePayroll, useProductionOrders, useDailyProduction, useInventory, useBonusPenalties, useAdvances } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportToCSV } from "@/lib/export";
import { TrendingUp, TrendingDown, Package, Users, Coins, Printer, Download, PiggyBank, Receipt } from "lucide-react";

export default function FinancialReport() {
  const [selectedMonth, setSelectedMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; });

  const { data: payroll } = usePayroll();
  const { data: orders } = useProductionOrders();
  const { data: dailyProd } = useDailyProduction();
  const { data: inventory } = useInventory();
  const { data: bonuses } = useBonusPenalties();
  const { data: advances } = useAdvances();

  const report = useMemo(() => {
    const monthPayroll = payroll.filter((p) => p.month === selectedMonth);
    const totalSalaries = monthPayroll.reduce((sum, p) => sum + Number(p.netPay), 0);

    const monthBonuses = bonuses.filter((b) => b.date.startsWith(selectedMonth));
    const totalBonusPaid = monthBonuses.filter((b) => b.type === "bonus").reduce((sum, b) => sum + Number(b.amount), 0);
    const totalPenaltyDeducted = monthBonuses.filter((b) => b.type === "penalty").reduce((sum, b) => sum + Number(b.amount), 0);

    const monthAdvances = advances.filter((a) => a.date.startsWith(selectedMonth) && a.status === "approved");
    const totalAdvancesPaid = monthAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

    // Inventory value
    const inventoryValue = inventory.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);

    // Production revenue (estimated: $10 per garment)
    const monthProduction = dailyProd.filter((d) => d.date.startsWith(selectedMonth));
    const totalProduced = monthProduction.reduce((sum, d) => sum + d.produced, 0);
    const estimatedRevenue = totalProduced * 150; // 150 EGP per garment average

    // Completed orders
    const completedOrders = orders.filter((o) => o.status === "completed");
    const orderRevenue = completedOrders.reduce((sum, o) => sum + o.quantity * 120, 0);

    const totalExpenses = totalSalaries + totalBonusPaid + totalAdvancesPaid;
    const netProfit = estimatedRevenue - totalExpenses;

    return {
      totalSalaries,
      totalBonusPaid,
      totalPenaltyDeducted,
      totalAdvancesPaid,
      inventoryValue,
      totalProduced,
      estimatedRevenue,
      orderRevenue,
      totalExpenses,
      netProfit,
      workerCount: monthPayroll.length,
    };
  }, [payroll, bonuses, advances, inventory, dailyProd, orders, selectedMonth]);

  const handleExport = () => {
    exportToCSV(
      `financial_report_${selectedMonth}`,
      ["البند", "المبلغ (جنه)"],
      [
        ["الإيرادات التقديرية", String(report.estimatedRevenue)],
        ["إجمالي الرواتب", String(report.totalSalaries)],
        ["المكافآت", String(report.totalBonusPaid)],
        ["السلف", String(report.totalAdvancesPaid)],
        ["إجمالي المصروفات", String(report.totalExpenses)],
        ["صافي الربح", String(report.netProfit)],
        ["قيمة المخزون", String(report.inventoryValue)],
      ]
    );
  };

  const isProfit = report.netProfit >= 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Print Header */}
      <div className="print-only hidden text-center mb-4">
        <h1 className="text-2xl font-bold text-black">مصنع Horizon للملابس الجاهزة</h1>
        <p className="text-lg text-black">التقرير المالي - {selectedMonth}</p>
        <hr className="my-3 border-gray-300" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>التقرير المالي</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>أرباح وخسائر وتحليلات مالية</p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={handleExport}><Download size={16} className="ml-1.5" /> تصدير</Button>
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => window.print()}><Printer size={16} className="ml-1.5" /> طباعة</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إيرادات تقديرية", value: `${report.estimatedRevenue.toLocaleString()} ج`, icon: Receipt, color: "text-green-400" },
          { label: "إجمالي المصروفات", value: `${report.totalExpenses.toLocaleString()} ج`, icon: Receipt, color: "text-red-400" },
          { label: isProfit ? "صافي الربح" : "صافي الخسارة", value: `${Math.abs(report.netProfit).toLocaleString()} ج`, icon: isProfit ? TrendingUp : TrendingDown, color: isProfit ? "text-green-400" : "text-red-400" },
          { label: "عدد العمال", value: report.workerCount, icon: Users, color: "text-blue-400" },
        ].map((item) => (
          <Card key={item.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <item.icon size={18} className={item.color} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              </div>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Income Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2"><TrendingUp size={16} /> الإيرادات</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-white/70">إنتاج الشهر</span><span style={{ color: "var(--text-primary)" }}>{report.totalProduced.toLocaleString()} قطعة</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/70">الإيراد التقديري</span><span className="text-green-400 font-semibold">{report.estimatedRevenue.toLocaleString()} ج</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/70">أوامر مكتملة</span><span style={{ color: "var(--text-primary)" }}>{report.orderRevenue.toLocaleString()} ج</span></div>
              <div className="pt-3 border-t border-white/[0.08] flex justify-between text-sm font-semibold"><span style={{ color: "var(--text-primary)" }}>الإجمالي</span><span className="text-green-400">{report.estimatedRevenue.toLocaleString()} ج</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2"><TrendingDown size={16} /> المصروفات</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-white/70">رواتب العمال</span><span className="text-red-400">{report.totalSalaries.toLocaleString()} ج</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/70">مكافآت</span><span className="text-red-400">{report.totalBonusPaid.toLocaleString()} ج</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/70">سلف</span><span className="text-red-400">{report.totalAdvancesPaid.toLocaleString()} ج</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/70">خصومات</span><span className="text-green-400">-{report.totalPenaltyDeducted.toLocaleString()} ج</span></div>
              <div className="pt-3 border-t border-white/[0.08] flex justify-between text-sm font-semibold"><span style={{ color: "var(--text-primary)" }}>الإجمالي</span><span className="text-red-400">{report.totalExpenses.toLocaleString()} ج</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets & Net */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 text-right">
            <div className="flex items-center gap-2 mb-3"><PiggyBank size={16} className="text-yellow-400" /><span className="text-sm font-semibold text-white">صافي الربح/الخسارة</span></div>
            <p className={`text-3xl font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>{report.netProfit.toLocaleString()} ج</p>
            <p className="text-xs text-white/40 mt-1">{isProfit ? "ربح" : "خسارة"} لهذا الشهر</p>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 text-right">
            <div className="flex items-center gap-2 mb-3"><Package size={16} className="text-purple-400" /><span className="text-sm font-semibold text-white">قيمة المخزون</span></div>
            <p className="text-2xl font-bold text-purple-400">{report.inventoryValue.toLocaleString()} ج</p>
            <p className="text-xs text-white/40 mt-1">{inventory.length} صنف في المخزن</p>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 text-right">
            <div className="flex items-center gap-2 mb-3"><Coins size={16} className="text-blue-400" /><span className="text-sm font-semibold text-white">تكلفة القطعة</span></div>
            <p className="text-2xl font-bold text-blue-400">{report.totalProduced > 0 ? Math.round(report.totalExpenses / report.totalProduced) : 0} ج</p>
            <p className="text-xs text-white/40 mt-1">متوسط تكلفة إنتاج القطعة الواحدة</p>
          </CardContent>
        </Card>
      </div>

      {/* Print footer */}
      <div className="print-only hidden mt-8">
        <hr className="border-gray-300 mb-4" />
        <div className="flex justify-between text-sm text-black">
          <div className="text-center"><p className="mb-8">توقيع المحاسب</p><p>_______________</p></div>
          <div className="text-center"><p className="mb-8">توقيع مدير المصنع</p><p>_______________</p></div>
        </div>
      </div>
    </div>
  );
}
