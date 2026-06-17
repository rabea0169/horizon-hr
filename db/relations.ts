import { relations } from "drizzle-orm";
import {
  users, departments, employees, attendance, leaves, performanceReviews,
  jobPostings, candidates, payrollRecords, shifts, shiftAssignments,
  advances, bonusPenalties, productionLines, productionOrders, dailyProduction,
  productionModels, modelStages, pieceRateRecords, machines, inventoryItems,
  inventoryTransactions, suppliers, supplyOrders, supplyOrderItems,
  cuttingOrders, workOrders, bundles, bundleTracking, bomRecords,
  qcRecords, mrpRecords, challans, challanItems, subcontracts,
  salesOrders, crmCustomers, crmInteractions, costCalculations,
  activities,
  styleColorSizeMatrix, fabricRolls, cutPlans, markerPlans,
  samRecords, lineBalancing, warehouses, warehouseBins, reorderRules,
  productLifecycle, techPacks, designRevisions, sampleReviews,
  customReports, buyerPortalUsers, productionForecasts,
  purchaseRequests, purchaseRequestItems,
  grns, salesInvoices, purchaseInvoices,
  maintenanceRecords,
  orderAmendments, quotations, quotationItems,
  // NEW: Purchase & Sales modules
  purchaseOrders, purchaseOrderItems,
  rfqs, rfqItems, rfqResponses,
  goodsReceipts, goodsReceiptItems,
  salesPipelineStages, salesOpportunities, salesCommissions,
  shipments, shipmentItems,
  // NEW: Integration
  integrationLogs,
} from "./schema";

// ─── Users ───
export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
}));

// ─── Departments ───
export const departmentsRelations = relations(departments, ({ many, one }) => ({
  employees: many(employees),
  manager: one(employees, { fields: [departments.managerId], references: [employees.id] }),
  jobPostings: many(jobPostings),
}));

// ─── Employees ───
export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, { fields: [employees.departmentId], references: [departments.id] }),
  manager: one(employees, { fields: [employees.managerId], references: [employees.id] }),
  subordinates: many(employees),
  attendanceRecords: many(attendance),
  leaveRequests: many(leaves),
  reviews: many(performanceReviews),
  payrolls: many(payrollRecords),
  shiftAssignments: many(shiftAssignments),
  advances: many(advances),
  bonusPenalties: many(bonusPenalties),
  managedLines: many(productionLines),
  pieceRateRecords: many(pieceRateRecords),
  managedDepartments: many(departments),
}));

// ─── Attendance ───
export const attendanceRelations = relations(attendance, ({ one }) => ({
  employee: one(employees, { fields: [attendance.employeeId], references: [employees.id] }),
}));

// ─── Leaves ───
export const leavesRelations = relations(leaves, ({ one }) => ({
  employee: one(employees, { fields: [leaves.employeeId], references: [employees.id] }),
}));

// ─── Performance Reviews ───
export const performanceReviewsRelations = relations(performanceReviews, ({ one }) => ({
  employee: one(employees, { fields: [performanceReviews.employeeId], references: [employees.id] }),
  reviewer: one(employees, { fields: [performanceReviews.reviewerId], references: [employees.id] }),
}));

// ─── Job Postings ───
export const jobPostingsRelations = relations(jobPostings, ({ many, one }) => ({
  candidates: many(candidates),
  department: one(departments, { fields: [jobPostings.departmentId], references: [departments.id] }),
}));

// ─── Candidates ───
export const candidatesRelations = relations(candidates, ({ one }) => ({
  jobPosting: one(jobPostings, { fields: [candidates.jobPostingId], references: [jobPostings.id] }),
}));

// ─── Payroll Records ───
export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
  employee: one(employees, { fields: [payrollRecords.employeeId], references: [employees.id] }),
}));

// ─── Shifts ───
export const shiftsRelations = relations(shifts, ({ many }) => ({
  assignments: many(shiftAssignments),
}));

// ─── Shift Assignments ───
export const shiftAssignmentsRelations = relations(shiftAssignments, ({ one }) => ({
  employee: one(employees, { fields: [shiftAssignments.employeeId], references: [employees.id] }),
  shift: one(shifts, { fields: [shiftAssignments.shiftId], references: [shifts.id] }),
}));

// ─── Advances ───
export const advancesRelations = relations(advances, ({ one }) => ({
  employee: one(employees, { fields: [advances.employeeId], references: [employees.id] }),
}));

// ─── Bonus/Penalties ───
export const bonusPenaltiesRelations = relations(bonusPenalties, ({ one }) => ({
  employee: one(employees, { fields: [bonusPenalties.employeeId], references: [employees.id] }),
}));

