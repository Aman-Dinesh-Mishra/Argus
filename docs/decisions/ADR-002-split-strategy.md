# ADR-002: Chronological Train-Validation-Test Split

## Status

Accepted

## Context

Fraud detection is a time-dependent problem. Transactions occur over time, and a model should ideally be evaluated on transactions that occur after the data used for training.

A random split could distribute transactions from different time periods across training and testing, potentially giving an overly optimistic estimate of future performance.

The dataset provides a `Time` column representing elapsed time since the first transaction.

## Decision

Use a chronological 70/15/15 train-validation-test split.

- Training: 70% — model training.
- Validation: 15% — model comparison and threshold selection.
- Test: 15% — final unbiased evaluation.

Before splitting, sort the dataset by the `Time` column in ascending order.

The training set contains earlier transactions, followed by validation and test transactions.

## Consequences

- The evaluation better reflects the scenario of predicting fraud on later transactions.
- Validation data is used for model selection and operating threshold selection.
- Test data remains separate from model selection and threshold tuning.
- Temporal differences between earlier and later transactions may affect model performance.
- Transactions sharing the same `Time` value can occur across split boundaries because the split is performed by row position after sorting.
