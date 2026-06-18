import { useState, useCallback } from "react";

const DEFAULT_USERS: SystemUser[] = [
  { id: 1, username: "admin", password: "admin123", fullName: "مدير النظام", role: "admin", active: true, createdAt: "2026-01-01" },
  { id: 2, username: "supervisor", password: "super123", fullName: "مشرف الإنتاج", role: "supervisor", active: true, createdAt: "2026-01-01" },
  { id: 3, username: "accountant", password: "acc123", fullName: "المحاسب", role: "accountant", active: true, createdAt: "2026-01-01" },
  { id: 4, username: "worker", password: "work123", fullName: "عامل عادي", role: "worker", active: true, createdAt: "2026-01-01" },
];

function loadUsers(): SystemUser[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  } catch { return DEFAULT_USERS; }
}

export type UserRole = "admin" | "supervisor" | "accountant" | "worker";

export interface SystemUser {
  id: number;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
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

export function canAccess(role: UserRole, path: string): boolean {
  const perms = PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;
  return perms.some((p) => path === p || path.startsWith(p + "/"));
}

const STORAGE_KEY = "hr_system_users";
const SESSION_KEY = "hr_session_user";

export function useRoles() {
  const [users, setUsers] = useState<SystemUser[]>(loadUsers);

  const saveUsers = useCallback((newUsers: SystemUser[]) => {
    setUsers(newUsers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsers));
  }, []);

  const addUser = useCallback(
    (user: Omit<SystemUser, "id" | "createdAt">) => {
      const newUser: SystemUser = {
        ...user,
        id: Date.now(),
        createdAt: new Date().toISOString().split("T")[0],
      };
      saveUsers([...users, newUser]);
      return newUser;
    },
    [users, saveUsers]
  );

  const updateUser = useCallback(
    (id: number, changes: Partial<SystemUser>) => {
      saveUsers(users.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    },
    [users, saveUsers]
  );

  const removeUser = useCallback(
    (id: number) => { saveUsers(users.filter((u) => u.id !== id)); },
    [users, saveUsers]
  );

  const getSessionUser = useCallback((): SystemUser | null => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const login = useCallback(
    (username: string, password: string): SystemUser | null => {
      const user = users.find(
        (u) => u.username === username && u.active && u.password === password
      );
      if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
      }
      return null;
    },
    [users]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("hr_auth");
    localStorage.removeItem("hr_token");
  }, []);

  return {
    users,
    addUser,
    updateUser,
    removeUser,
    getSessionUser,
    login,
    logout,
  };
}
