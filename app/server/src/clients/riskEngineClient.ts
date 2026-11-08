import { RiskEngineError } from "../errors/riskEngineError.js";

const BASE_URL = process.env.RISK_ENGINE_URL ?? "http://127.0.0.1:8000";
const TIMEOUT_MS = Number(process.env.RISK_ENGINE_TIMEOUT_MS ?? 5000);

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new RiskEngineError(
        "Risk engine request timed out",
        "TIMEOUT",
        504,
      );
    }

    throw new RiskEngineError(
      "Unable to connect to risk engine",
      "CONNECTION_FAILED",
      503,
    );
  }

  if (!response.ok) {
    throw new RiskEngineError(
      `Risk engine returned status ${response.status}`,
      "UPSTREAM_ERROR",
      502,
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new RiskEngineError(
      "Risk engine returned an invalid JSON response",
      "INVALID_RESPONSE",
      502,
    );
  }
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  threshold: number;
}

export interface TransactionFeatures {
  Time: number;
  Amount: number;
  V1: number;
  V2: number;
  V3: number;
  V4: number;
  V5: number;
  V6: number;
  V7: number;
  V8: number;
  V9: number;
  V10: number;
  V11: number;
  V12: number;
  V13: number;
  V14: number;
  V15: number;
  V16: number;
  V17: number;
  V18: number;
  V19: number;
  V20: number;
  V21: number;
  V22: number;
  V23: number;
  V24: number;
  V25: number;
  V26: number;
  V27: number;
  V28: number;
}

export interface ScoreResponse {
  probability: number;
  risk_band: "LOW" | "MEDIUM" | "HIGH";
  exceeds_threshold: boolean;
  threshold: number;
  top_contributions: {
    feature: string;
    feature_value: number;
    shap_value: number;
    direction: string;
  }[];
}

async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

async function scoreTransaction(
  features: TransactionFeatures,
): Promise<ScoreResponse> {
  return request<ScoreResponse>("/score", {
    method: "POST",
    body: JSON.stringify(features),
  });
}

async function getMetrics(): Promise<unknown> {
  return request<unknown>("/metrics");
}

async function getThresholdCurve(): Promise<unknown> {
  return request<unknown>("/threshold-curve");
}

async function getGlobalShap(): Promise<unknown> {
  return request<unknown>("/shap-global");
}

export const riskEngineClient = {
  getHealth,
  scoreTransaction,
  getMetrics,
  getThresholdCurve,
  getGlobalShap,
};