// ─── Production Lines ───
export const productionLinesRelations = relations(productionLines, ({ many, one }) => ({
  supervisor: one(employees, { fields: [productionLines.supervisorId], references: [employees.id] }),
  orders: many(productionOrders),
  dailyProduction: many(dailyProduction),
  machines: many(machines),
  workOrders: many(workOrders),
}));

// ─── Production Orders ───
export const productionOrdersRelations = relations(productionOrders, ({ one, many }) => ({
  line: one(productionLines, { fields: [productionOrders.lineId], references: [productionLines.id] }),
  dailyProduction: many(dailyProduction),
  workOrders: many(workOrders),
}));

// ─── Daily Production ───
export const dailyProductionRelations = relations(dailyProduction, ({ one }) => ({
  line: one(productionLines, { fields: [dailyProduction.lineId], references: [productionLines.id] }),
  order: one(productionOrders, { fields: [dailyProduction.orderId], references: [productionOrders.id] }),
}));

// ─── Production Models ───
export const productionModelsRelations = relations(productionModels, ({ many }) => ({
  stages: many(modelStages),
  pieceRateRecords: many(pieceRateRecords),
  bomRecords: many(bomRecords),
  cuttingOrders: many(cuttingOrders),
  workOrders: many(workOrders),
  bundles: many(bundles),
  costCalculations: many(costCalculations),
}));

// ─── Model Stages ───
export const modelStagesRelations = relations(modelStages, ({ one, many }) => ({
  model: one(productionModels, { fields: [modelStages.modelId], references: [productionModels.id] }),
  pieceRateRecords: many(pieceRateRecords),
}));

// ─── Piece Rate Records ───
export const pieceRateRecordsRelations = relations(pieceRateRecords, ({ one }) => ({
  employee: one(employees, { fields: [pieceRateRecords.employeeId], references: [employees.id] }),
  model: one(productionModels, { fields: [pieceRateRecords.modelId], references: [productionModels.id] }),
  stage: one(modelStages, { fields: [pieceRateRecords.stageId], references: [modelStages.id] }),
}));

// ─── Machines ───
export const machinesRelations = relations(machines, ({ one }) => ({
  line: one(productionLines, { fields: [machines.lineId], references: [productionLines.id] }),
}));

// ─── Inventory Items ───
export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  transactions: many(inventoryTransactions),
  bomRecords: many(bomRecords),
  mrpRecords: many(mrpRecords),
}));

// ─── Inventory Transactions ───
export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, { fields: [inventoryTransactions.itemId], references: [inventoryItems.id] }),
}));

// ─── Suppliers ───
export const suppliersRelations = relations(suppliers, ({ many }) => ({
  supplyOrders: many(supplyOrders),
  subcontracts: many(subcontracts),
}));

// ─── Supply Orders ───
export const supplyOrdersRelations = relations(supplyOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [supplyOrders.supplierId], references: [suppliers.id] }),
  items: many(supplyOrderItems),
}));

// ─── Supply Order Items ───
export const supplyOrderItemsRelations = relations(supplyOrderItems, ({ one }) => ({
  supplyOrder: one(supplyOrders, { fields: [supplyOrderItems.supplyOrderId], references: [supplyOrders.id] }),
  item: one(inventoryItems, { fields: [supplyOrderItems.itemId], references: [inventoryItems.id] }),
}));

// ─── Cutting Orders ───
export const cuttingOrdersRelations = relations(cuttingOrders, ({ one }) => ({
  model: one(productionModels, { fields: [cuttingOrders.modelId], references: [productionModels.id] }),
  assignedWorker: one(employees, { fields: [cuttingOrders.assignedTo], references: [employees.id] }),
}));

// ─── Work Orders ───
export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  productionOrder: one(productionOrders, { fields: [workOrders.productionOrderId], references: [productionOrders.id] }),
  model: one(productionModels, { fields: [workOrders.modelId], references: [productionModels.id] }),
  line: one(productionLines, { fields: [workOrders.lineId], references: [productionLines.id] }),
  bundles: many(bundles),
}));

// ─── Bundles ───
export const bundlesRelations = relations(bundles, ({ one, many }) => ({
  workOrder: one(workOrders, { fields: [bundles.workOrderId], references: [workOrders.id] }),
  model: one(productionModels, { fields: [bundles.modelId], references: [productionModels.id] }),
  line: one(productionLines, { fields: [bundles.currentLineId], references: [productionLines.id] }),
  tracking: many(bundleTracking),
}));

