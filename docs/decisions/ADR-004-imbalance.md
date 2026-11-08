# ADR-004: Handling Class Imbalance

## Status

Accepted

## Context

The Credit Card Fraud Detection dataset contains 284,807 transactions, of which only 492 are fraudulent.

This creates a highly imbalanced binary classification problem where legitimate transactions significantly outnumber fraudulent transactions.

A model trained without considering this imbalance may become biased toward predicting the majority class and fail to identify fraudulent transactions.

## Decision

Use class weighting to account for the imbalance during model training.

The following approaches are implemented:

- **Dummy Classifier:** Uses the prior strategy as a baseline to understand majority-class prediction performance.
- **Logistic Regression:** Uses `class_weight="balanced"` to adjust class weights according to class frequencies.
- **Random Forest:** Uses `class_weight="balanced_subsample"` to calculate class weights for individual bootstrap samples.

PR-AUC, recall, precision and the confusion matrix are used alongside ROC-AUC to evaluate model performance.

## Consequences

- Fraudulent transactions receive greater importance during model training.
- The models can better account for the minority fraud class.
- Class weighting does not guarantee improved performance and must be evaluated empirically.
- Increasing sensitivity to fraudulent transactions can also increase false positives.
- Threshold selection is handled separately using validation data and the classification cost assumptions documented in ADR-005.
