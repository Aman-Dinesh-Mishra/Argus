export type TransactionFeature = "Time" | "Amount" | `V${number}`;

export interface TransactionInput {
  Time: number;
  Amount: number;
  [feature: `V${number}`]: number;
}

export interface SHAPContribution {
  feature: string;
  feature_value: number;
  shap_value: number;
  direction: string;
}

export interface PredictionResponse {
  probability: number;
  risk_band: "LOW" | "MEDIUM" | "HIGH";
  exceeds_threshold: boolean;
  threshold: number;
  top_contributions: SHAPContribution[];
}
export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface ModelMetrics {
  pr_auc: number;
  roc_auc: number;
  precision: number;
  recall: number;
  f1: number;
  threshold: number;
  confusion: ConfusionMatrix;
  threshold_table?: {
    target_recall: number;
    threshold: number;
    precision: number;
    recall: number;
  }[];
}

export interface ValidationMetrics {
  dummy: ModelMetrics;
  logistic: ModelMetrics;
  random_forest: ModelMetrics;
}

export interface EvaluationMetricsResponse {
  validation: ValidationMetrics;
  test: ModelMetrics;
}

export interface ThresholdPoint {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  false_positives: number;
  false_negatives: number;
  total_cost: number;
}

export interface GlobalSHAPFeature {
  feature: string;
  mean_abs_shap: number;
  mean_shap: number;
}

export interface GlobalSHAPResponse {
  explanation_type: "global";
  class_explained: number;
  class_name: string;
  sample_size: number;
  method: string;
  features: GlobalSHAPFeature[];
}
