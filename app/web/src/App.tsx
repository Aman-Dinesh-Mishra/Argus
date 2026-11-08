import { useEffect, useState } from "react";
import "./App.css";
import TransactionForm from "./components/TransactionForm";
import PredictionResult from "./components/PredictionResult";
import EvaluationDashboard from "./components/EvaluationDashboard";
import type { PredictionResponse } from "./types/api";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem("argus-theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("argus-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>ARGUS</span>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <span className="theme-icon" aria-hidden="true">
              {theme === "light" ? "☾" : "☀"}
            </span>
            <span className="theme-label">
              {theme === "light" ? "Dark mode" : "Light mode"}
            </span>
          </button>

          <span className="system-status">
            <span className="status-dot"></span>
            Risk Engine
          </span>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">INTELLIGENT FRAUD DETECTION</p>
        <h1>Transaction Risk Analysis</h1>
        <p className="subtitle">
          Analyze transaction patterns, detect potential fraud, and understand
          the factors influencing each prediction.
        </p>
      </section>

      <section className="workspace">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Transaction Input</h2>
              <p>Choose how you want to provide transaction data.</p>
            </div>
            <span className="feature-count">3 Input Modes</span>
          </div>

          <TransactionForm onPrediction={setPrediction} />
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Prediction Result</h2>
              <p>Model-generated transaction risk assessment.</p>
            </div>
          </div>

          <PredictionResult result={prediction} />
        </div>
      </section>

      <EvaluationDashboard />

      <footer>ARGUS · ML-powered fraud detection system</footer>
    </main>
  );
}

export default App;
