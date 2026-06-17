/**
 * useLocalStore.ts — localStorage-backed CRUD for ALL entity types.
 * Used as fallback when MySQL (tRPC) is unavailable.
 */

const STORE_KEYS: Record<string, string> = {
  departments: "hr_departments",
  employees: "hr_employees",
  attendance: "hr_attendance",
  leaves: "hr_leaves",
  performanceReviews: "hr_performance_reviews",
  jobPostings: "hr_job_postings",
  candidates: "hr_candidates",
  payroll: "hr_payroll",
  productionLines: "hr_production_lines",
  productionOrders: "hr_production_orders",
  dailyProduction: "hr_daily_production",
  shifts: "hr_shifts",
  advances: "hr_advances",
  bonusPenalties: "hr_bonus_penalties",
  machines: "hr_machines",
  inventory: "hr_inventory",
  productionModels: "hr_production_models",
  pieceRateRecords: "hr_piece_rate",
  suppliers: "hr_suppliers",
  supplyOrders: "hr_supply_orders",
  cuttingOrders: "hr_cutting_orders",
  costRecords: "hr_cost_records",
  bomRecords: "hr_bom_records",
  bundles: "hr_bundles",
  workOrders: "hr_work_orders",
  qcRecords: "hr_qc_records",
  mrpRecords: "hr_mrp_records",
  challans: "hr_challans",
  subcontracts: "hr_subcontracts",
  salesOrders: "hr_sales_orders",
  crmCustomers: "hr_crm_customers",
  crmInteractions: "hr_crm_interactions",
};

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(STORE_KEYS[key] || key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(STORE_KEYS[key] || key, JSON.stringify(data));
  } catch { /* quota exceeded or private mode */ }
}

let nextId = 1;
function getNextId(items: { id?: number }[]): number {
  const max = items.reduce((m, i) => Math.max(m, i.id || 0), 0);
  return Math.max(max + 1, nextId++);
}

export function useLocalStore<T extends { id?: number }>(storeKey: string) {
  const getAll = (): T[] => load<T>(storeKey);
  const getById = (id: number): T | undefined => getAll().find((i) => i.id === id);
  const create = (item: Omit<T, "id">): T => {
    const items = getAll();
    const newItem = { ...item, id: getNextId(items) } as unknown as T;
    items.push(newItem);
    save(storeKey, items);
    return newItem;
  };
  const update = (id: number, changes: Partial<T>): T | undefined => {
    const items = getAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...changes };
    save(storeKey, items);
    return items[idx];
  };
  const remove = (id: number): boolean => {
    const items = getAll().filter((i) => i.id !== id);
    if (items.length === getAll().length) return false;
    save(storeKey, items);
    return true;
  };
  return { getAll, getById, create, update, remove };
}
