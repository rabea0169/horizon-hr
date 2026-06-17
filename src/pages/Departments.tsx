import { useState } from "react";
import { useDepartments, useEmployees } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, Users, Search } from "lucide-react";

const colorOptions = ["#4A2C3F", "#2C4A3F", "#3F2C4A", "#4A3F2C", "#2C3F4A", "#E85D4A", "#5A4AE8", "#C9911A", "#2D8A4E", "#7C3AED"];

export default function Departments() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#4A2C3F" });

  const { data: departments, create, update, remove } = useDepartments();
  const { data: employees } = useEmployees();

  const filtered = departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  const reset = () => { setForm({ name: "", description: "", color: "#4A2C3F" }); setEditingId(null); };

  const handleEdit = (dept: typeof departments[0]) => { setForm({ name: dept.name, description: dept.description || "", color: dept.color || "#4A2C3F" }); setEditingId(dept.id); setIsDialogOpen(true); };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingId) update(editingId, form); else create(form); setIsDialogOpen(false); reset(); };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>الأقسام</h2><p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة هيكل الأقسام</p></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={reset}><Plus size={16} className="ml-1.5" />إضافة قسم</Button>
          <DialogContent className="theme-card text-white"><DialogHeader><DialogTitle className="text-white text-right">{editingId ? "تعديل قسم" : "إضافة قسم"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-right">
              <div className="space-y-2"><Label className="text-white/70">الاسم</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="theme-input text-right" required /></div>
              <div className="space-y-2"><Label className="text-white/70">الوصف</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="theme-input text-right" /></div>
              <div className="space-y-2"><Label className="text-white/70">اللون</Label><div className="flex gap-2 flex-wrap">{colorOptions.map((c) => <button key={c} type="button" className={`w-8 h-8 rounded-lg transition-transform ${form.color === c ? "ring-2 ring-white scale-110" : "hover:scale-105"}`} style={{ backgroundColor: c }} onClick={() => setForm({ ...form, color: c })} />)}</div></div>
              <div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button><Button type="submit" className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white">{editingId ? "تحديث" : "حفظ"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm"><Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" /><Input placeholder="بحث في الأقسام..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9 bg-[#1C1C1E] border-white/[0.08] text-white text-right" /></div>

      {filtered.length === 0 ? <div className="text-center py-16 text-white/40"><Building2 size={40} className="mx-auto mb-3 opacity-50" /><p>لا يوجد أقسام</p></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => {
            const deptEmps = employees.filter((e) => e.departmentId === dept.id);
            return (
              <Card key={dept.id} className="theme-card hover:border-[#4A2C3F]/50 transition-all cursor-pointer group" onClick={() => setExpandedId(expandedId === dept.id ? null : dept.id)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: dept.color || "#4A2C3F" }}><Building2 size={18} style={{ color: "var(--text-primary)" }} /></div>
                      <div className="text-right"><h3 className="font-semibold text-white">{dept.name}</h3><p className="text-xs text-white/45 flex items-center gap-1 mt-0.5"><Users size={10} />{deptEmps.length} موظف</p></div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/40 hover:text-white" onClick={(e) => { e.stopPropagation(); handleEdit(dept); }}><Pencil size={12} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-white/40 hover:text-red-400" onClick={(e) => { e.stopPropagation(); if (confirm("حذف هذا القسم؟")) remove(dept.id); }}><Trash2 size={12} /></Button>
                    </div>
                  </div>
                  {dept.description && <p className="text-sm text-white/50 mt-3 line-clamp-2 text-right">{dept.description}</p>}
                  {expandedId === dept.id && deptEmps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-white/40 text-right">أعضاء الفريق</p>
                      {deptEmps.map((emp) => <div key={emp.id} className="flex items-center gap-2 text-sm text-white/70"><div className="w-5 h-5 rounded-full bg-[#4A2C3F]/30 flex items-center justify-center text-[10px] text-white">{emp.fullName.charAt(0)}</div>{emp.fullName}<span className="text-white/30 text-xs mr-auto">{emp.jobTitle}</span></div>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>}
    </div>
  );
}
