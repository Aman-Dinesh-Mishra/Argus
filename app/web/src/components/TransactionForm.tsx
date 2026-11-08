import { useState, type ChangeEvent, type FormEvent } from "react";
import { scoreTransaction } from "../services/api";
import { parseTransactionCSV } from "../utils/transactionCsv";
import type {
  PredictionResponse,
  TransactionFeature,
  TransactionInput,
} from "../types/api";

const FEATURES: TransactionFeature[] = [
  "Time",
  "Amount",
  ...Array.from(
    { length: 28 },
    (_, index) => `V${index + 1}` as TransactionFeature,
  ),
];

const MAX_CSV_SIZE = 10 * 1024 * 1024;

type InputMode = "sample" | "csv" | "manual";

interface TransactionFormProps {
  onPrediction: (result: PredictionResponse | null) => void;
}

export default function TransactionForm({
  onPrediction,
}: TransactionFormProps) {
  const [mode, setMode] = useState<InputMode>("sample");
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FEATURES.map((feature) => [feature, ""])),
  );
  const [transactions, setTransactions] = useState<TransactionInput[]>([]);
  const [selectedIndex, setSelectedIndex] = useState("0");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const busy = loading || uploading;

  async function analyzeTransaction(transaction: TransactionInput) {
    setLoading(true);
    setError("");
    onPrediction(null);

    try {
      const result = await scoreTransaction(transaction);
      onPrediction(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to analyze transaction.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSampleTransactions() {
    setError("");
    setLoading(true);
    setTransactions([]);
    setSelectedIndex("0");
    setFileName("");

    try {
      const response = await fetch("/sample-transactions.csv");

      if (!response.ok) {
        throw new Error(
          "Sample data is unavailable. Check public/sample-transactions.csv.",
        );
      }

      const content = await response.text();
      const parsed = parseTransactionCSV(content);

      if (parsed.length === 0) {
        throw new Error("The sample CSV contains no transactions.");
      }

      setTransactions(parsed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load sample data.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    input.value = "";

    if (!file) return;

    setError("");
    setTransactions([]);
    setSelectedIndex("0");
    setFileName("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    if (file.size === 0) {
      setError("The selected CSV file is empty.");
      return;
    }

    if (file.size > MAX_CSV_SIZE) {
      setError("CSV file size must not exceed 10 MB.");
      return;
    }

    setUploading(true);

    try {
      const content = await file.text();
      const parsed = parseTransactionCSV(content);

      if (parsed.length === 0) {
        throw new Error("The CSV file contains no transactions.");
      }

      setTransactions(parsed);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read CSV file.");
    } finally {
      setUploading(false);
    }
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (FEATURES.some((feature) => values[feature].trim() === "")) {
      setError("Enter values for all 30 transaction features.");
      return;
    }

    const transaction = {
      Time: Number(values.Time),
      Amount: Number(values.Amount),
    } as TransactionInput;

    for (let i = 1; i <= 28; i++) {
      const feature = `V${i}` as `V${number}`;
      transaction[feature] = Number(values[feature]);
    }

    if (
      !FEATURES.every((feature) => Number.isFinite(transaction[feature])) ||
      transaction.Time < 0 ||
      transaction.Amount < 0
    ) {
      setError(
        "Enter valid numerical values. Time and Amount cannot be negative.",
      );
      return;
    }

    void analyzeTransaction(transaction);
  }

  function analyzeSelectedTransaction() {
    const transaction = transactions[Number(selectedIndex)];

    if (!transaction) {
      setError("Select a valid transaction.");
      return;
    }

    void analyzeTransaction(transaction);
  }

  function changeMode(nextMode: InputMode) {
    if (busy) return;

    setMode(nextMode);
    setError("");
  }

  return (
    <div className="transaction-input">
      <div className="input-modes">
        <button
          type="button"
          className={mode === "sample" ? "mode-button active" : "mode-button"}
          onClick={() => changeMode("sample")}
          disabled={busy}
        >
          Sample Data
        </button>

        <button
          type="button"
          className={mode === "csv" ? "mode-button active" : "mode-button"}
          onClick={() => changeMode("csv")}
          disabled={busy}
        >
          Upload CSV
        </button>

        <button
          type="button"
          className={mode === "manual" ? "mode-button active" : "mode-button"}
          onClick={() => changeMode("manual")}
          disabled={busy}
        >
          Advanced Input
        </button>
      </div>

      {mode === "sample" && (
        <div className="input-section">
          <div className="input-description">
            <h3>Explore sample transactions</h3>
            <p>
              Load genuine transactions from the sample dataset and analyze
              individual records using the trained model.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadSampleTransactions}
            disabled={busy}
          >
            {loading ? "Loading samples..." : "Load Sample Transactions"}
          </button>

          {transactions.length > 0 && (
            <div className="transaction-selector">
              <label htmlFor="sample-transaction">Select transaction</label>

              <select
                id="sample-transaction"
                value={selectedIndex}
                onChange={(event) => setSelectedIndex(event.target.value)}
                disabled={busy}
              >
                {transactions.map((_, index) => (
                  <option key={index} value={index}>
                    Transaction {index + 1}
                  </option>
                ))}
              </select>

              <p>{transactions.length} sample transactions loaded.</p>

              <button
                type="button"
                className="score-button"
                onClick={analyzeSelectedTransaction}
                disabled={busy}
              >
                {loading ? "Analyzing..." : "Analyze Transaction"}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "csv" && (
        <div className="input-section">
          <div className="input-description">
            <h3>Upload transaction dataset</h3>
            <p>
              Upload a CSV containing Time, Amount and V1–V28. An optional Class
              column is accepted and excluded from prediction.
            </p>
          </div>

          <label className="upload-area">
            <span className="upload-icon">↑</span>
            <strong>{uploading ? "Reading CSV..." : "Choose CSV file"}</strong>
            <span>CSV files only · Maximum 10 MB</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              disabled={busy}
            />
          </label>

          {fileName && (
            <div className="file-status">
              <span>{fileName}</span>
              <span>{transactions.length} transactions loaded</span>
            </div>
          )}

          {transactions.length > 0 && (
            <div className="transaction-selector">
              <label htmlFor="csv-transaction">
                Select transaction to analyze
              </label>

              <select
                id="csv-transaction"
                value={selectedIndex}
                onChange={(event) => setSelectedIndex(event.target.value)}
                disabled={busy}
              >
                {transactions.map((_, index) => (
                  <option key={index} value={index}>
                    Transaction {index + 1}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="score-button"
                onClick={analyzeSelectedTransaction}
                disabled={busy}
              >
                {loading ? "Analyzing..." : "Analyze Transaction"}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "manual" && (
        <div className="input-section">
          <div className="input-description">
            <h3>Advanced model input</h3>
            <p>
              Enter all 30 numerical features manually for technical testing.
            </p>
          </div>

          <form className="transaction-form" onSubmit={handleManualSubmit}>
            <div className="feature-grid">
              {FEATURES.map((feature) => (
                <div className="field" key={feature}>
                  <label htmlFor={feature}>{feature}</label>
                  <input
                    id={feature}
                    type="number"
                    step="any"
                    min={
                      feature === "Time" || feature === "Amount" ? 0 : undefined
                    }
                    required
                    value={values[feature]}
                    placeholder="Enter value"
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [feature]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <button className="score-button" type="submit" disabled={busy}>
              {loading ? "Analyzing..." : "Analyze Transaction"}
            </button>
          </form>
        </div>
      )}

      {error && (
        <p className="error-message" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
