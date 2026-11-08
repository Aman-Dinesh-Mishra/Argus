
import json
from pathlib import Path
from datetime import date
import joblib

from argus.data import load_data, split_xy
from argus.split import time_split
from argus.baselines import dummy, logistic
from argus.models import random_forest
from argus.evaluate import evaluate
from argus.thresholds import threshold_table, build_threshold_curve
from argus.explain import save_global_explanation

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "data" / "raw" / "creditcard.csv"

df = load_data(DATA)
train, val, test = time_split(df)

X_tr, y_tr = split_xy(train)
X_va, y_va = split_xy(val)
X_te, y_te = split_xy(test)

candidates = {
    "dummy": dummy(),
    "logistic": logistic(),
    "random_forest": random_forest(),
}

results = {}

for name, model in candidates.items():
    model.fit(X_tr, y_tr)

    scores = model.predict_proba(X_va)[:, 1]
    results[name] = evaluate(y_va, scores)

    print(
        name,
        "pr_auc=%.4f" % results[name]["pr_auc"],
        "recall=%.4f" % results[name]["recall"],
    )

    if name != "dummy":
        table = threshold_table(
            y_va,
            scores,
            targets=(0.7, 0.8, 0.9),
        )

        results[name]["threshold_table"] = table

        for row in table:
            print("   ", {k: round(v, 4) for k, v in row.items()})

    if name == "random_forest":
        final_model = model
        final_scores = scores

# Build the validation threshold curve.
threshold_result = build_threshold_curve(
    y_va,
    final_scores,
    missed_fraud_cost=50,
    false_alarm_cost=1,
)

selected_threshold = threshold_result["selected_threshold"]

print("\nSelected operating threshold:", selected_threshold)
print("Validation cost:", threshold_result["selected_cost"])

# Create final artifact directory.
out = (
    ROOT
    / "artifacts"
    / f"{date.today()}_random_forest_v1"
)

out.mkdir(parents=True, exist_ok=True)

# Final evaluation on the untouched test set.
test_scores = final_model.predict_proba(X_te)[:, 1]

test_results = evaluate(
    y_te,
    test_scores,
    threshold=selected_threshold,
)

print("\nFinal Test Evaluation")
print(json.dumps(test_results, indent=2))

# Save final test evaluation immediately.
test_artifact = {
    "model": "random_forest",
    "threshold": selected_threshold,
    "evaluation": test_results,
}

test_path = out / "test_evaluation.json"

test_path.write_text(
    json.dumps(test_artifact, indent=2),
    encoding="utf-8",
)

print("\nTest evaluation saved:", test_path)

# Save only the selected final model.
joblib.dump(final_model, out / "model.joblib")

# Save threshold curve.
(out / "threshold_curve.json").write_text(
    json.dumps(threshold_result, indent=2),
    encoding="utf-8",
)

# Save model evaluation and candidate comparisons.
(out / "evaluation.json").write_text(
    json.dumps(results, indent=2),
    encoding="utf-8",
)

# Generate global SHAP explanations using validation data.
sample, shap_values, shap_result = save_global_explanation(
    model=final_model,
    X_val=X_va,
    output_path=out / "shap_global.json",
    sample_size=1500,
)

print("\nSHAP explanations generated:", len(shap_result["features"]))

print("\nFinal model artifact saved:", out)
