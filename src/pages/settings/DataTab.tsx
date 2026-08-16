import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { exportToCSV } from "@/lib/export";
import { Database, Download, Upload, Trash2, AlertTriangle } from "lucide-react";

const STORAGE_KEYS = [
  { key: "hr_departments", label: "الأقسام" }, { key: "hr_employees", label: "العمال" },
  { key: "hr_attendance", label: "الحضور" }, { key: "hr_leaves", label: "الإجازات" },
  { key: "hr_reviews", label: "التقييمات" }, { key: "hr_jobs", label: "الوظائف" },
  { key: "hr_candidates", label: "المتقدمون" }, { key: "hr_payroll", label: "الرواتب" },
  { key: "hr_lines", label: "خطوط الإنتاج" }, { key: "hr_orders", label: "أوامر الإنتاج" },
  { key: "hr_daily", label: "الإنتاج اليومي" }, { key: "hr_shifts", label: "الورديات" },
  { key: "hr_advances", label: "السلف" }, { key: "hr_bonuses", label: "المكافآت" },
  { key: "hr_machines", label: "الماكينات" }, { key: "hr_inventory", label: "المخزون" },
];

export function DataTab() {
  const [importDialog, setImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [clearDialog, setClearDialog] = useState(false);

  const cardBg = { background: "var(--bg-card, #1C1C1E)", borderColor: "var(--border-color, rgba(255,255,255,0.08))" };
  const inputBg = { background: "var(--bg-input, #2C2C2E)", borderColor: "var(--border-color)", color: "var(--text-primary)" };

  const handleExportAll = () => {
    const allData: Record<string, unknown> = {};
    STORAGE_KEYS.forEach(({ key }) => {
      try {
        const d = localStorage.getItem(key);
        if (d) allData[key] = JSON.parse(d);
      } catch { /* ignore */ }
    });
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `selim_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
      setImportDialog(false);
      setImportText("");
      alert("تم استيراد البيانات بنجاح! يرجى تحديث الصفحة.");
      window.location.reload();
    } catch {
      alert("ملف غير صالح!");
    }
  };

  const handleClearAll = () => {
    STORAGE_KEYS.forEach(({ key }) => localStorage.removeItem(key));
    setClearDialog(false);
    alert("تم مسح جميع البيانات!");
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <Card className="border" style={cardBg}>
        <CardHeader><CardTitle className="text-base text-right">تصدير سريع</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="justify-start border"
              style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}
              onClick={() => {
                try {
                  const emps = JSON.parse(localStorage.getItem("hr_employees") || "[]");
                  exportToCSV("employees", ["كود", "الاسم", "المسمى", "الحالة", "الراتب"], emps.map((e: any) => [e.employeeCode, e.fullName, e.jobTitle, e.status, e.salary || ""]));
                } catch { /* ignore */ }
              }}
            >
              <Download size={14} className="ml-2" /> تصدير العمال
            </Button>
            <Button
              variant="outline"
              className="justify-start border"
              style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}
              onClick={() => {
                try {
                  const att = JSON.parse(localStorage.getItem("hr_attendance") || "[]");
                  exportToCSV("attendance", ["التاريخ", "الكود", "الاسم", "الحالة", "دخول", "خروج"], att.map((a: any) => [a.date, a.employeeCode, a.employeeName, a.status, a.checkIn || "", a.checkOut || ""]));
                } catch { /* ignore */ }
              }}
            >
              <Download size={14} className="ml-2" /> تصدير الحضور
            </Button>
            <Button
              variant="outline"
              className="justify-start border"
              style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}
              onClick={() => {
                try {
                  const p = JSON.parse(localStorage.getItem("hr_payroll") || "[]");
                  exportToCSV("payroll", ["الشهر", "الكود", "الاسم", "الأساسي", "صافي"], p.map((x: any) => [x.month, x.employeeCode, x.employeeName, x.basicSalary, x.netPay]));
                } catch { /* ignore */ }
              }}
            >
              <Download size={14} className="ml-2" /> تصدير الرواتب
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border" style={cardBg}>
        <CardHeader><CardTitle className="text-base flex items-center gap-2 justify-end"><Database size={16} style={{ color: "var(--accent-color)" }} /> نسخ احتياطي واستعادة</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-color)" }}>
            <div className="text-right">
              <p className="text-sm font-medium">نسخة احتياطية كاملة</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>JSON</p>
            </div>
            <Button variant="outline" size="sm" className="border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={handleExportAll}><Download size={14} className="ml-1.5" /> تصدير</Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="text-right">
              <p className="text-sm font-medium">استعادة من نسخة</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>JSON</p>
            </div>
            <Button variant="outline" size="sm" className="border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setImportDialog(true)}><Upload size={14} className="ml-1.5" /> استيراد</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border" style={cardBg}>
        <CardHeader><CardTitle className="text-base text-right">حالة التخزين local storage</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {STORAGE_KEYS.map(({ key, label }) => {
              const count = (() => { try { const d = localStorage.getItem(key); return d ? JSON.parse(d).length : 0; } catch { return 0; } })();
              return (
                <div key={key} className="flex items-center justify-between py-1 px-2 rounded" style={{ background: "var(--bg-input)" }}>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-color)" + "20", color: "var(--accent-color)" }}>{count} سجل</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border" style={{ ...cardBg, borderColor: "rgba(239,68,68,0.2)" }}>
        <CardHeader><CardTitle className="text-base flex items-center gap-2 text-red-400 justify-end"><AlertTriangle size={16} /> منطقة الخطر</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="text-right">
              <p className="text-sm font-medium text-red-400">مسح جميع البيانات</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>لا يمكن التراجع</p>
            </div>
            <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setClearDialog(true)}><Trash2 size={14} className="ml-1.5" /> مسح</Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent style={cardBg} className="border text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle>استيراد البيانات</DialogTitle>
            <DialogDescription style={{ color: "var(--text-muted)" }}>الصق محتوى ملف JSON الاحتياطي أدناه لاستعادة البيانات.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"hr_employees": [...]}'
            rows={10}
            className="text-left font-mono"
            style={inputBg}
          />
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" style={inputBg} onClick={() => setImportDialog(false)}>إلغاء</Button>
            <Button onClick={handleImport} style={{ background: "var(--accent-color)", color: "var(--text-primary)" }}>استيراد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Dialog */}
      <Dialog open={clearDialog} onOpenChange={setClearDialog}>
        <DialogContent style={cardBg} className="border text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-400">هل أنت متأكد تماماً؟</DialogTitle>
            <DialogDescription style={{ color: "var(--text-muted)" }}>سيقوم هذا بحذف جميع البيانات المخزنة محلياً في المتصفح. هذا الإجراء لا يمكن التراجع عنه.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="outline" style={inputBg} onClick={() => setClearDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleClearAll}>تأكيد الحذف النهائي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
