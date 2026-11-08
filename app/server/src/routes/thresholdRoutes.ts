import { Router } from "express";
import { riskEngineClient } from "../clients/riskEngineClient.js";

const router = Router();

router.get("/", async (_req, res) => {
  const thresholdCurve = await riskEngineClient.getThresholdCurve();

  res.status(200).json(thresholdCurve);
});

export default router;
