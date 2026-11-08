import { z } from "zod";

export const transactionSchema = z
  .object({
    Time: z.number().finite().nonnegative(),
    Amount: z.number().finite().nonnegative(),
    V1: z.number().finite(),
    V2: z.number().finite(),
    V3: z.number().finite(),
    V4: z.number().finite(),
    V5: z.number().finite(),
    V6: z.number().finite(),
    V7: z.number().finite(),
    V8: z.number().finite(),
    V9: z.number().finite(),
    V10: z.number().finite(),
    V11: z.number().finite(),
    V12: z.number().finite(),
    V13: z.number().finite(),
    V14: z.number().finite(),
    V15: z.number().finite(),
    V16: z.number().finite(),
    V17: z.number().finite(),
    V18: z.number().finite(),
    V19: z.number().finite(),
    V20: z.number().finite(),
    V21: z.number().finite(),
    V22: z.number().finite(),
    V23: z.number().finite(),
    V24: z.number().finite(),
    V25: z.number().finite(),
    V26: z.number().finite(),
    V27: z.number().finite(),
    V28: z.number().finite(),
  })
  .strict();

export type TransactionInput = z.infer<typeof transactionSchema>;
