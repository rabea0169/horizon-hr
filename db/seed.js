var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/main.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var TIPS = [
      "\u25C8 encrypted .env [www.dotenvx.com]",
      "\u25C8 secrets for agents [www.dotenvx.com]",
      "\u2301 auth for agents [www.vestauth.com]",
      "\u2318 custom filepath { path: '/custom/path/.env' }",
      "\u2318 enable debugging { debug: true }",
      "\u2318 override existing { override: true }",
      "\u2318 suppress logs { quiet: true }",
      "\u2318 multiple files { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text2) {
      return supportsAnsi() ? `\x1B[2m${text2}\x1B[0m` : text2;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`\u26A0 ${message}`);
    }
    function _debug(message) {
      console.log(`\u2506 ${message}`);
    }
    function _log(message) {
      console.log(`\u25C7 ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("no encoding is specified (UTF-8 is used by default)");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/env-options.js"(exports2, module2) {
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module2.exports = options;
  }
});

// node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/lib/cli-options.js"(exports2, module2) {
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module2.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// api/queries/connection.ts
var import_mysql2 = require("drizzle-orm/mysql2");

// node_modules/.pnpm/dotenv@17.4.2/node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// api/lib/env.ts
var import_crypto = require("crypto");
function generateDevSecret() {
  const parts = [process.env.USERNAME || "", process.env.COMPUTERNAME || "", (0, import_crypto.randomBytes)(8).toString("hex")];
  return (0, import_crypto.createHash)("sha256").update(parts.join(":")).digest("hex");
}
function required(name) {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}
var env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  horizonJwtSecret: process.env.HORIZON_JWT_SECRET || process.env.APP_SECRET || generateDevSecret(),
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  adminUsername: process.env.HORIZON_ADMIN_USERNAME || "admin",
  adminPassword: process.env.HORIZON_ADMIN_PASSWORD || "admin123",
  supervisorPassword: process.env.HORIZON_SUPERVISOR_PASSWORD || "super123",
  accountantPassword: process.env.HORIZON_ACCOUNTANT_PASSWORD || "acc123",
  workerPassword: process.env.HORIZON_WORKER_PASSWORD || "work123"
};

// db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  activities: () => activities,
  advances: () => advances,
  agingBuckets: () => agingBuckets,
  attendance: () => attendance,
  auditLog: () => auditLog,
  bomRecords: () => bomRecords,
  bonusPenalties: () => bonusPenalties,
  bundleTracking: () => bundleTracking,
  bundles: () => bundles,
  buyerPortalUsers: () => buyerPortalUsers,
  candidates: () => candidates,
  challanItems: () => challanItems,
  challans: () => challans,
  companySettings: () => companySettings,
  costCalculations: () => costCalculations,
  creditLimits: () => creditLimits,
  crmCustomers: () => crmCustomers,
  crmInteractions: () => crmInteractions,
  customReports: () => customReports,
  cutPlans: () => cutPlans,
  cuttingOrders: () => cuttingOrders,
  dailyProduction: () => dailyProduction,
  defectTypes: () => defectTypes,
  deliveryReminders: () => deliveryReminders,
  departments: () => departments,
  designRevisions: () => designRevisions,
  employees: () => employees,
  expenseCategories: () => expenseCategories,
  expenses: () => expenses,
  fabricRolls: () => fabricRolls,
  finishedGoods: () => finishedGoods,
  fiscalYears: () => fiscalYears,
  generalLedger: () => generalLedger,
  goodsReceiptItems: () => goodsReceiptItems,
  goodsReceipts: () => goodsReceipts,
  grns: () => grns,
  integrationLogs: () => integrationLogs,
  inventoryItems: () => inventoryItems,
  inventoryTransactions: () => inventoryTransactions,
  jobPostings: () => jobPostings,
  journalVoucherLines: () => journalVoucherLines,
  journalVouchers: () => journalVouchers,
  leaves: () => leaves,
  lineBalancing: () => lineBalancing,
  machineDepreciation: () => machineDepreciation,
  machines: () => machines,
  maintenanceRecords: () => maintenanceRecords,
  markerPlans: () => markerPlans,
  modelStages: () => modelStages,
  mrpRecords: () => mrpRecords,
  openingBalances: () => openingBalances,
  orderAmendments: () => orderAmendments,
  paymentVouchers: () => paymentVouchers,
  payrollRecords: () => payrollRecords,
  performanceReviews: () => performanceReviews,
  pieceRateRecords: () => pieceRateRecords,
  printSettings: () => printSettings,
  productLifecycle: () => productLifecycle,
  productionForecasts: () => productionForecasts,
  productionLines: () => productionLines,
  productionModels: () => productionModels,
  productionOrders: () => productionOrders,
  purchaseInvoices: () => purchaseInvoices,
  purchaseOrderItems: () => purchaseOrderItems,
  purchaseOrders: () => purchaseOrders,
  purchaseRequestItems: () => purchaseRequestItems,
  purchaseRequests: () => purchaseRequests,
  qcRecords: () => qcRecords,
  quotationItems: () => quotationItems,
  quotations: () => quotations,
  receiptVouchers: () => receiptVouchers,
  reorderRules: () => reorderRules,
  reportTemplates: () => reportTemplates,
  rfqItems: () => rfqItems,
  rfqResponses: () => rfqResponses,
  rfqs: () => rfqs,
  salesCommissions: () => salesCommissions,
  salesInvoices: () => salesInvoices,
  salesOpportunities: () => salesOpportunities,
  salesOrders: () => salesOrders,
  salesPipelineStages: () => salesPipelineStages,
  salesRepOrders: () => salesRepOrders,
  salesRepVisits: () => salesRepVisits,
  samRecords: () => samRecords,
  sampleReviews: () => sampleReviews,
  shiftAssignments: () => shiftAssignments,
  shifts: () => shifts,
  shipmentItems: () => shipmentItems,
  shipments: () => shipments,
  styleColorSizeMatrix: () => styleColorSizeMatrix,
  subcontracts: () => subcontracts,
  suppliers: () => suppliers,
  supplyOrderItems: () => supplyOrderItems,
  supplyOrders: () => supplyOrders,
  systemSettings: () => systemSettings,
  techPacks: () => techPacks,
  treasuryAccounts: () => treasuryAccounts,
  treasuryTransactions: () => treasuryTransactions,
  users: () => users,
  warehouseBins: () => warehouseBins,
  warehouses: () => warehouses,
  wastageRecords: () => wastageRecords,
  workOrders: () => workOrders
});
var import_mysql_core = require("drizzle-orm/mysql-core");
var users = (0, import_mysql_core.mysqlTable)("users", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  unionId: (0, import_mysql_core.varchar)("unionId", { length: 255 }).notNull().unique(),
  name: (0, import_mysql_core.varchar)("name", { length: 255 }),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  avatar: (0, import_mysql_core.text)("avatar"),
  role: (0, import_mysql_core.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  lastSignInAt: (0, import_mysql_core.timestamp)("lastSignInAt").defaultNow().notNull()
});
var departments = (0, import_mysql_core.mysqlTable)("departments", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 100 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  color: (0, import_mysql_core.varchar)("color", { length: 7 }).default("#4A2C3F"),
  managerId: (0, import_mysql_core.bigint)("managerId", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var employees = (0, import_mysql_core.mysqlTable)("employees", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeCode: (0, import_mysql_core.varchar)("employeeCode", { length: 20 }).notNull().unique(),
  fullName: (0, import_mysql_core.varchar)("fullName", { length: 255 }).notNull(),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }).notNull(),
  phone: (0, import_mysql_core.varchar)("phone", { length: 30 }),
  avatar: (0, import_mysql_core.text)("avatar"),
  departmentId: (0, import_mysql_core.bigint)("departmentId", { mode: "number", unsigned: true }),
  role: (0, import_mysql_core.varchar)("role", { length: 100 }).notNull(),
  jobTitle: (0, import_mysql_core.varchar)("jobTitle", { length: 150 }).notNull(),
  managerId: (0, import_mysql_core.bigint)("managerId", { mode: "number", unsigned: true }),
  joinDate: (0, import_mysql_core.date)("joinDate").notNull(),
  salary: (0, import_mysql_core.decimal)("salary", { precision: 12, scale: 2 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "on_leave", "inactive", "terminated"]).default("active").notNull(),
  employmentType: (0, import_mysql_core.mysqlEnum)("employmentType", ["full_time", "part_time", "contract", "intern"]).default("full_time").notNull(),
  salaryType: (0, import_mysql_core.mysqlEnum)("salaryType", ["monthly", "piece_rate", "mixed"]).default("monthly").notNull(),
  passwordHash: (0, import_mysql_core.varchar)("passwordHash", { length: 255 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
}, (table) => ({
  deptIdx: (0, import_mysql_core.index)("idx_employees_department_id").on(table.departmentId),
  statusIdx: (0, import_mysql_core.index)("idx_employees_status").on(table.status)
}));
var attendance = (0, import_mysql_core.mysqlTable)("attendance", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  date: (0, import_mysql_core.date)("date").notNull(),
  checkIn: (0, import_mysql_core.timestamp)("checkIn"),
  checkOut: (0, import_mysql_core.timestamp)("checkOut"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["present", "late", "absent", "on_leave", "half_day"]).default("present").notNull(),
  hoursWorked: (0, import_mysql_core.decimal)("hoursWorked", { precision: 4, scale: 2 }),
  notes: (0, import_mysql_core.text)("notes"),
  isManual: (0, import_mysql_core.boolean)("isManual").default(false),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
}, (table) => ({
  empIdx: (0, import_mysql_core.index)("idx_attendance_employee_id").on(table.employeeId),
  dateIdx: (0, import_mysql_core.index)("idx_attendance_date").on(table.date)
}));
var leaves = (0, import_mysql_core.mysqlTable)("leaves", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  leaveType: (0, import_mysql_core.mysqlEnum)("leaveType", ["annual", "sick", "maternity", "paternity", "unpaid", "emergency", "bereavement"]).default("annual").notNull(),
  startDate: (0, import_mysql_core.date)("startDate").notNull(),
  endDate: (0, import_mysql_core.date)("endDate").notNull(),
  days: (0, import_mysql_core.int)("days").notNull(),
  reason: (0, import_mysql_core.text)("reason"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: (0, import_mysql_core.timestamp)("approvedAt"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
}, (table) => ({
  empIdx: (0, import_mysql_core.index)("idx_leaves_employee_id").on(table.employeeId),
  statusIdx: (0, import_mysql_core.index)("idx_leaves_status").on(table.status)
}));
var performanceReviews = (0, import_mysql_core.mysqlTable)("performance_reviews", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  reviewerId: (0, import_mysql_core.bigint)("reviewerId", { mode: "number", unsigned: true }).notNull(),
  period: (0, import_mysql_core.varchar)("period", { length: 20 }).notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  overallRating: (0, import_mysql_core.int)("overallRating"),
  communication: (0, import_mysql_core.int)("communication"),
  teamwork: (0, import_mysql_core.int)("teamwork"),
  productivity: (0, import_mysql_core.int)("productivity"),
  punctuality: (0, import_mysql_core.int)("punctuality"),
  goals: (0, import_mysql_core.text)("goals"),
  comments: (0, import_mysql_core.text)("comments"),
  completedAt: (0, import_mysql_core.timestamp)("completedAt"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var jobPostings = (0, import_mysql_core.mysqlTable)("job_postings", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  title: (0, import_mysql_core.varchar)("title", { length: 200 }).notNull(),
  departmentId: (0, import_mysql_core.bigint)("departmentId", { mode: "number", unsigned: true }),
  description: (0, import_mysql_core.text)("description"),
  requirements: (0, import_mysql_core.text)("requirements"),
  salaryRange: (0, import_mysql_core.varchar)("salaryRange", { length: 100 }),
  location: (0, import_mysql_core.varchar)("location", { length: 100 }),
  employmentType: (0, import_mysql_core.mysqlEnum)("employmentType", ["full_time", "part_time", "contract", "intern"]).default("full_time").notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["open", "paused", "closed"]).default("open").notNull(),
  postedBy: (0, import_mysql_core.bigint)("postedBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var candidates = (0, import_mysql_core.mysqlTable)("candidates", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  jobPostingId: (0, import_mysql_core.bigint)("jobPostingId", { mode: "number", unsigned: true }).notNull(),
  fullName: (0, import_mysql_core.varchar)("fullName", { length: 255 }).notNull(),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }).notNull(),
  phone: (0, import_mysql_core.varchar)("phone", { length: 30 }),
  resumeUrl: (0, import_mysql_core.text)("resumeUrl"),
  stage: (0, import_mysql_core.mysqlEnum)("stage", ["applied", "screening", "interview", "offer", "hired", "rejected"]).default("applied").notNull(),
  rating: (0, import_mysql_core.int)("rating"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var payrollRecords = (0, import_mysql_core.mysqlTable)("payroll_records", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  month: (0, import_mysql_core.varchar)("month", { length: 7 }).notNull(),
  basicSalary: (0, import_mysql_core.decimal)("basicSalary", { precision: 12, scale: 2 }).notNull(),
  bonus: (0, import_mysql_core.decimal)("bonus", { precision: 12, scale: 2 }).default("0"),
  deductions: (0, import_mysql_core.decimal)("deductions", { precision: 12, scale: 2 }).default("0"),
  netPay: (0, import_mysql_core.decimal)("netPay", { precision: 12, scale: 2 }).notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["processed", "pending", "on_hold"]).default("pending").notNull(),
  processedAt: (0, import_mysql_core.timestamp)("processedAt"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
}, (table) => ({
  empIdx: (0, import_mysql_core.index)("idx_payroll_employee_id").on(table.employeeId),
  monthIdx: (0, import_mysql_core.index)("idx_payroll_month").on(table.month)
}));
var shifts = (0, import_mysql_core.mysqlTable)("shifts", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 100 }).notNull(),
  startTime: (0, import_mysql_core.varchar)("startTime", { length: 5 }).notNull(),
  endTime: (0, import_mysql_core.varchar)("endTime", { length: 5 }).notNull(),
  daysOfWeek: (0, import_mysql_core.varchar)("daysOfWeek", { length: 20 }).notNull(),
  gracePeriod: (0, import_mysql_core.int)("gracePeriod").default(15),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var shiftAssignments = (0, import_mysql_core.mysqlTable)("shift_assignments", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  shiftId: (0, import_mysql_core.bigint)("shiftId", { mode: "number", unsigned: true }).notNull(),
  startDate: (0, import_mysql_core.date)("startDate").notNull(),
  endDate: (0, import_mysql_core.date)("endDate"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var advances = (0, import_mysql_core.mysqlTable)("advances", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  amount: (0, import_mysql_core.decimal)("amount", { precision: 12, scale: 2 }).notNull(),
  reason: (0, import_mysql_core.text)("reason"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "approved", "rejected", "repaid"]).default("pending").notNull(),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: (0, import_mysql_core.timestamp)("approvedAt"),
  repaymentAmount: (0, import_mysql_core.decimal)("repaymentAmount", { precision: 12, scale: 2 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var bonusPenalties = (0, import_mysql_core.mysqlTable)("bonus_penalties", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  type: (0, import_mysql_core.mysqlEnum)("type", ["bonus", "penalty"]).notNull(),
  category: (0, import_mysql_core.varchar)("category", { length: 50 }).notNull(),
  amount: (0, import_mysql_core.decimal)("amount", { precision: 12, scale: 2 }).notNull(),
  reason: (0, import_mysql_core.text)("reason"),
  month: (0, import_mysql_core.varchar)("month", { length: 7 }).notNull(),
  appliedBy: (0, import_mysql_core.bigint)("appliedBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var productionLines = (0, import_mysql_core.mysqlTable)("production_lines", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 150 }).notNull(),
  lineType: (0, import_mysql_core.mysqlEnum)("lineType", ["sewing", "cutting", "ironing", "packing", "finishing"]).default("sewing").notNull(),
  supervisorId: (0, import_mysql_core.bigint)("supervisorId", { mode: "number", unsigned: true }),
  capacity: (0, import_mysql_core.int)("capacity").default(0),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var productionOrders = (0, import_mysql_core.mysqlTable)("production_orders", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  orderCode: (0, import_mysql_core.varchar)("orderCode", { length: 50 }).notNull().unique(),
  styleName: (0, import_mysql_core.varchar)("styleName", { length: 200 }).notNull(),
  customerName: (0, import_mysql_core.varchar)("customerName", { length: 200 }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  completed: (0, import_mysql_core.int)("completed").default(0),
  defected: (0, import_mysql_core.int)("defected").default(0),
  lineId: (0, import_mysql_core.bigint)("lineId", { mode: "number", unsigned: true }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  startDate: (0, import_mysql_core.date)("startDate"),
  endDate: (0, import_mysql_core.date)("endDate"),
  priority: (0, import_mysql_core.mysqlEnum)("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
}, (table) => ({
  lineIdx: (0, import_mysql_core.index)("idx_prod_orders_line_id").on(table.lineId),
  statusIdx: (0, import_mysql_core.index)("idx_prod_orders_status").on(table.status)
}));
var dailyProduction = (0, import_mysql_core.mysqlTable)("daily_production", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  lineId: (0, import_mysql_core.bigint)("lineId", { mode: "number", unsigned: true }).notNull(),
  orderId: (0, import_mysql_core.bigint)("orderId", { mode: "number", unsigned: true }),
  date: (0, import_mysql_core.date)("date").notNull(),
  produced: (0, import_mysql_core.int)("produced").default(0),
  defected: (0, import_mysql_core.int)("defected").default(0),
  reworked: (0, import_mysql_core.int)("reworked").default(0),
  workersCount: (0, import_mysql_core.int)("workersCount").default(0),
  hoursWorked: (0, import_mysql_core.decimal)("hoursWorked", { precision: 4, scale: 2 }),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
}, (table) => ({
  lineIdx: (0, import_mysql_core.index)("idx_daily_prod_line_id").on(table.lineId),
  dateIdx: (0, import_mysql_core.index)("idx_daily_prod_date").on(table.date)
}));
var productionModels = (0, import_mysql_core.mysqlTable)("production_models", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelCode: (0, import_mysql_core.varchar)("modelCode", { length: 50 }).notNull().unique(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  category: (0, import_mysql_core.varchar)("category", { length: 100 }),
  baseImage: (0, import_mysql_core.text)("baseImage"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive", "draft"]).default("active").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var modelStages = (0, import_mysql_core.mysqlTable)("model_stages", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  name: (0, import_mysql_core.varchar)("name", { length: 100 }).notNull(),
  sequence: (0, import_mysql_core.int)("sequence").notNull(),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }).default("0"),
  description: (0, import_mysql_core.text)("description"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var pieceRateRecords = (0, import_mysql_core.mysqlTable)("piece_rate_records", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  stageId: (0, import_mysql_core.bigint)("stageId", { mode: "number", unsigned: true }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }).notNull(),
  date: (0, import_mysql_core.date)("date").notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var machines = (0, import_mysql_core.mysqlTable)("machines", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  machineCode: (0, import_mysql_core.varchar)("machineCode", { length: 50 }).notNull().unique(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  type: (0, import_mysql_core.varchar)("type", { length: 100 }).notNull(),
  brand: (0, import_mysql_core.varchar)("brand", { length: 100 }),
  model: (0, import_mysql_core.varchar)("model", { length: 100 }),
  serialNumber: (0, import_mysql_core.varchar)("serialNumber", { length: 100 }),
  lineId: (0, import_mysql_core.bigint)("lineId", { mode: "number", unsigned: true }),
  purchaseDate: (0, import_mysql_core.date)("purchaseDate"),
  cost: (0, import_mysql_core.decimal)("cost", { precision: 12, scale: 2 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["operational", "maintenance", "broken", "idle"]).default("operational").notNull(),
  nextMaintenance: (0, import_mysql_core.date)("nextMaintenance"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var inventoryItems = (0, import_mysql_core.mysqlTable)("inventory_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  sku: (0, import_mysql_core.varchar)("sku", { length: 50 }).notNull().unique(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  category: (0, import_mysql_core.varchar)("category", { length: 100 }).notNull(),
  unit: (0, import_mysql_core.varchar)("unit", { length: 20 }).notNull(),
  quantity: (0, import_mysql_core.int)("quantity").default(0),
  minStock: (0, import_mysql_core.int)("minStock").default(0),
  reorderPoint: (0, import_mysql_core.int)("reorderPoint").default(0),
  unitCost: (0, import_mysql_core.decimal)("unitCost", { precision: 10, scale: 2 }),
  location: (0, import_mysql_core.varchar)("location", { length: 100 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["in_stock", "low_stock", "out_of_stock"]).default("in_stock").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var inventoryTransactions = (0, import_mysql_core.mysqlTable)("inventory_transactions", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  type: (0, import_mysql_core.mysqlEnum)("type", ["in", "out", "adjustment", "transfer"]).notNull(),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  referenceType: (0, import_mysql_core.varchar)("referenceType", { length: 50 }),
  referenceId: (0, import_mysql_core.bigint)("referenceId", { mode: "number", unsigned: true }),
  notes: (0, import_mysql_core.text)("notes"),
  createdBy: (0, import_mysql_core.bigint)("createdBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
}, (table) => ({
  itemIdx: (0, import_mysql_core.index)("idx_inv_tx_item_id").on(table.itemId),
  typeIdx: (0, import_mysql_core.index)("idx_inv_tx_type").on(table.type)
}));
var suppliers = (0, import_mysql_core.mysqlTable)("suppliers", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  contactPerson: (0, import_mysql_core.varchar)("contactPerson", { length: 200 }),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  phone: (0, import_mysql_core.varchar)("phone", { length: 30 }),
  address: (0, import_mysql_core.text)("address"),
  taxNumber: (0, import_mysql_core.varchar)("taxNumber", { length: 50 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive"]).default("active").notNull(),
  rating: (0, import_mysql_core.int)("rating"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var supplyOrders = (0, import_mysql_core.mysqlTable)("supply_orders", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  orderNumber: (0, import_mysql_core.varchar)("orderNumber", { length: 50 }).notNull().unique(),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }).notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "sent", "partial", "received", "cancelled"]).default("draft").notNull(),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }),
  expectedDate: (0, import_mysql_core.date)("expectedDate"),
  receivedDate: (0, import_mysql_core.date)("receivedDate"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var supplyOrderItems = (0, import_mysql_core.mysqlTable)("supply_order_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  supplyOrderId: (0, import_mysql_core.bigint)("supplyOrderId", { mode: "number", unsigned: true }).notNull(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }).notNull(),
  receivedQuantity: (0, import_mysql_core.int)("receivedQuantity").default(0),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var cuttingOrders = (0, import_mysql_core.mysqlTable)("cutting_orders", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  orderNumber: (0, import_mysql_core.varchar)("orderNumber", { length: 50 }).notNull().unique(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  fabricDescription: (0, import_mysql_core.text)("fabricDescription"),
  color: (0, import_mysql_core.varchar)("color", { length: 100 }),
  size: (0, import_mysql_core.varchar)("size", { length: 50 }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  cutQuantity: (0, import_mysql_core.int)("cutQuantity").default(0),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "cutting", "completed", "cancelled"]).default("pending").notNull(),
  assignedTo: (0, import_mysql_core.bigint)("assignedTo", { mode: "number", unsigned: true }),
  dueDate: (0, import_mysql_core.date)("dueDate"),
  completedDate: (0, import_mysql_core.date)("completedDate"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var workOrders = (0, import_mysql_core.mysqlTable)("work_orders", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  orderNumber: (0, import_mysql_core.varchar)("orderNumber", { length: 50 }).notNull().unique(),
  productionOrderId: (0, import_mysql_core.bigint)("productionOrderId", { mode: "number", unsigned: true }),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  lineId: (0, import_mysql_core.bigint)("lineId", { mode: "number", unsigned: true }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  completed: (0, import_mysql_core.int)("completed").default(0),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  priority: (0, import_mysql_core.mysqlEnum)("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  startDate: (0, import_mysql_core.date)("startDate"),
  endDate: (0, import_mysql_core.date)("endDate"),
  completedStages: (0, import_mysql_core.text)("completedStages"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var bundles = (0, import_mysql_core.mysqlTable)("bundles", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  bundleCode: (0, import_mysql_core.varchar)("bundleCode", { length: 100 }).notNull().unique(),
  qrCode: (0, import_mysql_core.text)("qrCode"),
  workOrderId: (0, import_mysql_core.bigint)("workOrderId", { mode: "number", unsigned: true }),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  size: (0, import_mysql_core.varchar)("size", { length: 20 }),
  color: (0, import_mysql_core.varchar)("color", { length: 50 }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  currentStage: (0, import_mysql_core.varchar)("currentStage", { length: 100 }),
  currentLineId: (0, import_mysql_core.bigint)("currentLineId", { mode: "number", unsigned: true }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["cutting", "sewing", "ironing", "qc", "packed", "shipped"]).default("cutting").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
}, (table) => ({
  woIdx: (0, import_mysql_core.index)("idx_bundles_work_order_id").on(table.workOrderId),
  statusIdx: (0, import_mysql_core.index)("idx_bundles_status").on(table.status)
}));
var bundleTracking = (0, import_mysql_core.mysqlTable)("bundle_tracking", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  bundleId: (0, import_mysql_core.bigint)("bundleId", { mode: "number", unsigned: true }).notNull(),
  stage: (0, import_mysql_core.varchar)("stage", { length: 100 }).notNull(),
  lineId: (0, import_mysql_core.bigint)("lineId", { mode: "number", unsigned: true }),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }),
  scannedAt: (0, import_mysql_core.timestamp)("scannedAt").defaultNow().notNull(),
  notes: (0, import_mysql_core.text)("notes")
});
var bomRecords = (0, import_mysql_core.mysqlTable)("bom_records", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: (0, import_mysql_core.decimal)("quantity", { precision: 10, scale: 3 }).notNull(),
  wastagePercent: (0, import_mysql_core.decimal)("wastagePercent", { precision: 5, scale: 2 }).default("5"),
  unit: (0, import_mysql_core.varchar)("unit", { length: 20 }).notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var qcRecords = (0, import_mysql_core.mysqlTable)("qc_records", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  orderId: (0, import_mysql_core.bigint)("orderId", { mode: "number", unsigned: true }),
  bundleId: (0, import_mysql_core.bigint)("bundleId", { mode: "number", unsigned: true }),
  stage: (0, import_mysql_core.mysqlEnum)("stage", ["inline", "input", "output", "final", "packing"]).notNull(),
  checkedQuantity: (0, import_mysql_core.int)("checkedQuantity").notNull(),
  passedQuantity: (0, import_mysql_core.int)("passedQuantity").default(0),
  defectedQuantity: (0, import_mysql_core.int)("defectedQuantity").default(0),
  defects: (0, import_mysql_core.text)("defects"),
  inspectedBy: (0, import_mysql_core.bigint)("inspectedBy", { mode: "number", unsigned: true }),
  date: (0, import_mysql_core.date)("date").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var mrpRecords = (0, import_mysql_core.mysqlTable)("mrp_records", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  productionOrderId: (0, import_mysql_core.bigint)("productionOrderId", { mode: "number", unsigned: true }).notNull(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  requiredQuantity: (0, import_mysql_core.int)("requiredQuantity").notNull(),
  availableQuantity: (0, import_mysql_core.int)("availableQuantity").default(0),
  shortage: (0, import_mysql_core.int)("shortage").default(0),
  status: (0, import_mysql_core.mysqlEnum)("status", ["planned", "ordered", "available", "shortage"]).default("planned").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var challans = (0, import_mysql_core.mysqlTable)("challans", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  challanNumber: (0, import_mysql_core.varchar)("challanNumber", { length: 50 }).notNull().unique(),
  type: (0, import_mysql_core.mysqlEnum)("type", ["dispatch", "return"]).default("dispatch").notNull(),
  customerName: (0, import_mysql_core.varchar)("customerName", { length: 200 }),
  orderId: (0, import_mysql_core.bigint)("orderId", { mode: "number", unsigned: true }),
  totalItems: (0, import_mysql_core.int)("totalItems").default(0),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "ready", "shipped", "delivered", "returned"]).default("draft").notNull(),
  vehicleNumber: (0, import_mysql_core.varchar)("vehicleNumber", { length: 50 }),
  driverName: (0, import_mysql_core.varchar)("driverName", { length: 200 }),
  shippedAt: (0, import_mysql_core.timestamp)("shippedAt"),
  deliveredAt: (0, import_mysql_core.timestamp)("deliveredAt"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var challanItems = (0, import_mysql_core.mysqlTable)("challan_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  challanId: (0, import_mysql_core.bigint)("challanId", { mode: "number", unsigned: true }).notNull(),
  bundleId: (0, import_mysql_core.bigint)("bundleId", { mode: "number", unsigned: true }),
  description: (0, import_mysql_core.varchar)("description", { length: 200 }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var subcontracts = (0, import_mysql_core.mysqlTable)("subcontracts", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  contractNumber: (0, import_mysql_core.varchar)("contractNumber", { length: 50 }).notNull().unique(),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }).notNull(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }),
  description: (0, import_mysql_core.text)("description"),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  receivedQuantity: (0, import_mysql_core.int)("receivedQuantity").default(0),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  startDate: (0, import_mysql_core.date)("startDate"),
  endDate: (0, import_mysql_core.date)("endDate"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var salesOrders = (0, import_mysql_core.mysqlTable)("sales_orders", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  orderNumber: (0, import_mysql_core.varchar)("orderNumber", { length: 50 }).notNull().unique(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }).notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "confirmed", "in_production", "ready", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  orderDate: (0, import_mysql_core.date)("orderDate").notNull(),
  deliveryDate: (0, import_mysql_core.date)("deliveryDate"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
}, (table) => ({
  custIdx: (0, import_mysql_core.index)("idx_sales_orders_customer_id").on(table.customerId),
  statusIdx: (0, import_mysql_core.index)("idx_sales_orders_status").on(table.status)
}));
var crmCustomers = (0, import_mysql_core.mysqlTable)("crm_customers", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  contactPerson: (0, import_mysql_core.varchar)("contactPerson", { length: 200 }),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  phone: (0, import_mysql_core.varchar)("phone", { length: 30 }),
  address: (0, import_mysql_core.text)("address"),
  city: (0, import_mysql_core.varchar)("city", { length: 100 }),
  country: (0, import_mysql_core.varchar)("country", { length: 100 }).default("Egypt"),
  customerType: (0, import_mysql_core.mysqlEnum)("customerType", ["wholesale", "retail", "corporate", "export"]).default("wholesale").notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive", "prospect"]).default("active").notNull(),
  rating: (0, import_mysql_core.int)("rating"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var crmInteractions = (0, import_mysql_core.mysqlTable)("crm_interactions", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  type: (0, import_mysql_core.mysqlEnum)("type", ["call", "email", "meeting", "visit", "note"]).notNull(),
  subject: (0, import_mysql_core.varchar)("subject", { length: 200 }),
  content: (0, import_mysql_core.text)("content"),
  followUpDate: (0, import_mysql_core.date)("followUpDate"),
  createdBy: (0, import_mysql_core.bigint)("createdBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var costCalculations = (0, import_mysql_core.mysqlTable)("cost_calculations", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  fabricCost: (0, import_mysql_core.decimal)("fabricCost", { precision: 12, scale: 2 }).default("0"),
  laborCost: (0, import_mysql_core.decimal)("laborCost", { precision: 12, scale: 2 }).default("0"),
  overheadCost: (0, import_mysql_core.decimal)("overheadCost", { precision: 12, scale: 2 }).default("0"),
  trimCost: (0, import_mysql_core.decimal)("trimCost", { precision: 12, scale: 2 }).default("0"),
  otherCost: (0, import_mysql_core.decimal)("otherCost", { precision: 12, scale: 2 }).default("0"),
  totalCost: (0, import_mysql_core.decimal)("totalCost", { precision: 12, scale: 2 }).notNull(),
  profitMargin: (0, import_mysql_core.decimal)("profitMargin", { precision: 5, scale: 2 }).default("20"),
  sellingPrice: (0, import_mysql_core.decimal)("sellingPrice", { precision: 12, scale: 2 }).notNull(),
  minOrderQuantity: (0, import_mysql_core.int)("minOrderQuantity").default(100),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var printSettings = (0, import_mysql_core.mysqlTable)("print_settings", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  companyName: (0, import_mysql_core.varchar)("companyName", { length: 200 }),
  companyLogo: (0, import_mysql_core.text)("companyLogo"),
  address: (0, import_mysql_core.text)("address"),
  phone: (0, import_mysql_core.varchar)("phone", { length: 50 }),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  taxNumber: (0, import_mysql_core.varchar)("taxNumber", { length: 50 }),
  headerText: (0, import_mysql_core.text)("headerText"),
  footerText: (0, import_mysql_core.text)("footerText"),
  paperSize: (0, import_mysql_core.mysqlEnum)("paperSize", ["a4", "a5", "letter"]).default("a4").notNull(),
  orientation: (0, import_mysql_core.mysqlEnum)("orientation", ["portrait", "landscape"]).default("portrait").notNull(),
  showLogo: (0, import_mysql_core.boolean)("showLogo").default(true),
  showSignature: (0, import_mysql_core.boolean)("showSignature").default(true),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var activities = (0, import_mysql_core.mysqlTable)("activities", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  userId: (0, import_mysql_core.bigint)("userId", { mode: "number", unsigned: true }),
  userName: (0, import_mysql_core.varchar)("userName", { length: 255 }),
  action: (0, import_mysql_core.varchar)("action", { length: 100 }).notNull(),
  entityType: (0, import_mysql_core.varchar)("entityType", { length: 50 }).notNull(),
  entityId: (0, import_mysql_core.bigint)("entityId", { mode: "number", unsigned: true }),
  description: (0, import_mysql_core.text)("description"),
  ipAddress: (0, import_mysql_core.varchar)("ipAddress", { length: 45 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var systemSettings = (0, import_mysql_core.mysqlTable)("system_settings", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  key: (0, import_mysql_core.varchar)("key", { length: 100 }).notNull().unique(),
  value: (0, import_mysql_core.text)("value"),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var styleColorSizeMatrix = (0, import_mysql_core.mysqlTable)("style_color_size_matrix", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  styleCode: (0, import_mysql_core.varchar)("styleCode", { length: 50 }).notNull(),
  color: (0, import_mysql_core.varchar)("color", { length: 50 }).notNull(),
  colorCode: (0, import_mysql_core.varchar)("colorCode", { length: 20 }),
  size: (0, import_mysql_core.varchar)("size", { length: 20 }).notNull(),
  sizeOrder: (0, import_mysql_core.int)("sizeOrder").default(0),
  quantity: (0, import_mysql_core.int)("quantity").default(0),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }),
  barcode: (0, import_mysql_core.varchar)("barcode", { length: 100 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive", "discontinued"]).default("active").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var fabricRolls = (0, import_mysql_core.mysqlTable)("fabric_rolls", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  rollNumber: (0, import_mysql_core.varchar)("rollNumber", { length: 50 }).notNull().unique(),
  lotNumber: (0, import_mysql_core.varchar)("lotNumber", { length: 50 }).notNull(),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }).notNull(),
  fabricType: (0, import_mysql_core.varchar)("fabricType", { length: 100 }).notNull(),
  fabricCode: (0, import_mysql_core.varchar)("fabricCode", { length: 50 }),
  color: (0, import_mysql_core.varchar)("color", { length: 50 }),
  width: (0, import_mysql_core.decimal)("width", { precision: 6, scale: 2 }),
  length: (0, import_mysql_core.decimal)("length", { precision: 8, scale: 2 }),
  weight: (0, import_mysql_core.decimal)("weight", { precision: 8, scale: 2 }),
  unit: (0, import_mysql_core.varchar)("unit", { length: 10 }).default("meter"),
  shrinkagePercent: (0, import_mysql_core.decimal)("shrinkagePercent", { precision: 5, scale: 2 }).default("2"),
  shade: (0, import_mysql_core.varchar)("shade", { length: 20 }),
  receivedDate: (0, import_mysql_core.date)("receivedDate").notNull(),
  location: (0, import_mysql_core.varchar)("location", { length: 100 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["available", "in_use", "finished", "rejected", "quarantine"]).default("available").notNull(),
  qualityGrade: (0, import_mysql_core.mysqlEnum)("qualityGrade", ["a", "b", "c"]).default("a"),
  inspectionNotes: (0, import_mysql_core.text)("inspectionNotes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var cutPlans = (0, import_mysql_core.mysqlTable)("cut_plans", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  planNumber: (0, import_mysql_core.varchar)("planNumber", { length: 50 }).notNull().unique(),
  orderId: (0, import_mysql_core.bigint)("orderId", { mode: "number", unsigned: true }).notNull(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  layCount: (0, import_mysql_core.int)("layCount").default(1),
  plyHeight: (0, import_mysql_core.int)("plyHeight").default(0),
  spreadType: (0, import_mysql_core.mysqlEnum)("spreadType", ["face_up", "face_down", "nap", "tubular"]).default("face_up"),
  totalPieces: (0, import_mysql_core.int)("totalPieces").default(0),
  plannedDate: (0, import_mysql_core.date)("plannedDate"),
  completedDate: (0, import_mysql_core.date)("completedDate"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["planned", "spreading", "cutting", "completed", "cancelled"]).default("planned").notNull(),
  efficiency: (0, import_mysql_core.decimal)("efficiency", { precision: 5, scale: 2 }),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var markerPlans = (0, import_mysql_core.mysqlTable)("marker_plans", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  markerNumber: (0, import_mysql_core.varchar)("markerNumber", { length: 50 }).notNull().unique(),
  cutPlanId: (0, import_mysql_core.bigint)("cutPlanId", { mode: "number", unsigned: true }).notNull(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  markerLength: (0, import_mysql_core.decimal)("markerLength", { precision: 8, scale: 2 }),
  markerWidth: (0, import_mysql_core.decimal)("markerWidth", { precision: 6, scale: 2 }),
  fabricUtilization: (0, import_mysql_core.decimal)("fabricUtilization", { precision: 5, scale: 2 }),
  piecesPerMarker: (0, import_mysql_core.int)("piecesPerMarker").default(0),
  sizeRatio: (0, import_mysql_core.varchar)("sizeRatio", { length: 50 }),
  markerImage: (0, import_mysql_core.text)("markerImage"),
  cadFile: (0, import_mysql_core.text)("cadFile"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "approved", "in_use", "archived"]).default("draft").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var samRecords = (0, import_mysql_core.mysqlTable)("sam_records", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  operationName: (0, import_mysql_core.varchar)("operationName", { length: 200 }).notNull(),
  operationCode: (0, import_mysql_core.varchar)("operationCode", { length: 50 }),
  stageId: (0, import_mysql_core.bigint)("stageId", { mode: "number", unsigned: true }),
  samMinutes: (0, import_mysql_core.decimal)("samMinutes", { precision: 6, scale: 3 }).notNull(),
  machineType: (0, import_mysql_core.varchar)("machineType", { length: 100 }),
  difficulty: (0, import_mysql_core.mysqlEnum)("difficulty", ["low", "medium", "high"]).default("medium"),
  allowancePercent: (0, import_mysql_core.decimal)("allowancePercent", { precision: 5, scale: 2 }).default("15"),
  targetPerHour: (0, import_mysql_core.int)("targetPerHour"),
  effectiveSam: (0, import_mysql_core.decimal)("effectiveSam", { precision: 6, scale: 3 }),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var lineBalancing = (0, import_mysql_core.mysqlTable)("line_balancing", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  lineId: (0, import_mysql_core.bigint)("lineId", { mode: "number", unsigned: true }).notNull(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  operationSequence: (0, import_mysql_core.int)("operationSequence").notNull(),
  operationName: (0, import_mysql_core.varchar)("operationName", { length: 200 }).notNull(),
  samMinutes: (0, import_mysql_core.decimal)("samMinutes", { precision: 6, scale: 3 }).notNull(),
  workstations: (0, import_mysql_core.int)("workstations").default(1),
  operators: (0, import_mysql_core.int)("operators").default(1),
  targetOutput: (0, import_mysql_core.int)("targetOutput").default(0),
  actualOutput: (0, import_mysql_core.int)("actualOutput").default(0),
  efficiency: (0, import_mysql_core.decimal)("efficiency", { precision: 5, scale: 2 }),
  bottleneck: (0, import_mysql_core.boolean)("bottleneck").default(false),
  cycleTime: (0, import_mysql_core.decimal)("cycleTime", { precision: 6, scale: 3 }),
  taktTime: (0, import_mysql_core.decimal)("taktTime", { precision: 6, scale: 3 }),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var warehouses = (0, import_mysql_core.mysqlTable)("warehouses", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  code: (0, import_mysql_core.varchar)("code", { length: 20 }).notNull().unique(),
  name: (0, import_mysql_core.varchar)("name", { length: 150 }).notNull(),
  type: (0, import_mysql_core.mysqlEnum)("type", ["raw_material", "finished_goods", "work_in_progress", "rejected", "quarantine"]).default("raw_material").notNull(),
  address: (0, import_mysql_core.text)("address"),
  managerName: (0, import_mysql_core.varchar)("managerName", { length: 200 }),
  phone: (0, import_mysql_core.varchar)("phone", { length: 30 }),
  isDefault: (0, import_mysql_core.boolean)("isDefault").default(false),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var warehouseBins = (0, import_mysql_core.mysqlTable)("warehouse_bins", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  warehouseId: (0, import_mysql_core.bigint)("warehouseId", { mode: "number", unsigned: true }).notNull(),
  binCode: (0, import_mysql_core.varchar)("binCode", { length: 50 }).notNull(),
  aisle: (0, import_mysql_core.varchar)("aisle", { length: 20 }),
  rack: (0, import_mysql_core.varchar)("rack", { length: 20 }),
  shelf: (0, import_mysql_core.varchar)("shelf", { length: 20 }),
  capacity: (0, import_mysql_core.int)("capacity").default(0),
  currentQty: (0, import_mysql_core.int)("currentQty").default(0),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["empty", "partial", "full", "reserved"]).default("empty").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var reorderRules = (0, import_mysql_core.mysqlTable)("reorder_rules", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  warehouseId: (0, import_mysql_core.bigint)("warehouseId", { mode: "number", unsigned: true }),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }),
  minStock: (0, import_mysql_core.int)("minStock").default(0),
  maxStock: (0, import_mysql_core.int)("maxStock").default(0),
  reorderPoint: (0, import_mysql_core.int)("reorderPoint").default(0),
  reorderQty: (0, import_mysql_core.int)("reorderQty").default(0),
  safetyStock: (0, import_mysql_core.int)("safetyStock").default(0),
  leadTimeDays: (0, import_mysql_core.int)("leadTimeDays").default(7),
  autoReorder: (0, import_mysql_core.boolean)("autoReorder").default(false),
  notificationEmail: (0, import_mysql_core.varchar)("notificationEmail", { length: 320 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive", "triggered"]).default("active").notNull(),
  lastReorderDate: (0, import_mysql_core.date)("lastReorderDate"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var productLifecycle = (0, import_mysql_core.mysqlTable)("product_lifecycle", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  stage: (0, import_mysql_core.mysqlEnum)("stage", [
    "concept",
    "design",
    "tech_pack",
    "sampling",
    "costing",
    "buyer_approval",
    "bulk_fabric",
    "cutting",
    "production",
    "finishing",
    "qc_final",
    "packing",
    "shipped",
    "delivered"
  ]).notNull(),
  stageOrder: (0, import_mysql_core.int)("stageOrder").notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "in_progress", "completed", "skipped", "blocked"]).default("pending").notNull(),
  assignedTo: (0, import_mysql_core.bigint)("assignedTo", { mode: "number", unsigned: true }),
  startDate: (0, import_mysql_core.date)("startDate"),
  targetDate: (0, import_mysql_core.date)("targetDate"),
  completedDate: (0, import_mysql_core.date)("completedDate"),
  notes: (0, import_mysql_core.text)("notes"),
  attachments: (0, import_mysql_core.text)("attachments"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var techPacks = (0, import_mysql_core.mysqlTable)("tech_packs", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  packNumber: (0, import_mysql_core.varchar)("packNumber", { length: 50 }).notNull().unique(),
  version: (0, import_mysql_core.varchar)("version", { length: 10 }).default("1.0"),
  description: (0, import_mysql_core.text)("description"),
  fabricSpecs: (0, import_mysql_core.text)("fabricSpecs"),
  trimSpecs: (0, import_mysql_core.text)("trimSpecs"),
  measurementChart: (0, import_mysql_core.text)("measurementChart"),
  constructionDetails: (0, import_mysql_core.text)("constructionDetails"),
  sketchImages: (0, import_mysql_core.text)("sketchImages"),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: (0, import_mysql_core.timestamp)("approvedAt"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "review", "approved", "rejected", "revision_needed"]).default("draft").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var designRevisions = (0, import_mysql_core.mysqlTable)("design_revisions", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  techPackId: (0, import_mysql_core.bigint)("techPackId", { mode: "number", unsigned: true }),
  revisionNumber: (0, import_mysql_core.varchar)("revisionNumber", { length: 10 }).notNull(),
  changeDescription: (0, import_mysql_core.text)("changeDescription"),
  changedBy: (0, import_mysql_core.bigint)("changedBy", { mode: "number", unsigned: true }),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var sampleReviews = (0, import_mysql_core.mysqlTable)("sample_reviews", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  techPackId: (0, import_mysql_core.bigint)("techPackId", { mode: "number", unsigned: true }),
  sampleType: (0, import_mysql_core.mysqlEnum)("sampleType", ["fit", "pp", "production", "counter", "size_set"]).notNull(),
  size: (0, import_mysql_core.varchar)("size", { length: 20 }),
  color: (0, import_mysql_core.varchar)("color", { length: 50 }),
  reviewerName: (0, import_mysql_core.varchar)("reviewerName", { length: 200 }),
  reviewDate: (0, import_mysql_core.date)("reviewDate"),
  comments: (0, import_mysql_core.text)("comments"),
  defects: (0, import_mysql_core.text)("defects"),
  decision: (0, import_mysql_core.mysqlEnum)("decision", ["approved", "approved_with_comments", "rejected", "resubmit"]),
  status: (0, import_mysql_core.mysqlEnum)("status", ["submitted", "under_review", "decided"]).default("submitted").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var customReports = (0, import_mysql_core.mysqlTable)("custom_reports", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  queryConfig: (0, import_mysql_core.text)("queryConfig").notNull(),
  chartType: (0, import_mysql_core.mysqlEnum)("chartType", ["table", "bar", "line", "pie", "area", "kpi", "heatmap"]).default("table").notNull(),
  filters: (0, import_mysql_core.text)("filters"),
  schedule: (0, import_mysql_core.varchar)("schedule", { length: 50 }),
  isPublic: (0, import_mysql_core.boolean)("isPublic").default(false),
  createdBy: (0, import_mysql_core.bigint)("createdBy", { mode: "number", unsigned: true }),
  lastRunAt: (0, import_mysql_core.timestamp)("lastRunAt"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var reportTemplates = (0, import_mysql_core.mysqlTable)("report_templates", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  category: (0, import_mysql_core.varchar)("category", { length: 100 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  queryConfig: (0, import_mysql_core.text)("queryConfig").notNull(),
  chartType: (0, import_mysql_core.mysqlEnum)("chartType", ["table", "bar", "line", "pie", "area", "kpi", "heatmap"]).default("table").notNull(),
  isSystem: (0, import_mysql_core.boolean)("isSystem").default(false),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var buyerPortalUsers = (0, import_mysql_core.mysqlTable)("buyer_portal_users", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  fullName: (0, import_mysql_core.varchar)("fullName", { length: 255 }).notNull(),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }).notNull(),
  password: (0, import_mysql_core.varchar)("password", { length: 255 }),
  role: (0, import_mysql_core.mysqlEnum)("role", ["buyer_admin", "buyer_user", "viewer"]).default("buyer_user").notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["active", "inactive", "pending"]).default("pending").notNull(),
  lastLogin: (0, import_mysql_core.timestamp)("lastLogin"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var productionForecasts = (0, import_mysql_core.mysqlTable)("production_forecasts", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  lineId: (0, import_mysql_core.bigint)("lineId", { mode: "number", unsigned: true }),
  forecastType: (0, import_mysql_core.mysqlEnum)("forecastType", ["demand", "capacity", "material", "delivery"]).notNull(),
  period: (0, import_mysql_core.varchar)("period", { length: 20 }).notNull(),
  predictedValue: (0, import_mysql_core.decimal)("predictedValue", { precision: 12, scale: 2 }).notNull(),
  confidence: (0, import_mysql_core.decimal)("confidence", { precision: 5, scale: 2 }).default("85"),
  actualValue: (0, import_mysql_core.decimal)("actualValue", { precision: 12, scale: 2 }),
  variance: (0, import_mysql_core.decimal)("variance", { precision: 12, scale: 2 }),
  algorithm: (0, import_mysql_core.varchar)("algorithm", { length: 50 }).default("linear_regression"),
  factors: (0, import_mysql_core.text)("factors"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var auditLog = (0, import_mysql_core.mysqlTable)("audit_log", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  tableName: (0, import_mysql_core.varchar)("tableName", { length: 100 }).notNull(),
  recordId: (0, import_mysql_core.bigint)("recordId", { mode: "number", unsigned: true }).notNull(),
  action: (0, import_mysql_core.mysqlEnum)("action", ["INSERT", "UPDATE", "DELETE"]).notNull(),
  oldValues: (0, import_mysql_core.text)("oldValues"),
  newValues: (0, import_mysql_core.text)("newValues"),
  changedBy: (0, import_mysql_core.bigint)("changedBy", { mode: "number", unsigned: true }),
  changedByName: (0, import_mysql_core.varchar)("changedByName", { length: 255 }),
  ipAddress: (0, import_mysql_core.varchar)("ipAddress", { length: 45 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var companySettings = (0, import_mysql_core.mysqlTable)("company_settings", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  companyName: (0, import_mysql_core.varchar)("companyName", { length: 200 }).notNull(),
  companyNameEn: (0, import_mysql_core.varchar)("companyNameEn", { length: 200 }),
  address: (0, import_mysql_core.text)("address"),
  phone: (0, import_mysql_core.varchar)("phone", { length: 50 }),
  email: (0, import_mysql_core.varchar)("email", { length: 320 }),
  taxNumber: (0, import_mysql_core.varchar)("taxNumber", { length: 50 }),
  commercialRegister: (0, import_mysql_core.varchar)("commercialRegister", { length: 50 }),
  vatRate: (0, import_mysql_core.decimal)("vatRate", { precision: 5, scale: 2 }).default("14"),
  currency: (0, import_mysql_core.varchar)("currency", { length: 10 }).default("EGP"),
  fiscalYearStart: (0, import_mysql_core.date)("fiscalYearStart"),
  fiscalYearEnd: (0, import_mysql_core.date)("fiscalYearEnd"),
  logo: (0, import_mysql_core.text)("logo"),
  paymentTerms: (0, import_mysql_core.text)("paymentTerms"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var purchaseRequests = (0, import_mysql_core.mysqlTable)("purchase_requests", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  prNumber: (0, import_mysql_core.varchar)("prNumber", { length: 50 }).notNull().unique(),
  department: (0, import_mysql_core.varchar)("department", { length: 100 }),
  requestedBy: (0, import_mysql_core.varchar)("requestedBy", { length: 255 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "pending_approval", "approved", "rejected", "converted_to_po"]).default("draft").notNull(),
  priority: (0, import_mysql_core.mysqlEnum)("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  requiredDate: (0, import_mysql_core.date)("requiredDate"),
  notes: (0, import_mysql_core.text)("notes"),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: (0, import_mysql_core.timestamp)("approvedAt"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var purchaseRequestItems = (0, import_mysql_core.mysqlTable)("purchase_request_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  purchaseRequestId: (0, import_mysql_core.bigint)("purchaseRequestId", { mode: "number", unsigned: true }).notNull(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var grns = (0, import_mysql_core.mysqlTable)("grns", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  grnNumber: (0, import_mysql_core.varchar)("grnNumber", { length: 50 }).notNull().unique(),
  supplyOrderId: (0, import_mysql_core.bigint)("supplyOrderId", { mode: "number", unsigned: true }).notNull(),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }).notNull(),
  receivedDate: (0, import_mysql_core.date)("receivedDate").notNull(),
  invoiceNumber: (0, import_mysql_core.varchar)("invoiceNumber", { length: 50 }),
  invoiceDate: (0, import_mysql_core.date)("invoiceDate"),
  subtotal: (0, import_mysql_core.decimal)("subtotal", { precision: 12, scale: 2 }),
  vatAmount: (0, import_mysql_core.decimal)("vatAmount", { precision: 12, scale: 2 }),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "partial", "fully_received", "rejected"]).default("pending").notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  receivedBy: (0, import_mysql_core.varchar)("receivedBy", { length: 255 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var salesInvoices = (0, import_mysql_core.mysqlTable)("sales_invoices", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  invoiceNumber: (0, import_mysql_core.varchar)("invoiceNumber", { length: 50 }).notNull().unique(),
  salesOrderId: (0, import_mysql_core.bigint)("salesOrderId", { mode: "number", unsigned: true }).notNull(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  issueDate: (0, import_mysql_core.date)("issueDate").notNull(),
  dueDate: (0, import_mysql_core.date)("dueDate"),
  subtotal: (0, import_mysql_core.decimal)("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: (0, import_mysql_core.decimal)("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: (0, import_mysql_core.decimal)("vatAmount", { precision: 12, scale: 2 }),
  discountAmount: (0, import_mysql_core.decimal)("discountAmount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: (0, import_mysql_core.decimal)("amountPaid", { precision: 12, scale: 2 }).default("0"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "issued", "paid", "partial", "overdue", "cancelled"]).default("draft").notNull(),
  paymentTerms: (0, import_mysql_core.varchar)("paymentTerms", { length: 100 }),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var purchaseInvoices = (0, import_mysql_core.mysqlTable)("purchase_invoices", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  invoiceNumber: (0, import_mysql_core.varchar)("invoiceNumber", { length: 50 }).notNull().unique(),
  grnId: (0, import_mysql_core.bigint)("grnId", { mode: "number", unsigned: true }).notNull(),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }).notNull(),
  issueDate: (0, import_mysql_core.date)("issueDate").notNull(),
  dueDate: (0, import_mysql_core.date)("dueDate"),
  subtotal: (0, import_mysql_core.decimal)("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: (0, import_mysql_core.decimal)("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: (0, import_mysql_core.decimal)("vatAmount", { precision: 12, scale: 2 }),
  discountAmount: (0, import_mysql_core.decimal)("discountAmount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: (0, import_mysql_core.decimal)("amountPaid", { precision: 12, scale: 2 }).default("0"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "received", "paid", "partial", "overdue", "cancelled"]).default("draft").notNull(),
  withholdingTax: (0, import_mysql_core.decimal)("withholdingTax", { precision: 12, scale: 2 }).default("0"),
  customsDuty: (0, import_mysql_core.decimal)("customsDuty", { precision: 12, scale: 2 }).default("0"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var paymentVouchers = (0, import_mysql_core.mysqlTable)("payment_vouchers", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  voucherNumber: (0, import_mysql_core.varchar)("voucherNumber", { length: 50 }).notNull().unique(),
  voucherDate: (0, import_mysql_core.date)("voucherDate").notNull(),
  payeeName: (0, import_mysql_core.varchar)("payeeName", { length: 255 }).notNull(),
  payeeType: (0, import_mysql_core.mysqlEnum)("payeeType", ["supplier", "employee", "contractor", "other"]).notNull(),
  payeeId: (0, import_mysql_core.bigint)("payeeId", { mode: "number", unsigned: true }),
  referenceInvoiceId: (0, import_mysql_core.bigint)("referenceInvoiceId", { mode: "number", unsigned: true }),
  amount: (0, import_mysql_core.decimal)("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: (0, import_mysql_core.mysqlEnum)("paymentMethod", ["cash", "check", "bank_transfer", "credit_card"]).default("cash").notNull(),
  checkNumber: (0, import_mysql_core.varchar)("checkNumber", { length: 50 }),
  bankName: (0, import_mysql_core.varchar)("bankName", { length: 100 }),
  description: (0, import_mysql_core.text)("description"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "approved", "paid", "cancelled"]).default("draft").notNull(),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var receiptVouchers = (0, import_mysql_core.mysqlTable)("receipt_vouchers", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  voucherNumber: (0, import_mysql_core.varchar)("voucherNumber", { length: 50 }).notNull().unique(),
  voucherDate: (0, import_mysql_core.date)("voucherDate").notNull(),
  payerName: (0, import_mysql_core.varchar)("payerName", { length: 255 }).notNull(),
  payerType: (0, import_mysql_core.mysqlEnum)("payerType", ["customer", "employee", "other"]).notNull(),
  payerId: (0, import_mysql_core.bigint)("payerId", { mode: "number", unsigned: true }),
  referenceInvoiceId: (0, import_mysql_core.bigint)("referenceInvoiceId", { mode: "number", unsigned: true }),
  amount: (0, import_mysql_core.decimal)("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: (0, import_mysql_core.mysqlEnum)("paymentMethod", ["cash", "check", "bank_transfer", "credit_card"]).default("cash").notNull(),
  checkNumber: (0, import_mysql_core.varchar)("checkNumber", { length: 50 }),
  bankName: (0, import_mysql_core.varchar)("bankName", { length: 100 }),
  description: (0, import_mysql_core.text)("description"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "approved", "received", "cancelled"]).default("draft").notNull(),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var journalVouchers = (0, import_mysql_core.mysqlTable)("journal_vouchers", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  voucherNumber: (0, import_mysql_core.varchar)("voucherNumber", { length: 50 }).notNull().unique(),
  voucherDate: (0, import_mysql_core.date)("voucherDate").notNull(),
  description: (0, import_mysql_core.text)("description"),
  totalDebit: (0, import_mysql_core.decimal)("totalDebit", { precision: 12, scale: 2 }).notNull(),
  totalCredit: (0, import_mysql_core.decimal)("totalCredit", { precision: 12, scale: 2 }).notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "posted", "cancelled"]).default("draft").notNull(),
  postedBy: (0, import_mysql_core.bigint)("postedBy", { mode: "number", unsigned: true }),
  postedAt: (0, import_mysql_core.timestamp)("postedAt"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var journalVoucherLines = (0, import_mysql_core.mysqlTable)("journal_voucher_lines", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  journalVoucherId: (0, import_mysql_core.bigint)("journalVoucherId", { mode: "number", unsigned: true }).notNull(),
  accountCode: (0, import_mysql_core.varchar)("accountCode", { length: 50 }).notNull(),
  accountName: (0, import_mysql_core.varchar)("accountName", { length: 200 }).notNull(),
  debit: (0, import_mysql_core.decimal)("debit", { precision: 12, scale: 2 }).default("0"),
  credit: (0, import_mysql_core.decimal)("credit", { precision: 12, scale: 2 }).default("0"),
  description: (0, import_mysql_core.text)("description"),
  costCenter: (0, import_mysql_core.varchar)("costCenter", { length: 100 }),
  reference: (0, import_mysql_core.varchar)("reference", { length: 100 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var maintenanceRecords = (0, import_mysql_core.mysqlTable)("maintenance_records", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  machineId: (0, import_mysql_core.bigint)("machineId", { mode: "number", unsigned: true }).notNull(),
  maintenanceType: (0, import_mysql_core.mysqlEnum)("maintenanceType", ["preventive", "corrective", "overhaul"]).notNull(),
  title: (0, import_mysql_core.varchar)("title", { length: 200 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  frequency: (0, import_mysql_core.mysqlEnum)("frequency", ["daily", "weekly", "monthly", "quarterly", "semi_annual", "annual"]),
  scheduledDate: (0, import_mysql_core.date)("scheduledDate").notNull(),
  completedDate: (0, import_mysql_core.date)("completedDate"),
  cost: (0, import_mysql_core.decimal)("cost", { precision: 12, scale: 2 }),
  partsUsed: (0, import_mysql_core.text)("partsUsed"),
  technicianName: (0, import_mysql_core.varchar)("technicianName", { length: 255 }),
  downtime: (0, import_mysql_core.int)("downtime"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["scheduled", "in_progress", "completed", "overdue", "cancelled"]).default("scheduled").notNull(),
  nextDueDate: (0, import_mysql_core.date)("nextDueDate"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var machineDepreciation = (0, import_mysql_core.mysqlTable)("machine_depreciation", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  machineId: (0, import_mysql_core.bigint)("machineId", { mode: "number", unsigned: true }).notNull(),
  year: (0, import_mysql_core.int)("year").notNull(),
  period: (0, import_mysql_core.varchar)("period", { length: 20 }).notNull(),
  depreciationAmount: (0, import_mysql_core.decimal)("depreciationAmount", { precision: 12, scale: 2 }).notNull(),
  accumulatedDepreciation: (0, import_mysql_core.decimal)("accumulatedDepreciation", { precision: 12, scale: 2 }).notNull(),
  bookValue: (0, import_mysql_core.decimal)("bookValue", { precision: 12, scale: 2 }).notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var orderAmendments = (0, import_mysql_core.mysqlTable)("order_amendments", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  salesOrderId: (0, import_mysql_core.bigint)("salesOrderId", { mode: "number", unsigned: true }).notNull(),
  fieldName: (0, import_mysql_core.varchar)("fieldName", { length: 100 }).notNull(),
  oldValue: (0, import_mysql_core.text)("oldValue"),
  newValue: (0, import_mysql_core.text)("newValue"),
  reason: (0, import_mysql_core.text)("reason"),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: (0, import_mysql_core.timestamp)("approvedAt"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var deliveryReminders = (0, import_mysql_core.mysqlTable)("delivery_reminders", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  salesOrderId: (0, import_mysql_core.bigint)("salesOrderId", { mode: "number", unsigned: true }).notNull(),
  reminderType: (0, import_mysql_core.mysqlEnum)("reminderType", ["7_days", "3_days", "1_day", "overdue"]).notNull(),
  sent: (0, import_mysql_core.boolean)("sent").default(false),
  sentAt: (0, import_mysql_core.timestamp)("sentAt"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var quotations = (0, import_mysql_core.mysqlTable)("quotations", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  quotationNumber: (0, import_mysql_core.varchar)("quotationNumber", { length: 50 }).notNull().unique(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  issueDate: (0, import_mysql_core.date)("issueDate").notNull(),
  expiryDate: (0, import_mysql_core.date)("expiryDate"),
  subtotal: (0, import_mysql_core.decimal)("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: (0, import_mysql_core.decimal)("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: (0, import_mysql_core.decimal)("vatAmount", { precision: 12, scale: 2 }),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }).notNull(),
  paymentTerms: (0, import_mysql_core.varchar)("paymentTerms", { length: 100 }),
  deliveryTerms: (0, import_mysql_core.varchar)("deliveryTerms", { length: 100 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "sent", "accepted", "rejected", "expired"]).default("draft").notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var quotationItems = (0, import_mysql_core.mysqlTable)("quotation_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  quotationId: (0, import_mysql_core.bigint)("quotationId", { mode: "number", unsigned: true }).notNull(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }),
  description: (0, import_mysql_core.varchar)("description", { length: 255 }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }).notNull(),
  lineTotal: (0, import_mysql_core.decimal)("lineTotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var defectTypes = (0, import_mysql_core.mysqlTable)("defect_types", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  code: (0, import_mysql_core.varchar)("code", { length: 20 }).notNull().unique(),
  name: (0, import_mysql_core.varchar)("name", { length: 100 }).notNull(),
  category: (0, import_mysql_core.mysqlEnum)("category", ["cutting", "sewing", "measurement", "appearance", "assembly", "packaging"]).notNull(),
  severity: (0, import_mysql_core.mysqlEnum)("severity", ["critical", "major", "minor"]).notNull(),
  description: (0, import_mysql_core.text)("description"),
  isSystem: (0, import_mysql_core.boolean)("isSystem").default(false),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var expenseCategories = (0, import_mysql_core.mysqlTable)("expense_categories", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 100 }).notNull(),
  code: (0, import_mysql_core.varchar)("code", { length: 30 }).notNull().unique(),
  parentId: (0, import_mysql_core.bigint)("parentId", { mode: "number", unsigned: true }),
  description: (0, import_mysql_core.text)("description"),
  budgetLimit: (0, import_mysql_core.decimal)("budgetLimit", { precision: 12, scale: 2 }),
  period: (0, import_mysql_core.mysqlEnum)("period", ["monthly", "quarterly", "annual", "weekly", "daily"]).default("monthly"),
  isActive: (0, import_mysql_core.boolean)("isActive").default(true),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var expenses = (0, import_mysql_core.mysqlTable)("expenses", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  expenseNumber: (0, import_mysql_core.varchar)("expenseNumber", { length: 50 }).notNull().unique(),
  categoryId: (0, import_mysql_core.bigint)("categoryId", { mode: "number", unsigned: true }).notNull(),
  title: (0, import_mysql_core.varchar)("title", { length: 200 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  amount: (0, import_mysql_core.decimal)("amount", { precision: 12, scale: 2 }).notNull(),
  expenseDate: (0, import_mysql_core.date)("expenseDate").notNull(),
  paymentMethod: (0, import_mysql_core.mysqlEnum)("paymentMethod", ["cash", "check", "bank_transfer", "credit_card", "other"]).default("cash"),
  payee: (0, import_mysql_core.varchar)("payee", { length: 255 }),
  receiptNumber: (0, import_mysql_core.varchar)("receiptNumber", { length: 50 }),
  receiptImage: (0, import_mysql_core.text)("receiptImage"),
  isRecurring: (0, import_mysql_core.boolean)("isRecurring").default(false),
  recurringFrequency: (0, import_mysql_core.mysqlEnum)("recurringFrequency", ["weekly", "monthly", "quarterly", "annually"]),
  departmentId: (0, import_mysql_core.bigint)("departmentId", { mode: "number", unsigned: true }),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  approvedAt: (0, import_mysql_core.timestamp)("approvedAt"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "pending", "approved", "rejected", "paid"]).default("draft").notNull(),
  vatAmount: (0, import_mysql_core.decimal)("vatAmount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }).notNull(),
  allocatedToOrderId: (0, import_mysql_core.bigint)("allocatedToOrderId", { mode: "number", unsigned: true }),
  allocatedToModelId: (0, import_mysql_core.bigint)("allocatedToModelId", { mode: "number", unsigned: true }),
  notes: (0, import_mysql_core.text)("notes"),
  createdBy: (0, import_mysql_core.bigint)("createdBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var finishedGoods = (0, import_mysql_core.mysqlTable)("finished_goods", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  sku: (0, import_mysql_core.varchar)("sku", { length: 50 }).notNull().unique(),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }).notNull(),
  modelName: (0, import_mysql_core.varchar)("modelName", { length: 200 }).notNull(),
  color: (0, import_mysql_core.varchar)("color", { length: 50 }).notNull(),
  size: (0, import_mysql_core.varchar)("size", { length: 20 }).notNull(),
  barcode: (0, import_mysql_core.varchar)("barcode", { length: 100 }),
  productionOrderId: (0, import_mysql_core.bigint)("productionOrderId", { mode: "number", unsigned: true }),
  bundleId: (0, import_mysql_core.bigint)("bundleId", { mode: "number", unsigned: true }),
  warehouseId: (0, import_mysql_core.bigint)("warehouseId", { mode: "number", unsigned: true }).notNull(),
  binId: (0, import_mysql_core.bigint)("binId", { mode: "number", unsigned: true }),
  quantity: (0, import_mysql_core.int)("quantity").default(0).notNull(),
  availableQty: (0, import_mysql_core.int)("availableQty").default(0).notNull(),
  reservedQty: (0, import_mysql_core.int)("reservedQty").default(0).notNull(),
  unitCost: (0, import_mysql_core.decimal)("unitCost", { precision: 12, scale: 2 }),
  totalCost: (0, import_mysql_core.decimal)("totalCost", { precision: 12, scale: 2 }),
  sellingPrice: (0, import_mysql_core.decimal)("sellingPrice", { precision: 12, scale: 2 }),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }),
  customerName: (0, import_mysql_core.varchar)("customerName", { length: 200 }),
  salesOrderId: (0, import_mysql_core.bigint)("salesOrderId", { mode: "number", unsigned: true }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["in_stock", "reserved", "picked", "packed", "shipped", "delivered", "returned", "quarantine"]).default("in_stock").notNull(),
  qualityGrade: (0, import_mysql_core.mysqlEnum)("qualityGrade", ["a", "b", "c"]).default("a"),
  productionDate: (0, import_mysql_core.date)("productionDate"),
  expiryDate: (0, import_mysql_core.date)("expiryDate"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var wastageRecords = (0, import_mysql_core.mysqlTable)("wastage_records", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  wastageNumber: (0, import_mysql_core.varchar)("wastageNumber", { length: 50 }).notNull().unique(),
  sourceType: (0, import_mysql_core.mysqlEnum)("sourceType", ["cutting", "sewing", "ironing", "finishing", "qc_reject", "damage", "expiry"]).notNull(),
  sourceId: (0, import_mysql_core.bigint)("sourceId", { mode: "number", unsigned: true }),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }),
  productionOrderId: (0, import_mysql_core.bigint)("productionOrderId", { mode: "number", unsigned: true }),
  lineId: (0, import_mysql_core.bigint)("lineId", { mode: "number", unsigned: true }),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }),
  fabricRollId: (0, import_mysql_core.bigint)("fabricRollId", { mode: "number", unsigned: true }),
  wastageType: (0, import_mysql_core.mysqlEnum)("wastageType", ["end_bit", "defect", "shrinkage", "overcut", "miscut", "thread_waste", "oil_stain", "other"]).notNull(),
  quantity: (0, import_mysql_core.decimal)("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: (0, import_mysql_core.varchar)("unit", { length: 20 }).notNull(),
  unitCost: (0, import_mysql_core.decimal)("unitCost", { precision: 12, scale: 2 }),
  totalCost: (0, import_mysql_core.decimal)("totalCost", { precision: 12, scale: 2 }),
  percentOfInput: (0, import_mysql_core.decimal)("percentOfInput", { precision: 5, scale: 2 }),
  standardPercent: (0, import_mysql_core.decimal)("standardPercent", { precision: 5, scale: 2 }),
  variance: (0, import_mysql_core.decimal)("variance", { precision: 5, scale: 2 }),
  isWithinStandard: (0, import_mysql_core.boolean)("isWithinStandard").default(true),
  reason: (0, import_mysql_core.text)("reason"),
  correctiveAction: (0, import_mysql_core.text)("correctiveAction"),
  reportedBy: (0, import_mysql_core.bigint)("reportedBy", { mode: "number", unsigned: true }),
  approvedBy: (0, import_mysql_core.bigint)("approvedBy", { mode: "number", unsigned: true }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["reported", "under_review", "approved", "rejected", "resolved"]).default("reported").notNull(),
  wastageDate: (0, import_mysql_core.date)("wastageDate").notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var salesRepVisits = (0, import_mysql_core.mysqlTable)("sales_rep_visits", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  visitNumber: (0, import_mysql_core.varchar)("visitNumber", { length: 50 }).notNull().unique(),
  salesRepId: (0, import_mysql_core.bigint)("salesRepId", { mode: "number", unsigned: true }).notNull(),
  salesRepName: (0, import_mysql_core.varchar)("salesRepName", { length: 255 }).notNull(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }),
  customerName: (0, import_mysql_core.varchar)("customerName", { length: 200 }),
  customerPhone: (0, import_mysql_core.varchar)("customerPhone", { length: 30 }),
  customerAddress: (0, import_mysql_core.text)("customerAddress"),
  customerLocation: (0, import_mysql_core.varchar)("customerLocation", { length: 255 }),
  visitType: (0, import_mysql_core.mysqlEnum)("visitType", ["scheduled", "unplanned", "follow_up", "complaint", "delivery", "collection"]).default("scheduled").notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["planned", "in_progress", "completed", "cancelled", "no_show"]).default("planned").notNull(),
  scheduledDate: (0, import_mysql_core.date)("scheduledDate").notNull(),
  scheduledTime: (0, import_mysql_core.varchar)("scheduledTime", { length: 5 }),
  actualStartTime: (0, import_mysql_core.timestamp)("actualStartTime"),
  actualEndTime: (0, import_mysql_core.timestamp)("actualEndTime"),
  purpose: (0, import_mysql_core.text)("purpose"),
  outcome: (0, import_mysql_core.text)("outcome"),
  notes: (0, import_mysql_core.text)("notes"),
  gpsLatitude: (0, import_mysql_core.decimal)("gpsLatitude", { precision: 10, scale: 8 }),
  gpsLongitude: (0, import_mysql_core.decimal)("gpsLongitude", { precision: 11, scale: 8 }),
  photos: (0, import_mysql_core.text)("photos"),
  nextVisitDate: (0, import_mysql_core.date)("nextVisitDate"),
  orderTaken: (0, import_mysql_core.boolean)("orderTaken").default(false),
  orderAmount: (0, import_mysql_core.decimal)("orderAmount", { precision: 12, scale: 2 }),
  paymentCollected: (0, import_mysql_core.decimal)("paymentCollected", { precision: 12, scale: 2 }).default("0"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var salesRepOrders = (0, import_mysql_core.mysqlTable)("sales_rep_orders", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  orderNumber: (0, import_mysql_core.varchar)("orderNumber", { length: 50 }).notNull().unique(),
  salesRepId: (0, import_mysql_core.bigint)("salesRepId", { mode: "number", unsigned: true }).notNull(),
  salesRepName: (0, import_mysql_core.varchar)("salesRepName", { length: 255 }).notNull(),
  visitId: (0, import_mysql_core.bigint)("visitId", { mode: "number", unsigned: true }),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }),
  customerName: (0, import_mysql_core.varchar)("customerName", { length: 200 }).notNull(),
  customerPhone: (0, import_mysql_core.varchar)("customerPhone", { length: 30 }),
  customerAddress: (0, import_mysql_core.text)("customerAddress"),
  modelId: (0, import_mysql_core.bigint)("modelId", { mode: "number", unsigned: true }),
  modelName: (0, import_mysql_core.varchar)("modelName", { length: 200 }),
  color: (0, import_mysql_core.varchar)("color", { length: 50 }),
  size: (0, import_mysql_core.varchar)("size", { length: 20 }),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }).notNull(),
  discountPercent: (0, import_mysql_core.decimal)("discountPercent", { precision: 5, scale: 2 }).default("0"),
  discountAmount: (0, import_mysql_core.decimal)("discountAmount", { precision: 12, scale: 2 }).default("0"),
  vatRate: (0, import_mysql_core.decimal)("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: (0, import_mysql_core.decimal)("vatAmount", { precision: 12, scale: 2 }),
  grandTotal: (0, import_mysql_core.decimal)("grandTotal", { precision: 12, scale: 2 }).notNull(),
  deliveryDate: (0, import_mysql_core.date)("deliveryDate"),
  deliveryAddress: (0, import_mysql_core.text)("deliveryAddress"),
  specialInstructions: (0, import_mysql_core.text)("specialInstructions"),
  paymentTerms: (0, import_mysql_core.varchar)("paymentTerms", { length: 100 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "submitted", "approved", "in_production", "ready", "delivered", "cancelled", "rejected"]).default("draft").notNull(),
  syncedToErp: (0, import_mysql_core.boolean)("syncedToErp").default(false),
  erpOrderId: (0, import_mysql_core.bigint)("erpOrderId", { mode: "number", unsigned: true }),
  photos: (0, import_mysql_core.text)("photos"),
  customerSignature: (0, import_mysql_core.text)("customerSignature"),
  gpsLatitude: (0, import_mysql_core.decimal)("gpsLatitude", { precision: 10, scale: 8 }),
  gpsLongitude: (0, import_mysql_core.decimal)("gpsLongitude", { precision: 11, scale: 8 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var accounts = (0, import_mysql_core.mysqlTable)("accounts", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  code: (0, import_mysql_core.varchar)("code", { length: 50 }).notNull().unique(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  nameEn: (0, import_mysql_core.varchar)("nameEn", { length: 200 }),
  type: (0, import_mysql_core.mysqlEnum)("type", [
    "asset",
    // أصول
    "liability",
    // خصوم
    "equity",
    // حقوق ملكية
    "revenue",
    // إيرادات
    "expense",
    // مصروفات
    "cost_of_sales"
    // تكلفة المبيعات
  ]).notNull(),
  category: (0, import_mysql_core.mysqlEnum)("category", [
    "current_asset",
    // أصول متداولة
    "fixed_asset",
    // أصول ثابتة
    "current_liability",
    // خصوم متداولة
    "long_term_liability",
    // خصوم طويلة الأجل
    "equity",
    // حقوق الملكية
    "revenue",
    // الإيرادات
    "expense",
    // المصروفات العامة
    "cost_of_sales",
    // تكلفة المبيعات
    "other_income",
    // إيرادات أخرى
    "other_expense"
    // مصروفات أخرى
  ]).notNull(),
  parentId: (0, import_mysql_core.bigint)("parentId", { mode: "number", unsigned: true }),
  level: (0, import_mysql_core.int)("level").default(1).notNull(),
  isLeaf: (0, import_mysql_core.boolean)("isLeaf").default(true).notNull(),
  openingBalance: (0, import_mysql_core.decimal)("openingBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  currentBalance: (0, import_mysql_core.decimal)("currentBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: (0, import_mysql_core.varchar)("currency", { length: 10 }).default("EGP"),
  notes: (0, import_mysql_core.text)("notes"),
  isActive: (0, import_mysql_core.boolean)("isActive").default(true).notNull(),
  isSystem: (0, import_mysql_core.boolean)("isSystem").default(false).notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var openingBalances = (0, import_mysql_core.mysqlTable)("opening_balances", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  fiscalYear: (0, import_mysql_core.varchar)("fiscalYear", { length: 10 }).notNull(),
  accountId: (0, import_mysql_core.bigint)("accountId", { mode: "number", unsigned: true }).notNull(),
  debit: (0, import_mysql_core.decimal)("debit", { precision: 12, scale: 2 }).default("0").notNull(),
  credit: (0, import_mysql_core.decimal)("credit", { precision: 12, scale: 2 }).default("0").notNull(),
  balance: (0, import_mysql_core.decimal)("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  reference: (0, import_mysql_core.varchar)("reference", { length: 100 }),
  notes: (0, import_mysql_core.text)("notes"),
  posted: (0, import_mysql_core.boolean)("posted").default(false).notNull(),
  postedAt: (0, import_mysql_core.timestamp)("postedAt"),
  postedBy: (0, import_mysql_core.bigint)("postedBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var treasuryAccounts = (0, import_mysql_core.mysqlTable)("treasury_accounts", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 200 }).notNull(),
  code: (0, import_mysql_core.varchar)("code", { length: 30 }).notNull().unique(),
  type: (0, import_mysql_core.mysqlEnum)("type", ["cash", "bank", "check", "other"]).notNull(),
  bankName: (0, import_mysql_core.varchar)("bankName", { length: 100 }),
  accountNumber: (0, import_mysql_core.varchar)("accountNumber", { length: 50 }),
  iban: (0, import_mysql_core.varchar)("iban", { length: 50 }),
  branch: (0, import_mysql_core.varchar)("branch", { length: 100 }),
  currency: (0, import_mysql_core.varchar)("currency", { length: 10 }).default("EGP"),
  openingBalance: (0, import_mysql_core.decimal)("openingBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  currentBalance: (0, import_mysql_core.decimal)("currentBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  isDefault: (0, import_mysql_core.boolean)("isDefault").default(false),
  isActive: (0, import_mysql_core.boolean)("isActive").default(true).notNull(),
  accountId: (0, import_mysql_core.bigint)("accountId", { mode: "number", unsigned: true }),
  // link to chart of accounts
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var treasuryTransactions = (0, import_mysql_core.mysqlTable)("treasury_transactions", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  treasuryAccountId: (0, import_mysql_core.bigint)("treasuryAccountId", { mode: "number", unsigned: true }).notNull(),
  type: (0, import_mysql_core.mysqlEnum)("type", ["receipt", "payment", "transfer_in", "transfer_out"]).notNull(),
  amount: (0, import_mysql_core.decimal)("amount", { precision: 12, scale: 2 }).notNull(),
  date: (0, import_mysql_core.date)("date").notNull(),
  reference: (0, import_mysql_core.varchar)("reference", { length: 100 }),
  // Related document
  documentType: (0, import_mysql_core.mysqlEnum)("documentType", [
    "sales_invoice",
    "purchase_invoice",
    "expense",
    "payroll",
    "voucher",
    "order",
    "other",
    "opening_balance"
  ]),
  documentId: (0, import_mysql_core.bigint)("documentId", { mode: "number", unsigned: true }),
  documentNumber: (0, import_mysql_core.varchar)("documentNumber", { length: 50 }),
  // Party
  partyType: (0, import_mysql_core.mysqlEnum)("partyType", ["customer", "supplier", "employee", "other"]),
  partyId: (0, import_mysql_core.bigint)("partyId", { mode: "number", unsigned: true }),
  partyName: (0, import_mysql_core.varchar)("partyName", { length: 255 }),
  // Accounting
  debitAccountId: (0, import_mysql_core.bigint)("debitAccountId", { mode: "number", unsigned: true }),
  creditAccountId: (0, import_mysql_core.bigint)("creditAccountId", { mode: "number", unsigned: true }),
  // Meta
  description: (0, import_mysql_core.text)("description"),
  notes: (0, import_mysql_core.text)("notes"),
  createdBy: (0, import_mysql_core.bigint)("createdBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
}, (table) => ({
  acctIdx: (0, import_mysql_core.index)("idx_treasury_tx_account_id").on(table.treasuryAccountId),
  typeIdx: (0, import_mysql_core.index)("idx_treasury_tx_type").on(table.type),
  dateIdx: (0, import_mysql_core.index)("idx_treasury_tx_date").on(table.date)
}));
var generalLedger = (0, import_mysql_core.mysqlTable)("general_ledger", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  entryId: (0, import_mysql_core.varchar)("entryId", { length: 50 }).notNull(),
  lineNumber: (0, import_mysql_core.int)("lineNumber").notNull(),
  date: (0, import_mysql_core.date)("date").notNull(),
  accountId: (0, import_mysql_core.bigint)("accountId", { mode: "number", unsigned: true }).notNull(),
  debit: (0, import_mysql_core.decimal)("debit", { precision: 12, scale: 2 }).default("0").notNull(),
  credit: (0, import_mysql_core.decimal)("credit", { precision: 12, scale: 2 }).default("0").notNull(),
  // Source document
  sourceType: (0, import_mysql_core.mysqlEnum)("sourceType", [
    "manual_journal",
    "sales_invoice",
    "purchase_invoice",
    "expense",
    "payment_voucher",
    "receipt_voucher",
    "payroll",
    "inventory_in",
    "inventory_out",
    "transfer",
    "opening_balance",
    "grn",
    "challan",
    "finished_goods",
    "wastage",
    "treasury"
  ]).notNull(),
  sourceId: (0, import_mysql_core.bigint)("sourceId", { mode: "number", unsigned: true }),
  sourceNumber: (0, import_mysql_core.varchar)("sourceNumber", { length: 50 }),
  // Party
  partyType: (0, import_mysql_core.mysqlEnum)("partyType", ["customer", "supplier", "employee", "other"]),
  partyId: (0, import_mysql_core.bigint)("partyId", { mode: "number", unsigned: true }),
  partyName: (0, import_mysql_core.varchar)("partyName", { length: 255 }),
  description: (0, import_mysql_core.text)("description"),
  // Fiscal
  fiscalYear: (0, import_mysql_core.varchar)("fiscalYear", { length: 10 }).notNull(),
  period: (0, import_mysql_core.varchar)("period", { length: 10 }).notNull(),
  // MM-YYYY
  notes: (0, import_mysql_core.text)("notes"),
  createdBy: (0, import_mysql_core.bigint)("createdBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
}, (table) => ({
  acctIdx: (0, import_mysql_core.index)("idx_gl_account_id").on(table.accountId),
  entryIdx: (0, import_mysql_core.index)("idx_gl_entry_id").on(table.entryId),
  fiscalYearIdx: (0, import_mysql_core.index)("idx_gl_fiscal_year").on(table.fiscalYear),
  dateIdx: (0, import_mysql_core.index)("idx_gl_date").on(table.date)
}));
var creditLimits = (0, import_mysql_core.mysqlTable)("credit_limits", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  creditLimit: (0, import_mysql_core.decimal)("creditLimit", { precision: 12, scale: 2 }).notNull(),
  paymentTermDays: (0, import_mysql_core.int)("paymentTermDays").default(30),
  currentBalance: (0, import_mysql_core.decimal)("currentBalance", { precision: 12, scale: 2 }).default("0").notNull(),
  totalInvoiced: (0, import_mysql_core.decimal)("totalInvoiced", { precision: 12, scale: 2 }).default("0").notNull(),
  totalPaid: (0, import_mysql_core.decimal)("totalPaid", { precision: 12, scale: 2 }).default("0").notNull(),
  totalOverdue: (0, import_mysql_core.decimal)("totalOverdue", { precision: 12, scale: 2 }).default("0").notNull(),
  warningPercent: (0, import_mysql_core.decimal)("warningPercent", { precision: 5, scale: 2 }).default("80"),
  isActive: (0, import_mysql_core.boolean)("isActive").default(true).notNull(),
  lastUpdated: (0, import_mysql_core.timestamp)("lastUpdated").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var agingBuckets = (0, import_mysql_core.mysqlTable)("aging_buckets", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  invoiceId: (0, import_mysql_core.bigint)("invoiceId", { mode: "number", unsigned: true }).notNull(),
  invoiceNumber: (0, import_mysql_core.varchar)("invoiceNumber", { length: 50 }).notNull(),
  invoiceDate: (0, import_mysql_core.date)("invoiceDate").notNull(),
  dueDate: (0, import_mysql_core.date)("dueDate").notNull(),
  amount: (0, import_mysql_core.decimal)("amount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: (0, import_mysql_core.decimal)("amountPaid", { precision: 12, scale: 2 }).default("0").notNull(),
  balance: (0, import_mysql_core.decimal)("balance", { precision: 12, scale: 2 }).notNull(),
  bucket1_30: (0, import_mysql_core.decimal)("bucket1_30", { precision: 12, scale: 2 }).default("0"),
  bucket31_60: (0, import_mysql_core.decimal)("bucket31_60", { precision: 12, scale: 2 }).default("0"),
  bucket61_90: (0, import_mysql_core.decimal)("bucket61_90", { precision: 12, scale: 2 }).default("0"),
  bucket90_plus: (0, import_mysql_core.decimal)("bucket90_plus", { precision: 12, scale: 2 }).default("0"),
  lastCalculated: (0, import_mysql_core.timestamp)("lastCalculated").defaultNow().notNull()
});
var integrationLogs = (0, import_mysql_core.mysqlTable)("integration_logs", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  event: (0, import_mysql_core.varchar)("event", { length: 100 }).notNull(),
  sourceModule: (0, import_mysql_core.varchar)("sourceModule", { length: 50 }).notNull(),
  targetModule: (0, import_mysql_core.varchar)("targetModule", { length: 50 }).notNull(),
  sourceId: (0, import_mysql_core.bigint)("sourceId", { mode: "number", unsigned: true }),
  targetId: (0, import_mysql_core.bigint)("targetId", { mode: "number", unsigned: true }),
  sourceNumber: (0, import_mysql_core.varchar)("sourceNumber", { length: 50 }),
  targetNumber: (0, import_mysql_core.varchar)("targetNumber", { length: 50 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["success", "failed", "skipped", "pending"]).default("pending").notNull(),
  details: (0, import_mysql_core.text)("details"),
  errorMessage: (0, import_mysql_core.text)("errorMessage"),
  processedAt: (0, import_mysql_core.timestamp)("processedAt"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var fiscalYears = (0, import_mysql_core.mysqlTable)("fiscal_years", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 20 }).notNull(),
  startDate: (0, import_mysql_core.date)("startDate").notNull(),
  endDate: (0, import_mysql_core.date)("endDate").notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["open", "closed", "locked"]).default("open").notNull(),
  isCurrent: (0, import_mysql_core.boolean)("isCurrent").default(false),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var purchaseOrders = (0, import_mysql_core.mysqlTable)("purchase_orders", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  poNumber: (0, import_mysql_core.varchar)("poNumber", { length: 50 }).notNull().unique(),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }).notNull(),
  purchaseRequestId: (0, import_mysql_core.bigint)("purchaseRequestId", { mode: "number", unsigned: true }),
  quoteId: (0, import_mysql_core.bigint)("quoteId", { mode: "number", unsigned: true }),
  orderDate: (0, import_mysql_core.date)("orderDate").notNull(),
  expectedDeliveryDate: (0, import_mysql_core.date)("expectedDeliveryDate"),
  deliveryAddress: (0, import_mysql_core.text)("deliveryAddress"),
  subtotal: (0, import_mysql_core.decimal)("subtotal", { precision: 12, scale: 2 }).notNull(),
  vatRate: (0, import_mysql_core.decimal)("vatRate", { precision: 5, scale: 2 }).default("14"),
  vatAmount: (0, import_mysql_core.decimal)("vatAmount", { precision: 12, scale: 2 }),
  discountAmount: (0, import_mysql_core.decimal)("discountAmount", { precision: 12, scale: 2 }).default("0"),
  shippingCost: (0, import_mysql_core.decimal)("shippingCost", { precision: 12, scale: 2 }).default("0"),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }).notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "sent", "confirmed", "partially_received", "fully_received", "cancelled", "closed"]).default("draft").notNull(),
  paymentTerms: (0, import_mysql_core.varchar)("paymentTerms", { length: 100 }),
  notes: (0, import_mysql_core.text)("notes"),
  createdBy: (0, import_mysql_core.bigint)("createdBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var purchaseOrderItems = (0, import_mysql_core.mysqlTable)("purchase_order_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  purchaseOrderId: (0, import_mysql_core.bigint)("purchaseOrderId", { mode: "number", unsigned: true }).notNull(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  unitPrice: (0, import_mysql_core.decimal)("unitPrice", { precision: 10, scale: 2 }).notNull().default("0.00"),
  receivedQuantity: (0, import_mysql_core.int)("receivedQuantity").default(0),
  total: (0, import_mysql_core.decimal)("total", { precision: 12, scale: 2 }).notNull().default("0.00"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var rfqs = (0, import_mysql_core.mysqlTable)("rfqs", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  rfqNumber: (0, import_mysql_core.varchar)("rfqNumber", { length: 50 }).notNull().unique(),
  purchaseRequestId: (0, import_mysql_core.bigint)("purchaseRequestId", { mode: "number", unsigned: true }),
  title: (0, import_mysql_core.varchar)("title", { length: 255 }).notNull(),
  description: (0, import_mysql_core.text)("description"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["draft", "sent", "bidding", "evaluated", "awarded", "cancelled"]).default("draft").notNull(),
  deadline: (0, import_mysql_core.date)("deadline"),
  deliveryTerms: (0, import_mysql_core.text)("deliveryTerms"),
  paymentTerms: (0, import_mysql_core.text)("paymentTerms"),
  notes: (0, import_mysql_core.text)("notes"),
  createdBy: (0, import_mysql_core.bigint)("createdBy", { mode: "number", unsigned: true }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var rfqItems = (0, import_mysql_core.mysqlTable)("rfq_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  rfqId: (0, import_mysql_core.bigint)("rfqId", { mode: "number", unsigned: true }).notNull(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  specifications: (0, import_mysql_core.text)("specifications"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var rfqResponses = (0, import_mysql_core.mysqlTable)("rfq_responses", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  rfqId: (0, import_mysql_core.bigint)("rfqId", { mode: "number", unsigned: true }).notNull(),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }).notNull(),
  unitPrice: (0, import_mysql_core.varchar)("unitPrice", { length: 50 }).notNull(),
  totalPrice: (0, import_mysql_core.varchar)("totalPrice", { length: 50 }).notNull(),
  deliveryDays: (0, import_mysql_core.int)("deliveryDays"),
  validityDays: (0, import_mysql_core.int)("validityDays").default(30),
  currency: (0, import_mysql_core.varchar)("currency", { length: 3 }).default("EGP"),
  notes: (0, import_mysql_core.text)("notes"),
  isWinner: (0, import_mysql_core.boolean)("isWinner").default(false),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var goodsReceipts = (0, import_mysql_core.mysqlTable)("goods_receipts", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  grNumber: (0, import_mysql_core.varchar)("grNumber", { length: 50 }).notNull().unique(),
  purchaseOrderId: (0, import_mysql_core.bigint)("purchaseOrderId", { mode: "number", unsigned: true }).notNull(),
  supplierId: (0, import_mysql_core.bigint)("supplierId", { mode: "number", unsigned: true }).notNull(),
  receiptDate: (0, import_mysql_core.date)("receiptDate").notNull(),
  invoiceNumber: (0, import_mysql_core.varchar)("invoiceNumber", { length: 50 }),
  subtotal: (0, import_mysql_core.decimal)("subtotal", { precision: 12, scale: 2 }),
  vatAmount: (0, import_mysql_core.decimal)("vatAmount", { precision: 12, scale: 2 }),
  totalAmount: (0, import_mysql_core.decimal)("totalAmount", { precision: 12, scale: 2 }),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending_inspection", "partially_accepted", "fully_accepted", "rejected"]).default("pending_inspection").notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  receivedBy: (0, import_mysql_core.varchar)("receivedBy", { length: 255 }),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var goodsReceiptItems = (0, import_mysql_core.mysqlTable)("goods_receipt_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  goodsReceiptId: (0, import_mysql_core.bigint)("goodsReceiptId", { mode: "number", unsigned: true }).notNull(),
  purchaseOrderItemId: (0, import_mysql_core.bigint)("purchaseOrderItemId", { mode: "number", unsigned: true }).notNull(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  orderedQuantity: (0, import_mysql_core.int)("orderedQuantity").notNull(),
  receivedQuantity: (0, import_mysql_core.int)("receivedQuantity").notNull(),
  acceptedQuantity: (0, import_mysql_core.int)("acceptedQuantity").default(0),
  rejectedQuantity: (0, import_mysql_core.int)("rejectedQuantity").default(0),
  rejectionReason: (0, import_mysql_core.text)("rejectionReason"),
  unitPrice: (0, import_mysql_core.varchar)("unitPrice", { length: 50 }),
  total: (0, import_mysql_core.varchar)("total", { length: 50 }),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var salesPipelineStages = (0, import_mysql_core.mysqlTable)("sales_pipeline_stages", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  name: (0, import_mysql_core.varchar)("name", { length: 100 }).notNull(),
  order: (0, import_mysql_core.int)("stage_order").notNull(),
  color: (0, import_mysql_core.varchar)("color", { length: 20 }).default("#2c5282"),
  probability: (0, import_mysql_core.decimal)("probability", { precision: 5, scale: 2 }).default("0"),
  isActive: (0, import_mysql_core.boolean)("isActive").default(true).notNull(),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var salesOpportunities = (0, import_mysql_core.mysqlTable)("sales_opportunities", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  title: (0, import_mysql_core.varchar)("title", { length: 255 }).notNull(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  stageId: (0, import_mysql_core.bigint)("stageId", { mode: "number", unsigned: true }).notNull(),
  expectedValue: (0, import_mysql_core.decimal)("expectedValue", { precision: 12, scale: 2 }).notNull(),
  actualValue: (0, import_mysql_core.decimal)("actualValue", { precision: 12, scale: 2 }),
  probability: (0, import_mysql_core.decimal)("probability", { precision: 5, scale: 2 }).default("0"),
  expectedCloseDate: (0, import_mysql_core.date)("expectedCloseDate"),
  actualCloseDate: (0, import_mysql_core.date)("actualCloseDate"),
  source: (0, import_mysql_core.varchar)("source", { length: 50 }),
  assignedTo: (0, import_mysql_core.bigint)("assignedTo", { mode: "number", unsigned: true }),
  description: (0, import_mysql_core.text)("description"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["open", "won", "lost", "on_hold"]).default("open").notNull(),
  lossReason: (0, import_mysql_core.text)("lossReason"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var salesCommissions = (0, import_mysql_core.mysqlTable)("sales_commissions", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  employeeId: (0, import_mysql_core.bigint)("employeeId", { mode: "number", unsigned: true }).notNull(),
  salesOrderId: (0, import_mysql_core.bigint)("salesOrderId", { mode: "number", unsigned: true }),
  opportunityId: (0, import_mysql_core.bigint)("opportunityId", { mode: "number", unsigned: true }),
  commissionRate: (0, import_mysql_core.varchar)("commissionRate", { length: 20 }).notNull(),
  saleAmount: (0, import_mysql_core.varchar)("saleAmount", { length: 50 }).notNull(),
  commissionAmount: (0, import_mysql_core.varchar)("commissionAmount", { length: 50 }).notNull(),
  isPaid: (0, import_mysql_core.boolean)("isPaid").default(false).notNull(),
  paidAt: (0, import_mysql_core.timestamp)("paidAt"),
  period: (0, import_mysql_core.varchar)("period", { length: 10 }).notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});
var shipments = (0, import_mysql_core.mysqlTable)("shipments", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  trackingNumber: (0, import_mysql_core.varchar)("trackingNumber", { length: 100 }).notNull().unique(),
  salesOrderId: (0, import_mysql_core.bigint)("salesOrderId", { mode: "number", unsigned: true }).notNull(),
  customerId: (0, import_mysql_core.bigint)("customerId", { mode: "number", unsigned: true }).notNull(),
  carrier: (0, import_mysql_core.varchar)("carrier", { length: 100 }),
  shippingDate: (0, import_mysql_core.date)("shippingDate").notNull(),
  estimatedDeliveryDate: (0, import_mysql_core.date)("estimatedDeliveryDate"),
  actualDeliveryDate: (0, import_mysql_core.date)("actualDeliveryDate"),
  shippingAddress: (0, import_mysql_core.text)("shippingAddress"),
  shippingCost: (0, import_mysql_core.decimal)("shippingCost", { precision: 12, scale: 2 }).default("0"),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "picked", "in_transit", "out_for_delivery", "delivered", "returned", "cancelled"]).default("pending").notNull(),
  deliveryNotes: (0, import_mysql_core.text)("deliveryNotes"),
  recipientName: (0, import_mysql_core.varchar)("recipientName", { length: 255 }),
  recipientPhone: (0, import_mysql_core.varchar)("recipientPhone", { length: 50 }),
  signatureUrl: (0, import_mysql_core.text)("signatureUrl"),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull(),
  updatedAt: (0, import_mysql_core.timestamp)("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var shipmentItems = (0, import_mysql_core.mysqlTable)("shipment_items", {
  id: (0, import_mysql_core.serial)("id").primaryKey(),
  shipmentId: (0, import_mysql_core.bigint)("shipmentId", { mode: "number", unsigned: true }).notNull(),
  salesOrderItemId: (0, import_mysql_core.bigint)("salesOrderItemId", { mode: "number", unsigned: true }).notNull(),
  itemId: (0, import_mysql_core.bigint)("itemId", { mode: "number", unsigned: true }).notNull(),
  quantity: (0, import_mysql_core.int)("quantity").notNull(),
  notes: (0, import_mysql_core.text)("notes"),
  createdAt: (0, import_mysql_core.timestamp)("createdAt").defaultNow().notNull()
});

// db/relations.ts
var relations_exports = {};
__export(relations_exports, {
  advancesRelations: () => advancesRelations,
  attendanceRelations: () => attendanceRelations,
  bomRecordsRelations: () => bomRecordsRelations,
  bonusPenaltiesRelations: () => bonusPenaltiesRelations,
  bundleTrackingRelations: () => bundleTrackingRelations,
  bundlesRelations: () => bundlesRelations,
  buyerPortalUsersRelations: () => buyerPortalUsersRelations,
  candidatesRelations: () => candidatesRelations,
  challanItemsRelations: () => challanItemsRelations,
  challansRelations: () => challansRelations,
  costCalculationsRelations: () => costCalculationsRelations,
  crmCustomersRelations: () => crmCustomersRelations,
  crmInteractionsRelations: () => crmInteractionsRelations,
  customReportsRelations: () => customReportsRelations,
  cutPlansRelations: () => cutPlansRelations,
  cuttingOrdersRelations: () => cuttingOrdersRelations,
  dailyProductionRelations: () => dailyProductionRelations,
  departmentsRelations: () => departmentsRelations,
  designRevisionsRelations: () => designRevisionsRelations,
  employeesRelations: () => employeesRelations,
  fabricRollsRelations: () => fabricRollsRelations,
  goodsReceiptItemsRelations: () => goodsReceiptItemsRelations,
  goodsReceiptsRelations: () => goodsReceiptsRelations,
  grnsRelations: () => grnsRelations,
  integrationLogsRelations: () => integrationLogsRelations,
  inventoryItemsRelations: () => inventoryItemsRelations,
  inventoryTransactionsRelations: () => inventoryTransactionsRelations,
  jobPostingsRelations: () => jobPostingsRelations,
  leavesRelations: () => leavesRelations,
  lineBalancingRelations: () => lineBalancingRelations,
  machinesRelations: () => machinesRelations,
  maintenanceRecordsRelations: () => maintenanceRecordsRelations,
  markerPlansRelations: () => markerPlansRelations,
  modelStagesRelations: () => modelStagesRelations,
  mrpRecordsRelations: () => mrpRecordsRelations,
  orderAmendmentsRelations: () => orderAmendmentsRelations,
  payrollRecordsRelations: () => payrollRecordsRelations,
  performanceReviewsRelations: () => performanceReviewsRelations,
  pieceRateRecordsRelations: () => pieceRateRecordsRelations,
  productLifecycleRelations: () => productLifecycleRelations,
  productionForecastsRelations: () => productionForecastsRelations,
  productionLinesRelations: () => productionLinesRelations,
  productionModelsRelations: () => productionModelsRelations,
  productionOrdersRelations: () => productionOrdersRelations,
  purchaseInvoicesRelations: () => purchaseInvoicesRelations,
  purchaseOrderItemsRelations: () => purchaseOrderItemsRelations,
  purchaseOrdersRelations: () => purchaseOrdersRelations,
  purchaseRequestItemsRelations: () => purchaseRequestItemsRelations,
  purchaseRequestsRelations: () => purchaseRequestsRelations,
  qcRecordsRelations: () => qcRecordsRelations,
  quotationItemsRelations: () => quotationItemsRelations,
  quotationsRelations: () => quotationsRelations,
  reorderRulesRelations: () => reorderRulesRelations,
  rfqItemsRelations: () => rfqItemsRelations,
  rfqResponsesRelations: () => rfqResponsesRelations,
  rfqsRelations: () => rfqsRelations,
  salesCommissionsRelations: () => salesCommissionsRelations,
  salesInvoicesRelations: () => salesInvoicesRelations,
  salesOpportunitiesRelations: () => salesOpportunitiesRelations,
  salesOrdersRelations: () => salesOrdersRelations,
  salesPipelineStagesRelations: () => salesPipelineStagesRelations,
  samRecordsRelations: () => samRecordsRelations,
  sampleReviewsRelations: () => sampleReviewsRelations,
  shiftAssignmentsRelations: () => shiftAssignmentsRelations,
  shiftsRelations: () => shiftsRelations,
  shipmentItemsRelations: () => shipmentItemsRelations,
  shipmentsRelations: () => shipmentsRelations,
  styleColorSizeMatrixRelations: () => styleColorSizeMatrixRelations,
  subcontractsRelations: () => subcontractsRelations,
  suppliersRelations: () => suppliersRelations,
  supplyOrderItemsRelations: () => supplyOrderItemsRelations,
  supplyOrdersRelations: () => supplyOrdersRelations,
  techPacksRelations: () => techPacksRelations,
  usersRelations: () => usersRelations,
  warehouseBinsRelations: () => warehouseBinsRelations,
  warehousesRelations: () => warehousesRelations,
  workOrdersRelations: () => workOrdersRelations
});
var import_drizzle_orm = require("drizzle-orm");
var usersRelations = (0, import_drizzle_orm.relations)(users, ({ many }) => ({
  activities: many(activities)
}));
var departmentsRelations = (0, import_drizzle_orm.relations)(departments, ({ many, one }) => ({
  employees: many(employees, { relationName: "employee_department" }),
  manager: one(employees, { fields: [departments.managerId], references: [employees.id], relationName: "department_manager" }),
  jobPostings: many(jobPostings)
}));
var employeesRelations = (0, import_drizzle_orm.relations)(employees, ({ one, many }) => ({
  department: one(departments, { fields: [employees.departmentId], references: [departments.id], relationName: "employee_department" }),
  manager: one(employees, { fields: [employees.managerId], references: [employees.id] }),
  subordinates: many(employees),
  attendanceRecords: many(attendance),
  leaveRequests: many(leaves),
  reviews: many(performanceReviews, { relationName: "performance_review_employee" }),
  reviewerReviews: many(performanceReviews, { relationName: "performance_review_reviewer" }),
  payrolls: many(payrollRecords),
  shiftAssignments: many(shiftAssignments),
  advances: many(advances),
  bonusPenalties: many(bonusPenalties),
  managedLines: many(productionLines),
  pieceRateRecords: many(pieceRateRecords),
  managedDepartments: many(departments, { relationName: "department_manager" })
}));
var attendanceRelations = (0, import_drizzle_orm.relations)(attendance, ({ one }) => ({
  employee: one(employees, { fields: [attendance.employeeId], references: [employees.id] })
}));
var leavesRelations = (0, import_drizzle_orm.relations)(leaves, ({ one }) => ({
  employee: one(employees, { fields: [leaves.employeeId], references: [employees.id] })
}));
var performanceReviewsRelations = (0, import_drizzle_orm.relations)(performanceReviews, ({ one }) => ({
  employee: one(employees, { fields: [performanceReviews.employeeId], references: [employees.id], relationName: "performance_review_employee" }),
  reviewer: one(employees, { fields: [performanceReviews.reviewerId], references: [employees.id], relationName: "performance_review_reviewer" })
}));
var jobPostingsRelations = (0, import_drizzle_orm.relations)(jobPostings, ({ many, one }) => ({
  candidates: many(candidates),
  department: one(departments, { fields: [jobPostings.departmentId], references: [departments.id] })
}));
var candidatesRelations = (0, import_drizzle_orm.relations)(candidates, ({ one }) => ({
  jobPosting: one(jobPostings, { fields: [candidates.jobPostingId], references: [jobPostings.id] })
}));
var payrollRecordsRelations = (0, import_drizzle_orm.relations)(payrollRecords, ({ one }) => ({
  employee: one(employees, { fields: [payrollRecords.employeeId], references: [employees.id] })
}));
var shiftsRelations = (0, import_drizzle_orm.relations)(shifts, ({ many }) => ({
  assignments: many(shiftAssignments)
}));
var shiftAssignmentsRelations = (0, import_drizzle_orm.relations)(shiftAssignments, ({ one }) => ({
  employee: one(employees, { fields: [shiftAssignments.employeeId], references: [employees.id] }),
  shift: one(shifts, { fields: [shiftAssignments.shiftId], references: [shifts.id] })
}));
var advancesRelations = (0, import_drizzle_orm.relations)(advances, ({ one }) => ({
  employee: one(employees, { fields: [advances.employeeId], references: [employees.id] })
}));
var bonusPenaltiesRelations = (0, import_drizzle_orm.relations)(bonusPenalties, ({ one }) => ({
  employee: one(employees, { fields: [bonusPenalties.employeeId], references: [employees.id] })
}));
var productionLinesRelations = (0, import_drizzle_orm.relations)(productionLines, ({ many, one }) => ({
  supervisor: one(employees, { fields: [productionLines.supervisorId], references: [employees.id] }),
  orders: many(productionOrders),
  dailyProduction: many(dailyProduction),
  machines: many(machines),
  workOrders: many(workOrders)
}));
var productionOrdersRelations = (0, import_drizzle_orm.relations)(productionOrders, ({ one, many }) => ({
  line: one(productionLines, { fields: [productionOrders.lineId], references: [productionLines.id] }),
  dailyProduction: many(dailyProduction),
  workOrders: many(workOrders)
}));
var dailyProductionRelations = (0, import_drizzle_orm.relations)(dailyProduction, ({ one }) => ({
  line: one(productionLines, { fields: [dailyProduction.lineId], references: [productionLines.id] }),
  order: one(productionOrders, { fields: [dailyProduction.orderId], references: [productionOrders.id] })
}));
var productionModelsRelations = (0, import_drizzle_orm.relations)(productionModels, ({ many }) => ({
  stages: many(modelStages),
  pieceRateRecords: many(pieceRateRecords),
  bomRecords: many(bomRecords),
  cuttingOrders: many(cuttingOrders),
  workOrders: many(workOrders),
  bundles: many(bundles),
  costCalculations: many(costCalculations)
}));
var modelStagesRelations = (0, import_drizzle_orm.relations)(modelStages, ({ one, many }) => ({
  model: one(productionModels, { fields: [modelStages.modelId], references: [productionModels.id] }),
  pieceRateRecords: many(pieceRateRecords)
}));
var pieceRateRecordsRelations = (0, import_drizzle_orm.relations)(pieceRateRecords, ({ one }) => ({
  employee: one(employees, { fields: [pieceRateRecords.employeeId], references: [employees.id] }),
  model: one(productionModels, { fields: [pieceRateRecords.modelId], references: [productionModels.id] }),
  stage: one(modelStages, { fields: [pieceRateRecords.stageId], references: [modelStages.id] })
}));
var machinesRelations = (0, import_drizzle_orm.relations)(machines, ({ one }) => ({
  line: one(productionLines, { fields: [machines.lineId], references: [productionLines.id] })
}));
var inventoryItemsRelations = (0, import_drizzle_orm.relations)(inventoryItems, ({ many }) => ({
  transactions: many(inventoryTransactions),
  bomRecords: many(bomRecords),
  mrpRecords: many(mrpRecords)
}));
var inventoryTransactionsRelations = (0, import_drizzle_orm.relations)(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, { fields: [inventoryTransactions.itemId], references: [inventoryItems.id] })
}));
var suppliersRelations = (0, import_drizzle_orm.relations)(suppliers, ({ many }) => ({
  supplyOrders: many(supplyOrders),
  subcontracts: many(subcontracts)
}));
var supplyOrdersRelations = (0, import_drizzle_orm.relations)(supplyOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [supplyOrders.supplierId], references: [suppliers.id] }),
  items: many(supplyOrderItems)
}));
var supplyOrderItemsRelations = (0, import_drizzle_orm.relations)(supplyOrderItems, ({ one }) => ({
  supplyOrder: one(supplyOrders, { fields: [supplyOrderItems.supplyOrderId], references: [supplyOrders.id] }),
  item: one(inventoryItems, { fields: [supplyOrderItems.itemId], references: [inventoryItems.id] })
}));
var cuttingOrdersRelations = (0, import_drizzle_orm.relations)(cuttingOrders, ({ one }) => ({
  model: one(productionModels, { fields: [cuttingOrders.modelId], references: [productionModels.id] }),
  assignedWorker: one(employees, { fields: [cuttingOrders.assignedTo], references: [employees.id] })
}));
var workOrdersRelations = (0, import_drizzle_orm.relations)(workOrders, ({ one, many }) => ({
  productionOrder: one(productionOrders, { fields: [workOrders.productionOrderId], references: [productionOrders.id] }),
  model: one(productionModels, { fields: [workOrders.modelId], references: [productionModels.id] }),
  line: one(productionLines, { fields: [workOrders.lineId], references: [productionLines.id] }),
  bundles: many(bundles)
}));
var bundlesRelations = (0, import_drizzle_orm.relations)(bundles, ({ one, many }) => ({
  workOrder: one(workOrders, { fields: [bundles.workOrderId], references: [workOrders.id] }),
  model: one(productionModels, { fields: [bundles.modelId], references: [productionModels.id] }),
  line: one(productionLines, { fields: [bundles.currentLineId], references: [productionLines.id] }),
  tracking: many(bundleTracking)
}));
var bundleTrackingRelations = (0, import_drizzle_orm.relations)(bundleTracking, ({ one }) => ({
  bundle: one(bundles, { fields: [bundleTracking.bundleId], references: [bundles.id] })
}));
var bomRecordsRelations = (0, import_drizzle_orm.relations)(bomRecords, ({ one }) => ({
  model: one(productionModels, { fields: [bomRecords.modelId], references: [productionModels.id] }),
  item: one(inventoryItems, { fields: [bomRecords.itemId], references: [inventoryItems.id] })
}));
var qcRecordsRelations = (0, import_drizzle_orm.relations)(qcRecords, ({ one }) => ({
  order: one(productionOrders, { fields: [qcRecords.orderId], references: [productionOrders.id] }),
  bundle: one(bundles, { fields: [qcRecords.bundleId], references: [bundles.id] })
}));
var mrpRecordsRelations = (0, import_drizzle_orm.relations)(mrpRecords, ({ one }) => ({
  productionOrder: one(productionOrders, { fields: [mrpRecords.productionOrderId], references: [productionOrders.id] }),
  item: one(inventoryItems, { fields: [mrpRecords.itemId], references: [inventoryItems.id] })
}));
var challansRelations = (0, import_drizzle_orm.relations)(challans, ({ many }) => ({
  items: many(challanItems)
}));
var challanItemsRelations = (0, import_drizzle_orm.relations)(challanItems, ({ one }) => ({
  challan: one(challans, { fields: [challanItems.challanId], references: [challans.id] })
}));
var subcontractsRelations = (0, import_drizzle_orm.relations)(subcontracts, ({ one }) => ({
  supplier: one(suppliers, { fields: [subcontracts.supplierId], references: [suppliers.id] }),
  model: one(productionModels, { fields: [subcontracts.modelId], references: [productionModels.id] })
}));
var salesOrdersRelations = (0, import_drizzle_orm.relations)(salesOrders, ({ one }) => ({
  customer: one(crmCustomers, { fields: [salesOrders.customerId], references: [crmCustomers.id] })
}));
var crmCustomersRelations = (0, import_drizzle_orm.relations)(crmCustomers, ({ many }) => ({
  interactions: many(crmInteractions),
  salesOrders: many(salesOrders)
}));
var crmInteractionsRelations = (0, import_drizzle_orm.relations)(crmInteractions, ({ one }) => ({
  customer: one(crmCustomers, { fields: [crmInteractions.customerId], references: [crmCustomers.id] })
}));
var costCalculationsRelations = (0, import_drizzle_orm.relations)(costCalculations, ({ one }) => ({
  model: one(productionModels, { fields: [costCalculations.modelId], references: [productionModels.id] })
}));
var styleColorSizeMatrixRelations = (0, import_drizzle_orm.relations)(styleColorSizeMatrix, ({ one }) => ({
  model: one(productionModels, { fields: [styleColorSizeMatrix.modelId], references: [productionModels.id] })
}));
var fabricRollsRelations = (0, import_drizzle_orm.relations)(fabricRolls, ({ one }) => ({
  supplier: one(suppliers, { fields: [fabricRolls.supplierId], references: [suppliers.id] })
}));
var cutPlansRelations = (0, import_drizzle_orm.relations)(cutPlans, ({ one, many }) => ({
  model: one(productionModels, { fields: [cutPlans.modelId], references: [productionModels.id] }),
  order: one(productionOrders, { fields: [cutPlans.orderId], references: [productionOrders.id] }),
  markers: many(markerPlans)
}));
var markerPlansRelations = (0, import_drizzle_orm.relations)(markerPlans, ({ one }) => ({
  cutPlan: one(cutPlans, { fields: [markerPlans.cutPlanId], references: [cutPlans.id] }),
  model: one(productionModels, { fields: [markerPlans.modelId], references: [productionModels.id] })
}));
var samRecordsRelations = (0, import_drizzle_orm.relations)(samRecords, ({ one }) => ({
  model: one(productionModels, { fields: [samRecords.modelId], references: [productionModels.id] }),
  stage: one(modelStages, { fields: [samRecords.stageId], references: [modelStages.id] })
}));
var lineBalancingRelations = (0, import_drizzle_orm.relations)(lineBalancing, ({ one }) => ({
  line: one(productionLines, { fields: [lineBalancing.lineId], references: [productionLines.id] }),
  model: one(productionModels, { fields: [lineBalancing.modelId], references: [productionModels.id] })
}));
var warehousesRelations = (0, import_drizzle_orm.relations)(warehouses, ({ many }) => ({
  bins: many(warehouseBins)
}));
var warehouseBinsRelations = (0, import_drizzle_orm.relations)(warehouseBins, ({ one }) => ({
  warehouse: one(warehouses, { fields: [warehouseBins.warehouseId], references: [warehouses.id] }),
  item: one(inventoryItems, { fields: [warehouseBins.itemId], references: [inventoryItems.id] })
}));
var reorderRulesRelations = (0, import_drizzle_orm.relations)(reorderRules, ({ one }) => ({
  item: one(inventoryItems, { fields: [reorderRules.itemId], references: [inventoryItems.id] }),
  warehouse: one(warehouses, { fields: [reorderRules.warehouseId], references: [warehouses.id] }),
  supplier: one(suppliers, { fields: [reorderRules.supplierId], references: [suppliers.id] })
}));
var productLifecycleRelations = (0, import_drizzle_orm.relations)(productLifecycle, ({ one }) => ({
  model: one(productionModels, { fields: [productLifecycle.modelId], references: [productionModels.id] }),
  assignee: one(employees, { fields: [productLifecycle.assignedTo], references: [employees.id] })
}));
var techPacksRelations = (0, import_drizzle_orm.relations)(techPacks, ({ one, many }) => ({
  model: one(productionModels, { fields: [techPacks.modelId], references: [productionModels.id] }),
  revisions: many(designRevisions),
  samples: many(sampleReviews)
}));
var designRevisionsRelations = (0, import_drizzle_orm.relations)(designRevisions, ({ one }) => ({
  model: one(productionModels, { fields: [designRevisions.modelId], references: [productionModels.id] }),
  techPack: one(techPacks, { fields: [designRevisions.techPackId], references: [techPacks.id] })
}));
var sampleReviewsRelations = (0, import_drizzle_orm.relations)(sampleReviews, ({ one }) => ({
  model: one(productionModels, { fields: [sampleReviews.modelId], references: [productionModels.id] }),
  techPack: one(techPacks, { fields: [sampleReviews.techPackId], references: [techPacks.id] })
}));
var customReportsRelations = (0, import_drizzle_orm.relations)(customReports, ({ one }) => ({
  creator: one(users, { fields: [customReports.createdBy], references: [users.id] })
}));
var buyerPortalUsersRelations = (0, import_drizzle_orm.relations)(buyerPortalUsers, ({ one }) => ({
  customer: one(crmCustomers, { fields: [buyerPortalUsers.customerId], references: [crmCustomers.id] })
}));
var productionForecastsRelations = (0, import_drizzle_orm.relations)(productionForecasts, ({ one }) => ({
  model: one(productionModels, { fields: [productionForecasts.modelId], references: [productionModels.id] }),
  line: one(productionLines, { fields: [productionForecasts.lineId], references: [productionLines.id] })
}));
var purchaseRequestsRelations = (0, import_drizzle_orm.relations)(purchaseRequests, ({ many }) => ({
  items: many(purchaseRequestItems)
}));
var purchaseRequestItemsRelations = (0, import_drizzle_orm.relations)(purchaseRequestItems, ({ one }) => ({
  request: one(purchaseRequests, { fields: [purchaseRequestItems.purchaseRequestId], references: [purchaseRequests.id] }),
  item: one(inventoryItems, { fields: [purchaseRequestItems.itemId], references: [inventoryItems.id] })
}));
var grnsRelations = (0, import_drizzle_orm.relations)(grns, ({ one }) => ({
  supplyOrder: one(supplyOrders, { fields: [grns.supplyOrderId], references: [supplyOrders.id] }),
  supplier: one(suppliers, { fields: [grns.supplierId], references: [suppliers.id] })
}));
var salesInvoicesRelations = (0, import_drizzle_orm.relations)(salesInvoices, ({ one }) => ({
  salesOrder: one(salesOrders, { fields: [salesInvoices.salesOrderId], references: [salesOrders.id] }),
  customer: one(crmCustomers, { fields: [salesInvoices.customerId], references: [crmCustomers.id] })
}));
var purchaseInvoicesRelations = (0, import_drizzle_orm.relations)(purchaseInvoices, ({ one }) => ({
  grn: one(grns, { fields: [purchaseInvoices.grnId], references: [grns.id] }),
  supplier: one(suppliers, { fields: [purchaseInvoices.supplierId], references: [suppliers.id] })
}));
var maintenanceRecordsRelations = (0, import_drizzle_orm.relations)(maintenanceRecords, ({ one }) => ({
  machine: one(machines, { fields: [maintenanceRecords.machineId], references: [machines.id] })
}));
var orderAmendmentsRelations = (0, import_drizzle_orm.relations)(orderAmendments, ({ one }) => ({
  salesOrder: one(salesOrders, { fields: [orderAmendments.salesOrderId], references: [salesOrders.id] })
}));
var quotationsRelations = (0, import_drizzle_orm.relations)(quotations, ({ one, many }) => ({
  customer: one(crmCustomers, { fields: [quotations.customerId], references: [crmCustomers.id] }),
  items: many(quotationItems)
}));
var quotationItemsRelations = (0, import_drizzle_orm.relations)(quotationItems, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationItems.quotationId], references: [quotations.id] }),
  model: one(productionModels, { fields: [quotationItems.modelId], references: [productionModels.id] })
}));
var purchaseOrdersRelations = (0, import_drizzle_orm.relations)(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  items: many(purchaseOrderItems),
  goodsReceipts: many(goodsReceipts)
}));
var purchaseOrderItemsRelations = (0, import_drizzle_orm.relations)(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [purchaseOrderItems.purchaseOrderId], references: [purchaseOrders.id] }),
  item: one(inventoryItems, { fields: [purchaseOrderItems.itemId], references: [inventoryItems.id] })
}));
var rfqsRelations = (0, import_drizzle_orm.relations)(rfqs, ({ many }) => ({
  items: many(rfqItems),
  responses: many(rfqResponses)
}));
var rfqItemsRelations = (0, import_drizzle_orm.relations)(rfqItems, ({ one }) => ({
  rfq: one(rfqs, { fields: [rfqItems.rfqId], references: [rfqs.id] }),
  item: one(inventoryItems, { fields: [rfqItems.itemId], references: [inventoryItems.id] })
}));
var rfqResponsesRelations = (0, import_drizzle_orm.relations)(rfqResponses, ({ one }) => ({
  rfq: one(rfqs, { fields: [rfqResponses.rfqId], references: [rfqs.id] }),
  supplier: one(suppliers, { fields: [rfqResponses.supplierId], references: [suppliers.id] })
}));
var goodsReceiptsRelations = (0, import_drizzle_orm.relations)(goodsReceipts, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [goodsReceipts.purchaseOrderId], references: [purchaseOrders.id] }),
  supplier: one(suppliers, { fields: [goodsReceipts.supplierId], references: [suppliers.id] }),
  items: many(goodsReceiptItems)
}));
var goodsReceiptItemsRelations = (0, import_drizzle_orm.relations)(goodsReceiptItems, ({ one }) => ({
  goodsReceipt: one(goodsReceipts, { fields: [goodsReceiptItems.goodsReceiptId], references: [goodsReceipts.id] }),
  item: one(inventoryItems, { fields: [goodsReceiptItems.itemId], references: [inventoryItems.id] })
}));
var salesPipelineStagesRelations = (0, import_drizzle_orm.relations)(salesPipelineStages, ({ many }) => ({
  opportunities: many(salesOpportunities)
}));
var salesOpportunitiesRelations = (0, import_drizzle_orm.relations)(salesOpportunities, ({ one }) => ({
  customer: one(crmCustomers, { fields: [salesOpportunities.customerId], references: [crmCustomers.id] }),
  stage: one(salesPipelineStages, { fields: [salesOpportunities.stageId], references: [salesPipelineStages.id] })
}));
var salesCommissionsRelations = (0, import_drizzle_orm.relations)(salesCommissions, ({ one }) => ({
  employee: one(employees, { fields: [salesCommissions.employeeId], references: [employees.id] }),
  salesOrder: one(salesOrders, { fields: [salesCommissions.salesOrderId], references: [salesOrders.id] })
}));
var shipmentsRelations = (0, import_drizzle_orm.relations)(shipments, ({ one, many }) => ({
  salesOrder: one(salesOrders, { fields: [shipments.salesOrderId], references: [salesOrders.id] }),
  customer: one(crmCustomers, { fields: [shipments.customerId], references: [crmCustomers.id] }),
  items: many(shipmentItems)
}));
var shipmentItemsRelations = (0, import_drizzle_orm.relations)(shipmentItems, ({ one }) => ({
  shipment: one(shipments, { fields: [shipmentItems.shipmentId], references: [shipments.id] }),
  item: one(inventoryItems, { fields: [shipmentItems.itemId], references: [inventoryItems.id] })
}));
var integrationLogsRelations = (0, import_drizzle_orm.relations)(integrationLogs, ({}) => ({}));

// api/queries/connection.ts
var fullSchema = { ...schema_exports, ...relations_exports };
var instance;
function getDb() {
  if (!instance) {
    instance = (0, import_mysql2.drizzle)(env.databaseUrl, {
      mode: "planetscale",
      schema: fullSchema
    });
  }
  return instance;
}

// db/seed.ts
var import_drizzle_orm2 = require("drizzle-orm");
console.log("\u{1F331} Starting seed...");
var db = getDb();
var now = () => /* @__PURE__ */ new Date();
var rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
var randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
var daysAgo = (n) => {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - n);
  return d;
};
var monthStr = (m) => `2025-${String(m).padStart(2, "0")}`;
async function seed() {
  console.log("\u{1F9F9} Wiping old data...");
  await db.execute(import_drizzle_orm2.sql`SET FOREIGN_KEY_CHECKS = 0;`);
  const allTables = [
    users,
    departments,
    employees,
    attendance,
    leaves,
    performanceReviews,
    jobPostings,
    candidates,
    payrollRecords,
    shifts,
    shiftAssignments,
    advances,
    bonusPenalties,
    productionLines,
    productionOrders,
    dailyProduction,
    productionModels,
    modelStages,
    pieceRateRecords,
    machines,
    inventoryItems,
    inventoryTransactions,
    suppliers,
    supplyOrders,
    supplyOrderItems,
    cuttingOrders,
    workOrders,
    bundles,
    bundleTracking,
    bomRecords,
    qcRecords,
    mrpRecords,
    challans,
    challanItems,
    subcontracts,
    salesOrders,
    crmCustomers,
    crmInteractions,
    costCalculations,
    printSettings,
    activities,
    systemSettings,
    styleColorSizeMatrix,
    fabricRolls,
    cutPlans,
    markerPlans,
    samRecords,
    lineBalancing,
    warehouses,
    warehouseBins,
    reorderRules,
    productLifecycle,
    techPacks,
    designRevisions,
    sampleReviews,
    customReports,
    reportTemplates,
    buyerPortalUsers,
    productionForecasts,
    auditLog,
    companySettings,
    purchaseRequests,
    purchaseRequestItems,
    grns,
    salesInvoices,
    purchaseInvoices,
    paymentVouchers,
    receiptVouchers,
    journalVouchers,
    journalVoucherLines,
    maintenanceRecords,
    machineDepreciation,
    orderAmendments,
    deliveryReminders,
    quotations,
    quotationItems,
    purchaseOrders,
    purchaseOrderItems,
    rfqs,
    rfqItems,
    rfqResponses,
    goodsReceipts,
    goodsReceiptItems,
    salesPipelineStages,
    salesOpportunities,
    salesCommissions,
    shipments,
    shipmentItems,
    integrationLogs,
    openingBalances,
    treasuryAccounts,
    treasuryTransactions,
    creditLimits,
    agingBuckets,
    fiscalYears,
    expenseCategories,
    expenses,
    finishedGoods,
    wastageRecords,
    salesRepVisits,
    salesRepOrders,
    defectTypes,
    accounts,
    generalLedger
  ];
  for (const table of allTables) {
    await db.delete(table);
  }
  await db.execute(import_drizzle_orm2.sql`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("\u2713 Old data wiped.");
  console.log("\u{1F4B5} Seeding Chart of Accounts...");
  const accountsData = [
    { code: "110000", name: "\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u0646\u0642\u062F\u064A\u0629", type: "asset", category: "current_asset", level: 1, isLeaf: true },
    { code: "120000", name: "\u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u0623\u0647\u0644\u064A", type: "asset", category: "current_asset", level: 1, isLeaf: true },
    { code: "121000", name: "\u0645\u062E\u0632\u0646 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062E\u0627\u0645", type: "asset", category: "current_asset", level: 1, isLeaf: true },
    { code: "125000", name: "\u0645\u062E\u0632\u0646 \u0627\u0644\u0628\u0636\u0627\u0639\u0629 \u0627\u0644\u062A\u0627\u0645\u0629", type: "asset", category: "current_asset", level: 1, isLeaf: true },
    { code: "130000", name: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621 (\u0634\u0624\u0648\u0646 \u0627\u0644\u0628\u064A\u0639)", type: "asset", category: "current_asset", level: 1, isLeaf: true },
    { code: "211000", name: "\u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646 (\u0634\u0624\u0648\u0646 \u0627\u0644\u0634\u0631\u0627\u0621)", type: "liability", category: "current_liability", level: 1, isLeaf: true },
    { code: "220000", name: "\u0627\u0644\u0631\u0648\u0627\u062A\u0628 \u0648\u0627\u0644\u0623\u062C\u0648\u0631 \u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0629", type: "liability", category: "current_liability", level: 1, isLeaf: true },
    { code: "310000", name: "\u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644", type: "equity", category: "equity", level: 1, isLeaf: true },
    { code: "410000", name: "\u0625\u064A\u0631\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", type: "revenue", category: "revenue", level: 1, isLeaf: true },
    { code: "510000", name: "\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0627\u0644\u0631\u0648\u0627\u062A\u0628 \u0648\u0627\u0644\u0623\u062C\u0648\u0631", type: "expense", category: "expense", level: 1, isLeaf: true },
    { code: "520000", name: "\u062A\u0643\u0627\u0644\u064A\u0641 \u0627\u0644\u0625\u0646\u062A\u0627\u062C \u0648\u0627\u0644\u062A\u0634\u063A\u064A\u0644", type: "expense", category: "expense", level: 1, isLeaf: true },
    { code: "610000", name: "\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A COGS", type: "cost_of_sales", category: "cost_of_sales", level: 1, isLeaf: true }
  ];
  for (const acct of accountsData) {
    await db.insert(accounts).values(acct);
  }
  const dbAccts = await db.select().from(accounts);
  console.log(`  \u2713 ${dbAccts.length} accounts seeded`);
  console.log("\u{1F4C1} Seeding departments...");
  const deptData = [
    { name: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629", description: "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064A\u0627 \u0648\u0627\u0644\u062A\u062E\u0637\u064A\u0637", color: "#4A2C3F" },
    { name: "\u0627\u0644\u062E\u064A\u0627\u0637\u0629", description: "\u062E\u0637\u0648\u0637 \u0627\u0644\u0625\u0646\u062A\u0627\u062C \u0648\u0627\u0644\u062E\u064A\u0627\u0637\u0629", color: "#059669" },
    { name: "\u0627\u0644\u0642\u0635", description: "\u0642\u0633\u0645 \u0627\u0644\u0642\u0635 \u0648\u0627\u0644\u062A\u062C\u0647\u064A\u0632", color: "#D97706" },
    { name: "\u0627\u0644\u0643\u064A \u0648\u0627\u0644\u062A\u063A\u0644\u064A\u0641", description: "\u0627\u0644\u0643\u064A \u0648\u0627\u0644\u062A\u0639\u0628\u0626\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629", color: "#7C3AED" },
    { name: "\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u062C\u0648\u062F\u0629", description: "\u0641\u062D\u0635 \u0627\u0644\u062C\u0648\u062F\u0629 \u0648\u0636\u0628\u0637 \u0627\u0644\u0645\u0639\u0627\u064A\u064A\u0631", color: "#DC2626" },
    { name: "\u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639", description: "\u0627\u0644\u0645\u062E\u0632\u0646 \u0648\u0627\u0644\u062A\u062E\u0632\u064A\u0646", color: "#2563EB" },
    { name: "\u0627\u0644\u0645\u0627\u0644\u064A\u0629", description: "\u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0648\u0627\u0644\u0631\u0648\u0627\u062A\u0628", color: "#0891B2" },
    { name: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A", description: "\u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0648\u062E\u062F\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621", color: "#BE185D" }
  ];
  for (const d of deptData) await db.insert(departments).values(d);
  const depts = await db.select().from(departments);
  console.log(`  \u2713 ${depts.length} departments`);
  console.log("\u{1F465} Seeding employees...");
  const employeeNames = [
    ["\u0623\u062D\u0645\u062F \u0645\u062D\u0645\u062F", "\u0645\u062D\u0645\u062F \u0623\u062D\u0645\u062F", "\u0645\u062D\u0645\u0648\u062F \u0625\u0628\u0631\u0627\u0647\u064A\u0645", "\u062E\u0627\u0644\u062F \u0633\u0639\u064A\u062F", "\u0639\u0645\u0631 \u062D\u0633\u0646"],
    ["\u0641\u0627\u0637\u0645\u0629 \u0639\u0644\u064A", "\u0633\u0627\u0631\u0629 \u0645\u062D\u0645\u0648\u062F", "\u0646\u0648\u0631\u0627 \u062E\u0627\u0644\u062F", "\u0647\u0627\u0646\u064A \u0639\u0627\u062F\u0644", "\u062A\u0627\u0645\u0631 \u0641\u0624\u0627\u062F"],
    ["\u0633\u0627\u0645\u064A \u062C\u0645\u0627\u0644", "\u0648\u0644\u064A\u062F \u0639\u0628\u062F\u0627\u0644\u0644\u0647", "\u0625\u064A\u0645\u0627\u0646 \u0633\u0627\u0644\u0645", "\u0631\u064A\u0645 Osama", "\u0643\u0631\u064A\u0645 \u0646\u0627\u062F\u0631"],
    ["\u062F\u0639\u0627\u0621 \u0637\u0627\u0631\u0642", "\u064A\u0627\u0633\u0631 \u0645\u0646\u0635\u0648\u0631", "\u0631\u0627\u0646\u064A\u0627 \u0639\u0635\u0627\u0645", "\u0647\u0634\u0627\u0645 \u0645\u062C\u062F\u064A", "\u0633\u0645\u0631 \u0643\u0645\u0627\u0644"],
    ["\u0628\u0627\u0633\u0645 \u0631\u0623\u0641\u062A", "\u0646\u0634\u0648\u0649 \u0625\u0628\u0631\u0627\u0647\u064A\u0645", "\u0639\u0627\u062F\u0644 \u0645\u062D\u0631\u0648\u0633", "\u0645\u0646\u0649 \u0633\u0639\u064A\u062F", "\u0639\u0645\u0631\u0648 \u062E\u0627\u0644\u062F"],
    ["\u0639\u0628\u064A\u0631 \u062D\u0633\u0646", "\u0648\u0627\u0626\u0644 \u0641\u0631\u064A\u062F", "\u0646\u0647\u0649 \u0633\u0644\u0627\u0645\u0629", "\u0623\u0634\u0631\u0641 \u0639\u0627\u0637\u0641", "\u062F\u0627\u0644\u064A\u0627 \u0645\u0635\u0637\u0641\u0649"]
  ];
  const roles = ["\u0645\u062F\u064A\u0631", "\u0645\u0634\u0631\u0641", "\u0641\u0646\u064A", "\u0639\u0627\u0645\u0644", "\u0645\u062D\u0627\u0633\u0628", "\u0645\u0646\u062F\u0648\u0628"];
  const jobTitles = ["\u0645\u062F\u064A\u0631 \u0645\u0635\u0646\u0639", "\u0645\u0634\u0631\u0641 \u062E\u0637", "\u062E\u064A\u0627\u0637", "\u0642\u0635\u0627\u0635", "\u0643\u0648\u0627\u064A\u0629", "\u0641\u0646\u064A \u062C\u0648\u062F\u0629", "\u0645\u062D\u0627\u0633\u0628", "\u0645\u0646\u062F\u0648\u0628 \u0645\u0628\u064A\u0639\u0627\u062A", "\u0639\u0627\u0645\u0644 \u0645\u0633\u062A\u0648\u062F\u0639", "\u0641\u0646\u064A \u0635\u064A\u0627\u0646\u0629"];
  let empIdx = 1;
  for (const dept of depts) {
    const names = employeeNames[dept.id - 1] || employeeNames[0];
    for (const name of names) {
      await db.insert(employees).values({
        employeeCode: `EMP${String(empIdx).padStart(3, "0")}`,
        fullName: name,
        email: `emp${empIdx}@horizon.factory`,
        phone: `01${rand(0, 9)}${rand(1e7, 99999999)}`,
        departmentId: dept.id,
        role: randPick(roles),
        jobTitle: randPick(jobTitles),
        joinDate: daysAgo(rand(30, 1e3)),
        salary: String(rand(3e3, 15e3)),
        status: randPick(["active", "active", "active", "active", "on_leave", "inactive"]),
        employmentType: randPick(["full_time", "full_time", "full_time", "part_time", "contract"]),
        salaryType: randPick(["monthly", "monthly", "monthly", "piece_rate", "mixed"])
      });
      empIdx++;
    }
  }
  const emps = await db.select().from(employees);
  console.log(`  \u2713 ${emps.length} employees`);
  console.log("\u{1F4CB} Seeding attendance...");
  const activeEmps = emps.filter((e) => e.status === "active");
  for (let d = 0; d < 30; d++) {
    const date2 = daysAgo(d);
    if (date2.getDay() === 5) continue;
    for (const emp of activeEmps.slice(0, 20)) {
      const isLate = Math.random() < 0.1;
      const isAbsent = Math.random() < 0.05;
      await db.insert(attendance).values({
        employeeId: emp.id,
        date: date2,
        checkIn: isAbsent ? null : new Date(date2.getTime() + 7 * 36e5 + (isLate ? rand(15, 60) : rand(-5, 10)) * 6e4),
        checkOut: isAbsent ? null : new Date(date2.getTime() + 15 * 36e5 + rand(-30, 30) * 6e4),
        status: isAbsent ? "absent" : isLate ? "late" : "present",
        hoursWorked: isAbsent ? "0" : String(rand(7, 9)),
        notes: ""
      });
    }
  }
  console.log(`  \u2713 Attendance seeded`);
  console.log("\u{1F3D6}\uFE0F Seeding leaves...");
  const leaveTypes = ["annual", "sick", "unpaid", "emergency"];
  for (let i = 0; i < 20; i++) {
    const emp = randPick(activeEmps);
    const start = daysAgo(rand(1, 90));
    const end = new Date(start);
    end.setDate(end.getDate() + rand(1, 7));
    await db.insert(leaves).values({
      employeeId: emp.id,
      leaveType: randPick(leaveTypes),
      startDate: start,
      endDate: end,
      days: Math.ceil((end.getTime() - start.getTime()) / 864e5),
      reason: randPick(["\u0625\u062C\u0627\u0632\u0629 \u0633\u0646\u0648\u064A\u0629", "\u0645\u0631\u0636", "\u0638\u0631\u0648\u0641 \u0634\u062E\u0635\u064A\u0629", "\u0623\u062D\u062F \u0639\u0627\u0626\u0644\u064A"]),
      status: randPick(["approved", "approved", "approved", "pending", "rejected"])
    });
  }
  console.log(`  \u2713 20 leaves`);
  console.log("\u2B50 Seeding performance reviews...");
  for (let i = 0; i < 15; i++) {
    const emp = randPick(emps);
    await db.insert(performanceReviews).values({
      employeeId: emp.id,
      reviewerId: randPick(emps.filter((e) => e.id !== emp.id)).id,
      period: monthStr(rand(1, 6)),
      status: randPick(["completed", "completed", "pending"]),
      overallRating: rand(1, 5),
      communication: rand(1, 5),
      teamwork: rand(1, 5),
      productivity: rand(1, 5),
      punctuality: rand(1, 5),
      goals: randPick(["\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C\u064A\u0629", "\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u062C\u0648\u062F\u0629", "\u0627\u0644\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0645\u0647\u0646\u064A"]),
      comments: randPick(["\u0623\u062F\u0627\u0621 \u0645\u0645\u062A\u0627\u0632", "\u064A\u062D\u062A\u0627\u062C \u062A\u062D\u0633\u064A\u0646", "\u062C\u064A\u062F"]),
      completedAt: now()
    });
  }
  console.log(`  \u2713 15 reviews`);
  console.log("\u{1F4DD} Seeding job postings...");
  const jobTitles2 = ["\u062E\u064A\u0627\u0637 \u0645\u0627\u0647\u0631", "\u0641\u0646\u064A \u0635\u064A\u0627\u0646\u0629 \u0645\u0627\u0643\u064A\u0646\u0627\u062A", "\u0645\u0634\u0631\u0641 \u062C\u0648\u062F\u0629", "\u0645\u062D\u0627\u0633\u0628 \u062A\u0643\u0627\u0644\u064A\u0641", "\u0645\u0646\u062F\u0648\u0628 \u0645\u0628\u064A\u0639\u0627\u062A", "\u0639\u0627\u0645\u0644 \u0642\u0635", "\u0645\u0634\u0631\u0641 \u062E\u0637 \u0625\u0646\u062A\u0627\u062C", "\u0641\u0646\u064A IT", "\u0633\u0627\u0626\u0642 \u062A\u0648\u0635\u064A\u0644", "\u0623\u062E\u0635\u0627\u0626\u064A \u0645\u0648\u0627\u0631\u062F \u0628\u0634\u0631\u064A\u0629"];
  for (let i = 0; i < 10; i++) {
    await db.insert(jobPostings).values({
      title: jobTitles2[i],
      departmentId: randPick(depts).id,
      description: `\u0645\u0637\u0644\u0648\u0628 ${jobTitles2[i]} \u0628\u062E\u0628\u0631\u0629 ${rand(1, 5)} \u0633\u0646\u0648\u0627\u062A`,
      requirements: randPick(["\u062E\u0628\u0631\u0629 \u0641\u064A \u0627\u0644\u0645\u0635\u0627\u0646\u0639", "\u0645\u0624\u0647\u0644 \u0639\u0627\u0644\u064A", "\u0625\u062C\u0627\u062F\u0629 \u0627\u0644\u0625\u0643\u0633\u0644"]),
      salaryRange: `${rand(4e3, 8e3)} - ${rand(8e3, 15e3)}`,
      location: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629",
      employmentType: randPick(["full_time", "contract"]),
      status: randPick(["open", "open", "open", "closed"])
    });
  }
  console.log(`  \u2713 10 job postings`);
  console.log("\u{1F9D1}\u200D\u{1F4BC} Seeding candidates...");
  const jobs = await db.select().from(jobPostings);
  const candidateNames = ["\u0639\u0644\u064A \u062D\u0633\u0646", "\u0645\u062D\u0645\u062F \u0633\u0639\u064A\u062F", "\u062E\u0627\u0644\u062F \u0639\u0645\u0631", "\u0623\u062D\u0645\u062F \u0639\u0644\u064A", "\u064A\u0627\u0633\u0631 \u0645\u062D\u0645\u0648\u062F", "\u0647\u0628\u0629 \u0643\u0631\u064A\u0645", "\u0633\u062D\u0631 \u0623\u0634\u0631\u0641", "\u0646\u0627\u062F\u064A\u0629 \u0637\u0627\u0631\u0642", "\u0645\u0647\u0627 \u0639\u0627\u062F\u0644", "\u0644\u064A\u0644\u0649 \u0641\u0624\u0627\u062F", "\u0631\u0627\u0645\u064A \u062C\u0645\u0627\u0644", "\u0633\u064A\u0641 \u0639\u0628\u062F\u0627\u0644\u0644\u0647", "\u062F\u064A\u0646\u0627 \u0633\u0627\u0644\u0645", "\u0628\u0633\u0645\u0629 \u0639\u0627\u062F\u0644", "\u0637\u0627\u0631\u0642 \u0646\u0627\u062F\u0631", "\u0643\u0646\u0632\u064A \u0639\u0645\u0631", "\u0645\u0631\u064A\u0645 \u0633\u0627\u0645\u064A", "\u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u062D\u0633\u0646", "\u0646\u0648\u0631\u0647\u0627\u0646 \u0639\u0644\u064A", "\u062D\u0633\u0646 \u062E\u0627\u0644\u062F"];
  for (let i = 0; i < candidateNames.length; i++) {
    await db.insert(candidates).values({
      jobPostingId: randPick(jobs).id,
      fullName: candidateNames[i],
      email: `candidate${i}@email.com`,
      phone: `01${rand(0, 9)}${rand(1e7, 99999999)}`,
      stage: randPick(["applied", "screening", "interview", "interview", "offer", "hired", "rejected"]),
      rating: rand(1, 5),
      notes: randPick(["\u0645\u0645\u062A\u0627\u0632", "\u062C\u064A\u062F", "\u064A\u062D\u062A\u0627\u062C \u062A\u0642\u064A\u064A\u0645", ""])
    });
  }
  console.log(`  \u2713 20 candidates`);
  console.log("\u{1F550} Seeding shifts...");
  const shiftData = [
    { name: "\u0627\u0644\u0648\u0631\u062F\u064A\u0629 \u0627\u0644\u0635\u0628\u0627\u062D\u064A\u0629", startTime: "07:00", endTime: "15:00", daysOfWeek: "1,2,3,4,6" },
    { name: "\u0627\u0644\u0648\u0631\u062F\u064A\u0629 \u0627\u0644\u0645\u0633\u0627\u0626\u064A\u0629", startTime: "15:00", endTime: "23:00", daysOfWeek: "1,2,3,4,6" },
    { name: "\u0627\u0644\u0648\u0631\u062F\u064A\u0629 \u0627\u0644\u0644\u064A\u0644\u064A\u0629", startTime: "23:00", endTime: "07:00", daysOfWeek: "1,2,3,4,6" }
  ];
  for (const s of shiftData) await db.insert(shifts).values(s);
  const shiftRecs = await db.select().from(shifts);
  console.log(`  \u2713 3 shifts`);
  console.log("\u{1F4B0} Seeding payroll records...");
  for (const emp of emps) {
    await db.insert(payrollRecords).values({
      employeeId: emp.id,
      month: "2025-06",
      basicSalary: String(rand(3e3, 15e3)),
      bonus: String(rand(0, 2e3)),
      deductions: String(rand(0, 1e3)),
      netPay: String(rand(2500, 16e3)),
      status: "processed",
      processedAt: now()
    });
  }
  console.log(`  \u2713 ${emps.length} payroll records`);
  console.log("\u{1F4B8} Seeding advances...");
  for (let i = 0; i < 15; i++) {
    await db.insert(advances).values({
      employeeId: randPick(emps).id,
      amount: String(rand(500, 5e3)),
      reason: randPick(["\u0638\u0631\u0648\u0641 \u0637\u0627\u0631\u0626\u0629", "\u0645\u0635\u0627\u0631\u064A\u0641 \u0639\u0644\u0627\u062C", "\u0645\u0635\u0627\u0631\u064A\u0641 \u062F\u0631\u0627\u0633\u064A\u0629", ""]),
      status: randPick(["approved", "approved", "pending", "rejected"])
    });
  }
  console.log(`  \u2713 15 advances`);
  console.log("\u{1F381} Seeding bonuses & penalties...");
  for (let i = 0; i < 20; i++) {
    await db.insert(bonusPenalties).values({
      employeeId: randPick(emps).id,
      type: randPick(["bonus", "penalty"]),
      category: randPick(["\u062D\u0636\u0648\u0631", "\u0625\u0646\u062A\u0627\u062C", "\u062C\u0648\u062F\u0629", "\u0633\u0644\u0648\u0643", "\u0625\u0636\u0627\u0641\u064A"]),
      amount: String(rand(100, 2e3)),
      reason: randPick(["\u0645\u0643\u0627\u0641\u0623\u0629 \u062D\u0636\u0648\u0631", "\u062C\u0632\u0627\u0621 \u062A\u0623\u062E\u064A\u0631", "\u0645\u0643\u0627\u0641\u0623\u0629 \u0625\u0646\u062A\u0627\u062C", ""]),
      month: monthStr(rand(1, 6))
    });
  }
  console.log(`  \u2713 20 bonuses/penalties`);
  console.log("\u{1F3ED} Seeding production lines...");
  const lineData = [
    { name: "\u062E\u0637 \u0627\u0644\u062E\u064A\u0627\u0637\u0629 \u0623", lineType: "sewing", capacity: 50 },
    { name: "\u062E\u0637 \u0627\u0644\u062E\u064A\u0627\u0637\u0629 \u0628", lineType: "sewing", capacity: 45 },
    { name: "\u062E\u0637 \u0627\u0644\u0642\u0635", lineType: "cutting", capacity: 30 },
    { name: "\u062E\u0637 \u0627\u0644\u0643\u064A", lineType: "ironing", capacity: 40 },
    { name: "\u062E\u0637 \u0627\u0644\u062A\u063A\u0644\u064A\u0641", lineType: "packing", capacity: 60 }
  ];
  for (const l of lineData) await db.insert(productionLines).values(l);
  const lines = await db.select().from(productionLines);
  console.log(`  \u2713 ${lines.length} production lines`);
  console.log("\u{1F4E6} Seeding production orders...");
  const customers = ["H&M", "Zara", "Max", "LC Waikiki", "DeFacto", "Mango", "Pull&Bear", "Bershka"];
  const styles = ["\u062A\u064A\u0634\u064A\u0631\u062A", "\u0642\u0645\u064A\u0635", "\u0628\u0646\u0637\u0644\u0648\u0646", "\u062C\u0627\u0643\u062A", "\u0641\u0633\u062A\u0627\u0646", "\u062A\u0646\u0648\u0631\u0629", "\u0628\u0644\u0648\u0632\u0629", "\u0633\u0648\u064A\u062A \u0634\u064A\u0631\u062A"];
  for (let i = 0; i < 15; i++) {
    const qty = rand(500, 5e3);
    await db.insert(productionOrders).values({
      orderCode: `PO-${String(i + 1).padStart(4, "0")}`,
      styleName: `${randPick(styles)} ${randPick(["\u0635\u064A\u0641\u064A", "\u0634\u062A\u0648\u064A", "\u0631\u064A\u0627\u0636\u064A", "\u0643\u0644\u0627\u0633\u064A\u0643"])}`,
      customerName: randPick(customers),
      quantity: qty,
      completed: rand(0, qty),
      defected: rand(0, Math.floor(qty * 0.05)),
      lineId: randPick(lines).id,
      status: randPick(["in_progress", "in_progress", "pending", "completed", "completed"]),
      startDate: daysAgo(rand(1, 60)),
      endDate: daysAgo(rand(-30, 0)),
      priority: randPick(["normal", "normal", "high", "urgent"])
    });
  }
  const orders = await db.select().from(productionOrders);
  console.log(`  \u2713 ${orders.length} production orders`);
  console.log("\u{1F4CA} Seeding daily production...");
  for (let d = 0; d < 30; d++) {
    const date2 = daysAgo(d);
    if (date2.getDay() === 5) continue;
    for (const line of lines) {
      await db.insert(dailyProduction).values({
        lineId: line.id,
        orderId: randPick(orders).id,
        date: date2,
        produced: rand(50, 500),
        defected: rand(0, 20),
        reworked: rand(0, 10),
        workersCount: rand(10, line.capacity || 30),
        hoursWorked: String(rand(7, 9))
      });
    }
  }
  console.log(`  \u2713 Daily production seeded`);
  console.log("\u{1F457} Seeding production models...");
  const modelData = [
    { modelCode: "MDL-001", name: "\u062A\u064A\u0634\u064A\u0631\u062A \u0642\u0637\u0646", category: "\u0645\u0644\u0627\u0628\u0633 \u0639\u0644\u0648\u064A\u0629" },
    { modelCode: "MDL-002", name: "\u0642\u0645\u064A\u0635 \u0631\u0633\u0645\u064A", category: "\u0645\u0644\u0627\u0628\u0633 \u0631\u0633\u0645\u064A\u0629" },
    { modelCode: "MDL-003", name: "\u0628\u0646\u0637\u0644\u0648\u0646 \u062C\u064A\u0646\u0632", category: "\u0645\u0644\u0627\u0628\u0633 \u0633\u0641\u0644\u064A\u0629" },
    { modelCode: "MDL-004", name: "\u062C\u0627\u0643\u062A \u0634\u062A\u0648\u064A", category: "\u0645\u0639\u0627\u0637\u0641" },
    { modelCode: "MDL-005", name: "\u0641\u0633\u062A\u0627\u0646 \u0635\u064A\u0641\u064A", category: "\u0641\u0633\u0627\u062A\u064A\u0646" },
    { modelCode: "MDL-006", name: "\u0628\u0644\u0648\u0632\u0629 \u062D\u0631\u064A\u0645\u064A", category: "\u0645\u0644\u0627\u0628\u0633 \u0639\u0644\u0648\u064A\u0629" },
    { modelCode: "MDL-007", name: "\u0633\u0648\u064A\u062A \u0634\u064A\u0631\u062A", category: "\u0645\u0644\u0627\u0628\u0633 \u0631\u064A\u0627\u0636\u064A\u0629" },
    { modelCode: "MDL-008", name: "\u062A\u0646\u0648\u0631\u0629 \u0642\u0635\u064A\u0631\u0629", category: "\u0645\u0644\u0627\u0628\u0633 \u0633\u0641\u0644\u064A\u0629" },
    { modelCode: "MDL-009", name: "\u062C\u0627\u0643\u062A \u062C\u0644\u062F", category: "\u0645\u0639\u0627\u0637\u0641" },
    { modelCode: "MDL-010", name: "\u0628\u0646\u0637\u0644\u0648\u0646 \u0643\u0627\u062C\u0648\u0627\u0644", category: "\u0645\u0644\u0627\u0628\u0633 \u0633\u0641\u0644\u064A\u0629" }
  ];
  for (const m of modelData) await db.insert(productionModels).values(m);
  const models = await db.select().from(productionModels);
  console.log(`  \u2713 ${models.length} models`);
  console.log("\u{1F527} Seeding model stages...");
  const stageNames = ["\u0642\u0635", "\u062A\u062C\u0647\u064A\u0632", "\u062E\u064A\u0627\u0637\u0629", "\u0643\u064A", "\u062A\u0641\u062A\u064A\u0634", "\u062A\u063A\u0644\u064A\u0641"];
  for (const model of models) {
    for (let i = 0; i < stageNames.length; i++) {
      await db.insert(modelStages).values({
        modelId: model.id,
        name: stageNames[i],
        sequence: i + 1,
        unitPrice: String(rand(2, 15)),
        description: `\u0645\u0631\u062D\u0644\u0629 ${stageNames[i]}`
      });
    }
  }
  console.log(`  \u2713 Model stages seeded`);
  console.log("\u{1F4B5} Seeding piece rate records...");
  const pieceEmps = emps.filter((e) => e.salaryType === "piece_rate" || e.salaryType === "mixed");
  for (let i = 0; i < 50; i++) {
    const model = randPick(models);
    const qty = rand(10, 100);
    const price = rand(5, 20);
    await db.insert(pieceRateRecords).values({
      employeeId: randPick(pieceEmps).id,
      modelId: model.id,
      quantity: qty,
      unitPrice: String(price),
      totalAmount: String(qty * price),
      date: daysAgo(rand(0, 30))
    });
  }
  console.log(`  \u2713 50 piece rate records`);
  console.log("\u2699\uFE0F Seeding machines...");
  const machineData = [
    { machineCode: "MC-001", name: "\u0645\u0627\u0643\u064A\u0646\u0629 \u062E\u064A\u0627\u0637\u0629 Juki", type: "sewing", brand: "Juki", model: "DDL-8700" },
    { machineCode: "MC-002", name: "\u0645\u0627\u0643\u064A\u0646\u0629 \u062E\u064A\u0627\u0637\u0629 Brother", type: "sewing", brand: "Brother", model: "S-1000" },
    { machineCode: "MC-003", name: "\u0645\u0627\u0643\u064A\u0646\u0629 \u0623\u0648\u0641\u0631", type: "overlock", brand: "Juki", model: "MO-6700" },
    { machineCode: "MC-004", name: "\u0645\u0627\u0643\u064A\u0646\u0629 \u0642\u0635", type: "cutting", brand: "Eastman", model: "Chickadee" },
    { machineCode: "MC-005", name: "\u0645\u0643\u0648\u0627\u0629 \u0628\u062E\u0627\u0631", type: "ironing", brand: "Pony", model: "SP-500" },
    { machineCode: "MC-006", name: "\u0645\u0627\u0643\u064A\u0646\u0629 \u0632\u0631\u0627\u0631", type: "button", brand: "Juki", model: "MB-1800" },
    { machineCode: "MC-007", name: "\u0645\u0627\u0643\u064A\u0646\u0629 \u0639\u0631\u0627\u0648\u064A", type: "buttonhole", brand: "Juki", model: "LBH-780" },
    { machineCode: "MC-008", name: "\u0645\u0627\u0643\u064A\u0646\u0629 \u062A\u0637\u0631\u064A\u0632", type: "embroidery", brand: "Tajima", model: "TFMX" }
  ];
  for (const m of machineData) {
    await db.insert(machines).values({
      ...m,
      lineId: randPick(lines).id,
      purchaseDate: daysAgo(rand(100, 1e3)),
      cost: String(rand(5e3, 5e4)),
      status: randPick(["operational", "operational", "operational", "maintenance", "broken"]),
      nextMaintenance: daysAgo(rand(-30, 90))
    });
  }
  console.log(`  \u2713 ${machineData.length} machines`);
  console.log("\u{1F4E6} Seeding inventory...");
  const invItems = [
    { sku: "FAB-001", name: "\u0642\u0645\u0627\u0634 \u0642\u0637\u0646 \u0623\u0628\u064A\u0636", category: "fabric", unit: "\u0645\u062A\u0631", minStock: 100, reorderPoint: 150 },
    { sku: "FAB-002", name: "\u0642\u0645\u0627\u0634 \u0642\u0637\u0646 \u0623\u0633\u0648\u062F", category: "fabric", unit: "\u0645\u062A\u0631", minStock: 80, reorderPoint: 120 },
    { sku: "FAB-003", name: "\u0642\u0645\u0627\u0634 \u062C\u064A\u0646\u0632", category: "fabric", unit: "\u0645\u062A\u0631", minStock: 50, reorderPoint: 80 },
    { sku: "THR-001", name: "\u062E\u064A\u0637 \u0628\u0648\u0644\u064A\u0633\u062A\u0631", category: "thread", unit: "\u0628\u0643\u0631\u0629", minStock: 200, reorderPoint: 300 },
    { sku: "THR-002", name: "\u062E\u064A\u0637 \u0642\u0637\u0646", category: "thread", unit: "\u0628\u0643\u0631\u0629", minStock: 150, reorderPoint: 250 },
    { sku: "BTN-001", name: "\u0632\u0631\u0627\u0631 \u0623\u0628\u064A\u0636 \u0635\u063A\u064A\u0631", category: "button", unit: "\u0639\u0644\u0628\u0629", minStock: 50, reorderPoint: 100 },
    { sku: "BTN-002", name: "\u0632\u0631\u0627\u0631 \u0623\u0633\u0648\u062F \u0643\u0628\u064A\u0631", category: "button", unit: "\u0639\u0644\u0628\u0629", minStock: 40, reorderPoint: 80 },
    { sku: "ZIP-001", name: "\u0633\u062D\u0627\u0628 \u0645\u0639\u062F\u0646\u064A", category: "zipper", unit: "\u0645\u062A\u0631", minStock: 100, reorderPoint: 150 },
    { sku: "LBL-001", name: "\u062A\u064A\u0643\u062A \u0642\u064A\u0627\u0633", category: "label", unit: "\u0644\u0641\u0629", minStock: 30, reorderPoint: 50 },
    { sku: "PKG-001", name: "\u0643\u064A\u0633 \u0628\u0644\u0627\u0633\u062A\u064A\u0643", category: "packaging", unit: "\u062D\u0632\u0645\u0629", minStock: 500, reorderPoint: 1e3 }
  ];
  for (const item of invItems) {
    await db.insert(inventoryItems).values({
      ...item,
      quantity: rand(item.minStock || 0, (item.minStock || 0) * 5),
      unitCost: String(rand(5, 100)),
      status: "in_stock"
    });
  }
  console.log(`  \u2713 ${invItems.length} inventory items`);
  console.log("\u{1F69A} Seeding suppliers...");
  const supData = [
    { name: "\u0627\u0644\u0646\u064A\u0644 \u0644\u0644\u0623\u0642\u0645\u0634\u0629", contactPerson: "\u0645\u062D\u0645\u062F \u0627\u0644\u0646\u064A\u0644", phone: "0123456789", email: "nile@fabrics.com" },
    { name: "\u0645\u0635\u0631 \u0644\u0644\u062E\u064A\u0648\u0637", contactPerson: "\u0623\u062D\u0645\u062F \u0633\u0639\u064A\u062F", phone: "0111222333", email: "egypt@threads.com" },
    { name: "\u0627\u0644\u0639\u0628\u0648\u0631 \u0644\u0644\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A", contactPerson: "\u062E\u0627\u0644\u062F \u0639\u0628\u0648\u0631", phone: "0155566677", email: "alabour@acc.com" },
    { name: "\u0627\u0644\u0633\u0648\u064A\u0633 \u0644\u0644\u062A\u0639\u0628\u0626\u0629", contactPerson: "\u0639\u0645\u0631\u0648 \u0627\u0644\u0633\u0648\u064A\u0633", phone: "0199988877", email: "suez@pkg.com" },
    { name: "\u0627\u0644\u0645\u062D\u0644\u0629 \u0644\u0644\u0642\u0637\u0646", contactPerson: "\u0645\u062D\u0645\u0648\u062F \u0627\u0644\u0645\u062D\u0644\u0629", phone: "0177766655", email: "mahalla@cotton.com" }
  ];
  for (const s of supData) await db.insert(suppliers).values(s);
  console.log(`  \u2713 ${supData.length} suppliers`);
  console.log("\u{1F454} Seeding CRM customers...");
  const custData = [
    { name: "H&M Egypt", contactPerson: "Anna Karlsson", phone: "02-1234567", email: "procurement@hm.eg", city: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629", customerType: "wholesale" },
    { name: "Zara Egypt", contactPerson: "Maria Garcia", phone: "02-2345678", email: "buying@zara.eg", city: "\u0627\u0644\u062C\u064A\u0632\u0629", customerType: "wholesale" },
    { name: "Max Fashion", contactPerson: "John Smith", phone: "02-3456789", email: "orders@max.eg", city: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629", customerType: "corporate" },
    { name: "LC Waikiki", contactPerson: "Ay\u015Fe Y\u0131lmaz", phone: "02-4567890", email: "supply@lcw.eg", city: "\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629", customerType: "wholesale" },
    { name: "DeFacto", contactPerson: "Mehmet Kaya", phone: "02-5678901", email: "buying@defacto.eg", city: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629", customerType: "wholesale" }
  ];
  for (const c of custData) await db.insert(crmCustomers).values(c);
  const crmCusts = await db.select().from(crmCustomers);
  console.log(`  \u2713 ${crmCusts.length} customers`);
  console.log("\u{1F6D2} Seeding sales orders...");
  for (let i = 0; i < 20; i++) {
    const qty = rand(100, 2e3);
    const price = rand(50, 300);
    await db.insert(salesOrders).values({
      orderNumber: `SO-${String(i + 1).padStart(4, "0")}`,
      customerId: randPick(crmCusts).id,
      modelId: randPick(models).id,
      quantity: qty,
      unitPrice: String(price),
      totalAmount: String(qty * price),
      status: randPick(["pending", "confirmed", "in_production", "ready", "shipped", "delivered"]),
      orderDate: daysAgo(rand(1, 90)),
      deliveryDate: daysAgo(rand(-30, 60))
    });
  }
  console.log(`  \u2713 20 sales orders`);
  console.log("\u{1F3ED} Seeding warehouses...");
  const whData = [
    { code: "WH-01", name: "\u0645\u0633\u062A\u0648\u062F\u0639 \u0627\u0644\u062E\u0627\u0645\u0627\u062A", type: "raw_material", isDefault: true },
    { code: "WH-02", name: "\u0645\u0633\u062A\u0648\u062F\u0639 \u0627\u0644\u0645\u0646\u062A\u062C \u0627\u0644\u0646\u0647\u0627\u0626\u064A", type: "finished_goods" },
    { code: "WH-03", name: "\u0645\u0633\u062A\u0648\u062F\u0639 WIP", type: "work_in_progress" }
  ];
  for (const w of whData) await db.insert(warehouses).values(w);
  const whs = await db.select().from(warehouses);
  console.log(`  \u2713 ${whs.length} warehouses`);
  console.log("\u{1F5A8}\uFE0F Seeding print settings...");
  await db.insert(printSettings).values({
    companyName: "\u0645\u0635\u0646\u0639 \u0647\u0648\u0631\u0627\u064A\u0632\u0646 \u0644\u0644\u0645\u0644\u0627\u0628\u0633 \u0627\u0644\u062C\u0627\u0647\u0632\u0629",
    address: "\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629\u060C \u0627\u0644\u0639\u0627\u0634\u0631 \u0645\u0646 \u0631\u0645\u0636\u0627\u0646\u060C \u0627\u0644\u0634\u0631\u0642\u064A\u0629",
    phone: "015-555-7890",
    email: "info@horizon-factory.com",
    taxNumber: "123-456-789",
    headerText: "\u0645\u0635\u0646\u0639 \u0647\u0648\u0631\u0627\u064A\u0632\u0646 - \u0645\u0644\u0627\u0628\u0633 \u062C\u0627\u0647\u0632\u0629 \u0628\u062C\u0648\u062F\u0629 \u0639\u0627\u0644\u0645\u064A\u0629",
    footerText: "\u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0639\u0627\u0645\u0644\u0643\u0645 \u0645\u0639\u0646\u0627"
  });
  console.log(`  \u2713 Print settings`);
  console.log("\u2699\uFE0F Seeding system settings...");
  const settings = [
    { key: "factory_name", value: "Horizon Garment Factory" },
    { key: "factory_code", value: "HGF-001" },
    { key: "timezone", value: "Africa/Cairo" },
    { key: "currency", value: "EGP" },
    { key: "language", value: "ar" }
  ];
  for (const s of settings) await db.insert(systemSettings).values(s);
  console.log(`  \u2713 System settings`);
  console.log("\u{1F4D0} Seeding tech packs...");
  for (const model of models.slice(0, 5)) {
    await db.insert(techPacks).values({
      modelId: model.id,
      packNumber: `TP-${model.modelCode}`,
      version: "1.0",
      description: `Tech pack \u0644\u0640 ${model.name}`,
      fabricSpecs: "100% \u0642\u0637\u0646\u060C 180 \u062C\u0631\u0627\u0645/\u0645\xB2",
      trimSpecs: "\u0623\u0632\u0631\u0627\u0631 \u0628\u0644\u0627\u0633\u062A\u064A\u0643\u060C \u0633\u062D\u0627\u0628 \u0645\u0639\u062F\u0646\u064A",
      measurementChart: "S:\u0635\u062F\u0631 96\u060C M:\u0635\u062F\u0631 100\u060C L:\u0635\u062F\u0631 104",
      status: "approved"
    });
  }
  console.log(`  \u2713 5 tech packs`);
  console.log("\u{1F9F5} Seeding fabric rolls...");
  const sups = await db.select().from(suppliers);
  const rollColors = ["\u0623\u0628\u064A\u0636", "\u0623\u0633\u0648\u062F", "\u0623\u062D\u0645\u0631", "\u0623\u0632\u0631\u0642", "\u0631\u0645\u0627\u062F\u064A", "\u0628\u064A\u062C", "\u0643\u062D\u0644\u064A"];
  for (let i = 0; i < 15; i++) {
    await db.insert(fabricRolls).values({
      rollNumber: `RL-${String(i + 1).padStart(4, "0")}`,
      lotNumber: `LOT-${String(rand(1, 100)).padStart(3, "0")}`,
      supplierId: randPick(sups).id,
      fabricType: randPick(["\u0642\u0637\u0646", "\u0628\u0648\u0644\u064A\u0633\u062A\u0631", "\u0643\u062A\u0627\u0646", "\u062C\u064A\u0646\u0632", "\u0641\u064A\u0633\u0643\u0648\u0632"]),
      color: randPick(rollColors),
      width: String(rand(140, 180)),
      length: String(rand(50, 200)),
      weight: String(rand(10, 50)),
      receivedDate: daysAgo(rand(1, 90)),
      status: randPick(["available", "available", "in_use"])
    });
  }
  console.log(`  \u2713 15 fabric rolls`);
  console.log("\u23F1\uFE0F Seeding SAM records...");
  const operations = ["\u0642\u0635 \u0627\u0644\u0642\u0645\u0627\u0634", "\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0642\u0637\u0639", "\u062E\u064A\u0627\u0637\u0629 \u0627\u0644\u0643\u062A\u0641", "\u062E\u064A\u0627\u0637\u0629 \u0627\u0644\u062C\u0627\u0646\u0628", "\u062A\u0631\u0643\u064A\u0628 \u0627\u0644\u064A\u0627\u0642\u0629", "\u062A\u0631\u0643\u064A\u0628 \u0627\u0644\u0643\u0645", "\u062E\u064A\u0627\u0637\u0629 \u0627\u0644\u0623\u0633\u0641\u0644", "\u0643\u064A", "\u062A\u0641\u062A\u064A\u0634", "\u062A\u063A\u0644\u064A\u0641"];
  for (const model of models.slice(0, 3)) {
    for (const op of operations) {
      const sam = rand(0.5, 5);
      await db.insert(samRecords).values({
        modelId: model.id,
        operationName: op,
        samMinutes: String(sam),
        targetPerHour: Math.round(60 / sam),
        effectiveSam: String(sam * 1.15)
      });
    }
  }
  console.log(`  \u2713 SAM records seeded`);
  console.log("\u{1F3A8} Seeding style-color-size matrix...");
  const colors = ["\u0623\u0628\u064A\u0636", "\u0623\u0633\u0648\u062F", "\u0623\u062D\u0645\u0631", "\u0623\u0632\u0631\u0642", "\u0631\u0645\u0627\u062F\u064A"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  for (const model of models.slice(0, 3)) {
    for (const color of colors) {
      for (let i = 0; i < sizes.length; i++) {
        await db.insert(styleColorSizeMatrix).values({
          modelId: model.id,
          styleCode: `${model.modelCode}-${color}`,
          color,
          size: sizes[i],
          sizeOrder: i + 1,
          quantity: rand(100, 500),
          unitPrice: String(rand(80, 300)),
          barcode: `${model.modelCode}${color.charCodeAt(0)}${sizes[i]}`
        });
      }
    }
  }
  console.log(`  \u2713 Style-color-size matrix seeded`);
  console.log("\u{1F4C8} Seeding production forecasts...");
  for (let i = 0; i < 10; i++) {
    await db.insert(productionForecasts).values({
      modelId: randPick(models).id,
      lineId: randPick(lines).id,
      forecastType: randPick(["demand", "capacity", "material"]),
      period: monthStr(rand(1, 12)),
      predictedValue: String(rand(1e3, 1e4)),
      confidence: String(rand(70, 95)),
      algorithm: "linear_regression"
    });
  }
  console.log(`  \u2713 10 forecasts`);
  console.log("\u{1F4CB} Seeding audit log...");
  const tables = ["employees", "departments", "productionOrders", "inventoryItems", "salesOrders"];
  const actions = ["INSERT", "UPDATE", "DELETE"];
  for (let i = 0; i < 20; i++) {
    await db.insert(auditLog).values({
      tableName: randPick(tables),
      recordId: rand(1, 100),
      action: randPick(actions),
      changedByName: randPick(emps).fullName,
      oldValues: JSON.stringify({ status: "old" }),
      newValues: JSON.stringify({ status: "new" })
    });
  }
  console.log(`  \u2713 20 audit log entries`);
  console.log("\u{1F528} Seeding work orders...");
  for (let i = 0; i < 15; i++) {
    const qty = rand(100, 1e3);
    await db.insert(workOrders).values({
      orderNumber: `WO-${String(i + 1).padStart(4, "0")}`,
      productionOrderId: randPick(orders).id,
      modelId: randPick(models).id,
      lineId: randPick(lines).id,
      quantity: qty,
      completed: rand(0, qty),
      status: randPick(["in_progress", "pending", "completed"]),
      priority: randPick(["normal", "high"])
    });
  }
  console.log(`  \u2713 15 work orders`);
  console.log("\u{1F4E6} Seeding bundles...");
  for (let i = 0; i < 30; i++) {
    await db.insert(bundles).values({
      bundleCode: `BN-${String(i + 1).padStart(5, "0")}`,
      modelId: randPick(models).id,
      size: randPick(sizes),
      color: randPick(colors),
      quantity: rand(10, 50),
      currentStage: randPick(stageNames),
      status: randPick(["cutting", "sewing", "ironing", "qc", "packed"])
    });
  }
  console.log(`  \u2713 30 bundles`);
  console.log("\u2705 Seeding QC records...");
  for (let i = 0; i < 20; i++) {
    const checked = rand(50, 200);
    const passed = Math.floor(checked * rand(85, 99) / 100);
    await db.insert(qcRecords).values({
      orderId: randPick(orders).id,
      stage: randPick(["inline", "input", "output", "final"]),
      checkedQuantity: checked,
      passedQuantity: passed,
      defectedQuantity: checked - passed,
      date: daysAgo(rand(1, 30))
    });
  }
  console.log(`  \u2713 20 QC records`);
  console.log("\u{1F455} Seeding finished goods...");
  const finishedGoodsWH = whs.find((w) => w.type === "finished_goods") || whs[1];
  const finishedGoodsData = [
    { sku: "FG-001", modelId: models[0].id, modelName: models[0].name, color: "\u0623\u0628\u064A\u0636", size: "M", quantity: 500, availableQty: 450, reservedQty: 50, unitCost: "45.00", sellingPrice: "85.00", status: "in_stock", warehouseId: finishedGoodsWH.id },
    { sku: "FG-002", modelId: models[1].id, modelName: models[1].name, color: "\u0623\u0632\u0631\u0642", size: "L", quantity: 300, availableQty: 300, reservedQty: 0, unitCost: "60.00", sellingPrice: "110.00", status: "in_stock", warehouseId: finishedGoodsWH.id },
    { sku: "FG-003", modelId: models[2].id, modelName: models[2].name, color: "\u0623\u0633\u0648\u062F", size: "XL", quantity: 400, availableQty: 380, reservedQty: 20, unitCost: "75.00", sellingPrice: "135.00", status: "in_stock", warehouseId: finishedGoodsWH.id },
    { sku: "FG-004", modelId: models[3].id, modelName: models[3].name, color: "\u0631\u0645\u0627\u062F\u064A", size: "S", quantity: 200, availableQty: 200, reservedQty: 0, unitCost: "90.00", sellingPrice: "160.00", status: "in_stock", warehouseId: finishedGoodsWH.id },
    { sku: "FG-005", modelId: models[4].id, modelName: models[4].name, color: "\u0623\u062D\u0645\u0631", size: "M", quantity: 150, availableQty: 120, reservedQty: 30, unitCost: "55.00", sellingPrice: "95.00", status: "in_stock", warehouseId: finishedGoodsWH.id }
  ];
  for (const fg of finishedGoodsData) {
    await db.insert(finishedGoods).values(fg);
    await db.insert(inventoryItems).values({
      sku: fg.sku,
      name: fg.modelName,
      category: "finished_goods",
      unit: "\u0642\u0637\u0639\u0629",
      quantity: fg.quantity,
      minStock: 50,
      reorderPoint: 100,
      unitCost: fg.unitCost,
      status: "in_stock"
    });
  }
  console.log(`  \u2713 5 finished goods seeded`);
  console.log("\u{1F6E0}\uFE0F Seeding BOM and MRP Records...");
  const rawMaterials = await db.select().from(inventoryItems).where(import_drizzle_orm2.sql`category != 'finished_goods'`);
  const seededModels = await db.select().from(productionModels);
  const seededOrders = await db.select().from(productionOrders);
  for (const model of seededModels.slice(0, 5)) {
    const material1 = rawMaterials[rand(0, 4)];
    const material2 = rawMaterials[rand(5, 9)];
    if (material1 && material2) {
      await db.insert(bomRecords).values({
        modelId: model.id,
        itemId: material1.id,
        quantity: "1.500",
        unit: material1.unit,
        notes: "\u0645\u0627\u062F\u0629 \u0623\u0633\u0627\u0633\u064A\u0629"
      });
      await db.insert(bomRecords).values({
        modelId: model.id,
        itemId: material2.id,
        quantity: "0.250",
        unit: material2.unit,
        notes: "\u0645\u0627\u062F\u0629 \u0645\u0633\u0627\u0639\u062F\u0629"
      });
    }
  }
  for (const order of seededOrders.slice(0, 2)) {
    const material = rawMaterials[rand(0, 9)];
    if (material) {
      await db.insert(mrpRecords).values({
        productionOrderId: order.id,
        itemId: material.id,
        requiredQuantity: order.quantity * 2,
        availableQuantity: material.quantity || 100,
        shortage: Math.max(0, order.quantity * 2 - (material.quantity || 0)),
        status: (material.quantity || 0) >= order.quantity * 2 ? "available" : "shortage"
      });
    }
  }
  console.log(`  \u2713 BOM and MRP records seeded`);
  console.log("\u{1F4D3} Seeding General Ledger Journal Entry...");
  const cashAccount = dbAccts.find((a) => a.code === "110000");
  const capitalAccount = dbAccts.find((a) => a.code === "310000");
  if (cashAccount && capitalAccount) {
    const entryId = "JV-2025-001";
    const entryDate = /* @__PURE__ */ new Date();
    await db.insert(generalLedger).values({
      entryId,
      lineNumber: 1,
      date: entryDate,
      accountId: cashAccount.id,
      debit: "100000.00",
      credit: "0.00",
      sourceType: "manual_journal",
      description: "\u0625\u064A\u062F\u0627\u0639 \u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 \u0627\u0644\u0646\u0642\u062F\u064A \u0627\u0644\u0627\u0641\u062A\u062A\u0627\u062D\u064A \u0641\u064A \u0627\u0644\u062E\u0632\u064A\u0646\u0629",
      fiscalYear: "2025",
      period: "06-2025"
    });
    await db.insert(generalLedger).values({
      entryId,
      lineNumber: 2,
      date: entryDate,
      accountId: capitalAccount.id,
      debit: "0.00",
      credit: "100000.00",
      sourceType: "manual_journal",
      description: "\u0625\u064A\u062F\u0627\u0639 \u0631\u0623\u0633 \u0627\u0644\u0645\u0627\u0644 \u0627\u0644\u0646\u0642\u062F\u064A \u0627\u0644\u0627\u0641\u062A\u062A\u0627\u062D\u064A \u0641\u064A \u0627\u0644\u062E\u0632\u064A\u0646\u0629",
      fiscalYear: "2025",
      period: "06-2025"
    });
    console.log(`  \u2713 GL Entry JV-2025-001 created (Balanced: 100,000)`);
  }
  const seededSuppliers = await db.select().from(suppliers);
  const mockColors = ["\u0623\u0628\u064A\u0636", "\u0623\u0633\u0648\u062F", "\u0623\u062D\u0645\u0631", "\u0623\u0632\u0631\u0642", "\u0631\u0645\u0627\u062F\u064A"];
  const mockSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  console.log("\u{1F464} Seeding system users...");
  await db.insert(users).values({ unionId: "usr_1", name: "\u0623\u062D\u0645\u062F \u0627\u0644\u0645\u0633\u0624\u0648\u0644", email: "admin@horizon.eg", role: "admin" });
  await db.insert(users).values({ unionId: "usr_2", name: "\u0645\u062D\u0645\u062F \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645", email: "user@horizon.eg", role: "user" });
  console.log("\u{1F550} Seeding shift assignments...");
  for (const emp of emps) {
    await db.insert(shiftAssignments).values({
      employeeId: emp.id,
      shiftId: randPick(shiftRecs).id,
      startDate: daysAgo(30)
    });
  }
  console.log("\u{1F4E6} Seeding inventory transactions...");
  const seededInvItems = await db.select().from(inventoryItems);
  for (const item of seededInvItems) {
    await db.insert(inventoryTransactions).values({
      itemId: item.id,
      type: "in",
      quantity: item.quantity || 100,
      notes: "\u0631\u0635\u064A\u062F \u0627\u0641\u062A\u062A\u0627\u062D\u064A \u0644\u0644\u0645\u062E\u0632\u0646",
      createdAt: daysAgo(30)
    });
  }
  console.log("\u{1F69A} Seeding supply orders...");
  const rawMaterialsOnly = seededInvItems.filter((i) => i.category !== "finished_goods");
  for (let i = 0; i < 10; i++) {
    const supplier = randPick(seededSuppliers);
    const orderNum = `SPO-${String(i + 1).padStart(4, "0")}`;
    await db.insert(supplyOrders).values({
      orderNumber: orderNum,
      supplierId: supplier.id,
      status: randPick(["received", "sent", "partial"]),
      totalAmount: "5000.00",
      expectedDate: daysAgo(-5),
      receivedDate: daysAgo(2)
    });
    const order = (await db.select().from(supplyOrders).where(import_drizzle_orm2.sql`orderNumber = ${orderNum}`))[0];
    const item1 = randPick(rawMaterialsOnly);
    if (order && item1) {
      await db.insert(supplyOrderItems).values({
        supplyOrderId: order.id,
        itemId: item1.id,
        quantity: rand(100, 500),
        unitPrice: item1.unitCost || "10.00",
        receivedQuantity: rand(50, 100)
      });
    }
  }
  console.log("\u2702\uFE0F Seeding cutting orders...");
  const cuttingEmps = emps.filter((e) => e.jobTitle.includes("\u0642\u0635") || e.role === "\u0639\u0627\u0645\u0644");
  const cutWorker = cuttingEmps[0] || emps[0];
  for (let i = 0; i < 15; i++) {
    const model = randPick(models);
    await db.insert(cuttingOrders).values({
      orderNumber: `CO-${String(i + 1).padStart(4, "0")}`,
      modelId: model.id,
      fabricDescription: "\u062E\u0627\u0645\u0629 \u0642\u0637\u0646 \u0645\u0645\u062A\u0627\u0632\u0629",
      color: randPick(mockColors),
      size: randPick(mockSizes),
      quantity: rand(500, 2e3),
      cutQuantity: rand(100, 500),
      status: randPick(["cutting", "completed", "pending"]),
      assignedTo: cutWorker.id,
      dueDate: daysAgo(-10)
    });
  }
  console.log("\u{1F4CD} Seeding bundle tracking...");
  const seededBundles = await db.select().from(bundles);
  for (const bundle of seededBundles.slice(0, 10)) {
    await db.insert(bundleTracking).values({
      bundleId: bundle.id,
      stage: bundle.currentStage || "\u0642\u0635",
      employeeId: randPick(emps).id,
      notes: "\u062A\u0645 \u0627\u0644\u0641\u062D\u0635 \u0648\u0627\u0644\u0645\u0633\u062D \u0628\u0646\u062C\u0627\u062D"
    });
  }
  console.log("\u{1F69B} Seeding challans...");
  for (let i = 0; i < 10; i++) {
    const challanNum = `CH-${String(i + 1).padStart(4, "0")}`;
    await db.insert(challans).values({
      challanNumber: challanNum,
      type: "dispatch",
      customerName: randPick(crmCusts).name,
      totalItems: rand(100, 500),
      status: randPick(["shipped", "delivered", "ready"]),
      vehicleNumber: "\u0642 \u0635 \u0623 1234",
      driverName: "\u0633\u064A\u062F \u0623\u0628\u0648 \u0627\u0644\u0639\u0644\u0627",
      shippedAt: daysAgo(2)
    });
    const challan = (await db.select().from(challans).where(import_drizzle_orm2.sql`challanNumber = ${challanNum}`))[0];
    if (challan) {
      await db.insert(challanItems).values({
        challanId: challan.id,
        description: "\u062A\u064A\u0634\u064A\u0631\u062A\u0627\u062A \u0645\u0639\u0628\u0623\u0629",
        quantity: rand(100, 500)
      });
    }
  }
  console.log("\u{1F91D} Seeding subcontracting contracts...");
  for (let i = 0; i < 10; i++) {
    const supplier = randPick(seededSuppliers);
    await db.insert(subcontracts).values({
      contractNumber: `SC-${String(i + 1).padStart(4, "0")}`,
      supplierId: supplier.id,
      modelId: randPick(models).id,
      description: "\u062A\u0641\u0635\u064A\u0644 \u062E\u064A\u0627\u0637\u0629 \u0648\u062A\u062C\u0647\u064A\u0632 \u0639\u064A\u0646\u0627\u062A \u0639\u0627\u062C\u0644\u0629",
      quantity: rand(500, 2e3),
      receivedQuantity: rand(100, 500),
      unitPrice: "15.00",
      totalAmount: "15000.00",
      status: randPick(["in_progress", "completed", "pending"]),
      startDate: daysAgo(10),
      endDate: daysAgo(-10)
    });
  }
  console.log("\u{1F4DE} Seeding CRM interactions...");
  for (const customer of crmCusts) {
    await db.insert(crmInteractions).values({
      customerId: customer.id,
      type: randPick(["call", "meeting", "email"]),
      subject: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0637\u0644\u0628\u064A\u0629 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A",
      content: "\u062A\u0645 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0639\u0645\u064A\u0644 \u0648\u0623\u0641\u0627\u062F \u0628\u0631\u063A\u0628\u062A\u0647 \u0641\u064A \u0632\u064A\u0627\u062F\u0629 \u0643\u0645\u064A\u0629 \u0627\u0644\u0637\u0644\u0628\u064A\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0628\u0646\u0633\u0628\u0629 20%",
      followUpDate: daysAgo(-7),
      createdBy: randPick(emps).id
    });
  }
  console.log("\u{1F4CA} Seeding cost calculations...");
  for (const model of models) {
    await db.insert(costCalculations).values({
      modelId: model.id,
      fabricCost: "25.00",
      laborCost: "15.00",
      overheadCost: "10.00",
      trimCost: "5.00",
      otherCost: "5.00",
      totalCost: "60.00",
      profitMargin: "25.00",
      sellingPrice: "75.00",
      minOrderQuantity: 100,
      notes: "\u062D\u0633\u0627\u0628 \u062A\u0643\u0644\u0641\u0629 \u062A\u0642\u062F\u064A\u0631\u064A \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u0639\u064A\u0646\u0627\u062A \u0627\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u0645\u0627\u0636\u064A"
    });
  }
  console.log("\u{1F504} Seeding product lifecycle stages...");
  const lifecycleStages = ["concept", "design", "tech_pack", "sampling", "costing", "production"];
  for (const model of models.slice(0, 5)) {
    for (let sIdx = 0; sIdx < lifecycleStages.length; sIdx++) {
      await db.insert(productLifecycle).values({
        modelId: model.id,
        stage: lifecycleStages[sIdx],
        stageOrder: sIdx + 1,
        status: sIdx < 4 ? "completed" : sIdx === 4 ? "in_progress" : "pending",
        assignedTo: randPick(emps).id,
        startDate: daysAgo(15 - sIdx * 2),
        targetDate: daysAgo(-5)
      });
    }
  }
  console.log("\u{1F4D0} Seeding design revisions and sample reviews...");
  const seededTechPacks = await db.select().from(techPacks);
  for (const tp of seededTechPacks) {
    await db.insert(designRevisions).values({
      modelId: tp.modelId,
      techPackId: tp.id,
      revisionNumber: "1.1",
      changeDescription: "\u062A\u0639\u062F\u064A\u0644 \u0637\u0648\u0644 \u0627\u0644\u0643\u0645 \u0628\u0645\u0642\u062F\u0627\u0631 2 \u0633\u0645 \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u0637\u0644\u0628 \u0627\u0644\u0639\u0645\u064A\u0644",
      status: "approved"
    });
    await db.insert(sampleReviews).values({
      modelId: tp.modelId,
      techPackId: tp.id,
      sampleType: "fit",
      size: "M",
      color: "\u0623\u0632\u0631\u0642",
      reviewerName: "\u062C\u0648\u0646 \u062F\u0648",
      reviewDate: daysAgo(5),
      comments: "\u0627\u0644\u0642\u064A\u0627\u0633\u0627\u062A \u0645\u0645\u062A\u0627\u0632\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A",
      decision: "approved",
      status: "decided"
    });
  }
  console.log("\u{1F3ED} Seeding warehouse bins...");
  for (const wh of whs) {
    for (let r = 1; r <= 3; r++) {
      await db.insert(warehouseBins).values({
        warehouseId: wh.id,
        binCode: `BIN-${wh.code}-R${r}`,
        aisle: "A",
        rack: String(r),
        shelf: "1",
        capacity: 1e3,
        currentQty: 100,
        status: "partial"
      });
    }
  }
  console.log("\u{1F514} Seeding inventory reorder rules...");
  for (const item of rawMaterialsOnly.slice(0, 5)) {
    await db.insert(reorderRules).values({
      itemId: item.id,
      warehouseId: whs[0].id,
      supplierId: randPick(seededSuppliers).id,
      minStock: 100,
      maxStock: 1e3,
      reorderPoint: 200,
      reorderQty: 500,
      autoReorder: true,
      status: "active"
    });
  }
  console.log("\u{1F4D0} Seeding cut plans and marker plans...");
  for (let i = 0; i < 5; i++) {
    const order = randPick(orders);
    const model = randPick(models);
    const planNum = `CP-${String(i + 1).padStart(4, "0")}`;
    await db.insert(cutPlans).values({
      planNumber: planNum,
      orderId: order.id,
      modelId: model.id,
      layCount: 50,
      plyHeight: 10,
      spreadType: "face_up",
      totalPieces: 500,
      status: "planned"
    });
    const plan = (await db.select().from(cutPlans).where(import_drizzle_orm2.sql`planNumber = ${planNum}`))[0];
    if (plan) {
      await db.insert(markerPlans).values({
        markerNumber: `MP-${plan.planNumber}`,
        cutPlanId: plan.id,
        modelId: plan.modelId,
        markerLength: "6.50",
        markerWidth: "1.50",
        fabricUtilization: "85.50",
        piecesPerMarker: 4,
        status: "approved"
      });
    }
  }
  console.log("\u{1F4C8} Seeding line balancing configurations...");
  for (const line of lines) {
    const model = randPick(models);
    await db.insert(lineBalancing).values({
      lineId: line.id,
      modelId: model.id,
      operationSequence: 1,
      operationName: "\u062E\u064A\u0627\u0637\u0629 \u0627\u0644\u0643\u062A\u0641",
      samMinutes: "1.20",
      workstations: 2,
      operators: 2,
      targetOutput: 400,
      actualOutput: 380,
      efficiency: "95.00",
      bottleneck: false
    });
  }
  console.log("\u{1F4BB} Seeding buyer portal users...");
  for (const customer of crmCusts) {
    await db.insert(buyerPortalUsers).values({
      customerId: customer.id,
      fullName: `\u0645\u0634\u062A\u0631\u064A \u0645\u0646 ${customer.name}`,
      email: `buyer@${customer.email?.split("@")[1] || "buyer.eg"}`,
      password: "password_hash",
      role: "buyer_admin",
      status: "active"
    });
  }
  console.log("\u{1F6D2} Seeding purchase requests...");
  for (let i = 0; i < 5; i++) {
    const prNum = `PR-${String(i + 1).padStart(4, "0")}`;
    await db.insert(purchaseRequests).values({
      prNumber: prNum,
      department: "\u0627\u0644\u062E\u064A\u0627\u0637\u0629",
      requestedBy: "\u0623\u062D\u0645\u062F \u0637\u0644\u0628\u0627\u062A",
      status: randPick(["approved", "pending_approval", "draft"]),
      priority: "normal",
      requiredDate: daysAgo(-15)
    });
    const pr = (await db.select().from(purchaseRequests).where(import_drizzle_orm2.sql`prNumber = ${prNum}`))[0];
    if (pr) {
      await db.insert(purchaseRequestItems).values({
        purchaseRequestId: pr.id,
        itemId: randPick(rawMaterialsOnly).id,
        quantity: rand(100, 1e3),
        notes: "\u0645\u0637\u0644\u0648\u0628 \u0644\u0644\u0625\u0646\u062A\u0627\u062C \u0627\u0644\u0645\u0633\u062A\u0642\u0628\u0644\u064A"
      });
    }
  }
  const seededPRs = await db.select().from(purchaseRequests);
  console.log("\u{1F4E6} Seeding purchase orders...");
  for (let i = 0; i < 5; i++) {
    const supplier = randPick(seededSuppliers);
    const pr = seededPRs[i] || seededPRs[0];
    const poNum = `PO-${String(i + 1).padStart(4, "0")}`;
    await db.insert(purchaseOrders).values({
      poNumber: poNum,
      supplierId: supplier.id,
      purchaseRequestId: pr?.id || null,
      orderDate: daysAgo(10),
      expectedDeliveryDate: daysAgo(-10),
      subtotal: "15000.00",
      totalAmount: "17100.00",
      status: randPick(["confirmed", "sent", "draft"]),
      paymentTerms: "30 \u064A\u0648\u0645"
    });
    const po = (await db.select().from(purchaseOrders).where(import_drizzle_orm2.sql`poNumber = ${poNum}`))[0];
    if (po) {
      await db.insert(purchaseOrderItems).values({
        purchaseOrderId: po.id,
        itemId: randPick(rawMaterialsOnly).id,
        quantity: rand(500, 2e3),
        unitPrice: "10.00",
        total: "15000.00"
      });
    }
  }
  const seededPOs = await db.select().from(purchaseOrders);
  console.log("\u{1F4DD} Seeding RFQs...");
  for (let i = 0; i < 5; i++) {
    const pr = seededPRs[i] || seededPRs[0];
    const rfqNum = `RFQ-${String(i + 1).padStart(4, "0")}`;
    await db.insert(rfqs).values({
      rfqNumber: rfqNum,
      purchaseRequestId: pr?.id || null,
      title: "\u0634\u0631\u0627\u0621 \u0644\u0648\u0627\u0632\u0645 \u0627\u0644\u062E\u064A\u0648\u0637 \u0648\u0627\u0644\u0623\u0632\u0631\u0627\u0631",
      description: "\u0645\u0637\u0644\u0648\u0628 \u0639\u0631\u0648\u0636 \u0623\u0633\u0639\u0627\u0631 \u0644\u062A\u0648\u0631\u064A\u062F \u062E\u064A\u0648\u0637 \u0628\u0648\u0644\u064A\u0633\u062A\u0631 \u0648\u0623\u0632\u0631\u0627\u0631 \u0628\u064A\u0636\u0627\u0621 \u0648\u0633\u0648\u062F\u0627\u0621",
      status: randPick(["bidding", "sent", "draft"]),
      deadline: daysAgo(-5)
    });
    const rfq = (await db.select().from(rfqs).where(import_drizzle_orm2.sql`rfqNumber = ${rfqNum}`))[0];
    if (rfq) {
      await db.insert(rfqItems).values({
        rfqId: rfq.id,
        itemId: randPick(rawMaterialsOnly).id,
        quantity: 1e3,
        specifications: "\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0642\u064A\u0627\u0633\u064A\u0629 \u0645\u0636\u0627\u062F\u0629 \u0644\u0644\u0642\u0637\u0639"
      });
      for (const supplier of seededSuppliers.slice(0, 2)) {
        await db.insert(rfqResponses).values({
          rfqId: rfq.id,
          supplierId: supplier.id,
          unitPrice: "12.00",
          totalPrice: "12000.00",
          deliveryDays: 5
        });
      }
    }
  }
  console.log("\u2705 Seeding goods receipts (GRN)...");
  for (let i = 0; i < 5; i++) {
    const po = seededPOs[i] || seededPOs[0];
    const supplier = randPick(seededSuppliers);
    const grNum = `GR-${String(i + 1).padStart(4, "0")}`;
    if (po) {
      await db.insert(goodsReceipts).values({
        grNumber: grNum,
        purchaseOrderId: po.id,
        supplierId: supplier.id,
        receiptDate: daysAgo(2),
        invoiceNumber: `INV-${po.poNumber}`,
        subtotal: "15000.00",
        totalAmount: "17100.00",
        status: "fully_accepted"
      });
      const gr = (await db.select().from(goodsReceipts).where(import_drizzle_orm2.sql`grNumber = ${grNum}`))[0];
      if (gr) {
        await db.insert(goodsReceiptItems).values({
          goodsReceiptId: gr.id,
          purchaseOrderItemId: 1,
          // dummy
          itemId: randPick(rawMaterialsOnly).id,
          orderedQuantity: 1e3,
          receivedQuantity: 1e3,
          acceptedQuantity: 1e3
        });
      }
    }
  }
  console.log("\u{1F4B0} Seeding sales pipeline and opportunities...");
  const pipelineStages = [
    { name: "\u0641\u0631\u0635\u0629 \u062C\u062F\u064A\u062F\u0629", order: 1, color: "#3182ce", probability: "10.00" },
    { name: "\u062A\u0648\u0627\u0635\u0644 \u0623\u0648\u0644\u064A", order: 2, color: "#805ad5", probability: "30.00" },
    { name: "\u0639\u0631\u0636 \u0641\u0646\u064A \u0648\u0645\u0627\u0644\u064A", order: 3, color: "#dd6b20", probability: "60.00" },
    { name: "\u062A\u0641\u0627\u0648\u0636 \u0646\u0647\u0627\u0626\u064A", order: 4, color: "#319795", probability: "90.00" }
  ];
  for (const stage of pipelineStages) {
    await db.insert(salesPipelineStages).values(stage);
  }
  const dbStages = await db.select().from(salesPipelineStages);
  for (let i = 0; i < 10; i++) {
    await db.insert(salesOpportunities).values({
      title: `\u0637\u0644\u0628\u064A\u0629 \u0645\u0628\u064A\u0639\u0627\u062A \u062A\u0635\u062F\u064A\u0631 - ${i + 1}`,
      customerId: randPick(crmCusts).id,
      stageId: randPick(dbStages).id,
      expectedValue: "50000.00",
      probability: "50.00",
      expectedCloseDate: daysAgo(-30),
      status: "open"
    });
  }
  console.log("\u{1F4B8} Seeding sales commissions...");
  const salesEmps = emps.filter((e) => e.role.includes("\u0645\u0646\u062F\u0648\u0628") || e.jobTitle.includes("\u0645\u0628\u064A\u0639\u0627\u062A"));
  const commissionWorker = salesEmps[0] || emps[0];
  const seededSalesOrders = await db.select().from(salesOrders);
  for (let i = 0; i < seededSalesOrders.length; i++) {
    await db.insert(salesCommissions).values({
      employeeId: commissionWorker.id,
      salesOrderId: seededSalesOrders[i].id,
      commissionRate: "5.00",
      saleAmount: seededSalesOrders[i].totalAmount || "10000",
      commissionAmount: String(Number(seededSalesOrders[i].totalAmount || 1e4) * 0.05),
      isPaid: randPick([true, false]),
      period: "2025-06",
      notes: "\u062D\u0633\u0627\u0628 \u0639\u0645\u0648\u0644\u0629 \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0644\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u062D\u0627\u0644\u064A"
    });
  }
  console.log("\u{1F4E6} Seeding shipments...");
  for (let i = 0; i < 5; i++) {
    const order = seededSalesOrders[i] || seededSalesOrders[0];
    if (order) {
      const trkNum = `TRK-${String(i + 1).padStart(6, "0")}`;
      await db.insert(shipments).values({
        trackingNumber: trkNum,
        salesOrderId: order.id,
        customerId: order.customerId,
        carrier: "DHL Egypt",
        shippingDate: daysAgo(3),
        estimatedDeliveryDate: daysAgo(-1),
        shippingCost: "500.00",
        status: "in_transit"
      });
      const sh = (await db.select().from(shipments).where(import_drizzle_orm2.sql`trackingNumber = ${trkNum}`))[0];
      if (sh) {
        await db.insert(shipmentItems).values({
          shipmentId: sh.id,
          salesOrderItemId: 1,
          // dummy
          itemId: randPick(rawMaterialsOnly).id,
          quantity: 100
        });
      }
    }
  }
  console.log("\u2699\uFE0F Seeding machine maintenance...");
  const seededMachines = await db.select().from(machines);
  for (const machine of seededMachines) {
    await db.insert(maintenanceRecords).values({
      machineId: machine.id,
      maintenanceType: randPick(["preventive", "corrective"]),
      title: "\u0635\u064A\u0627\u0646\u0629 \u0645\u0627\u0643\u064A\u0646\u0629 \u062F\u0648\u0631\u064A\u0629",
      description: "\u062A\u0646\u0638\u064A\u0641 \u0627\u0644\u0623\u062C\u0632\u0627\u0621 \u0627\u0644\u062F\u0627\u062E\u0644\u064A\u0629 \u0648\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0632\u064A\u062A \u0648\u0641\u062D\u0635 \u0627\u0644\u0633\u064A\u0648\u0631 \u0648\u0627\u0644\u062A\u0631\u0648\u0633",
      scheduledDate: daysAgo(5),
      completedDate: daysAgo(5),
      cost: "250.00",
      technicianName: "\u0627\u0644\u0645\u0647\u0646\u062F\u0633 \u0639\u0627\u062F\u0644 \u0635\u064A\u0627\u0646\u0629",
      status: "completed"
    });
  }
  console.log("\u{1F9FE} Seeding financial invoices (Sales & Purchase)...");
  for (let i = 0; i < seededSalesOrders.length; i++) {
    const order = seededSalesOrders[i];
    await db.insert(salesInvoices).values({
      invoiceNumber: `SINV-2025-${String(i + 1).padStart(4, "0")}`,
      salesOrderId: order.id,
      customerId: order.customerId,
      issueDate: daysAgo(15),
      dueDate: daysAgo(-15),
      subtotal: order.totalAmount || "5000",
      vatAmount: String(Number(order.totalAmount || 5e3) * 0.14),
      totalAmount: String(Number(order.totalAmount || 5e3) * 1.14),
      status: "issued"
    });
  }
  for (let i = 0; i < 5; i++) {
    await db.insert(grns).values({
      grnNumber: `GRN-2025-${String(i + 1).padStart(4, "0")}`,
      supplyOrderId: i + 1,
      // dummy ref
      supplierId: seededSuppliers[0].id,
      receivedDate: daysAgo(5),
      subtotal: "10000.00",
      totalAmount: "11400.00",
      status: "fully_received"
    });
  }
  const dbGRNs = await db.select().from(grns);
  for (let i = 0; i < dbGRNs.length; i++) {
    await db.insert(purchaseInvoices).values({
      invoiceNumber: `PINV-2025-${String(i + 1).padStart(4, "0")}`,
      grnId: dbGRNs[i].id,
      supplierId: dbGRNs[i].supplierId,
      issueDate: daysAgo(5),
      dueDate: daysAgo(-25),
      subtotal: "10000.00",
      totalAmount: "11400.00",
      status: "received"
    });
  }
  const dbSalesInvoices = await db.select().from(salesInvoices);
  console.log("\u{1F4B5} Seeding opening balances...");
  for (const acct of dbAccts) {
    await db.insert(openingBalances).values({
      fiscalYear: "2025",
      accountId: acct.id,
      debit: acct.code.startsWith("5") || acct.code.startsWith("1") ? "10000.00" : "0.00",
      credit: acct.code.startsWith("2") || acct.code.startsWith("3") || acct.code.startsWith("4") ? "10000.00" : "0.00",
      balance: "10000.00",
      posted: true
    });
  }
  console.log("\u{1F4B0} Seeding treasury accounts and logs...");
  const cashAcct = dbAccts.find((a) => a.code === "110000");
  const bankAcct = dbAccts.find((a) => a.code === "120000");
  await db.insert(treasuryAccounts).values({
    name: "\u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0644\u0644\u0645\u0635\u0646\u0639",
    code: "TR-CASH-01",
    type: "cash",
    openingBalance: "50000.00",
    currentBalance: "50000.00",
    isDefault: true,
    accountId: cashAcct?.id || 1
  });
  await db.insert(treasuryAccounts).values({
    name: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u0623\u0647\u0644\u064A \u0627\u0644\u062C\u0627\u0631\u064A",
    code: "TR-BANK-01",
    type: "bank",
    bankName: "\u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u0623\u0647\u0644\u064A \u0627\u0644\u0645\u0635\u0631\u064A",
    accountNumber: "12345678901234",
    openingBalance: "200000.00",
    currentBalance: "200000.00",
    isDefault: false,
    accountId: bankAcct?.id || 2
  });
  const dbTreasuries = await db.select().from(treasuryAccounts);
  for (const tr of dbTreasuries) {
    await db.insert(treasuryTransactions).values({
      treasuryAccountId: tr.id,
      type: "receipt",
      amount: "5000.00",
      date: daysAgo(2),
      reference: "\u0631\u0635\u064A\u062F \u0627\u0641\u062A\u062A\u0627\u062D",
      partyType: "other",
      partyName: "\u0627\u0644\u062E\u0632\u064A\u0646\u0629"
    });
  }
  console.log("\u{1F4B3} Seeding credit limits and debt aging...");
  for (const customer of crmCusts) {
    await db.insert(creditLimits).values({
      customerId: customer.id,
      creditLimit: "100000.00",
      paymentTermDays: 30,
      currentBalance: "15000.00",
      totalInvoiced: "25000.00",
      totalPaid: "10000.00",
      isActive: true
    });
    const customerInvoice = dbSalesInvoices.find((inv) => inv.customerId === customer.id);
    if (customerInvoice) {
      await db.insert(agingBuckets).values({
        customerId: customer.id,
        invoiceId: customerInvoice.id,
        invoiceNumber: customerInvoice.invoiceNumber,
        invoiceDate: customerInvoice.issueDate,
        dueDate: customerInvoice.dueDate || daysAgo(-30),
        amount: customerInvoice.totalAmount,
        balance: customerInvoice.totalAmount,
        bucket1_30: customerInvoice.totalAmount
      });
    }
  }
  console.log("\u{1F3AB} Seeding vouchers (payment, receipt, journal)...");
  for (let i = 0; i < 5; i++) {
    await db.insert(paymentVouchers).values({
      voucherNumber: `PV-${String(i + 1).padStart(4, "0")}`,
      voucherDate: daysAgo(5),
      payeeName: "\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621 \u0648\u0627\u0644\u0635\u064A\u0627\u0646\u0629",
      payeeType: "other",
      amount: "1500.00",
      paymentMethod: "cash",
      status: "approved"
    });
    await db.insert(receiptVouchers).values({
      voucherNumber: `RV-${String(i + 1).padStart(4, "0")}`,
      voucherDate: daysAgo(5),
      payerName: "\u062F\u0641\u0639\u0629 \u062A\u062D\u062A \u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064A\u0644",
      payerType: "customer",
      payerId: crmCusts[0].id,
      amount: "5000.00",
      paymentMethod: "cash",
      status: "approved"
    });
    const jvNum = `JV-${String(i + 1).padStart(4, "0")}`;
    await db.insert(journalVouchers).values({
      voucherNumber: jvNum,
      voucherDate: daysAgo(5),
      description: "\u0642\u064A\u062F \u0625\u062B\u0628\u0627\u062A \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0648\u0625\u0647\u0644\u0627\u0643 \u0627\u0644\u0645\u0639\u062F\u0627\u062A \u0627\u0644\u0634\u0647\u0631\u064A",
      totalDebit: "2000.00",
      totalCredit: "2000.00",
      status: "posted"
    });
    const jv = (await db.select().from(journalVouchers).where(import_drizzle_orm2.sql`voucherNumber = ${jvNum}`))[0];
    if (jv) {
      await db.insert(journalVoucherLines).values({
        journalVoucherId: jv.id,
        accountCode: "520000",
        accountName: "\u0645\u0635\u0631\u0648\u0641\u0627\u062A \u0625\u0647\u0644\u0627\u0643 \u0627\u0644\u0623\u0635\u0648\u0644",
        debit: "2000.00",
        credit: "0.00"
      });
      await db.insert(journalVoucherLines).values({
        journalVoucherId: jv.id,
        accountCode: "110000",
        accountName: "\u0645\u062C\u0645\u0639 \u0625\u0647\u0644\u0627\u0643 \u0627\u0644\u0623\u0635\u0648\u0644",
        debit: "0.00",
        credit: "2000.00"
      });
    }
  }
  console.log("\u274C Seeding defect types...");
  const defects = [
    { code: "DEF-SEW-01", name: "\u062E\u064A\u0627\u0637\u0629 \u0645\u0641\u0643\u0648\u0643\u0629", category: "sewing", severity: "major" },
    { code: "DEF-CUT-01", name: "\u0642\u0635 \u063A\u064A\u0631 \u0645\u062A\u0633\u0627\u0648\u064A", category: "cutting", severity: "critical" },
    { code: "DEF-FAB-01", name: "\u0628\u0642\u0639\u0629 \u0632\u064A\u062A \u0641\u064A \u0627\u0644\u0642\u0645\u0627\u0634", category: "appearance", severity: "minor" },
    { code: "DEF-FIT-01", name: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0645\u0642\u0627\u0633 \u0627\u0644\u0646\u0647\u0627\u0626\u064A", category: "measurement", severity: "major" }
  ];
  for (const d of defects) {
    await db.insert(defectTypes).values(d);
  }
  console.log("\u{1F4B8} Seeding expense records...");
  const categories = [
    { name: "\u0625\u064A\u062C\u0627\u0631 \u0627\u0644\u0645\u0635\u0646\u0639 \u0648\u0627\u0644\u0645\u0646\u0634\u0622\u062A", code: "EXP-RENT" },
    { name: "\u0643\u0647\u0631\u0628\u0627\u0621 \u0648\u0645\u064A\u0627\u0647 \u0648\u0625\u0646\u062A\u0631\u0646\u062A", code: "EXP-UTIL" },
    { name: "\u0631\u0648\u0627\u062A\u0628 \u0648\u0645\u0643\u0627\u0641\u0622\u062A \u0627\u0644\u0639\u0627\u0645\u0644\u064A\u0646", code: "EXP-SAL" },
    { name: "\u0635\u064A\u0627\u0646\u0629 \u0645\u0627\u0643\u064A\u0646\u0627\u062A \u0648\u0645\u0639\u062F\u0627\u062A", code: "EXP-MAINT" }
  ];
  for (const cat of categories) {
    await db.insert(expenseCategories).values(cat);
  }
  const dbCategories = await db.select().from(expenseCategories);
  for (let i = 0; i < 5; i++) {
    const cat = randPick(dbCategories);
    await db.insert(expenses).values({
      expenseNumber: `EXP-${String(i + 1).padStart(4, "0")}`,
      categoryId: cat.id,
      title: `\u0641\u0627\u062A\u0648\u0631\u0629 ${cat.name} \u0644\u0634\u0647\u0631 \u064A\u0648\u0646\u064A\u0648`,
      amount: "5000.00",
      expenseDate: daysAgo(5),
      status: "paid",
      totalAmount: "5700.00",
      vatAmount: "700.00"
    });
  }
  console.log("\u267B\uFE0F Seeding wastage logs...");
  for (let i = 0; i < 5; i++) {
    await db.insert(wastageRecords).values({
      wastageNumber: `WST-${String(i + 1).padStart(4, "0")}`,
      sourceType: "cutting",
      modelId: models[0].id,
      itemId: rawMaterialsOnly[0].id,
      wastageType: "end_bit",
      quantity: "1.500",
      unit: "\u0645\u062A\u0631",
      unitCost: "50.00",
      totalCost: "75.00",
      status: "approved",
      wastageDate: daysAgo(5)
    });
  }
  console.log("\u{1F574}\uFE0F Seeding sales representative visits and orders...");
  const repWorker = salesEmps[0] || emps[0];
  for (let i = 0; i < 5; i++) {
    const customer = randPick(crmCusts);
    const visitNum = `VIS-${String(i + 1).padStart(4, "0")}`;
    await db.insert(salesRepVisits).values({
      visitNumber: visitNum,
      salesRepId: repWorker.id,
      salesRepName: repWorker.fullName,
      customerId: customer.id,
      customerName: customer.name,
      visitType: "scheduled",
      status: "completed",
      scheduledDate: daysAgo(1),
      actualStartTime: daysAgo(1),
      purpose: "\u0632\u064A\u0627\u0631\u0629 \u062F\u0648\u0631\u064A\u0629 \u0644\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A",
      outcome: "\u062A\u0645 \u0627\u0644\u0627\u062A\u0641\u0627\u0642 \u0639\u0644\u0649 \u0637\u0644\u0628\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u0628\u0642\u064A\u0645\u0629 15000 \u062C\u0646\u064A\u0647 \u0648\u062A\u0645 \u062A\u062D\u0635\u064A\u0644 5000 \u062C\u0646\u064A\u0647 \u062F\u0641\u0639\u0629 \u0643\u0627\u0634"
    });
    const visit = (await db.select().from(salesRepVisits).where(import_drizzle_orm2.sql`visitNumber = ${visitNum}`))[0];
    if (visit) {
      await db.insert(salesRepOrders).values({
        orderNumber: `SRO-${String(i + 1).padStart(4, "0")}`,
        salesRepId: repWorker.id,
        salesRepName: repWorker.fullName,
        visitId: visit.id,
        customerId: customer.id,
        customerName: customer.name,
        modelId: models[0].id,
        modelName: models[0].name,
        color: "\u0623\u0628\u064A\u0636",
        size: "M",
        quantity: 200,
        unitPrice: "75.00",
        totalAmount: "15000.00",
        grandTotal: "15000.00",
        status: "approved"
      });
    }
  }
  console.log("\u{1F4C4} Seeding customer quotations...");
  for (let i = 0; i < 5; i++) {
    const customer = randPick(crmCusts);
    const qtNum = `QT-${String(i + 1).padStart(4, "0")}`;
    await db.insert(quotations).values({
      quotationNumber: qtNum,
      customerId: customer.id,
      issueDate: daysAgo(10),
      expiryDate: daysAgo(-20),
      subtotal: "10000.00",
      totalAmount: "11400.00",
      status: randPick(["sent", "accepted", "draft"])
    });
    const qt = (await db.select().from(quotations).where(import_drizzle_orm2.sql`quotationNumber = ${qtNum}`))[0];
    if (qt) {
      await db.insert(quotationItems).values({
        quotationId: qt.id,
        modelId: models[0].id,
        description: "\u062A\u064A\u0634\u064A\u0631\u062A \u0642\u0637\u0646 \u0645\u0645\u064A\u0632 \u0645\u0637\u0631\u0632 \u0628\u0634\u0639\u0627\u0631 \u0627\u0644\u0639\u0645\u064A\u0644",
        quantity: 200,
        unitPrice: "50.00",
        lineTotal: "10000.00"
      });
    }
  }
  console.log("\u{1F4DD} Seeding system activity logs...");
  for (let i = 0; i < 15; i++) {
    await db.insert(activities).values({
      userId: 1,
      userName: "\u0623\u062D\u0645\u062F \u0627\u0644\u0645\u0633\u0624\u0648\u0644",
      action: randPick(["\u062F\u062E\u0648\u0644 \u0627\u0644\u0646\u0638\u0627\u0645", "\u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628\u064A\u0629 \u0645\u0628\u064A\u0639\u0627\u062A", "\u062A\u0639\u062F\u064A\u0644 \u0625\u0639\u062F\u0627\u062F\u0627\u062A"]),
      entityType: "system",
      description: "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0648\u0627\u0644\u0646\u0634\u0627\u0637 \u062A\u0645\u062A \u0628\u0646\u062C\u0627\u062D"
    });
  }
  console.log("\u{1F4C9} Seeding machine depreciation logs...");
  for (const machine of seededMachines) {
    await db.insert(machineDepreciation).values({
      machineId: machine.id,
      year: 2025,
      period: "06-2025",
      depreciationAmount: "500.00",
      accumulatedDepreciation: "2000.00",
      bookValue: "18000.00"
    });
  }
  console.log("\u270F\uFE0F Seeding sales order amendments...");
  for (let i = 0; i < 5; i++) {
    const order = seededSalesOrders[0];
    if (order) {
      await db.insert(orderAmendments).values({
        salesOrderId: order.id,
        fieldName: "quantity",
        oldValue: "500",
        newValue: "600",
        reason: "\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0641\u0639\u0644\u064A \u0645\u0646 \u0627\u0644\u0641\u0631\u0648\u0639 \u0627\u0644\u062A\u0627\u0628\u0639\u0629 \u0644\u0644\u0639\u0645\u064A\u0644"
      });
    }
  }
  console.log("\u23F0 Seeding delivery reminders...");
  for (let i = 0; i < 5; i++) {
    const order = seededSalesOrders[0];
    if (order) {
      await db.insert(deliveryReminders).values({
        salesOrderId: order.id,
        reminderType: "7_days",
        sent: true,
        sentAt: daysAgo(1)
      });
    }
  }
  console.log("\u{1F4C5} Seeding fiscal years...");
  await db.insert(fiscalYears).values({
    name: "FY-2025",
    startDate: /* @__PURE__ */ new Date("2025-01-01"),
    endDate: /* @__PURE__ */ new Date("2025-12-31"),
    status: "open",
    isCurrent: true
  });
  console.log("\u{1F3E2} Seeding company profile settings...");
  await db.insert(companySettings).values({
    companyName: "\u0634\u0631\u0643\u0629 \u0647\u0648\u0631\u0627\u064A\u0632\u0646 \u0644\u0644\u0645\u0644\u0627\u0628\u0633 \u0627\u0644\u062C\u0627\u0647\u0632\u0629 \u0648\u0627\u0644\u0645\u0646\u0633\u0648\u062C\u0627\u062A",
    companyNameEn: "Horizon Garment & Textiles Co.",
    address: "\u0627\u0644\u0639\u0627\u0634\u0631 \u0645\u0646 \u0631\u0645\u0636\u0627\u0646\u060C \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629 \u0627\u0644\u062B\u0627\u0644\u062B\u0629",
    phone: "010-000-1111",
    email: "management@horizon.eg",
    taxNumber: "987-654-321",
    commercialRegister: "CR-12345",
    currency: "EGP"
  });
  console.log("\u{1F517} Seeding automatic integration logs...");
  await db.insert(integrationLogs).values({
    event: "sales_order_sync",
    sourceModule: "sales",
    targetModule: "accounting",
    sourceNumber: "SO-0001",
    targetNumber: "JV-2025-0012",
    status: "success",
    details: "\u062A\u0645 \u062A\u0631\u062D\u064A\u0644 \u0648\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0628\u0646\u062C\u0627\u062D \u0641\u064A \u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0648\u0627\u0644\u0645\u062E\u0627\u0632\u0646"
  });
  console.log("\n\u2705 Seed complete! All tables populated with comprehensive mock data.");
}
seed().catch((err) => {
  console.error("\u274C Seed failed:", err);
  process.exit(1);
});
