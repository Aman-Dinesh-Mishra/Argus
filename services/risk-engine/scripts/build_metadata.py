import hashlib
import json
import platform
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

import joblib

from argus.data import load_data
from argus.split import time_split

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "data" / "raw" / "creditcard.csv"

ARTIFACT_DIR = ROOT / "artifacts" / "2026-11-04_random_forest_v1"


def sha256_file(path):
    digest = hashlib.sha256()

    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def get_version(package):
    try:
        return version(package)
    except PackageNotFoundError:
        return None


def describe_split(part):
    return {
        "rows": int(len(part)),
        "fraud_count": int(part["Class"].sum()),
        "time_min": float(part["Time"].min()),
        "time_max": float(part["Time"].max()),
    }


# Load dataset and reproduce the chronological split.
df = load_data(DATA)
train, val, test = time_split(df)

# Load the already-trained model and saved evaluation.
model = joblib.load(ARTIFACT_DIR / "model.joblib")

with open(ARTIFACT_DIR / "test_evaluation.json", encoding="utf-8") as file:
    test_artifact = json.load(file)

selected_threshold = float(test_artifact["threshold"])

metadata = {
    "created_at": datetime.now(timezone.utc).isoformat(),
    "dataset": {
        "name": DATA.name,
        "sha256": sha256_file(DATA),
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
    },
    "split": {
        "strategy": "chronological",
        "time_column": "Time",
        "ratios": {
            "train": 0.70,
            "validation": 0.15,
            "test": 0.15,
        },
        "train": describe_split(train),
        "validation": describe_split(val),
        "test": describe_split(test),
    },
    "model": {
        "name": "RandomForestClassifier",
        "parameters": model.get_params(),
    },
    "threshold_selection": {
        "selected_threshold": selected_threshold,
        "selection_dataset": "validation",
        "missed_fraud_cost": 50,
        "false_alarm_cost": 1,
        "validation_cost": 357.0,
    },
    "library_versions": {
        "python": platform.python_version(),
        "pandas": get_version("pandas"),
        "numpy": get_version("numpy"),
        "scikit_learn": get_version("scikit-learn"),
        "shap": get_version("shap"),
        "joblib": get_version("joblib"),
    },
}

metadata_path = ARTIFACT_DIR / "metadata.json"

metadata_path.write_text(
    json.dumps(metadata, indent=2),
    encoding="utf-8",
)

# Point to the active artifact using relative paths.
current = {
    "artifact_dir": ARTIFACT_DIR.name,
    "model_path": f"{ARTIFACT_DIR.name}/model.joblib",
    "metadata_path": f"{ARTIFACT_DIR.name}/metadata.json",
    "threshold": selected_threshold,
}

current_path = ROOT / "artifacts" / "current.json"

current_path.write_text(
    json.dumps(current, indent=2),
    encoding="utf-8",
)

print("Metadata saved:", metadata_path)
print("Current model pointer saved:", current_path)