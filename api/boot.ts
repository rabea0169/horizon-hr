import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { getDb } from "./queries/connection";
import { employees, inventoryItems, accounts, productionOrders, salesOrders } from "../db/schema";
import { sql } from "drizzle-orm";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

// Security headers
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "0");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  if (env.isProduction) {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
});

// CORS - allow same-origin and configured origins
const allowedOrigins = (env.allowedOrigins || "http://localhost:5173,http://localhost:3000").split(",");
app.use("*", cors({
  origin: allowedOrigins,
  credentials: true,
  maxAge: 86400,
}));

// CSRF protection via Origin/Referer exact match
const csrfProtectedMethods = ["POST", "PUT", "PATCH", "DELETE"];
const allowedHosts = allowedOrigins.map((o) => { try { return new URL(o).host.toLowerCase(); } catch { return null; } }).filter(Boolean);
app.use("/api/*", async (c, next) => {
  if (csrfProtectedMethods.includes(c.req.method)) {
    const origin = c.req.header("origin");
    const referer = c.req.header("referer");
    const source = origin || referer;
    if (source) {
      try {
        const sourceHost = new URL(source).host.toLowerCase();
        const isAllowed = allowedHosts.includes(sourceHost) || sourceHost === "localhost" || sourceHost.startsWith("localhost:");
        if (!isAllowed) {
          c.status(403);
          return c.json({ error: "CSRF validation failed" });
        }
      } catch {
        // Invalid URL in origin/referer header
      }
    }
  }
  return next();
});

// Health check
app.get("/api/health", (c) => c.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
}));

app.get("/api/health-check", async (c) => {
  const db = getDb();
  const report: {
    status: string;
    timestamp: string;
    uptime: number;
    database: { status: string; error: string | null };
    modules: Record<string, { status: string; count?: number; error: string | null }>;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: { status: "connected", error: null },
    modules: {},
  };

  const checkModule = async (name: string, query: () => Promise<number>) => {
    try {
      const count = await query();
      report.modules[name] = { status: "ok", count, error: null };
    } catch (err: any) {
      report.status = "unhealthy";
      report.modules[name] = { status: "error", error: err.message || String(err) };
    }
  };

  try {
    // 1. Test database connection
    await db.execute(sql`SELECT 1`);
  } catch (err: any) {
    report.status = "unhealthy";
    report.database = { status: "disconnected", error: err.message || String(err) };
    return c.json(report, 500);
  }

  // 2. Test modules sequentially to monitor active tables
  await checkModule("hr_employees", async () => {
    const res = await db.select().from(employees).limit(1);
    return res.length;
  });

  await checkModule("inventory_items", async () => {
    const res = await db.select().from(inventoryItems).limit(1);
    return res.length;
  });

  await checkModule("accounts_chart", async () => {
    const res = await db.select().from(accounts).limit(1);
    return res.length;
  });

  await checkModule("manufacturing_orders", async () => {
    const res = await db.select().from(productionOrders).limit(1);
    return res.length;
  });

  await checkModule("sales_orders", async () => {
    const res = await db.select().from(salesOrders).limit(1);
    return res.length;
  });

  const statusCode = report.status === "healthy" ? 200 : 207;
  return c.json(report, statusCode);
});

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
