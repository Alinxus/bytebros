"use client";
/*
|---------------------------------------------------
| Npm Import
|---------------------------------------------------
*/
import { useState } from "react";
import type { FormEvent } from "react";

/*
|---------------------------------------------------
| RiskResult Types
|---------------------------------------------------
*/
type RiskResult = {
  riskAssessment: {
    overallRisk: number;
    riskLevel: string;
    factors: string[];
    recommendations: string[];
  };
};
/*
|---------------------------------------------------
| Genetic Markers
|---------------------------------------------------
*/
const GENETIC_MARKERS = [
  "BRCA1",
  "BRCA2",
  "TP53",
  "PTEN",
  "ATM",
  "CHEK2",
  "PALB2",
] as const;

const RiskAssessmentPage = () => {
  /*
 |---------------------------------------------------
 | States
 |---------------------------------------------------
 */
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [familyHistory, setFamilyHistory] = useState(false);
  const [selectedMarkers, setSelectedMarkers] = useState<string[]>([]);
  const [smoking, setSmoking] = useState("");
  const [obesity, setObesity] = useState("");
  const [hasAbnormality, setHasAbnormality] = useState(false);
  const [imagingRisk, setImagingRisk] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);

  const handleToggleMarker = (marker: string) => {
    setSelectedMarkers((prev) =>
      prev.includes(marker)
        ? prev.filter((m) => m !== marker)
        : [...prev, marker],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!age || !gender) {
      setError("Age and gender are required.");
      return;
    }

    setIsLoading(true);
    const apiKey = localStorage.getItem("cavista_api_key") || "";

    const body: Record<string, unknown> = {
      patientData: {
        age: parseInt(age),
        gender,
        familyHistory: familyHistory || undefined,
        geneticMarkers:
          selectedMarkers.length > 0 ? selectedMarkers : undefined,
        lifestyle: {
          smoking: smoking || undefined,
          obesity: obesity || undefined,
        },
      },
    };

    if (hasAbnormality || imagingRisk) {
      body.imagingResult = {
        hasAbnormality,
        riskLevel: imagingRisk || "low",
      };
    }

    try {
      const res = await fetch("/api/screening/risk-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Assessment failed.");
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
          Risk Assessment
        </h1>
        <p className="mt-1 text-sm text-muted">
          Comprehensive risk evaluation using genetics, lifestyle, and prior
          imaging results.
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
            Patient Data
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="risk-age"
                className="block text-xs text-muted mb-1"
              >
                Age
              </label>
              <input
                id="risk-age"
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 55"
                required
                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="risk-gender"
                className="block text-xs text-muted mb-1"
              >
                Gender
              </label>
              <select
                id="risk-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.checked)}
              className="accent-action"
            />
            <span className="text-sm text-foreground">
              Family history of cancer
            </span>
          </label>
        </div>
        <div className="border border-border p-6">
          <p className="text-xs font-medium tracking-widest uppercase text-muted mb-4">
            Genetic Markers
          </p>
          <div className="flex flex-wrap gap-2">
            {GENETIC_MARKERS.map((marker) => {
              const isSelected = selectedMarkers.includes(marker);
              return (
                <button
                  key={marker}
                  type="button"
                  onClick={() => handleToggleMarker(marker)}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    isSelected
                      ? "border-action bg-action/5 text-action"
                      : "border-border text-muted hover:border-foreground hover:text-foreground"
                  }`}
                  aria-pressed={isSelected}
                >
                  {marker}
                </button>
              );
            })}
          </div>
        </div>
        <div className="border border-border p-6">
          <p className="text-xs font-medium tracking-widest uppercase text-muted mb-4">
            Lifestyle
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="risk-smoking"
                className="block text-xs text-muted mb-1"
              >
                Smoking
              </label>
              <select
                id="risk-smoking"
                value={smoking}
                onChange={(e) => setSmoking(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
              >
                <option value="">Select</option>
                <option value="current">Current</option>
                <option value="former">Former</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="risk-obesity"
                className="block text-xs text-muted mb-1"
              >
                BMI Category
              </label>
              <select
                id="risk-obesity"
                value={obesity}
                onChange={(e) => setObesity(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
              >
                <option value="">Select</option>
                <option value="obese">Obese</option>
                <option value="overweight">Overweight</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>
        </div>
        <div className="border border-border p-6">
          <p className="text-xs font-medium tracking-widest uppercase text-muted mb-4">
            Prior Imaging Results (Optional)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAbnormality}
                onChange={(e) => setHasAbnormality(e.target.checked)}
                className="accent-action"
              />
              <span className="text-sm text-foreground">
                Abnormality detected
              </span>
            </label>
            <div>
              <label
                htmlFor="imaging-risk"
                className="block text-xs text-muted mb-1"
              >
                Imaging Risk Level
              </label>
              <select
                id="imaging-risk"
                value={imagingRisk}
                onChange={(e) => setImagingRisk(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
              >
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Calculate risk assessment"
        >
          {isLoading ? "Calculating..." : "Calculate Risk"}
        </button>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <p className="text-xs font-medium tracking-widest uppercase text-muted">
            Results
          </p>

          <div className="border border-border p-6">
            <div className="text-center mb-6">
              <p className="text-xs text-muted mb-1">Overall Risk Score</p>
              <p
                className={`text-4xl font-semibold ${
                  result.riskAssessment.overallRisk >= 70
                    ? "text-danger"
                    : result.riskAssessment.overallRisk >= 40
                      ? "text-yellow-600"
                      : "text-action"
                }`}
              >
                {result.riskAssessment.overallRisk}
              </p>
              <span
                className={`inline-block mt-2 text-xs font-medium tracking-widest uppercase px-3 py-1 border ${
                  result.riskAssessment.riskLevel === "high"
                    ? "border-danger/30 text-danger"
                    : result.riskAssessment.riskLevel === "medium"
                      ? "border-yellow-400/30 text-yellow-600"
                      : "border-action/30 text-action"
                }`}
              >
                {result.riskAssessment.riskLevel} risk
              </span>
            </div>

            {result.riskAssessment.factors.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted mb-2">Contributing Factors</p>
                <ul className="space-y-1" role="list">
                  {result.riskAssessment.factors.map((factor, i) => (
                    <li
                      key={i}
                      className="text-sm text-foreground border-l-2 border-border pl-3"
                    >
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.riskAssessment.recommendations.length > 0 && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs text-muted mb-2">Recommendations</p>
                <ul className="space-y-1" role="list">
                  {result.riskAssessment.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted flex items-start gap-2"
                    >
                      <span
                        className="text-action mt-0.5 text-xs"
                        aria-hidden="true"
                      >
                        &#x2713;
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessmentPage;
