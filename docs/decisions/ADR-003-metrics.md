# ADR-003: Evaluation Metrics

## Status

Accepted

## Context

ARGUS is a binary fraud classification system with a highly imbalanced dataset.

Accuracy alone is insufficient for evaluating fraud detection because a model could classify most transactions as legitimate and still achieve high accuracy while failing to detect fraudulent transactions.

The project therefore requires metrics that evaluate ranking performance as well as classification performance at a selected threshold.

## Decision

Use the following evaluation metrics:

### 1. PR-AUC (Precision-Recall AUC)

Measures the trade-off between precision and recall across different classification thresholds.

It is particularly useful for evaluating models on highly imbalanced datasets.

### 2. ROC-AUC

Measures the model's ability to distinguish between fraudulent and legitimate transactions across different thresholds.

### 3. Precision

Measures the proportion of transactions predicted as fraud that are actually fraudulent.

Higher precision means fewer false alarms.

### 4. Recall

Measures the proportion of actual fraudulent transactions correctly detected by the model.

Higher recall means fewer missed fraudulent transactions.

### 5. F1-score

The harmonic mean of precision and recall. It provides a combined measure of both metrics.

### 6. Confusion Matrix

Tracks:

- True Positives (TP): Fraud correctly detected.
- True Negatives (TN): Legitimate transactions correctly identified.
- False Positives (FP): Legitimate transactions incorrectly flagged as fraud.
- False Negatives (FN): Fraudulent transactions incorrectly classified as legitimate.

## Consequences

- PR-AUC is used to assess performance under class imbalance.
- ROC-AUC provides an additional measure of classification ranking quality.
- Precision and recall help evaluate the operational trade-off between false alarms and missed fraud.
- F1-score provides a combined precision-recall measure.
- The confusion matrix makes classification errors easier to interpret.
- Metrics are evaluated using validation and final test data at their respective stages.
