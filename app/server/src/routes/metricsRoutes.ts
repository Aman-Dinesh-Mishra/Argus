import { Router } from "express";
import { riskEngineClient } from "../clients/riskEngineClient.js";

const router = Router();

router.get("/", async (_req, res) => {
  const metrics = await riskEngineClient.getMetrics();

  res.status(200).json(metrics);
});

export default router;
