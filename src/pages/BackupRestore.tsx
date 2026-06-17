import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Download, Upload, Trash2, Clock, CheckCircle, AlertTriangle, RotateCcw, HardDrive } from "lucide-react";

const BACKUPS = [
  { id: 1, name: "Auto-2026-06-12", date: "2026-06-12 02:00", size: "45.2 MB", type: "auto", status: "success", tables: 77, records: 15680 },
  { id: 2, name: "Auto-2026-06-11", date: "2026-06-11 02:00", size: "44.8 MB", type: "auto", status: "success", tables: 77, records: 15420 },
  { id: 3, name: "Auto-2026-06-10", date: "2026-06-10 02:00", size: "43.9 MB", type: "auto", status: "success", tables: 77, records: 15100 },
  { id: 4, name: "Auto-2026-06-09", date: "2026-06-09 02:00", size: "43.1 MB", type: "auto", status: "success", tables: 77, records: 14850 },
  { id: 5, name: "Auto-2026-06-08", date: "2026-06-08 02:00", size: "42.5 MB", type: "auto", status: "success", tables: 77, records: 14600 },
  { id: 6, name: "Manual-2026-06-07", date: "2026-06-07 14:30", size: "42.0 MB", type: "manual", status: "success", tables: 77, records: 14300 },
  { id: 7, name: "Auto-2026-06-07", date: "2026-06-07 02:00", size: "41.8 MB", type: "auto", status: "success", tables: 77, records: 14200 },
  { id: 8, name: "Auto-2026-06-06", date: "2026-06-06 02:00", size: "41.2 MB", type: "auto", status: "warning", tables: 76, records: 14000 },
];

export default function BackupRestore() {
  const [backups, setBackups] = useState(BACKUPS);
  const [restoring, setRestoring] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const handleBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      const newBackup = { id: Date.now(), name: `Manual-${new Date().toISOString().split("T")[0]}`, date: new Date().toLocaleString("en-GB"), size: "46.1 MB", type: "manual", status: "success", tables: 77, records: 15800 };
      setBackups([newBackup, ...backups]);
      setBackingUp(false);
    }, 2000);
  };

  const handleRestore = (_id: number) => {
    if (!confirm("استعادة هذا النسخة؟ سيتم استبدال البيانات الحالية.")) return;
    setRestoring(true);
    setTimeout(() => setRestoring(false), 3000);
  };

  const handleDelete = (id: number) => {
    if (!confirm("حذف النسخة؟")) return;
    setBackups(backups.filter(b => b.id !== id));
  };

  const handleExportSQL = () => {
    const sql = `-- Horizon HR Backup\n-- Date: ${new Date().toISOString()}\n-- Tables: 77\n-- Records: 15,680\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n-- [SQL dump would go here]\n\nSET FOREIGN_KEY_CHECKS = 1;`;
    const blob = new Blob([sql], { type: "text/sql" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `horizon_backup_${new Date().toISOString().split("T")[0]}.sql`;
    link.click();
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">النسخ الاحتياطي والاستعادة</h2></div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><HardDrive size={16} style={{ color: "var(--accent-color)" }} /><p className="text-2xl font-bold mt-1">{backups.length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>نسخ محفوظة</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><Database size={16} className="text-blue-400" /><p className="text-2xl font-bold mt-1">77</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>جدول</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><CheckCircle size={16} className="text-emerald-400" /><p className="text-2xl font-bold mt-1">15,680</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>سجل</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><Clock size={16} className="text-yellow-400" /><p className="text-2xl font-bold mt-1">02:00</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>وقت النسخ التلقائي</p></CardContent></Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="gap-1 text-white" style={{ background: "var(--accent-color)" }} onClick={handleBackup} disabled={backingUp}><Database size={14} /> {backingUp ? "جاري..." : "نسخ يدوي"}</Button>
        <Button variant="outline" className="gap-1" onClick={handleExportSQL}><Download size={14} /> تصدير SQL</Button>
        <Button variant="outline" className="gap-1"><Upload size={14} /> رفع نسخة</Button>
      </div>

      {/* Schedule */}
      <Card style={{ background: "rgba(45,107,94,0.08)", borderColor: "#2D6B5E" }}>
        <CardContent className="p-3 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400" /><span className="text-sm">النسخ التلقائي مفعل — كل يوم الساعة 02:00 ص — آخر 30 نسخة محفوظة</span></CardContent>
      </Card>

      {/* Backup List */}
      <div className="space-y-2">
        {backups.map(b => (
          <Card key={b.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-3 flex items-center gap-3">
              <Database size={16} style={{ color: "var(--accent-color)" }} />
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-medium text-sm">{b.name}</span><Badge variant="outline" className={b.type === "auto" ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}>{b.type === "auto" ? "تلقائي" : "يدوي"}</Badge>{b.status === "warning" && <Badge variant="outline" className="bg-yellow-500/15 text-yellow-400"><AlertTriangle size={10} /> تحذير</Badge>}</div>
                <div className="flex gap-3 text-xs mt-0.5" style={{ color: "var(--text-muted)" }}><span>{b.date}</span><span>{b.size}</span><span>{b.tables} جدول</span><span>{b.records.toLocaleString()} سجل</span></div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => handleRestore(b.id)} disabled={restoring}><RotateCcw size={12} /> استعادة</Button>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-red-400" onClick={() => handleDelete(b.id)}><Trash2 size={12} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
