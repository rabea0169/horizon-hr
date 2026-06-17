import { trpc } from "@/providers/trpc";

// ─── Generic tRPC data hooks for all tables ───
// These replace useLocalData with real database calls via tRPC

// ─── Employees ───
export function useTrpcEmployees() {
  return trpc.employee.list.useQuery(undefined, { staleTime: 30000 });
}
export function useTrpcCreateEmployee() {
  const utils = trpc.useUtils();
  return trpc.employee.create.useMutation({ onSuccess: () => utils.employee.list.invalidate() });
}

// ─── Departments ───
export function useTrpcDepartments() {
  return trpc.department.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── Attendance ───
export function useTrpcAttendance() {
  return trpc.attendance.list.useQuery({}, { staleTime: 30000 });
}

// ─── Sales Orders ───
export function useTrpcSalesOrders() {
  return trpc.salesOrder.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── Inventory ───
export function useTrpcInventory() {
  return trpc.inventory.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── Production Orders ───
export function useTrpcProductionOrders() {
  return trpc.productionOrder.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── Production Lines ───
export function useTrpcProductionLines() {
  return trpc.productionLine.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── Daily Production ───
export function useTrpcDailyProduction() {
  return trpc.dailyProduction.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── Payroll ───
export function useTrpcPayroll() {
  return trpc.payroll.list.useQuery({}, { staleTime: 30000 });
}

// ─── QC Records ───
export function useTrpcQCRecords() {
  return trpc.qc.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── Machines ───
export function useTrpcMachines() {
  return trpc.machine.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── Suppliers ───
export function useTrpcSuppliers() {
  return trpc.supplier.list.useQuery(undefined, { staleTime: 30000 });
}

// ─── CRM Customers ───
export function useTrpcCustomers() {
  return trpc.crm.listCustomers.useQuery(undefined, { staleTime: 30000 });
}

// ─── Generic mutation helpers ───
export function useInvalidateAll() {
  const utils = trpc.useUtils();
  return () => {
    utils.employee.list.invalidate();
    utils.department.list.invalidate();
    utils.attendance.list.invalidate();
    utils.salesOrder.list.invalidate();
    utils.inventory.list.invalidate();
    utils.productionOrder.list.invalidate();
    utils.productionLine.list.invalidate();
    utils.dailyProduction.list.invalidate();
    utils.payroll.list.invalidate();
    utils.qc.list.invalidate();
    utils.machine.list.invalidate();
    utils.supplier.list.invalidate();
    utils.crm.listCustomers.invalidate();
  };
}
