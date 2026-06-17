import { useState } from "react";
import { useProductionModels, type ProductionModel, type ProductionStage } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Layers, Tag, FileText, User, ArrowUp, ArrowDown, X } from "lucide-react";

const stageColor = (name: string) => {
  if (name.includes("قص")) return "bg-orange-500/15 text-orange-400 border-orange-500/20";
  if (name.includes("خياط")) return "bg-blue-500/15 text-blue-400 border-blue-500/20";
  if (name.includes("كي")) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  if (name.includes("تغليف")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
  return "bg-gray-500/15 text-gray-400 border-gray-500/20";
};

export default function ProductionModels() {
  const { data: models, create, update, remove, addStage, updateStage, removeStage } = useProductionModels();
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<ProductionModel | null>(null);
  const [stageDialog, setStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<{ modelId: number; stage: ProductionStage } | null>(null);

  // Form state
  const [form, setForm] = useState<{ code: string; name: string; description: string; customerName: string; status: string }>({ code: "", name: "", description: "", customerName: "", status: "active" });
  const [stagesForm, setStagesForm] = useState<{ name: string; unitPrice: string }[]>([
    { name: "قص", unitPrice: "" },
    { name: "خياطة", unitPrice: "" },
    { name: "كي", unitPrice: "" },
    { name: "تغليف", unitPrice: "" },
  ]);

  // Stage form
  const [stageForm, setStageForm] = useState({ name: "", unitPrice: "" });

  const resetForm = () => {
    setForm({ code: "", name: "", description: "", customerName: "", status: "active" });
    setStagesForm([
      { name: "قص", unitPrice: "" },
      { name: "خياطة", unitPrice: "" },
      { name: "كي", unitPrice: "" },
      { name: "تغليف", unitPrice: "" },
    ]);
    setEditingModel(null);
  };

  const openAdd = () => {
    resetForm();
    setOpenDialog(true);
  };

  const openEdit = (model: ProductionModel) => {
    setEditingModel(model);
    setForm({
      code: model.code,
      name: model.name,
      description: model.description || "",
      customerName: model.customerName || "",
      status: model.status,
    });
    setStagesForm(model.stages.map((s) => ({ name: s.name, unitPrice: s.unitPrice })));
    setOpenDialog(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      stages: stagesForm.filter((s) => s.name.trim() && s.unitPrice.trim()).map((s, i) => ({ name: s.name, unitPrice: s.unitPrice, order: i + 1 })),
    };
    if (editingModel) {
      update(editingModel.id, payload as any);
    } else {
      create(payload as any);
    }
    setOpenDialog(false);
    resetForm();
  };

  const openStageEdit = (modelId: number, stage: ProductionStage) => {
    setEditingStage({ modelId, stage });
    setStageForm({ name: stage.name, unitPrice: stage.unitPrice });
    setStageDialog(true);
  };

  const handleSaveStage = () => {
    if (!editingStage || !stageForm.name.trim() || !stageForm.unitPrice.trim()) return;
    updateStage(editingStage.modelId, editingStage.stage.id, {
      name: stageForm.name,
      unitPrice: stageForm.unitPrice,
    });
    setStageDialog(false);
    setEditingStage(null);
    setStageForm({ name: "", unitPrice: "" });
  };

  const handleAddStageToModel = (modelId: number) => {
    if (!stageForm.name.trim() || !stageForm.unitPrice.trim()) return;
    const model = models.find((m) => m.id === modelId);
    const order = model ? model.stages.length + 1 : 1;
    addStage(modelId, { name: stageForm.name, unitPrice: stageForm.unitPrice, order });
    setStageForm({ name: "", unitPrice: "" });
  };

  const moveStage = (modelId: number, stageId: number, direction: "up" | "down") => {
    const model = models.find((m) => m.id === modelId);
    if (!model) return;
    const idx = model.stages.findIndex((s) => s.id === stageId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === model.stages.length - 1) return;
    const newStages = [...model.stages];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newStages[idx], newStages[swapIdx]] = [newStages[swapIdx], newStages[idx]];
    // Update order numbers
    newStages.forEach((s, i) => { s.order = i + 1; });
    update(modelId, { stages: newStages });
  };

  const filteredModels = models.filter((m) =>
    m.name.includes(search) || m.code.includes(search) || (m.customerName && m.customerName.includes(search))
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>موديلات الإنتاج</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>إدارة موديلات الملابس ومراحل التصنيع وسعر كل مرحلة</p>
        </div>
        <Button onClick={openAdd} className="gap-2 text-white" style={{ background: "var(--accent-color)" }}>
          <Plus size={16} /> موديل جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)" + "20" }}>
              <Layers size={20} style={{ color: "var(--accent-color)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{models.length}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الموديلات</p>
            </div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)" + "20" }}>
              <Tag size={20} style={{ color: "var(--accent-color)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{models.filter((m) => m.status === "active").length}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>موديلات نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)" + "20" }}>
              <FileText size={20} style={{ color: "var(--accent-color)" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{models.reduce((acc, m) => acc + m.stages.length, 0)}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي المراحل</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="بحث باسم الموديل أو الكود أو العميل..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md text-right"
        style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
      />

      {/* Models Table */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader>
          <CardTitle className="text-base" style={{ color: "var(--text-primary)" }}>قائمة الموديلات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "var(--border-color)" }}>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الكود</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>اسم الموديل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>العميل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>المراحل</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الحالة</TableHead>
                  <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map((model) => (
                  <TableRow key={model.id} style={{ borderColor: "var(--border-color)" }}>
                    <TableCell className="font-mono text-xs" style={{ color: "var(--accent-color)" }}>{model.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>{model.name}</p>
                        {model.description && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{model.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell style={{ color: "var(--text-secondary)" }}>{model.customerName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {model.stages.map((s) => (
                          <Badge key={s.id} variant="outline" className={`text-[10px] ${stageColor(s.name)}`}>
                            {s.name} ({parseFloat(s.unitPrice).toFixed(2)} ج)
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={model.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                          : "bg-gray-500/15 text-gray-400 border-gray-500/20"
                        }
                      >
                        {model.status === "active" ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(model)}>
                          <Pencil size={14} style={{ color: "var(--text-muted)" }} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (confirm("هل أنت متأكد من حذف هذا الموديل؟")) remove(model.id); }}>
                          <Trash2 size={14} className="text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredModels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                      لا توجد موديلات مطابقة للبحث
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Model Detail Cards — Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredModels.map((model) => (
          <Card key={model.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {model.code} — {model.name}
                </CardTitle>
                <Badge variant="outline" className={model.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-gray-500/15 text-gray-400 border-gray-500/20"}>
                  {model.status === "active" ? "نشط" : "غير نشط"}
                </Badge>
              </div>
              {model.customerName && (
                <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <User size={10} /> {model.customerName}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: "var(--border-color)" }}>
                    <TableHead className="text-right text-xs" style={{ color: "var(--text-muted)" }}>الترتيب</TableHead>
                    <TableHead className="text-right text-xs" style={{ color: "var(--text-muted)" }}>المرحلة</TableHead>
                    <TableHead className="text-right text-xs" style={{ color: "var(--text-muted)" }}>سعر القطعة</TableHead>
                    <TableHead className="text-right text-xs" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {model.stages.map((stage, idx) => (
                    <TableRow key={stage.id} style={{ borderColor: "var(--border-color)" }}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${stageColor(stage.name)}`}>
                          {stage.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>
                        {parseFloat(stage.unitPrice).toFixed(2)} ج
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(model.id, stage.id, "up")} disabled={idx === 0}>
                            <ArrowUp size={12} style={{ color: "var(--text-muted)" }} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(model.id, stage.id, "down")} disabled={idx === model.stages.length - 1}>
                            <ArrowDown size={12} style={{ color: "var(--text-muted)" }} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStageEdit(model.id, stage)}>
                            <Pencil size={12} style={{ color: "var(--text-muted)" }} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("حذف المرحلة؟")) removeStage(model.id, stage.id); }}>
                            <X size={12} className="text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Add stage inline */}
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
                <Input
                  placeholder="مرحلة جديدة"
                  value={stageForm.name}
                  onChange={(e) => setStageForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-8 text-xs text-right"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                />
                <Input
                  placeholder="السعر"
                  type="number"
                  step="0.01"
                  value={stageForm.unitPrice}
                  onChange={(e) => setStageForm((p) => ({ ...p, unitPrice: e.target.value }))}
                  className="h-8 text-xs w-24 text-right"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                />
                <Button size="sm" className="h-8 text-xs whitespace-nowrap text-white" style={{ background: "var(--accent-color)" }} onClick={() => handleAddStageToModel(model.id)}>
                  <Plus size={12} className="ml-1" /> إضافة
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>
              {editingModel ? "تعديل موديل" : "موديل جديد"}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info">
            <TabsList className="w-full" style={{ background: "var(--bg-input)" }}>
              <TabsTrigger value="info" className="flex-1">البيانات</TabsTrigger>
              <TabsTrigger value="stages" className="flex-1">المراحل</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: "var(--text-secondary)" }}>الكود</Label>
                  <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="مثال: MDL-009" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
                </div>
                <div className="space-y-2">
                  <Label style={{ color: "var(--text-secondary)" }}>الحالة</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full h-9 rounded-md border px-2 text-sm"
                    style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>اسم الموديل</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="مثال: تيشيرت راوند نيك" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>الوصف</Label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="وصف الموديل" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "var(--text-secondary)" }}>اسم العميل</Label>
                <Input value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} placeholder="اسم العميل (اختياري)" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              </div>
            </TabsContent>
            <TabsContent value="stages" className="space-y-4 mt-4">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>أدخل مراحل التصنيع وسعر كل مرحلة (أجر العامل لكل قطعة)</p>
              {stagesForm.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs w-6 text-center" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                  <Input
                    placeholder="اسم المرحلة"
                    value={s.name}
                    onChange={(e) => {
                      const updated = [...stagesForm];
                      updated[i].name = e.target.value;
                      setStagesForm(updated);
                    }}
                    className="flex-1 text-right"
                    style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                  />
                  <Input
                    placeholder="السعر"
                    type="number"
                    step="0.01"
                    value={s.unitPrice}
                    onChange={(e) => {
                      const updated = [...stagesForm];
                      updated[i].unitPrice = e.target.value;
                      setStagesForm(updated);
                    }}
                    className="w-28 text-right"
                    style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>ج/قطعة</span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setStagesForm([...stagesForm, { name: "", unitPrice: "" }])}
                style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
              >
                <Plus size={12} className="ml-1" /> إضافة مرحلة
              </Button>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenDialog(false); resetForm(); }} style={{ borderColor: "var(--border-color)" }}>إلغاء</Button>
            <Button onClick={handleSave} className="text-white" style={{ background: "var(--accent-color)" }}>
              {editingModel ? "حفظ التعديلات" : "إنشاء الموديل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Edit Dialog */}
      <Dialog open={stageDialog} onOpenChange={setStageDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>تعديل مرحلة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>اسم المرحلة</Label>
              <Input value={stageForm.name} onChange={(e) => setStageForm((p) => ({ ...p, name: e.target.value }))} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary)" }}>سعر القطعة (جنيه)</Label>
              <Input value={stageForm.unitPrice} onChange={(e) => setStageForm((p) => ({ ...p, unitPrice: e.target.value }))} type="number" step="0.01" className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialog(false)} style={{ borderColor: "var(--border-color)" }}>إلغاء</Button>
            <Button onClick={handleSaveStage} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
