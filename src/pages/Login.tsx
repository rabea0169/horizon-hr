import { useState } from "react";
import { useRoles, type UserRole } from "@/hooks/useRoles";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory, Lock, Shield, UserCircle, Calculator, HardHat } from "lucide-react";

const ROLE_ICONS: Record<UserRole, typeof Shield> = {
  admin: Shield,
  supervisor: HardHat,
  accountant: Calculator,
  worker: UserCircle,
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "text-red-400 border-red-500/30 bg-red-500/10",
  supervisor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  accountant: "text-green-400 border-green-500/30 bg-green-500/10",
  worker: "text-gray-400 border-gray-500/30 bg-gray-500/10",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "مدير النظام",
  supervisor: "مشرف إنتاج",
  accountant: "محاسب",
  worker: "مستخدم عادي",
};

const DEMO_CREDENTIALS: Record<UserRole, { user: string; pass: string }> = {
  admin: { user: "admin", pass: "admin123" },
  supervisor: { user: "supervisor", pass: "super123" },
  accountant: { user: "accountant", pass: "acc123" },
  worker: { user: "worker", pass: "work123" },
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");

  const { login: localLogin } = useRoles();
  const loginMut = trpc.auth.horizonLogin.useMutation({
    onSuccess: (data) => {
      if (data.success && data.token) {
        sessionStorage.setItem("hr_auth", "1");
        sessionStorage.setItem("hr_session_user", JSON.stringify(data.user));
        window.location.reload();
      } else {
        setError(true);
      }
    },
    onError: () => {
      const user = localLogin(username, password);
      if (user) {
        sessionStorage.setItem("hr_auth", "1");
        window.location.reload();
      } else {
        setError(true);
      }
    },
  });

const fillCredentials = (role: UserRole) => {
  setSelectedRole(role);
  setUsername(DEMO_CREDENTIALS[role].user);
  setPassword(DEMO_CREDENTIALS[role].pass);
  setError(false);
};

  const handleLogin = () => {
    loginMut.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg-primary, #0E0E0E)" }} dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--accent-color, #4A2C3F)" }}>
            <Factory size={32} style={{ color: "var(--text-primary)" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary, #fff)" }}>مصنع Horizon</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted, rgba(255,255,255,0.5))" }}>نظام إدارة المصنع والعمال</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
            const Icon = ROLE_ICONS[role];
            const isSelected = selectedRole === role;
            return (
              <button
                key={role}
                onClick={() => fillCredentials(role)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-right ${ROLE_COLORS[role]} ${isSelected ? "ring-2 ring-offset-2 ring-offset-[var(--bg-primary)] scale-[1.02]" : "opacity-70 hover:opacity-100"}`}
              >
                <Icon size={18} />
                <div>
                  <p className="text-sm font-medium">{ROLE_LABELS[role]}</p>
                  <p className="text-[10px] opacity-60">
  {DEMO_CREDENTIALS[role].user} / {DEMO_CREDENTIALS[role].pass}
</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "var(--bg-card, #1C1C1E)", borderColor: "var(--border-color, rgba(255,255,255,0.08))" }}>
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} style={{ color: "var(--accent-color, #E85D4A)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary, #fff)" }}>تسجيل الدخول</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary, rgba(255,255,255,0.7))" }}>اسم المستخدم</Label>
              <Input value={username} onChange={(e) => { setUsername(e.target.value); setError(false); }} placeholder="اسم المستخدم" className="text-right" style={{ background: "var(--bg-input, #2C2C2E)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            </div>
            <div className="space-y-2">
              <Label style={{ color: "var(--text-secondary, rgba(255,255,255,0.7))" }}>كلمة المرور</Label>
              <Input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} placeholder="••••••" onKeyDown={(e) => e.key === "Enter" && handleLogin()} style={{ background: "var(--bg-input, #2C2C2E)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
              {error && <p className="text-xs text-red-400">اسم المستخدم أو كلمة المرور غير صحيحة</p>}
            </div>
            <Button className="w-full text-white h-10" style={{ background: "var(--accent-color, #4A2C3F)" }} onClick={handleLogin} disabled={!username || !password}>
              دخول
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
