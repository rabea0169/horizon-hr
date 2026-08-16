import { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route } from "react-router";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { useEnabledModules } from "./modules.config";
import { trpc } from "@/providers/trpc";
import { useRoles, canAccess } from "@/hooks/useRoles";
import ErrorBoundary from "@/components/ErrorBoundary";

const Kiosk = lazy(() => import("./pages/Kiosk"));

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<boolean | null>(null);
  const { getSessionUser } = useRoles();

  useEffect(() => {
    const check = () => {
      const hasAuth = sessionStorage.getItem("hr_auth") === "1";
      const user = getSessionUser();
      setAuth(hasAuth && !!user);
    };
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [getSessionUser]);

  if (auth === null) return null;
  if (!auth) return <Login />;
  return <>{children}</>;
}

function RoleGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const { getSessionUser } = useRoles();
  const user = getSessionUser();

  if (!canAccess(user, path)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: "var(--text-primary)" }} dir="rtl">
        <div className="text-6xl">🚫</div>
        <h2 className="text-xl font-bold">غير مصرح</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        <a href="#/" className="text-sm px-4 py-2 rounded-lg text-white" style={{ background: "var(--accent-color)" }}>العودة للرئيسية</a>
      </div>
    );
  }
  return <>{children}</>;
}

function AppRoutes() {
  const enabledModules = useEnabledModules();

  const { data: serverDisabledModules } = trpc.settings.getModulesState.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  useEffect(() => {
    if (serverDisabledModules) {
      try {
        const localDisabled = JSON.parse(localStorage.getItem("disabled_modules") || "[]");
        const hasMismatch =
          localDisabled.length !== serverDisabledModules.length ||
          localDisabled.some((id: string) => !serverDisabledModules.includes(id));

        if (hasMismatch) {
          localStorage.setItem("disabled_modules", JSON.stringify(serverDisabledModules));
          window.dispatchEvent(new Event("modules_changed"));
        }
      } catch (e) {
        localStorage.setItem("disabled_modules", JSON.stringify(serverDisabledModules));
        window.dispatchEvent(new Event("modules_changed"));
      }
    }
  }, [serverDisabledModules]);

  return (
    <Routes>
      {/* Kiosk is always available outside the layout */}
      <Route path="/kiosk" element={<Kiosk />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <AppLayout>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Generate routes dynamically from enabled modules */}
                  {enabledModules.map((mod) => (
                    <Route
                      key={mod.id}
                      path={mod.path}
                      element={
                        <ErrorBoundary>
                          <RoleGuard path={mod.path}>
                            <mod.component />
                          </RoleGuard>
                        </ErrorBoundary>
                      }
                    />
                  ))}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AppLayout>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full" dir="rtl">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "var(--accent-color)", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>جاري التحميل...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
