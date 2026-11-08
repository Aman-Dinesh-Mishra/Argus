
import json
from pathlib import Path
from datetime import date

import pandas as pd

from argus.data import load_data
from argus.split import time_split
from argus.baselines import dummy, logistic
from argus.models import random_forest
from argus.cv import run_time_series_cv


# Project paths
ROOT = Path(__file__).resolve().parents[3]

DATA = ROOT / "data" / "raw" / "creditcard.csv"
OUT = ROOT / "docs" / "eval-results"

OUT.mkdir(parents=True, exist_ok=True)

print("Script location:", Path(__file__).resolve())
print("Project root:", ROOT)
print("Dataset location:", DATA)
print("Dataset exists:", DATA.exists())
# Load and prepare data
df = load_data(DATA)

train, val, _test = time_split(df)

cv_data = pd.concat(
    [train, val],
    ignore_index=True,
)


# Define model factories
model_factories = {
    "dummy": dummy,
    "logistic": logistic,
    "random_forest": random_forest,
}


# Run cross-validation
results = {}

for name, model_factory in model_factories.items():
    print(f"\nRunning cross-validation for: {name}")

    model_results = run_time_series_cv(
        df=cv_data,
        model_factory=model_factory,
        n_splits=5,
        min_validation_frauds=5,
    )

    results[name] = model_results

    print(f"PR-AUC: {model_results.get('pr_auc_mean', 'N/A')}")
    print(f"Completed folds: {model_results['completed_folds']}")
    print(f"Skipped folds: {model_results['skipped_folds']}")


# Save JSON results
run_date = date.today().isoformat()

json_path = OUT / f"{run_date}_cross_validation.json"

json_path.write_text(
    json.dumps(results, indent=4),
    encoding="utf-8",
)

print(f"\nJSON results saved to: {json_path}")


# Generate Markdown report
md_path = OUT / f"{run_date}_cross_validation.md"

report = [
    "# ARGUS - Time Series Cross Validation",
    "",
    f"Evaluation date: {run_date}",
    "",
    "| Model | PR-AUC Mean | PR-AUC Std | Precision @ 80% Recall | Training Time (s) | Completed Folds |",
    "|---|---:|---:|---:|---:|---:|",
]

for name, result in results.items():
    report.append(
        f"| {name} "
        f"| {result.get('pr_auc_mean', 'N/A')} "
        f"| {result.get('pr_auc_std', 'N/A')} "
        f"| {result.get('precision_at_recall_80_mean', 'N/A')} "
        f"| {result.get('training_time_mean', 'N/A')} "
        f"| {result['completed_folds']} |"
    )

md_path.write_text(
    "\n".join(report),
    encoding="utf-8",
)

print(f"Markdown report saved to: {md_path}")
