import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { apiRouter } from "./routes/api.ts";

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRouter);

// Healthcheck
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "querocomprar", timestamp: new Date().toISOString() });
});

// Em produção, serve os arquivos estáticos gerados pelo Vite (dist/)
const distPath = path.resolve(process.cwd(), "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req: Request, res: Response, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path === "/health") {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
