import json
import joblib
import pandas as pd
import shap

from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from pydantic import BaseModel, ConfigDict, Field

from argus.explain import select_fraud_class, get_top_contributions


PROJECT_ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
CURRENT_FILE = ARTIFACTS_DIR / "current.json"


class TransactionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    Time: float = Field(ge=0, allow_inf_nan=False)
    Amount: float = Field(ge=0, allow_inf_nan=False)
    V1: float = Field(allow_inf_nan=False)
    V2: float = Field(allow_inf_nan=False)
    V3: float = Field(allow_inf_nan=False)
    V4: float = Field(allow_inf_nan=False)
    V5: float = Field(allow_inf_nan=False)
    V6: float = Field(allow_inf_nan=False)
    V7: float = Field(allow_inf_nan=False)
    V8: float = Field(allow_inf_nan=False)
    V9: float = Field(allow_inf_nan=False)
    V10: float = Field(allow_inf_nan=False)
    V11: float = Field(allow_inf_nan=False)
    V12: float = Field(allow_inf_nan=False)
    V13: float = Field(allow_inf_nan=False)
    V14: float = Field(allow_inf_nan=False)
    V15: float = Field(allow_inf_nan=False)
    V16: float = Field(allow_inf_nan=False)
    V17: float = Field(allow_inf_nan=False)
    V18: float = Field(allow_inf_nan=False)
    V19: float = Field(allow_inf_nan=False)
    V20: float = Field(allow_inf_nan=False)
    V21: float = Field(allow_inf_nan=False)
    V22: float = Field(allow_inf_nan=False)
    V23: float = Field(allow_inf_nan=False)
    V24: float = Field(allow_inf_nan=False)
    V25: float = Field(allow_inf_nan=False)
    V26: float = Field(allow_inf_nan=False)
    V27: float = Field(allow_inf_nan=False)
    V28: float = Field(allow_inf_nan=False)


class Contribution(BaseModel):
    feature: str
    feature_value: float
    shap_value: float
    direction: str


class ScoreResponse(BaseModel):
    probability: float
    risk_band: str
    exceeds_threshold: bool
    threshold: float
    top_contributions: list[Contribution]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    threshold: float


def transaction_to_frame(
    transaction: TransactionInput,
    feature_order: list[str],
) -> pd.DataFrame:
    data = transaction.model_dump()

    return pd.DataFrame(
        [[data[feature] for feature in feature_order]],
        columns=feature_order,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    config = json.loads(CURRENT_FILE.read_text(encoding="utf-8"))

    model_path = ARTIFACTS_DIR / config["model_path"]
    model = joblib.load(model_path)

    model_features = list(model.feature_names_in_)
    input_features = set(TransactionInput.model_fields.keys())

    if (
        len(model_features) != len(input_features)
        or set(model_features) != input_features
    ):
        missing = input_features - set(model_features)
        unexpected = set(model_features) - input_features

        raise ValueError(
            f"Feature mismatch. Missing: {missing}, "
            f"Unexpected: {unexpected}"
        )

    if 1 not in model.classes_:
        raise ValueError("Fraud class 1 is not present in the model.")

    threshold = float(config["threshold"])

    if not 0 <= threshold <= 1:
        raise ValueError("Threshold must be between 0 and 1.")

    model_directory = model_path.parent

    metrics = json.loads(
        (model_directory / "evaluation.json").read_text(
            encoding="utf-8"
        )
    )

    threshold_curve = json.loads(
        (model_directory / "threshold_curve.json").read_text(
            encoding="utf-8"
        )
    )

    global_shap = json.loads(
        (model_directory / "shap_global.json").read_text(
            encoding="utf-8"
        )
    )

    explainer = shap.TreeExplainer(model)

    app.state.model = model
    app.state.features = model_features
    app.state.threshold = threshold
    app.state.explainer = explainer
    app.state.metrics = metrics
    app.state.threshold_curve = threshold_curve
    app.state.global_shap = global_shap

    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
async def health(request: Request):
    return HealthResponse(
        status="ok",
        model_loaded=hasattr(request.app.state, "model"),
        threshold=request.app.state.threshold,
    )


def predict_fraud_probability(
    model,
    X: pd.DataFrame,
) -> float:
    probabilities = model.predict_proba(X)
    fraud_index = list(model.classes_).index(1)

    return float(probabilities[0, fraud_index])


def exceeds_threshold(
    probability: float,
    threshold: float,
) -> bool:
    return probability >= threshold


def explain_transaction(
    explainer,
    X: pd.DataFrame,
) -> list[dict]:
    explanation = explainer(X)

    raw_values = (
        explanation.values
        if hasattr(explanation, "values")
        else explanation
    )

    shap_values = select_fraud_class(
        raw_values,
        n_samples=len(X),
        n_features=X.shape[1],
    )

    return get_top_contributions(
        shap_values=shap_values,
        X_sample=X,
        row_index=0,
        top_n=5,
    )


def classify_risk(probability: float) -> str:
    if probability >= 0.70:
        return "HIGH"
    elif probability >= 0.30:
        return "MEDIUM"

    return "LOW"


@app.post("/score", response_model=ScoreResponse)
@app.post(
    "/predict",
    response_model=ScoreResponse,
    include_in_schema=False,
)
async def score(
    transaction: TransactionInput,
    request: Request,
):
    model = request.app.state.model
    threshold = request.app.state.threshold
    explainer = request.app.state.explainer

    X = transaction_to_frame(
        transaction,
        request.app.state.features,
    )

    probability = predict_fraud_probability(model, X)

    threshold_exceeded = exceeds_threshold(
        probability,
        threshold,
    )

    risk_band = classify_risk(probability)

    contributions = explain_transaction(
        explainer,
        X,
    )

    return ScoreResponse(
        probability=probability,
        risk_band=risk_band,
        exceeds_threshold=threshold_exceeded,
        threshold=threshold,
        top_contributions=contributions,
    )


@app.get("/metrics")
async def metrics(request: Request):
    return request.app.state.metrics


@app.get("/threshold-curve")
async def threshold_curve(request: Request):
    return request.app.state.threshold_curve


@app.get("/shap-global")
async def shap_global(request: Request):
    return request.app.state.global_shap