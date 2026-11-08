import { describe, it, expect } from "vitest";
import { transactionSchema } from "../validators/transactionValidator.js";

const validTransaction = {
  Time: 1000,
  Amount: 150.5,
  ...Object.fromEntries(Array.from({ length: 28 }, (_, i) => [`V${i + 1}`, 0])),
};

describe("Transaction Schema", () => {
  it("accepts a valid transaction with all 30 features", () => {
    const result = transactionSchema.safeParse(validTransaction);

    expect(result.success).toBe(true);
  });

  it("rejects a negative Time value", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      Time: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing feature", () => {
    const invalidTransaction = { ...validTransaction };
    delete (invalidTransaction as Record<string, unknown>).V28;

    const result = transactionSchema.safeParse(invalidTransaction);

    expect(result.success).toBe(false);
  });

  it("rejects unexpected fields", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      ExtraField: 123,
    });

    expect(result.success).toBe(false);
  });
});
