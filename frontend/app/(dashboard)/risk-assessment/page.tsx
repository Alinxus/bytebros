"use client";
/*
|---------------------------------------------------
| Npm Import
|---------------------------------------------------
*/
import { useState } from "react";
import type { FormEvent } from "react";
import { ShieldCheck, Brain, Activity, Heart, Dna, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

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

type RiskFactorInfo = {
  id: string;
  name: string;
  category: "genetic" | "lifestyle" | "demographic" | "imaging";
  description: string;
  impact: "high" | "medium" | "low" | "varies";
  icon: React.ReactNode;
};

const RISK_FACTORS_INFO: RiskFactorInfo[] = [
  {
    id: "age",
    name: "Age",
    category: "demographic",
    description: "Risk increases with age, especially after 50",
    impact: "medium",
    icon: <Activity className="w-4 h-4" />,
  },
  {
    id: "family-history",
    name: "Family History",
    category: "demographic",
    description: "Genetic predisposition based on family cancer history",
    impact: "high",
    icon: <Heart className="w-4 h-4" />,
  },
  {
    id: "brca",
    name: "BRCA Genes",
    category: "genetic",
    description: "BRCA1/2 mutations significantly increase cancer risk",
    impact: "high",
    icon: <Dna className="w-4 h-4" />,
  },
  {
    id: "smoking",
    name: "Smoking",
    category: "lifestyle",
    description: "Tobacco use is a major cancer risk factor",
    impact: "high",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    id: "obesity",
    name: "BMI/Weight",
    category: "lifestyle",
    description: "Obesity is linked to multiple cancer types",
    impact: "medium",
    icon: <Activity className="w-4 h-4" />,
  },
  {
    id: "imaging",
    name: "Prior Imaging",
    category: "imaging",
    description: "Previous imaging findings may indicate elevated risk",
    impact: "varies",
    icon: <Brain className="w-4 h-4" />,
  },
];

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "high":
      return "text-danger bg-danger/5 border-danger/20";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-400/20";
    case "low":
      return "text-action bg-action/5 border-action/20";
    default:
      return "text-muted bg-surface border-border";
  }
};