// ─── Bundle Tracking ───
export const bundleTrackingRelations = relations(bundleTracking, ({ one }) => ({
  bundle: one(bundles, { fields: [bundleTracking.bundleId], references: [bundles.id] }),
}));

// ─── BOM Records ───
export const bomRecordsRelations = relations(bomRecords, ({ one }) => ({
  model: one(productionModels, { fields: [bomRecords.modelId], references: [productionModels.id] }),
  item: one(inventoryItems, { fields: [bomRecords.itemId], references: [inventoryItems.id] }),
}));

// ─── QC Records ───
export const qcRecordsRelations = relations(qcRecords, ({ one }) => ({
  order: one(productionOrders, { fields: [qcRecords.orderId], references: [productionOrders.id] }),
  bundle: one(bundles, { fields: [qcRecords.bundleId], references: [bundles.id] }),
}));

// ─── MRP Records ───
export const mrpRecordsRelations = relations(mrpRecords, ({ one }) => ({
  productionOrder: one(productionOrders, { fields: [mrpRecords.productionOrderId], references: [productionOrders.id] }),
  item: one(inventoryItems, { fields: [mrpRecords.itemId], references: [inventoryItems.id] }),
}));

// ─── Challans ───
export const challansRelations = relations(challans, ({ many }) => ({
  items: many(challanItems),
}));

// ─── Challan Items ───
export const challanItemsRelations = relations(challanItems, ({ one }) => ({
  challan: one(challans, { fields: [challanItems.challanId], references: [challans.id] }),
}));

// ─── Subcontracts ───
export const subcontractsRelations = relations(subcontracts, ({ one }) => ({
  supplier: one(suppliers, { fields: [subcontracts.supplierId], references: [suppliers.id] }),
  model: one(productionModels, { fields: [subcontracts.modelId], references: [productionModels.id] }),
}));

// ─── Sales Orders ───
export const salesOrdersRelations = relations(salesOrders, ({ one }) => ({
  customer: one(crmCustomers, { fields: [salesOrders.customerId], references: [crmCustomers.id] }),
}));

// ─── CRM Customers ───
export const crmCustomersRelations = relations(crmCustomers, ({ many }) => ({
  interactions: many(crmInteractions),
  salesOrders: many(salesOrders),
}));

// ─── CRM Interactions ───
export const crmInteractionsRelations = relations(crmInteractions, ({ one }) => ({
  customer: one(crmCustomers, { fields: [crmInteractions.customerId], references: [crmCustomers.id] }),
}));

// ─── Cost Calculations ───
export const costCalculationsRelations = relations(costCalculations, ({ one }) => ({
  model: one(productionModels, { fields: [costCalculations.modelId], references: [productionModels.id] }),
}));

// ─── Style-Color-Size Matrix ───
export const styleColorSizeMatrixRelations = relations(styleColorSizeMatrix, ({ one }) => ({
  model: one(productionModels, { fields: [styleColorSizeMatrix.modelId], references: [productionModels.id] }),
}));

// ─── Fabric Rolls ───
export const fabricRollsRelations = relations(fabricRolls, ({ one }) => ({
  supplier: one(suppliers, { fields: [fabricRolls.supplierId], references: [suppliers.id] }),
}));

// ─── Cut Plans ───
export const cutPlansRelations = relations(cutPlans, ({ one, many }) => ({
  model: one(productionModels, { fields: [cutPlans.modelId], references: [productionModels.id] }),
  order: one(productionOrders, { fields: [cutPlans.orderId], references: [productionOrders.id] }),
  markers: many(markerPlans),
}));

// ─── Marker Plans ───
export const markerPlansRelations = relations(markerPlans, ({ one }) => ({
  cutPlan: one(cutPlans, { fields: [markerPlans.cutPlanId], references: [cutPlans.id] }),
  model: one(productionModels, { fields: [markerPlans.modelId], references: [productionModels.id] }),
}));

// ─── SAM Records ───
export const samRecordsRelations = relations(samRecords, ({ one }) => ({
  model: one(productionModels, { fields: [samRecords.modelId], references: [productionModels.id] }),
  stage: one(modelStages, { fields: [samRecords.stageId], references: [modelStages.id] }),
}));

// ─── Line Balancing ───
export const lineBalancingRelations = relations(lineBalancing, ({ one }) => ({
  line: one(productionLines, { fields: [lineBalancing.lineId], references: [productionLines.id] }),
  model: one(productionModels, { fields: [lineBalancing.modelId], references: [productionModels.id] }),
}));

// ─── Warehouses ───
export const warehousesRelations = relations(warehouses, ({ many }) => ({
  bins: many(warehouseBins),
}));

