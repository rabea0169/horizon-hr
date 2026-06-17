import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fingerprint, Wifi, WifiOff, Download, RefreshCw, CheckCircle, AlertTriangle, Clock, UserCheck, UserX } from "lucide-react";

const DEMO_LOGS = [
  { id: 1, employeeCode: "EMP-001", name: "أحمد محمد", time: "07:58", date: "2026-06-12", type: "in", device: "ZK-1", status: "present" },
  { id: 2, employeeCode: "EMP-002", name: "محمد علي", time: "08:02", date: "2026-06-12", type: "in", device: "ZK-1", status: "late" },
  { id: 3, employeeCode: "EMP-003", name: "فاطمة عمر", time: "07:55", date: "2026-06-12", type: "in", device: "ZK-2", status: "present" },
  { id: 4, employeeCode: "EMP-004", name: "خالد محمود", time: "—", date: "2026-06-12", type: "—", device: "—", status: "absent" },
  { id: 5, employeeCode: "EMP-005", name: "سعاد إبراهيم", time: "08:15", date: "2026-06-12", type: "in", device: "ZK-1", status: "late" },
  { id: 6, employeeCode: "EMP-006", name: "محمود حسن", time: "07:50", date: "2026-06-12", type: "in", device: "ZK-2", status: "present" },
  { id: 7, employeeCode: "EMP-007", name: "نادية سami", time: "17:05", date: "2026-06-11", type: "out", device: "ZK-1", status: "present" },
  { id: 8, employeeCode: "EMP-008", name: "أحمد محمود", time: "—", date: "2026-06-12", type: "—", device: "—", status: "absent" },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  present: { label: "حاضر", color: "bg-emerald-500/15 text-emerald-400", icon: UserCheck },
  late: { label: "متأخر", color: "bg-yellow-500/15 text-yellow-400", icon: Clock },
  absent: { label: "غائب", color: "bg-red-500/15 text-red-400", icon: UserX },
};

export default function ZKTeco() {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deviceIp, setDeviceIp] = useState("192.168.1.201");
  const [port, setPort] = useState("4370");
  const [logs] = useState(DEMO_LOGS);
  const [lastSync, setLastSync] = useState("2026-06-12 08:30");

  const handleConnect = () => { setConnected(true); };
  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => { setSyncing(false); setLastSync(new Date().toLocaleString("en-GB")); }, 2000);
  };

  const presentCount = logs.filter(l => l.status === "present" && l.type === "in").length;
  const lateCount = logs.filter(l => l.status === "late").length;
  const absentCount = logs.filter(l => l.status === "absent").length;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">تكامل جهاز البصمة ZKTeco</h2>
        <Badge variant="outline" className={connected ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />} {connected ? "متصل" : "غير متصل"}
        </Badge>
      </div>

      {/* Device Config */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><Fingerprint size={16} style={{ color: "var(--accent-color)" }} /> إعدادات الجهاز</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><Label>IP الجهاز</Label><Input value={deviceIp} onChange={e => setDeviceIp(e.target.value)} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label>المنفذ</Label><Input value={port} onChange={e => setPort(e.target.value)} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label>الموديل</Label>
              <Select defaultValue="iface800"><SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="iface800">iFace800</SelectItem><SelectItem value="k40">K40 Pro</SelectItem><SelectItem value="uface800">uFace800</SelectItem><SelectItem value="g3">G3</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="gap-1 text-white" style={{ background: connected ? "#2D6B5E" : "var(--accent-color)" }} onClick={handleConnect}>
              {connected ? <CheckCircle size={14} /> : <Wifi size={14} />} {connected ? "متصل" : "اتصال"}
            </Button>
            <Button variant="outline" className="gap-1" disabled={!connected || syncing} onClick={handleSync}>
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> مزامنة {syncing && "..."}
            </Button>
            <Button variant="outline" className="gap-1" disabled={!connected}><Download size={14} /> تصدير</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-2xl font-bold text-emerald-400">{presentCount}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>حاضرين</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-2xl font-bold text-yellow-400">{lateCount}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>متأخرين</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-2xl font-bold text-red-400">{absentCount}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>غائبين</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><p className="text-2xl font-bold">{presentCount + lateCount + absentCount}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي</p></CardContent></Card>
      </div>

      {/* Logs Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <div className="flex justify-between mb-3"><h3 className="font-bold">سجلات الحضور — اليوم</h3><span className="text-xs" style={{ color: "var(--text-muted)" }}>آخر مزامنة: {lastSync}</span></div>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-color)" }}>
            <Table>
              <TableHeader><TableRow><TableHead className="text-right">الكود</TableHead><TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">الوقت</TableHead><TableHead className="text-right">النوع</TableHead><TableHead className="text-right">الجهاز</TableHead><TableHead className="text-right">الحالة</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map(l => {
                  const sc = statusConfig[l.status];
                  const Icon = sc?.icon || UserCheck;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.employeeCode}</TableCell>
                      <TableCell>{l.name}</TableCell>
                      <TableCell>{l.time}</TableCell>
                      <TableCell>{l.type === "in" ? "دخول" : l.type === "out" ? "خروج" : "—"}</TableCell>
                      <TableCell>{l.device}</TableCell>
                      <TableCell><Badge variant="outline" className={sc.color}><Icon size={10} /> {sc.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Auto Rules */}
      <Card style={{ background: "rgba(45,107,94,0.08)", borderColor: "#2D6B5E" }}>
        <CardContent className="p-4">
          <h3 className="font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-400" /> قواعد حساب التأخير والغياب</h3>
          <div className="text-sm space-y-1" style={{ color: "var(--text-primary)" }}>
            <p>• الدخول قبل 8:00 = <span className="text-emerald-400">حاضر</span></p>
            <p>• الدخول بعد 8:05 = <span className="text-yellow-400">متأخر</span> (خصم 1/8 يوم)</p>
            <p>• عدم التسجيل = <span className="text-red-400">غائب</span> (يوم كامل)</p>
            <p>• التسجيل مرة واحدة فقط = <span className="text-yellow-400">غياب نصفي</span></p>
            <p>• 3 أيام غياب متتالية = <span className="text-red-400">تنبيه HR</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