const getRiskLevelColor = (level: string) => {
  switch (level) {
    case "high":
      return "from-danger/20 to-danger/5";
    case "medium":
      return "from-yellow-50 to-yellow-5";
    default:
      return "from-action/10 to-action/5";
  }
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
  const [expandedSections, setExpandedSections] = useState<string[]>(["factors"]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

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
      try {
        localStorage.setItem("cavista_risk_assessment", JSON.stringify({
          ...data.riskAssessment,
          storedAt: new Date().toISOString(),
        }));
      } catch {
        // ignore storage errors
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-action/10 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-action" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              AI Risk Assessment
            </h1>
            <p className="text-sm text-muted">
              Know your risk factors
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted ml-12">
          Comprehensive risk evaluation using AI-powered analysis of genetics, lifestyle factors, and prior imaging results.
        </p>
      </div>

      <div className="bg-surface rounded-lg border border-border p-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Brain className="w-4 h-4 text-action" />
          <span><strong className="text-foreground font-medium">AI-Powered Analysis:</strong> Your assessment is processed by our advanced AI model to provide personalized risk evaluation.</span>
        </div>
      </div>

      {error && (
        <div
          className="mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger rounded-lg flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-border p-6 rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-action" />
                <p className="text-xs font-medium tracking-widest uppercase text-muted">
                  Patient Data
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="risk-age"
                    className="block text-xs text-muted mb-1"
                  >
                    Age *
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
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="risk-gender"
                    className="block text-xs text-muted mb-1"
                  >
                    Gender *
                  </label>
                  <select
                    id="risk-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-surface transition-colors">
                <input
                  type="checkbox"
                  checked={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.checked)}
                  className="w-4 h-4 accent-action"
                />
                <span className="text-sm text-foreground">
                  Family history of cancer
                </span>
                <Info className="w-3.5 h-3.5 text-muted ml-auto" />
              </label>
            </div>
            <div className="border border-border p-6 rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-4">
                <Dna className="w-4 h-4 text-action" />
                <p className="text-xs font-medium tracking-widest uppercase text-muted">
                  Genetic Markers
                </p>
              </div>
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
            <div className="border border-border p-6 rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-action" />
                <p className="text-xs font-medium tracking-widest uppercase text-muted">
                  Lifestyle
                </p>
              </div>
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
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors"
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
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="obese">Obese</option>
                    <option value="overweight">Overweight</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="border border-border p-6 rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-action" />
                <p className="text-xs font-medium tracking-widest uppercase text-muted">
                  Prior Imaging Results (Optional)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-surface transition-colors">
                  <input
                    type="checkbox"
                    checked={hasAbnormality}
                    onChange={(e) => setHasAbnormality(e.target.checked)}
                    className="w-4 h-4 accent-action"
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
                    className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors"
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
              className="w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              aria-label="Calculate risk assessment"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Risk Factors...
                </span>
              ) : (
                "Calculate Risk Assessment"
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-surface rounded-lg border border-border p-4 sticky top-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Understanding Risk Factors</h3>
            <div className="space-y-2">
              {RISK_FACTORS_INFO.map((factor) => (
                <div
                  key={factor.id}
                  className={`p-3 rounded-lg border text-xs ${getImpactColor(factor.impact)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {factor.icon}
                    <span className="font-medium">{factor.name}</span>
                  </div>
                  <p className="text-muted opacity-80">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-action" />
            <p className="text-sm font-medium tracking-widest uppercase text-muted">
              AI Analysis Results
            </p>
          </div>

          <div className={`border border-border p-6 rounded-lg bg-gradient-to-br ${getRiskLevelColor(result.riskAssessment.riskLevel)}`}>
            <div className="text-center mb-6">
              <p className="text-xs text-muted mb-1">Overall Risk Score</p>
              <div className="relative inline-block">
                <p
                  className={`text-5xl font-semibold ${
                    result.riskAssessment.overallRisk >= 70
                      ? "text-danger"
                      : result.riskAssessment.overallRisk >= 40
                        ? "text-yellow-600"
                        : "text-action"
                  }`}
                >
                  {result.riskAssessment.overallRisk}
                </p>
                <span className="text-lg text-muted">/100</span>
              </div>
              <span
                className={`inline-block mt-3 text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full ${
                  result.riskAssessment.riskLevel === "high"
                    ? "bg-danger/10 text-danger border border-danger/20"
                    : result.riskAssessment.riskLevel === "medium"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-400/20"
                      : "bg-action/10 text-action border border-action/20"
                }`}
              >
                {result.riskAssessment.riskLevel} risk
              </span>
            </div>

            <div className="w-full bg-surface rounded-full h-2 mb-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  result.riskAssessment.overallRisk >= 70
                    ? "bg-danger"
                    : result.riskAssessment.overallRisk >= 40
                      ? "bg-yellow-500"
                      : "bg-action"
                }`}
                style={{ width: `${result.riskAssessment.overallRisk}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted mb-1">Low</p>
                <p className="text-lg font-semibold text-action">0-39</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted mb-1">Medium</p>
                <p className="text-lg font-semibold text-yellow-600">40-69</p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted mb-1">High</p>
                <p className="text-lg font-semibold text-danger">70-100</p>
              </div>
            </div>

            {result.riskAssessment.factors.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => toggleSection("factors")}
                  className="flex items-center justify-between w-full text-left mb-2"
                >
                  <p className="text-xs font-medium text-muted flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Contributing Factors
                  </p>
                  {expandedSections.includes("factors") ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </button>
                {expandedSections.includes("factors") && (
                  <ul className="space-y-2" role="list">
                    {result.riskAssessment.factors.map((factor, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground bg-background/50 border-l-2 border-action pl-3 py-2 rounded-r"
                      >
                        {factor}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {result.riskAssessment.recommendations.length > 0 && (
              <div className="border-t border-border/50 pt-4 mt-4">
                <button
                  onClick={() => toggleSection("recommendations")}
                  className="flex items-center justify-between w-full text-left mb-2"
                >
                  <p className="text-xs font-medium text-muted flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Recommendations
                  </p>
                  {expandedSections.includes("recommendations") ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </button>
                {expandedSections.includes("recommendations") && (
                  <ul className="space-y-2" role="list">
                    {result.riskAssessment.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground flex items-start gap-2 bg-background/50 p-2 rounded"
                      >
                        <CheckCircle2 className="w-4 h-4 text-action mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-400/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Important Disclaimer</p>
                <p className="text-xs text-yellow-700 mt-1">
                  This AI-powered risk assessment is for informational purposes only and should not replace professional medical advice. Please consult with your healthcare provider for personalized risk evaluation and appropriate screening recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessmentPage;
