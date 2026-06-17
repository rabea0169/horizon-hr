/**
 * useSidebarConfig.ts — Sidebar customization with search, quick access, and ordering
 * Persists preferences to localStorage per user role
 */

import { useState, useEffect, useCallback, useMemo } from "react";

export interface SidebarModule {
  id: string;
  name: string;
  path: string;
  icon: string;
  category: string;
  categoryPriority: number;
  color: string;
  enabled: boolean;
  shortcut?: string;
}

/** Default color map per category */
export const CATEGORY_COLORS: Record<string, string> = {
  dashboard: "#4A2C3F",
  hr: "#5A7A8A",
  inventory: "#D4A574",
  production: "#E85D4A",
  accounting: "#6B8F71",
  sales: "#7C9885",
  system: "#607D8B",
};

/** Category display names (Arabic) */
export const CATEGORY_NAMES: Record<string, string> = {
  dashboard: "الرئيسية والتحليلات",
  hr: "👥 الموارد البشرية",
  inventory: "📦 المخازن والمشتريات",
  production: "🏭 التصنيع والإنتاج",
  accounting: "💰 الحسابات المالية",
  sales: "🤝 إدارة العلاقات والمبيعات",
  system: "⚙️ الإعدادات والنظام",
};

/** Priority ordering (lower = higher in menu) */
const CATEGORY_PRIORITY: Record<string, number> = {
  dashboard: 1,
  hr: 2,
  inventory: 3,
  production: 4,
  accounting: 5,
  sales: 6,
  system: 7,
};

const STORAGE_KEY = "sidebar_config_v1";
const QUICK_ACCESS_KEY = "quick_access_v1";
const RECENT_KEY = "recent_modules_v1";

export interface SidebarConfig {
  hiddenModules: string[];
  customOrder: string[] | null;
  pinnedModules: string[];
}

function loadConfig(): SidebarConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { hiddenModules: [], customOrder: null, pinnedModules: [] };
}

function saveConfig(config: SidebarConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function loadQuickAccess(): string[] {
  try {
    const raw = localStorage.getItem(QUICK_ACCESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return ["dashboard", "realtime-production", "attendance", "employees"];
}

function saveQuickAccess(items: string[]) {
  localStorage.setItem(QUICK_ACCESS_KEY, JSON.stringify(items.slice(0, 8)));
}

function loadRecent(): Array<{ id: string; count: number; lastUsed: number }> {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveRecent(recent: Array<{ id: string; count: number; lastUsed: number }>) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 20)));
}

export function useSidebarConfig(modules: SidebarModule[]) {
  const [config, setConfig] = useState<SidebarConfig>(loadConfig);
  const [quickAccess, setQuickAccess] = useState<string[]>(loadQuickAccess);
  const [recent, setRecent] = useState(loadRecent);

  // Persist on change
  useEffect(() => saveConfig(config), [config]);
  useEffect(() => saveQuickAccess(quickAccess), [quickAccess]);
  useEffect(() => saveRecent(recent), [recent]);

  // Track module usage
  const trackUsage = useCallback((moduleId: string) => {
    setRecent((prev) => {
      const existing = prev.find((r) => r.id === moduleId);
      if (existing) {
        return prev.map((r) =>
          r.id === moduleId ? { ...r, count: r.count + 1, lastUsed: Date.now() } : r
        ).sort((a, b) => b.count - a.count);
      }
      return [...prev, { id: moduleId, count: 1, lastUsed: Date.now() }].sort((a, b) => b.count - a.count);
    });
  }, []);

  // Toggle module visibility
  const toggleHidden = useCallback((moduleId: string) => {
    setConfig((prev) => ({
      ...prev,
      hiddenModules: prev.hiddenModules.includes(moduleId)
        ? prev.hiddenModules.filter((id) => id !== moduleId)
        : [...prev.hiddenModules, moduleId],
    }));
  }, []);

  // Toggle pin in quick access
  const togglePin = useCallback((moduleId: string) => {
    setConfig((prev) => ({
      ...prev,
      pinnedModules: prev.pinnedModules.includes(moduleId)
        ? prev.pinnedModules.filter((id) => id !== moduleId)
        : [...prev.pinnedModules, moduleId],
    }));
    setQuickAccess((prev) => {
      if (prev.includes(moduleId)) return prev.filter((id) => id !== moduleId);
      return [...prev, moduleId].slice(0, 8);
    });
  }, []);

  // Reorder categories (drag & drop)
  const reorderCategories = useCallback((orderedIds: string[]) => {
    setConfig((prev) => ({ ...prev, customOrder: orderedIds }));
  }, []);

  // Get visible modules sorted
  const visibleModules = useMemo(() => {
    let filtered = modules.filter((m) => !config.hiddenModules.includes(m.id) && m.enabled);

    // Sort by custom order if exists
    if (config.customOrder) {
      const orderMap = new Map(config.customOrder.map((id, idx) => [id, idx]));
      filtered = [...filtered].sort((a, b) => {
        const aIdx = orderMap.get(a.category) ?? CATEGORY_PRIORITY[a.category] ?? 99;
        const bIdx = orderMap.get(b.category) ?? CATEGORY_PRIORITY[b.category] ?? 99;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return a.name.localeCompare(b.name, "ar");
      });
    } else {
      filtered = [...filtered].sort((a, b) => {
        const aP = CATEGORY_PRIORITY[a.category] ?? 99;
        const bP = CATEGORY_PRIORITY[b.category] ?? 99;
        if (aP !== bP) return aP - bP;
        return a.name.localeCompare(b.name, "ar");
      });
    }

    return filtered;
  }, [modules, config.hiddenModules, config.customOrder]);

  // Get modules grouped by category
  const groupedModules = useMemo(() => {
    const map = new Map<string, SidebarModule[]>();
    visibleModules.forEach((m) => {
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    });
    return map;
  }, [visibleModules]);

  // Get quick access items
  const quickAccessItems = useMemo(() => {
    const pinned = config.pinnedModules
      .map((id) => modules.find((m) => m.id === id))
      .filter(Boolean) as SidebarModule[];

    // Add most-used modules if quickAccess has room
    const recentIds = recent.slice(0, 4).map((r) => r.id);
    const recentModules = recentIds
      .map((id) => modules.find((m) => m.id === id))
      .filter((m): m is SidebarModule => !!m && !config.pinnedModules.includes(m.id));

    return [...pinned, ...recentModules].slice(0, 8);
  }, [config.pinnedModules, modules, recent]);

  // Search modules
  const searchModules = useCallback(
    (query: string): SidebarModule[] => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return modules.filter(
        (m) =>
          m.enabled &&
          !config.hiddenModules.includes(m.id) &&
          (m.name.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            (CATEGORY_NAMES[m.category] ?? "").toLowerCase().includes(q))
      );
    },
    [modules, config.hiddenModules]
  );

  return {
    config,
    visibleModules,
    groupedModules,
    quickAccess,
    quickAccessItems,
    recent,
    trackUsage,
    toggleHidden,
    togglePin,
    reorderCategories,
    searchModules,
    isHidden: (id: string) => config.hiddenModules.includes(id),
    isPinned: (id: string) => config.pinnedModules.includes(id),
  };
}
