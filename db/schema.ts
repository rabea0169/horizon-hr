import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  date,
  boolean,
  index,
} from "drizzle-orm/mysql-core";

// ═══════════════════════════════════════════════════════════════
//  نظام هورايزن HR — Database Schema
//  80+ جدول يغطي كل موديولات النظام
// ═══════════════════════════════════════════════════════════════

// ─── 1. Auth Users ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── 2. Departments ───
export const departments = mysqlTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#4A2C3F"),
  managerId: bigint("managerId", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

// ─── 3. Employees ───
export const employees = mysqlTable("employees", {
  id: serial("id").primaryKey(),
  employeeCode: varchar("employeeCode", { length: 20 }).notNull().unique(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  avatar: text("avatar"),
  departmentId: bigint("departmentId", { mode: "number", unsigned: true }),
  role: varchar("role", { length: 100 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 150 }).notNull(),
  managerId: bigint("managerId", { mode: "number", unsigned: true }),
  joinDate: date("joinDate").notNull(),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["active", "on_leave", "inactive", "terminated"]).default("active").notNull(),
  employmentType: mysqlEnum("employmentType", ["full_time", "part_time", "contract", "intern"]).default("full_time").notNull(),
  salaryType: mysqlEnum("salaryType", ["monthly", "piece_rate", "mixed"]).default("monthly").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  deptIdx: index("idx_employees_department_id").on(table.departmentId),
  statusIdx: index("idx_employees_status").on(table.status),
}));
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ─── 4. Attendance ───
export const attendance = mysqlTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("checkIn"),
  checkOut: timestamp("checkOut"),
  status: mysqlEnum("status", ["present", "late", "absent", "on_leave", "half_day"]).default("present").notNull(),
  hoursWorked: decimal("hoursWorked", { precision: 4, scale: 2 }),
  notes: text("notes"),
  isManual: boolean("isManual").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  empIdx: index("idx_attendance_employee_id").on(table.employeeId),
  dateIdx: index("idx_attendance_date").on(table.date),
}));
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

// ─── 5. Leave Requests ───
export const leaves = mysqlTable("leaves", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  leaveType: mysqlEnum("leaveType", ["annual", "sick", "maternity", "paternity", "unpaid", "emergency", "bereavement"]).default("annual").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  days: int("days").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  empIdx: index("idx_leaves_employee_id").on(table.employeeId),
  statusIdx: index("idx_leaves_status").on(table.status),
}));
export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = typeof leaves.$inferInsert;

