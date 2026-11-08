# ARGUS — Product Brief

## 1. Product Overview

ARGUS is an intelligent transaction fraud detection system that evaluates financial transactions and estimates the probability that a transaction is fraudulent.

The system combines a machine learning risk engine with an API gateway to provide transaction scoring, risk classification, model evaluation insights, and explainability.

## 2. Problem Statement

Financial institutions process large volumes of transactions. Reviewing every transaction manually is inefficient, while relying only on fixed rules can miss complex fraud patterns.

ARGUS addresses this problem by using a trained machine learning model to estimate transaction risk and provide supporting explanations.

## 3. Product Goals

- Predict the probability that a transaction is fraudulent.
- Classify transactions into LOW, MEDIUM, or HIGH risk bands.
- Identify the features that contribute most to an individual prediction.
- Expose model evaluation metrics and threshold analysis.
- Provide a structured API that can be consumed by a web frontend.
- Keep model training and online prediction as separate workflows.

## 4. Target Users

### Primary Users

- Fraud analysts who need transaction risk signals.
- Developers integrating fraud scoring into financial applications.
- Data science and machine learning practitioners evaluating fraud models.

### Secondary Users

- Technical reviewers evaluating the system's architecture.
- Recruiters and engineering teams reviewing the project.

## 5. Core Features

### Transaction Scoring

Accepts a transaction containing 30 numeric features:

- `Time`
- `Amount`
- `V1` through `V28`

Returns a fraud probability and risk classification.

### Risk Classification

Maps the predicted probability to one of three risk bands:

- LOW
- MEDIUM
- HIGH

The model's selected decision threshold is also returned.

### Prediction Explainability

Uses SHAP contributions to identify influential features for an individual prediction.

The API returns up to five top feature contributions, including feature name, feature value, SHAP value, and contribution direction.

### Model Metrics

Exposes evaluation metrics generated during model evaluation.

### Threshold Analysis

Exposes threshold-curve data to help users understand the trade-off between precision and recall at different classification thresholds.

## 6. System Architecture

ARGUS follows a layered architecture:

1. React frontend — user interaction and visualization.
2. Express API gateway — request validation, routing, rate limiting, and error handling.
3. FastAPI risk engine — model inference and prediction explanations.
4. Machine learning artifacts — trained model, evaluation results, threshold data, and explanation data.

The Express gateway communicates with the FastAPI service. The frontend communicates with the gateway rather than accessing the model service directly.

## 7. Machine Learning Approach

ARGUS uses a Random Forest classifier for transaction fraud prediction.

The model development workflow includes:

- Data loading and validation.
- Chronological train, validation, and test splitting.
- Baseline model comparison.
- Random Forest training.
- Validation-based threshold selection.
- Final evaluation on a held-out test set.
- SHAP-based explainability.

The held-out test set is reserved for final evaluation and is not used for model selection or threshold tuning.

## 8. Non-Goals

The current version of ARGUS does not:

- Execute or block real financial transactions.
- Connect to live banking systems.
- Guarantee that every fraudulent transaction will be detected.
- Replace human fraud investigation.
- Provide production-grade financial compliance or regulatory certification.

## 9. Success Criteria

The project is considered functionally successful when:

- The risk engine loads the selected model artifacts successfully.
- Valid transactions receive prediction responses.
- Invalid requests are rejected with meaningful validation errors.
- Prediction explanations are returned in the agreed response format.
- The gateway handles upstream failures and timeouts.
- Metrics and threshold data are accessible through the gateway.
- The frontend can consume the gateway APIs.

## 10. Current Project Status

| Component                        | Status                 |
| -------------------------------- | ---------------------- |
| Dataset preparation and analysis | Implemented            |
| Model training and evaluation    | Implemented            |
| Threshold selection              | Implemented            |
| SHAP explanations                | Implemented            |
| FastAPI risk engine              | Implemented            |
| Express API gateway              | Implemented and tested |
| React frontend                   | Pending                |
| Frontend integration             | Pending                |
| End-to-end testing               | Pending                |
| Production deployment            | Pending                |

## 11. Future Enhancements

- Transaction history and risk monitoring dashboard.
- Batch transaction scoring.
- Authentication and role-based access control.
- Persistent prediction history.
- Model version comparison.
- Monitoring for prediction distribution changes and model drift.
- Deployment hardening and operational observability.