// ─── Warehouse Bins ───
export const warehouseBinsRelations = relations(warehouseBins, ({ one }) => ({
  warehouse: one(warehouses, { fields: [warehouseBins.warehouseId], references: [warehouses.id] }),
  item: one(inventoryItems, { fields: [warehouseBins.itemId], references: [inventoryItems.id] }),
}));

// ─── Reorder Rules ───
export const reorderRulesRelations = relations(reorderRules, ({ one }) => ({
  item: one(inventoryItems, { fields: [reorderRules.itemId], references: [inventoryItems.id] }),
  warehouse: one(warehouses, { fields: [reorderRules.warehouseId], references: [warehouses.id] }),
  supplier: one(suppliers, { fields: [reorderRules.supplierId], references: [suppliers.id] }),
}));

// ═══════════════════════════════════════════════════════════════
//  المرحلة 4: PLM + BI + Predictive Analytics + Portals
// ═══════════════════════════════════════════════════════════════

// ─── Product Lifecycle ───
export const productLifecycleRelations = relations(productLifecycle, ({ one }) => ({
  model: one(productionModels, { fields: [productLifecycle.modelId], references: [productionModels.id] }),
  assignee: one(employees, { fields: [productLifecycle.assignedTo], references: [employees.id] }),
}));

// ─── Tech Packs ───
export const techPacksRelations = relations(techPacks, ({ one, many }) => ({
  model: one(productionModels, { fields: [techPacks.modelId], references: [productionModels.id] }),
  revisions: many(designRevisions),
  samples: many(sampleReviews),
}));

// ─── Design Revisions ───
export const designRevisionsRelations = relations(designRevisions, ({ one }) => ({
  model: one(productionModels, { fields: [designRevisions.modelId], references: [productionModels.id] }),
  techPack: one(techPacks, { fields: [designRevisions.techPackId], references: [techPacks.id] }),
}));

// ─── Sample Reviews ───
export const sampleReviewsRelations = relations(sampleReviews, ({ one }) => ({
  model: one(productionModels, { fields: [sampleReviews.modelId], references: [productionModels.id] }),
  techPack: one(techPacks, { fields: [sampleReviews.techPackId], references: [techPacks.id] }),
}));

// ─── Custom Reports ───
export const customReportsRelations = relations(customReports, ({ one }) => ({
  creator: one(users, { fields: [customReports.createdBy], references: [users.id] }),
}));

// ─── Buyer Portal Users ───
export const buyerPortalUsersRelations = relations(buyerPortalUsers, ({ one }) => ({
  customer: one(crmCustomers, { fields: [buyerPortalUsers.customerId], references: [crmCustomers.id] }),
}));

// ─── Production Forecasts ───
export const productionForecastsRelations = relations(productionForecasts, ({ one }) => ({
  model: one(productionModels, { fields: [productionForecasts.modelId], references: [productionModels.id] }),
  line: one(productionLines, { fields: [productionForecasts.lineId], references: [productionLines.id] }),
}));

// ─── Purchase Requests ───
export const purchaseRequestsRelations = relations(purchaseRequests, ({ many }) => ({
  items: many(purchaseRequestItems),
}));

// ─── Purchase Request Items ───
export const purchaseRequestItemsRelations = relations(purchaseRequestItems, ({ one }) => ({
  request: one(purchaseRequests, { fields: [purchaseRequestItems.purchaseRequestId], references: [purchaseRequests.id] }),
  item: one(inventoryItems, { fields: [purchaseRequestItems.itemId], references: [inventoryItems.id] }),
}));

// ─── GRNs ───
export const grnsRelations = relations(grns, ({ one }) => ({
  supplyOrder: one(supplyOrders, { fields: [grns.supplyOrderId], references: [supplyOrders.id] }),
  supplier: one(suppliers, { fields: [grns.supplierId], references: [suppliers.id] }),
}));

// ─── Sales Invoices ───
export const salesInvoicesRelations = relations(salesInvoices, ({ one }) => ({
  salesOrder: one(salesOrders, { fields: [salesInvoices.salesOrderId], references: [salesOrders.id] }),
  customer: one(crmCustomers, { fields: [salesInvoices.customerId], references: [crmCustomers.id] }),
}));

// ─── Purchase Invoices ───
export const purchaseInvoicesRelations = relations(purchaseInvoices, ({ one }) => ({
  grn: one(grns, { fields: [purchaseInvoices.grnId], references: [grns.id] }),
  supplier: one(suppliers, { fields: [purchaseInvoices.supplierId], references: [suppliers.id] }),
}));

