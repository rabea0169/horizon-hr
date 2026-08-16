import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    leaveAlerts: true,
    attendanceReminders: true,
    payrollNotifications: true,
    performanceReviews: false,
    maintenanceAlerts: true,
    lowStockAlerts: true
  });

  const cardBg = { background: "var(--bg-card, #1C1C1E)", borderColor: "var(--border-color, rgba(255,255,255,0.08))" };

  const notificationItems = [
    { label: "إشعارات البريد", description: "استلام تنبيهات بالبريد", key: "emailNotifications" as const },
    { label: "تنبيهات الإجازات", description: "إشعار عند طلب إجازة جديدة", key: "leaveAlerts" as const },
    { label: "تذكير الحضور", description: "ملخص الحضور اليومي", key: "attendanceReminders" as const },
    { label: "إشعارات الرواتب", description: "تنبيه عند معالجة الرواتب", key: "payrollNotifications" as const },
    { label: "تقييمات الأداء", description: "تذكير بالتقييمات القادمة", key: "performanceReviews" as const },
    { label: "تنبيهات صيانة", description: "مواعيد صيانة الماكينات", key: "maintenanceAlerts" as const },
    { label: "تنبيهات المخزون", description: "تنبيه عند نفاد خامة", key: "lowStockAlerts" as const },
  ];

  return (
    <Card className="border" style={cardBg}>
      <CardHeader><CardTitle className="text-base text-right">تفضيلات الإشعارات</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {notificationItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div className="text-right">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.description}</p>
            </div>
            <Switch
              checked={notifications[item.key]}
              onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
              style={{ background: notifications[item.key] ? "var(--accent-color)" : undefined }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
