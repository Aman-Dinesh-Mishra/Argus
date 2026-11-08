import numpy as np
from sklearn.metrics import precision_recall_curve


def threshold_table(y_true, y_score, targets=(0.5, 0.7, 0.8, 0.9)):
    """For each target recall, report the highest threshold that still reaches it."""
    precision, recall, thresholds = precision_recall_curve(y_true, y_score)
    rows = []
    for target in targets:
        ok = np.where(recall[:-1] >= target)[0]
        if len(ok) == 0:
            continue
        i = ok[-1]
        rows.append({
            "target_recall": target,
            "threshold": float(thresholds[i]),
            "precision": float(precision[i]),
            "recall": float(recall[i]),
        })
    return rows

def build_threshold_curve(
        y_true,
        y_score,
        missed_fraud_cost=50,
        false_alarm_cost=1,
        n_points=100,
):
    """Build a cost-based threshold curve & select Operating Threshold"""
    y_true = np.asarray(y_true)
    y_score = np.asarray(y_score)

    if y_true.ndim != 1 or y_score.ndim != 1:
        raise ValueError("y_true & y_score must be 1D")
    if len(y_true) != len(y_score) or len(y_score) == 0:
        raise ValueError("Inputs must be equal, non-zero lengths")
    if not np.all(np.isin(y_true, [0, 1])):
        raise ValueError("y_true must contain only binary labels 0 and 1")

    if not np.all(np.isfinite(y_score)):
        raise ValueError("y_score contains non-finite values")

    if missed_fraud_cost < 0 or false_alarm_cost < 0:
        raise ValueError("Cost values cannot be negative")

    if n_points < 2:
        raise ValueError("n_points must be at least 2")
    # Generate all candidate thresholds.
    _, _, thresholds = precision_recall_curve(y_true, y_score)

    # Add a threshold that predicts no transactions as fraud.
    no_alert_threshold = np.nextafter(np.max(y_score), np.inf)
    thresholds = np.append(thresholds, no_alert_threshold)

    # Sort scores once to calculate confusion counts efficiently.
    order = np.argsort(y_score)
    sorted_scores = y_score[order]
    sorted_labels = y_true[order]

    positive_suffix = np.cumsum(sorted_labels[::-1])[::-1]
    total_fraud = int(np.sum(y_true))

    # Number of scores greater than or equal to each threshold.
    positions = np.searchsorted(sorted_scores, thresholds, side="left")

    tp = np.zeros(len(thresholds), dtype=int)
    valid = positions < len(y_true)
    tp[valid] = positive_suffix[positions[valid]]

    predicted_positive = len(y_true) - positions
    fp = predicted_positive - tp
    fn = total_fraud - tp

    precision = np.divide(
        tp,
        predicted_positive,
        out=np.ones(len(thresholds), dtype=float),
        where=predicted_positive != 0,
    )

    recall = np.divide(
        tp,
        total_fraud,
        out=np.zeros(len(thresholds), dtype=float),
        where=total_fraud != 0,
    )

    f1 = np.divide(
        2 * precision * recall,
        precision + recall,
        out=np.zeros(len(thresholds), dtype=float),
        where=(precision + recall) != 0,
    )

    # Calculate business cost for every candidate.
    total_cost = (
        fn * missed_fraud_cost
        + fp * false_alarm_cost
    )

    # Select the minimum-cost threshold before downsampling.
    min_cost = np.min(total_cost)
    best_indices = np.where(total_cost == min_cost)[0]

    # Tie-break: choose the highest threshold among equal-cost options.
    best_idx = best_indices[-1]

    # Downsample the curve for dashboard visualization.
    sample_indices = np.linspace(
        0,
        len(thresholds) - 1,
        min(n_points, len(thresholds)),
        dtype=int,
    )

    # Always retain the selected operating threshold.
    sample_indices = np.unique(
        np.append(sample_indices, best_idx)
    )

    points = []

    for i in sample_indices:
        points.append({
            "threshold": float(thresholds[i]),
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "false_positives": int(fp[i]),
            "false_negatives": int(fn[i]),
            "total_cost": float(total_cost[i]),
        })

    return {
        "cost_assumption": {
            "missed_fraud_cost": missed_fraud_cost,
            "false_alarm_cost": false_alarm_cost,
        },
        "selection_metric": "minimum_validation_cost",
        "selected_threshold": float(thresholds[best_idx]),
        "selected_cost": float(total_cost[best_idx]),
        "tie_break_rule": "highest_threshold",
        "points": points,
    }
