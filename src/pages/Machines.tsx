import { useState } from "react";
import { useMachines, useProductionLines, type Machine } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cog, Plus, Wrench, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const typeLabels: Record<string, string> = {
  sewing: "خياطة",
  cutting: "قص",
  pressing: "كي",
  packing: "تعبئة",
  other: "أخرى",
};

const statusStyles: Record<string, string> = {
  operational: "badge-active",
  maintenance: "badge-pending",
  broken: "badge-inactive",
  idle: "bg-white/[0.04] text-white/60",
};
const statusLabels: Record<string, string> = {
  operational: "تعمل",
  maintenance: "صيانة",
  broken: "معطلة",
  idle: "خاملة",
};

const statusIcons: Record<string, typeof CheckCircle> = {
  operational: CheckCircle,
  maintenance: Wrench,
  broken: XCircle,
  idle: AlertTriangle,
};

export default function MachinesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "sewing" as Machine["type"], lineId: "", lastMaintenance: "", nextMaintenance: "" });

  const { data: machines, create, update } = useMachines();
  const { data: lines } = useProductionLines();

  const operationalCount = machines.filter((m) => m.status === "operational").length;
  const maintenanceCount = machines.filter((m) => m.status === "maintenance").length;
  const brokenCount = machines.filter((m) => m.status === "broken").length;

  const handleCreate = () => {
    const line = lines.find((l) => l.id === Number(form.lineId));
    create({
      name: form.name,
      code: form.code,
      type: form.type,
      lineId: line?.id,
      lineName: line?.name,
      status: "operational",
      lastMaintenance: form.lastMaintenance || undefined,
      nextMaintenance: form.nextMaintenance || undefined,
    });
    setIsDialogOpen(false);
    setForm({ name: "", code: "", type: "sewing", lineId: "", lastMaintenance: "", nextMaintenance: "" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>الماكينات</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة ماكينات المصنع والصيانة</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsDialogOpen(true)}>
            <Plus size={16} className="ml-1.5" /> إضافة ماكينة
          </Button>
          <DialogContent className="theme-card text-white max-w-lg">
            <DialogHeader><DialogTitle className="text-white text-right">ماكينة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-white/70">اسم الماكينة</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="theme-input text-right" /></div>
                <div className="space-y-2"><Label className="text-white/70">الكود</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="theme-input text-right" placeholder="MCH-XXX" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-white/70">النوع</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Machine["type"] })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{Object.entries(typeLabels).map(([k, l]) => <SelectItem key={k} value={k} className="text-white text-right">{l}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-white/70">خط الإنتاج</Label><Select value={form.lineId} onValueChange={(v) => setForm({ ...form, lineId: v })}><SelectTrigger className="theme-input text-right"><SelectValue placeholder="اختر الخط" /></SelectTrigger><SelectContent className="theme-input">{lines.map((l) => <SelectItem key={l.id} value={String(l.id)} className="text-white text-right">{l.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-white/70">آخر صيانة</Label><Input type="date" value={form.lastMaintenance} onChange={(e) => setForm({ ...form, lastMaintenance: e.target.value })} className="theme-input text-right" /></div>
                <div className="space-y-2"><Label className="text-white/70">الصيانة القادمة</Label><Input type="date" value={form.nextMaintenance} onChange={(e) => setForm({ ...form, nextMaintenance: e.target.value })} className="theme-input text-right" /></div>
              </div>
              <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!form.name || !form.code} onClick={handleCreate}>إضافة</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "تعمل", value: operationalCount, icon: CheckCircle, color: "text-green-400" },
          { label: "صيانة", value: maintenanceCount, icon: Wrench, color: "text-yellow-400" },
          { label: "معطلة", value: brokenCount, icon: XCircle, color: "text-red-400" },
        ].map((item) => (
          <Card key={item.label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <item.icon size={18} className={item.color} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
              </div>
              <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Machines Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium text-right">الكود</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الاسم</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">النوع</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الخط</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الحالة</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">آخر صيانة</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الصيانة القادمة</TableHead>
                  <TableHead className="text-white/50 font-medium text-left">تغيير</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-white/40">
                      <Cog size={32} className="mx-auto mb-3 opacity-50" />
                      <p>لا توجد ماكينات مسجلة</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  machines.map((machine) => {
                    const StatusIcon = statusIcons[machine.status];
                    const isOverdue = machine.nextMaintenance && new Date(machine.nextMaintenance) < new Date();
                    return (
                      <TableRow key={machine.id} className="border-white/[0.04] hover:bg-white/[0.02]">
                        <TableCell className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{machine.code}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{machine.name}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{typeLabels[machine.type]}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{machine.lineName || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <StatusIcon size={12} />
                            <Badge variant="outline" className={statusStyles[machine.status]}>{statusLabels[machine.status]}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{machine.lastMaintenance || "—"}</TableCell>
                        <TableCell className={`text-sm ${isOverdue ? "text-red-400 font-semibold" : "text-white/70"}`}>{machine.nextMaintenance || "—"} {isOverdue && "(متأخرة)"}</TableCell>
                        <TableCell className="text-left">
                          <div className="flex gap-1">
                            {machine.status !== "operational" && <Button size="sm" variant="ghost" className="h-7 text-xs text-green-400" onClick={() => update(machine.id, { status: "operational" })}>تشغيل</Button>}
                            {machine.status !== "maintenance" && <Button size="sm" variant="ghost" className="h-7 text-xs text-yellow-400" onClick={() => update(machine.id, { status: "maintenance" })}>صيانة</Button>}
                            {machine.status !== "broken" && <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400" onClick={() => update(machine.id, { status: "broken" })}>عطل</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
