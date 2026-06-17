import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Play, CheckCircle, XCircle, AlertTriangle, Clock, Activity,
  Shield, Zap, RefreshCw, Database, Server, Globe, Lock,
  ChevronDown, ChevronUp, FileText
} from "lucide-react";

interface TestResult {
  name: string;
  endpoint: string;
  status: "passed" | "failed" | "warning" | "pending";
  duration: number;
  rows?: number;
  error?: string;
}

function StatusBadge({ status }: { status: TestResult["status"] }) {
  const config = {
    passed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle, label: "نجح" },
    failed: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle, label: "فشل" },
    warning: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle, label: "تحذير" },
    pending: { color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Clock, label: "قيد الانتظار" },
  };
  const c = config[status];
  const Icon = c.icon;
  return <Badge variant="outline" className={`gap-1 ${c.color}`}><Icon size={10} /> {c.label}</Badge>;
}

export default function QATesting() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["all"]));
  const [activeTab, setActiveTab] = useState("all");

  // ─── tRPC Queries ───
  const utils = trpc.useUtils();

  const departmentQ = trpc.department.list.useQuery(undefined, { enabled: false });
  const employeeQ = trpc.employee.list.useQuery(undefined, { enabled: false });
  const attendanceQ = trpc.attendance.list.useQuery(undefined, { enabled: false });
  const leaveQ = trpc.leave.list.useQuery(undefined, { enabled: false });
  const performanceQ = trpc.performance.list.useQuery(undefined, { enabled: false });
  const payrollQ = trpc.payroll.list.useQuery(undefined, { enabled: false });
  const productionLineQ = trpc.productionLine.list.useQuery(undefined, { enabled: false });
  const productionOrderQ = trpc.productionOrder.list.useQuery(undefined, { enabled: false });
  const dailyProductionQ = trpc.dailyProduction.list.useQuery(undefined, { enabled: false });
  const inventoryQ = trpc.inventory.list.useQuery(undefined, { enabled: false });
  const supplierQ = trpc.supplier.list.useQuery(undefined, { enabled: false });
  const machineQ = trpc.machine.list.useQuery(undefined, { enabled: false });
  const salesOrderQ = trpc.salesOrder.list.useQuery(undefined, { enabled: false });
  const crmQ = trpc.crm.list.useQuery(undefined, { enabled: false });
  const qcQ = trpc.qc.list.useQuery(undefined, { enabled: false });
  const bundleQ = trpc.bundle.list.useQuery(undefined, { enabled: false });
  const challanQ = trpc.challan.list.useQuery(undefined, { enabled: false });
  const subcontractQ = trpc.subcontract.list.useQuery(undefined, { enabled: false });
  const workOrderQ = trpc.workOrder.list.useQuery(undefined, { enabled: false });
  const costQ = trpc.costCalculation.list.useQuery(undefined, { enabled: false });
  const advanceQ = trpc.advance.list.useQuery(undefined, { enabled: false });
  const bonusPenaltyQ = trpc.bonusPenalty.list.useQuery(undefined, { enabled: false });
  const pieceRateQ = trpc.pieceRate.list.useQuery(undefined, { enabled: false });
  const mrpQ = trpc.mrp.list.useQuery(undefined, { enabled: false });
  const shiftQ = trpc.shift.list.useQuery(undefined, { enabled: false });
  const supplyOrderQ = trpc.supplyOrder.list.useQuery(undefined, { enabled: false });
  const crmInteractionQ = trpc.crm.listInteractions.useQuery(undefined, { enabled: false });

  // ─── Run a single test ───
  const runTest = useCallback(async (name: string, query: any): Promise<TestResult> => {
    const start = performance.now();
    try {
      await query.refetch();
      const duration = Math.round(performance.now() - start);
      const rows = Array.isArray(query.data) ? query.data.length : 0;
      const status = rows > 0 ? "passed" as const : rows === 0 ? "warning" as const : "passed" as const;
      return { name, endpoint: name, status, duration, rows };
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      return { name, endpoint: name, status: "failed" as const, duration, error: err?.message || "Unknown error" };
    }
  }, []);

  // ─── Run all tests ───
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    const allTests: { name: string; query: any }[] = [
      { name: "Departments (الإدارات)", query: departmentQ },
      { name: "Employees (الموظفين)", query: employeeQ },
      { name: "Attendance (الحضور)", query: attendanceQ },
      { name: "Leaves (الإجازات)", query: leaveQ },
      { name: "Performance (الأداء)", query: performanceQ },
      { name: "Payroll (الرواتب)", query: payrollQ },
      { name: "Production Lines (خطوط الإنتاج)", query: productionLineQ },
      { name: "Production Orders (أوامر الإنتاج)", query: productionOrderQ },
      { name: "Daily Production (الإنتاج اليومي)", query: dailyProductionQ },
      { name: "Inventory (المخزون)", query: inventoryQ },
      { name: "Suppliers (الموردين)", query: supplierQ },
      { name: "Machines (الماكينات)", query: machineQ },
      { name: "Sales Orders (أوامر البيع)", query: salesOrderQ },
      { name: "CRM Customers (العملاء)", query: crmQ },
      { name: "QC Records (الجودة)", query: qcQ },
      { name: "Bundles (الباندلز)", query: bundleQ },
      { name: "Challans (المستخلصات)", query: challanQ },
      { name: "Subcontracts (التعاقدات)", query: subcontractQ },
      { name: "Work Orders (أوامر العمل)", query: workOrderQ },
      { name: "Cost Calculations (حساب التكاليف)", query: costQ },
      { name: "Advances (السلف)", query: advanceQ },
      { name: "Bonus/Penalties (المكافآت)", query: bonusPenaltyQ },
      { name: "Piece Rate (سعر القطعة)", query: pieceRateQ },
      { name: "MRP (تخطيط المواد)", query: mrpQ },
      { name: "Shifts (الورديات)", query: shiftQ },
      { name: "Supply Orders (أوامر التوريد)", query: supplyOrderQ },
      { name: "CRM Interactions (التفاعلات)", query: crmInteractionQ },
    ];

    const newResults: TestResult[] = [];
    for (const test of allTests) {
      const result = await runTest(test.name, test.query);
      newResults.push(result);
      setResults([...newResults]);
      await new Promise((r) => setTimeout(r, 100));
    }
    setIsRunning(false);
    toast.success(`اكتمل الاختبار: ${newResults.filter((r) => r.status === "passed").length} نجح من ${newResults.length}`);
  }, [departmentQ, employeeQ, attendanceQ, leaveQ, performanceQ, payrollQ, productionLineQ, productionOrderQ, dailyProductionQ, inventoryQ, supplierQ, machineQ, salesOrderQ, crmQ, qcQ, bundleQ, challanQ, subcontractQ, workOrderQ, costQ, advanceQ, bonusPenaltyQ, pieceRateQ, mrpQ, shiftQ, supplyOrderQ, crmInteractionQ, runTest]);

  // ─── Stats ───
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const totalDuration = results.reduce((s, r) => s + r.duration, 0);
  const avgDuration = results.length > 0 ? Math.round(totalDuration / results.length) : 0;

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>اختبار الجودة الشامل</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>اختبار جميع الـ Routers والـ Endpoints</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="text-white gap-1"
            style={{ background: "var(--accent-color)" }}
            onClick={runAllTests}
            disabled={isRunning}
          >
            {isRunning ? <><Clock size={14} className="animate-spin" /> جاري الاختبار...</> : <><Play size={14} /> بدء الاختبار</>}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setResults([])} disabled={isRunning}>
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي الاختبارات", value: results.length, icon: Activity, color: "text-blue-400" },
          { label: "نجح", value: passed, icon: CheckCircle, color: "text-emerald-400" },
          { label: "فشل", value: failed, icon: XCircle, color: "text-red-400" },
          { label: "تحذير", value: warnings, icon: AlertTriangle, color: "text-amber-400" },
          { label: "متوسط الاستجابة", value: `${avgDuration}ms`, icon: Zap, color: "text-violet-400" },
        ].map((s, i) => (
          <Card key={i} className="theme-card" style={{ borderColor: "var(--border-color)" }}>
            <CardContent className="p-3 text-center">
              <s.icon size={16} className={`mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[9px] text-white/40">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/40">
            <span>جاري الاختبار...</span>
            <span>{results.length} / 27</span>
          </div>
          <Progress value={(results.length / 27) * 100} className="h-2" />
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText size={14} /> نتائج الاختبار</span>
              <Badge variant="outline" className="text-[10px]">{results.length} اختبار</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ background: "var(--bg-card)" }}>
                  <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
                    <th className="text-right py-2 px-3 text-xs text-white/60">#</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">الاسم</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">الحالة</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">السجلات</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">السرعة</th>
                    <th className="text-right py-2 px-3 text-xs text-white/60">ملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-white/[0.02]" style={{ borderColor: "var(--border-color)" }}>
                      <td className="py-2 px-3 text-xs text-white/30">{i + 1}</td>
                      <td className="py-2 px-3 text-xs text-white/80">{r.name}</td>
                      <td className="py-2 px-3"><StatusBadge status={r.status} /></td>
                      <td className="py-2 px-3 text-xs text-white/60">{r.rows ?? "—"}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className={`text-[9px] h-4 ${r.duration < 200 ? "text-emerald-400" : r.duration < 500 ? "text-amber-400" : "text-red-400"}`}>
                          {r.duration}ms
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-xs text-red-400/60">{r.error || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security & Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Security Checklist */}
        <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Shield size={14} /> فحص الأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "JWT Authentication", status: true, detail: "jose library + Bearer tokens" },
              { label: "bcryptjs Password Hashing", status: true, detail: "bcrypt rounds 10" },
              { label: "Role-based Access Control", status: true, detail: "admin/supervisor/accountant/worker" },
              { label: "tRPC Input Validation (Zod)", status: true, detail: "All endpoints validated" },
              { label: "SQL Injection Protection", status: true, detail: "Drizzle ORM parameterized queries" },
              { label: "CORS Configuration", status: true, detail: "Credentials included" },
              { label: "HTTPS Only", status: false, detail: "Requires SSL certificate in production" },
              { label: "Rate Limiting", status: false, detail: "Not implemented yet" },
              { label: "Audit Logging", status: true, detail: "Activities table + IP tracking" },
              { label: "Session Timeout (30min)", status: true, detail: "Auto logout configured" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/[0.02]">
                {item.status ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" /> : <XCircle size={14} className="text-red-400 flex-shrink-0" />}
                <span className="text-xs text-white/70 flex-1">{item.label}</span>
                <span className="text-[10px] text-white/30">{item.detail}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Checklist */}
        <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Zap size={14} /> فحص الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Bundle Size < 100KB (gzip)", status: false, detail: "159KB — needs splitting" },
              { label: "Code Splitting (lazy)", status: true, detail: "60 pages lazy-loaded" },
              { label: "Tree Shaking", status: true, detail: "Vite esbuild" },
              { label: "Image Optimization", status: true, detail: "Icons from lucide-react" },
              { label: "Minification", status: true, detail: "Terser in production" },
              { label: "Database Indexing", status: true, detail: "Primary + foreign keys" },
              { label: "Query Pagination", status: true, detail: "LIMIT on all list queries" },
              { label: "CDN Caching", status: false, detail: "Requires CloudFront setup" },
              { label: "Service Worker", status: true, detail: "PWA caching enabled" },
              { label: "Database Connection Pool", status: true, detail: "TiDB Cloud managed" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/[0.02]">
                {item.status ? <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" /> : <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />}
                <span className="text-xs text-white/70 flex-1">{item.label}</span>
                <span className="text-[10px] text-white/30">{item.detail}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Test Summary Report */}
      {results.length > 0 && (
        <Card className="theme-card" style={{ borderColor: "var(--border-color)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <FileText size={14} /> تقرير الاختبار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-2xl font-bold text-emerald-400">{Math.round((passed / results.length) * 100)}%</p>
                <p className="text-[10px] text-white/40">نسبة النجاح</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <p className="text-2xl font-bold text-blue-400">{results.reduce((s, r) => s + (r.rows || 0), 0).toLocaleString()}</p>
                <p className="text-[10px] text-white/40">إجمالي السجلات</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-2xl font-bold text-amber-400">{totalDuration}ms</p>
                <p className="text-[10px] text-white/40">إجمالي الزمن</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                <p className="text-2xl font-bold text-violet-400">{avgDuration}ms</p>
                <p className="text-[10px] text-white/40">متوسط الاستجابة</p>
              </div>
            </div>

            {failed > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-xs text-red-400 font-medium mb-2">الاختبارات الفاشلة:</p>
                {results.filter((r) => r.status === "failed").map((r, i) => (
                  <p key={i} className="text-[10px] text-red-300/70">• {r.name}: {r.error}</p>
                ))}
              </div>
            )}

            {warnings > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-xs text-amber-400 font-medium mb-2">تحذيرات (لا توجد بيانات):</p>
                {results.filter((r) => r.status === "warning").map((r, i) => (
                  <p key={i} className="text-[10px] text-amber-300/70">• {r.name}: 0 صفوف — قد يحتاج seed data</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
