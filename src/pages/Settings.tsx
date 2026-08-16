import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRoles, getRoleLabel, getRoleColor } from "@/hooks/useRoles";
import type { UserRole } from "@/hooks/useRoles";
import { Bell, Palette, Globe, Shield, Database, Plus, Cpu } from "lucide-react";
import * as Icons from "lucide-react";
import { ALL_MODULES, categoryMapping } from "../modules.config";
import { CATEGORY_COLORS, CATEGORY_NAMES } from "@/hooks/useSidebarConfig";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

import { AppearanceTab } from "./settings/AppearanceTab";
import { GeneralTab } from "./settings/GeneralTab";
import { NotificationsTab } from "./settings/NotificationsTab";
import { DataTab } from "./settings/DataTab";

export default function Settings() {
  const { users, addUser, removeUser, getSessionUser } = useRoles();
  const currentUser = getSessionUser();
  const isAdmin = currentUser?.role === "admin";

  const [userDialog, setUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({ username: "", fullName: "", password: "", role: "worker" as UserRole });

  const [moduleSearchQuery, setModuleSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [permissionsDialog, setPermissionsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userModules, setUserModules] = useState<string[]>([]);
  const utils = trpc.useUtils();

  const updateUserPermissionsMutation = trpc.auth.updateUserPermissions.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث صلاحيات المستخدم بنجاح");
      utils.auth.listUsers.invalidate();
    },
  });

  const handleOpenPermissions = (u: any) => {
    setSelectedUser(u);
    setUserModules(u.allowedModules || []);
    setPermissionsDialog(true);
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;
    updateUserPermissionsMutation.mutate({ userId: selectedUser.id, allowedModules: userModules });
    setPermissionsDialog(false);
  };

  const { data: serverDisabledModules, refetch: refetchModules } = trpc.settings.getModulesState.useQuery(undefined, {
    enabled: isAdmin,
    staleTime: 30000,
  });

  const updateModulesMutation = trpc.settings.updateModulesState.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث موديولات النظام بنجاح");
      refetchModules();
    },
  });

  const disabledList = serverDisabledModules || [];

  const handleToggleModule = (moduleId: string) => {
    let newDisabledList = [...disabledList];
    if (disabledList.includes(moduleId)) {
      newDisabledList = newDisabledList.filter((id) => id !== moduleId);
    } else {
      newDisabledList.push(moduleId);
    }

    localStorage.setItem("disabled_modules", JSON.stringify(newDisabledList));
    window.dispatchEvent(new Event("modules_changed"));
    updateModulesMutation.mutate(newDisabledList);
  };

  const CORE_MODULES = ["dashboard", "executive", "settings", "approvals", "backup-restore", "server-setup", "print-settings", "notifications"];

  const filteredModules = ALL_MODULES.filter((mod) => {
    const nameMatch = mod.name.toLowerCase().includes(moduleSearchQuery.toLowerCase());
    const descMatch = mod.description.toLowerCase().includes(moduleSearchQuery.toLowerCase());
    const searchMatch = nameMatch || descMatch;

    const erpCat = categoryMapping[mod.category] || "system";
    const categoryMatch = selectedCategory === "all" || erpCat === selectedCategory;

    return searchMatch && categoryMatch;
  });

  const handleAddUser = () => {
    if (!userForm.username || !userForm.fullName || !userForm.password) return;
    addUser({ username: userForm.username, fullName: userForm.fullName, password: userForm.password, role: userForm.role, active: true });
    setUserDialog(false); setUserForm({ username: "", fullName: "", password: "", role: "worker" });
  };

  const cardBg = { background: "var(--bg-card, #1C1C1E)", borderColor: "var(--border-color, rgba(255,255,255,0.08))" };
  const inputBg = { background: "var(--bg-input, #2C2C2E)", borderColor: "var(--border-color)", color: "var(--text-primary)" };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans" style={{ color: "var(--text-primary)" }} dir="rtl">
      <div className="text-right">
        <h2 className="text-lg font-semibold">الإعدادات</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>تخصيص النظام وإدارة البيانات والمستخدمين</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="h-auto flex-wrap border justify-start" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          <TabsTrigger value="appearance" className="text-sm" style={{ color: "var(--text-muted)" }}><Palette size={14} className="ml-1.5" /> المظهر</TabsTrigger>
          <TabsTrigger value="general" className="text-sm" style={{ color: "var(--text-muted)" }}><Globe size={14} className="ml-1.5" /> عام</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm" style={{ color: "var(--text-muted)" }}><Bell size={14} className="ml-1.5" /> الإشعارات</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="text-sm" style={{ color: "var(--text-muted)" }}><Shield size={14} className="ml-1.5" /> المستخدمين</TabsTrigger>}
          <TabsTrigger value="data" className="text-sm" style={{ color: "var(--text-muted)" }}><Database size={14} className="ml-1.5" /> البيانات</TabsTrigger>
          {isAdmin && <TabsTrigger value="modules" className="text-sm" style={{ color: "var(--text-muted)" }}><Cpu size={14} className="ml-1.5" /> الموديولات</TabsTrigger>}
        </TabsList>

        <TabsContent value="appearance" className="mt-4">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="general" className="mt-4">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <NotificationsTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="mt-4 space-y-4">
            <Card className="border" style={cardBg}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 justify-end"><Shield size={16} style={{ color: "var(--accent-color)" }} /> إدارة المستخدمين</CardTitle>
                  <Button size="sm" style={{ background: "var(--accent-color)", color: "var(--text-primary)" }} onClick={() => setUserDialog(true)}><Plus size={14} className="ml-1" /> مستخدم جديد</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: "var(--border-color)" }}>
                      <TableHead className="text-right">الاسم بالكامل</TableHead>
                      <TableHead className="text-right">اسم المستخدم</TableHead>
                      <TableHead className="text-right">الدور</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} style={{ borderColor: "var(--border-color)" }}>
                        <TableCell className="font-medium text-right">{u.fullName}</TableCell>
                        <TableCell className="text-right">{u.username}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={getRoleColor(u.role)}>{getRoleLabel(u.role)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={u.active ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-red-400 border-red-500/20 bg-red-500/5"}>
                            {u.active ? "نشط" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left flex items-center gap-2 justify-start">
                          <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleOpenPermissions(u)}>صلاحيات الموديولات</Button>
                          {u.username !== "admin" && (
                            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-400" onClick={() => removeUser(u.id)}>حذف</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="data" className="mt-4">
          <DataTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="modules" className="mt-4 space-y-6">
            {/* Live Analytics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border" style={cardBg}>
                <CardContent className="pt-6 text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي الموديولات المفعلة</p>
                  <h3 className="text-3xl font-bold mt-1 text-emerald-400">
                    {ALL_MODULES.filter((m) => m.enabled && !disabledList.includes(m.id)).length} <span className="text-sm font-normal">من {ALL_MODULES.length}</span>
                  </h3>
                </CardContent>
              </Card>

              <Card className="border" style={cardBg}>
                <CardContent className="pt-6 text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>الموديولات المعطلة</p>
                  <h3 className="text-3xl font-bold mt-1 text-red-400">
                    {disabledList.length} <span className="text-sm font-normal">موديول</span>
                  </h3>
                </CardContent>
              </Card>

              <Card className="border" style={cardBg}>
                <CardContent className="pt-6 text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي التكلفة الشهرية للمشروع</p>
                  <h3 className="text-3xl font-bold mt-1" style={{ color: "var(--accent-color)" }}>
                    {(ALL_MODULES.filter((m) => m.enabled && !disabledList.includes(m.id)).reduce((sum, m) => sum + m.price, 0)).toLocaleString()} <span className="text-sm font-normal">ج.م / شهرياً</span>
                  </h3>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  style={selectedCategory === "all" ? { background: "var(--accent-color)", color: "white" } : { background: "var(--bg-input)", color: "var(--text-secondary)" }}
                >
                  الكل
                </Button>
                {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(key)}
                    style={selectedCategory === key ? { background: "var(--accent-color)", color: "white" } : { background: "var(--bg-input)", color: "var(--text-secondary)" }}
                  >
                    {label.replace(/[👥📦🏭💰🤝⚙️]/g, "").trim()}
                  </Button>
                ))}
              </div>

              <div className="w-full md:w-72">
                <Input
                  placeholder="بحث عن موديول..."
                  value={moduleSearchQuery}
                  onChange={(e) => setModuleSearchQuery(e.target.value)}
                  className="text-right text-sm"
                  style={inputBg}
                />
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModules.map((mod) => {
                const isCore = CORE_MODULES.includes(mod.id);
                const isEnabled = !disabledList.includes(mod.id);
                const IconComponent = (Icons as any)[mod.icon] || Icons.Cog;
                const erpCat = categoryMapping[mod.category] || "system";
                const catColor = CATEGORY_COLORS[erpCat] || "#607D8B";

                return (
                  <Card key={mod.id} className="border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5" style={{ ...cardBg, opacity: isEnabled ? 1 : 0.65 }}>
                    <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: catColor + "15", color: catColor }}>
                            <IconComponent size={20} />
                          </div>
                          <div className="text-right">
                            <h4 className="font-semibold text-sm">{mod.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full inline-block mt-1" style={{ background: catColor + "10", color: catColor }}>
                              {(CATEGORY_NAMES[erpCat] || erpCat).replace(/[👥📦🏭💰🤝⚙️]/g, "").trim()}
                            </span>
                          </div>
                        </div>

                        {isCore ? (
                          <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/20 bg-amber-500/5">أساسي</Badge>
                        ) : (
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleToggleModule(mod.id)}
                            style={{ background: isEnabled ? "var(--accent-color)" : undefined }}
                          />
                        )}
                      </div>

                      <p className="text-xs text-right line-clamp-2 h-8" style={{ color: "var(--text-secondary)" }}>
                        {mod.description}
                      </p>

                      <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>رمز التعرف: {mod.id}</span>
                        <span className="text-xs font-semibold" style={{ color: mod.price > 0 ? "var(--text-primary)" : "var(--accent-color)" }}>
                          {mod.price > 0 ? `${mod.price.toLocaleString()} ج.م` : "مجاني"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Permissions Dialog */}
      {permissionsDialog && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPermissionsDialog(false)}>
          <div className="rounded-xl p-6 max-w-2xl w-full mx-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4 text-right">صلاحيات الموديولات للمستخدم: {selectedUser.fullName}</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[350px] overflow-y-auto p-2" dir="rtl">
              {ALL_MODULES.map((mod) => {
                const isChecked = userModules.includes(mod.id);
                return (
                  <div key={mod.id} className="flex items-center gap-2 justify-start py-1">
                    <Checkbox
                      id={`perm-${mod.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setUserModules([...userModules, mod.id]);
                        } else {
                          setUserModules(userModules.filter((id) => id !== mod.id));
                        }
                      }}
                    />
                    <label htmlFor={`perm-${mod.id}`} className="text-xs font-medium cursor-pointer text-right">
                      {mod.name}
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setPermissionsDialog(false)}>إلغاء</Button>
              <Button className="flex-1 text-white" style={{ background: "var(--accent-color)" }} onClick={handleSavePermissions}>حفظ</Button>
            </div>
          </div>
        </div>
      )}

      {/* User Creation Dialog */}
      {userDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setUserDialog(false)}>
          <div className="rounded-xl p-6 max-w-sm w-full mx-4 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4 text-right">إضافة مستخدم جديد</h3>
            <div className="space-y-3 text-right">
              <div className="space-y-1">
                <Label>الاسم بالكامل</Label>
                <Input value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} style={inputBg} className="text-right" />
              </div>
              <div className="space-y-1">
                <Label>اسم المستخدم</Label>
                <Input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} style={inputBg} className="text-right" />
              </div>
              <div className="space-y-1">
                <Label>كلمة المرور</Label>
                <Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} style={inputBg} className="text-right" />
              </div>
              <div className="space-y-1">
                <Label>الدور</Label>
                <Select value={userForm.role} onValueChange={(val: any) => setUserForm({ ...userForm, role: val })}>
                  <SelectTrigger style={inputBg} className="text-right"><SelectValue /></SelectTrigger>
                  <SelectContent style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
                    <SelectItem value="admin">مدير النظام</SelectItem>
                    <SelectItem value="finance">المالية</SelectItem>
                    <SelectItem value="supervisor">مشرف</SelectItem>
                    <SelectItem value="worker">عامل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 border" style={{ borderColor: "var(--border-color)", color: "var(--text-primary)", background: "var(--bg-input)" }} onClick={() => setUserDialog(false)}>إلغاء</Button>
              <Button className="flex-1 text-white" style={{ background: "var(--accent-color)" }} onClick={handleAddUser}>حفظ</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
