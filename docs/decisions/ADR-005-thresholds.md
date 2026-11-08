# ADR-005: Validation-Based Threshold Selection

## Status

Accepted

## Context

Fraud detection involves highly imbalanced data. Using the default classification threshold of 0.5 may not provide the desired balance between missed fraud transactions and false alarms.

The Random Forest model achieved a validation PR-AUC of 0.8701. However, selecting an operating threshold requires considering the business cost of classification errors.

## Decision

Select the operating threshold using the validation dataset by minimizing the total classification cost.

The assumed costs are:

- False Negative (missed fraud): 50
- False Positive (false alarm): 1

The selected threshold is approximately **0.1129**, with a validation cost of **357**.

## Consequences

- The selected threshold prioritizes reducing missed fraud transactions.
- Lowering the threshold increases fraud detection but can also increase false alarms.
- Threshold selection is performed using validation data only.
- The test dataset remains reserved for final, unbiased evaluation.
- The cost assumptions are configurable business assumptions, not measured real-world financial losses.
