import json
from pathlib import Path
import numpy as np
import pandas as pd
import shap


def select_fraud_class(raw_values, n_samples, n_features):
    """Normalize SHAP output across versions and select fraud class 1."""

    if isinstance(raw_values, list):
        if len(raw_values) == 2:
            values = np.asarray(raw_values[1])
        else:
            raise ValueError(
                f"Expected 2 class outputs, received {len(raw_values)}"
            )

    else:
        values = np.asarray(raw_values)

        if values.ndim == 3:
            # Shape: (samples, features, classes)
            if values.shape[0] == n_samples and values.shape[1] == n_features:
                values = values[:, :, 1]

            # Shape: (classes, samples, features)
            elif values.shape[1] == n_samples and values.shape[2] == n_features:
                values = values[1]

            else:
                raise ValueError(f"Unexpected 3D shape: {values.shape}")

        elif values.ndim != 2:
            raise ValueError(f"Unexpected SHAP dimensions: {values.shape}")

    if values.shape != (n_samples, n_features):
        raise ValueError(
            f"Expected {(n_samples, n_features)}, received {values.shape}"
        )

    return values


def compute_shap_values(model, X_val, sample_size=1500):
    """Calculate SHAP values on a reproducible validation sample."""

    if not isinstance(X_val, pd.DataFrame):
        raise TypeError("X_val must be a pandas DataFrame")

    sample = X_val.sample(
        n=min(sample_size, len(X_val)),
        random_state=42,
    )

    explainer = shap.TreeExplainer(model)

    explanation = explainer(sample)

    raw_values = (
        explanation.values
        if hasattr(explanation, "values")
        else explanation
    )

    shap_values = select_fraud_class(
        raw_values,
        n_samples=len(sample),
        n_features=sample.shape[1],
    )

    return sample, shap_values


def build_global_explanation(shap_values, feature_names, top_n=15):
    """Rank features by their mean absolute SHAP contribution."""

    mean_abs = np.abs(shap_values).mean(axis=0)
    mean_signed = shap_values.mean(axis=0)

    ranking = np.argsort(mean_abs)[::-1][:top_n]

    features = []

    for index in ranking:
        features.append({
            "feature": str(feature_names[index]),
            "mean_abs_shap": float(mean_abs[index]),
            "mean_shap": float(mean_signed[index]),
        })

    return {
        "explanation_type": "global",
        "class_explained": 1,
        "class_name": "fraud",
        "sample_size": int(shap_values.shape[0]),
        "method": "mean_absolute_shap",
        "features": features,
    }


def get_top_contributions(
    shap_values,
    X_sample,
    row_index,
    top_n=5,
):
    """Return the strongest SHAP contributions for one transaction."""

    if row_index < 0 or row_index >= len(X_sample):
        raise IndexError("Transaction index is out of range")

    row_values = shap_values[row_index]
    ranking = np.argsort(np.abs(row_values))[::-1][:top_n]

    contributions = []

    for index in ranking:
        shap_value = float(row_values[index])

        contributions.append({
            "feature": str(X_sample.columns[index]),
            "feature_value": float(X_sample.iloc[row_index, index]),
            "shap_value": shap_value,
            "direction": (
                "increases_fraud_prediction"
                if shap_value > 0
                else "decreases_fraud_prediction"
            ),
        })

    return contributions


def save_global_explanation(
    model,
    X_val,
    output_path,
    sample_size=1500,
):
    """Generate and save the global SHAP explanation."""

    sample, shap_values = compute_shap_values(
        model,
        X_val,
        sample_size,
    )

    result = build_global_explanation(
        shap_values,
        sample.columns,
        top_n=15,
    )

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    output_path.write_text(
        json.dumps(result, indent=2),
        encoding="utf-8",
    )

    return sample, shap_values, result