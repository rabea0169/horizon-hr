import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, User, CalendarDays, Key, LogOut } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

export default function WorkerPortal() {
  const [workerCode, setWorkerCode] = useState("EMP-001");
  const [activeWorker, setActiveWorker] = useState<any>(null);

  // Let's use trpc query with enabled flag:
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults, isFetching } = trpc.employee.list.useQuery(
    { search: searchTerm },
    { enabled: searchTerm.length > 0 }
  );

  const { data: attendanceData } = trpc.attendance.list.useQuery(
    { employeeId: activeWorker?.id },
    { enabled: !!activeWorker }
  );

  const handleLogin = () => {
    if (!workerCode.trim()) {
      toast.error("يرجى إدخال كود العامل");
      return;
    }
    setSearchTerm(workerCode);
  };

  // If search results are loaded, check if we found a match
  const handleCheckResults = () => {
    if (searchResults && searchResults.employees) {
      // Find exact match by code
      const match = searchResults.employees.find(
        (e) => e.employeeCode.toLowerCase() === workerCode.trim().toLowerCase()
      );
      if (match) {
        setActiveWorker(match);
        toast.success(`أهلاً بك يا ${match.fullName}`);
        setSearchTerm(""); // clear search
      } else {
        toast.error("لم يتم العثور على موظف بهذا الكود");
        setSearchTerm("");
      }
    }
  };

  // Run handleCheckResults when searchResults changes
  if (searchTerm && !isFetching && searchResults) {
    handleCheckResults();
  }

  if (!activeWorker) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans text-right" dir="rtl">
        <Card className="w-full max-w-sm border shadow-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <User size={40} className="mx-auto mb-2 text-amber-500" />
              <h2 className="text-lg font-bold">بوابة الموظف الذاتية</h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>أدخل كود الموظف الخاص بك للاطلاع على بياناتك والراتب</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كود الموظف</label>
              <div className="relative">
                <Input 
                  placeholder="مثال: EMP-001" 
                  value={workerCode} 
                  onChange={e => setWorkerCode(e.target.value)} 
                  className="text-center font-mono h-11" 
                  style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} 
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>
            <Button className="w-full text-white bg-amber-600 hover:bg-amber-700 h-11 gap-2" onClick={handleLogin} disabled={isFetching}>
              {isFetching ? "جاري التحقق..." : <><Key size={16} /> دخول البوابة</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const logs = attendanceData?.attendance ?? [];
  const totalDays = logs.length;
  const presentDays = logs.filter(l => l.status === "present" || l.status === "late").length;

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-amber-600 font-bold text-lg">
            {activeWorker.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold">{activeWorker.fullName}</h2>
            <div className="flex gap-2 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>كود: {activeWorker.employeeCode}</span>
              <span>•</span>
              <span>قسم: {activeWorker.department?.name || "عام"}</span>
              <span>•</span>
              <span>نوع التوظيف: {activeWorker.employmentType === "full_time" ? "دوام كامل" : "دوام جزئي"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 capitalize">
            {activeWorker.role === "worker" ? "عامل" : activeWorker.role === "supervisor" ? "مشرف" : "إداري"}
          </Badge>
          <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 gap-1.5" onClick={() => setActiveWorker(null)}>
            <LogOut size={13} /> خروج
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1 justify-end"><span className="text-xs" style={{ color: "var(--text-muted)" }}>الراتب الأساسي الحالي</span><DollarSign size={14} className="text-emerald-400" /></div>
            <p className="text-2xl font-bold text-emerald-400">
              {Number(activeWorker.salary || 0).toLocaleString()} <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>ج.م</span>
            </p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>طريقة الحساب: {activeWorker.salaryType === "piece_rate" ? "بالإنتاج / القطعة" : activeWorker.salaryType === "mixed" ? "مختلط" : "راتب شهري ثابت"}</p>
          </CardContent>
        </Card>

        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1 justify-end"><span className="text-xs" style={{ color: "var(--text-muted)" }}>نسبة الحضور</span><CalendarDays size={14} className="text-blue-400" /></div>
            <p className="text-2xl font-bold text-blue-400">
              {totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : "100%"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>إجمالي تسجيلات الحضور هذا الشهر: {totalDays} أيام</p>
          </CardContent>
        </Card>

        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1 justify-end"><span className="text-xs" style={{ color: "var(--text-muted)" }}>تاريخ التعيين</span><CalendarDays size={14} className="text-amber-500" /></div>
            <p className="text-lg font-bold">
              {activeWorker.joinDate ? String(activeWorker.joinDate).split("T")[0] : "—"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>حالة الموظف الحالية: <span className="text-emerald-400">نشط</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="h-auto flex-wrap border justify-start" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <TabsTrigger value="attendance" className="text-sm">سجل الحضور والغياب</TabsTrigger>
          <TabsTrigger value="info" className="text-sm">الملف التعريفي والبيانات الشخصية</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4">
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">وقت الحضور</TableHead>
                      <TableHead className="text-right">وقت الانصراف</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>لا توجد سجلات حضور مسجلة لك.</TableCell>
                      </TableRow>
                    ) : (
                      logs.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="text-right">{l.date ? String(l.date).split("T")[0] : "—"}</TableCell>
                          <TableCell className="text-right">{l.checkIn ? new Date(l.checkIn).toLocaleTimeString("ar-EG") : "—"}</TableCell>
                          <TableCell className="text-right">{l.checkOut ? new Date(l.checkOut).toLocaleTimeString("ar-EG") : "—"}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={l.status === "present" ? "bg-emerald-500/15 text-emerald-400" : l.status === "late" ? "bg-yellow-500/15 text-yellow-400" : "bg-red-500/15 text-red-400"}>
                              {l.status === "present" ? "حاضر" : l.status === "late" ? "متأخر" : "غائب"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs" style={{ color: "var(--text-muted)" }}>{l.notes || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                <div className="space-y-1">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>الاسم الكامل</span>
                  <p className="font-semibold">{activeWorker.fullName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>البريد الإلكتروني</span>
                  <p className="font-semibold font-mono">{activeWorker.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>رقم الهاتف</span>
                  <p className="font-semibold font-mono">{activeWorker.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>المسمى الوظيفي</span>
                  <p className="font-semibold">{activeWorker.jobTitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
