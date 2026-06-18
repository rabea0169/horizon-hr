/**
 * useApiData.ts — tRPC-backed data hooks that mirror useLocalData.ts interfaces.
 * Replacing useLocalData.ts with re-exports from this file connects ALL 54 pages
 * to the backend instantly (zero page-level changes required).
 */

import { useCallback } from "react";
import { trpc } from "@/providers/trpc";
import type {
  Employee, Department, AttendanceRecord, Leave,
  PerformanceReview, JobPosting, Candidate, PayrollRecord,
  ProductionLine, ProductionOrder, DailyProduction, Shift,
  Advance, BonusPenalty, Machine, InventoryItem,
  ProductionModel, PieceRateRecord,
  Supplier, SupplyOrder, CuttingOrder, CostRecord,
  BOMRecord, Bundle, WorkOrder, QCRecord, MRPRecord,
  Challan, Subcontract, SalesOrder, CRMCustomer, CRMInteraction,
} from "./useLocalData";

// ─── Helper to merge tRPC query/mutation into localStorage-like API ───
function useOptimisticList<T extends { id: number }>(
  queryKey: string,
  queryFn: () => T[] | undefined,
  createFn: (data: Omit<T, "id">) => Promise<{ id: number } & Record<string, unknown>>,
  updateFn: (data: { id: number } & Partial<T>) => Promise<unknown>,
  deleteFn: (data: { id: number }) => Promise<unknown>,
  utils: { invalidate: () => void }
) {
  const items = queryFn() ?? [];

  const create = useCallback(
    async (item: Omit<T, "id">) => {
      const result = await createFn(item as Omit<T, "id">);
      utils.invalidate();
      return result as T;
    },
    [createFn, utils]
  );

  const update = useCallback(
    async (id: number, changes: Partial<T>) => {
      await updateFn({ id, ...changes });
      utils.invalidate();
    },
    [updateFn, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteFn({ id });
      utils.invalidate();
    },
    [deleteFn, utils]
  );

  return {
    data: items,
    create,
    update,
    remove,
    save: () => { /* no-op: server is source of truth */ },
  };
}

// ═══════════════════════════════════════════════════════════════════
//  DEPARTMENTS
// ═══════════════════════════════════════════════════════════════════
export function useDepartments() {
  const utils = trpc.department.list.useUtils();
  const { data } = trpc.department.list.useQuery();
  const createMut = trpc.department.create.useMutation();
  const updateMut = trpc.department.update.useMutation();
  const deleteMut = trpc.department.delete.useMutation();

  const create = useCallback(
    (dept: Omit<Department, "id" | "employees">) => {
      return createMut.mutateAsync(dept);
    },
    [createMut]
  );
  const update = useCallback(
    (id: number, dept: Partial<Department>) => {
      updateMut.mutate({ id, ...dept });
    },
    [updateMut]
  );
  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  return {
    data: data ?? [],
    create,
    update,
    remove,
    save: () => {},
  };
}

// ═══════════════════════════════════════════════════════════════════
//  EMPLOYEES
// ═══════════════════════════════════════════════════════════════════
export function useEmployees() {
  const utils = trpc.employee.list.useUtils();
  const { data } = trpc.employee.list.useQuery();
  const createMut = trpc.employee.create.useMutation();
  const updateMut = trpc.employee.update.useMutation();
  const deleteMut = trpc.employee.delete.useMutation();

  const create = useCallback(
    (emp: Omit<Employee, "id" | "department">) => {
      return createMut.mutateAsync({
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        departmentId: emp.departmentId,
        role: emp.role,
        jobTitle: emp.jobTitle,
        joinDate: emp.joinDate,
        salary: emp.salary,
        status: emp.status as "active" | "on_leave" | "inactive" | "terminated",
        employmentType: emp.employmentType as "full_time" | "part_time" | "contract" | "intern",
      });
    },
    [createMut]
  );
  const update = useCallback(
    (id: number, emp: Partial<Employee>) => {
      const { department, ...rest } = emp;
      updateMut.mutate({ id, ...rest });
    },
    [updateMut]
  );
  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  return {
    data: (data?.employees as Employee[]) ?? [],
    create,
    update,
    remove,
    save: () => {},
  };
}

