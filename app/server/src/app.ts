import { requestLogger } from "./middleware/requestLogger.js";
import express from "express";
import scoreRoutes from "./routes/scoreRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import thresholdRoutes from "./routes/thresholdRoutes.js";
import shapRoutes from "./routes/shapRoutes.js";
import { errorHandler } from "./errors/errorHandler.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
const app = express();

app.use(requestLogger);
app.use("/api", apiRateLimiter);
app.use(express.json());

app.use("/api/score", scoreRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/threshold-curve", thresholdRoutes);
app.use("/api/shap-global", shapRoutes);

app.use(errorHandler);
export default app;
