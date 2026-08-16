import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useRoles, getRoleLabel, getRoleColor, canAccess } from "@/hooks/useRoles";
import { trpc } from "@/providers/trpc";
import {
  useSidebarConfig, CATEGORY_NAMES, CATEGORY_COLORS,
} from "@/hooks/useSidebarConfig";
import type { SidebarModule } from "@/hooks/useSidebarConfig";
import { getModulesByCategory, type AppModule, categoryMapping, useEnabledModules } from "../modules.config";
import {
  LayoutDashboard, Users, Building2, Clock, CalendarDays,
  TrendingUp, Briefcase, CreditCard, Settings, Search, Bell,
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Factory, Sun, Wallet, Award, Cog, Boxes, ClipboardList,
  Calculator, Monitor, LogOut, BarChart3, Printer, Tag, Truck,
  Scissors, Layers, QrCode, FileCheck, PackageSearch, ScanBarcode,
  ExternalLink, ShoppingCart, UserCheck, PieChart, ShieldCheck,
  FileText, ClipboardCheck, Wrench, Receipt, Banknote, Shield,
  User, GitBranch, CheckCircle, Fingerprint, MessageCircle,
  Brain, Database, Pin, PinOff, Keyboard, Activity, Smartphone,
  Gauge, Warehouse, Ruler, Box, Shirt, Sparkles, Zap,
} from "lucide-react";
import { toast } from "sonner";

// ─── Icon Map ───
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Building2, Clock, CalendarDays,
  TrendingUp, Briefcase, CreditCard, Settings, Search, Bell,
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Factory, Sun, Wallet, Award, Cog, Boxes, ClipboardList,
  Calculator, Monitor, LogOut, BarChart3, Printer, Tag, Truck,
  Scissors, Layers, QrCode, FileCheck, PackageSearch, ScanBarcode,
  ExternalLink, ShoppingCart, UserCheck, PieChart, ShieldCheck,
  FileText, ClipboardCheck, Wrench, Receipt, Banknote, Shield,
  User, GitBranch, CheckCircle, Fingerprint, MessageCircle,
  Brain, Database, Pin, PinOff, Keyboard, Activity, Smartphone,
  Gauge, Warehouse, Ruler, Box, Shirt, Sparkles, Zap,
};

function getModuleIcon(iconName: string): React.ElementType {
  return iconMap[iconName] || Cog;
}

