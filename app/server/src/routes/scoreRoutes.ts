import { Router } from "express";
import { riskEngineClient } from "../clients/riskEngineClient.js";
import { transactionSchema } from "../validators/transactionValidator.js";
import { validateRequest } from "../middleware/validateRequest.js";
import type { TransactionInput } from "../validators/transactionValidator.js";

const router = Router();
router.post("/", validateRequest(transactionSchema), async (req, res) => {
  const transaction = req.body as TransactionInput;
  const result = await riskEngineClient.scoreTransaction(transaction);
  res.status(200).json(result);
});
export default router;
