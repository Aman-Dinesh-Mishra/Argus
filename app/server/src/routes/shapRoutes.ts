import { Router } from "express";
import { riskEngineClient } from "../clients/riskEngineClient.js";

const router = Router();

router.get("/", async (_req, res) => {
  const globalShap = await riskEngineClient.getGlobalShap();

  res.status(200).json(globalShap);
});

export default router;
