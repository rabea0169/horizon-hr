/**
 * useLocalData.ts — tRPC-backed CRUD hooks (MySQL).
 *
 * All data now comes from MySQL via tRPC API (useApiData.ts).
 * Types are defined in this file. 54 pages import from here.
 */

import { useState, useCallback } from "react";

export {
  useDepartments, useEmployees, useAttendance, useLeaves,
  usePerformanceReviews, useJobPostings, useCandidates, usePayroll,
  useProductionLines, useProductionOrders, useDailyProduction, useShifts,
  useAdvances, useBonusPenalties, useMachines, useInventory,
  useProductionModels, usePieceRateRecords,
  useSuppliers, useSupplyOrders, useCuttingOrders, useCostRecords,
  useBOMRecords, useBundles, useWorkOrders, useQCRecords, useMRPRecords,
  useChallans, useSubcontracts, useSalesOrders, useCRMCustomers, useCRMInteractions,
} from "./useApiData";

export {
  usePurchaseRequests, usePurchaseRequestStats, useCreatePurchaseRequest,
  useUpdatePurchaseRequest, useApprovePurchaseRequest, useRejectPurchaseRequest,
  useDeletePurchaseRequest,
  usePurchaseOrders, usePurchaseOrderStats, useCreatePurchaseOrder,
  useUpdatePurchaseOrderStatus, useDeletePurchaseOrder,
  useRFQs, useRFQStats, useCreateRFQ, useUpdateRFQStatus, useAddRFQResponse, useAwardRFQResponse,
  useGoodsReceipts, useGoodsReceiptStats, useCreateGoodsReceipt, useUpdateGoodsReceiptStatus,
  useOpportunities, usePipelineStages, usePipelineDashboard, useCreateOpportunity,
  useUpdateOpportunity, useMoveOpportunityStage,
  useSalesCommissions, useCommissionStats, useCreateCommission, useMarkCommissionPaid, useBulkCreateCommissions,
  useShipments, useShippingStats, useCreateShipment, useUpdateShipmentStatus,
} from "./useApiData";

export type Employee = {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId?: number;
  role: string;
  jobTitle: string;
  joinDate: string;
  salary?: string;
  status: string;
  employmentType: string;
  salaryType: string;
  avatar?: string;
  department?: Department;
  productionLineId?: number;
  shiftId?: number;
};

export type Department = {
  id: number;
  name: string;
  description?: string;
  color: string;
  employees?: Employee[];
};

export type AttendancePermission = {
  id: number;
  type: "lunch" | "emergency" | "personal" | "medical" | "other";
  startTime: string;
  endTime: string;
  duration: number;
  note?: string;
};

export type AttendanceRecord = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "late" | "absent" | "on_leave" | "half_day";
  hoursWorked?: string;
  manualEntry?: boolean;
  manualCheckIn?: string;
  manualCheckOut?: string;
  permissions?: AttendancePermission[];
};

export type Leave = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  leaveType: "annual" | "sick" | "maternity" | "paternity" | "unpaid" | "emergency" | "bereavement";
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
};

export type PerformanceReview = {
  id: number;
  employeeId: number;
  employeeName: string;
  reviewerName: string;
  period: string;
  status: "pending" | "in_progress" | "completed";
  overallRating?: number;
  communication?: number;
  teamwork?: number;
  productivity?: number;
  punctuality?: number;
  goals?: string;
  comments?: string;
};

export type JobPosting = {
  id: number;
  title: string;
  departmentName: string;
  description?: string;
  requirements?: string;
  location?: string;
  salaryRange?: string;
  employmentType: string;
  status: "open" | "paused" | "closed";
  candidateCount: number;
};

export type Candidate = {
  id: number;
  jobPostingId: number;
  fullName: string;
  email: string;
  phone?: string;
  stage: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  rating?: number;
  createdAt: string;
};

