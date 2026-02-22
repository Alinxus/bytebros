"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Brain, Loader2, Download, Share2, AlertCircle, CheckCircle, ClipboardList, Stethoscope, Pill, Activity } from "lucide-react";

type ReportSection = {
  title: string;
  content: string;
  importance: "high" | "medium" | "low";
};

type AnalysisResult = {
  summary: string;
  keyFindings: string[];
  riskFactors: string[];
  recommendations: string[];
  keywords: string[];
  labResults?: {
    name: string;
    value: string;
    status: "normal" | "abnormal" | "critical";
  }[];
  followUpActions: string[];
};

const REPORT_TYPES = [
  {
    id: "blood",
    name: "Blood Test / Lab Results",
    description: "Complete blood count, metabolic panel, tumor markers",
    icon: ClipboardList,
  },
  {
    id: "imaging",
    name: "Imaging Report",
    description: "X-Ray, MRI, CT scan, Ultrasound reports",
    icon: Stethoscope,
  },
  {
    id: "biopsy",
    name: "Biopsy Report",
    description: "Pathology reports from tissue samples",
    icon: FileText,
  },
  {
    id: "general",
    name: "General Medical Report",
    description: "Doctor's notes, discharge summaries",
    icon: Brain,
  },
];

function ReportAnalysisPage() {
  const [reportType, setReportType] = useState("");
  const [reportText, setReportText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For text files, read content
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();
      setReportText(text);
    } else if (file.type === "application/pdf") {
      // In production, would send to OCR service
      setError("PDF upload requires OCR processing. Please paste text content below.");
    } else {
      // For images, would need OCR
      setError("Image upload requires OCR processing. Please paste text content below.");
    }
  };

  const handleAnalyze = async () => {
    if (!reportText.trim()) {
      setError("Please enter or upload a medical report to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    const apiKey = localStorage.getItem("cavista_api_key") || "";

    try {
      // Simulate AI analysis (in production, would call actual API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Parse and analyze the report text
      const analysis = analyzeReportText(reportText, reportType);
      setResult(analysis);
    } catch (err) {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeReportText = (text: string, type: string): AnalysisResult => {
    const lowerText = text.toLowerCase();
    const keywords: string[] = [];
    const keyFindings: string[] = [];
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    const labResults: AnalysisResult["labResults"] = [];

    // Extract common medical keywords
    const medicalKeywords = [
      { term: "malignant", category: "concern" },
      { term: "benign", category: "normal" },
      { term: "carcinoma", category: "concern" },
      { term: "tumor", category: "concern" },
      { term: "metastasis", category: "concern" },
      { term: "biopsy", category: "procedure" },
      { term: "mammogram", category: "screening" },
      { term: "ultrasound", category: "screening" },
      { term: "mri", category: "screening" },
      { term: "ct scan", category: "screening" },
      { term: "hemoglobin", category: "lab" },
      { term: "glucose", category: "lab" },
      { term: "cholesterol", category: "lab" },
      { term: "ca 125", category: "tumor marker" },
      { term: "cea", category: "tumor marker" },
      { term: "brca", category: "genetic" },
      { term: "family history", category: "risk" },
      { term: "smoker", category: "risk" },
      { term: "obesity", category: "risk" },
    ];

    medicalKeywords.forEach(({ term, category }) => {
      if (lowerText.includes(term)) {
        keywords.push(term);
        if (category === "concern") {
          keyFindings.push(`Detected: ${term}`);
        } else if (category === "risk") {
          riskFactors.push(`Risk factor: ${term}`);
        }
      }
    });

    // Extract lab values (simple pattern matching)
    const labPatterns = [
      { pattern: /hemoglobin[\s:]*(\d+\.?\d*)/i, name: "Hemoglobin", unit: "g/dL" },
      { pattern: /glucose[\s:]*(\d+\.?\d*)/i, name: "Glucose", unit: "mg/dL" },
      { pattern: /cholesterol[\s:]*(\d+\.?\d*)/i, name: "Cholesterol", unit: "mg/dL" },
      { pattern: /wbc[\s:]*(\d+\.?\d*)/i, name: "White Blood Cells", unit: "/μL" },
      { pattern: /rbc[\s:]*(\d+\.?\d*)/i, name: "Red Blood Cells", unit: "/μL" },
    ];

    labPatterns.forEach(({ pattern, name, unit }) => {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        let status: "normal" | "abnormal" | "critical" = "normal";
        
        // Simple heuristics
        if (name === "Glucose" && (value > 126 || value < 70)) status = "abnormal";
        if (name === "Cholesterol" && value > 200) status = "abnormal";
        if (name === "Hemoglobin" && (value < 12 || value > 17)) status = "abnormal";

        labResults.push({ name, value: `${value} ${unit}`, status });
      }
    });

    // Generate recommendations based on findings
    if (keyFindings.length > 0) {
      recommendations.push("Consult with your healthcare provider regarding the findings above");
    } else {
      recommendations.push("Continue regular health monitoring");
    }

    if (riskFactors.length > 0) {
      recommendations.push("Consider lifestyle modifications to reduce identified risk factors");
    }

    if (!lowerText.includes("mammogram") && !lowerText.includes("mri")) {
      recommendations.push("Consider scheduling recommended cancer screenings");
    }

    // Generate summary
    let summary = "Report analysis complete. ";
    if (keyFindings.length > 0) {
      summary += `${keyFindings.length} potential concern(s) identified. Follow-up recommended.`;
    } else if (riskFactors.length > 0) {
      summary += `${riskFactors.length} risk factor(s) identified. Preventive measures recommended.`;
    } else {
      summary += "No significant concerns identified based on the provided text.";
    }

    return {
      summary,
      keyFindings: keyFindings.length > 0 ? keyFindings : ["No specific findings detected"],
      riskFactors: riskFactors.length > 0 ? riskFactors : ["No specific risk factors detected"],
      keywords: [...new Set(keywords)],
      labResults: labResults.length > 0 ? labResults : undefined,
      recommendations,
      followUpActions: keyFindings.length > 0
        ? ["Schedule follow-up within 2 weeks", "Discuss results with specialist", "Consider additional tests if recommended"]
        : ["Maintain current health routine", "Schedule annual checkup"],
    };
  };

  const handleDownload = () => {
    if (!result) return;

    const report = `
═══════════════════════════════════════
    CAVISTA REPORT ANALYSIS
═══════════════════════════════════════

DATE: ${new Date().toLocaleDateString()}
REPORT TYPE: ${reportType || "General"}

─────────────────────────────────────
ANALYSIS SUMMARY
─────────────────────────────────────
${result.summary}

─────────────────────────────────────
KEY FINDINGS
─────────────────────────────────────
${result.keyFindings.map(f => `• ${f}`).join('\n')}

${result.riskFactors.length > 0 ? `
─────────────────────────────────────
RISK FACTORS
─────────────────────────────────────
${result.riskFactors.map(f => `• ${f}`).join('\n')}
` : ''}

${result.labResults && result.labResults.length > 0 ? `
─────────────────────────────────────
LAB VALUES DETECTED
─────────────────────────────────────
${result.labResults.map(l => `${l.name}: ${l.value} [${l.status.toUpperCase()}]`).join('\n')}
` : ''}

─────────────────────────────────────
RECOMMENDATIONS
─────────────────────────────────────
${result.recommendations.map(r => `• ${r}`).join('\n')}

─────────────────────────────────────
FOLLOW-UP ACTIONS
─────────────────────────────────────
${result.followUpActions.map(a => `• ${a}`).join('\n')}

═══════════════════════════════════════
Generated by Cavista AI
This is not a medical diagnosis.
Consult your healthcare provider.
═══════════════════════════════════════
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cavista-Report-Analysis-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!result) return;
    const text = `My Cavista Report Analysis:\n${result.summary}\n\nKey Findings: ${result.keyFindings.join(", ")}\n\nRecommendations: ${result.recommendations.join(", ")}`;
    navigator.clipboard.writeText(text);
    alert("Analysis copied to clipboard!");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">AI Report Analysis</h1>
        <p className="mt-1 text-muted">
          Upload or paste your medical report for AI-powered analysis and insights
        </p>
      </div>

      {/* Step 1: Select Report Type */}
      {!reportText && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              1. What type of report?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`p-5 border rounded-xl text-left transition-all ${
                      reportType === type.id
                        ? "border-action bg-action/5"
                        : "border-border hover:border-action/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-action" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{type.name}</div>
                        <div className="text-sm text-muted">{type.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {reportType && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                2. Upload file or paste report text
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-action/50 transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 mx-auto text-muted mb-2" />
                  <p className="text-sm font-medium text-foreground">Upload File</p>
                  <p className="text-xs text-muted">PDF, TXT, or image</p>
                </div>

                <div className="border border-border rounded-xl p-4">
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Or paste your report text here..."
                    className="w-full h-32 bg-transparent text-sm text-foreground placeholder:text-muted resize-none focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!reportText.trim()}
                className="w-full py-4 bg-action text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Brain className="w-5 h-5" />
                Analyze Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="mt-12 text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 border-4 border-action/20 border-t-action rounded-full animate-spin"></div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Analyzing your report...
          </h3>
          <p className="text-muted mb-6">
            Our AI is extracting insights from your medical report
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              Extracting text
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Identifying keywords
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Activity className="w-4 h-4" />
              Generating insights
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <div className="mt-8 space-y-6">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">Analysis Complete</h3>
                <p className="text-muted mt-1">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Key Findings */}
          {result.keyFindings[0] !== "No specific findings detected" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Key Findings
              </h4>
              <ul className="space-y-2">
                {result.keyFindings.map((finding, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Factors */}
          {result.riskFactors[0] !== "No specific risk factors detected" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Risk Factors Identified
              </h4>
              <ul className="space-y-2">
                {result.riskFactors.map((factor, i) => (
                  <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Lab Results */}
          {result.labResults && result.labResults.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-action" />
                Lab Values Detected
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.labResults.map((lab, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <div className="font-medium text-foreground text-sm">{lab.name}</div>
                      <div className="text-xs text-muted">{lab.value}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      lab.status === "normal" ? "bg-green-100 text-green-700" :
                      lab.status === "abnormal" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>
                      {lab.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recommendations
            </h4>
            <ul className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Follow-up Actions */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-action" />
              Suggested Follow-up Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.followUpActions.map((action, i) => (
                <span key={i} className="px-3 py-1.5 bg-action/10 text-action text-sm rounded-lg">
                  {action}
                </span>
              ))}
            </div>
          </div>

          {/* Keywords */}
          {result.keywords.length > 0 && (
            <div className="text-center">
              <p className="text-xs text-muted mb-2">Detected Keywords</p>
              <div className="flex flex-wrap justify-center gap-2">
                {result.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-1 bg-surface border border-border text-xs text-muted rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => { setResult(null); setReportText(""); setReportType(""); }}
              className="flex-1 py-3 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-surface"
            >
              New Analysis
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-surface flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-action text-white font-semibold rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> This is AI-generated analysis for informational purposes only. 
              It is not a medical diagnosis. Always consult with a qualified healthcare professional 
              for proper interpretation of your medical reports.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default ReportAnalysisPage;
