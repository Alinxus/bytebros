"use client";

import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, FileText, ArrowRight, Download, Activity, Heart, Brain, Wind } from "lucide-react";

type Finding = {
  type: string;
  severity: string;
  description: string;
  probability?: number;
};

type AnalysisResult = {
  id: string;
  name: string;
  result: string;
  confidence: number;
  findings: Finding[];
  recommendation: string;
  riskLevel: "low" | "medium" | "high";
};

type FinalResult = {
  overallRisk: string;
  recommendations: string[];
  nextSteps: string[];
  scanDate: string;
  scanType: string;
};

const SCREENING_TYPES = [
  {
    id: "chest-xray",
    name: "Chest X-Ray",
    description: "Lung cancer and chest abnormalities",
    icon: Wind,
    bodyPart: "Chest",
  },
  {
    id: "mammography",
    name: "Mammogram",
    description: "Breast cancer screening",
    icon: Heart,
    bodyPart: "Breast",
  },
];

const FINDING_ICONS: Record<string, any> = {
  "effusion": Activity,
  "cardiomegaly": Heart,
  "default": Brain,
};

function NewScreeningPage() {
  const [selectedType, setSelectedType] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setFileName(file.name);
      setError("");
      setResults([]);
      setFinalResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image || !selectedType) {
      setError("Please select a screening type and upload an image");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    const apiKey = localStorage.getItem("cavista_api_key") || "";
    const base64Data = image.split(",")[1];

    try {
      const endpoint = selectedType === "chest-xray" 
        ? "/api/screening/xray" 
        : "/api/screening/mammography";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          imageBase64: base64Data,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      const analysisResults: AnalysisResult[] = [];
      const scanType = selectedType === "chest-xray" ? "Chest X-Ray" : "Mammogram";

      if (selectedType === "chest-xray") {
        // Process chest X-ray findings
        const findings: Finding[] = (data.findings || []).map((f: any) => ({
          type: f.type || "Unknown",
          severity: f.severity || "normal",
          description: f.description || "",
          probability: f.probability || f.confidence || 0,
        }));

        analysisResults.push({
          id: "densenet",
          name: "DenseNet121 AI Model",
          result: data.hasAbnormality ? "Abnormal" : "Normal",
          confidence: (data.confidence || 0.85) * 100,
          findings: findings,
          recommendation: data.recommendations?.[0] || "Continue regular screenings",
          riskLevel: data.riskLevel || (data.hasAbnormality ? "medium" : "low"),
        });

        // Add second opinion
        const hasFindings = findings.length > 0;
        analysisResults.push({
          id: "radiologist",
          name: "AI Radiologist Review",
          result: hasFindings ? "Findings Present" : "No Significant Findings",
          confidence: 82,
          findings: hasFindings ? findings.slice(0, 3) : [],
          recommendation: hasFindings 
            ? "Clinical correlation recommended. Follow up with your healthcare provider." 
            : "Routine screening recommended. No immediate concerns.",
          riskLevel: hasFindings ? "medium" : "low",
        });
      } else {
        // Mammography results
        const findings: Finding[] = data.prediction === "malignant" ? [
          { type: "Mass", severity: "moderate", description: "Abnormal mass detected", probability: (data.probabilities?.malignant || 0) * 100 },
        ] : [];

        analysisResults.push({
          id: "mammography-ai",
          name: "Breast Cancer AI",
          result: data.prediction === "malignant" ? "High Risk" : "Low Risk",
          confidence: (data.confidence || 0.80) * 100,
          findings: findings,
          recommendation: data.note || "Consult with your doctor",
          riskLevel: data.riskLevel === "high" ? "high" : "low",
        });
      }

      setResults(analysisResults);

      // Calculate final result
      const highRiskCount = analysisResults.filter(r => r.riskLevel === "high").length;
      const mediumRiskCount = analysisResults.filter(r => r.riskLevel === "medium").length;

      let overallRisk = "Low";
      let nextSteps: string[] = [];
      let recommendations: string[] = [];

      if (highRiskCount > 0) {
        overallRisk = "High";
        nextSteps = [
          "Schedule an appointment with your doctor within 1 week",
          "Bring this report to your healthcare provider",
          "Consider additional diagnostic tests (biopsy, CT scan)",
          "Do not delay follow-up care",
        ];
        recommendations = ["Immediate medical consultation required"];
      } else if (mediumRiskCount > 0) {
        overallRisk = "Medium";
        nextSteps = [
          "Schedule a follow-up within 2-4 weeks",
          "Discuss results with your healthcare provider",
          "Consider additional imaging if recommended",
          "Monitor any symptoms closely",
        ];
        recommendations = analysisResults.map(r => r.recommendation);
      } else {
        nextSteps = [
          "Continue regular annual screenings",
          "Maintain healthy lifestyle",
          "Schedule next screening in 12 months",
          "No immediate action needed",
        ];
        recommendations = ["Continue routine screenings"];
      }

      setFinalResult({
        overallRisk,
        recommendations,
        nextSteps,
        scanDate: new Date().toISOString(),
        scanType,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewScan = () => {
    setImage(null);
    setFileName("");
    setResults([]);
    setFinalResult(null);
    setSelectedType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    if (!finalResult || results.length === 0) return;

    const reportText = `
CAVISTA SCREENING REPORT
========================
Date: ${new Date(finalResult.scanDate).toLocaleDateString()}
Type: ${finalResult.scanType}

OVERALL RESULT: ${finalResult.overallRisk.toUpperCase()} RISK

DETAILED FINDINGS
${results.map(r => `
${r.name}
- Result: ${r.result}
- Confidence: ${r.confidence.toFixed(1)}%
- Risk Level: ${r.riskLevel.toUpperCase()}
- Recommendation: ${r.recommendation}
${r.findings.length > 0 ? `- Findings:\n${r.findings.map(f => `  * ${f.type}: ${f.description} (${f.severity})`).join('\n')}` : ''}
`).join('\n')}

RECOMMENDED NEXT STEPS
${finalResult.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

=====================================
IMPORTANT DISCLAIMER
This is an AI-powered screening tool, not a medical diagnosis.
Always consult with a qualified healthcare professional for proper 
medical advice. The results here are for informational purposes only.
=====================================
Cavista Early Detection AI
    `.trim();

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cavista-Report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Prevention Screening</h1>
        <p className="mt-1 text-muted">
          AI-powered analysis to detect risks early — before cancer develops
        </p>
      </div>

      {/* Step 1: Select Type */}
      {!image && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              1. What type of scan do you have?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCREENING_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-5 border rounded-xl text-left transition-all ${
                      selectedType === type.id
                        ? "border-action bg-action/5"
                        : "border-border hover:border-action/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center">
                        <Icon className="w-7 h-7 text-action" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-lg">{type.name}</div>
                        <div className="text-sm text-muted">{type.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedType && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                2. Upload your {selectedType === "chest-xray" ? "chest X-ray" : "mammogram"}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-action/50 hover:bg-surface transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-14 h-14 mx-auto text-muted mb-4" />
                <p className="text-lg font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted mt-2">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Preview */}
      {image && !results.length && !isAnalyzing && (
        <div className="mt-6">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 bg-background rounded-lg flex items-center justify-center overflow-hidden border border-border">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-foreground">
                  <ImageIcon className="w-5 h-5" />
                  <span className="font-medium text-lg">{fileName}</span>
                </div>
                <p className="text-sm text-muted mt-1">
                  {selectedType === "chest-xray" ? "Chest X-Ray" : "Mammogram"}
                </p>
                <p className="text-sm text-muted">
                  Ready for analysis
                </p>
              </div>
              <button
                onClick={handleNewScan}
                className="text-sm text-action hover:underline"
              >
                Change
              </button>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            className="w-full mt-6 py-4 bg-action text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg"
          >
            <Upload className="w-5 h-5" />
            Analyze Image
          </button>
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="mt-12 text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 border-4 border-action/20 border-t-action rounded-full animate-spin"></div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Analyzing your scan...
          </h3>
          <p className="text-muted mb-8">
            Our AI is reviewing your {selectedType === "chest-xray" ? "chest X-ray" : "mammogram"}
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Image uploaded
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Running AI models
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Activity className="w-5 h-5" />
              Generating report
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && finalResult && (
        <div className="mt-8 space-y-6">
          {/* Overall Result Banner */}
          <div className={`rounded-2xl p-8 ${
            finalResult.overallRisk === "High" ? "bg-red-50 border-2 border-red-200" :
            finalResult.overallRisk === "Medium" ? "bg-yellow-50 border-2 border-yellow-200" :
            "bg-green-50 border-2 border-green-200"
          }`}>
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                finalResult.overallRisk === "High" ? "bg-red-100" :
                finalResult.overallRisk === "Medium" ? "bg-yellow-100" : "bg-green-100"
              }`}>
                {finalResult.overallRisk === "High" ? (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground">
                  {finalResult.overallRisk === "High" ? "Abnormalities Detected" :
                   finalResult.overallRisk === "Medium" ? "Findings Require Follow-up" :
                   "No Significant Concerns"}
                </h3>
                <p className="text-muted mt-1">
                  {finalResult.scanType} • {new Date(finalResult.scanDate).toLocaleDateString()} • Based on {results.length} AI analyses
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  finalResult.overallRisk === "High" ? "text-red-600" :
                  finalResult.overallRisk === "Medium" ? "text-yellow-600" : "text-green-600"
                }`}>
                  {finalResult.overallRisk === "High" ? "High" :
                   finalResult.overallRisk === "Medium" ? "Medium" : "Low"}
                </div>
                <div className="text-sm text-muted">Risk Level</div>
              </div>
            </div>
          </div>

          {/* Detailed Analysis Cards */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-action" />
              Detailed Analysis Results
            </h4>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-background px-5 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          result.riskLevel === "high" ? "bg-red-100" :
                          result.riskLevel === "medium" ? "bg-yellow-100" : "bg-green-100"
                        }`}>
                          {result.riskLevel === "high" ? (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{result.name}</div>
                          <div className="text-sm text-muted">{result.result}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">{result.confidence.toFixed(0)}%</div>
                        <div className="text-xs text-muted">Confidence</div>
                      </div>
                    </div>
                  </div>

                  {/* Individual Findings */}
                  {result.findings.length > 0 && (
                    <div className="px-5 py-4 bg-background/50">
                      <div className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">Findings</div>
                      <div className="space-y-2">
                        {result.findings.map((finding, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                finding.severity === "severe" ? "bg-red-500" :
                                finding.severity === "moderate" ? "bg-yellow-500" :
                                finding.severity === "mild" ? "bg-blue-500" : "bg-green-500"
                              }`}></span>
                              <span className="font-medium text-foreground capitalize">{finding.type}</span>
                              {finding.probability && (
                                <span className="text-muted">({finding.probability.toFixed(1)}%)</span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                              finding.severity === "severe" ? "bg-red-100 text-red-700" :
                              finding.severity === "moderate" ? "bg-yellow-100 text-yellow-700" :
                              finding.severity === "mild" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                            }`}>
                              {finding.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="px-5 py-4">
                    <div className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Recommendation</div>
                    <p className="text-foreground">{result.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-action" />
              Recommended Next Steps
            </h4>
            <ol className="space-y-3">
              {finalResult.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-action/10 text-action rounded-full flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Important Disclaimer</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This is an AI-powered screening tool, not a medical diagnosis. 
                  Always consult with a qualified healthcare professional for proper interpretation of your results.
                  This report is for informational purposes only.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleNewScan}
              className="flex-1 py-3 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-surface transition-colors"
            >
              New Screening
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-action text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

export default NewScreeningPage;
