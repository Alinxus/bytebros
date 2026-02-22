"use client";
/*
|-------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";

/*
|-------------------------------------------------------------
| Types
|-------------------------------------------------------------
*/
type MammoResult = {
  analysis: {
    prediction: string;
    confidence: number;
    calibratedConfidence?: number;
    riskScore?: number;
    quality?: {
      quality: "good" | "poor" | "unknown";
      issues: string[];
    };
    probabilities: { benign: number; malignant: number };
    riskLevel: string;
  };
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = (error) => reject(error);
  });

const MammographyPage = () => {
/*
|-------------------------------------------------------------
| States
|-------------------------------------------------------------
*/
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MammoResult | null>(null);

/*
|-------------------------------------------------------------
| Handlers
|-------------------------------------------------------------
| handleFileChange: Validates and sets the selected file, generates a preview, and resets results/errors.
| handleSubmit: Validates input, converts image to base64, sends analysis request, handles response, and manages loading state.
|-------------------------------------------------------------
*/
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please select a mammography image.");
      return;
    }

    setIsLoading(true);
    const apiKey = localStorage.getItem("cavista_api_key") || "";

    try {
      const imageBase64 = await fileToBase64(file);

      const res = await fetch("/api/screening/mammography", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis failed.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Mammography Analysis
        </h1>
        <p className="mt-1 text-sm text-muted">
          AI-powered breast imaging analysis. Upload a mammogram for screening.
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
          <p className="text-xs font-medium tracking-widest uppercase text-muted mb-4">
            Upload Mammogram
          </p>
          <label
            htmlFor="mammo-file"
            className="block border-2 border-dashed border-border hover:border-muted transition-colors cursor-pointer text-center py-10"
          >
            {preview ? (
              <img
                src={preview}
                alt="Mammogram preview"
                className="mx-auto max-h-48 object-contain"
              />
            ) : (
              <div>
                <p className="text-sm text-muted mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted/60">PNG, JPG, DICOM</p>
              </div>
            )}
            <input
              id="mammo-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {file && (
            <p className="mt-2 text-xs text-muted">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !file}
          className="w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Analyze mammogram"
        >
          {isLoading ? "Analyzing..." : "Analyze Mammogram"}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <p className="text-xs font-medium tracking-widest uppercase text-muted">
            Results
          </p>

          <div className="border border-border p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-xs text-muted mb-1">Prediction</p>
                <p
                  className={`text-lg font-semibold capitalize ${
                    result.analysis.prediction === "malignant"
                      ? "text-danger"
                      : "text-action"
                  }`}
                >
                  {result.analysis.prediction}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Confidence</p>
                <p className="text-lg font-semibold text-foreground">
                  {((result.analysis.calibratedConfidence ?? result.analysis.confidence) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Risk Level</p>
                <p
                  className={`text-lg font-semibold capitalize ${
                    result.analysis.riskLevel === "high"
                      ? "text-danger"
                      : result.analysis.riskLevel === "medium"
                        ? "text-yellow-600"
                        : "text-action"
                  }`}
                >
                  {result.analysis.riskLevel}
                </p>
              </div>
            </div>

            {result.analysis.riskScore !== undefined && (
              <div className="mb-4">
                <p className="text-xs text-muted mb-1">Risk Score</p>
                <p className="text-sm font-semibold text-foreground">
                  {result.analysis.riskScore}/100
                </p>
              </div>
            )}

            {result.analysis.quality && (
              <div className={`mb-4 rounded-lg border p-3 ${
                result.analysis.quality.quality === "poor"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-green-50 border-green-200"
              }`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-medium text-foreground">Image Quality Check</p>
                    <p className="text-xs text-muted">Low-quality images reduce confidence.</p>
                  </div>
                  <p className={`text-xs font-semibold uppercase ${
                    result.analysis.quality.quality === "poor" ? "text-yellow-700" : "text-green-700"
                  }`}>
                    {result.analysis.quality.quality}
                  </p>
                </div>
                {result.analysis.quality.issues.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.analysis.quality.issues.map((issue, i) => (
                      <span key={i} className="text-xs bg-background border border-border rounded-full px-2 py-0.5 text-muted">
                        {issue.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted mb-2">Probability Breakdown</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border p-3">
                <p className="text-xs text-muted mb-1">Benign</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-surface">
                    <div
                      className="h-full bg-action"
                      style={{
                        width: `${result.analysis.probabilities.benign * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {(result.analysis.probabilities.benign * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="border border-border p-3">
                <p className="text-xs text-muted mb-1">Malignant</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-surface">
                    <div
                      className="h-full bg-danger"
                      style={{
                        width: `${result.analysis.probabilities.malignant * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {(result.analysis.probabilities.malignant * 100).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MammographyPage;
