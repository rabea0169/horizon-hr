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

// ═══════════════════════════════════════════════════════════════════
//  DEPARTMENTS
// ═══════════════════════════════════════════════════════════════════
export function useDepartments() {
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
        status: emp.status as any,
        employmentType: emp.employmentType as any,
        salaryType: emp.salaryType as any,
      });
    },
    [createMut]
  );
  const update = useCallback(
    (id: number, emp: Partial<Employee>) => {
      const { department, ...rest } = emp;
      const mappedRest: any = { ...rest };
      if (rest.status) mappedRest.status = rest.status as any;
      if (rest.employmentType) mappedRest.employmentType = rest.employmentType as any;
      if (rest.salaryType) mappedRest.salaryType = rest.salaryType as any;
      updateMut.mutate({ id, ...mappedRest });
    },
    [updateMut]
  );
  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedEmployees = (data?.employees ?? []).map(emp => ({
    ...emp,
    joinDate: emp.joinDate ? (emp.joinDate instanceof Date ? emp.joinDate.toISOString().split("T")[0] : String(emp.joinDate)) : "",
    status: emp.status ?? "active",
    employmentType: emp.employmentType ?? "full_time",
    salaryType: emp.salaryType ?? "monthly",
    salary: emp.salary ?? "0",
    phone: emp.phone ?? undefined,
    avatar: emp.avatar ?? undefined,
    department: emp.department ? {
      id: emp.department.id,
      name: emp.department.name,
      description: emp.department.description ?? undefined,
      color: emp.department.color ?? "",
    } : undefined,
    productionLineId: (emp as any).productionLineId ?? undefined,
    shiftId: (emp as any).shiftId ?? undefined,
  }));

  return {
    data: mappedEmployees as Employee[],
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
  const raw = trpc.attendance.list.useQuery();
  const data = raw.data;
  const createMut = trpc.attendance.create.useMutation();
  const updateMut = trpc.attendance.update.useMutation();

  const create = useCallback(
    (record: Omit<AttendanceRecord, "id">) => {
      return createMut.mutateAsync(record as any);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<AttendanceRecord>) => {
      updateMut.mutate({ id, ...changes } as any);
    },
    [updateMut]
  );

  const mappedAttendance = (data?.attendance ?? []).map(r => ({
    ...r,
    date: r.date ? (r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date)) : "",
    checkIn: r.checkIn ?? undefined,
    checkOut: r.checkOut ?? undefined,
    hoursWorked: r.hoursWorked ?? undefined,
    manualCheckIn: (r as any).manualCheckIn ?? undefined,
    manualCheckOut: (r as any).manualCheckOut ?? undefined,
    employeeName: r.employee?.fullName ?? "",
    employeeCode: r.employee?.employeeCode ?? "",
  }));

  return {
    data: mappedAttendance as AttendanceRecord[],
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
  const { data } = trpc.leave.list.useQuery();
  const updateMut = trpc.leave.update.useMutation();
  const { data: emps } = trpc.employee.list.useQuery();
  const employeesMap = new Map(emps?.employees?.map(e => [e.id, e]) ?? []);

  const update = useCallback(
    (id: number, changes: Partial<Leave>) => {
      updateMut.mutate({ id, status: changes.status as any });
    },
    [updateMut]
  );

  const mappedLeaves = (data ?? []).map(l => {
    const emp = employeesMap.get(l.employeeId);
    return {
      ...l,
      startDate: l.startDate ? (l.startDate instanceof Date ? l.startDate.toISOString().split("T")[0] : String(l.startDate)) : "",
      endDate: l.endDate ? (l.endDate instanceof Date ? l.endDate.toISOString().split("T")[0] : String(l.endDate)) : "",
      employeeName: emp?.fullName ?? "",
      employeeCode: emp?.employeeCode ?? "",
    };
  });

  return {
    data: mappedLeaves as Leave[],
    save: () => {},
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PERFORMANCE REVIEWS
// ═══════════════════════════════════════════════════════════════════
export function usePerformanceReviews() {
  const raw = trpc.performance.list.useQuery();
  const data = raw.data;
  const createMut = trpc.performance.create.useMutation();
  const updateMut = trpc.performance.update.useMutation();
  const { data: emps } = trpc.employee.list.useQuery();

  const create = useCallback(
    (review: Omit<PerformanceReview, "id">) => {
      const reviewer = emps?.employees?.find(e => e.fullName === review.reviewerName);
      return createMut.mutateAsync({
        employeeId: review.employeeId,
        reviewerId: reviewer?.id ?? review.employeeId,
        period: review.period,
      });
    },
    [createMut, emps]
  );

  const update = useCallback(
    (id: number, changes: Partial<PerformanceReview>) => {
      updateMut.mutate({ id, ...changes } as any);
    },
    [updateMut]
  );

  const mappedReviews = (data?.reviews ?? []).map(r => ({
    ...r,
    overallRating: r.overallRating ?? undefined,
    communication: r.communication ?? undefined,
    teamwork: r.teamwork ?? undefined,
    productivity: r.productivity ?? undefined,
    punctuality: r.punctuality ?? undefined,
    goals: r.goals ?? undefined,
    comments: r.comments ?? undefined,
    employeeName: r.employee?.fullName ?? "",
    reviewerName: r.reviewer?.fullName ?? "",
  }));

  return {
    data: mappedReviews as PerformanceReview[],
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
  const raw = trpc.jobPosting.list.useQuery();
  const data = raw.data;
  const createMut = trpc.jobPosting.create.useMutation();
  const { data: depts } = trpc.department.list.useQuery();

  const create = useCallback(
    (job: Omit<JobPosting, "id" | "candidateCount">) => {
      const dept = depts?.find(d => d.name === job.departmentName);
      return createMut.mutateAsync({
        title: job.title,
        departmentId: dept?.id,
        description: job.description,
        requirements: job.requirements,
        location: job.location,
        salaryRange: job.salaryRange,
        employmentType: job.employmentType as any,
        status: job.status as any,
      });
    },
    [createMut, depts]
  );

  const mappedJobs = (data?.jobs ?? []).map(j => ({
    ...j,
    description: j.description ?? undefined,
    requirements: j.requirements ?? undefined,
    location: j.location ?? undefined,
    salaryRange: j.salaryRange ?? undefined,
    departmentName: j.department?.name ?? "",
  }));

  return {
    data: mappedJobs as JobPosting[],
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
  const raw = trpc.candidate.list.useQuery();
  const data = raw.data;
  const createMut = trpc.candidate.create.useMutation();
  const updateMut = trpc.candidate.update.useMutation();

  const create = useCallback(
    (candidate: Omit<Candidate, "id" | "createdAt">) => {
      return createMut.mutateAsync(candidate as any);
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Candidate>) => {
      updateMut.mutate({ id, ...changes } as any);
    },
    [updateMut]
  );

  const mappedCandidates = (data?.candidates ?? []).map(c => ({
    ...c,
    phone: c.phone ?? undefined,
    rating: c.rating ?? undefined,
    createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt)) : "",
  }));

  return {
    data: mappedCandidates as Candidate[],
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
  const utils = trpc.useUtils();
  const raw = trpc.payroll.list.useQuery({});
  const data = raw.data;
  const processMut = trpc.payroll.processPayroll.useMutation();

  const process = useCallback(
    async (month: string) => {
      const res = await processMut.mutateAsync({ month });
      utils.payroll.list.invalidate();
      return res;
    },
    [processMut, utils]
  );

  const mappedPayrolls = (data?.payrolls ?? []).map(r => ({
    ...r,
    employeeName: r.employee?.fullName ?? "",
    employeeCode: r.employee?.employeeCode ?? "",
  }));

  return {
    data: mappedPayrolls as PayrollRecord[],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
    save: () => {},
    process,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PRODUCTION LINES
// ═══════════════════════════════════════════════════════════════════
export function useProductionLines() {
  const { data } = trpc.productionLine.list.useQuery();
  const createMut = trpc.productionLine.create.useMutation();
  const updateMut = trpc.productionLine.update.useMutation();

  const create = useCallback(
    (line: Omit<ProductionLine, "id" | "employeeCount">) => {
      return createMut.mutateAsync({
        name: line.name,
        lineType: "sewing",
        capacity: line.targetDaily,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<ProductionLine>) => {
      const mappedChanges: any = {};
      if (changes.name) mappedChanges.name = changes.name;
      if (changes.status) mappedChanges.status = changes.status as any;
      if (changes.targetDaily !== undefined) mappedChanges.capacity = changes.targetDaily;
      updateMut.mutate({ id, ...mappedChanges });
    },
    [updateMut]
  );

  const mappedLines = (data ?? []).map(l => ({
    id: l.id,
    name: l.name,
    supervisorId: l.supervisorId ?? undefined,
    supervisorName: l.supervisor?.fullName ?? undefined,
    targetDaily: l.capacity ?? 0,
    status: l.status,
    employeeCount: 0,
  }));

  return {
    data: mappedLines as ProductionLine[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PRODUCTION ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useProductionOrders() {
  const { data } = trpc.productionOrder.list.useQuery();
  const createMut = trpc.productionOrder.create.useMutation();
  const updateMut = trpc.productionOrder.update.useMutation();

  const create = useCallback(
    (order: Omit<ProductionOrder, "id" | "completed">) => {
      return createMut.mutateAsync({
        orderCode: order.orderCode,
        styleName: order.styleName,
        customerName: order.customerName || undefined,
        quantity: order.quantity,
        endDate: order.deadline || undefined,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<ProductionOrder>) => {
      updateMut.mutate({ id, ...changes } as any);
    },
    [updateMut]
  );

  const mappedOrders = (data ?? []).map(o => ({
    id: o.id,
    orderCode: o.orderCode,
    customerName: o.customerName ?? "",
    styleName: o.styleName,
    sizeBreakdown: "{}",
    quantity: o.quantity,
    completed: o.completed ?? 0,
    startDate: o.startDate ? (o.startDate instanceof Date ? o.startDate.toISOString().split("T")[0] : String(o.startDate)) : "",
    deadline: o.endDate ? (o.endDate instanceof Date ? o.endDate.toISOString().split("T")[0] : String(o.endDate)) : "",
    status: o.status,
    assignedLineId: o.lineId ?? undefined,
    assignedLineName: undefined,
  }));

  return {
    data: mappedOrders as ProductionOrder[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  DAILY PRODUCTION
// ═══════════════════════════════════════════════════════════════════
export function useDailyProduction() {
  const { data } = trpc.dailyProduction.list.useQuery();
  const createMut = trpc.dailyProduction.create.useMutation();

  const create = useCallback(
    (record: Omit<DailyProduction, "id">) => {
      return createMut.mutateAsync({
        lineId: record.lineId,
        orderId: record.orderId,
        date: record.date,
        produced: record.produced,
        defected: record.defected,
      });
    },
    [createMut]
  );

  const mappedDaily = (data ?? []).map(r => ({
    id: r.id,
    date: r.date ? (r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date)) : "",
    lineId: r.lineId,
    lineName: "",
    orderId: r.orderId ?? 0,
    orderCode: "",
    produced: r.produced ?? 0,
    defected: r.defected ?? 0,
    workersPresent: r.workersCount ?? 0,
    notes: r.notes ?? undefined,
  }));

  return {
    data: mappedDaily as DailyProduction[],
    save: () => {},
    create,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SHIFTS
// ═══════════════════════════════════════════════════════════════════
export function useShifts() {
  const { data } = trpc.shift.list.useQuery();
  const createMut = trpc.shift.create.useMutation();
  const updateMut = trpc.shift.update.useMutation();

  const create = useCallback(
    (shift: Omit<Shift, "id" | "employeeCount">) => {
      return createMut.mutateAsync({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        daysOfWeek: shift.days ?? "",
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Shift>) => {
      const mappedChanges: any = { ...changes };
      if (changes.days) {
        mappedChanges.daysOfWeek = changes.days;
        delete mappedChanges.days;
      }
      updateMut.mutate({ id, ...mappedChanges });
    },
    [updateMut]
  );

  const mappedShifts = (data ?? []).map(s => ({
    id: s.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    breakMinutes: 0,
    days: s.daysOfWeek,
    employeeCount: 0,
  }));

  return {
    data: mappedShifts as Shift[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  ADVANCES
// ═══════════════════════════════════════════════════════════════════
export function useAdvances() {
  const { data } = trpc.advance.list.useQuery();
  const createMut = trpc.advance.create.useMutation();
  const updateMut = trpc.advance.update.useMutation();

  const create = useCallback(
    (advance: Omit<Advance, "id">) => {
      return createMut.mutateAsync({
        employeeId: advance.employeeId,
        amount: advance.amount,
        reason: advance.reason,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Advance>) => {
      updateMut.mutate({ id, ...changes } as any);
    },
    [updateMut]
  );

  const mappedAdvances = (data ?? []).map(r => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee?.fullName ?? "",
    employeeCode: r.employee?.employeeCode ?? "",
    amount: r.amount,
    date: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt)) : "",
    reason: r.reason ?? undefined,
    status: r.status,
    repaymentMonths: 0,
    monthlyDeduction: r.repaymentAmount ?? undefined,
  }));

  return {
    data: mappedAdvances as Advance[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  BONUS / PENALTIES
// ═══════════════════════════════════════════════════════════════════
export function useBonusPenalties() {
  const { data } = trpc.bonusPenalty.list.useQuery();
  const createMut = trpc.bonusPenalty.create.useMutation();
  const deleteMut = trpc.bonusPenalty.delete.useMutation();

  const create = useCallback(
    (bp: Omit<BonusPenalty, "id">) => {
      return createMut.mutateAsync({
        employeeId: bp.employeeId,
        type: bp.type,
        category: bp.category,
        amount: bp.amount,
        month: bp.date ? bp.date.slice(0, 7) : new Date().toISOString().slice(0, 7),
        reason: bp.reason,
      });
    },
    [createMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedBonusPenalties = (data ?? []).map(r => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee?.fullName ?? "",
    employeeCode: r.employee?.employeeCode ?? "",
    type: r.type,
    amount: r.amount,
    date: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt)) : "",
    reason: r.reason ?? "",
    category: r.category as any,
  }));

  return {
    data: mappedBonusPenalties as BonusPenalty[],
    save: () => {},
    create,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  MACHINES
// ═══════════════════════════════════════════════════════════════════
export function useMachines() {
  const { data } = trpc.machine.list.useQuery();
  const createMut = trpc.machine.create.useMutation();
  const updateMut = trpc.machine.update.useMutation();

  const create = useCallback(
    (machine: Omit<Machine, "id">) => {
      return createMut.mutateAsync({
        machineCode: machine.code,
        name: machine.name,
        type: machine.type,
        cost: "0",
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Machine>) => {
      const mappedChanges: any = { ...changes };
      if (changes.code) {
        mappedChanges.machineCode = changes.code;
        delete mappedChanges.code;
      }
      if (changes.status) {
        mappedChanges.status = changes.status;
      }
      updateMut.mutate({ id, ...mappedChanges });
    },
    [updateMut]
  );

  const mappedMachines = (data ?? []).map(r => ({
    id: r.id,
    name: r.name,
    code: r.machineCode,
    type: r.type as any,
    lineId: r.lineId ?? undefined,
    lineName: undefined,
    status: r.status === "operational" ? "operational" as const : "maintenance" as const,
    lastMaintenance: undefined,
    nextMaintenance: r.nextMaintenance ? (r.nextMaintenance instanceof Date ? r.nextMaintenance.toISOString().split("T")[0] : String(r.nextMaintenance)) : undefined,
  }));

  return {
    data: mappedMachines as Machine[],
    save: () => {},
    create,
    update,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  INVENTORY
// ═══════════════════════════════════════════════════════════════════
export function useInventory() {
  const { data } = trpc.inventory.list.useQuery();
  const createMut = trpc.inventory.create.useMutation();
  const updateMut = trpc.inventory.update.useMutation();
  const deleteMut = trpc.inventory.delete.useMutation();

  const create = useCallback(
    (item: Omit<InventoryItem, "id">) => {
      return createMut.mutateAsync({
        sku: item.code,
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        minStock: item.minLevel,
        unitCost: item.unitPrice,
        location: item.location,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<InventoryItem>) => {
      const mappedChanges: any = { ...changes };
      if (changes.code) {
        mappedChanges.sku = changes.code;
        delete mappedChanges.code;
      }
      if (changes.minLevel !== undefined) {
        mappedChanges.minStock = changes.minLevel;
        delete mappedChanges.minLevel;
      }
      if (changes.unitPrice !== undefined) {
        mappedChanges.unitCost = changes.unitPrice;
        delete mappedChanges.unitPrice;
      }
      updateMut.mutate({ id, ...mappedChanges });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedInventory = (data ?? []).map(r => ({
    id: r.id,
    code: r.sku,
    name: r.name,
    category: r.category as any,
    unit: r.unit,
    quantity: r.quantity ?? 0,
    minLevel: r.minStock ?? 0,
    unitPrice: r.unitCost ?? "0",
    location: r.location ?? undefined,
  }));

  return {
    data: mappedInventory as InventoryItem[],
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
  const { data } = trpc.productionModel.list.useQuery();
  const createMut = trpc.productionModel.create.useMutation();
  const updateMut = trpc.productionModel.update.useMutation();
  const deleteMut = trpc.productionModel.delete.useMutation();

  const create = useCallback(
    (model: Omit<ProductionModel, "id" | "stages"> & { stages?: Array<Record<string, unknown>> }) => {
      return createMut.mutateAsync({
        modelCode: model.code,
        name: model.name,
        description: model.description,
        category: model.category,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<ProductionModel>) => {
      const { code, status, ...rest } = changes;
      const mappedChanges: any = { ...rest };
      if (code) mappedChanges.modelCode = code;
      if (status) mappedChanges.status = status as any;
      updateMut.mutate({ id, ...mappedChanges });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const stageCreate = trpc.modelStage.create.useMutation();
  const stageUpdate = trpc.modelStage.update.useMutation();
  const stageDelete = trpc.modelStage.delete.useMutation();

  const addStage = useCallback(
    (modelId: number, stage: Omit<import("./useLocalData").ProductionStage, "id">) => {
      return stageCreate.mutateAsync({
        modelId,
        name: stage.name,
        sequence: stage.order,
        unitPrice: stage.unitPrice,
      });
    },
    [stageCreate]
  );

  const updateStage = useCallback(
    (_modelId: number, stageId: number, changes: Partial<import("./useLocalData").ProductionStage>) => {
      stageUpdate.mutate({ id: stageId, ...changes } as any);
    },
    [stageUpdate]
  );

  const removeStage = useCallback(
    (_modelId: number, stageId: number) => {
      stageDelete.mutate({ id: stageId });
    },
    [stageDelete]
  );

  const mappedModels = (data ?? []).map(r => ({
    id: r.id,
    code: r.modelCode,
    name: r.name,
    description: r.description ?? undefined,
    category: r.category ?? undefined,
    stages: (r.stages ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      order: s.sequence,
      unitPrice: s.unitPrice ?? "0",
    })),
    status: r.status,
  }));

  return {
    data: mappedModels as ProductionModel[],
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
  const { data } = trpc.pieceRate.list.useQuery();
  const createMut = trpc.pieceRate.create.useMutation();
  const updateMut = trpc.pieceRate.update.useMutation();
  const deleteMut = trpc.pieceRate.delete.useMutation();

  const create = useCallback(
    (record: Omit<PieceRateRecord, "id" | "total">) => {
      const qty = record.quantity ?? 0;
      const price = parseFloat(record.unitPrice ?? "0");
      return createMut.mutateAsync({
        employeeId: record.employeeId,
        modelId: record.modelId,
        stageId: record.stageId ?? undefined,
        quantity: qty,
        unitPrice: record.unitPrice,
        totalAmount: (qty * price).toString(),
        date: record.date,
        notes: record.notes ?? undefined,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<PieceRateRecord>) => {
      updateMut.mutate({ id, ...changes } as any);
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedPieceRates = (data ?? []).map(r => ({
    ...r,
    total: r.totalAmount,
    date: r.date ? (r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date)) : "",
    employeeName: r.employee?.fullName ?? "",
    employeeCode: r.employee?.employeeCode ?? "",
    modelName: r.model?.name ?? "",
    stageName: r.stage?.name ?? "",
  }));

  return {
    data: mappedPieceRates as PieceRateRecord[],
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
  const { data } = trpc.supplier.list.useQuery();
  const createMut = trpc.supplier.create.useMutation();
  const updateMut = trpc.supplier.update.useMutation();
  const deleteMut = trpc.supplier.delete.useMutation();

  const create = useCallback(
    (supplier: Omit<Supplier, "id">) => {
      return createMut.mutateAsync({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        taxNumber: supplier.code,
        notes: supplier.notes,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Supplier>) => {
      const { code, category, ...rest } = changes;
      const mappedChanges: any = { ...rest };
      if (changes.status) mappedChanges.status = changes.status as any;
      updateMut.mutate({ id, ...mappedChanges });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedSuppliers = (data ?? []).map(r => ({
    ...r,
    code: r.taxNumber ?? "",
    category: "general",
  }));

  return {
    data: mappedSuppliers as Supplier[],
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
  const { data } = trpc.supplyOrder.list.useQuery();
  const createMut = trpc.supplyOrder.create.useMutation();
  const updateMut = trpc.supplyOrder.update.useMutation();
  const deleteMut = trpc.supplyOrder.delete.useMutation();

  const create = useCallback(
    (order: Omit<SupplyOrder, "id">) => {
      return createMut.mutateAsync({
        orderNumber: order.orderCode,
        supplierId: order.supplierId,
        notes: order.notes,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<SupplyOrder>) => {
      updateMut.mutate({ id, status: changes.status as any });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedSupplyOrders = (data ?? []).map(r => ({
    id: r.id,
    orderCode: r.orderNumber,
    supplierId: r.supplierId,
    supplierName: r.supplier?.name ?? "",
    date: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt)) : "",
    items: (r.items ?? []).map((i: any) => ({
      id: i.id,
      itemName: i.itemName,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice ?? "0",
      total: i.totalPrice ?? "0",
    })),
    total: r.totalAmount ?? "0",
    status: r.status as any,
    notes: r.notes ?? undefined,
  }));

  return {
    data: mappedSupplyOrders as SupplyOrder[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CUTTING ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useCuttingOrders() {
  const utils = trpc.useUtils();
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
      utils.cuttingOrder.list.invalidate();
      return {
        id: result!.id,
        orderCode: result!.orderNumber,
        modelId: result!.modelId,
        modelName: result!.model?.name,
        fabricName: result!.fabricDescription,
        color: result!.color ?? undefined,
        size: result!.size ?? undefined,
        totalPieces: result!.quantity,
        status: result!.status,
        date: result!.createdAt ? new Date(result!.createdAt).toISOString().split("T")[0] : "",
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
      utils.cuttingOrder.list.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.cuttingOrder.list.invalidate();
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
    toggleStage: (_id: number, _stageId: number) => {},
  };
}

// ═══════════════════════════════════════════════════════════════════
//  COST RECORDS
// ═══════════════════════════════════════════════════════════════════
export function useCostRecords() {
  const { data } = trpc.costCalculation.list.useQuery();
  const createMut = trpc.costCalculation.create.useMutation();
  const updateMut = trpc.costCalculation.update.useMutation();
  const deleteMut = trpc.costCalculation.delete.useMutation();

  const create = useCallback(
    (record: Omit<CostRecord, "id">) => {
      return createMut.mutateAsync({
        modelId: record.modelId,
        totalCost: record.totalCost || "0",
        sellingPrice: record.totalCost || "0",
        fabricCost: record.fabricCost,
        laborCost: record.sewingLabor,
        overheadCost: record.overheadCost,
        notes: record.notes,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<CostRecord>) => {
      updateMut.mutate({ id, ...changes } as any);
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedCostRecords = (data ?? []).map(r => ({
    id: r.id,
    modelId: r.modelId,
    modelName: r.model?.name ?? "",
    date: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt)) : "",
    fabricCost: r.fabricCost ?? "0",
    threadCost: "0",
    accessoriesCost: r.trimCost ?? "0",
    packagingCost: "0",
    cuttingLabor: "0",
    sewingLabor: r.laborCost ?? "0",
    pressingLabor: "0",
    packagingLabor: "0",
    overheadCost: r.overheadCost ?? "0",
    totalCost: r.totalCost ?? "0",
    costPerPiece: r.totalCost ?? "0",
    targetQuantity: r.minOrderQuantity ?? 0,
    notes: r.notes ?? undefined,
  }));

  return {
    data: mappedCostRecords as CostRecord[],
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
  const utils = trpc.useUtils();
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
      utils.bom.list.invalidate();
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
      utils.bom.list.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.bom.list.invalidate();
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
  const utils = trpc.useUtils();
  const { data } = trpc.bundle.list.useQuery();
  const createMut = trpc.bundle.create.useMutation();
  const updateMut = trpc.bundle.update.useMutation();
  const deleteMut = trpc.bundle.delete.useMutation();
  const scanMut = trpc.bundle.scan.useMutation();

  const create = useCallback(
    (bundle: Omit<Bundle, "id">) => {
      return createMut.mutateAsync({
        bundleCode: bundle.bundleCode,
        modelId: bundle.modelId,
        quantity: bundle.quantity,
        size: bundle.size,
        color: bundle.color,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Bundle>) => {
      updateMut.mutate({
        id,
        status: changes.status === "in_progress" ? "sewing" : (changes.status === "completed" ? "packed" : changes.status as any),
      });
    },
    [updateMut]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.bundle.list.invalidate();
    },
    [deleteMut, utils]
  );

  const scanStage = useCallback(
    async (bundleId: number, stage: string, details?: { lineId?: number; employeeId?: number; notes?: string }) => {
      await scanMut.mutateAsync({ bundleId, stage, ...details });
      utils.bundle.list.invalidate();
    },
    [scanMut, utils]
  );

  const mappedBundles = (data ?? []).map(r => ({
    id: r.id,
    bundleCode: r.bundleCode,
    qrData: r.bundleCode,
    modelId: r.modelId,
    modelName: r.model?.name ?? "",
    size: r.size ?? "",
    color: r.color ?? "",
    quantity: r.quantity,
    stages: (r.tracking ?? []).map((t: any) => ({
      id: t.id,
      name: t.stage,
      scannedAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
      completed: true,
    })),
    status: r.status === "qc" ? "qc_failed" as const : (r.status === "packed" || r.status === "shipped" ? "completed" as const : "in_progress" as const),
    createdAt: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)) : "",
  }));

  return {
    data: mappedBundles as Bundle[],
    save: () => {},
    create,
    update,
    remove,
    scanStage,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  WORK ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useWorkOrders() {
  const utils = trpc.useUtils();
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
      utils.workOrder.list.invalidate();
      return result as unknown as WorkOrder;
    },
    [createMut, utils]
  );

  const update = useCallback(
    async (id: number, changes: Partial<WorkOrder>) => {
      await updateMut.mutateAsync({
        id,
        status: changes.status === "on_hold" ? "pending" : changes.status as any,
      });
      utils.workOrder.list.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.workOrder.list.invalidate();
    },
    [deleteMut, utils]
  );

  const toggleStage = useCallback(
    async (workOrderId: number, stageId: number) => {
      await toggleStageMut.mutateAsync({ workOrderId, stageId });
      utils.workOrder.list.invalidate();
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
  const utils = trpc.useUtils();
  const { data } = trpc.qc.list.useQuery();
  const createMut = trpc.qc.create.useMutation();
  const updateMut = trpc.qc.update.useMutation();
  const deleteMut = trpc.qc.delete.useMutation();

  const create = useCallback(
    async (record: Omit<QCRecord, "id">) => {
      const res = await createMut.mutateAsync(record as any);
      utils.qc.list.invalidate();
      return res;
    },
    [createMut, utils]
  );

  const update = useCallback(
    async (id: number, changes: Partial<QCRecord>) => {
      await updateMut.mutateAsync({ id, ...changes } as any);
      utils.qc.list.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.qc.list.invalidate();
    },
    [deleteMut, utils]
  );

  return {
    data: (data ?? []) as QCRecord[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  MRP RECORDS
// ═══════════════════════════════════════════════════════════════════
export function useMRPRecords() {
  const utils = trpc.useUtils();
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
        status: rec.status === "sufficient" ? "available" : (rec.status === "critical" ? "shortage" : "planned")
      });
      utils.mrp.list.invalidate();
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
        status: changes.status === "sufficient" ? "available" : (changes.status === "critical" ? "shortage" : "planned")
      });
      utils.mrp.list.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.mrp.list.invalidate();
    },
    [deleteMut, utils]
  );

  const dbStatusToUiStatus = (dbStatus: string | null | undefined): MRPRecord["status"] => {
    switch (dbStatus) {
      case "available": return "sufficient";
      case "shortage": return "critical";
      case "ordered": return "order_needed";
      case "planned": return "sufficient";
      case "sufficient": return "sufficient";
      case "low": return "low";
      case "critical": return "critical";
      case "order_needed": return "order_needed";
      default: return "sufficient";
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
  const { data } = trpc.challan.list.useQuery();
  const createMut = trpc.challan.create.useMutation();
  const updateMut = trpc.challan.update.useMutation();
  const deleteMut = trpc.challan.delete.useMutation();

  const create = useCallback(
    (challan: Omit<Challan, "id">) => {
      return createMut.mutateAsync({
        challanNumber: challan.challanCode ?? "",
        type: challan.type as any,
        customerName: challan.customerName,
        vehicleNumber: challan.vehicleNo,
        driverName: challan.driverName,
        notes: challan.notes,
      });
    },
    [createMut]
  );

  const update = useCallback(
    (id: number, changes: Partial<Challan>) => {
      updateMut.mutate({
        id,
        status: changes.status as any,
      });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedChallans = (data ?? []).map(r => ({
    id: r.id,
    challanCode: r.challanNumber,
    type: r.type,
    customerName: r.customerName ?? undefined,
    date: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt)) : "",
    vehicleNo: r.vehicleNumber ?? undefined,
    driverName: r.driverName ?? undefined,
    items: (r.items ?? []).map((i: any) => ({
      id: i.id,
      modelName: i.modelName ?? "",
      size: i.size ?? "",
      color: i.color ?? "",
      quantity: i.quantity ?? 0,
      bundleCodes: typeof i.bundleCodes === "string" ? JSON.parse(i.bundleCodes) : (Array.isArray(i.bundleCodes) ? i.bundleCodes : []),
    })),
    totalQty: (r.items ?? []).reduce((sum: number, i: any) => sum + (i.quantity ?? 0), 0),
    status: r.status,
    notes: r.notes ?? undefined,
  }));

  return {
    data: mappedChallans as Challan[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SUBCONTRACTS
// ═══════════════════════════════════════════════════════════════════
export function useSubcontracts() {
  const { data } = trpc.subcontract.list.useQuery();
  const createMut = trpc.subcontract.create.useMutation();
  const updateMut = trpc.subcontract.update.useMutation();
  const deleteMut = trpc.subcontract.delete.useMutation();
  const { data: sups } = trpc.supplier.list.useQuery();

  const create = useCallback(
    (sub: Omit<Subcontract, "id">) => {
      const supplier = sups?.find(s => s.name === sub.contractorName);
      return createMut.mutateAsync({
        contractNumber: sub.code ?? "",
        supplierId: supplier?.id ?? 0,
        modelId: sub.modelId,
        description: sub.notes,
        quantity: sub.quantity,
        unitPrice: sub.unitPrice,
        totalAmount: sub.total,
        startDate: sub.sentDate,
        endDate: sub.expectedReturn,
      });
    },
    [createMut, sups]
  );

  const update = useCallback(
    (id: number, changes: Partial<Subcontract>) => {
      updateMut.mutate({
        id,
        status: changes.status === "sent" ? "in_progress" : (changes.status === "returned" ? "completed" : changes.status as any),
        receivedQuantity: changes.quantity,
      });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedSubcontracts = (data ?? []).map(r => ({
    id: r.id,
    code: r.contractNumber,
    type: (r.model?.category ?? "other") as any,
    contractorName: r.supplier?.name ?? "",
    phone: r.supplier?.phone ?? undefined,
    modelId: r.modelId ?? undefined,
    modelName: r.model?.name ?? undefined,
    quantity: r.quantity,
    sentDate: r.startDate ? (r.startDate instanceof Date ? r.startDate.toISOString().split("T")[0] : String(r.startDate)) : "",
    expectedReturn: r.endDate ? (r.endDate instanceof Date ? r.endDate.toISOString().split("T")[0] : String(r.endDate)) : undefined,
    actualReturn: undefined,
    unitPrice: r.unitPrice ?? "0",
    total: r.totalAmount ?? "0",
    status: r.status === "in_progress" ? "sent" as const : (r.status === "completed" ? "returned" as const : r.status as any),
    notes: r.description ?? undefined,
  }));

  return {
    data: mappedSubcontracts as Subcontract[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SALES ORDERS
// ═══════════════════════════════════════════════════════════════════
export function useSalesOrders() {
  const { data } = trpc.salesOrder.list.useQuery();
  const createMut = trpc.salesOrder.create.useMutation();
  const updateMut = trpc.salesOrder.update.useMutation();
  const deleteMut = trpc.salesOrder.delete.useMutation();
  const { data: customers } = trpc.crm.listCustomers.useQuery();

  const create = useCallback(
    (order: Omit<SalesOrder, "id">) => {
      const customer = customers?.find(c => c.name === order.customerName);
      const quantity = order.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;
      const unitPrice = order.items?.[0]?.unitPrice ?? "0";
      return createMut.mutateAsync({
        orderNumber: order.orderCode ?? "",
        customerId: customer?.id ?? 0,
        quantity,
        unitPrice,
        totalAmount: order.totalAmount ?? "0",
        orderDate: order.date,
        deliveryDate: order.deliveryDate,
        notes: order.notes,
      });
    },
    [createMut, customers]
  );

  const update = useCallback(
    (id: number, changes: Partial<SalesOrder>) => {
      updateMut.mutate({
        id,
        status: changes.status as any,
      });
    },
    [updateMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedOrders = (data ?? []).map(r => ({
    id: r.id,
    orderCode: r.orderNumber,
    customerName: r.customer?.name ?? "",
    customerPhone: r.customer?.phone ?? undefined,
    customerAddress: r.customer?.address ?? undefined,
    date: r.orderDate ? (r.orderDate instanceof Date ? r.orderDate.toISOString().split("T")[0] : String(r.orderDate)) : "",
    deliveryDate: r.deliveryDate ? (r.deliveryDate instanceof Date ? r.deliveryDate.toISOString().split("T")[0] : String(r.deliveryDate)) : undefined,
    items: [],
    totalAmount: r.totalAmount,
    advance: "0",
    balance: r.totalAmount,
    status: r.status as any,
    notes: r.notes ?? undefined,
  }));

  return {
    data: mappedOrders as SalesOrder[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CRM CUSTOMERS
// ═══════════════════════════════════════════════════════════════════
export function useCRMCustomers() {
  const utils = trpc.useUtils();
  const { data } = trpc.crm.listCustomers.useQuery();
  const createMut = trpc.crm.createCustomer.useMutation();
  const updateMut = trpc.crm.updateCustomer.useMutation();
  const deleteMut = trpc.crm.deleteCustomer.useMutation();

  const create = useCallback(
    async (customer: Omit<CRMCustomer, "id">) => {
      const res = await createMut.mutateAsync({
        name: customer.name,
        contactPerson: customer.company,
        phone: customer.phone,
        email: customer.email || undefined,
        address: customer.address || undefined,
        customerType: (customer.category || "wholesale") as any,
        notes: customer.notes || undefined,
      });
      utils.crm.listCustomers.invalidate();
      return res;
    },
    [createMut, utils]
  );

  const update = useCallback(
    async (id: number, changes: Partial<CRMCustomer>) => {
      await updateMut.mutateAsync({
        id,
        name: changes.name,
        contactPerson: changes.company,
        phone: changes.phone,
        email: changes.email || undefined,
        address: changes.address || undefined,
        customerType: changes.category as any,
        status: changes.status as any,
        notes: changes.notes || undefined,
      });
      utils.crm.listCustomers.invalidate();
    },
    [updateMut, utils]
  );

  const remove = useCallback(
    async (id: number) => {
      await deleteMut.mutateAsync({ id });
      utils.crm.listCustomers.invalidate();
    },
    [deleteMut, utils]
  );

  const mappedCustomers = (data ?? []).map(r => ({
    id: r.id,
    name: r.name,
    company: r.contactPerson ?? undefined,
    phone: r.phone ?? "",
    email: r.email ?? undefined,
    address: r.address ?? undefined,
    category: r.customerType ?? "wholesale",
    status: r.status ?? "active",
    totalOrders: (r.interactions ?? []).length,
    totalRevenue: "0",
    lastContact: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt)) : undefined,
    notes: r.notes ?? undefined,
  }));

  return {
    data: mappedCustomers as CRMCustomer[],
    save: () => {},
    create,
    update,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CRM INTERACTIONS
// ═══════════════════════════════════════════════════════════════════
export function useCRMInteractions() {
  const { data } = trpc.crm.listInteractions.useQuery();
  const createMut = trpc.crm.createInteraction.useMutation();
  const deleteMut = trpc.crm.deleteInteraction.useMutation();
  const { data: customers } = trpc.crm.listCustomers.useQuery();
  const customerMap = new Map(customers?.map(c => [c.id, c]) ?? []);

  const create = useCallback(
    (interaction: Omit<CRMInteraction, "id">) => {
      return createMut.mutateAsync({
        customerId: interaction.customerId,
        type: interaction.type as any,
        content: interaction.summary,
        followUpDate: interaction.followUpDate,
      });
    },
    [createMut]
  );

  const remove = useCallback(
    (id: number) => {
      deleteMut.mutate({ id });
    },
    [deleteMut]
  );

  const mappedInteractions = (data ?? []).map(r => {
    const cust = customerMap.get(r.customerId);
    return {
      id: r.id,
      customerId: r.customerId,
      customerName: cust?.name ?? "",
      type: r.type as any,
      date: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString().split("T")[0] : String(r.createdAt)) : "",
      summary: r.content ?? r.subject ?? "",
      followUpDate: r.followUpDate ? (r.followUpDate instanceof Date ? r.followUpDate.toISOString().split("T")[0] : String(r.followUpDate)) : undefined,
    };
  });

  return {
    data: mappedInteractions as CRMInteraction[],
    save: () => {},
    create,
    remove,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PURCHASE REQUESTS
// ═══════════════════════════════════════════════════════════════════
export function usePurchaseRequests() { return trpc.purchaseRequest.list.useQuery(); }
export function useCreatePurchaseRequest() { const utils = trpc.useUtils(); const m = trpc.purchaseRequest.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.purchaseRequest.list.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdatePurchaseRequest() { const utils = trpc.useUtils(); const m = trpc.purchaseRequest.updateStatus.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.purchaseRequest.list.invalidate(); o?.onSuccess?.(); } }) }; }
export function useApprovePurchaseRequest() { const utils = trpc.useUtils(); const m = trpc.purchaseRequest.approve.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.purchaseRequest.list.invalidate(); o?.onSuccess?.(); } }) }; }
export function useRejectPurchaseRequest() { const utils = trpc.useUtils(); const m = trpc.purchaseRequest.reject.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.purchaseRequest.list.invalidate(); o?.onSuccess?.(); } }) }; }
export function useDeletePurchaseRequest() { const utils = trpc.useUtils(); const m = trpc.purchaseRequest.delete.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.purchaseRequest.list.invalidate() }) }; }
export function usePurchaseRequestStats() { return trpc.purchaseRequest.stats.useQuery(); }

// ═══════════════════════════════════════════════════════════════════
//  PURCHASE ORDERS
// ═══════════════════════════════════════════════════════════════════
export function usePurchaseOrders() { return trpc.purchaseOrder.list.useQuery(); }
export function useCreatePurchaseOrder() { const utils = trpc.useUtils(); const m = trpc.purchaseOrder.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.purchaseOrder.list.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdatePurchaseOrderStatus() { const utils = trpc.useUtils(); const m = trpc.purchaseOrder.updateStatus.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.purchaseOrder.list.invalidate() }) }; }
export function useDeletePurchaseOrder() { const utils = trpc.useUtils(); const m = trpc.purchaseOrder.delete.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.purchaseOrder.list.invalidate() }) }; }
export function usePurchaseOrderStats() { return trpc.purchaseOrder.stats.useQuery(); }

// ═══════════════════════════════════════════════════════════════════
//  RFQ (Request for Quotation)
// ═══════════════════════════════════════════════════════════════════
export function useRFQs() { return trpc.rfq.list.useQuery(); }
export function useCreateRFQ() { const utils = trpc.useUtils(); const m = trpc.rfq.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.rfq.list.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdateRFQStatus() { const utils = trpc.useUtils(); const m = trpc.rfq.updateStatus.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.rfq.list.invalidate() }) }; }
export function useAddRFQResponse() { const utils = trpc.useUtils(); const m = trpc.rfq.addResponse.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.rfq.list.invalidate(); o?.onSuccess?.(); } }) }; }
export function useAwardRFQResponse() { const utils = trpc.useUtils(); const m = trpc.rfq.awardResponse.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.rfq.list.invalidate() }) }; }
export function useRFQStats() { return trpc.rfq.stats.useQuery(); }

// ═══════════════════════════════════════════════════════════════════
//  GOODS RECEIPTS
// ═══════════════════════════════════════════════════════════════════
export function useGoodsReceipts() { return trpc.goodsReceipt.list.useQuery(); }
export function useCreateGoodsReceipt() { const utils = trpc.useUtils(); const m = trpc.goodsReceipt.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.goodsReceipt.list.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdateGoodsReceiptStatus() { const utils = trpc.useUtils(); const m = trpc.goodsReceipt.updateStatus.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.goodsReceipt.list.invalidate() }) }; }
export function useGoodsReceiptStats() { return trpc.goodsReceipt.stats.useQuery(); }

// ═══════════════════════════════════════════════════════════════════
//  SALES PIPELINE
// ═══════════════════════════════════════════════════════════════════
export function useOpportunities() { return trpc.salesPipeline.listOpportunities.useQuery(); }
export function usePipelineStages() { return trpc.salesPipeline.listStages.useQuery(); }
export function useCreateOpportunity() { const utils = trpc.useUtils(); const m = trpc.salesPipeline.createOpportunity.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.salesPipeline.listOpportunities.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdateOpportunity() { const utils = trpc.useUtils(); const m = trpc.salesPipeline.updateOpportunity.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.salesPipeline.listOpportunities.invalidate(); o?.onSuccess?.(); } }) }; }
export function useMoveOpportunityStage() { const utils = trpc.useUtils(); const m = trpc.salesPipeline.moveStage.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.salesPipeline.listOpportunities.invalidate(); o?.onSuccess?.(); } }) }; }
export function usePipelineDashboard() { return trpc.salesPipeline.dashboard.useQuery(); }

// ═══════════════════════════════════════════════════════════════════
//  SALES COMMISSIONS
// ═══════════════════════════════════════════════════════════════════
export function useSalesCommissions() { return trpc.salesCommission.list.useQuery(); }
export function useCreateCommission() { const utils = trpc.useUtils(); const m = trpc.salesCommission.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.salesCommission.list.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useMarkCommissionPaid() { const utils = trpc.useUtils(); const m = trpc.salesCommission.markPaid.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.salesCommission.list.invalidate() }) }; }
export function useBulkCreateCommissions() { const utils = trpc.useUtils(); const m = trpc.salesCommission.bulkCreate.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.salesCommission.list.invalidate(); o?.onSuccess?.(); } }) }; }
export function useCommissionStats() { return trpc.salesCommission.stats.useQuery(); }

// ═══════════════════════════════════════════════════════════════════
//  SHIPPING
// ═══════════════════════════════════════════════════════════════════
export function useShipments() { return trpc.shipping.list.useQuery(); }
export function useCreateShipment() { const utils = trpc.useUtils(); const m = trpc.shipping.create.useMutation(); return { mutate: (d: any, o?: any) => m.mutate(d, { onSuccess: () => { utils.shipping.list.invalidate(); o?.onSuccess?.(); } }), isPending: m.isPending }; }
export function useUpdateShipmentStatus() { const utils = trpc.useUtils(); const m = trpc.shipping.updateStatus.useMutation(); return { mutate: (d: any) => m.mutate(d, { onSuccess: () => utils.shipping.list.invalidate() }) }; }
export function useShippingStats() { return trpc.shipping.stats.useQuery(); }
