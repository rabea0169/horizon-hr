import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/lib/export";
import { useTheme } from "@/hooks/useTheme";
import { useRoles, getRoleLabel, getRoleColor } from "@/hooks/useRoles";
import type { UserRole } from "@/hooks/useRoles";
import { Bell, Palette, Globe, Shield, Database, Moon, Sun, Download, Upload, Trash2, AlertTriangle, Plus } from "lucide-react";

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

const ACCENT_COLORS = [
  { color: "#4A2C3F" as const, label: "بنفسجي" },
  { color: "#2563EB" as const, label: "أزرق" },
  { color: "#059669" as const, label: "أخضر" },
  { color: "#D97706" as const, label: "برتقالي" },
  { color: "#DC2626" as const, label: "أحمر" },
  { color: "#7C3AED" as const, label: "بنفسجي فاتح" },
];

export default function Settings() {
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const { users, addUser, removeUser, getSessionUser } = useRoles();
  const currentUser = getSessionUser();
  const isAdmin = currentUser?.role === "admin";

  const [notifications, setNotifications] = useState({ emailNotifications: true, leaveAlerts: true, attendanceReminders: true, payrollNotifications: true, performanceReviews: false, maintenanceAlerts: true, lowStockAlerts: true });
  const [general, setGeneral] = useState({ companyName: "مصنع Horizon للملابس الجاهزة", timezone: "Africa/Cairo", currency: "EGP", language: "ar" });
  const [importDialog, setImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [clearDialog, setClearDialog] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({ username: "", fullName: "", password: "", role: "worker" as UserRole });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAll = () => {
    const allData: Record<string, unknown> = {};
    STORAGE_KEYS.forEach(({ key }) => { try { const d = localStorage.getItem(key); if (d) allData[key] = JSON.parse(d); } catch { /* ignore */ } });
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `horizon_backup_${new Date().toISOString().split("T")[0]}.json`; link.click(); URL.revokeObjectURL(link.href);
  };

  const handleImport = () => {
    try { const data = JSON.parse(importText); Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value))); setImportDialog(false); setImportText(""); alert("تم استيراد البيانات بنجاح! يرجى تحديث الصفحة."); } catch { alert("ملف غير صالح!"); }
  };

  const handleClearAll = () => { STORAGE_KEYS.forEach(({ key }) => localStorage.removeItem(key)); setClearDialog(false); alert("تم مسح جميع البيانات!"); window.location.reload(); };

  const handleAddUser = () => {
    if (!userForm.username || !userForm.fullName || !userForm.password) return;
    addUser({ username: userForm.username, fullName: userForm.fullName, password: userForm.password, role: userForm.role, active: true });
    setUserDialog(false); setUserForm({ username: "", fullName: "", password: "", role: "worker" });
  };

  const cardBg = { background: "var(--bg-card, #1C1C1E)", borderColor: "var(--border-color, rgba(255,255,255,0.08))" };
  const inputBg = { background: "var(--bg-input, #2C2C2E)", borderColor: "var(--border-color)", color: "var(--text-primary)" };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{ color: "var(--text-primary)" }} dir="rtl">
      <div className="text-right"><h2 className="text-lg font-semibold">الإعدادات</h2><p className="text-sm" style={{ color: "var(--text-muted)" }}>تخصيص النظام وإدارة البيانات والمستخدمين</p></div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="h-auto flex-wrap border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <TabsTrigger value="appearance" className="text-sm" style={{ color: "var(--text-muted)" }}><Palette size={14} className="ml-1.5" /> المظهر</TabsTrigger>
          <TabsTrigger value="general" className="text-sm" style={{ color: "var(--text-muted)" }}><Globe size={14} className="ml-1.5" /> عام</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm" style={{ color: "var(--text-muted)" }}><Bell size={14} className="ml-1.5" /> الإشعارات</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="text-sm" style={{ color: "var(--text-muted)" }}><Shield size={14} className="ml-1.5" /> المستخدمين</TabsTrigger>}
          <TabsTrigger value="data" className="text-sm" style={{ color: "var(--text-muted)" }}><Database size={14} className="ml-1.5" /> البيانات</TabsTrigger>
        </TabsList>

        {/* ─── Appearance Tab ─── */}
        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card className="border" style={cardBg}>
            <CardHeader><CardTitle className="text-base">المظهر</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Toggle */}
              <div className="space-y-3">
                <Label style={{ color: "var(--text-secondary)" }}>السمة</Label>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 gap-2"
                    style={theme === "dark" ? { background: "var(--accent-color)", borderColor: "var(--accent-color)", color: "#fff" } : { background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                    onClick={() => setTheme("dark")}
                  >
                    <Moon size={18} /> الوضع الداكن
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 gap-2"
                    style={theme === "light" ? { background: "var(--accent-color)", borderColor: "var(--accent-color)", color: "#fff" } : { background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                    onClick={() => setTheme("light")}
                  >
                    <Sun size={18} /> الوضع الفاتح
                  </Button>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{theme === "dark" ? "الوضع الداكن مفعل" : "الوضع الفاتح مفعل"}</p>
              </div>

              <Separator style={{ background: "var(--border-color)" }} />

              {/* Accent Color */}
              <div className="space-y-3">
                <Label style={{ color: "var(--text-secondary)" }}>لون التطبيق الرئيسي</Label>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map(({ color, label }) => (
                    <button key={color} onClick={() => setAccentColor(color)} className="flex flex-col items-center gap-1 transition-all hover:scale-110" title={label}>
                      <div className="w-10 h-10 rounded-full border-2 transition-all" style={{ backgroundColor: color, borderColor: accentColor === color ? "white" : "transparent", boxShadow: accentColor === color ? `0 0 0 2px ${color}` : "none" }} />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── General Tab ─── */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card className="border" style={cardBg}>
            <CardHeader><CardTitle className="text-base">معلومات المصنع</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-right">
              <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>اسم المصنع</Label><Input value={general.companyName} onChange={(e) => setGeneral({ ...general, companyName: e.target.value })} className="text-right" style={inputBg} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>التوقيت</Label><Input value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} style={inputBg} /></div>
                <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>العملة</Label><Input value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })} style={inputBg} /></div>
              </div>
              <Button style={{ background: "var(--accent-color)", color: "var(--text-primary)" }}>حفظ التغييرات</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Notifications Tab ─── */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border" style={cardBg}>
            <CardHeader><CardTitle className="text-base">تفضيلات الإشعارات</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "إشعارات البريد", description: "استلام تنبيهات بالبريد", key: "emailNotifications" as const },
                { label: "تنبيهات الإجازات", description: "إشعار عند طلب إجازة جديدة", key: "leaveAlerts" as const },
                { label: "تذكير الحضور", description: "ملخص الحضور اليومي", key: "attendanceReminders" as const },
                { label: "إشعارات الرواتب", description: "تنبيه عند معالجة الرواتب", key: "payrollNotifications" as const },
                { label: "تقييمات الأداء", description: "تذكير بالتقييمات القادمة", key: "performanceReviews" as const },
                { label: "تنبيهات صيانة", description: "مواعيد صيانة الماكينات", key: "maintenanceAlerts" as const },
                { label: "تنبيهات المخزون", description: "تنبيه عند نفاد خامة", key: "lowStockAlerts" as const },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.description}</p>
                  </div>
                  <Switch checked={notifications[item.key]} onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })} style={{ background: notifications[item.key] ? "var(--accent-color)" : undefined }} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Users Tab (Admin only) ─── */}
        {isAdmin && (
          <TabsContent value="users" className="mt-4 space-y-4">
            <Card className="border" style={cardBg}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Shield size={16} style={{ color: "var(--accent-color)" }} /> إدارة المستخدمين</CardTitle>
                  <Button size="sm" style={{ background: "var(--accent-color)", color: "var(--text-primary)" }} onClick={() => setUserDialog(true)}><Plus size={14} className="ml-1" /> مستخدم جديد</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: "var(--border-color)" }}>
                        <TableHead className="font-medium text-right" style={{ color: "var(--text-muted)" }}>الاسم</TableHead>
                        <TableHead className="font-medium text-right" style={{ color: "var(--text-muted)" }}>اسم المستخدم</TableHead>
                        <TableHead className="font-medium text-right" style={{ color: "var(--text-muted)" }}>الدور</TableHead>
                        <TableHead className="font-medium text-right" style={{ color: "var(--text-muted)" }}>الحالة</TableHead>
                        <TableHead className="font-medium text-left">حذف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} style={{ borderColor: "var(--border-color)" }}>
                          <TableCell className="font-medium">{u.fullName}</TableCell>
                          <TableCell style={{ color: "var(--text-secondary)" }}>{u.username}</TableCell>
                          <TableCell><span className={`px-2 py-0.5 rounded text-xs ${getRoleColor(u.role)}`}>{getRoleLabel(u.role)}</span></TableCell>
                          <TableCell><Badge variant="outline" className={u.active ? "badge-active" : "badge-inactive"}>{u.active ? "نشط" : "معطل"}</Badge></TableCell>
                          <TableCell className="text-left">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={() => { if (u.id !== 1) removeUser(u.id); }} disabled={u.id === 1}><Trash2 size={14} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Add User Dialog */}
            {userDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setUserDialog(false)}>
                <div className="rounded-xl p-6 max-w-md w-full mx-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-semibold mb-4 text-right">مستخدم جديد</h3>
                  <div className="space-y-3">
                    <Input placeholder="اسم المستخدم" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} style={inputBg} className="text-right" />
                    <Input placeholder="الاسم الكامل" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} style={inputBg} className="text-right" />
                    <Input type="password" placeholder="كلمة المرور" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} style={inputBg} />
                    <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v as UserRole })}>
                      <SelectTrigger className="text-right" style={inputBg}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                        <SelectItem value="admin" className="text-right">مدير النظام</SelectItem>
                        <SelectItem value="supervisor" className="text-right">مشرف إنتاج</SelectItem>
                        <SelectItem value="accountant" className="text-right">محاسب</SelectItem>
                        <SelectItem value="worker" className="text-right">مستخدم عادي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setUserDialog(false)}>إلغاء</Button>
                    <Button className="flex-1 text-white" style={{ background: "var(--accent-color)" }} onClick={handleAddUser} disabled={!userForm.username || !userForm.fullName || !userForm.password}>إضافة</Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        )}

        {/* ─── Data Tab ─── */}
        <TabsContent value="data" className="mt-4 space-y-4">
          <Card className="border" style={cardBg}>
            <CardHeader><CardTitle className="text-base">تصدير سريع</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="outline" className="justify-start border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => { try { const emps = JSON.parse(localStorage.getItem("hr_employees") || "[]"); exportToCSV("employees", ["كود", "الاسم", "المسمى", "الحالة", "الراتب"], emps.map((e: Record<string, unknown>) => [e.employeeCode, e.fullName, e.jobTitle, e.status, e.salary || ""])); } catch { /* ignore */ } }}><Download size={14} className="ml-2" /> تصدير العمال</Button>
                <Button variant="outline" className="justify-start border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => { try { const att = JSON.parse(localStorage.getItem("hr_attendance") || "[]"); exportToCSV("attendance", ["التاريخ", "الكود", "الاسم", "الحالة", "دخول", "خروج"], att.map((a: Record<string, unknown>) => [a.date, a.employeeCode, a.employeeName, a.status, a.checkIn || "", a.checkOut || ""])); } catch { /* ignore */ } }}><Download size={14} className="ml-2" /> تصدير الحضور</Button>
                <Button variant="outline" className="justify-start border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => { try { const p = JSON.parse(localStorage.getItem("hr_payroll") || "[]"); exportToCSV("payroll", ["الشهر", "الكود", "الاسم", "الأساسي", "صافي"], p.map((x: Record<string, unknown>) => [x.month, x.employeeCode, x.employeeName, x.basicSalary, x.netPay])); } catch { /* ignore */ } }}><Download size={14} className="ml-2" /> تصدير الرواتب</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={cardBg}>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database size={16} style={{ color: "var(--accent-color)" }} /> نسخ احتياطي واستعادة</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-color)" }}>
                <div className="text-right"><p className="text-sm font-medium">نسخة احتياطية كاملة</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>JSON</p></div>
                <Button variant="outline" size="sm" className="border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={handleExportAll}><Download size={14} className="ml-1.5" /> تصدير</Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="text-right"><p className="text-sm font-medium">استعادة من نسخة</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>JSON</p></div>
                <Button variant="outline" size="sm" className="border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setImportDialog(true)}><Upload size={14} className="ml-1.5" /> استيراد</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={cardBg}>
            <CardHeader><CardTitle className="text-base">حالة التخزين</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {STORAGE_KEYS.map(({ key, label }) => {
                  const count = (() => { try { const d = localStorage.getItem(key); return d ? JSON.parse(d).length : 0; } catch { return 0; } })();
                  return (
                    <div key={key} className="flex items-center justify-between py-1 px-2 rounded" style={{ background: "var(--bg-input)" }}>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--accent-color)" + "20", color: "var(--accent-color)" }}>{count} سجل</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={{ ...cardBg, borderColor: "rgba(239,68,68,0.2)" }}>
            <CardHeader><CardTitle className="text-base flex items-center gap-2 text-red-400"><AlertTriangle size={16} /> منطقة الخطر</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <div className="text-right"><p className="text-sm font-medium text-red-400">مسح جميع البيانات</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>لا يمكن التراجع</p></div>
                <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setClearDialog(true)}><Trash2 size={14} className="ml-1.5" /> مسح</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      {importDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setImportDialog(false)}>
          <div className="rounded-xl p-6 max-w-lg w-full mx-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4 text-right">استيراد البيانات</h3>
            <input type="file" accept=".json" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setImportText(String(ev.target?.result || "")); r.readAsText(f); }} className="hidden" />
            <Button variant="outline" className="w-full mb-3 border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => fileInputRef.current?.click()}><Upload size={14} className="ml-2" /> اختيار ملف</Button>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="أو الصق JSON هنا..." className="w-full h-40 rounded-lg p-3 text-sm text-right resize-none border" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1 border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setImportDialog(false)}>إلغاء</Button>
              <Button className="flex-1 text-white" style={{ background: "var(--accent-color)" }} disabled={!importText.trim()} onClick={handleImport}>استيراد</Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Dialog */}
      {clearDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setClearDialog(false)}>
          <div className="rounded-xl p-6 max-w-sm w-full mx-4 border" style={{ background: "var(--bg-card)", borderColor: "rgba(239,68,68,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-red-400 font-semibold mb-2 text-right">تأكيد المسح</h3>
            <p className="text-sm mb-4 text-right" style={{ color: "var(--text-muted)" }}>هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setClearDialog(false)}>إلغاء</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleClearAll}>نعم، امسح</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
