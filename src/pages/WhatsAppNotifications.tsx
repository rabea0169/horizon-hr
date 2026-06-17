import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MessageCircle, Send, AlertTriangle, CheckCircle, Phone } from "lucide-react";

const NOTIFICATION_RULES = [
  { id: 1, event: "تأخر تسليم أمر بيع", trigger: "SO فات موعد التسليم بـ 3 أيام", recipients: "مدير المبيعات", channel: "whatsapp", active: true },
  { id: 2, event: "مخزون منخفض", trigger: "الكمية ≤ الحد الأدنى", recipients: "أمين المخزن + المشتريات", channel: "whatsapp", active: true },
  { id: 3, event: "صيانة وقائية مستحقة", trigger: "تاريخ الصيانة أصبح اليوم", recipients: "مهندس الصيانة", channel: "sms", active: true },
  { id: 4, event: "غياب 3 أيام متتالية", trigger: "عامل غائب 3 أيام متتالية", recipients: "HR + المشرف", channel: "whatsapp", active: true },
  { id: 5, event: "فشل فحص AQL", trigger: "عيوب > حد الرفض", recipients: "مشرف الجودة", channel: "whatsapp", active: true },
  { id: 6, event: "أمر شراء لم يستلم", trigger: "7 أيام من تاريخ PO بدون GRN", recipients: "مدير المشتريات", channel: "sms", active: false },
  { id: 7, event: "تجاوز ساعات إضافية", trigger: "40 ساعة إضافية/شهر", recipients: "المحاسب", channel: "sms", active: true },
];

const TEMPLATES = [
  { id: 1, name: "تأخر تسليم", message: "تنبيه: أمر البيع {order_number} للعميل {customer} تأخر عن التسليم المجدول بتاريخ {due_date}. الرجاء المتابعة العاجلة." },
  { id: 2, name: "مخزون منخفض", message: "تنبيه مخزون: صنف {item_name} وصل للحد الأدنى. الرصيد الحالي: {current_stock}. الرجاء الطلب الفوري." },
  { id: 3, name: "غياب متكرر", message: "تنبيه HR: العامل {employee_name} غائب {absent_days} أيام متتالية. الرجاء المتابعة." },
];

export default function WhatsAppNotifications() {
  const [rules, setRules] = useState(NOTIFICATION_RULES);
  const [phone, setPhone] = useState("+20");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const toggleRule = (id: number) => setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const handleSendTest = () => {
    setSending(true);
    setTimeout(() => setSending(false), 1500);
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">إشعارات WhatsApp و SMS</h2><Badge variant="outline" className="bg-emerald-500/15 text-emerald-400"><CheckCircle size={12} /> متصل</Badge></div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><MessageCircle size={16} className="text-emerald-400" /><p className="text-2xl font-bold mt-1">{rules.filter(r => r.active && r.channel === "whatsapp").length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>WhatsApp نشط</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><Phone size={16} className="text-blue-400" /><p className="text-2xl font-bold mt-1">{rules.filter(r => r.active && r.channel === "sms").length}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>SMS نشط</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><Send size={16} style={{ color: "var(--accent-color)" }} /><p className="text-2xl font-bold mt-1">156</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>إشعار هذا الشهر</p></CardContent></Card>
        <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}><CardContent className="p-3"><AlertTriangle size={16} className="text-yellow-400" /><p className="text-2xl font-bold mt-1">3</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>تحذيرات اليوم</p></CardContent></Card>
      </div>

      {/* Send Test */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><Send size={16} style={{ color: "var(--accent-color)" }} /> إرسال رسالة تجريبية</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>رقم الهاتف</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20xxxxxxxxxx" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
            <div className="space-y-1"><Label>القناة</Label>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="gap-1 text-emerald-400 border-emerald-400/30"><MessageCircle size={12} /> WhatsApp</Button>
                <Button size="sm" variant="outline" className="gap-1 text-blue-400 border-blue-400/30"><Phone size={12} /> SMS</Button>
              </div>
            </div>
          </div>
          <div className="space-y-1"><Label>الرسالة</Label><Input value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب رسالتك هنا..." style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} /></div>
          <Button className="gap-1 text-white" style={{ background: "var(--accent-color)" }} onClick={handleSendTest} disabled={sending || !phone || !message}><Send size={14} /> {sending ? "جاري الإرسال..." : "إرسال"}</Button>
        </CardContent>
      </Card>

      {/* Rules */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <h3 className="font-bold mb-3">قواعد الإشعارات التلقائية</h3>
          <div className="space-y-2">
            {rules.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-medium">{r.event}</span><Badge variant="outline" className={r.channel === "whatsapp" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"}>{r.channel === "whatsapp" ? "WhatsApp" : "SMS"}</Badge></div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{r.trigger} → {r.recipients}</p>
                </div>
                <Switch checked={r.active} onCheckedChange={() => toggleRule(r.id)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardContent className="p-4">
          <h3 className="font-bold mb-3">قوالب الرسائل</h3>
          <div className="space-y-2">
            {TEMPLATES.map(t => (
              <div key={t.id} className="p-2 rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
                <span className="text-sm font-medium">{t.name}</span>
                <p className="text-xs mt-1 font-mono" style={{ color: "var(--text-muted)" }}>{t.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
