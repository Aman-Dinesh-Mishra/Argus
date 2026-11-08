# ARGUS API Contracts

Base URL: `http://127.0.0.1:8000`

## 1. Health

### GET `/health`

Response: `200 OK`

```json
{
  "status": "ok",
  "model_loaded": true,
  "threshold": 0.1128755386620629
}
```

## 2. Transaction Scoring

### POST `/score`

Content-Type: `application/json`

Request:

```json
{
  "Time": 0,
  "Amount": 100,
  "V1": 0,
  "V2": 0,
  "V3": 0,
  "V4": 0,
  "V5": 0,
  "V6": 0,
  "V7": 0,
  "V8": 0,
  "V9": 0,
  "V10": 0,
  "V11": 0,
  "V12": 0,
  "V13": 0,
  "V14": 0,
  "V15": 0,
  "V16": 0,
  "V17": 0,
  "V18": 0,
  "V19": 0,
  "V20": 0,
  "V21": 0,
  "V22": 0,
  "V23": 0,
  "V24": 0,
  "V25": 0,
  "V26": 0,
  "V27": 0,
  "V28": 0
}
```

All 30 features are required and must be numeric and finite. `Time` and `Amount` must be non-negative. Additional fields are rejected.

Response: `200 OK`

```json
{
  "probability": 0.001637445080065475,
  "risk_band": "LOW",
  "exceeds_threshold": false,
  "threshold": 0.1128755386620629,
  "top_contributions": [
    {
      "feature": "V14",
      "feature_value": 0,
      "shap_value": -0.08159807706823917,
      "direction": "decreases_fraud_prediction"
    }
  ]
}
```

`top_contributions` contains up to five SHAP contributions.

Possible risk bands:

- `LOW`
- `MEDIUM`
- `HIGH`

### Validation Error

Response: `422 Unprocessable Entity`

Returned when required features are missing, values are invalid, or additional fields are supplied.

## 3. Evaluation Metrics

### GET `/metrics`

Response: `200 OK`

Returns the contents of the active model artifact's `evaluation.json` without modification.

## 4. Threshold Curve

### GET `/threshold-curve`

Response: `200 OK`

Returns the contents of the active model artifact's `threshold_curve.json` without modification.

## 5. Artifact Loading

The active model is selected using:

`artifacts/current.json`

The active model directory must contain:

- `model.joblib`
- `evaluation.json`
- `threshold_curve.json`

The model, threshold, evaluation metrics, threshold curve, and SHAP explainer are loaded during application startup.

---

## 6. Express API Gateway

Base URL: `http://localhost:3000`

The Express Gateway provides the API consumed by the React frontend. It validates incoming requests and forwards them to the FastAPI risk engine.

### POST `/api/score`

Scores a transaction through the FastAPI risk engine.

- Accepts the same 30-feature JSON request as `POST /score`.
- Validates the request using Zod.
- Returns the prediction response from FastAPI without changing its structure.

Success: `200 OK`

Response fields:

- `probability`
- `risk_band`
- `exceeds_threshold`
- `threshold`
- `top_contributions`

### GET `/api/metrics`

Returns the active model's evaluation metrics from the FastAPI risk engine.

Success: `200 OK`

### GET `/api/threshold-curve`

Returns the active model's threshold curve data from the FastAPI risk engine.

Success: `200 OK`

### Gateway Error Responses

| Status | Error                   | Description                                   |
| ------ | ----------------------- | --------------------------------------------- |
| 422    | `VALIDATION_ERROR`      | Invalid transaction input                     |
| 429    | `RATE_LIMIT_EXCEEDED`   | Request rate limit exceeded                   |
| 502    | `UPSTREAM_ERROR`        | Risk engine returned an unsuccessful response |
| 502    | `INVALID_RESPONSE`      | Risk engine returned invalid JSON             |
| 503    | `CONNECTION_FAILED`     | Risk engine could not be reached              |
| 504    | `TIMEOUT`               | Risk engine request timed out                 |
| 500    | `INTERNAL_SERVER_ERROR` | Unexpected gateway error                      |

### Gateway Configuration

Environment variables:

| Variable                 | Default                 | Purpose                  |
| ------------------------ | ----------------------- | ------------------------ |
| `PORT`                   | `3000`                  | Express server port      |
| `RISK_ENGINE_URL`        | `http://127.0.0.1:8000` | FastAPI base URL         |
| `RISK_ENGINE_TIMEOUT_MS` | `5000`                  | Upstream request timeout |

### Rate Limiting

The gateway applies rate limiting to `/api` routes:

- Window: 15 minutes
- Maximum: 100 requests per IP per window
- Response when exceeded: `429 Too Many Requests`
