import type {
  EvaluationMetricsResponse,
  GlobalSHAPResponse,
  PredictionResponse,
  ThresholdPoint,
  TransactionInput,
} from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/+$/,
  "",
);

const REQUEST_TIMEOUT_MS = 10000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(body: unknown, status: number): string {
  if (isRecord(body)) {
    if (typeof body.message === "string") return body.message;

    if (typeof body.error === "string") return body.error;

    if (isRecord(body.error) && typeof body.error.message === "string") {
      return body.error.message;
    }

    if (typeof body.detail === "string") return body.detail;
  }

  return `Request failed with status ${status}. Please try again.`;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function request(
  endpoint: string,
  options: RequestInit = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(body, response.status));
    }

    if (body === null) {
      throw new Error("The server returned an empty response.");
    }

    return body;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the server. Check your connection and try again.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isPredictionResponse(data: unknown): data is PredictionResponse {
  if (!isRecord(data)) return false;

  return (
    typeof data.probability === "number" &&
    Number.isFinite(data.probability) &&
    data.probability >= 0 &&
    data.probability <= 1 &&
    (data.risk_band === "LOW" ||
      data.risk_band === "MEDIUM" ||
      data.risk_band === "HIGH") &&
    typeof data.exceeds_threshold === "boolean" &&
    typeof data.threshold === "number" &&
    Number.isFinite(data.threshold) &&
    Array.isArray(data.top_contributions) &&
    data.top_contributions.every(
      (item) =>
        isRecord(item) &&
        typeof item.feature === "string" &&
        typeof item.feature_value === "number" &&
        Number.isFinite(item.feature_value) &&
        typeof item.shap_value === "number" &&
        Number.isFinite(item.shap_value) &&
        typeof item.direction === "string",
    )
  );
}

export async function scoreTransaction(
  transaction: TransactionInput,
): Promise<PredictionResponse> {
  const data = await request("/score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });

  if (!isPredictionResponse(data)) {
    throw new Error("The server returned an invalid prediction response.");
  }

  return data;
}

export function getMetrics(): Promise<EvaluationMetricsResponse> {
  return request("/metrics") as Promise<EvaluationMetricsResponse>;
}

export async function getThresholdCurve(): Promise<ThresholdPoint[]> {
  const data = await request("/threshold-curve");

  if (Array.isArray(data)) {
    return data as ThresholdPoint[];
  }

  if (isRecord(data)) {
    const points = Object.values(data).find(
      (value) =>
        Array.isArray(value) &&
        value.every(
          (item) =>
            isRecord(item) &&
            typeof item.threshold === "number" &&
            typeof item.precision === "number" &&
            typeof item.recall === "number" &&
            typeof item.f1 === "number",
        ),
    );

    if (points) {
      return points as ThresholdPoint[];
    }
  }

  throw new Error("Unexpected threshold-curve response format.");
}
export async function getGlobalShap(): Promise<GlobalSHAPResponse> {
  const data = await request("/shap-global");

  if (!isRecord(data)) {
    throw new Error("Invalid global SHAP response.");
  }

  if (
    data.explanation_type !== "global" ||
    typeof data.class_name !== "string" ||
    typeof data.sample_size !== "number" ||
    !Array.isArray(data.features)
  ) {
    throw new Error("Unexpected global SHAP response format.");
  }

  const validFeatures = data.features.every(
    (feature) =>
      isRecord(feature) &&
      typeof feature.feature === "string" &&
      typeof feature.mean_abs_shap === "number" &&
      Number.isFinite(feature.mean_abs_shap) &&
      typeof feature.mean_shap === "number" &&
      Number.isFinite(feature.mean_shap),
  );

  if (!validFeatures) {
    throw new Error("Invalid SHAP feature data.");
  }

  return data as unknown as GlobalSHAPResponse;
}