/** Convert AppModule to SidebarModule */
function toSidebarModule(mod: AppModule): SidebarModule {
  const mappedCategory = categoryMapping[mod.category] || "system";
  return {
    id: mod.id,
    name: mod.name,
    path: mod.path,
    icon: mod.icon,
    category: mappedCategory,
    categoryPriority: 0,
    color: CATEGORY_COLORS[mappedCategory] || "#607D8B",
    enabled: mod.enabled,
  };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["dashboard", "production", "inventory"])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { logout, getSessionUser } = useRoles();
  const user = getSessionUser();
  const role = (user?.role || "admin") as import("@/hooks/useRoles").UserRole;

  const { data: notificationsData } = trpc.notifications.myNotifications.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const { data: alertsData } = trpc.notifications.checkAlerts.useQuery(undefined, {
    enabled: role === "admin",
    refetchInterval: 30000,
  });

  const alertsCount = alertsData?.alerts?.length || 0;
  const unreadCount = (notificationsData?.length || 0) + alertsCount;

  const enabledModules = useEnabledModules().filter((mod) => canAccess(user, mod.path));
  // Sidebar config hook
  const moduleGroups = getModulesByCategory(enabledModules);
  const allEnabledModules = moduleGroups.flatMap((g) => g.modules);
  const PRIMARY_PATHS = [
    "/",
    "/executive",
    "/sales-orders",
    "/inventory",
    "/factory",
    "/employees",
    "/chart-of-accounts",
    "/machines",
    "/advanced-bi",
    "/reports",
    "/settings",
    "/kiosk",
  ];
  const sidebarModules = allEnabledModules
    .map(toSidebarModule)
    .filter((mod) => PRIMARY_PATHS.includes(mod.path));
  const {
    groupedModules, quickAccessItems, trackUsage, togglePin,
    searchModules, isPinned,
  } = useSidebarConfig(sidebarModules);

  // Search results
  const searchResults = searchModules(searchQuery);

  // Current page label
  const currentLabel = allEnabledModules.find((mod: AppModule) => mod.path === location.pathname)?.name || "الرئيسية";
  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2)
    : "مد";

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Alt + number = navigate to quick access module
      if (e.altKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        const items = quickAccessItems;
        if (items[idx]) {
          navigate(items[idx].path);
          trackUsage(items[idx].id);
        }
      }
      // Alt + K = focus search
      if (e.altKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        const searchInput = document.getElementById("sidebar-search");
        if (searchInput) searchInput.focus();
      }
      // Escape = close search results
      if (e.key === "Escape") {
        setShowSearchResults(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, quickAccessItems, trackUsage]);

  // ─── Click outside to close search ───
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Category toggle ───
  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const isCategoryOpen = (cat: string) => {
    if (sidebarCollapsed) return true;
    return openCategories.has(cat);
  };

  // ─── Navigation handler with usage tracking ───
  const handleNavClick = useCallback((mod: SidebarModule) => {
    trackUsage(mod.id);
    setShowSearchResults(false);
    setSearchQuery("");
    setMobileMenuOpen(false);
  }, [trackUsage]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary, #0E0E0E)", color: "var(--text-primary, #fff)" }}>
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

        {/* ══════════════ SIDEBAR ══════════════ */}
        <aside
          className={`fixed lg:static inset-y-0 right-0 z-50 flex flex-col transition-all duration-300 border-l ${mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
          style={{ background: "var(--sidebar-bg, #0E0E0E)", borderColor: "var(--border-color, rgba(255,255,255,0.08))", width: sidebarCollapsed ? 72 : 280 }}
        >
          {/* ─── Logo ─── */}
          <div className="h-14 flex items-center px-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-color)" }}>
            <Link to="/" className="flex items-center gap-3" onClick={() => handleNavClick(sidebarModules.find((m) => m.id === "dashboard")!)}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-color, #4A2C3F)" }}>
                <span className="text-white font-bold text-sm">سـ</span>
              </div>
              {!sidebarCollapsed && <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>سليم HR</span>}
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="mr-auto lg:hidden" style={{ color: "var(--text-muted)" }}><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {!sidebarCollapsed && (
              <>
                {/* ─── Smart Search ─── */}
                <div className="px-3 pt-3 pb-2 relative" ref={searchRef}>
                  <div className="flex items-center rounded-lg px-3 py-2 border transition-colors focus-within:border-white/20" style={{ background: "var(--bg-input)", borderColor: "var(--border-color)" }}>
                    <Search size={14} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
                    <Input
                      id="sidebar-search"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(!!e.target.value); }}
                      onFocus={() => searchQuery && setShowSearchResults(true)}
                      placeholder="بحث سريع... (Alt+K)"
                      className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 text-right mr-2"
                      style={{ color: "var(--text-primary)" }}
                    />
                    <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono border flex-shrink-0" style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
                      <span>Alt</span><span>+</span><span>K</span>
                    </kbd>
                  </div>

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchQuery && (
                    <div className="absolute top-full right-3 left-3 mt-1 z-50 rounded-lg border shadow-xl overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                          <Search size={24} className="mx-auto mb-2 opacity-40" />
                          لا توجد نتائج
                        </div>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto py-1">
                          {searchResults.map((mod) => {
                            const Icon = getModuleIcon(mod.icon);
                            return (
                              <Link
                                key={mod.id}
                                to={mod.path}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                                onClick={() => handleNavClick(mod)}
                              >
                                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: mod.color + "20" }}>
                                  <Icon size={14} style={{ color: mod.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{mod.name}</p>
                                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{CATEGORY_NAMES[mod.category]}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ─── Quick Access Bar ─── */}
                {quickAccessItems.length > 0 && (
                  <div className="px-3 pb-2">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>اختصارات سريعة</span>
                      <Keyboard size={10} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickAccessItems.map((mod, idx) => {
                        const Icon = getModuleIcon(mod.icon);
                        const isActive = location.pathname === mod.path;
                        return (
                          <Tooltip key={mod.id}>
                            <TooltipTrigger asChild>
                              <Link
                                to={mod.path}
                                onClick={() => handleNavClick(mod)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all border"
                                style={{
                                  background: isActive ? mod.color + "25" : "var(--bg-input)",
                                  borderColor: isActive ? mod.color + "40" : "var(--border-color)",
                                  color: isActive ? mod.color : "var(--text-muted)",
                                }}
                              >
                                <Icon size={12} />
                                <span className="hidden xl:inline">{mod.name.length > 10 ? mod.name.slice(0, 10) + "..." : mod.name}</span>
                                <kbd className="hidden 2xl:inline-flex px-1 rounded text-[8px] font-mono opacity-50" style={{ background: "rgba(255,255,255,0.08)" }}>{idx + 1}</kbd>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>{mod.name} {idx < 9 ? `(Alt+${idx + 1})` : ""}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ─── Navigation Categories ─── */}
            <nav className="px-3 py-2">
              {Array.from(groupedModules.entries()).map(([category, modules]) => {
                const catColor = CATEGORY_COLORS[category] || "#607D8B";
                const catName = CATEGORY_NAMES[category] || category;
                const isOpen = isCategoryOpen(category) || modules.length === 1;
                const showToggle = !sidebarCollapsed && modules.length > 1;

                return (
                  <div key={category} className="mb-1">
                    {/* Category Header */}
                    {showToggle ? (
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5 bg-transparent group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: catColor }} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider select-none" style={{ color: catColor }}>
                            {catName}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-0" style={{ background: catColor + "15", color: catColor }}>
                            {modules.length}
                          </Badge>
                        </div>
                        {isOpen ? <ChevronUp size={12} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />}
                      </button>
                    ) : sidebarCollapsed ? (
                      <div className="flex justify-center py-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: catColor + "20" }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: catColor }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: catColor }} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider select-none" style={{ color: catColor }}>
                          {catName}
                        </span>
                      </div>
                    )}

                    {/* Module Items */}
                    <div
                      className="overflow-hidden transition-all duration-200"
                      style={{ maxHeight: isOpen ? modules.length * 44 + 20 : 0, opacity: isOpen ? 1 : 0 }}
                    >
                      {modules.map((mod) => {
                        const isActive = location.pathname === mod.path;
                        const Icon = getModuleIcon(mod.icon);
                        const pinned = isPinned(mod.id);

                        if (sidebarCollapsed) {
                          return (
                            <Tooltip key={mod.id}>
                              <TooltipTrigger asChild>
                                <Link
                                  to={mod.path}
                                  onClick={() => handleNavClick(mod)}
                                  className="flex items-center justify-center h-10 rounded-lg transition-colors mb-0.5 relative"
                                  style={isActive ? { background: mod.color + "20", color: mod.color } : { color: "var(--text-muted)" }}
                                >
                                  <Icon size={20} />
                                  {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-l-full" style={{ background: mod.color }} />}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="left"><p>{mod.name}</p></TooltipContent>
                            </Tooltip>
                          );
                        }

                        return (
                          <Link
                            key={mod.id}
                            to={mod.path}
                            onClick={() => handleNavClick(mod)}
                            className="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5 relative"
                            style={isActive ? { background: mod.color + "15", color: "var(--text-primary)" } : { color: "var(--text-muted)" }}
                          >
                            {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-l-full" style={{ background: mod.color }} />}
                            <Icon size={16} style={isActive ? { color: mod.color } : undefined} />
                            <span className="flex-1 text-right">{mod.name}</span>
                            {/* Pin button on hover */}
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(mod.id); toast.success(pinned ? "تم إلغاء التثبيت" : "تم التثبيت"); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                              style={{ color: pinned ? mod.color : "var(--text-muted)" }}
                              title={pinned ? "إلغاء التثبيت" : "تثبيت"}
                            >
                              {pinned ? <Pin size={12} /> : <PinOff size={12} />}
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* ─── Bottom: Logout + User ─── */}
          <div className="px-3 py-3 border-t flex-shrink-0" style={{ borderColor: "var(--border-color)" }}>
            <button
              onClick={() => { logout(); window.location.href = "/"; }}
              className={`w-full flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-colors hover:text-red-400 hover:bg-red-500/10 bg-transparent ${sidebarCollapsed ? "justify-center px-0" : "px-3"}`}
              style={{ color: "var(--text-muted)" }}
            >
              <LogOut size={18} />
              {!sidebarCollapsed && <span>تسجيل الخروج</span>}
            </button>

            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 py-2 px-3 mt-1">
                <Avatar className="w-8 h-8">
                  <AvatarFallback style={{ background: "var(--accent-color)", color: "white", fontSize: 10 }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user?.fullName || "مدير النظام"}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${getRoleColor(role)}`}>{getRoleLabel(role)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -left-3 top-16 w-6 h-6 rounded-full items-center justify-center transition-colors z-10 border"
            style={{ background: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-muted)" }}
          >
            {sidebarCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
          </button>
        </aside>

        {/* ══════════════ MAIN CONTENT ══════════════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 border-b flex items-center justify-between px-4 lg:px-6 flex-shrink-0" style={{ background: "var(--bg-card, #1C1C1E)", borderColor: "var(--border-color)" }}>
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden" style={{ color: "var(--text-muted)" }}><Menu size={20} /></button>
              <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{currentLabel}</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/notifications" className="relative transition-colors" style={{ color: "var(--text-muted)" }}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-red-500 min-w-[16px] h-[16px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Avatar className="w-8 h-8">
                <AvatarFallback style={{ background: "var(--accent-color)", color: "white", fontSize: 10 }}>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
