import { useState, useMemo } from "react";
import { usePayroll } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/export";
import { CreditCard, Download, FileText, ChevronLeft, ChevronRight, DollarSign, Eye, Printer } from "lucide-react";

const statusStyles: Record<string, string> = { processed: "badge-approved", pending: "badge-pending", on_hold: "badge-inactive" };
const statusLabels: Record<string, string> = { processed: "تمت المعالجة", pending: "معلقة", on_hold: "معلقة مؤقتاً" };

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; });
  const [page, setPage] = useState(1);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<number | null>(null);

  const { data: payrollRecords, process: processPayroll } = usePayroll();

  const pageSize = 20;

  // Filter by month
  const monthRecords = useMemo(() => {
    return payrollRecords.filter((p) => p.month === selectedMonth);
  }, [payrollRecords, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(monthRecords.length / pageSize));
  const paginatedRecords = monthRecords.slice((page - 1) * pageSize, page * pageSize);

  const selectedPayrollData = monthRecords.find((p) => p.id === selectedPayroll);

  const totalNetPay = monthRecords.reduce((sum, p) => sum + Number(p.netPay), 0);
  const totalBasic = monthRecords.reduce((sum, p) => sum + Number(p.basicSalary), 0);
  const totalBonus = monthRecords.reduce((sum, p) => sum + Number(p.bonus), 0);
  const totalDeductions = monthRecords.reduce((sum, p) => sum + Number(p.deductions), 0);

  const handleProcessPayroll = async () => {
    await processPayroll(selectedMonth);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>الرواتب</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة رواتب الموظفين والمدفوعات</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <Input type="month" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }} className="w-40" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
          <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={handleProcessPayroll}>
            <DollarSign size={16} className="ml-1.5" />
            تشغيل الرواتب
          </Button>
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => { exportToCSV(`payroll_${selectedMonth}`, ["كود", "الاسم", "الأساسي", "بونص", "استقطاعات", "صافي", "حالة"], monthRecords.map((p) => [p.employeeCode, p.employeeName, p.basicSalary, p.bonus, p.deductions, p.netPay, p.status])); }}>
            <Download size={16} className="ml-1.5" /> تصدير
          </Button>
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => window.print()}>
            <Printer size={16} className="ml-1.5" /> طباعة
          </Button>
        </div>
      </div>

      {/* Print header */}
      <div className="print-only hidden text-center mb-4">
        <h1 className="text-2xl font-bold text-black">مصنع Horizon للملابس الجاهزة</h1>
        <p className="text-lg text-black">كشف رواتب - {selectedMonth}</p>
        <hr className="my-3 border-gray-300" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "الصافي الكلي", value: `$${totalNetPay.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-green-400" },
          { label: "الرواتب الأساسية", value: `$${totalBasic.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-white" },
          { label: "إجمالي البونص", value: `$${totalBonus.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-blue-400" },
          { label: "إجمالي الاستقطاعات", value: `$${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: "text-red-400" },
        ].map((item) => (
          <Card key={item.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 text-right">
              <p className="text-xs text-white/45 uppercase tracking-wider">{item.label}</p>
              <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium text-right">الموظف</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الراتب الأساسي</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">البونص</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الاستقطاعات</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الصافي</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الحالة</TableHead>
                  <TableHead className="text-white/50 font-medium text-left">عرض</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-white/40">
                      <CreditCard size={32} className="mx-auto mb-3 opacity-50" />
                      <p>لا توجد سجلات رواتب لهذا الشهر</p>
                      <p className="text-xs mt-1">اضغط "تشغيل الرواتب" لتوليد السجلات</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((payroll) => (
                    <TableRow key={payroll.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                      <TableCell>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{payroll.employeeName || "—"}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{payroll.employeeCode || "—"}</p>
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>${Number(payroll.basicSalary).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm text-blue-400">${Number(payroll.bonus).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm text-red-400">${Number(payroll.deductions).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm font-semibold text-green-400">${Number(payroll.netPay).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[payroll.status]}>{statusLabels[payroll.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-left">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/40 hover:text-white" onClick={() => { setSelectedPayroll(payroll.id); setDetailDialog(true); }}>
                          <Eye size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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

      {/* Payslip Dialog */}
      {selectedPayrollData && (
        <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
          <DialogContent className="theme-card text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <FileText size={18} className="text-[#E85D4A]" />
                كشف راتب
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4 text-right">
              <div className="text-center pb-4 border-b border-white/[0.08]">
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{selectedPayrollData.employeeName}</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{selectedMonth}</p>
                <p className="text-2xl font-bold text-green-400 mt-2">${Number(selectedPayrollData.netPay).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">الراتب الأساسي</span>
                  <span style={{ color: "var(--text-primary)" }}>${Number(selectedPayrollData.basicSalary).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">البونص</span>
                  <span className="text-blue-400">+${Number(selectedPayrollData.bonus).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">الاستقطاعات</span>
                  <span className="text-red-400">-${Number(selectedPayrollData.deductions).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-3 border-t border-white/[0.08] flex justify-between text-sm font-semibold">
                  <span style={{ color: "var(--text-primary)" }}>الصافي</span>
                  <span className="text-green-400">${Number(selectedPayrollData.netPay).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white">
                  <Download size={16} className="ml-2" /> تحميل PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
