import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Package, Clock, Wrench, UserX, ShieldAlert, RefreshCw } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useRoles } from "@/hooks/useRoles";

const severityConfig: Record<string, { color: string; bg: string; icon: any }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertTriangle },
  warning: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: Clock },
  info: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Bell },
};

const typeIcons: Record<string, any> = {
  late_so: Package,
  low_stock: Package,
  machine_down: Wrench,
  absence: UserX,
  aql_fail: ShieldAlert,
  pending_po: Package,
  overtime: Clock,
  pending_advance: Clock,
  info: Bell,
};

export default function Notifications() {
  const { getSessionUser } = useRoles();
  const user = getSessionUser();
  const isAdmin = user?.role === "admin";

  const { data: dbNotifications, isLoading: loadingNotifs, refetch: refetchNotifs } = trpc.notifications.myNotifications.useQuery();
  const { data: alertsData, isLoading: loadingAlerts, refetch: refetchAlerts } = trpc.notifications.checkAlerts.useQuery(undefined, {
    enabled: isAdmin,
  });

  const [filter, setFilter] = useState("all");

  const allNotifications = useMemo(() => {
    const alerts = alertsData?.alerts.map((al, idx) => ({
      id: `alert-${idx}`,
      type: al.type,
      title: al.type === "low_stock" ? "مخزون منخفض" : al.type === "machine_down" ? "عطل ماكينة" : "طلب سلفة معلق",
      message: al.message,
      severity: al.severity === "error" ? "critical" : al.severity,
      read: false,
      createdAt: "الآن",
      module: al.type === "low_stock" ? "inventory" : al.type === "machine_down" ? "maintenance" : "payroll",
    })) || [];

    const dbNotifs = dbNotifications?.map((act) => {
      const desc = act.description || "";
      return {
        id: act.id,
        type: "info",
        title: desc.split(":")[0] || "تنبيه النظام",
        message: desc.split(":").slice(1).join(":") || desc,
        severity: "info",
        read: false,
        createdAt: new Date(act.createdAt).toLocaleString("ar-EG"),
        module: "system",
      };
    }) || [];

    return [...alerts, ...dbNotifs];
  }, [dbNotifications, alertsData]);

  const filtered = useMemo(() => {
    if (filter === "all") return allNotifications;
    if (filter === "unread") return allNotifications.filter((n) => !n.read);
    return allNotifications.filter((n) => n.severity === filter);
  }, [allNotifications, filter]);

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const refreshAll = () => {
    refetchNotifs();
    if (isAdmin) refetchAlerts();
  };

  const isLoading = loadingNotifs || (isAdmin && loadingAlerts);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: "var(--accent-color)" }} />
          <h2 className="text-xl font-bold">التنبيهات والإشعارات من قاعدة البيانات</h2>
          {unreadCount > 0 && <Badge variant="outline" className="bg-red-500/15 text-red-400">{unreadCount} جديد</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refreshAll} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> تحديث
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: `الكل (${allNotifications.length})` },
          { key: "unread", label: `غير مقروء (${unreadCount})` },
          { key: "critical", label: "حرج" },
          { key: "warning", label: "تنبيه" },
          { key: "info", label: "معلومة" },
        ].map(f => (
          <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)} style={filter === f.key ? { background: "var(--accent-color)" } : {}}>{f.label}</Button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {filtered.map((n) => {
          const cfg = severityConfig[n.severity] || severityConfig.info;
          const Icon = typeIcons[n.type] || Bell;
          return (
            <Card key={n.id} className={`transition-all ${!n.read ? cfg.bg : ""}`} style={{ background: !n.read ? undefined : "var(--bg-card)", borderColor: "var(--border-color)", opacity: n.read ? 0.7 : 1 }}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className="mt-0.5"><Icon size={16} className={cfg.color} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!n.read ? cfg.color : ""}`}>{n.title}</span>
                    {!n.read && <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-color)" }} />}
                    <Badge variant="outline" className={cfg.bg + " " + cfg.color}>{n.severity === "critical" ? "حرج" : n.severity === "warning" ? "تنبيه" : "معلومة"}</Badge>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{n.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{n.createdAt}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-12" style={{ color: "var(--text-muted)" }}><Bell size={32} className="mx-auto mb-2 opacity-30" /><p>لا توجد إشعارات</p></div>}
    </div>
  );
}