// ─── 6. Performance Reviews ───
export const performanceReviews = mysqlTable("performance_reviews", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  reviewerId: bigint("reviewerId", { mode: "number", unsigned: true }).notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  overallRating: int("overallRating"),
  communication: int("communication"),
  teamwork: int("teamwork"),
  productivity: int("productivity"),
  punctuality: int("punctuality"),
  goals: text("goals"),
  comments: text("comments"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type InsertPerformanceReview = typeof performanceReviews.$inferInsert;

// ─── 7. Job Postings ───
export const jobPostings = mysqlTable("job_postings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  departmentId: bigint("departmentId", { mode: "number", unsigned: true }),
  description: text("description"),
  requirements: text("requirements"),
  salaryRange: varchar("salaryRange", { length: 100 }),
  location: varchar("location", { length: 100 }),
  employmentType: mysqlEnum("employmentType", ["full_time", "part_time", "contract", "intern"]).default("full_time").notNull(),
  status: mysqlEnum("status", ["open", "paused", "closed"]).default("open").notNull(),
  postedBy: bigint("postedBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;

// ─── 8. Candidates ───
export const candidates = mysqlTable("candidates", {
  id: serial("id").primaryKey(),
  jobPostingId: bigint("jobPostingId", { mode: "number", unsigned: true }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  resumeUrl: text("resumeUrl"),
  stage: mysqlEnum("stage", ["applied", "screening", "interview", "offer", "hired", "rejected"]).default("applied").notNull(),
  rating: int("rating"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

// ─── 9. Payroll Records ───
export const payrollRecords = mysqlTable("payroll_records", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  bonus: decimal("bonus", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  netPay: decimal("netPay", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["processed", "pending", "on_hold"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  empIdx: index("idx_payroll_employee_id").on(table.employeeId),
  monthIdx: index("idx_payroll_month").on(table.month),
}));
export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = typeof payrollRecords.$inferInsert;

// ─── 10. Shifts ───
export const shifts = mysqlTable("shifts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  daysOfWeek: varchar("daysOfWeek", { length: 20 }).notNull(),
  gracePeriod: int("gracePeriod").default(15),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

// ─── 11. Shift Assignments ───
export const shiftAssignments = mysqlTable("shift_assignments", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  shiftId: bigint("shiftId", { mode: "number", unsigned: true }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type InsertShiftAssignment = typeof shiftAssignments.$inferInsert;

// ─── 12. Advances ───
export const advances = mysqlTable("advances", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "repaid"]).default("pending").notNull(),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: timestamp("approvedAt"),
  repaymentAmount: decimal("repaymentAmount", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Advance = typeof advances.$inferSelect;
export type InsertAdvance = typeof advances.$inferInsert;

// ─── 13. Bonuses & Penalties ───
export const bonusPenalties = mysqlTable("bonus_penalties", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["bonus", "penalty"]).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  month: varchar("month", { length: 7 }).notNull(),
  appliedBy: bigint("appliedBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BonusPenalty = typeof bonusPenalties.$inferSelect;
export type InsertBonusPenalty = typeof bonusPenalties.$inferInsert;

// ─── 14. Production Lines ───
export const productionLines = mysqlTable("production_lines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  lineType: mysqlEnum("lineType", ["sewing", "cutting", "ironing", "packing", "finishing"]).default("sewing").notNull(),
  supervisorId: bigint("supervisorId", { mode: "number", unsigned: true }),
  capacity: int("capacity").default(0),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type ProductionLine = typeof productionLines.$inferSelect;
export type InsertProductionLine = typeof productionLines.$inferInsert;

// ─── 15. Production Orders ───
export const productionOrders = mysqlTable("production_orders", {
  id: serial("id").primaryKey(),
  orderCode: varchar("orderCode", { length: 50 }).notNull().unique(),
  styleName: varchar("styleName", { length: 200 }).notNull(),
  customerName: varchar("customerName", { length: 200 }),
  quantity: int("quantity").notNull(),
  completed: int("completed").default(0),
  defected: int("defected").default(0),
  lineId: bigint("lineId", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  lineIdx: index("idx_prod_orders_line_id").on(table.lineId),
  statusIdx: index("idx_prod_orders_status").on(table.status),
}));
export type ProductionOrder = typeof productionOrders.$inferSelect;
export type InsertProductionOrder = typeof productionOrders.$inferInsert;

// ─── 16. Daily Production ───
export const dailyProduction = mysqlTable("daily_production", {
  id: serial("id").primaryKey(),
  lineId: bigint("lineId", { mode: "number", unsigned: true }).notNull(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }),
  date: date("date").notNull(),
  produced: int("produced").default(0),
  defected: int("defected").default(0),
  reworked: int("reworked").default(0),
  workersCount: int("workersCount").default(0),
  hoursWorked: decimal("hoursWorked", { precision: 4, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  lineIdx: index("idx_daily_prod_line_id").on(table.lineId),
  dateIdx: index("idx_daily_prod_date").on(table.date),
}));
export type DailyProduction = typeof dailyProduction.$inferSelect;
export type InsertDailyProduction = typeof dailyProduction.$inferInsert;

// ─── 17. Production Models ───
export const productionModels = mysqlTable("production_models", {
  id: serial("id").primaryKey(),
  modelCode: varchar("modelCode", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  baseImage: text("baseImage"),
  status: mysqlEnum("status", ["active", "inactive", "draft"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type ProductionModel = typeof productionModels.$inferSelect;
export type InsertProductionModel = typeof productionModels.$inferInsert;

// ─── 18. Model Stages ───
export const modelStages = mysqlTable("model_stages", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  sequence: int("sequence").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ModelStage = typeof modelStages.$inferSelect;
export type InsertModelStage = typeof modelStages.$inferInsert;

// ─── 19. Piece Rate Records ───
export const pieceRateRecords = mysqlTable("piece_rate_records", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  stageId: bigint("stageId", { mode: "number", unsigned: true }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PieceRateRecord = typeof pieceRateRecords.$inferSelect;
export type InsertPieceRateRecord = typeof pieceRateRecords.$inferInsert;

// ─── 20. Machines ───
export const machines = mysqlTable("machines", {
  id: serial("id").primaryKey(),
  machineCode: varchar("machineCode", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  lineId: bigint("lineId", { mode: "number", unsigned: true }),
  purchaseDate: date("purchaseDate"),
  cost: decimal("cost", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["operational", "maintenance", "broken", "idle"]).default("operational").notNull(),
  nextMaintenance: date("nextMaintenance"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;

// ─── 21. Inventory Items ───
export const inventoryItems = mysqlTable("inventory_items", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  quantity: int("quantity").default(0),
  minStock: int("minStock").default(0),
  reorderPoint: int("reorderPoint").default(0),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  location: varchar("location", { length: 100 }),
  status: mysqlEnum("status", ["in_stock", "low_stock", "out_of_stock"]).default("in_stock").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

// ─── 22. Inventory Transactions ───
export const inventoryTransactions = mysqlTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["in", "out", "adjustment", "transfer"]).notNull(),
  quantity: int("quantity").notNull(),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: bigint("referenceId", { mode: "number", unsigned: true }),
  notes: text("notes"),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  itemIdx: index("idx_inv_tx_item_id").on(table.itemId),
  typeIdx: index("idx_inv_tx_type").on(table.type),
}));
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

// ─── 23. Suppliers ───
export const suppliers = mysqlTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 200 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  taxNumber: varchar("taxNumber", { length: 50 }),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  rating: int("rating"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ─── 24. Supply Orders ───
export const supplyOrders = mysqlTable("supply_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "partial", "received", "cancelled"]).default("draft").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
  expectedDate: date("expectedDate"),
  receivedDate: date("receivedDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type SupplyOrder = typeof supplyOrders.$inferSelect;
export type InsertSupplyOrder = typeof supplyOrders.$inferInsert;

// ─── 25. Supply Order Items ───
export const supplyOrderItems = mysqlTable("supply_order_items", {
  id: serial("id").primaryKey(),
  supplyOrderId: bigint("supplyOrderId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  receivedQuantity: int("receivedQuantity").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SupplyOrderItem = typeof supplyOrderItems.$inferSelect;
export type InsertSupplyOrderItem = typeof supplyOrderItems.$inferInsert;

// ─── 26. Cutting Orders ───
export const cuttingOrders = mysqlTable("cutting_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  fabricDescription: text("fabricDescription"),
  color: varchar("color", { length: 100 }),
  size: varchar("size", { length: 50 }),
  quantity: int("quantity").notNull(),
  cutQuantity: int("cutQuantity").default(0),
  status: mysqlEnum("status", ["pending", "cutting", "completed", "cancelled"]).default("pending").notNull(),
  assignedTo: bigint("assignedTo", { mode: "number", unsigned: true }),
  dueDate: date("dueDate"),
  completedDate: date("completedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CuttingOrder = typeof cuttingOrders.$inferSelect;
export type InsertCuttingOrder = typeof cuttingOrders.$inferInsert;

// ─── 27. Work Orders ───
export const workOrders = mysqlTable("work_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  productionOrderId: bigint("productionOrderId", { mode: "number", unsigned: true }),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  lineId: bigint("lineId", { mode: "number", unsigned: true }),
  quantity: int("quantity").notNull(),
  completed: int("completed").default(0),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  completedStages: text("completedStages"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = typeof workOrders.$inferInsert;

// ─── 28. Bundles (QR Tracking) ───
export const bundles = mysqlTable("bundles", {
  id: serial("id").primaryKey(),
  bundleCode: varchar("bundleCode", { length: 100 }).notNull().unique(),
  qrCode: text("qrCode"),
  workOrderId: bigint("workOrderId", { mode: "number", unsigned: true }),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  size: varchar("size", { length: 20 }),
  color: varchar("color", { length: 50 }),
  quantity: int("quantity").notNull(),
  currentStage: varchar("currentStage", { length: 100 }),
  currentLineId: bigint("currentLineId", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["cutting", "sewing", "ironing", "qc", "packed", "shipped"]).default("cutting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  woIdx: index("idx_bundles_work_order_id").on(table.workOrderId),
  statusIdx: index("idx_bundles_status").on(table.status),
}));
export type Bundle = typeof bundles.$inferSelect;
export type InsertBundle = typeof bundles.$inferInsert;

// ─── 29. Bundle Tracking ───
export const bundleTracking = mysqlTable("bundle_tracking", {
  id: serial("id").primaryKey(),
  bundleId: bigint("bundleId", { mode: "number", unsigned: true }).notNull(),
  stage: varchar("stage", { length: 100 }).notNull(),
  lineId: bigint("lineId", { mode: "number", unsigned: true }),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }),
  scannedAt: timestamp("scannedAt").defaultNow().notNull(),
  notes: text("notes"),
});
export type BundleTracking = typeof bundleTracking.$inferSelect;
export type InsertBundleTracking = typeof bundleTracking.$inferInsert;

// ─── 30. BOM Records ───
export const bomRecords = mysqlTable("bom_records", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  wastagePercent: decimal("wastagePercent", { precision: 5, scale: 2 }).default("5"),
  unit: varchar("unit", { length: 20 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BOMRecord = typeof bomRecords.$inferSelect;
export type InsertBOMRecord = typeof bomRecords.$inferInsert;

// ─── 31. QC Records ───
export const qcRecords = mysqlTable("qc_records", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }),
  bundleId: bigint("bundleId", { mode: "number", unsigned: true }),
  stage: mysqlEnum("stage", ["inline", "input", "output", "final", "packing"]).notNull(),
  checkedQuantity: int("checkedQuantity").notNull(),
  passedQuantity: int("passedQuantity").default(0),
  defectedQuantity: int("defectedQuantity").default(0),
  defects: text("defects"),
  inspectedBy: bigint("inspectedBy", { mode: "number", unsigned: true }),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type QCRecord = typeof qcRecords.$inferSelect;
export type InsertQCRecord = typeof qcRecords.$inferInsert;

// ─── 32. MRP Records ───
export const mrpRecords = mysqlTable("mrp_records", {
  id: serial("id").primaryKey(),
  productionOrderId: bigint("productionOrderId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  requiredQuantity: int("requiredQuantity").notNull(),
  availableQuantity: int("availableQuantity").default(0),
  shortage: int("shortage").default(0),
  status: mysqlEnum("status", ["planned", "ordered", "available", "shortage"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MRPRecord = typeof mrpRecords.$inferSelect;
export type InsertMRPRecord = typeof mrpRecords.$inferInsert;

// ─── 33. Challans (Dispatch) ───
export const challans = mysqlTable("challans", {
  id: serial("id").primaryKey(),
  challanNumber: varchar("challanNumber", { length: 50 }).notNull().unique(),
  type: mysqlEnum("type", ["dispatch", "return"]).default("dispatch").notNull(),
  customerName: varchar("customerName", { length: 200 }),
  orderId: bigint("orderId", { mode: "number", unsigned: true }),
  totalItems: int("totalItems").default(0),
  status: mysqlEnum("status", ["draft", "ready", "shipped", "delivered", "returned"]).default("draft").notNull(),
  vehicleNumber: varchar("vehicleNumber", { length: 50 }),
  driverName: varchar("driverName", { length: 200 }),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Challan = typeof challans.$inferSelect;
export type InsertChallan = typeof challans.$inferInsert;

// ─── 34. Challan Items ───
export const challanItems = mysqlTable("challan_items", {
  id: serial("id").primaryKey(),
  challanId: bigint("challanId", { mode: "number", unsigned: true }).notNull(),
  bundleId: bigint("bundleId", { mode: "number", unsigned: true }),
  description: varchar("description", { length: 200 }),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChallanItem = typeof challanItems.$inferSelect;
export type InsertChallanItem = typeof challanItems.$inferInsert;

// ─── 35. Subcontracting ───
export const subcontracts = mysqlTable("subcontracts", {
  id: serial("id").primaryKey(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull().unique(),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }).notNull(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }),
  description: text("description"),
  quantity: int("quantity").notNull(),
  receivedQuantity: int("receivedQuantity").default(0),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Subcontract = typeof subcontracts.$inferSelect;
export type InsertSubcontract = typeof subcontracts.$inferInsert;

// ─── 36. Sales Orders ───
export const salesOrders = mysqlTable("sales_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "in_production", "ready", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  orderDate: date("orderDate").notNull(),
  deliveryDate: date("deliveryDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  custIdx: index("idx_sales_orders_customer_id").on(table.customerId),
  statusIdx: index("idx_sales_orders_status").on(table.status),
}));
export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = typeof salesOrders.$inferInsert;

// ─── 37. CRM Customers ───
export const crmCustomers = mysqlTable("crm_customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 200 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Egypt"),
  customerType: mysqlEnum("customerType", ["wholesale", "retail", "corporate", "export"]).default("wholesale").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "prospect"]).default("active").notNull(),
  rating: int("rating"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type CRMCustomer = typeof crmCustomers.$inferSelect;
export type InsertCRMCustomer = typeof crmCustomers.$inferInsert;

// ─── 38. CRM Interactions ───
export const crmInteractions = mysqlTable("crm_interactions", {
  id: serial("id").primaryKey(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["call", "email", "meeting", "visit", "note"]).notNull(),
  subject: varchar("subject", { length: 200 }),
  content: text("content"),
  followUpDate: date("followUpDate"),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CRMInteraction = typeof crmInteractions.$inferSelect;
export type InsertCRMInteraction = typeof crmInteractions.$inferInsert;

// ─── 39. Cost Calculations ───
export const costCalculations = mysqlTable("cost_calculations", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  fabricCost: decimal("fabricCost", { precision: 12, scale: 2 }).default("0"),
  laborCost: decimal("laborCost", { precision: 12, scale: 2 }).default("0"),
  overheadCost: decimal("overheadCost", { precision: 12, scale: 2 }).default("0"),
  trimCost: decimal("trimCost", { precision: 12, scale: 2 }).default("0"),
  otherCost: decimal("otherCost", { precision: 12, scale: 2 }).default("0"),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }).notNull(),
  profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }).default("20"),
  sellingPrice: decimal("sellingPrice", { precision: 12, scale: 2 }).notNull(),
  minOrderQuantity: int("minOrderQuantity").default(100),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type CostCalculation = typeof costCalculations.$inferSelect;
export type InsertCostCalculation = typeof costCalculations.$inferInsert;

// ─── 40. Print Settings ───
export const printSettings = mysqlTable("print_settings", {
  id: serial("id").primaryKey(),
  companyName: varchar("companyName", { length: 200 }),
  companyLogo: text("companyLogo"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  taxNumber: varchar("taxNumber", { length: 50 }),
  headerText: text("headerText"),
  footerText: text("footerText"),
  paperSize: mysqlEnum("paperSize", ["a4", "a5", "letter"]).default("a4").notNull(),
  orientation: mysqlEnum("orientation", ["portrait", "landscape"]).default("portrait").notNull(),
  showLogo: boolean("showLogo").default(true),
  showSignature: boolean("showSignature").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type PrintSetting = typeof printSettings.$inferSelect;
export type InsertPrintSetting = typeof printSettings.$inferInsert;

// ─── 41. Audit Trail (Activities) ───
export const activities = mysqlTable("activities", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  userName: varchar("userName", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: bigint("entityId", { mode: "number", unsigned: true }),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// ─── 42. System Settings ───
export const systemSettings = mysqlTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

// ═══════════════════════════════════════════════════════════════
//  المرحلة 2: موديولات مصانع الملابس المتقدمة
// ═══════════════════════════════════════════════════════════════

// ─── 43. Style-Color-Size Matrix ───
export const styleColorSizeMatrix = mysqlTable("style_color_size_matrix", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  styleCode: varchar("styleCode", { length: 50 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  colorCode: varchar("colorCode", { length: 20 }),
  size: varchar("size", { length: 20 }).notNull(),
  sizeOrder: int("sizeOrder").default(0),
  quantity: int("quantity").default(0),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  barcode: varchar("barcode", { length: 100 }),
  status: mysqlEnum("status", ["active", "inactive", "discontinued"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type StyleColorSizeMatrix = typeof styleColorSizeMatrix.$inferSelect;
export type InsertStyleColorSizeMatrix = typeof styleColorSizeMatrix.$inferInsert;

// ─── 44. Fabric Rolls ───
export const fabricRolls = mysqlTable("fabric_rolls", {
  id: serial("id").primaryKey(),
  rollNumber: varchar("rollNumber", { length: 50 }).notNull().unique(),
  lotNumber: varchar("lotNumber", { length: 50 }).notNull(),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }).notNull(),
  fabricType: varchar("fabricType", { length: 100 }).notNull(),
  fabricCode: varchar("fabricCode", { length: 50 }),
  color: varchar("color", { length: 50 }),
  width: decimal("width", { precision: 6, scale: 2 }),
  length: decimal("length", { precision: 8, scale: 2 }),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  unit: varchar("unit", { length: 10 }).default("meter"),
  shrinkagePercent: decimal("shrinkagePercent", { precision: 5, scale: 2 }).default("2"),
  shade: varchar("shade", { length: 20 }),
  receivedDate: date("receivedDate").notNull(),
  location: varchar("location", { length: 100 }),
  status: mysqlEnum("status", ["available", "in_use", "finished", "rejected", "quarantine"]).default("available").notNull(),
  qualityGrade: mysqlEnum("qualityGrade", ["a", "b", "c"]).default("a"),
  inspectionNotes: text("inspectionNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type FabricRoll = typeof fabricRolls.$inferSelect;
export type InsertFabricRoll = typeof fabricRolls.$inferInsert;

// ─── 45. Cut Plans ───
export const cutPlans = mysqlTable("cut_plans", {
  id: serial("id").primaryKey(),
  planNumber: varchar("planNumber", { length: 50 }).notNull().unique(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  layCount: int("layCount").default(1),
  plyHeight: int("plyHeight").default(0),
  spreadType: mysqlEnum("spreadType", ["face_up", "face_down", "nap", "tubular"]).default("face_up"),
  totalPieces: int("totalPieces").default(0),
  plannedDate: date("plannedDate"),
  completedDate: date("completedDate"),
  status: mysqlEnum("status", ["planned", "spreading", "cutting", "completed", "cancelled"]).default("planned").notNull(),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type CutPlan = typeof cutPlans.$inferSelect;
export type InsertCutPlan = typeof cutPlans.$inferInsert;

// ─── 46. Marker Plans ───
export const markerPlans = mysqlTable("marker_plans", {
  id: serial("id").primaryKey(),
  markerNumber: varchar("markerNumber", { length: 50 }).notNull().unique(),
  cutPlanId: bigint("cutPlanId", { mode: "number", unsigned: true }).notNull(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  markerLength: decimal("markerLength", { precision: 8, scale: 2 }),
  markerWidth: decimal("markerWidth", { precision: 6, scale: 2 }),
  fabricUtilization: decimal("fabricUtilization", { precision: 5, scale: 2 }),
  piecesPerMarker: int("piecesPerMarker").default(0),
  sizeRatio: varchar("sizeRatio", { length: 50 }),
  markerImage: text("markerImage"),
  cadFile: text("cadFile"),
  status: mysqlEnum("status", ["draft", "approved", "in_use", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type MarkerPlan = typeof markerPlans.$inferSelect;
export type InsertMarkerPlan = typeof markerPlans.$inferInsert;

// ─── 47. SAM Records ───
export const samRecords = mysqlTable("sam_records", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  operationName: varchar("operationName", { length: 200 }).notNull(),
  operationCode: varchar("operationCode", { length: 50 }),
  stageId: bigint("stageId", { mode: "number", unsigned: true }),
  samMinutes: decimal("samMinutes", { precision: 6, scale: 3 }).notNull(),
  machineType: varchar("machineType", { length: 100 }),
  difficulty: mysqlEnum("difficulty", ["low", "medium", "high"]).default("medium"),
  allowancePercent: decimal("allowancePercent", { precision: 5, scale: 2 }).default("15"),
  targetPerHour: int("targetPerHour"),
  effectiveSam: decimal("effectiveSam", { precision: 6, scale: 3 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type SAMRecord = typeof samRecords.$inferSelect;
export type InsertSAMRecord = typeof samRecords.$inferInsert;

// ─── 48. Line Balancing ───
export const lineBalancing = mysqlTable("line_balancing", {
  id: serial("id").primaryKey(),
  lineId: bigint("lineId", { mode: "number", unsigned: true }).notNull(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  operationSequence: int("operationSequence").notNull(),
  operationName: varchar("operationName", { length: 200 }).notNull(),
  samMinutes: decimal("samMinutes", { precision: 6, scale: 3 }).notNull(),
  workstations: int("workstations").default(1),
  operators: int("operators").default(1),
  targetOutput: int("targetOutput").default(0),
  actualOutput: int("actualOutput").default(0),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }),
  bottleneck: boolean("bottleneck").default(false),
  cycleTime: decimal("cycleTime", { precision: 6, scale: 3 }),
  taktTime: decimal("taktTime", { precision: 6, scale: 3 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type LineBalancing = typeof lineBalancing.$inferSelect;
export type InsertLineBalancing = typeof lineBalancing.$inferInsert;

// ─── 49. Warehouses ───
export const warehouses = mysqlTable("warehouses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  type: mysqlEnum("type", ["raw_material", "finished_goods", "work_in_progress", "rejected", "quarantine"]).default("raw_material").notNull(),
  address: text("address"),
  managerName: varchar("managerName", { length: 200 }),
  phone: varchar("phone", { length: 30 }),
  isDefault: boolean("isDefault").default(false),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = typeof warehouses.$inferInsert;

// ─── 50. Warehouse Bins ───
export const warehouseBins = mysqlTable("warehouse_bins", {
  id: serial("id").primaryKey(),
  warehouseId: bigint("warehouseId", { mode: "number", unsigned: true }).notNull(),
  binCode: varchar("binCode", { length: 50 }).notNull(),
  aisle: varchar("aisle", { length: 20 }),
  rack: varchar("rack", { length: 20 }),
  shelf: varchar("shelf", { length: 20 }),
  capacity: int("capacity").default(0),
  currentQty: int("currentQty").default(0),
  itemId: bigint("itemId", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["empty", "partial", "full", "reserved"]).default("empty").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WarehouseBin = typeof warehouseBins.$inferSelect;
export type InsertWarehouseBin = typeof warehouseBins.$inferInsert;

// ─── 51. Reorder Rules ───
export const reorderRules = mysqlTable("reorder_rules", {
  id: serial("id").primaryKey(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  warehouseId: bigint("warehouseId", { mode: "number", unsigned: true }),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }),
  minStock: int("minStock").default(0),
  maxStock: int("maxStock").default(0),
  reorderPoint: int("reorderPoint").default(0),
  reorderQty: int("reorderQty").default(0),
  safetyStock: int("safetyStock").default(0),
  leadTimeDays: int("leadTimeDays").default(7),
  autoReorder: boolean("autoReorder").default(false),
  notificationEmail: varchar("notificationEmail", { length: 320 }),
  status: mysqlEnum("status", ["active", "inactive", "triggered"]).default("active").notNull(),
  lastReorderDate: date("lastReorderDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type ReorderRule = typeof reorderRules.$inferSelect;
export type InsertReorderRule = typeof reorderRules.$inferInsert;


// ═══════════════════════════════════════════════════════════════
//  المرحلة 4: PLM + BI + Predictive Analytics + Portals
// ═══════════════════════════════════════════════════════════════

// ─── 52. Product Lifecycle ───
export const productLifecycle = mysqlTable("product_lifecycle", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  stage: mysqlEnum("stage", [
    "concept", "design", "tech_pack", "sampling", "costing",
    "buyer_approval", "bulk_fabric", "cutting", "production",
    "finishing", "qc_final", "packing", "shipped", "delivered",
  ]).notNull(),
  stageOrder: int("stageOrder").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped", "blocked"]).default("pending").notNull(),
  assignedTo: bigint("assignedTo", { mode: "number", unsigned: true }),
  startDate: date("startDate"),
  targetDate: date("targetDate"),
  completedDate: date("completedDate"),
  notes: text("notes"),
  attachments: text("attachments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type ProductLifecycle = typeof productLifecycle.$inferSelect;
export type InsertProductLifecycle = typeof productLifecycle.$inferInsert;

// ─── 53. Tech Packs ───
export const techPacks = mysqlTable("tech_packs", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  packNumber: varchar("packNumber", { length: 50 }).notNull().unique(),
  version: varchar("version", { length: 10 }).default("1.0"),
  description: text("description"),
  fabricSpecs: text("fabricSpecs"),
  trimSpecs: text("trimSpecs"),
  measurementChart: text("measurementChart"),
  constructionDetails: text("constructionDetails"),
  sketchImages: text("sketchImages"),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: timestamp("approvedAt"),
  status: mysqlEnum("status", ["draft", "review", "approved", "rejected", "revision_needed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type TechPack = typeof techPacks.$inferSelect;
export type InsertTechPack = typeof techPacks.$inferInsert;

// ─── 54. Design Revisions ───
export const designRevisions = mysqlTable("design_revisions", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  techPackId: bigint("techPackId", { mode: "number", unsigned: true }),
  revisionNumber: varchar("revisionNumber", { length: 10 }).notNull(),
  changeDescription: text("changeDescription"),
  changedBy: bigint("changedBy", { mode: "number", unsigned: true }),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DesignRevision = typeof designRevisions.$inferSelect;
export type InsertDesignRevision = typeof designRevisions.$inferInsert;

// ─── 55. Sample Reviews ───
export const sampleReviews = mysqlTable("sample_reviews", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  techPackId: bigint("techPackId", { mode: "number", unsigned: true }),
  sampleType: mysqlEnum("sampleType", ["fit", "pp", "production", "counter", "size_set"]).notNull(),
  size: varchar("size", { length: 20 }),
  color: varchar("color", { length: 50 }),
  reviewerName: varchar("reviewerName", { length: 200 }),
  reviewDate: date("reviewDate"),
  comments: text("comments"),
  defects: text("defects"),
  decision: mysqlEnum("decision", ["approved", "approved_with_comments", "rejected", "resubmit"]),
  status: mysqlEnum("status", ["submitted", "under_review", "decided"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SampleReview = typeof sampleReviews.$inferSelect;
export type InsertSampleReview = typeof sampleReviews.$inferInsert;

// ─── 56. Custom Reports ───
export const customReports = mysqlTable("custom_reports", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  queryConfig: text("queryConfig").notNull(),
  chartType: mysqlEnum("chartType", ["table", "bar", "line", "pie", "area", "kpi", "heatmap"]).default("table").notNull(),
  filters: text("filters"),
  schedule: varchar("schedule", { length: 50 }),
  isPublic: boolean("isPublic").default(false),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type CustomReport = typeof customReports.$inferSelect;
export type InsertCustomReport = typeof customReports.$inferInsert;

// ─── 57. Report Templates ───
export const reportTemplates = mysqlTable("report_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  queryConfig: text("queryConfig").notNull(),
  chartType: mysqlEnum("chartType", ["table", "bar", "line", "pie", "area", "kpi", "heatmap"]).default("table").notNull(),
  isSystem: boolean("isSystem").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;

// ─── 58. Buyer Portal Users ───
export const buyerPortalUsers = mysqlTable("buyer_portal_users", {
  id: serial("id").primaryKey(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  password: varchar("password", { length: 255 }),
  role: mysqlEnum("role", ["buyer_admin", "buyer_user", "viewer"]).default("buyer_user").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("pending").notNull(),
  lastLogin: timestamp("lastLogin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BuyerPortalUser = typeof buyerPortalUsers.$inferSelect;
export type InsertBuyerPortalUser = typeof buyerPortalUsers.$inferInsert;

// ─── 59. Production Forecasts ───
export const productionForecasts = mysqlTable("production_forecasts", {
  id: serial("id").primaryKey(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  lineId: bigint("lineId", { mode: "number", unsigned: true }),
  forecastType: mysqlEnum("forecastType", ["demand", "capacity", "material", "delivery"]).notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  predictedValue: decimal("predictedValue", { precision: 12, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("85"),
  actualValue: decimal("actualValue", { precision: 12, scale: 2 }),
  variance: decimal("variance", { precision: 12, scale: 2 }),
  algorithm: varchar("algorithm", { length: 50 }).default("linear_regression"),
  factors: text("factors"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProductionForecast = typeof productionForecasts.$inferSelect;
export type InsertProductionForecast = typeof productionForecasts.$inferInsert;

// ─── 60. Audit Log ───
export const auditLog = mysqlTable("audit_log", {
  id: serial("id").primaryKey(),
  tableName: varchar("tableName", { length: 100 }).notNull(),
  recordId: bigint("recordId", { mode: "number", unsigned: true }).notNull(),
  action: mysqlEnum("action", ["INSERT", "UPDATE", "DELETE"]).notNull(),
  oldValues: text("oldValues"),
  newValues: text("newValues"),
  changedBy: bigint("changedBy", { mode: "number", unsigned: true }),
  changedByName: varchar("changedByName", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// ─── 61. Company Settings ───
export const companySettings = mysqlTable("company_settings", {
  id: serial("id").primaryKey(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  companyNameEn: varchar("companyNameEn", { length: 200 }),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  taxNumber: varchar("taxNumber", { length: 50 }),
  commercialRegister: varchar("commercialRegister", { length: 50 }),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("14"),
  currency: varchar("currency", { length: 10 }).default("EGP"),
  fiscalYearStart: date("fiscalYearStart"),
  fiscalYearEnd: date("fiscalYearEnd"),
  logo: text("logo"),
  paymentTerms: text("paymentTerms"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type CompanySetting = typeof companySettings.$inferSelect;
export type InsertCompanySetting = typeof companySettings.$inferInsert;

// ─── 62. Purchase Requests (PR) ───
export const purchaseRequests = mysqlTable("purchase_requests", {
  id: serial("id").primaryKey(),
  prNumber: varchar("prNumber", { length: 50 }).notNull().unique(),
  department: varchar("department", { length: 100 }),
  requestedBy: varchar("requestedBy", { length: 255 }),
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "rejected", "converted_to_po"]).default("draft").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  requiredDate: date("requiredDate"),
  notes: text("notes"),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type InsertPurchaseRequest = typeof purchaseRequests.$inferInsert;

// ─── 63. Purchase Request Items ───
export const purchaseRequestItems = mysqlTable("purchase_request_items", {
  id: serial("id").primaryKey(),
  purchaseRequestId: bigint("purchaseRequestId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PurchaseRequestItem = typeof purchaseRequestItems.$inferSelect;
export type InsertPurchaseRequestItem = typeof purchaseRequestItems.$inferInsert;

// ─── 64. GRN (Goods Received Note) ───
export const grns = mysqlTable("grns", {
  id: serial("id").primaryKey(),
  grnNumber: varchar("grnNumber", { length: 50 }).notNull().unique(),
  supplyOrderId: bigint("supplyOrderId", { mode: "number", unsigned: true }).notNull(),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }).notNull(),
  receivedDate: date("receivedDate").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),
  invoiceDate: date("invoiceDate"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
  vatAmount: decimal("vatAmount", { precision: 12, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["pending", "partial", "fully_received", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  receivedBy: varchar("receivedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type GRN = typeof grns.$inferSelect;
export type InsertGRN = typeof grns.$inferInsert;

// ─── 65. Sales Invoices ───
export const salesInvoices = mysqlTable("sales_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  salesOrderId: bigint("salesOrderId", { mode: "number", unsigned: true }).notNull(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  issueDate: date("issueDate").notNull(),
  dueDate: date("dueDate"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: decimal("vatAmount", { precision: 12, scale: 2 }),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["draft", "issued", "paid", "partial", "overdue", "cancelled"]).default("draft").notNull(),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type SalesInvoice = typeof salesInvoices.$inferSelect;
export type InsertSalesInvoice = typeof salesInvoices.$inferInsert;

// ─── 66. Purchase Invoices ───
export const purchaseInvoices = mysqlTable("purchase_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  grnId: bigint("grnId", { mode: "number", unsigned: true }).notNull(),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }).notNull(),
  issueDate: date("issueDate").notNull(),
  dueDate: date("dueDate"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: decimal("vatAmount", { precision: 12, scale: 2 }),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["draft", "received", "paid", "partial", "overdue", "cancelled"]).default("draft").notNull(),
  withholdingTax: decimal("withholdingTax", { precision: 12, scale: 2 }).default("0"),
  customsDuty: decimal("customsDuty", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type PurchaseInvoice = typeof purchaseInvoices.$inferSelect;
export type InsertPurchaseInvoice = typeof purchaseInvoices.$inferInsert;

// ─── 67. Payment Vouchers ───
export const paymentVouchers = mysqlTable("payment_vouchers", {
  id: serial("id").primaryKey(),
  voucherNumber: varchar("voucherNumber", { length: 50 }).notNull().unique(),
  voucherDate: date("voucherDate").notNull(),
  payeeName: varchar("payeeName", { length: 255 }).notNull(),
  payeeType: mysqlEnum("payeeType", ["supplier", "employee", "contractor", "other"]).notNull(),
  payeeId: bigint("payeeId", { mode: "number", unsigned: true }),
  referenceInvoiceId: bigint("referenceInvoiceId", { mode: "number", unsigned: true }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "check", "bank_transfer", "credit_card"]).default("cash").notNull(),
  checkNumber: varchar("checkNumber", { length: 50 }),
  bankName: varchar("bankName", { length: 100 }),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "approved", "paid", "cancelled"]).default("draft").notNull(),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type PaymentVoucher = typeof paymentVouchers.$inferSelect;
export type InsertPaymentVoucher = typeof paymentVouchers.$inferInsert;

// ─── 68. Receipt Vouchers ───
export const receiptVouchers = mysqlTable("receipt_vouchers", {
  id: serial("id").primaryKey(),
  voucherNumber: varchar("voucherNumber", { length: 50 }).notNull().unique(),
  voucherDate: date("voucherDate").notNull(),
  payerName: varchar("payerName", { length: 255 }).notNull(),
  payerType: mysqlEnum("payerType", ["customer", "employee", "other"]).notNull(),
  payerId: bigint("payerId", { mode: "number", unsigned: true }),
  referenceInvoiceId: bigint("referenceInvoiceId", { mode: "number", unsigned: true }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "check", "bank_transfer", "credit_card"]).default("cash").notNull(),
  checkNumber: varchar("checkNumber", { length: 50 }),
  bankName: varchar("bankName", { length: 100 }),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "approved", "received", "cancelled"]).default("draft").notNull(),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type ReceiptVoucher = typeof receiptVouchers.$inferSelect;
export type InsertReceiptVoucher = typeof receiptVouchers.$inferInsert;

// ─── 69. Journal Vouchers ───
export const journalVouchers = mysqlTable("journal_vouchers", {
  id: serial("id").primaryKey(),
  voucherNumber: varchar("voucherNumber", { length: 50 }).notNull().unique(),
  voucherDate: date("voucherDate").notNull(),
  description: text("description"),
  totalDebit: decimal("totalDebit", { precision: 12, scale: 2 }).notNull(),
  totalCredit: decimal("totalCredit", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "posted", "cancelled"]).default("draft").notNull(),
  postedBy: bigint("postedBy", { mode: "number", unsigned: true }),
  postedAt: timestamp("postedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type JournalVoucher = typeof journalVouchers.$inferSelect;
export type InsertJournalVoucher = typeof journalVouchers.$inferInsert;

// ─── 70. Journal Voucher Lines ───
export const journalVoucherLines = mysqlTable("journal_voucher_lines", {
  id: serial("id").primaryKey(),
  journalVoucherId: bigint("journalVoucherId", { mode: "number", unsigned: true }).notNull(),
  accountCode: varchar("accountCode", { length: 50 }).notNull(),
  accountName: varchar("accountName", { length: 200 }).notNull(),
  debit: decimal("debit", { precision: 12, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 12, scale: 2 }).default("0"),
  description: text("description"),
  costCenter: varchar("costCenter", { length: 100 }),
  reference: varchar("reference", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type JournalVoucherLine = typeof journalVoucherLines.$inferSelect;
export type InsertJournalVoucherLine = typeof journalVoucherLines.$inferInsert;

// ─── 71. Maintenance Records ───
export const maintenanceRecords = mysqlTable("maintenance_records", {
  id: serial("id").primaryKey(),
  machineId: bigint("machineId", { mode: "number", unsigned: true }).notNull(),
  maintenanceType: mysqlEnum("maintenanceType", ["preventive", "corrective", "overhaul"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly", "quarterly", "semi_annual", "annual"]),
  scheduledDate: date("scheduledDate").notNull(),
  completedDate: date("completedDate"),
  cost: decimal("cost", { precision: 12, scale: 2 }),
  partsUsed: text("partsUsed"),
  technicianName: varchar("technicianName", { length: 255 }),
  downtime: int("downtime"),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "overdue", "cancelled"]).default("scheduled").notNull(),
  nextDueDate: date("nextDueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

// ─── 72. Machine Depreciation ───
export const machineDepreciation = mysqlTable("machine_depreciation", {
  id: serial("id").primaryKey(),
  machineId: bigint("machineId", { mode: "number", unsigned: true }).notNull(),
  year: int("year").notNull(),
  period: varchar("period", { length: 20 }).notNull(),
  depreciationAmount: decimal("depreciationAmount", { precision: 12, scale: 2 }).notNull(),
  accumulatedDepreciation: decimal("accumulatedDepreciation", { precision: 12, scale: 2 }).notNull(),
  bookValue: decimal("bookValue", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MachineDepreciationRecord = typeof machineDepreciation.$inferSelect;
export type InsertMachineDepreciationRecord = typeof machineDepreciation.$inferInsert;

// ─── 73. Order Amendments ───
export const orderAmendments = mysqlTable("order_amendments", {
  id: serial("id").primaryKey(),
  salesOrderId: bigint("salesOrderId", { mode: "number", unsigned: true }).notNull(),
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  reason: text("reason"),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OrderAmendment = typeof orderAmendments.$inferSelect;
export type InsertOrderAmendment = typeof orderAmendments.$inferInsert;

// ─── 74. Delivery Reminders ───
export const deliveryReminders = mysqlTable("delivery_reminders", {
  id: serial("id").primaryKey(),
  salesOrderId: bigint("salesOrderId", { mode: "number", unsigned: true }).notNull(),
  reminderType: mysqlEnum("reminderType", ["7_days", "3_days", "1_day", "overdue"]).notNull(),
  sent: boolean("sent").default(false),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DeliveryReminder = typeof deliveryReminders.$inferSelect;
export type InsertDeliveryReminder = typeof deliveryReminders.$inferInsert;

// ─── 75. Quotation ───
export const quotations = mysqlTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: varchar("quotationNumber", { length: 50 }).notNull().unique(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  issueDate: date("issueDate").notNull(),
  expiryDate: date("expiryDate"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: decimal("vatAmount", { precision: 12, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  deliveryTerms: varchar("deliveryTerms", { length: 100 }),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

// ─── 76. Quotation Items ───
export const quotationItems = mysqlTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: bigint("quotationId", { mode: "number", unsigned: true }).notNull(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }),
  description: varchar("description", { length: 255 }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = typeof quotationItems.$inferInsert;

// ─── 77. Defect Types ───
export const defectTypes = mysqlTable("defect_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["cutting", "sewing", "measurement", "appearance", "assembly", "packaging"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "major", "minor"]).notNull(),
  description: text("description"),
  isSystem: boolean("isSystem").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DefectType = typeof defectTypes.$inferSelect;
export type InsertDefectType = typeof defectTypes.$inferInsert;

// ═══════════════════════════════════════════════════════════════
//  المرحلة 5: المصاريف التشغيلية + مخزن المنتج النهائي + الهالك + مندوب المبيعات
// ═══════════════════════════════════════════════════════════════

// ─── 78. Expense Categories ───
export const expenseCategories = mysqlTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  parentId: bigint("parentId", { mode: "number", unsigned: true }),
  description: text("description"),
  budgetLimit: decimal("budgetLimit", { precision: 12, scale: 2 }),
  period: mysqlEnum("period", ["monthly", "quarterly", "annual", "weekly", "daily"]).default("monthly"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

// ─── 79. Expenses ───
export const expenses = mysqlTable("expenses", {
  id: serial("id").primaryKey(),
  expenseNumber: varchar("expenseNumber", { length: 50 }).notNull().unique(),
  categoryId: bigint("categoryId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: date("expenseDate").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "check", "bank_transfer", "credit_card", "other"]).default("cash"),
  payee: varchar("payee", { length: 255 }),
  receiptNumber: varchar("receiptNumber", { length: 50 }),
  receiptImage: text("receiptImage"),
  isRecurring: boolean("isRecurring").default(false),
  recurringFrequency: mysqlEnum("recurringFrequency", ["weekly", "monthly", "quarterly", "annually"]),
  departmentId: bigint("departmentId", { mode: "number", unsigned: true }),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: timestamp("approvedAt"),
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "paid"]).default("draft").notNull(),
  vatAmount: decimal("vatAmount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  allocatedToOrderId: bigint("allocatedToOrderId", { mode: "number", unsigned: true }),
  allocatedToModelId: bigint("allocatedToModelId", { mode: "number", unsigned: true }),
  notes: text("notes"),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── 80. Finished Goods ───
export const finishedGoods = mysqlTable("finished_goods", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 50 }).notNull().unique(),
  modelId: bigint("modelId", { mode: "number", unsigned: true }).notNull(),
  modelName: varchar("modelName", { length: 200 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  barcode: varchar("barcode", { length: 100 }),
  productionOrderId: bigint("productionOrderId", { mode: "number", unsigned: true }),
  bundleId: bigint("bundleId", { mode: "number", unsigned: true }),
  warehouseId: bigint("warehouseId", { mode: "number", unsigned: true }).notNull(),
  binId: bigint("binId", { mode: "number", unsigned: true }),
  quantity: int("quantity").default(0).notNull(),
  availableQty: int("availableQty").default(0).notNull(),
  reservedQty: int("reservedQty").default(0).notNull(),
  unitCost: decimal("unitCost", { precision: 12, scale: 2 }),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }),
  sellingPrice: decimal("sellingPrice", { precision: 12, scale: 2 }),
  customerId: bigint("customerId", { mode: "number", unsigned: true }),
  customerName: varchar("customerName", { length: 200 }),
  salesOrderId: bigint("salesOrderId", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["in_stock", "reserved", "picked", "packed", "shipped", "delivered", "returned", "quarantine"]).default("in_stock").notNull(),
  qualityGrade: mysqlEnum("qualityGrade", ["a", "b", "c"]).default("a"),
  productionDate: date("productionDate"),
  expiryDate: date("expiryDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type FinishedGood = typeof finishedGoods.$inferSelect;
export type InsertFinishedGood = typeof finishedGoods.$inferInsert;

// ─── 81. Wastage Records ───
export const wastageRecords = mysqlTable("wastage_records", {
  id: serial("id").primaryKey(),
  wastageNumber: varchar("wastageNumber", { length: 50 }).notNull().unique(),
  sourceType: mysqlEnum("sourceType", ["cutting", "sewing", "ironing", "finishing", "qc_reject", "damage", "expiry"]).notNull(),
  sourceId: bigint("sourceId", { mode: "number", unsigned: true }),
  modelId: bigint("modelId", { mode: "number", unsigned: true }),
  productionOrderId: bigint("productionOrderId", { mode: "number", unsigned: true }),
  lineId: bigint("lineId", { mode: "number", unsigned: true }),
  itemId: bigint("itemId", { mode: "number", unsigned: true }),
  fabricRollId: bigint("fabricRollId", { mode: "number", unsigned: true }),
  wastageType: mysqlEnum("wastageType", ["end_bit", "defect", "shrinkage", "overcut", "miscut", "thread_waste", "oil_stain", "other"]).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  unitCost: decimal("unitCost", { precision: 12, scale: 2 }),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }),
  percentOfInput: decimal("percentOfInput", { precision: 5, scale: 2 }),
  standardPercent: decimal("standardPercent", { precision: 5, scale: 2 }),
  variance: decimal("variance", { precision: 5, scale: 2 }),
  isWithinStandard: boolean("isWithinStandard").default(true),
  reason: text("reason"),
  correctiveAction: text("correctiveAction"),
  reportedBy: bigint("reportedBy", { mode: "number", unsigned: true }),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["reported", "under_review", "approved", "rejected", "resolved"]).default("reported").notNull(),
  wastageDate: date("wastageDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type WastageRecord = typeof wastageRecords.$inferSelect;
export type InsertWastageRecord = typeof wastageRecords.$inferInsert;

// ─── 82. Sales Rep Visits ───
export const salesRepVisits = mysqlTable("sales_rep_visits", {
  id: serial("id").primaryKey(),
  visitNumber: varchar("visitNumber", { length: 50 }).notNull().unique(),
  salesRepId: bigint("salesRepId", { mode: "number", unsigned: true }).notNull(),
  salesRepName: varchar("salesRepName", { length: 255 }).notNull(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }),
  customerName: varchar("customerName", { length: 200 }),
  customerPhone: varchar("customerPhone", { length: 30 }),
  customerAddress: text("customerAddress"),
  customerLocation: varchar("customerLocation", { length: 255 }),
  visitType: mysqlEnum("visitType", ["scheduled", "unplanned", "follow_up", "complaint", "delivery", "collection"]).default("scheduled").notNull(),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled", "no_show"]).default("planned").notNull(),
  scheduledDate: date("scheduledDate").notNull(),
  scheduledTime: varchar("scheduledTime", { length: 5 }),
  actualStartTime: timestamp("actualStartTime"),
  actualEndTime: timestamp("actualEndTime"),
  purpose: text("purpose"),
  outcome: text("outcome"),
  notes: text("notes"),
  gpsLatitude: decimal("gpsLatitude", { precision: 10, scale: 8 }),
  gpsLongitude: decimal("gpsLongitude", { precision: 11, scale: 8 }),
  photos: text("photos"),
  nextVisitDate: date("nextVisitDate"),
  orderTaken: boolean("orderTaken").default(false),
  orderAmount: decimal("orderAmount", { precision: 12, scale: 2 }),
  paymentCollected: decimal("paymentCollected", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type SalesRepVisit = typeof salesRepVisits.$inferSelect;
export type InsertSalesRepVisit = typeof salesRepVisits.$inferInsert;

// ─── 83. Sales Rep Orders ───
export const salesRepOrders = mysqlTable("sales_rep_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  salesRepId: bigint("salesRepId", { mode: "number", unsigned: true }).notNull(),
  salesRepName: varchar("salesRepName", { length: 255 }).notNull(),
  visitId: bigint("visitId", { mode: "number", unsigned: true }),
  customerId: bigint("customerId", { mode: "number", unsigned: true }),
  customerName: varchar("customerName", { length: 200 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }),
  customerAddress: text("customerAddress"),
  modelId: bigint("modelId", { mode: "number", unsigned: true }),
  modelName: varchar("modelName", { length: 200 }),
  color: varchar("color", { length: 50 }),
  size: varchar("size", { length: 20 }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0"),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: decimal("vatAmount", { precision: 12, scale: 2 }),
  grandTotal: decimal("grandTotal", { precision: 12, scale: 2 }).notNull(),
  deliveryDate: date("deliveryDate"),
  deliveryAddress: text("deliveryAddress"),
  specialInstructions: text("specialInstructions"),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "in_production", "ready", "delivered", "cancelled", "rejected"]).default("draft").notNull(),
  syncedToErp: boolean("syncedToErp").default(false),
  erpOrderId: bigint("erpOrderId", { mode: "number", unsigned: true }),
  photos: text("photos"),
  customerSignature: text("customerSignature"),
  gpsLatitude: decimal("gpsLatitude", { precision: 10, scale: 8 }),
  gpsLongitude: decimal("gpsLongitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type SalesRepOrder = typeof salesRepOrders.$inferSelect;
export type InsertSalesRepOrder = typeof salesRepOrders.$inferInsert;

// ═══════════════════════════════════════════════════════════════
//  المرحلة 6: النظام المحاسبي المتكامل
//  شجرة حسابات + خزينة + رصيد افتتاحي + دفتر أستاذ + تكامل تلقائي
// ═══════════════════════════════════════════════════════════════

// ─── 84. Chart of Accounts (شجرة الحسابات) ───
export const accounts = mysqlTable("accounts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  nameEn: varchar("nameEn", { length: 200 }),
  type: mysqlEnum("type", [
    "asset",         // أصول
    "liability",     // خصوم
    "equity",        // حقوق ملكية
    "revenue",       // إيرادات
    "expense",       // مصروفات
    "cost_of_sales", // تكلفة المبيعات
  ]).notNull(),
  category: mysqlEnum("category", [
    "current_asset",       // أصول متداولة
    "fixed_asset",         // أصول ثابتة
    "current_liability",   // خصوم متداولة
    "long_term_liability", // خصوم طويلة الأجل
    "equity",              // حقوق الملكية
    "revenue",             // الإيرادات
    "expense",             // المصروفات العامة
    "cost_of_sales",       // تكلفة المبيعات
    "other_income",        // إيرادات أخرى
    "other_expense",       // مصروفات أخرى
  ]).notNull(),
  parentId: bigint("parentId", { mode: "number", unsigned: true }),
  level: int("level").default(1).notNull(),
  isLeaf: boolean("isLeaf").default(true).notNull(),
  openingBalance: decimal("openingBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 10 }).default("EGP"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

// ─── 85. Opening Balances (الأرصدة الافتتاحية) ───
export const openingBalances = mysqlTable("opening_balances", {
  id: serial("id").primaryKey(),
  fiscalYear: varchar("fiscalYear", { length: 10 }).notNull(),
  accountId: bigint("accountId", { mode: "number", unsigned: true }).notNull(),
  debit: decimal("debit", { precision: 12, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 12, scale: 2 }).default("0").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  posted: boolean("posted").default(false).notNull(),
  postedAt: timestamp("postedAt"),
  postedBy: bigint("postedBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type OpeningBalance = typeof openingBalances.$inferSelect;
export type InsertOpeningBalance = typeof openingBalances.$inferInsert;

// ─── 86. Treasury Accounts (حسابات الخزينة) ───
export const treasuryAccounts = mysqlTable("treasury_accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  type: mysqlEnum("type", ["cash", "bank", "check", "other"]).notNull(),
  bankName: varchar("bankName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  iban: varchar("iban", { length: 50 }),
  branch: varchar("branch", { length: 100 }),
  currency: varchar("currency", { length: 10 }).default("EGP"),
  openingBalance: decimal("openingBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true).notNull(),
  accountId: bigint("accountId", { mode: "number", unsigned: true }), // link to chart of accounts
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type TreasuryAccount = typeof treasuryAccounts.$inferSelect;
export type InsertTreasuryAccount = typeof treasuryAccounts.$inferInsert;

// ─── 87. Treasury Transactions (حركات الخزينة) ───
export const treasuryTransactions = mysqlTable("treasury_transactions", {
  id: serial("id").primaryKey(),
  treasuryAccountId: bigint("treasuryAccountId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["receipt", "payment", "transfer_in", "transfer_out"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  reference: varchar("reference", { length: 100 }),
  // Related document
  documentType: mysqlEnum("documentType", [
    "sales_invoice", "purchase_invoice", "expense", "payroll",
    "voucher", "order", "other", "opening_balance",
  ]),
  documentId: bigint("documentId", { mode: "number", unsigned: true }),
  documentNumber: varchar("documentNumber", { length: 50 }),
  // Party
  partyType: mysqlEnum("partyType", ["customer", "supplier", "employee", "other"]),
  partyId: bigint("partyId", { mode: "number", unsigned: true }),
  partyName: varchar("partyName", { length: 255 }),
  // Accounting
  debitAccountId: bigint("debitAccountId", { mode: "number", unsigned: true }),
  creditAccountId: bigint("creditAccountId", { mode: "number", unsigned: true }),
  // Meta
  description: text("description"),
  notes: text("notes"),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  acctIdx: index("idx_treasury_tx_account_id").on(table.treasuryAccountId),
  typeIdx: index("idx_treasury_tx_type").on(table.type),
  dateIdx: index("idx_treasury_tx_date").on(table.date),
}));
export type TreasuryTransaction = typeof treasuryTransactions.$inferSelect;
export type InsertTreasuryTransaction = typeof treasuryTransactions.$inferInsert;

// ─── 88. General Ledger (دفتر الأستاذ العام) ───
export const generalLedger = mysqlTable("general_ledger", {
  id: serial("id").primaryKey(),
  entryId: varchar("entryId", { length: 50 }).notNull(),
  lineNumber: int("lineNumber").notNull(),
  date: date("date").notNull(),
  accountId: bigint("accountId", { mode: "number", unsigned: true }).notNull(),
  debit: decimal("debit", { precision: 12, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 12, scale: 2 }).default("0").notNull(),
  // Source document
  sourceType: mysqlEnum("sourceType", [
    "manual_journal", "sales_invoice", "purchase_invoice", "expense",
    "payment_voucher", "receipt_voucher", "payroll", "inventory_in",
    "inventory_out", "transfer", "opening_balance", "grn", "challan",
    "finished_goods", "wastage", "treasury",
  ]).notNull(),
  sourceId: bigint("sourceId", { mode: "number", unsigned: true }),
  sourceNumber: varchar("sourceNumber", { length: 50 }),
  // Party
  partyType: mysqlEnum("partyType", ["customer", "supplier", "employee", "other"]),
  partyId: bigint("partyId", { mode: "number", unsigned: true }),
  partyName: varchar("partyName", { length: 255 }),
  description: text("description"),
  // Fiscal
  fiscalYear: varchar("fiscalYear", { length: 10 }).notNull(),
  period: varchar("period", { length: 10 }).notNull(), // MM-YYYY
  notes: text("notes"),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  acctIdx: index("idx_gl_account_id").on(table.accountId),
  entryIdx: index("idx_gl_entry_id").on(table.entryId),
  fiscalYearIdx: index("idx_gl_fiscal_year").on(table.fiscalYear),
  dateIdx: index("idx_gl_date").on(table.date),
}));
export type GeneralLedgerEntry = typeof generalLedger.$inferSelect;
export type InsertGeneralLedgerEntry = typeof generalLedger.$inferInsert;

// ─── 89. Credit Limits (سقف الائتمان للعملاء) ───
export const creditLimits = mysqlTable("credit_limits", {
  id: serial("id").primaryKey(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  creditLimit: decimal("creditLimit", { precision: 12, scale: 2 }).notNull(),
  paymentTermDays: int("paymentTermDays").default(30),
  currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  totalInvoiced: decimal("totalInvoiced", { precision: 12, scale: 2 }).default("0").notNull(),
  totalPaid: decimal("totalPaid", { precision: 12, scale: 2 }).default("0").notNull(),
  totalOverdue: decimal("totalOverdue", { precision: 12, scale: 2 }).default("0").notNull(),
  warningPercent: decimal("warningPercent", { precision: 5, scale: 2 }).default("80"),
  isActive: boolean("isActive").default(true).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull().$onUpdate(() => new Date()),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CreditLimit = typeof creditLimits.$inferSelect;
export type InsertCreditLimit = typeof creditLimits.$inferInsert;

// ─── 90. Aging Buckets (فئات المديونية) ───
export const agingBuckets = mysqlTable("aging_buckets", {
  id: serial("id").primaryKey(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  invoiceId: bigint("invoiceId", { mode: "number", unsigned: true }).notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
  invoiceDate: date("invoiceDate").notNull(),
  dueDate: date("dueDate").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).default("0").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  bucket1_30: decimal("bucket1_30", { precision: 12, scale: 2 }).default("0"),
  bucket31_60: decimal("bucket31_60", { precision: 12, scale: 2 }).default("0"),
  bucket61_90: decimal("bucket61_90", { precision: 12, scale: 2 }).default("0"),
  bucket90_plus: decimal("bucket90_plus", { precision: 12, scale: 2 }).default("0"),
  lastCalculated: timestamp("lastCalculated").defaultNow().notNull(),
});
export type AgingBucket = typeof agingBuckets.$inferSelect;
export type InsertAgingBucket = typeof agingBuckets.$inferInsert;

// ─── 91. Integration Logs (سجل التكامل التلقائي) ───
export const integrationLogs = mysqlTable("integration_logs", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 100 }).notNull(),
  sourceModule: varchar("sourceModule", { length: 50 }).notNull(),
  targetModule: varchar("targetModule", { length: 50 }).notNull(),
  sourceId: bigint("sourceId", { mode: "number", unsigned: true }),
  targetId: bigint("targetId", { mode: "number", unsigned: true }),
  sourceNumber: varchar("sourceNumber", { length: 50 }),
  targetNumber: varchar("targetNumber", { length: 50 }),
  status: mysqlEnum("status", ["success", "failed", "skipped", "pending"]).default("pending").notNull(),
  details: text("details"),
  errorMessage: text("errorMessage"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = typeof integrationLogs.$inferInsert;

// ─── 92. Fiscal Years (السنوات المالية) ───
export const fiscalYears = mysqlTable("fiscal_years", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 20 }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  status: mysqlEnum("status", ["open", "closed", "locked"]).default("open").notNull(),
  isCurrent: boolean("isCurrent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FiscalYear = typeof fiscalYears.$inferSelect;
export type InsertFiscalYear = typeof fiscalYears.$inferInsert;

// ─── 93. Purchase Orders (PO) ───
export const purchaseOrders = mysqlTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: varchar("poNumber", { length: 50 }).notNull().unique(),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }).notNull(),
  purchaseRequestId: bigint("purchaseRequestId", { mode: "number", unsigned: true }),
  quoteId: bigint("quoteId", { mode: "number", unsigned: true }),
  orderDate: date("orderDate").notNull(),
  expectedDeliveryDate: date("expectedDeliveryDate"),
  deliveryAddress: text("deliveryAddress"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: decimal("vatAmount", { precision: 12, scale: 2 }),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0"),
  shippingCost: decimal("shippingCost", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "confirmed", "partially_received", "fully_received", "cancelled", "closed"]).default("draft").notNull(),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  notes: text("notes"),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ─── 94. Purchase Order Items ───
export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: bigint("purchaseOrderId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull().default("0.00"),
  receivedQuantity: int("receivedQuantity").default(0),
  total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

// ─── 95. RFQs (Request for Quotation) ───
export const rfqs = mysqlTable("rfqs", {
  id: serial("id").primaryKey(),
  rfqNumber: varchar("rfqNumber", { length: 50 }).notNull().unique(),
  purchaseRequestId: bigint("purchaseRequestId", { mode: "number", unsigned: true }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "sent", "bidding", "evaluated", "awarded", "cancelled"]).default("draft").notNull(),
  deadline: date("deadline"),
  deliveryTerms: text("deliveryTerms"),
  paymentTerms: text("paymentTerms"),
  notes: text("notes"),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type RFQ = typeof rfqs.$inferSelect;
export type InsertRFQ = typeof rfqs.$inferInsert;

// ─── 96. RFQ Items ───
export const rfqItems = mysqlTable("rfq_items", {
  id: serial("id").primaryKey(),
  rfqId: bigint("rfqId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  specifications: text("specifications"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RFQItem = typeof rfqItems.$inferSelect;
export type InsertRFQItem = typeof rfqItems.$inferInsert;

// ─── 97. RFQ Responses (Supplier Quotes) ───
export const rfqResponses = mysqlTable("rfq_responses", {
  id: serial("id").primaryKey(),
  rfqId: bigint("rfqId", { mode: "number", unsigned: true }).notNull(),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }).notNull(),
  unitPrice: varchar("unitPrice", { length: 50 }).notNull(),
  totalPrice: varchar("totalPrice", { length: 50 }).notNull(),
  deliveryDays: int("deliveryDays"),
  validityDays: int("validityDays").default(30),
  currency: varchar("currency", { length: 3 }).default("EGP"),
  notes: text("notes"),
  isWinner: boolean("isWinner").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type RFQResponse = typeof rfqResponses.$inferSelect;
export type InsertRFQResponse = typeof rfqResponses.$inferInsert;

// ─── 98. Goods Receipts ───
export const goodsReceipts = mysqlTable("goods_receipts", {
  id: serial("id").primaryKey(),
  grNumber: varchar("grNumber", { length: 50 }).notNull().unique(),
  purchaseOrderId: bigint("purchaseOrderId", { mode: "number", unsigned: true }).notNull(),
  supplierId: bigint("supplierId", { mode: "number", unsigned: true }).notNull(),
  receiptDate: date("receiptDate").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }),
  vatAmount: decimal("vatAmount", { precision: 12, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["pending_inspection", "partially_accepted", "fully_accepted", "rejected"]).default("pending_inspection").notNull(),
  notes: text("notes"),
  receivedBy: varchar("receivedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type GoodsReceipt = typeof goodsReceipts.$inferSelect;
export type InsertGoodsReceipt = typeof goodsReceipts.$inferInsert;

// ─── 99. Goods Receipt Items ───
export const goodsReceiptItems = mysqlTable("goods_receipt_items", {
  id: serial("id").primaryKey(),
  goodsReceiptId: bigint("goodsReceiptId", { mode: "number", unsigned: true }).notNull(),
  purchaseOrderItemId: bigint("purchaseOrderItemId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  orderedQuantity: int("orderedQuantity").notNull(),
  receivedQuantity: int("receivedQuantity").notNull(),
  acceptedQuantity: int("acceptedQuantity").default(0),
  rejectedQuantity: int("rejectedQuantity").default(0),
  rejectionReason: text("rejectionReason"),
  unitPrice: varchar("unitPrice", { length: 50 }),
  total: varchar("total", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GoodsReceiptItem = typeof goodsReceiptItems.$inferSelect;
export type InsertGoodsReceiptItem = typeof goodsReceiptItems.$inferInsert;

// ─── 100. Sales Pipeline Stages ───
export const salesPipelineStages = mysqlTable("sales_pipeline_stages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  order: int("stage_order").notNull(),
  color: varchar("color", { length: 20 }).default("#2c5282"),
  probability: decimal("probability", { precision: 5, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SalesPipelineStage = typeof salesPipelineStages.$inferSelect;
export type InsertSalesPipelineStage = typeof salesPipelineStages.$inferInsert;

// ─── 101. Sales Opportunities ───
export const salesOpportunities = mysqlTable("sales_opportunities", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  stageId: bigint("stageId", { mode: "number", unsigned: true }).notNull(),
  expectedValue: decimal("expectedValue", { precision: 12, scale: 2 }).notNull(),
  actualValue: decimal("actualValue", { precision: 12, scale: 2 }),
  probability: decimal("probability", { precision: 5, scale: 2 }).default("0"),
  expectedCloseDate: date("expectedCloseDate"),
  actualCloseDate: date("actualCloseDate"),
  source: varchar("source", { length: 50 }),
  assignedTo: bigint("assignedTo", { mode: "number", unsigned: true }),
  description: text("description"),
  status: mysqlEnum("status", ["open", "won", "lost", "on_hold"]).default("open").notNull(),
  lossReason: text("lossReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type SalesOpportunity = typeof salesOpportunities.$inferSelect;
export type InsertSalesOpportunity = typeof salesOpportunities.$inferInsert;

// ─── 102. Sales Commissions ───
export const salesCommissions = mysqlTable("sales_commissions", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true }).notNull(),
  salesOrderId: bigint("salesOrderId", { mode: "number", unsigned: true }),
  opportunityId: bigint("opportunityId", { mode: "number", unsigned: true }),
  commissionRate: varchar("commissionRate", { length: 20 }).notNull(),
  saleAmount: varchar("saleAmount", { length: 50 }).notNull(),
  commissionAmount: varchar("commissionAmount", { length: 50 }).notNull(),
  isPaid: boolean("isPaid").default(false).notNull(),
  paidAt: timestamp("paidAt"),
  period: varchar("period", { length: 10 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SalesCommission = typeof salesCommissions.$inferSelect;
export type InsertSalesCommission = typeof salesCommissions.$inferInsert;

// ─── 103. Shipments ───
export const shipments = mysqlTable("shipments", {
  id: serial("id").primaryKey(),
  trackingNumber: varchar("trackingNumber", { length: 100 }).notNull().unique(),
  salesOrderId: bigint("salesOrderId", { mode: "number", unsigned: true }).notNull(),
  customerId: bigint("customerId", { mode: "number", unsigned: true }).notNull(),
  carrier: varchar("carrier", { length: 100 }),
  shippingDate: date("shippingDate").notNull(),
  estimatedDeliveryDate: date("estimatedDeliveryDate"),
  actualDeliveryDate: date("actualDeliveryDate"),
  shippingAddress: text("shippingAddress"),
  shippingCost: decimal("shippingCost", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["pending", "picked", "in_transit", "out_for_delivery", "delivered", "returned", "cancelled"]).default("pending").notNull(),
  deliveryNotes: text("deliveryNotes"),
  recipientName: varchar("recipientName", { length: 255 }),
  recipientPhone: varchar("recipientPhone", { length: 50 }),
  signatureUrl: text("signatureUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

// ─── 104. Shipment Items ───
export const shipmentItems = mysqlTable("shipment_items", {
  id: serial("id").primaryKey(),
  shipmentId: bigint("shipmentId", { mode: "number", unsigned: true }).notNull(),
  salesOrderItemId: bigint("salesOrderItemId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ShipmentItem = typeof shipmentItems.$inferSelect;
export type InsertShipmentItem = typeof shipmentItems.$inferInsert;