// ─── Maintenance Records ───
export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  machine: one(machines, { fields: [maintenanceRecords.machineId], references: [machines.id] }),
}));

// ─── Order Amendments ───
export const orderAmendmentsRelations = relations(orderAmendments, ({ one }) => ({
  salesOrder: one(salesOrders, { fields: [orderAmendments.salesOrderId], references: [salesOrders.id] }),
}));

// ─── Quotations ───
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  customer: one(crmCustomers, { fields: [quotations.customerId], references: [crmCustomers.id] }),
  items: many(quotationItems),
}));

// ─── Quotation Items ───
export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationItems.quotationId], references: [quotations.id] }),
  model: one(productionModels, { fields: [quotationItems.modelId], references: [productionModels.id] }),
}));

// ═══════════════════════════════════════════════════════════════
//  NEW: Purchase Orders + RFQ + Goods Receipts
// ═══════════════════════════════════════════════════════════════

// ─── Purchase Orders ───
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  items: many(purchaseOrderItems),
  goodsReceipts: many(goodsReceipts),
}));

// ─── Purchase Order Items ───
export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
  item: one(inventoryItems, { fields: [purchaseOrderItems.itemId], references: [inventoryItems.id] }),
}));

// ─── RFQs ───
export const rfqsRelations = relations(rfqs, ({ many }) => ({
  items: many(rfqItems),
  responses: many(rfqResponses),
}));

// ─── RFQ Items ───
export const rfqItemsRelations = relations(rfqItems, ({ one }) => ({
  rfq: one(rfqs, { fields: [rfqItems.rfqId], references: [rfqs.id] }),
  item: one(inventoryItems, { fields: [rfqItems.itemId], references: [inventoryItems.id] }),
}));

// ─── RFQ Responses ───
export const rfqResponsesRelations = relations(rfqResponses, ({ one }) => ({
  rfq: one(rfqs, { fields: [rfqResponses.rfqId], references: [rfqs.id] }),
  supplier: one(suppliers, { fields: [rfqResponses.supplierId], references: [suppliers.id] }),
}));

// ─── Goods Receipts ───
export const goodsReceiptsRelations = relations(goodsReceipts, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [goodsReceipts.purchaseOrderId], references: [purchaseOrders.id] }),
  supplier: one(suppliers, { fields: [goodsReceipts.supplierId], references: [suppliers.id] }),
  items: many(goodsReceiptItems),
}));

// ─── Goods Receipt Items ───
export const goodsReceiptItemsRelations = relations(goodsReceiptItems, ({ one }) => ({
  goodsReceipt: one(goodsReceipts, { fields: [goodsReceiptItems.goodsReceiptId], references: [goodsReceipts.id] }),
  item: one(inventoryItems, { fields: [goodsReceiptItems.itemId], references: [inventoryItems.id] }),
}));

// ═══════════════════════════════════════════════════════════════
//  NEW: Sales Pipeline + Commissions + Shipping
// ═══════════════════════════════════════════════════════════════

// ─── Sales Pipeline Stages ───
export const salesPipelineStagesRelations = relations(salesPipelineStages, ({ many }) => ({
  opportunities: many(salesOpportunities),
}));

// ─── Sales Opportunities ───
export const salesOpportunitiesRelations = relations(salesOpportunities, ({ one }) => ({
  customer: one(crmCustomers, { fields: [salesOpportunities.customerId], references: [crmCustomers.id] }),
  stage: one(salesPipelineStages, { fields: [salesOpportunities.stageId], references: [salesPipelineStages.id] }),
}));

// ─── Sales Commissions ───
export const salesCommissionsRelations = relations(salesCommissions, ({ one }) => ({
  employee: one(employees, { fields: [salesCommissions.employeeId], references: [employees.id] }),
  salesOrder: one(salesOrders, { fields: [salesCommissions.salesOrderId], references: [salesOrders.id] }),
}));

// ─── Shipments ───
export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  salesOrder: one(salesOrders, { fields: [shipments.salesOrderId], references: [salesOrders.id] }),
  customer: one(crmCustomers, { fields: [shipments.customerId], references: [crmCustomers.id] }),
  items: many(shipmentItems),
}));

// ─── Shipment Items ───
export const shipmentItemsRelations = relations(shipmentItems, ({ one }) => ({
  shipment: one(shipments, { fields: [shipmentItems.shipmentId], references: [shipments.id] }),
  item: one(inventoryItems, { fields: [shipmentItems.itemId], references: [inventoryItems.id] }),
}));

// ─── Integration Logs ───
export const integrationLogsRelations = relations(integrationLogs, ({ }) => ({
}));

