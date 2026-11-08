import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../clients/riskEngineClient.js", () => ({
  riskEngineClient: {
    scoreTransaction: vi.fn(),
    getHealth: vi.fn(),
    getMetrics: vi.fn(),
    getThresholdCurve: vi.fn(),
  },
}));

import { riskEngineClient } from "../clients/riskEngineClient.js";
import { RiskEngineError } from "../errors/riskEngineError.js";
import app from "../app.js";

const validTransaction = {
  Time: 1000,
  Amount: 150.5,
  ...Object.fromEntries(Array.from({ length: 28 }, (_, i) => [`V${i + 1}`, 0])),
};

describe("POST /api/score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a prediction for a valid transaction", async () => {
    vi.mocked(riskEngineClient.scoreTransaction).mockResolvedValue({
      probability: 0.001,
      risk_band: "LOW",
      exceeds_threshold: false,
      threshold: 0.112,
      top_contributions: [],
    });

    const response = await request(app)
      .post("/api/score")
      .send(validTransaction);

    expect(response.status).toBe(200);
    expect(response.body.risk_band).toBe("LOW");
    expect(riskEngineClient.scoreTransaction).toHaveBeenCalledOnce();
  });

  it("rejects an invalid transaction", async () => {
    const response = await request(app)
      .post("/api/score")
      .send({
        ...validTransaction,
        Time: -1,
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe("VALIDATION_ERROR");
    expect(riskEngineClient.scoreTransaction).not.toHaveBeenCalled();
  });

  it("handles risk engine timeout errors", async () => {
    vi.mocked(riskEngineClient.scoreTransaction).mockRejectedValue(
      new RiskEngineError("Risk engine request timed out", "TIMEOUT", 504),
    );

    const response = await request(app)
      .post("/api/score")
      .send(validTransaction);

    expect(response.status).toBe(504);
    expect(response.body.error).toBe("TIMEOUT");
    expect(riskEngineClient.scoreTransaction).toHaveBeenCalledOnce();
  });
});
