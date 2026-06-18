import { authRouter } from "./auth-router";
import { departmentRouter } from "./department-router";
import { employeeRouter } from "./employee-router";
import { attendanceRouter } from "./attendance-router";
import { performanceRouter } from "./performance-router";
import { jobPostingRouter, candidateRouter } from "./recruitment-router";
import { payrollRouter } from "./payroll-router";
import { dashboardRouter } from "./dashboard-router";
import { productionLineRouter, productionOrderRouter, dailyProductionRouter, productionModelRouter, modelStageRouter } from "./production-router";
import { inventoryRouter, inventoryTransactionRouter } from "./inventory-router";
import { machineRouter } from "./machine-router";
import { supplierRouter, supplyOrderRouter } from "./supplier-router";
import { advanceRouter, bonusPenaltyRouter, pieceRateRouter, costCalculationRouter } from "./finance-router";
import { salesOrderRouter, crmRouter } from "./sales-router";
import { purchaseOrderRouter } from "./purchase-order-router";
import { purchaseRequestRouter } from "./purchase-request-router";
import { rfqRouter } from "./rfq-router";
import { goodsReceiptRouter } from "./goods-receipt-router";
import { salesPipelineRouter } from "./sales-pipeline-router";
import { salesCommissionRouter } from "./sales-commission-router";
import { shippingRouter } from "./shipping-router";
import { qcRouter, mrpRouter, challanRouter, subcontractRouter, bundleRouter, cuttingOrderRouter, workOrderRouter, shiftRouter, bomRouter } from "./operations-router";
import { matrixRouter, fabricRollRouter, cutPlanRouter, markerPlanRouter, samRouter, lineBalancingRouter, warehouseRouter, warehouseBinRouter, reorderRuleRouter } from "./phase2-router";
import { mobileRouter, biometricRouter, barcodeRouter, tenancyRouter } from "./phase3-router";
import { plmRouter, reportBuilderRouter, analyticsRouter, employeePortalRouter, buyerPortalRouter, biIntegrationRouter } from "./phase4-router";
import { grnRouter } from "./grn-router";

import { voucherRouter } from "./voucher-router";
import { leaveRouter as leaveApiRouter } from "./leave-router";

import { auditApiRouter } from "./audit-router";
import { lineRouter } from "./line-router";
import { settingsRouter } from "./settings-router";
import { approvalRouter } from "./approval-router";
import { notificationRouter as notificationApiRouter } from "./notification-router";
import { samRouter as samApiRouter } from "./sam-router";
import { quotationRouter } from "./quotation-router";
import { lineBalanceRouter } from "./linebalance-router";
import { maintenanceRouter } from "./maintenance-router";
import { invoiceRouter } from "./invoice-router";
import {
  expenseCategoryRouter,
  expenseRouter,
  finishedGoodsRouter,
  wastageRouter,
  salesRepVisitRouter,
  salesRepOrderRouter,
} from "./phase5-router";
import {
  accountRouter,
  openingBalanceRouter,
  treasuryRouter,
  generalLedgerRouter,
  creditLimitRouter,
  agingRouter,
  integrationRouter,
  fiscalYearRouter,
} from "./phase6-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  dashboard: dashboardRouter,
  department: departmentRouter,
  employee: employeeRouter,
  attendance: attendanceRouter,
  leave: leaveApiRouter,
  maintenance: maintenanceRouter,
  settings: settingsRouter,
  approval: approvalRouter,
  notification: notificationApiRouter,
  lineRouter: lineRouter,
  quotation: quotationRouter,
  sam: samApiRouter,
  lineBalance: lineBalanceRouter,
  performance: performanceRouter,
  jobPosting: jobPostingRouter,
  candidate: candidateRouter,
  payroll: payrollRouter,
  // Production
  productionLine: productionLineRouter,
  productionOrder: productionOrderRouter,
  dailyProduction: dailyProductionRouter,
  productionModel: productionModelRouter,
  modelStage: modelStageRouter,
  // Inventory
  inventory: inventoryRouter,
  inventoryTransaction: inventoryTransactionRouter,
  // Machines
  machine: machineRouter,
  // Suppliers
  supplier: supplierRouter,
  supplyOrder: supplyOrderRouter,
  // Finance
  advance: advanceRouter,
  bonusPenalty: bonusPenaltyRouter,
  pieceRate: pieceRateRouter,
  costCalculation: costCalculationRouter,
  // Sales & CRM
  salesOrder: salesOrderRouter,
  crm: crmRouter,
  // Procurement (Purchase)
  purchaseOrder: purchaseOrderRouter,
  purchaseRequest: purchaseRequestRouter,
  rfq: rfqRouter,
  goodsReceipt: goodsReceiptRouter,
  // Sales Pipeline & Commissions
  salesPipeline: salesPipelineRouter,
  salesCommission: salesCommissionRouter,
  // Shipping
  shipping: shippingRouter,
  // Operations
  qc: qcRouter,
  mrp: mrpRouter,
  bom: bomRouter,
  challan: challanRouter,
  subcontract: subcontractRouter,
  bundle: bundleRouter,
  cuttingOrder: cuttingOrderRouter,
  workOrder: workOrderRouter,
  shift: shiftRouter,
  // Phase 2: Advanced Garment Modules
  matrix: matrixRouter,
  fabricRoll: fabricRollRouter,
  cutPlan: cutPlanRouter,
  markerPlan: markerPlanRouter,
  samCalculations: samRouter,
  lineBalancingModule: lineBalancingRouter,
  warehouse: warehouseRouter,
  warehouseBin: warehouseBinRouter,
  reorderRule: reorderRuleRouter,
  // Phase 3: Mobile + Biometric + Notifications
  mobile: mobileRouter,
  biometric: biometricRouter,
  barcode: barcodeRouter,
  notifications: notificationApiRouter,
  tenancy: tenancyRouter,
  // Phase 4: PLM + BI + Predictive Analytics + Portals
  plm: plmRouter,
  reportBuilder: reportBuilderRouter,
  analytics: analyticsRouter,
  employeePortal: employeePortalRouter,
  buyerPortal: buyerPortalRouter,
  auditLog: auditApiRouter,
  bi: biIntegrationRouter,
  grn: grnRouter,
  invoice: invoiceRouter,
  voucher: voucherRouter,
  // Phase 5: Expenses + Finished Goods + Wastage + Sales Rep Mobile
  expenseCategory: expenseCategoryRouter,
  expense: expenseRouter,
  finishedGoods: finishedGoodsRouter,
  wastage: wastageRouter,
  salesRepVisit: salesRepVisitRouter,
  salesRepOrder: salesRepOrderRouter,
  // Phase 6: Full Accounting System
  account: accountRouter,
  openingBalance: openingBalanceRouter,
  treasury: treasuryRouter,
  generalLedger: generalLedgerRouter,
  creditLimit: creditLimitRouter,
  aging: agingRouter,
  integration: integrationRouter,
  fiscalYear: fiscalYearRouter,
});

export type AppRouter = typeof appRouter;
