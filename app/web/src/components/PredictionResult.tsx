import type { PredictionResponse } from "../types/api";

interface PredictionResultProps {
  result: PredictionResponse | null;
}

export default function PredictionResult({ result }: PredictionResultProps) {
  if (!result) {
    return (
      <div className="prediction-empty">
        <div className="empty-icon">◎</div>
        <h3>Awaiting Analysis</h3>
        <p>
          Submit a transaction to generate its risk assessment and view the
          factors influencing the prediction.
        </p>
      </div>
    );
  }

  const probability = result.probability * 100;
  const threshold = result.threshold * 100;

  const riskStyles = {
    LOW: "risk-low",
    MEDIUM: "risk-medium",
    HIGH: "risk-high",
  };

  return (
    <div className="prediction-result">
      <div className="result-overview">
        <div className={`risk-indicator ${riskStyles[result.risk_band]}`}>
          <span className="risk-indicator-dot"></span>
          {result.risk_band} RISK
        </div>

        <div className="probability-section">
          <span className="result-label">Fraud Probability</span>
          <strong>{probability.toFixed(2)}%</strong>
        </div>

        <div className="probability-track">
          <div
            className={`probability-fill ${riskStyles[result.risk_band]}`}
            style={{ width: `${Math.min(probability, 100)}%` }}
          />
        </div>
      </div>

      <div className="result-details">
        <div className="result-detail">
          <span>Decision Threshold</span>
          <strong>{threshold.toFixed(2)}%</strong>
        </div>

        <div className="result-detail">
          <span>Threshold Status</span>
          <strong>
            {result.exceeds_threshold ? "Exceeded" : "Not exceeded"}
          </strong>
        </div>
      </div>

      <div className="contributions-section">
        <div className="contributions-heading">
          <div>
            <h3>Prediction Contributors</h3>
            <p>Features with the largest SHAP contributions.</p>
          </div>
          <span className="contribution-count">
            {result.top_contributions.length} Features
          </span>
        </div>

        <div className="contributions-list">
          {result.top_contributions.map((item) => (
            <div className="contribution-row" key={item.feature}>
              <div className="contribution-info">
                <strong>{item.feature}</strong>
                <span>
                  {item.direction === "increases_fraud_prediction"
                    ? "Increases fraud prediction"
                    : "Decreases fraud prediction"}
                </span>
              </div>

              <strong
                className={
                  item.shap_value >= 0
                    ? "contribution-positive"
                    : "contribution-negative"
                }
              >
                {item.shap_value > 0 ? "+" : ""}
                {item.shap_value.toFixed(5)}
              </strong>
            </div>
          ))}
        </div>
      </div>

      <p className="result-disclaimer">
        Predictions are model-generated risk estimates and should not be treated
        as definitive evidence of fraud.
      </p>
    </div>
  );
}