export type PayrollRecord = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  month: string;
  basicSalary: string;
  bonus: string;
  deductions: string;
  netPay: string;
  status: "processed" | "pending" | "on_hold";
};

export type InventoryItem = {
  id: number;
  code: string;
  name: string;
  category: "fabric" | "thread" | "button" | "zipper" | "label" | "packaging" | "other";
  unit: string;
  quantity: number;
  minLevel: number;
  unitPrice: string;
  supplier?: string;
  location?: string;
  lastRestocked?: string;
};

export type Supplier = {
  id: number;
  code: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  category: string;
  status: string;
  notes?: string;
};

export type SupplyOrder = {
  id: number;
  orderCode: string;
  supplierId: number;
  supplierName: string;
  date: string;
  deliveryDate?: string;
  items: SupplyOrderItem[];
  total: string;
  status: "pending" | "partial" | "received" | "cancelled";
  notes?: string;
};

export type SupplyOrderItem = {
  id: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  total: string;
};

export type CuttingOrder = {
  id: number;
  orderCode: string;
  modelId?: number;
  modelName?: string;
  productionOrderId?: number;
  productionOrderCode?: string;
  fabricId?: number;
  fabricName?: string;
  layers: number;
  totalPieces: number;
  defectedPieces: number;
  goodPieces: number;
  cutterId?: number;
  cutterName?: string;
  date: string;
  status: "pending" | "in_progress" | "completed";
  stages: CuttingStage[];
  notes?: string;
};

export type CuttingStage = {
  id: number;
  name: string;
  completed: boolean;
  completedAt?: string;
};

export type CostRecord = {
  id: number;
  modelId: number;
  modelName: string;
  productionOrderId?: number;
  productionOrderCode?: string;
  date: string;
  fabricCost: string;
  threadCost: string;
  accessoriesCost: string;
  packagingCost: string;
  cuttingLabor: string;
  sewingLabor: string;
  pressingLabor: string;
  packagingLabor: string;
  overheadCost: string;
  totalCost: string;
  costPerPiece: string;
  targetQuantity: number;
  notes?: string;
};

export type BOMItem = {
  id: number;
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  total: string;
  notes?: string;
};

export type BOMRecord = {
  id: number;
  modelId: number;
  modelName: string;
  modelCode: string;
  items: BOMItem[];
  totalMaterialCost: string;
  updatedAt: string;
};

export type Bundle = {
  id: number;
  bundleCode: string;
  qrData: string;
  modelId: number;
  modelName: string;
  productionOrderId?: number;
  size: string;
  color: string;
  quantity: number;
  stages: BundleStage[];
  status: "in_progress" | "completed" | "qc_failed";
  createdAt: string;
};

export type BundleStage = {
  id: number;
  name: string;
  scannedAt?: string;
  scannedBy?: string;
  completed: boolean;
};

export type WorkOrder = {
  id: number;
  orderCode: string;
  modelId?: number;
  modelName?: string;
  bomId?: number;
  productionOrderId?: number;
  productionOrderCode?: string;
  lineId?: number;
  lineName?: string;
  quantity: number;
  startDate: string;
  endDate?: string;
  priority: "urgent" | "high" | "normal" | "low";
  status: "pending" | "in_progress" | "completed" | "on_hold";
  stages: WorkOrderStage[];
  notes?: string;
};

export type WorkOrderStage = {
  id: number;
  name: string;
  assignedTo?: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
};

export type QCRecord = {
  id: number;
  inspectionCode: string;
  stage: "fabric" | "cutting" | "sewing" | "pressing" | "packing";
  bundleId?: number;
  bundleCode?: string;
  modelId?: number;
  modelName?: string;
  inspectedBy: string;
  date: string;
  checkedQty: number;
  passedQty: number;
  failedQty: number;
  defectRate: string;
  defects: QCDefect[];
  status: "pass" | "fail" | "rework";
  notes?: string;
};

