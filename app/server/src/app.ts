import { requestLogger } from "./middleware/requestLogger.js";
import express from "express";
import scoreRoutes from "./routes/scoreRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import thresholdRoutes from "./routes/thresholdRoutes.js";
import shapRoutes from "./routes/shapRoutes.js";
import { errorHandler } from "./errors/errorHandler.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
const app = express();
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || "https://argus-frontend-8wmi.onrender.com",
  "http://localhost:5173",
]);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(requestLogger);
app.use("/api", apiRateLimiter);
app.use(express.json());
app.use("/api/score", scoreRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/threshold-curve", thresholdRoutes);
app.use("/api/shap-global", shapRoutes);
app.use(errorHandler);
export default app;
