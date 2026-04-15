import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  const corsOptions =
    env.corsOrigin && env.corsOrigin.trim() !== ""
      ? { origin: env.corsOrigin.trim() }
      : { origin: true };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => {
    res.json({ message: "Hackathon task API", docs: "/health" });
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      env: env.nodeEnv,
      openaiConfigured: Boolean(env.openaiApiKey),
    });
  });

  app.use("/api", apiRoutes);

  app.use((req, res) => {
    console.warn("[api] 404", { method: req.method, path: req.originalUrl ?? req.url });
    res.status(404).json({ error: "Not Found" });
  });

  app.use(errorHandler);

  return app;
}
