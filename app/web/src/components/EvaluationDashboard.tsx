import { useEffect, useState } from "react";
import { getMetrics, getThresholdCurve, getGlobalShap } from "../services/api";
import PRChart from "../charts/PRChart";
import ThresholdChart from "../charts/ThresholdChart";
import ThresholdCostChart from "../charts/ThresholdCostChart";
import GlobalSHAPChart from "../charts/GlobalSHAPChart";
import type {
  EvaluationMetricsResponse,
  GlobalSHAPResponse,
  ThresholdPoint,
} from "../types/api";

export default function EvaluationDashboard() {
  const [metrics, setMetrics] = useState<EvaluationMetricsResponse | null>(
    null,
  );
  const [curve, setCurve] = useState<ThresholdPoint[]>([]);
  const [shapData, setShapData] = useState<GlobalSHAPResponse | null>(null);
  const [shapError, setShapError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvaluation() {
      try {
        const [metricsResult, curveResult, shapResult] =
          await Promise.allSettled([
            getMetrics(),
            getThresholdCurve(),
            getGlobalShap(),
          ]);

        if (metricsResult.status === "rejected") {
          throw metricsResult.reason;
        }

        if (curveResult.status === "rejected") {
          throw curveResult.reason;
        }

        setMetrics(metricsResult.value);
        setCurve(curveResult.value);

        if (shapResult.status === "fulfilled") {
          setShapData(shapResult.value);
        } else {
          setShapError(
            shapResult.reason instanceof Error
              ? shapResult.reason.message
              : "Unable to load global SHAP data.",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load evaluation data",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvaluation();
  }, []);

  if (loading) {
    return (
      <section className="evaluation-section">
        Loading model evaluation...
      </section>
    );
  }

  if (error || !metrics) {
    return (
      <section className="evaluation-section">
        <p className="evaluation-error">
          {error || "Evaluation data unavailable"}
        </p>
      </section>
    );
  }

  const test = metrics.test;

  const metricCards = [
    { label: "PR-AUC", value: test.pr_auc.toFixed(4) },
    { label: "ROC-AUC", value: test.roc_auc.toFixed(4) },
    { label: "Precision", value: `${(test.precision * 100).toFixed(2)}%` },
    { label: "Recall", value: `${(test.recall * 100).toFixed(2)}%` },
    { label: "F1 Score", value: test.f1.toFixed(4) },
    { label: "Threshold", value: test.threshold.toFixed(4) },
  ];

  const baselines = [
    { name: "Dummy", data: metrics.validation.dummy },
    { name: "Logistic Regression", data: metrics.validation.logistic },
    { name: "Random Forest", data: metrics.validation.random_forest },
  ];

  return (
    <section className="evaluation-section">
      <div className="section-heading">
        <div>
          <span className="section-eyebrow">MODEL PERFORMANCE</span>
          <h2>Evaluation Overview</h2>
          <p>Final model performance on the held-out test dataset.</p>
        </div>
      </div>

      <div className="metrics-grid">
        {metricCards.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>

      <div className="evaluation-panel">
        <div className="panel-heading">
          <div>
            <h3>Precision–Recall Curve</h3>
            <p>
              Precision versus recall across sampled classification thresholds.
            </p>
          </div>
        </div>
        <PRChart data={curve} />
      </div>

      <div className="evaluation-panel">
        <div className="panel-heading">
          <div>
            <h3>Global Feature Importance (SHAP)</h3>
            <p>
              Features with the greatest average contribution magnitude across{" "}
              {shapData?.sample_size.toLocaleString() ?? "the"} sampled
              transactions.
            </p>
          </div>
        </div>

        {shapError ? (
          <p className="evaluation-error">{shapError}</p>
        ) : shapData ? (
          <GlobalSHAPChart data={shapData.features} />
        ) : (
          <p>No global SHAP data available.</p>
        )}
      </div>

      <div className="evaluation-panel">
        <div className="panel-heading">
          <div>
            <h3>Threshold Analysis</h3>
            <p>Precision, recall and F1 across classification thresholds.</p>
          </div>
          <span className="threshold-indicator">
            Selected: {test.threshold.toFixed(4)}
          </span>
        </div>
        <ThresholdChart data={curve} />
      </div>

      <div className="evaluation-panel">
        <div className="panel-heading">
          <div>
            <h3>Threshold vs Cost</h3>
            <p>
              Observe how total misclassification cost changes across
              classification thresholds.
            </p>
          </div>
        </div>
        <ThresholdCostChart data={curve} />
      </div>

      <div className="evaluation-panel">
        <div className="panel-heading">
          <div>
            <h3>Validation Baselines</h3>
            <p>Comparison of models on the validation dataset.</p>
          </div>
        </div>

        <div className="baseline-table-wrapper">
          <table className="baseline-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>PR-AUC</th>
                <th>ROC-AUC</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1</th>
              </tr>
            </thead>
            <tbody>
              {baselines.map(({ name, data }) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{data.pr_auc.toFixed(4)}</td>
                  <td>{data.roc_auc.toFixed(4)}</td>
                  <td>{(data.precision * 100).toFixed(2)}%</td>
                  <td>{(data.recall * 100).toFixed(2)}%</td>
                  <td>{data.f1.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="evaluation-panel">
        <h3>Test Confusion Matrix</h3>
        <div className="confusion-grid">
          <div>
            <span>True Negatives</span>
            <strong>{test.confusion.tn.toLocaleString()}</strong>
          </div>
          <div>
            <span>False Positives</span>
            <strong>{test.confusion.fp.toLocaleString()}</strong>
          </div>
          <div>
            <span>False Negatives</span>
            <strong>{test.confusion.fn.toLocaleString()}</strong>
          </div>
          <div>
            <span>True Positives</span>
            <strong>{test.confusion.tp.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
