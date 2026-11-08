# ARGUS — System Requirements

## 1. Introduction

This document defines the functional and non-functional requirements for ARGUS, an ML-powered transaction fraud detection system.

ARGUS consists of a React frontend, an Express API gateway, and a Python FastAPI risk engine.

## 2. Functional Requirements

### FR-01: Transaction Input

The system shall accept transaction data containing exactly 30 numeric features:

- `Time`
- `Amount`
- `V1` through `V28`

### FR-02: Input Validation

The system shall:

- Reject missing required features.
- Reject unexpected additional fields.
- Reject non-numeric and non-finite values.
- Reject negative `Time` and `Amount` values.
- Return an appropriate validation error for invalid input.

### FR-03: Fraud Prediction

The risk engine shall load the trained Random Forest model and generate a fraud probability for a valid transaction.

### FR-04: Risk Classification

The system shall return:

- Fraud probability.
- Risk band.
- Whether the probability exceeds the selected threshold.
- The selected threshold.

### FR-05: Prediction Explanation

The system shall return up to five important SHAP contributions for an individual prediction.

Each contribution shall contain:

- Feature name.
- Feature value.
- SHAP value.
- Contribution direction.

### FR-06: Model Metrics

The system shall expose stored model evaluation metrics through the API gateway.

### FR-07: Threshold Analysis

The system shall expose stored threshold-curve data through the API gateway.

### FR-08: API Gateway

The Express gateway shall:

- Accept frontend requests.
- Validate transaction payloads.
- Forward valid requests to the risk engine.
- Return successful upstream responses.
- Handle upstream errors, timeouts, and invalid responses.
- Apply request rate limiting.
- Log request method, path, status, and duration without logging transaction payloads.

### FR-09: Frontend Integration

The React frontend shall consume the Express gateway APIs rather than directly accessing the FastAPI risk engine.

## 3. API Requirements

### FastAPI Risk Engine

| Method | Endpoint           | Purpose                  |
| ------ | ------------------ | ------------------------ |
| GET    | `/health`          | Service health           |
| POST   | `/score`           | Transaction prediction   |
| GET    | `/metrics`         | Model evaluation metrics |
| GET    | `/threshold-curve` | Threshold analysis       |

### Express API Gateway

| Method | Endpoint               | Purpose                  |
| ------ | ---------------------- | ------------------------ |
| POST   | `/api/score`           | Transaction prediction   |
| GET    | `/api/metrics`         | Model evaluation metrics |
| GET    | `/api/threshold-curve` | Threshold analysis       |

## 4. Non-Functional Requirements

### NFR-01: Reliability

The system shall handle unavailable upstream services and return structured errors instead of exposing unhandled exceptions.

### NFR-02: Performance

The gateway shall enforce a configurable upstream timeout.

The current default timeout is 5,000 milliseconds.

### NFR-03: Security

- Transaction payloads shall not be written to request logs.
- Environment-specific configuration shall be stored outside source code.
- API requests shall undergo server-side validation.
- Rate limiting shall be applied to gateway API routes.

### NFR-04: Maintainability

- The frontend, gateway, and risk engine shall remain separate components.
- API request and response contracts shall be documented.
- Automated tests shall cover critical validation and gateway behavior.
- Dependencies shall be declared and version-pinned for reproducible installation.

### NFR-05: Explainability

The prediction response shall include feature-level SHAP contributions to help users understand model outputs.

### NFR-06: Reproducibility

Training, evaluation, and inference dependencies shall be documented. Model artifacts shall be generated and versioned independently of the serving code.

## 5. Technology Requirements

| Component           | Technology                   |
| ------------------- | ---------------------------- |
| Frontend            | React, TypeScript, Vite      |
| API Gateway         | Node.js, Express, TypeScript |
| Request Validation  | Zod                          |
| Risk Engine         | Python, FastAPI              |
| Machine Learning    | Scikit-learn                 |
| Explainability      | SHAP                         |
| Model Serialization | Joblib                       |
| Gateway Testing     | Vitest, Supertest            |
| Risk Engine Testing | Pytest                       |

## 6. Error Handling Requirements

The Express gateway shall use structured error responses.

| HTTP Status | Error Code              | Meaning                       |
| ----------- | ----------------------- | ----------------------------- |
| 422         | `VALIDATION_ERROR`      | Invalid request               |
| 429         | `RATE_LIMIT_EXCEEDED`   | Rate limit exceeded           |
| 502         | `UPSTREAM_ERROR`        | Risk engine returned an error |
| 502         | `INVALID_RESPONSE`      | Invalid upstream response     |
| 503         | `CONNECTION_FAILED`     | Risk engine unavailable       |
| 504         | `TIMEOUT`               | Upstream request timed out    |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected internal error     |

## 7. Constraints and Assumptions

- The system is currently a project prototype, not a live banking integration.
- The risk engine requires the trained model and supporting artifacts.
- The Express gateway and FastAPI risk engine must both be running for prediction requests to succeed.
- The frontend depends on the Express API contract.
- Prediction quality depends on the training dataset and evaluation methodology.
- A risk score is a decision-support signal, not a guarantee of fraud.

## 8. Acceptance Criteria

The backend requirements are satisfied when:

- The risk engine starts and loads its model artifacts.
- Valid transaction requests return the documented prediction structure.
- Invalid requests are rejected.
- SHAP explanations are returned.
- Metrics and threshold-curve endpoints respond successfully.
- Gateway timeout and upstream error handling work.
- Automated backend tests, type checking, and build complete successfully.

The complete system acceptance criteria additionally require frontend integration and end-to-end testing.
