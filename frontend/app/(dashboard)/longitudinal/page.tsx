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
type ScanEntry = {
  date: string;
  result: string;
  riskLevel: string;
  confidence: string;
};

type LongitudinalResult = {
  longitudinalAnalysis: {
    trend: string;
    changes: string[];
    totalScans: number;
    recommendation: string;
  };
};

const LongitudinalPage = () => {
  /*
|-------------------------------------------------------------
| States
|-------------------------------------------------------------
*/
  const [scans, setScans] = useState<ScanEntry[]>([
    {
      date: "2024-01-15",
      result: "benign",
      riskLevel: "low",
      confidence: "0.7",
    },
    {
      date: "2025-06-20",
      result: "benign",
      riskLevel: "low",
      confidence: "0.75",
    },
    {
      date: "2025-12-01",
      result: "benign",
      riskLevel: "medium",
      confidence: "0.65",
    },
  ]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LongitudinalResult | null>(null);

  const handleScanChange = (
    index: number,
    field: keyof ScanEntry,
    value: string,
  ) => {
    setScans((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddScan = () => {
    setScans((prev) => [
      ...prev,
      { date: "", result: "benign", riskLevel: "low", confidence: "0.7" },
    ]);
  };

  const handleRemoveScan = (index: number) => {
    if (scans.length <= 1) return;
    setScans((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const validScans = scans.filter((s) => s.date);
    if (validScans.length < 2) {
      setError(
        "At least 2 scans with dates are required for longitudinal analysis.",
      );
      return;
    }

    setIsLoading(true);
    const apiKey = localStorage.getItem("cavista_api_key") || "";

    try {
      const res = await fetch("/api/screening/longitudinal-track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          previousScans: validScans.map((s) => ({
            date: s.date,
            result: s.result,
            riskLevel: s.riskLevel,
            confidence: parseFloat(s.confidence),
          })),
        }),
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
          Longitudinal Tracking
        </h1>
        <p className="mt-1 text-sm text-muted">
          Track screening results over time to detect trends and changes. This
          is the key feature for early detection.
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
              Previous Scans
            </p>
            <button
              type="button"
              onClick={handleAddScan}
              className="text-xs text-action hover:underline"
              tabIndex={0}
              aria-label="Add another scan entry"
            >
              + Add Scan
            </button>
          </div>

          <div className="space-y-3">
            {scans.map((scan, i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-2 items-end border border-border p-3"
              >
                <div>
                  <label className="block text-[10px] text-muted mb-0.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scan.date}
                    onChange={(e) =>
                      handleScanChange(i, "date", e.target.value)
                    }
                    className="w-full border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted mb-0.5">
                    Result
                  </label>
                  <select
                    value={scan.result}
                    onChange={(e) =>
                      handleScanChange(i, "result", e.target.value)
                    }
                    className="w-full border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                  >
                    <option value="benign">Benign</option>
                    <option value="malignant">Malignant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-muted mb-0.5">
                    Risk Level
                  </label>
                  <select
                    value={scan.riskLevel}
                    onChange={(e) =>
                      handleScanChange(i, "riskLevel", e.target.value)
                    }
                    className="w-full border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-muted mb-0.5">
                    Confidence
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={scan.confidence}
                    onChange={(e) =>
                      handleScanChange(i, "confidence", e.target.value)
                    }
                    className="w-full border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => handleRemoveScan(i)}
                    disabled={scans.length <= 1}
                    className="text-xs text-muted hover:text-danger transition-colors disabled:opacity-30"
                    aria-label={`Remove scan ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Analyze longitudinal data"
        >
          {isLoading ? "Analyzing..." : "Analyze Trends"}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <p className="text-xs font-medium tracking-widest uppercase text-muted">
            Results
          </p>

          <div className="border border-border p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-muted mb-1">Trend</p>
                <p
                  className={`text-2xl font-semibold capitalize ${
                    result.longitudinalAnalysis.trend === "concerning"
                      ? "text-danger"
                      : result.longitudinalAnalysis.trend === "stable"
                        ? "text-yellow-600"
                        : "text-action"
                  }`}
                >
                  {result.longitudinalAnalysis.trend}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Total Scans</p>
                <p className="text-2xl font-semibold text-foreground">
                  {result.longitudinalAnalysis.totalScans}
                </p>
              </div>
            </div>

            {result.longitudinalAnalysis.changes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted mb-2">Changes Detected</p>
                <ul className="space-y-1" role="list">
                  {result.longitudinalAnalysis.changes.map((change, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted flex items-start gap-2"
                    >
                      <span
                        className="text-danger mt-0.5 text-xs"
                        aria-hidden="true"
                      >
                        ●
                      </span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-sm text-foreground font-medium">
                {result.longitudinalAnalysis.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LongitudinalPage;
