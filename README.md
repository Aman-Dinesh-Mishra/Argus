 ARGUS

> Intelligent Transaction Fraud Detection & Explainability Platform

ARGUS is a transaction risk assessment platform that combines machine learning inference, model explainability, and service-oriented architecture to identify potentially fraudulent financial transactions.

The system provides:

- Fraud probability estimation using a Random Forest classifier
- Configurable risk classification thresholds
- Transaction-level explainability using SHAP
- Model performance analytics and threshold evaluation
- Separation of concerns through independent frontend, API gateway, and inference services

---

## Architecture

![ARGUS Architecture](docs/images/architecture.png)

### High-Level Flow

```text
Risk Analyst
      │
      ▼
React Frontend
      │
      ▼
Express API Gateway
      │
      ▼
FastAPI Risk Engine
      ├── Random Forest Model
      └── SHAP Explainability
              │
              ▼
         Model Artifacts
```

### Service Boundaries

| Component | Responsibility |
|------------|----------------|
| React Frontend | User interaction, visualization, analytics dashboards |
| Express API Gateway | Request validation, routing, API boundary, error handling |
| FastAPI Risk Engine | Model inference and explainability orchestration |
| Random Forest Model | Fraud probability estimation |
| SHAP Layer | Prediction attribution and explanation generation |
| Model Artifacts | Trained models, configurations, and evaluation outputs |

---

## Technology Stack

| Area | Technology |
|--------|------------|
| Frontend | React, TypeScript, Vite |
| API | Node.js, Express, TypeScript |
| Inference | Python, FastAPI |
| ML | Scikit-learn |
| Explainability | SHAP |
| Validation | Zod, Pydantic |
| Testing | Vitest, Supertest, Pytest |
| Packaging | Docker |

---

## Core Capabilities

### Transaction Scoring

Predicts fraud probability from transaction features and classifies risk based on a configurable threshold.

### Explainable Predictions

Provides SHAP-based feature attribution to explain individual predictions and highlight the factors contributing most strongly to model output.

### Threshold Analysis

Supports threshold evaluation to balance precision and recall according to operational risk requirements.

### Model Evaluation

Exposes evaluation metrics and performance artifacts for model monitoring and analysis.

---

## Prediction Contract

### Input Features

The scoring service accepts:

- `Time`
- `Amount`
- `V1` through `V28`

All features are numeric.

### Response

```json
{
  "probability": 0.91,
  "risk_band": "HIGH",
  "exceeds_threshold": true,
  "threshold": 0.72,
  "top_contributions": [
    {
      "feature": "V14",
      "impact": 0.31
    }
  ]
}
```

| Field | Description |
|---------|-------------|
| probability | Fraud likelihood estimate |
| risk_band | LOW, MEDIUM, or HIGH |
| exceeds_threshold | Classification decision |
| threshold | Active decision threshold |
| top_contributions | Key SHAP feature impacts |

---

## API Endpoints

### Gateway API

| Method | Endpoint |
|----------|-----------|
| POST | `/api/score` |
| GET | `/api/metrics` |
| GET | `/api/threshold-curve` |
| GET | `/api/shap-global` |

### Risk Engine

| Method | Endpoint |
|----------|-----------|
| GET | `/health` |
| POST | `/score` |
| GET | `/metrics` |
| GET | `/threshold-curve` |
| GET | `/shap-global` |

---

## Model Performance

Evaluation was performed using a chronological train / validation / test split to reduce temporal leakage.

| Metric | Score |
|----------|---------:|
| ROC-AUC | 0.9720 |
| PR-AUC | 0.7686 |
| Recall | 0.7885 |
| Precision | 0.3832 |

Detailed evaluation reports are available in:

```text
docs/eval-results/
```

---

## Running Locally

### Prerequisites

- Node.js
- Python 3.10+
- Trained model artifacts

### 1. Start Risk Engine

```bash
cd services/risk-engine

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.lock.txt
pip install -e .

uvicorn argus.serve:app --reload --port 8000
```

### 2. Start API Gateway

```bash
cd app/server

npm install
npm run dev
```

### 3. Start Web Client

```bash
cd app/web

npm install
npm run dev
```

---

## Testing

### API Gateway

```bash
cd app/server

npm run typecheck
npm test
npm run build
```

### Risk Engine

```bash
cd services/risk-engine

pytest
```

### Frontend

```bash
cd app/web

npm run lint
npm run build
```

---

## Repository Structure

```text
ARGUS/
│
├── app/
│   ├── web/
│   └── server/
│
├── services/
│   └── risk-engine/
│
├── docs/
│   ├── architecture.md
│   ├── api-contracts.md
│   ├── deployments.md
│   ├── decisions/
│   └── eval-results/
│
└── artifacts/
```

---

## Engineering Notes

This project demonstrates:

- Service-oriented architecture
- ML model serving with FastAPI
- API gateway pattern
- Explainable AI using SHAP
- Type-safe frontend and backend development
- Model evaluation and threshold optimization
- Containerized deployment workflows

---

## Disclaimer

ARGUS is an engineering and machine learning project intended for educational and demonstration purposes.

Predictions produced by the platform represent model-generated risk estimates and should not be interpreted as definitive fraud determinations. Any production deployment would require additional validation, monitoring, security controls, compliance review, and operational safeguards.