export type QCDefect = {
  id: number;
  type: string;
  description: string;
  severity: "minor" | "major" | "critical";
  count: number;
};

export type MRPRecord = {
  id: number;
  materialName: string;
  category: string;
  currentStock: number;
  minLevel: number;
  requiredQty: number;
  unit: string;
  productionOrders: string[];
  status: "sufficient" | "low" | "critical" | "order_needed";
  lastUpdated: string;
};

export type Challan = {
  id: number;
  challanCode: string;
  type: string;
  customerName?: string;
  date: string;
  vehicleNo?: string;
  driverName?: string;
  items: ChallanItem[];
  totalQty: number;
  status: string;
  notes?: string;
};

export type ChallanItem = {
  id: number;
  modelName: string;
  size: string;
  color: string;
  quantity: number;
  bundleCodes: string[];
};

export type Subcontract = {
  id: number;
  code: string;
  type: "embroidery" | "printing" | "washing" | "finishing" | "other";
  contractorName: string;
  phone?: string;
  modelId?: number;
  modelName?: string;
  quantity: number;
  sentDate: string;
  expectedReturn?: string;
  actualReturn?: string;
  unitPrice: string;
  total: string;
  status: "pending" | "sent" | "in_progress" | "returned" | "billed";
  notes?: string;
};

export type SalesOrder = {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  date: string;
  deliveryDate?: string;
  items: SalesOrderItem[];
  totalAmount: string;
  advance: string;
  balance: string;
  status: "pending" | "confirmed" | "in_production" | "ready" | "dispatched" | "delivered" | "cancelled";
  notes?: string;
};

export type SalesOrderItem = {
  id: number;
  modelName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

export type CRMCustomer = {
  id: number;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  category: string;
  status: string;
  totalOrders: number;
  totalRevenue: string;
  lastContact?: string;
  notes?: string;
};

export type CRMInteraction = {
  id: number;
  customerId: number;
  customerName: string;
  type: "call" | "visit" | "email" | "meeting" | "complaint";
  date: string;
  summary: string;
  followUpDate?: string;
};

export type ProductionLine = {
  id: number;
  name: string;
  supervisorId?: number;
  supervisorName?: string;
  targetDaily: number;
  status: "active" | "maintenance" | "inactive";
  employeeCount: number;
};

export type ProductionOrder = {
  id: number;
  orderCode: string;
  customerName: string;
  styleName: string;
  sizeBreakdown: string;
  quantity: number;
  completed: number;
  startDate: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assignedLineId?: number;
  assignedLineName?: string;
};

export type DailyProduction = {
  id: number;
  date: string;
  lineId: number;
  lineName: string;
  orderId: number;
  orderCode: string;
  produced: number;
  defected: number;
  workersPresent: number;
  notes?: string;
};

export type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  days: string;
  employeeCount: number;
};

export type Advance = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  amount: string;
  date: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "repaid";
  repaymentMonths?: number;
  monthlyDeduction?: string;
};

export type BonusPenalty = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  type: "bonus" | "penalty";
  amount: string;
  date: string;
  reason: string;
  category: "attendance" | "production" | "quality" | "behavior" | "overtime" | "other";
};

export type Machine = {
  id: number;
  name: string;
  code: string;
  type: "sewing" | "cutting" | "pressing" | "packing" | "other";
  lineId?: number;
  lineName?: string;
  status: "operational" | "maintenance" | "broken" | "idle";
  lastMaintenance?: string;
  nextMaintenance?: string;
};

export type ProductionStage = {
  id: number;
  name: string;
  order: number;
  unitPrice: string;
};

export type ProductionModel = {
  id: number;
  code: string;
  name: string;
  description?: string;
  customerName?: string;
  stages: ProductionStage[];
  status: string;
};

export type PieceRateRecord = {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  date: string;
  modelId: number;
  modelName: string;
  stageId: number;
  stageName: string;
  quantity: number;
  unitPrice: string;
  total: string;
};
