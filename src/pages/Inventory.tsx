import { useState } from "react";
import { useInventory, type InventoryItem } from "@/hooks/useLocalData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportToCSV } from "@/lib/export";
import { Package, Plus, Download, Trash2, AlertTriangle, Search, Boxes } from "lucide-react";

const categoryLabels: Record<string, string> = {
  fabric: "أقمشة",
  thread: "خيوط",
  button: "أزرار",
  zipper: "سحابات",
  label: "تيكت وعلامات",
  packaging: "تعبئة وتغليف",
  finished_goods: "منتجات تامة",
  other: "أخرى",
};
const categoryColors: Record<string, string> = {
  fabric: "bg-purple-500/20 text-purple-400",
  thread: "bg-blue-500/20 text-blue-400",
  button: "bg-yellow-500/20 text-yellow-400",
  zipper: "bg-gray-500/20 text-gray-400",
  label: "bg-pink-500/20 text-pink-400",
  packaging: "bg-green-500/20 text-green-400",
  finished_goods: "bg-emerald-500/20 text-emerald-400",
  other: "bg-white/[0.04] text-white/60",
};

export default function InventoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [form, setForm] = useState({ code: "", name: "", category: "fabric" as InventoryItem["category"], unit: "متر", quantity: "", minLevel: "", unitPrice: "", supplier: "", location: "" });

  const { data: items, create, remove } = useInventory();

  const filtered = items.filter((item) => {
    const matchSearch = search === "" || item.name.includes(search) || item.code.includes(search) || (item.supplier || "").includes(search);
    const matchCat = catFilter === "all" || item.category === catFilter;
    return matchSearch && matchCat;
  });

  const lowStock = items.filter((item) => item.quantity <= item.minLevel).length;
  const totalValue = items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);

  const handleCreate = () => {
    create({
      code: form.code,
      name: form.name,
      category: form.category,
      unit: form.unit,
      quantity: Number(form.quantity),
      minLevel: Number(form.minLevel),
      unitPrice: form.unitPrice,
      supplier: form.supplier || undefined,
      location: form.location || undefined,
      lastRestocked: new Date().toISOString().split("T")[0],
    });
    setIsDialogOpen(false);
    setForm({ code: "", name: "", category: "fabric", unit: "متر", quantity: "", minLevel: "", unitPrice: "", supplier: "", location: "" });
  };

  const handleExport = () => {
    exportToCSV(
      "inventory",
      ["الكود", "الاسم", "التصنيف", "الوحدة", "الكمية", "الحد الأدنى", "السعر", "المورد", "الموقع"],
      filtered.map((item) => [
        item.code,
        item.name,
        categoryLabels[item.category],
        item.unit,
        String(item.quantity),
        String(item.minLevel),
        item.unitPrice,
        item.supplier || "",
        item.location || "",
      ])
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>المخزون والخامات</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة أقمشة وخيوط وإكسسوارات المصنع</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={handleExport}><Download size={16} className="ml-1.5" /> تصدير</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button className="text-white" style={{ background: "var(--accent-color)" }} onClick={() => setIsDialogOpen(true)}><Plus size={16} className="ml-1.5" /> إضافة صنف</Button>
            <DialogContent className="theme-card text-white max-w-lg">
              <DialogHeader><DialogTitle className="text-white text-right">صنف مخزون جديد</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4 text-right">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">الكود</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="theme-input text-right" placeholder="FAB-001" /></div>
                  <div className="space-y-2"><Label className="text-white/70">الاسم</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="theme-input text-right" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">التصنيف</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as InventoryItem["category"] })}><SelectTrigger className="theme-input text-right"><SelectValue /></SelectTrigger><SelectContent className="theme-input">{Object.entries(categoryLabels).map(([k, l]) => <SelectItem key={k} value={k} className="text-white text-right">{l}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-white/70">الوحدة</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="theme-input text-right" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">الكمية</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="theme-input text-right" /></div>
                  <div className="space-y-2"><Label className="text-white/70">حد أدنى</Label><Input type="number" value={form.minLevel} onChange={(e) => setForm({ ...form, minLevel: e.target.value })} className="theme-input text-right" /></div>
                  <div className="space-y-2"><Label className="text-white/70">سعر الوحدة</Label><Input value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="theme-input text-right" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-white/70">المورد</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="theme-input text-right" /></div>
                  <div className="space-y-2"><Label className="text-white/70">موقع التخزين</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="theme-input text-right" /></div>
                </div>
                <div className="flex gap-3 pt-2"><Button variant="outline" className="flex-1" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setIsDialogOpen(false)}>إلغاء</Button><Button className="flex-1 bg-[#4A2C3F] hover:bg-[#5A3C4F] text-white" disabled={!form.code || !form.name || !form.quantity} onClick={handleCreate}>إضافة</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الأصناف", value: items.length, icon: Boxes, color: "text-white" },
          { label: "قيمة المخزون", value: `${totalValue.toLocaleString()} ج`, icon: Package, color: "text-green-400" },
          { label: "نفاد الكمية", value: lowStock, icon: AlertTriangle, color: lowStock > 0 ? "text-red-400" : "text-green-400" },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" /><Input placeholder="بحث باسم أو كود أو مورد..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9 bg-[#1C1C1E] border-white/[0.08] text-white text-right" /></div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48 bg-[#1C1C1E] border-white/[0.08] text-white text-right"><SelectValue placeholder="كل التصنيفات" /></SelectTrigger>
          <SelectContent className="theme-input">
            <SelectItem value="all" className="text-white text-right">كل التصنيفات</SelectItem>
            {Object.entries(categoryLabels).map(([k, l]) => <SelectItem key={k} value={k} className="text-white text-right">{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.08] hover:bg-transparent">
                  <TableHead className="text-white/50 font-medium text-right">الكود</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الاسم</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">التصنيف</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الكمية</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">الحد الأدنى</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">السعر</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">القيمة</TableHead>
                  <TableHead className="text-white/50 font-medium text-right">المورد</TableHead>
                  <TableHead className="text-white/50 font-medium text-left">حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-white/40">
                      <Package size={32} className="mx-auto mb-3 opacity-50" />
                      <p>لا توجد أصناف</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => {
                    const isLow = item.quantity <= item.minLevel;
                    const itemValue = item.quantity * Number(item.unitPrice);
                    return (
                      <TableRow key={item.id} className={`border-white/[0.04] hover:bg-white/[0.02] ${isLow ? "bg-red-500/5" : ""}`}>
                        <TableCell className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.code}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.name}</TableCell>
                        <TableCell><span className={`px-2 py-0.5 rounded text-xs ${categoryColors[item.category]}`}>{categoryLabels[item.category]}</span></TableCell>
                        <TableCell className="text-sm">
                          <span className={`font-medium ${isLow ? "text-red-400" : "text-white"}`}>{item.quantity}</span>
                          <span className="text-xs text-white/40 mr-1">{item.unit}</span>
                          {isLow && <AlertTriangle size={12} className="inline mr-1 text-red-400" />}
                        </TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-muted)" }}>{item.minLevel}</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.unitPrice} ج</TableCell>
                        <TableCell className="text-sm text-green-400">{itemValue.toLocaleString()} ج</TableCell>
                        <TableCell className="text-sm" style={{ color: "var(--text-muted)" }}>{item.supplier || "—"}</TableCell>
                        <TableCell className="text-left">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300" onClick={() => remove(item.id)}><Trash2 size={14} /></Button>
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
