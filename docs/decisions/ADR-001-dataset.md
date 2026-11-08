# ADR-001: Dataset Selection

## Status

Accepted

## Context

ARGUS requires a binary classification dataset to develop and evaluate a fraud detection system.

The Credit Card Fraud Detection dataset (`creditcard.csv`) was selected for this project. It contains 284,807 transactions and 31 columns.

The target variable is `Class`:

- `0` represents a legitimate transaction.
- `1` represents a fraudulent transaction.

The dataset includes:

- `Time`: elapsed time between transactions and the first transaction in the dataset.
- `Amount`: transaction amount.
- `V1` to `V28`: anonymized PCA-transformed features.
- `Class`: fraud classification label.

The dataset contains 492 fraudulent transactions, making it highly imbalanced.

## Decision

Use `creditcard.csv` as the primary dataset for developing the ARGUS fraud detection model.

Treat `Class` as the prediction target and the remaining columns as model input features.

## Consequences

- The project can evaluate binary fraud classification.
- The dataset provides a highly imbalanced classification problem.
- Anonymized PCA features limit direct interpretation of individual feature meanings.
- The `Time` column enables chronological train-validation-test splitting.
- Results represent performance on this dataset and should not be treated as guaranteed real-world fraud detection performance.
