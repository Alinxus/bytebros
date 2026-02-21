"use client";

/*
|-------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
import { useState } from "react";
import type { FormEvent } from "react";

/*
|-------------------------------------------------------------
| Types
|-------------------------------------------------------------
*/
type PredictionResult = {
  prediction: {
    prediction: string;
    confidence: number;
    riskLevel: string;
  };
};

/*
|-------------------------------------------------------------
| Constants
|-------------------------------------------------------------
*/
const FEATURE_LABELS = [
  "radius_mean",
  "texture_mean",
  "perimeter_mean",
  "area_mean",
  "smoothness_mean",
  "compactness_mean",
  "concavity_mean",
  "concave_points_mean",
  "symmetry_mean",
  "fractal_dim_mean",
  "radius_se",
  "texture_se",
  "perimeter_se",
  "area_se",
  "smoothness_se",
  "compactness_se",
  "concavity_se",
  "concave_points_se",
  "symmetry_se",
  "fractal_dim_se",
  "radius_worst",
  "texture_worst",
  "perimeter_worst",
  "area_worst",
  "smoothness_worst",
  "compactness_worst",
  "concavity_worst",
  "concave_points_worst",
  "symmetry_worst",
  "fractal_dim_worst",
];

const BreastCancerPage = () => {
/*
|-------------------------------------------------------------
| States
|-------------------------------------------------------------
*/    
  const [features, setFeatures] = useState<number[]>(new Array(30).fill(0));
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleFeatureChange = (index: number, value: string) => {
    setFeatures((prev) => {
      const next = [...prev];
      next[index] = parseFloat(value) || 0;
      return next;
    });
  };
/*
|-------------------------------------------------------------
| Handlers
|-------------------------------------------------------------
| handleFeatureChange: Updates the specific feature value in state when an input changes.
| handleSubmit: Validates input, sends prediction request to API, handles response, and manages loading/error states.
| handleReset: Resets all feature values to 0 and clears results/errors.    
|-------------------------------------------------------------
*/
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    const apiKey = localStorage.getItem("cavista_api_key") || "";

    try {
      const res = await fetch("/api/screening/breast-cancer-predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ features }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Prediction failed.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFeatures(new Array(30).fill(0));
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Breast Cancer Prediction
        </h1>
        <p className="mt-1 text-sm text-muted">
          Random Forest model using 30 Wisconsin dataset features for
          benign/malignant classification.
        </p>
      </div>

      {error && (
        <div
          className="mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium tracking-widest uppercase text-muted">
              30 Features (Wisconsin Dataset)
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-action hover:underline"
              tabIndex={0}
              aria-label="Reset all feature values"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FEATURE_LABELS.map((label, i) => (
              <div key={label}>
                <label
                  htmlFor={`f-${i}`}
                  className="block text-[10px] text-muted mb-0.5 truncate"
                  title={label}
                >
                  {label}
                </label>
                <input
                  id={`f-${i}`}
                  type="number"
                  step="any"
                  value={features[i]}
                  onChange={(e) => handleFeatureChange(i, e.target.value)}
                  className="w-full border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Run breast cancer prediction"
        >
          {isLoading ? "Predicting..." : "Run Prediction"}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <p className="text-xs font-medium tracking-widest uppercase text-muted">
            Results
          </p>

          <div className="border border-border p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Prediction</p>
                <p
                  className={`text-2xl font-semibold capitalize ${
                    result.prediction.prediction === "malignant"
                      ? "text-danger"
                      : "text-action"
                  }`}
                >
                  {result.prediction.prediction}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Confidence</p>
                <p className="text-2xl font-semibold text-foreground">
                  {(result.prediction.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Risk Level</p>
                <p
                  className={`text-2xl font-semibold capitalize ${
                    result.prediction.riskLevel === "high"
                      ? "text-danger"
                      : result.prediction.riskLevel === "medium"
                        ? "text-yellow-600"
                        : "text-action"
                  }`}
                >
                  {result.prediction.riskLevel}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreastCancerPage;
