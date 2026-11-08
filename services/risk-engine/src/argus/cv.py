
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from time import perf_counter

from argus.data import split_xy
from argus.evaluate import evaluate
from argus.thresholds import threshold_table


def run_time_series_cv(
    df: pd.DataFrame,
    model_factory,
    n_splits: int = 5,
    min_validation_frauds: int = 5,
):
    """Evaluate a model using expanding-window time-series cross-validation."""

    # Sort transactions chronologically
    df = df.sort_values("Time").reset_index(drop=True)

    # Separate input features and target
    X, y = split_xy(df)

    # Create expanding-window time-series splits
    splitter = TimeSeriesSplit(n_splits=n_splits)

    fold_results = []

    for fold, (train_idx, val_idx) in enumerate(
        splitter.split(X), start=1
    ):
        # Get training and validation data for this fold
        X_train = X.iloc[train_idx]
        X_val = X.iloc[val_idx]

        y_train = y.iloc[train_idx]
        y_val = y.iloc[val_idx]

        # Count fraud transactions in validation data
        fraud_count = int(y_val.sum())

        # Skip folds with insufficient fraud cases
        if fraud_count < min_validation_frauds:
            fold_results.append({
                "fold": fold,
                "status": "skipped",
                "fraud_count": fraud_count,
                "reason": "Insufficient fraud cases",
            })
            continue

        # Skip folds containing only one validation class
        if y_val.nunique() < 2:
            fold_results.append({
                "fold": fold,
                "status": "skipped",
                "fraud_count": fraud_count,
                "reason": "Validation contains only one class",
            })
            continue

        # Skip folds where training contains only one class
        if y_train.nunique() < 2:
            fold_results.append({
                "fold": fold,
                "status": "skipped",
                "fraud_count": fraud_count,
                "reason": "Training contains only one class",
            })
            continue

        # Create a fresh model for every fold
        model = model_factory()

        # Measure model training time
        start_time = perf_counter()
        model.fit(X_train, y_train)
        training_time = perf_counter() - start_time

        # Predict fraud probabilities
        y_score = model.predict_proba(X_val)[:, 1]

        # Calculate evaluation metrics
        metrics = evaluate(y_val, y_score)

        # Find precision at 80% recall
        threshold_results = threshold_table(
            y_val,
            y_score,
            targets=(0.8,),
        )

        precision_at_recall_80 = (
            threshold_results[0]["precision"]
            if threshold_results
            else None
        )

        # Store results for this fold
        fold_results.append({
            "fold": fold,
            "status": "completed",
            "fraud_count": fraud_count,
            "pr_auc": metrics["pr_auc"],
            "roc_auc": metrics["roc_auc"],
            "precision_at_recall_80": precision_at_recall_80,
            "training_time": training_time,
        })

    # Keep only successfully evaluated folds
    completed = [
        result for result in fold_results
        if result["status"] == "completed"
    ]

    # Ensure at least one fold was evaluated
    if not completed:
        raise ValueError(
            "No valid folds available for model evaluation."
        )

    # Collect metrics from completed folds
    pr_auc_scores = [
        result["pr_auc"] for result in completed
    ]

    precision_scores = [
        result["precision_at_recall_80"]
        for result in completed
        if result["precision_at_recall_80"] is not None
    ]

    training_times = [
        result["training_time"] for result in completed
    ]

    # Build overall cross-validation summary
    summary = {
        "completed_folds": len(completed),
        "skipped_folds": len(fold_results) - len(completed),
        "fold_results": fold_results,
    }

    # Calculate mean and standard deviation of PR-AUC
    summary["pr_auc_mean"] = float(np.mean(pr_auc_scores))

    summary["pr_auc_std"] = (
        float(np.std(pr_auc_scores, ddof=1))
        if len(pr_auc_scores) > 1
        else None
    )

    # Calculate mean precision at 80% recall
    summary["precision_at_recall_80_mean"] = (
        float(np.mean(precision_scores))
        if precision_scores
        else None
    )

    # Calculate average model training time
    summary["training_time_mean"] = float(
        np.mean(training_times)
    )

    return summary
