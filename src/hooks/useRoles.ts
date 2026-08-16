import { useCallback } from "react";
import { trpc } from "@/providers/trpc";

export type UserRole = "admin" | "supervisor" | "accountant" | "worker";

export interface SystemUser {
  id: number;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  allowedModules?: string[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "مدير النظام",
  supervisor: "مشرف إنتاج",
  accountant: "محاسب",
  worker: "مستخدم عادي",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-500/20 text-red-400",
  supervisor: "bg-blue-500/20 text-blue-400",
  accountant: "bg-green-500/20 text-green-400",
  worker: "bg-white/[0.04] text-white/60",
};

const PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["*"],
  supervisor: [
    "/", "/employees", "/departments", "/attendance", "/shifts",
    "/shift-report", "/leaves", "/factory", "/production-models",
    "/cutting", "/machines", "/maintenance", "/inventory", "/suppliers", "/grn", "/kiosk",
    "/qr-tracking", "/work-orders", "/bom", "/quality-control",
    "/mrp", "/dispatch", "/subcontracting", "/advanced-bi",
    "/quotation", "/sales-orders", "/crm", "/sam-calculator",
    "/reports", "/payroll",
  ],
  accountant: [
    "/", "/employees", "/attendance", "/shift-report",
    "/leaves", "/payroll", "/piece-rate", "/production-models",
    "/cost-calculation", "/financial", "/invoices", "/vouchers", "/audit-log",
    "/advances", "/bonuses",
    "/inventory", "/suppliers", "/grn", "/bom", "/mrp",
    "/dispatch", "/sales-orders", "/subcontracting", "/crm",
    "/quotation", "/machines", "/maintenance",
    "/reports", "/dashboard",
  ],
  worker: ["/", "/attendance", "/kiosk", "/qr-tracking"],
};

export function getRoleLabel(role: UserRole) { return ROLE_LABELS[role]; }
export function getRoleColor(role: UserRole) { return ROLE_COLORS[role]; }

export function canAccess(user: SystemUser | null, path: string): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  if (user.allowedModules && user.allowedModules.length > 0) {
    return user.allowedModules.some((p) => path === p || path.startsWith(p + "/"));
  }

  const perms = PERMISSIONS[user.role] || [];
  if (perms.includes("*")) return true;
  return perms.some((p) => path === p || path.startsWith(p + "/"));
}
import { toast } from "sonner";
import { useAuth } from "./useAuth";

const SESSION_KEY = "hr_session_user";

export function useRoles() {
  const utils = trpc.useUtils();
  const auth = useAuth();
  
  const { data: usersData, isLoading } = trpc.auth.listUsers.useQuery(undefined, {
    staleTime: 10000,
  });

  const addUserMutation = trpc.auth.addUser.useMutation({
    onSuccess: () => {
      utils.auth.listUsers.invalidate();
      toast.success("تم إضافة المستخدم بنجاح");
    },
  });

  const removeUserMutation = trpc.auth.removeUser.useMutation({
    onSuccess: () => {
      utils.auth.listUsers.invalidate();
      toast.success("تم إلغاء تفعيل حساب المستخدم بنجاح");
    },
  });

  const loginMutation = trpc.auth.horizonLogin.useMutation();

  const users: SystemUser[] = (usersData || []).map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role as UserRole,
    active: u.active,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "",
    allowedModules: u.allowedModules as string[] | undefined,
  }));

  const addUser = useCallback(
    async (user: Omit<SystemUser, "id" | "createdAt">) => {
      if (!user.password) return;
      await addUserMutation.mutateAsync({
        username: user.username,
        fullName: user.fullName,
        password: user.password,
        role: user.role,
      });
    },
    [addUserMutation]
  );

  const removeUser = useCallback(
    async (id: number) => {
      await removeUserMutation.mutateAsync({ id });
    },
    [removeUserMutation]
  );

  const getSessionUser = useCallback((): SystemUser | null => {
    if (auth.user) {
      return {
        id: auth.user.id || 0,
        username: auth.user.username || "",
        fullName: auth.user.fullName || auth.user.username || "",
        role: auth.user.role as UserRole,
        active: true,
        createdAt: new Date().toISOString(),
        allowedModules: auth.user.allowedModules || undefined,
      };
    }
    // Fallback to session check if query is still loading or resolving
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [auth.user]);

  const login = useCallback(
    async (username: string, password: string): Promise<SystemUser | null> => {
      try {
        const res = await loginMutation.mutateAsync({ username, password });
        if (res.success && res.user) {
          const sessionUser: SystemUser = {
            id: res.user.id,
            username: res.user.username,
            fullName: res.user.fullName || "مستخدم",
            role: res.user.role as UserRole,
            active: true,
            createdAt: new Date().toISOString(),
          };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
          sessionStorage.setItem("hr_auth", "1");
          if (res.token) {
            localStorage.setItem("hr_token", res.token);
          }
          await auth.refresh();
          return sessionUser;
        }
      } catch (e) {
        console.error("Login mutation error", e);
      }
      return null;
    },
    [loginMutation, auth]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("hr_auth");
    localStorage.removeItem("hr_token");
    auth.logout();
  }, [auth]);

  return {
    users,
    isLoading: isLoading || auth.isLoading,
    addUser,
    removeUser,
    getSessionUser,
    login,
    logout,
  };
}
