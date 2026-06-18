import { useState } from "react";
import { useCRMCustomers, useCRMInteractions, useSalesOrders, type CRMCustomer, type CRMInteraction } from "@/hooks/useLocalData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Users, Phone, Mail, MapPin, MessageCircle } from "lucide-react";

const catLabels: Record<string, string> = { wholesale: "جملة", retail: "تجزئة", export: "تصدير", online: "أونلاين" };
const catColors: Record<string, string> = { wholesale: "bg-blue-500/15 text-blue-400", retail: "bg-emerald-500/15 text-emerald-400", export: "bg-purple-500/15 text-purple-400", online: "bg-cyan-500/15 text-cyan-400" };
const statusColors: Record<string, string> = { active: "bg-emerald-500/15 text-emerald-400", inactive: "bg-gray-500/15 text-gray-400", prospect: "bg-amber-500/15 text-amber-400" };
const intTypeLabels: Record<string, string> = { call: "مكالمة", visit: "زيارة", email: "بريد", meeting: "اجتماع", complaint: "شكوى" };

export default function CRM() {
  const { data: customers, create: createCustomer, update: updateCustomer, remove: removeCustomer } = useCRMCustomers();
  const { data: interactions, create: createInteraction, remove: removeInteraction } = useCRMInteractions();
  const { data: salesOrders } = useSalesOrders();

  const [search, setSearch] = useState("");
  const [custDialog, setCustDialog] = useState(false);
  const [intDialog, setIntDialog] = useState(false);
  const [editing, setEditing] = useState<CRMCustomer | null>(null);
  const [custForm, setCustForm] = useState<{ name: string; company: string; phone: string; email: string; address: string; category: string; status: string; notes: string }>({ name: "", company: "", phone: "", email: "", address: "", category: "wholesale", status: "active", notes: "" });
  const [intForm, setIntForm] = useState({ customerId: "", type: "call" as CRMInteraction["type"], date: "", summary: "", followUpDate: "" });

  const resetCust = () => { setCustForm({ name: "", company: "", phone: "", email: "", address: "", category: "wholesale", status: "active", notes: "" }); setEditing(null); };
  const resetInt = () => { setIntForm({ customerId: "", type: "call", date: "", summary: "", followUpDate: "" }); };

  const handleSaveCust = () => {
    if (!custForm.name.trim() || !custForm.phone.trim()) return;
    if (editing) updateCustomer(editing.id, custForm);
    else createCustomer(custForm);
    setCustDialog(false); resetCust();
  };

  const handleSaveInt = () => {
    if (!intForm.customerId || !intForm.summary.trim()) return;
    const cust = customers.find((c) => String(c.id) === intForm.customerId);
    createInteraction({ customerId: Number(intForm.customerId), customerName: cust?.name || "", type: intForm.type, date: intForm.date, summary: intForm.summary, followUpDate: intForm.followUpDate || undefined });
    setIntDialog(false); resetInt();
  };

  const filteredCust = customers.filter((c) => String(c.name ?? "").includes(search) || String(c.phone ?? "").includes(search));
  const filteredInt = interactions.filter((i) => String(i.customerName ?? "").includes(search));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>CRM - إدارة العملاء</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تتبع العملاء والتفاعلات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => { resetInt(); setIntDialog(true); }}><MessageCircle size={16} /> تفاعل</Button>
          <Button className="gap-2 text-white" style={{ background: "var(--accent-color)" }} onClick={() => { resetCust(); setCustDialog(true); }}><Plus size={16} /> عميل جديد</Button>
        </div>
      </div>

      <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />

      <Tabs defaultValue="customers">
        <TabsList className="w-full" style={{ background: "var(--bg-input)" }}>
          <TabsTrigger value="customers" className="flex-1">العملاء</TabsTrigger>
          <TabsTrigger value="interactions" className="flex-1">التفاعلات</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCust.map((c) => {
              const custOrders = salesOrders.filter((o) => o.customerName === c.name);
              return (
                <Card key={c.id} style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm" style={{ color: "var(--text-primary)" }}>{c.name}</CardTitle>
                      <Badge variant="outline" className={statusColors[c.status]}>{c.status === "active" ? "نشط" : c.status === "inactive" ? "غير نشط" : "محتمل"}</Badge>
                    </div>
                    {c.company && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.company}</p>}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${catColors[c.category]}`}>{catLabels[c.category]}</Badge>
                    </div>
                    <p className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><Phone size={14} /> {c.phone}</p>
                    {c.email && <p className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><Mail size={14} /> {c.email}</p>}
                    {c.address && <p className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><MapPin size={14} /> {c.address}</p>}
                    <div className="flex justify-between pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{custOrders.length} أمر</span>
                      <span className="text-xs font-bold text-amber-400">{custOrders.reduce((s, o) => s + Number(o.totalAmount), 0).toLocaleString()} ج</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setCustForm({ name: c.name, company: c.company || "", phone: c.phone, email: c.email || "", address: c.address || "", category: c.category, status: c.status, notes: c.notes || "" }); setCustDialog(true); }}><Pencil size={14} style={{ color: "var(--text-muted)" }} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) removeCustomer(c.id); }}><Trash2 size={14} className="text-red-400" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredCust.length === 0 && <div className="col-span-full text-center py-12" style={{ color: "var(--text-muted)" }}><Users size={32} className="mx-auto mb-3 opacity-50" /><p>لا يوجد عملاء</p></div>}
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="mt-4">
          <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: "var(--border-color)" }}>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>العميل</TableHead>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>النوع</TableHead>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>التاريخ</TableHead>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>الملخص</TableHead>
                      <TableHead className="text-right" style={{ color: "var(--text-muted)" }}>متابعة</TableHead>
                      <TableHead className="text-left" style={{ color: "var(--text-muted)" }}>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInt.map((i) => (
                      <TableRow key={i.id} style={{ borderColor: "var(--border-color)" }}>
                        <TableCell style={{ color: "var(--text-primary)" }}>{i.customerName}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{intTypeLabels[i.type]}</Badge></TableCell>
                        <TableCell style={{ color: "var(--text-secondary)" }}>{i.date}</TableCell>
                        <TableCell style={{ color: "var(--text-secondary)" }}>{i.summary}</TableCell>
                        <TableCell style={{ color: i.followUpDate ? "#E85D4A" : "var(--text-muted)" }}>{i.followUpDate || "—"}</TableCell>
                        <TableCell className="text-left"><Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف؟")) removeInteraction(i.id); }}><Trash2 size={14} className="text-red-400" /></Button></TableCell>
                      </TableRow>
                    ))}
                    {filteredInt.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8" style={{ color: "var(--text-muted)" }}>لا توجد تفاعلات</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Dialog */}
      <Dialog open={custDialog} onOpenChange={setCustDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>{editing ? "تعديل" : "عميل جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الاسم</Label><Input value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الشركة</Label><Input value={custForm.company} onChange={(e) => setCustForm({ ...custForm, company: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تليفون</Label><Input value={custForm.phone} onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>بريد</Label><Input value={custForm.email} onChange={(e) => setCustForm({ ...custForm, email: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التصنيف</Label>
                <Select value={custForm.category} onValueChange={(v) => setCustForm({ ...custForm, category: v as CRMCustomer["category"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{Object.entries(catLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-right">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الحالة</Label>
                <Select value={custForm.status} onValueChange={(v) => setCustForm({ ...custForm, status: v as CRMCustomer["status"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                    <SelectItem value="active" className="text-right">نشط</SelectItem>
                    <SelectItem value="inactive" className="text-right">غير نشط</SelectItem>
                    <SelectItem value="prospect" className="text-right">محتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>ملاحظات</Label><Input value={custForm.notes} onChange={(e) => setCustForm({ ...custForm, notes: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleSaveCust} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interaction Dialog */}
      <Dialog open={intDialog} onOpenChange={setIntDialog}>
        <DialogContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} dir="rtl">
          <DialogHeader><DialogTitle style={{ color: "var(--text-primary)" }}>تفاعل جديد</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-right">
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>العميل</Label>
              <Select value={intForm.customerId} onValueChange={(v) => setIntForm({ ...intForm, customerId: v })}>
                <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)} className="text-right">{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>النوع</Label>
                <Select value={intForm.type} onValueChange={(v) => setIntForm({ ...intForm, type: v as CRMInteraction["type"] })}>
                  <SelectTrigger style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>{Object.entries(intTypeLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-right">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>التاريخ</Label><Input type="date" value={intForm.date} onChange={(e) => setIntForm({ ...intForm, date: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            </div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>الملخص</Label><Input value={intForm.summary} onChange={(e) => setIntForm({ ...intForm, summary: e.target.value })} className="text-right" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label style={{ color: "var(--text-secondary)" }}>تاريخ المتابعة</Label><Input type="date" value={intForm.followUpDate} onChange={(e) => setIntForm({ ...intForm, followUpDate: e.target.value })} style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntDialog(false)} style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }}>إلغاء</Button>
            <Button onClick={handleSaveInt} className="text-white" style={{ background: "var(--accent-color)" }}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