// ═══════════════════════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════════════════════
export function useAttendance() {
  const utils = trpc.attendance.list.useUtils();
  const raw = trpc.attendance.list.useQuery();
  const data = raw.data as { attendance: AttendanceRecord[]; total: number; page: number; pageSize: number } | undefined;
  const createMut = trpc.attendance.create.useMutation();
  const updateMut = trpc.attendance.update.useMutation();

  const create = useCallback(
    (record: Omit<AttendanceRecord, "id">) => {
      return createMut.mutateAsync(record);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<AttendanceRecord>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data?.attendance ?? []) as AttendanceRecord[],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  LEAVES
// ═══════════════════════════════════════════════════════════════════
export function useLeaves() {
  const utils = trpc.leave.list.useUtils();
  const { data } = trpc.leave.list.useQuery();
  const updateMut = trpc.leave.update.useMutation();

  const update = useCallback(
    (id: number, changes: Partial<Leave>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as Leave[],
    save: () => {},
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PERFORMANCE REVIEWS
// ═══════════════════════════════════════════════════════════════════
export function usePerformanceReviews() {
  const utils = trpc.performance.list.useUtils();
  const raw = trpc.performance.list.useQuery();
  const data = raw.data as { reviews: PerformanceReview[]; total: number; page: number; pageSize: number } | undefined;
  const createMut = trpc.performance.create.useMutation();
  const updateMut = trpc.performance.update.useMutation();

  const create = useCallback(
    (review: Omit<PerformanceReview, "id">) => {
      return createMut.mutateAsync(review);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<PerformanceReview>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data?.reviews ?? []) as PerformanceReview[],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  JOB POSTINGS
// ═══════════════════════════════════════════════════════════════════
export function useJobPostings() {
  const utils = trpc.jobPosting.list.useUtils();
  const raw = trpc.jobPosting.list.useQuery();
  const data = raw.data as { jobs: JobPosting[]; total: number; page: number; pageSize: number } | undefined;
  const createMut = trpc.jobPosting.create.useMutation();

  const create = useCallback(
    (job: Omit<JobPosting, "id" | "candidateCount">) => {
      return createMut.mutateAsync(job);
    },
    [createMut]
  );

  return {
    data: (data?.jobs ?? []) as JobPosting[],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    save: () => {},
    create,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CANDIDATES
// ═══════════════════════════════════════════════════════════════════
export function useCandidates() {
  const utils = trpc.candidate.list.useUtils();
  const raw = trpc.candidate.list.useQuery();
  const data = raw.data as { candidates: Candidate[]; total: number; page: number; pageSize: number } | undefined;
  const createMut = trpc.candidate.create.useMutation();
  const updateMut = trpc.candidate.update.useMutation();

  const create = useCallback(
    (candidate: Omit<Candidate, "id" | "createdAt">) => {
      return createMut.mutateAsync(candidate);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Candidate>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data?.candidates ?? []) as Candidate[],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PAYROLL
// ═══════════════════════════════════════════════════════════════════
export function usePayroll() {
  const utils = trpc.payroll.list.useUtils();
  const raw = trpc.payroll.list.useQuery();
  const data = raw.data as { payrolls: PayrollRecord[]; total: number; page: number; pageSize: number } | undefined;

  return {
    data: (data?.payrolls ?? []) as PayrollRecord[],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    save: () => {},
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PRODUCTION LINES
// ═══════════════════════════════════════════════════════════════════
export function useProductionLines() {
  const utils = trpc.productionLine.list.useUtils();
  const { data } = trpc.productionLine.list.useQuery();
  const createMut = trpc.productionLine.create.useMutation();
  const updateMut = trpc.productionLine.update.useMutation();

  const create = useCallback(
    (line: Omit<ProductionLine, "id" | "employeeCount">) => {
      return createMut.mutateAsync(line);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<ProductionLine>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as ProductionLine[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PRODUCTION ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useProductionOrders() {
  const utils = trpc.productionOrder.list.useUtils();
  const { data } = trpc.productionOrder.list.useQuery();
  const createMut = trpc.productionOrder.create.useMutation();
  const updateMut = trpc.productionOrder.update.useMutation();

  const create = useCallback(
    (order: Omit<ProductionOrder, "id" | "completed">) => {
      return createMut.mutateAsync(order);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<ProductionOrder>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as ProductionOrder[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  DAILY PRODUCTION
// ═══════════════════════════════════════════════════════════════════
export function useDailyProduction() {
  const utils = trpc.dailyProduction.list.useUtils();
  const { data } = trpc.dailyProduction.list.useQuery();
  const createMut = trpc.dailyProduction.create.useMutation();

  const create = useCallback(
    (record: Omit<DailyProduction, "id">) => {
      return createMut.mutateAsync(record);
    },
    [createMut]
  );

  return {
    data: (data ?? []) as DailyProduction[],
    save: () => {},
    create,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SHIFTS
// ═══════════════════════════════════════════════════════════════════
export function useShifts() {
  const utils = trpc.shift.list.useUtils();
  const { data } = trpc.shift.list.useQuery();
  const createMut = trpc.shift.create.useMutation();
  const updateMut = trpc.shift.update.useMutation();

  const create = useCallback(
    (shift: Omit<Shift, "id" | "employeeCount">) => {
      return createMut.mutateAsync(shift);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Shift>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as Shift[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  ADVANCES
// ═══════════════════════════════════════════════════════════════════
export function useAdvances() {
  const utils = trpc.advance.list.useUtils();
  const { data } = trpc.advance.list.useQuery();
  const createMut = trpc.advance.create.useMutation();
  const updateMut = trpc.advance.update.useMutation();

  const create = useCallback(
    (advance: Omit<Advance, "id">) => {
      return createMut.mutateAsync(advance);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Advance>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as Advance[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  BONUS / PENALTIES
// ═══════════════════════════════════════════════════════════════════
export function useBonusPenalties() {
  const utils = trpc.bonusPenalty.list.useUtils();
  const { data } = trpc.bonusPenalty.list.useQuery();
  const createMut = trpc.bonusPenalty.create.useMutation();
  const deleteMut = trpc.bonusPenalty.delete.useMutation();

  const create = useCallback(
    (bp: Omit<BonusPenalty, "id">) => {
      return createMut.mutateAsync(bp);
    },
    [createMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  return {
    data: (data ?? []) as BonusPenalty[],
    save: () => {},
    create,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  MACHINES
// ═══════════════════════════════════════════════════════════════════
export function useMachines() {
  const utils = trpc.machine.list.useUtils();
  const { data } = trpc.machine.list.useQuery();
  const createMut = trpc.machine.create.useMutation();
  const updateMut = trpc.machine.update.useMutation();

  const create = useCallback(
    (machine: Omit<Machine, "id">) => {
      return createMut.mutateAsync(machine);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Machine>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as Machine[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  INVENTORY
// ═══════════════════════════════════════════════════════════════════
export function useInventory() {
  const utils = trpc.inventory.list.useUtils();
  const { data } = trpc.inventory.list.useQuery();
  const createMut = trpc.inventory.create.useMutation();
  const updateMut = trpc.inventory.update.useMutation();
  const deleteMut = trpc.inventory.delete.useMutation();

  const create = useCallback(
    (item: Omit<InventoryItem, "id">) => {
      return createMut.mutateAsync(item);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<InventoryItem>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  return {
    data: (data ?? []) as InventoryItem[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PRODUCTION MODELS
// ═══════════════════════════════════════════════════════════════════
export function useProductionModels() {
  const utils = trpc.productionModel.list.useUtils();
  const { data } = trpc.productionModel.list.useQuery();
  const createMut = trpc.productionModel.create.useMutation();
  const updateMut = trpc.productionModel.update.useMutation();
  const deleteMut = trpc.productionModel.delete.useMutation();

  const create = useCallback(
    (model: Omit<ProductionModel, "id" | "stages"> & { stages?: Array<Record<string, unknown>> }) => {
      return createMut.mutateAsync(model);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<ProductionModel>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  // Stage management — delegated to modelStage router
  const stageCreate = trpc.modelStage.create.useMutation();
  const stageUpdate = trpc.modelStage.update.useMutation();
  const stageDelete = trpc.modelStage.delete.useMutation();

  const addStage = useCallback(
    (modelId: number, stage: Omit<import("./useLocalData").ProductionStage, "id">) => {
      return stageCreate.mutateAsync({ modelId, ...stage });
    },
    [stageCreate]
  );

  const updateStage = useCallback(
    (modelId: number, stageId: number, changes: Partial<import("./useLocalData").ProductionStage>) => {
      stageUpdate.mutate({ id: stageId, ...changes });
    },
    [stageUpdate]
  );

  const removeStage = useCallback(
    (modelId: number, stageId: number) => {
      stageDelete.mutate({ id: stageId });
    },
    [stageDelete]
  );

  return {
    data: (data ?? []) as ProductionModel[],
    save: () => {},
    create,
    update,
    remove,
    addStage,
    updateStage,
    removeStage,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PIECE RATE RECORDS
// ═══════════════════════════════════════════════════════════════════
export function usePieceRateRecords() {
  const utils = trpc.pieceRate.list.useUtils();
  const { data } = trpc.pieceRate.list.useQuery();
  const createMut = trpc.pieceRate.create.useMutation();
  const updateMut = trpc.pieceRate.update.useMutation();
  const deleteMut = trpc.pieceRate.delete.useMutation();

  const create = useCallback(
    (record: Omit<PieceRateRecord, "id" | "total">) => {
      return createMut.mutateAsync(record);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<PieceRateRecord>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  return {
    data: (data ?? []) as PieceRateRecord[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SUPPLIERS
// ═══════════════════════════════════════════════════════════════════
export function useSuppliers() {
  const utils = trpc.supplier.list.useUtils();
  const { data } = trpc.supplier.list.useQuery();
  const createMut = trpc.supplier.create.useMutation();
  const updateMut = trpc.supplier.update.useMutation();
  const deleteMut = trpc.supplier.delete.useMutation();

  const create = useCallback(
    (supplier: Omit<Supplier, "id">) => {
      return createMut.mutateAsync(supplier);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Supplier>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  return {
    data: (data ?? []) as Supplier[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SUPPLY ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useSupplyOrders() {
  const utils = trpc.supplyOrder.list.useUtils();
  const { data } = trpc.supplyOrder.list.useQuery();
  const createMut = trpc.supplyOrder.create.useMutation();
  const updateMut = trpc.supplyOrder.update.useMutation();

  const create = useCallback(
    (order: Omit<SupplyOrder, "id">) => {
      return createMut.mutateAsync(order);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<SupplyOrder>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as SupplyOrder[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CUTTING ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useCuttingOrders() {
  const utils = trpc.cuttingOrder.list.useUtils();
  const { data } = trpc.cuttingOrder.list.useQuery();
  const createMut = trpc.cuttingOrder.create.useMutation();
  const updateMut = trpc.cuttingOrder.update.useMutation();
  const deleteMut = trpc.cuttingOrder.delete.useMutation();

  const create = useCallback(
    async (order: Omit<CuttingOrder, "id">) => {
      const result = await createMut.mutateAsync({
        orderNumber: order.orderCode,
        modelId: order.modelId ?? 0,
        fabricDescription: order.fabricName,
        color: order.color,
        size: order.size,
        quantity: order.totalPieces,
      });
      utils.invalidate();
      return {
        id: result.id,
        orderCode: result.orderNumber,
        modelId: result.modelId,
        modelName: result.model?.name,
        fabricName: result.fabricDescription,
        color: result.color,
        size: result.size,
        totalPieces: result.quantity,
        status: result.status,
        date: result.createdAt ? new Date(result.createdAt).toISOString().split("T")[0] : "",
        stages: []
      } as unknown as CuttingOrder;
    },
    [createMut, utils]
  );

  const update = useCallback(
    async (id: number, changes: Partial<CuttingOrder>) => {
      await updateMut.mutateAsync({
        id,
        status: changes.status as any,
        cutQuantity: changes.goodPieces
      });
      utils.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.invalidate();
    },
    [deleteMut, utils]
  );

  const mappedData = (data ?? []).map(r => ({
    id: r.id,
    orderCode: r.orderNumber,
    modelId: r.modelId,
    modelName: r.model?.name,
    fabricName: r.fabricDescription ?? "",
    color: r.color ?? "",
    size: r.size ?? "",
    totalPieces: r.quantity,
    goodPieces: r.cutQuantity ?? 0,
    defectedPieces: 0,
    status: r.status,
    date: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
    stages: []
  }));

  return {
    data: mappedData as unknown as CuttingOrder[],
    save: () => {},
    create,
    update,
    remove,
    toggleStage: () => {},
  };
}

// ═══════════════════════════════════════════════════════════════════
//  COST RECORDS
// ═══════════════════════════════════════════════════════════════════
export function useCostRecords() {
  const utils = trpc.costCalculation.list.useUtils();
  const { data } = trpc.costCalculation.list.useQuery();
  const createMut = trpc.costCalculation.create.useMutation();
  const updateMut = trpc.costCalculation.update.useMutation();
  const deleteMut = trpc.costCalculation.delete.useMutation();

  const create = useCallback(
    (record: Omit<CostRecord, "id">) => {
      return createMut.mutateAsync(record);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<CostRecord>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  return {
    data: (data ?? []) as CostRecord[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  BOM RECORDS
// ═══════════════════════════════════════════════════════════════════
export function useBOMRecords() {
  const utils = trpc.bom.list.useUtils();
  const { data } = trpc.bom.list.useQuery();
  const createMut = trpc.bom.create.useMutation();
  const updateMut = trpc.bom.update.useMutation();
  const deleteMut = trpc.bom.delete.useMutation();

  const create = useCallback(
    async (bom: Omit<BOMRecord, "id">) => {
      const result = await createMut.mutateAsync({
        modelId: bom.modelId,
        items: bom.items
      });
      utils.invalidate();
      return result as unknown as BOMRecord;
    },
    [createMut, utils]
  );

  const update = useCallback(
    async (id: number, changes: Partial<BOMRecord>) => {
      await updateMut.mutateAsync({
        id,
        modelId: changes.modelId ?? id,
        items: changes.items ?? []
      });
      utils.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.invalidate();
    },
    [deleteMut, utils]
  );

  return {
    data: (data ?? []) as BOMRecord[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  BUNDLES
// ═══════════════════════════════════════════════════════════════════
export function useBundles() {
  const utils = trpc.bundle.list.useUtils();
  const { data } = trpc.bundle.list.useQuery();
  const createMut = trpc.bundle.create.useMutation();
  const updateMut = trpc.bundle.update.useMutation();

  const create = useCallback(
    (bundle: Omit<Bundle, "id">) => {
      return createMut.mutateAsync(bundle);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Bundle>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as Bundle[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  WORK ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useWorkOrders() {
  const utils = trpc.workOrder.list.useUtils();
  const { data } = trpc.workOrder.list.useQuery();
  const createMut = trpc.workOrder.create.useMutation();
  const updateMut = trpc.workOrder.update.useMutation();
  const deleteMut = trpc.workOrder.delete.useMutation();
  const toggleStageMut = trpc.workOrder.toggleStage.useMutation();

  const create = useCallback(
    async (order: Omit<WorkOrder, "id">) => {
      const result = await createMut.mutateAsync({
        orderNumber: order.orderCode,
        modelId: order.modelId ?? 0,
        productionOrderId: order.productionOrderId,
        lineId: order.lineId,
        quantity: order.quantity,
        priority: order.priority,
        startDate: order.startDate,
      });
      utils.invalidate();
      return result as unknown as WorkOrder;
    },
    [createMut, utils]
  );

  const update = useCallback(
    async (id: number, changes: Partial<WorkOrder>) => {
      await updateMut.mutateAsync({
        id,
        status: changes.status,
        completed: changes.completed,
      });
      utils.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.invalidate();
    },
    [deleteMut, utils]
  );

  const toggleStage = useCallback(
    async (workOrderId: number, stageId: number) => {
      await toggleStageMut.mutateAsync({ workOrderId, stageId });
      utils.invalidate();
    },
    [toggleStageMut, utils]
  );

  const safeWorkOrders = (data ?? []).map((o: any) => ({
    ...o,
    orderCode: String(o.orderCode ?? o.orderNumber ?? ""),
    modelName: String(o.modelName ?? ""),
    stages: Array.isArray(o.stages) ? o.stages : [],
    priority: o.priority ?? "normal",
    status: o.status ?? "pending",
    startDate: String(o.startDate ?? ""),
    quantity: Number(o.quantity ?? 0),
  }));

  return {
    data: safeWorkOrders as unknown as WorkOrder[],
    save: () => {},
    create,
    update,
    remove,
    toggleStage,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  QC RECORDS
// ═══════════════════════════════════════════════════════════════════
export function useQCRecords() {
  const utils = trpc.qc.list.useUtils();
  const { data } = trpc.qc.list.useQuery();
  const createMut = trpc.qc.create.useMutation();
  const updateMut = trpc.qc.update.useMutation();

  const create = useCallback(
    (record: Omit<QCRecord, "id">) => {
      return createMut.mutateAsync(record);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<QCRecord>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as QCRecord[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  MRP RECORDS
// ═══════════════════════════════════════════════════════════════════
export function useMRPRecords() {
  const utils = trpc.mrp.list.useUtils();
  const { data } = trpc.mrp.list.useQuery();
  const createMut = trpc.mrp.create.useMutation();
  const updateMut = trpc.mrp.update.useMutation();
  const deleteMut = trpc.mrp.delete.useMutation();

  const create = useCallback(
    async (rec: Omit<MRPRecord, "id">) => {
      const result = await createMut.mutateAsync({
        productionOrderId: Number(rec.productionOrders?.[0]) || undefined,
        materialName: rec.materialName,
        category: rec.category,
        unit: rec.unit,
        requiredQuantity: rec.requiredQty,
        availableQuantity: rec.currentStock,
        status: rec.status as any
      });
      utils.invalidate();
      return result;
    },
    [createMut, utils]
  );

  const update = useCallback(
    async (id: number, changes: Partial<MRPRecord>) => {
      await updateMut.mutateAsync({
        id,
        materialName: changes.materialName,
        category: changes.category,
        unit: changes.unit,
        availableQuantity: changes.currentStock,
        requiredQuantity: changes.requiredQty,
        status: changes.status as any
      });
      utils.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.invalidate();
    },
    [deleteMut, utils]
  );

  const dbStatusToUiStatus = (dbStatus: string | null | undefined): MRPRecord["status"] => {
    switch (dbStatus) {
      case "available": return "sufficient";
      case "shortage": return "critical";
      case "ordered": return "order_needed";
      case "planned": return "planned";
      case "sufficient": return "sufficient";
      case "low": return "low";
      case "critical": return "critical";
      case "order_needed": return "order_needed";
      default: return "planned";
    }
  };

  const mappedData = (data ?? []).map((r: any) => ({
    id: r.id,
    materialName: String(r.item?.name ?? r.materialName ?? "مادة غير معروفة"),
    category: String(r.item?.category ?? "other"),
    currentStock: Number(r.availableQuantity ?? r.item?.quantity ?? 0),
    minLevel: Number(r.item?.minStock ?? 0),
    requiredQty: Number(r.requiredQuantity ?? 0),
    unit: String(r.item?.unit ?? "قطعة"),
    productionOrders: r.productionOrderId ? [String(r.productionOrderId)] : [],
    status: dbStatusToUiStatus(r.status),
    lastUpdated: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
  }));

  return {
    data: mappedData as unknown as MRPRecord[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CHALLANS
// ═══════════════════════════════════════════════════════════════════
export function useChallans() {
  const utils = trpc.challan.list.useUtils();
  const { data } = trpc.challan.list.useQuery();
  const createMut = trpc.challan.create.useMutation();
  const updateMut = trpc.challan.update.useMutation();

  const create = useCallback(
    (challan: Omit<Challan, "id">) => {
      return createMut.mutateAsync(challan);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Challan>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as Challan[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SUBCONTRACTS
// ═══════════════════════════════════════════════════════════════════
export function useSubcontracts() {
  const utils = trpc.subcontract.list.useUtils();
  const { data } = trpc.subcontract.list.useQuery();
  const createMut = trpc.subcontract.create.useMutation();
  const updateMut = trpc.subcontract.update.useMutation();

  const create = useCallback(
    (sub: Omit<Subcontract, "id">) => {
      return createMut.mutateAsync(sub);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Subcontract>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as Subcontract[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SALES ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useSalesOrders() {
  const utils = trpc.salesOrder.list.useUtils();
  const { data } = trpc.salesOrder.list.useQuery();
  const createMut = trpc.salesOrder.create.useMutation();
  const updateMut = trpc.salesOrder.update.useMutation();

  const create = useCallback(
    (order: Omit<SalesOrder, "id">) => {
      return createMut.mutateAsync(order);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<SalesOrder>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as SalesOrder[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CRM CUSTOMERS
// ═══════════════════════════════════════════════════════════════════
export function useCRMCustomers() {
  const utils = trpc.crm.list.useUtils();
  const { data } = trpc.crm.list.useQuery();
  const createMut = trpc.crm.createCustomer.useMutation();
  const updateMut = trpc.crm.updateCustomer.useMutation();

  const create = useCallback(
    (customer: Omit<CRMCustomer, "id">) => {
      return createMut.mutateAsync(customer);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<CRMCustomer>) => {
      updateMut.mutate({ id, ...changes });
    },
    [updateMut]
  );

  return {
    data: (data ?? []) as CRMCustomer[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CRM INTERACTIONS
// ═══════════════════════════════════════════════════════════════════
export function useCRMInteractions() {
  const utils = trpc.crm.listInteractions.useUtils();
  const { data } = trpc.crm.listInteractions.useQuery();
  const createMut = trpc.crm.createInteraction.useMutation();

  const create = useCallback(
    (interaction: Omit<CRMInteraction, "id">) => {
      return createMut.mutateAsync(interaction);
    },
    [createMut]
  );

  return {
    data: (data ?? []) as CRMInteraction[],
    save: () => {},
    create,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PURCHASE REQUESTS
// ═══════════════════════════════════════════════════════════════════
export function usePurchaseRequests() { return trpc.purchaseRequest.list.useQuery().data ?? []; }
export function useCreatePurchaseRequest() { const utils = trpc.purchaseRequest.list.useUtils(); const m = trpc.purchaseRequest.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdatePurchaseRequest() { const utils = trpc.purchaseRequest.list.useUtils(); const m = trpc.purchaseRequest.updateStatus.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }) }; }
export function useApprovePurchaseRequest() { const utils = trpc.purchaseRequest.list.useUtils(); const m = trpc.purchaseRequest.approve.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }) }; }
export function useRejectPurchaseRequest() { const utils = trpc.purchaseRequest.list.useUtils(); const m = trpc.purchaseRequest.reject.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }) }; }
export function useDeletePurchaseRequest() { const utils = trpc.purchaseRequest.list.useUtils(); const m = trpc.purchaseRequest.delete.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.invalidate() }) }; }
export function usePurchaseRequestStats() { return trpc.purchaseRequest.stats.useQuery().data ?? { total: 0, draft: 0, pendingApproval: 0, approved: 0, rejected: 0, converted: 0 }; }

// ═══════════════════════════════════════════════════════════════════
//  PURCHASE ORDERS
// ═══════════════════════════════════════════════════════════════════
export function usePurchaseOrders() { return trpc.purchaseOrder.list.useQuery().data ?? []; }
export function useCreatePurchaseOrder() { const utils = trpc.purchaseOrder.list.useUtils(); const m = trpc.purchaseOrder.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdatePurchaseOrderStatus() { const utils = trpc.purchaseOrder.list.useUtils(); const m = trpc.purchaseOrder.updateStatus.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.invalidate() }) }; }
export function useDeletePurchaseOrder() { const utils = trpc.purchaseOrder.list.useUtils(); const m = trpc.purchaseOrder.delete.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.invalidate() }) }; }
export function usePurchaseOrderStats() { return trpc.purchaseOrder.stats.useQuery().data ?? { total: 0, sent: 0, confirmed: 0, fullyReceived: 0 }; }

// ═══════════════════════════════════════════════════════════════════
//  RFQ (Request for Quotation)
// ═══════════════════════════════════════════════════════════════════
export function useRFQs() { return trpc.rfq.list.useQuery().data ?? []; }
export function useCreateRFQ() { const utils = trpc.rfq.list.useUtils(); const m = trpc.rfq.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdateRFQStatus() { const utils = trpc.rfq.list.useUtils(); const m = trpc.rfq.updateStatus.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.invalidate() }) }; }
export function useAddRFQResponse() { const utils = trpc.rfq.list.useUtils(); const m = trpc.rfq.addResponse.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }) }; }
export function useAwardRFQResponse() { const utils = trpc.rfq.list.useUtils(); const m = trpc.rfq.awardResponse.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.invalidate() }) }; }
export function useRFQStats() { return trpc.rfq.stats.useQuery().data ?? { total: 0, draft: 0, sent: 0, bidding: 0, awarded: 0 }; }

// ═══════════════════════════════════════════════════════════════════
//  GOODS RECEIPTS
// ═══════════════════════════════════════════════════════════════════
export function useGoodsReceipts() { return trpc.goodsReceipt.list.useQuery().data ?? []; }
export function useCreateGoodsReceipt() { const utils = trpc.goodsReceipt.list.useUtils(); const m = trpc.goodsReceipt.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdateGoodsReceiptStatus() { const utils = trpc.goodsReceipt.list.useUtils(); const m = trpc.goodsReceipt.updateStatus.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.invalidate() }) }; }
export function useGoodsReceiptStats() { return trpc.goodsReceipt.stats.useQuery().data ?? { total: 0, pendingInspection: 0, partiallyAccepted: 0, fullyAccepted: 0 }; }

// ═══════════════════════════════════════════════════════════════════
//  SALES PIPELINE
// ═══════════════════════════════════════════════════════════════════
export function useOpportunities() { return trpc.salesPipeline.listOpportunities.useQuery().data ?? []; }
export function usePipelineStages() { return trpc.salesPipeline.listStages.useQuery().data ?? []; }
export function useCreateOpportunity() { const utils = trpc.salesPipeline.listOpportunities.useUtils(); const m = trpc.salesPipeline.createOpportunity.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdateOpportunity() { const utils = trpc.salesPipeline.listOpportunities.useUtils(); const m = trpc.salesPipeline.updateOpportunity.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }) }; }
export function useMoveOpportunityStage() { const utils = trpc.salesPipeline.listOpportunities.useUtils(); const m = trpc.salesPipeline.moveStage.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }) }; }
export function usePipelineDashboard() { return trpc.salesPipeline.dashboard.useQuery().data ?? { total: 0, open: 0, won: 0, lost: 0, pipelineValue: 0 }; }

// ═══════════════════════════════════════════════════════════════════
//  SALES COMMISSIONS
// ═══════════════════════════════════════════════════════════════════
export function useSalesCommissions() { return trpc.salesCommission.list.useQuery().data ?? []; }
export function useCreateCommission() { const utils = trpc.salesCommission.list.useUtils(); const m = trpc.salesCommission.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useMarkCommissionPaid() { const utils = trpc.salesCommission.list.useUtils(); const m = trpc.salesCommission.markPaid.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.invalidate() }) }; }
export function useBulkCreateCommissions() { const utils = trpc.salesCommission.list.useUtils(); const m = trpc.salesCommission.bulkCreate.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }) }; }
export function useCommissionStats() { return trpc.salesCommission.stats.useQuery().data ?? { total: 0, paid: 0, unpaid: 0, totalAmount: 0, paidAmount: 0 }; }

// ═══════════════════════════════════════════════════════════════════
//  SHIPPING
// ═══════════════════════════════════════════════════════════════════
export function useShipments() { return trpc.shipping.list.useQuery().data ?? []; }
export function useCreateShipment() { const utils = trpc.shipping.list.useUtils(); const m = trpc.shipping.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdateShipmentStatus() { const utils = trpc.shipping.list.useUtils(); const m = trpc.shipping.updateStatus.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.invalidate() }) }; }
export function useShippingStats() { return trpc.shipping.stats.useQuery().data ?? { total: 0, pending: 0, inTransit: 0, delivered: 0, returned: 0 }; }
