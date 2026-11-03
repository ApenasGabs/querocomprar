import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "node:path";
import fs from "node:fs";
import { apiRouter } from "./routes/api.ts";

const app = new Hono();

// CORS Middleware
app.use("*", cors());

// Healthcheck routes
const healthHandler = (c: any) => {
  return c.json({
    status: "ok",
    service: "querocomprar",
    timestamp: new Date().toISOString(),
  });
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// Mount API routes under /api
app.route("/api", apiRouter);

// Serve static frontend files from Vite dist/ if present
const distPath = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use("/*", serveStatic({ root: "./dist" }));

  // SPA fallback for client-side routing
  app.get("*", (c) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, "utf-8");
      return c.html(html);
    }
    return c.text("Not Found", 404);
  });
}

export default app;
