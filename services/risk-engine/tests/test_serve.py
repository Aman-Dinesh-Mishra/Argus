
import json
from types import SimpleNamespace

import numpy as np
import pytest
from fastapi.testclient import TestClient

from argus import serve


class FakeModel:
    def __init__(self):
        self.feature_names_in_ = np.array(
            ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]
        )
        self.classes_ = np.array([0, 1])

    def predict_proba(self, X):
        assert X.columns.tolist() == self.feature_names_in_.tolist()
        return np.array([[0.9, 0.1]])


class FakeExplainer:
    def __call__(self, X):
        values = np.zeros((len(X), X.shape[1], 2))
        values[0, 0, 1] = 0.25
        values[0, 1, 1] = -0.20
        values[0, 2, 1] = 0.15
        values[0, 3, 1] = -0.10
        values[0, 4, 1] = 0.05
        return SimpleNamespace(values=values)


def make_payload():
    return {
        "Time": 0,
        "Amount": 100,
        **{f"V{i}": 0 for i in range(1, 29)},
    }


@pytest.fixture
def client(tmp_path, monkeypatch):
    artifacts_dir = tmp_path / "artifacts"
    model_dir = artifacts_dir / "model-id"
    model_dir.mkdir(parents=True)

    current_file = artifacts_dir / "current.json"
    current_file.write_text(
        json.dumps({
            "model_path": "model-id/model.joblib",
            "threshold": 0.5,
        }),
        encoding="utf-8",
    )

    metrics_data = {
        "model": "random_forest",
        "pr_auc": 0.85,
        "roc_auc": 0.95,
    }

    threshold_data = {
        "thresholds": [0.1, 0.5, 0.9],
        "precision": [0.2, 0.7, 0.95],
        "recall": [0.95, 0.8, 0.4],
        "f1": [0.33, 0.74, 0.56],
        "false_positives": [100, 30, 5],
    }

    shap_data = {
        "features": ["V12", "V14", "V4"],
        "mean_abs_shap": [0.25, 0.18, 0.12],
    }

    (model_dir / "evaluation.json").write_text(
        json.dumps(metrics_data),
        encoding="utf-8",
    )

    (model_dir / "threshold_curve.json").write_text(
        json.dumps(threshold_data),
        encoding="utf-8",
    )

    (model_dir / "shap_global.json").write_text(
        json.dumps(shap_data),
        encoding="utf-8",
    )

    monkeypatch.setattr(serve, "ARTIFACTS_DIR", artifacts_dir)
    monkeypatch.setattr(serve, "CURRENT_FILE", current_file)

    monkeypatch.setattr(
        serve.joblib,
        "load",
        lambda path: FakeModel(),
    )

    monkeypatch.setattr(
        serve.shap,
        "TreeExplainer",
        lambda model: FakeExplainer(),
    )

    with TestClient(serve.app) as test_client:
        yield test_client


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "model_loaded": True,
        "threshold": 0.5,
    }


def test_score(client):
    response = client.post("/score", json=make_payload())

    assert response.status_code == 200

    data = response.json()

    assert data["probability"] == pytest.approx(0.1)
    assert data["risk_band"] == "LOW"
    assert data["exceeds_threshold"] is False
    assert data["threshold"] == 0.5
    assert len(data["top_contributions"]) == 5


def test_predict_alias(client):
    response = client.post("/predict", json=make_payload())

    assert response.status_code == 200
    assert response.json()["probability"] == pytest.approx(0.1)


def test_metrics(client):
    response = client.get("/metrics")

    assert response.status_code == 200
    assert response.json()["model"] == "random_forest"
    assert response.json()["pr_auc"] == 0.85


def test_threshold_curve(client):
    response = client.get("/threshold-curve")

    assert response.status_code == 200
    assert response.json()["thresholds"] == [0.1, 0.5, 0.9]
    assert response.json()["recall"] == [0.95, 0.8, 0.4]


def test_missing_feature_rejected(client):
    payload = make_payload()
    payload.pop("V28")

    response = client.post("/score", json=payload)

    assert response.status_code == 422


def test_extra_feature_rejected(client):
    payload = make_payload()
    payload["UnknownFeature"] = 10

    response = client.post("/score", json=payload)

    assert response.status_code == 422


def test_invalid_numeric_value_rejected(client):
    payload = make_payload()
    payload["Amount"] = "invalid"

    response = client.post("/score", json=payload)

    assert response.status_code == 422
