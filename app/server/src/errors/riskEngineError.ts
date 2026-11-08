export type RiskEngineErrorCode =
  | "TIMEOUT"
  | "CONNECTION_FAILED"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class RiskEngineError extends Error {
  constructor(
    message: string,
    public readonly code: RiskEngineErrorCode,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "RiskEngineError";
  }
}
