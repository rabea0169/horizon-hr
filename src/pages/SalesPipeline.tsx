import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, DollarSign, Target, Award, ArrowRight, X } from "lucide-react";
import { useOpportunities, usePipelineStages, usePipelineDashboard, useCreateOpportunity, useUpdateOpportunity, useMoveOpportunityStage } from "@/hooks/useLocalData";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-400",
  won: "bg-emerald-500/15 text-emerald-400",
  lost: "bg-red-500/15 text-red-400",
  on_hold: "bg-amber-500/15 text-amber-400",
};
const statusLabels: Record<string, string> = { open: "مفتوحة", won: "مربوحة", lost: "خاسرة", on_hold: "معلقة" };

export default function SalesPipeline() {
  const { data: opportunities, isLoading } = useOpportunities();
  const { data: dashboard } = usePipelineDashboard();
  const { data: stages } = usePipelineStages();
  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();
  const moveStageMutation = useMoveOpportunityStage();

  const [dialog, setDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<any>(null);
  const [form, setForm] = useState({ title: "", customerId: "", stageId: "", expectedValue: "", probability: "", expectedCloseDate: "", source: "", description: "" });

  const defaultStages = [
    { id: 1, name: "Lead", color: "#6B7280", order: 1, probability: 10 },
    { id: 2, name: "Qualified", color: "#3B82F6", order: 2, probability: 25 },
    { id: 3, name: "Proposal", color: "#8B5CF6", order: 3, probability: 50 },
    { id: 4, name: "Negotiation", color: "#F59E0B", order: 4, probability: 75 },
    { id: 5, name: "Closed", color: "#10B981", order: 5, probability: 100 },
  ];
  const activeStages = stages && stages.length > 0 ? stages : defaultStages;

  const getStageOpps = (stageId: number) => (opportunities || []).filter((o: any) => o.stageId === stageId && o.status === "open");

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>خط البيع</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة فرص البيع وتتبع مراحلها</p>
        </div>
        <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { setForm({ title: "", customerId: "", stageId: "", expectedValue: "", probability: "", expectedCloseDate: "", source: "", description: "" }); setDialog(true); }}>
          <Plus size={16} /> فرصة جديدة
        </Button>
      </div>

      {/* Dashboard */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "إجمالي الفرص", value: dashboard.total, icon: Target },
            { label: "مفتوحة", value: dashboard.open, icon: TrendingUp },
            { label: "مربوحة", value: dashboard.won, icon: Award },
            { label: "قيمة خط البيع", value: `${Number(dashboard.pipelineValue).toLocaleString("ar-EG")} ج.م`, icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)", opacity: 0.15 }}>
                  <Icon size={20} style={{ color: "var(--accent-color)" }} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: "var(--accent-color)" }}>{value}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pipeline Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto">
        {activeStages.map((stage: any) => {
          const stageOpps = getStageOpps(stage.id);
          const stageValue = stageOpps.reduce((sum: number, o: any) => sum + (parseFloat(o.expectedValue) || 0), 0);
          return (
            <Card key={stage.id} className="min-w-[200px]" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderTop: `3px solid ${stage.color}` }}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{stage.name}</h3>
                  <Badge variant="outline" className="text-xs">{stageOpps.length}</Badge>
                </div>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{stageValue.toLocaleString("ar-EG")} ج.م</p>
                <div className="space-y-2">
                  {stageOpps.map((opp: any) => (
                    <div key={opp.id} className="p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" style={{ background: "var(--bg-body)", border: "1px solid var(--border-color)" }} onClick={() => { setSelectedOpp(opp); setMoveDialog(true); }}>
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{opp.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs" style={{ color: "var(--accent-color)" }}>{parseFloat(opp.expectedValue || 0).toLocaleString("ar-EG")} ج.م</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{opp.probability || 0}%</span>
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{opp.customer?.name || "-"}</p>
                    </div>
                  ))}
                  {stageOpps.length === 0 && <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>لا توجد فرص</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg" dir="rtl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>فرصة بيع جديدة</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>العنوان *</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="طلب تصنيع 1000 قميص" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>العميل ID</label><Input value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} placeholder="1" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>المرحلة</label>
                <Select value={form.stageId} onValueChange={v => setForm({ ...form, stageId: v })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}><SelectValue /></SelectTrigger>
                  <SelectContent>{activeStages.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>القيمة المتوقعة</label><Input value={form.expectedValue} onChange={e => setForm({ ...form, expectedValue: e.target.value })} placeholder="50000" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>نسبة النجاح %</label><Input value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} placeholder="50" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>تاريخ الإغلاق المتوقع</label><Input type="date" value={form.expectedCloseDate} onChange={e => setForm({ ...form, expectedCloseDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div><label className="text-sm" style={{ color: "var(--text-muted)" }}>المصدر</label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="مكالمة، معرض، موقع..." className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter><Button onClick={() => createMutation.mutate({ ...form, customerId: Number(form.customerId), stageId: Number(form.stageId), expectedValue: form.expectedValue, probability: form.probability || undefined, expectedCloseDate: form.expectedCloseDate || undefined, source: form.source || undefined, description: form.description || undefined }, { onSuccess: () => setDialog(false) })} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Stage Dialog */}
      <Dialog open={moveDialog} onOpenChange={setMoveDialog}>
        <DialogContent className="max-w-sm" dir="rtl" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>نقل الفرصة</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {selectedOpp && <p className="text-sm" style={{ color: "var(--text-muted)" }}>الفرصة: <strong style={{ color: "var(--text-primary)" }}>{selectedOpp.title}</strong></p>}
            <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>اختر المرحلة الجديدة:</p>
            <div className="space-y-2">
              {activeStages.map((stage: any) => (
                <Button key={stage.id} variant="outline" className="w-full justify-between" onClick={() => { if (selectedOpp) moveStageMutation.mutate({ id: selectedOpp.id, stageId: stage.id, probability: String(stage.probability) }, { onSuccess: () => setMoveDialog(false) }); }}>
                  <span>{stage.name}</span>
                  <ArrowRight size={16} style={{ color: stage.color }} />
                </Button>
              ))}
            </div>
            <div className="border-t pt-2 mt-2">
              <Button variant="outline" className="w-full text-emerald-500" onClick={() => { if (selectedOpp) updateMutation.mutate({ id: selectedOpp.id, status: "won" }, { onSuccess: () => setMoveDialog(false) }); }}><Award size={16} className="ml-2" /> إغلاق مربوح</Button>
              <Button variant="outline" className="w-full text-red-500 mt-1" onClick={() => { if (selectedOpp) updateMutation.mutate({ id: selectedOpp.id, status: "lost" }, { onSuccess: () => setMoveDialog(false) }); }}><X size={16} className="ml-2" /> إغلاق خاسر</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


