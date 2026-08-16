import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GeneralTab() {
  const [general, setGeneral] = useState({ companyName: "مصنع سليم للملابس الجاهزة", timezone: "Africa/Cairo", currency: "EGP", language: "ar" });

  const cardBg = { background: "var(--bg-card, #1C1C1E)", borderColor: "var(--border-color, rgba(255,255,255,0.08))" };
  const inputBg = { background: "var(--bg-input, #2C2C2E)", borderColor: "var(--border-color)", color: "var(--text-primary)" };

  return (
    <Card className="border" style={cardBg}>
      <CardHeader><CardTitle className="text-base text-right">معلومات المصنع</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-right">
        <div className="space-y-2">
          <Label style={{ color: "var(--text-secondary)" }}>اسم المصنع</Label>
          <Input value={general.companyName} onChange={(e) => setGeneral({ ...general, companyName: e.target.value })} className="text-right" style={inputBg} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label style={{ color: "var(--text-secondary)" }}>التوقيت</Label>
            <Input value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} style={inputBg} />
          </div>
          <div className="space-y-2">
            <Label style={{ color: "var(--text-secondary)" }}>العملة</Label>
            <Input value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })} style={inputBg} />
          </div>
        </div>
        <Button style={{ background: "var(--accent-color)", color: "var(--text-primary)" }}>حفظ التغييرات</Button>
      </CardContent>
    </Card>
  );
}
