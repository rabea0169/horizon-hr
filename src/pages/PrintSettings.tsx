import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrintSettings } from "@/hooks/usePrintSettings";
import { Printer, RotateCcw, Image, FileText, Signature, Calendar, Hash, Type, StickyNote } from "lucide-react";

export default function PrintSettingsPage() {
  const { settings, updateSetting, resetSettings } = usePrintSettings();
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateSetting("companyLogo", String(ev.target?.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = { background: "var(--bg-input, #2C2C2E)", borderColor: "var(--border-color)", color: "var(--text-primary)" };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl" style={{ color: "var(--text-primary)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">إعدادات الطباعة</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>تخصيص مظهر التقارير والكشوف المطبوعة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={resetSettings}>
            <RotateCcw size={14} className="ml-1.5" /> استعادة الافتراضي
          </Button>
          <Button style={{ color: "var(--text-primary)", background: "var(--accent-color)" }} onClick={handleSave}>
            <Printer size={14} className="ml-1.5" /> {saved ? "تم الحفظ!" : "حفظ"}
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <Card className="border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText size={16} style={{ color: "var(--accent-color)" }} /> بيانات المصنع</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>اسم المصنع</Label><Input value={settings.companyName} onChange={(e) => updateSetting("companyName", e.target.value)} style={inputStyle} /></div>
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>العنوان</Label><Input value={settings.companyAddress} onChange={(e) => updateSetting("companyAddress", e.target.value)} style={inputStyle} /></div>
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>رقم الهاتف</Label><Input value={settings.companyPhone} onChange={(e) => updateSetting("companyPhone", e.target.value)} style={inputStyle} /></div>
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>البريد الإلكتروني</Label><Input value={settings.companyEmail} onChange={(e) => updateSetting("companyEmail", e.target.value)} style={inputStyle} /></div>
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>الرقم الضريبي</Label><Input value={settings.taxNumber} onChange={(e) => updateSetting("taxNumber", e.target.value)} style={inputStyle} /></div>
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>السجل التجاري</Label><Input value={settings.commercialRegister} onChange={(e) => updateSetting("commercialRegister", e.target.value)} style={inputStyle} /></div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><Image size={14} /> شعار المصنع</Label>
            <div className="flex items-center gap-4">
              {settings.companyLogo && (
                <img src={settings.companyLogo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border p-1" style={{ borderColor: "var(--border-color)" }} />
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
              <Button variant="outline" size="sm" className="border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => fileInputRef.current?.click()}>
                {settings.companyLogo ? "تغيير الشعار" : "رفع شعار"}
              </Button>
              {settings.companyLogo && (
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => updateSetting("companyLogo", "")}>حذف</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paper Settings */}
      <Card className="border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Printer size={16} style={{ color: "var(--accent-color)" }} /> إعدادات الورق</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>حجم الورق</Label>
              <Select value={settings.paperSize} onValueChange={(v) => updateSetting("paperSize", v as "A4" | "A5" | "Letter")}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <SelectItem value="A4">A4 (210 × 297 مم)</SelectItem>
                  <SelectItem value="A5">A5 (148 × 210 مم)</SelectItem>
                  <SelectItem value="Letter">Letter (8.5 × 11 إنش)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>اتجاه الطباعة</Label>
              <Select value={settings.orientation} onValueChange={(v) => updateSetting("orientation", v as "portrait" | "landscape")}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <SelectItem value="portrait">عمودي (Portrait)</SelectItem>
                  <SelectItem value="landscape">أفقي (Landscape)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label style={{ color: "var(--text-secondary)" }}>حجم الخط</Label>
              <Select value={settings.fontSize} onValueChange={(v) => updateSetting("fontSize", v as "small" | "medium" | "large")}>
                <SelectTrigger style={inputStyle}><SelectValue /></SelectTrigger>
                <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                  <SelectItem value="small">صغير</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="large">كبير</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show/Hide Options */}
      <Card className="border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Type size={16} style={{ color: "var(--accent-color)" }} /> خيارات العرض</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "عرض الترويسة", desc: "اسم المصنع والعنوان في أعلى الصفحة", key: "headerEnabled" as const, icon: FileText },
              { label: "عرض التذييل", desc: "معلومات الاتصال في أسفل الصفحة", key: "footerEnabled" as const, icon: FileText },
              { label: "عرض التوقيعات", desc: "مساحات التوقيع في نهاية التقرير", key: "signaturesEnabled" as const, icon: Signature },
              { label: "عرض التاريخ", desc: "تاريخ الطباعة على التقرير", key: "showDate" as const, icon: Calendar },
              { label: "عرض أرقام الصفحات", desc: "ترقيم الصفحات", key: "showPageNumbers" as const, icon: Hash },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "var(--bg-input)" }}>
                <div className="flex items-center gap-2">
                  <item.icon size={14} style={{ color: "var(--text-muted)" }} />
                  <div className="text-right">
                    <p className="text-sm">{item.label}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                  </div>
                </div>
                <Switch checked={settings[item.key]} onCheckedChange={(checked) => updateSetting(item.key, checked)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      {settings.signaturesEnabled && (
        <Card className="border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Signature size={16} style={{ color: "var(--accent-color)" }} /> التوقيعات</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="text-right"><p className="text-sm">توقيع المحاسب</p></div>
              <Switch checked={settings.signatureAccountantEnabled} onCheckedChange={(checked) => updateSetting("signatureAccountantEnabled", checked)} />
            </div>
            {settings.signatureAccountantEnabled && (
              <Input value={settings.signatureAccountant} onChange={(e) => updateSetting("signatureAccountant", e.target.value)} placeholder="اسم المحاسب أو المنصب" style={inputStyle} />
            )}
            <Separator style={{ background: "var(--border-color)" }} />
            <div className="flex items-center justify-between py-2">
              <div className="text-right"><p className="text-sm">توقيع المدير</p></div>
              <Switch checked={settings.signatureManagerEnabled} onCheckedChange={(checked) => updateSetting("signatureManagerEnabled", checked)} />
            </div>
            {settings.signatureManagerEnabled && (
              <Input value={settings.signatureManager} onChange={(e) => updateSetting("signatureManager", e.target.value)} placeholder="اسم المدير أو المنصب" style={inputStyle} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card className="border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><StickyNote size={16} style={{ color: "var(--accent-color)" }} /> ملاحظات على التقارير</CardTitle></CardHeader>
        <CardContent>
          <textarea
            value={settings.notes}
            onChange={(e) => updateSetting("notes", e.target.value)}
            placeholder="ملاحظات تظهر في أسفل كل تقري..."
            className="w-full h-24 rounded-lg p-3 text-sm text-right border resize-none"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
          />
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
        <CardHeader><CardTitle className="text-base">معاينة الترويسة</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 text-center" style={{ background: "white", color: "#1a1a2e", borderColor: "#ddd" }}>
            {settings.headerEnabled && (
              <div className="mb-4">
                {settings.companyLogo && <img src={settings.companyLogo} alt="" className="w-12 h-12 object-contain mx-auto mb-2" />}
                <h3 className="text-lg font-bold">{settings.companyName}</h3>
                <p className="text-xs text-gray-500">{settings.companyAddress}</p>
                <p className="text-xs text-gray-500">{settings.companyPhone} | {settings.companyEmail}</p>
                {(settings.taxNumber || settings.commercialRegister) && (
                  <p className="text-[10px] text-gray-400 mt-1">ر.ض: {settings.taxNumber} | س.ت: {settings.commercialRegister}</p>
                )}
              </div>
            )}
            <hr className="my-3 border-gray-200" />
            <p className="text-sm text-gray-400">محتوى التقرير...</p>
            <hr className="my-3 border-gray-200" />
            {settings.footerEnabled && (
              <div className="text-[10px] text-gray-400">
                <p>{settings.companyName} - جميع الحقوق محفوظة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
