"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Brain, Loader2, Download, Share2, AlertCircle, CheckCircle, ClipboardList, Stethoscope, Activity, MessageCircle, ArrowRight, X, File, Image } from "lucide-react";

type Finding = {
  term: string;
  explanation: string;
  severity: "normal" | "watch" | "follow-up";
};

type AnalysisResult = {
  summary: string;
  findings: Finding[];
  recommendations: string[];
  riskLevel: string;
  followUp: string[];
  questionsForDoctor: string[];
};

type EvidenceSnippet = {
  term: string;
  snippet: string;
};

type PreventionPlan = {
  title: string;
  items: string[];
};

const REPORT_TYPES = [
  { id: "blood", name: "Blood Test", description: "Complete blood count, metabolic panel", icon: ClipboardList },
  { id: "imaging", name: "Imaging Report", description: "X-Ray, MRI, CT scan reports", icon: Stethoscope },
  { id: "biopsy", name: "Biopsy Report", description: "Pathology reports", icon: FileText },
  { id: "general", name: "General Medical", description: "Doctor's notes, summaries", icon: Brain },
];

function ReportAnalysisPage() {
  const [reportType, setReportType] = useState("");
  const [reportText, setReportText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildEvidenceSnippets = (text: string, findings: Finding[]): EvidenceSnippet[] => {
    if (!text || findings.length === 0) return [];
    const lower = text.toLowerCase();
    return findings.slice(0, 6).map((finding) => {
      const term = finding.term;
      const idx = lower.indexOf(term.toLowerCase());
      if (idx === -1) {
        return { term, snippet: "Term not found in the provided report text." };
      }
      const start = Math.max(0, idx - 60);
      const end = Math.min(text.length, idx + term.length + 60);
      const snippet = text.substring(start, end).replace(/\s+/g, " ").trim();
      return { term, snippet: `${start > 0 ? "..." : ""}${snippet}${end < text.length ? "..." : ""}` };
    });
  };

  const buildPreventionPlan = (riskLevel: string): PreventionPlan[] => {
    const base = [
      { title: "Next 30 Days", items: ["Book a follow-up appointment", "Share this report with your clinician", "List any symptoms or changes you have noticed"] },
      { title: "Next 60 Days", items: ["Complete any recommended tests or imaging", "Track key metrics at home if applicable", "Review family history with your clinician"] },
      { title: "Next 90 Days", items: ["Confirm a long-term screening schedule", "Discuss prevention options and lifestyle changes", "Set reminders for the next screening"] },
    ];

    if (riskLevel === "high") {
      return [
        { title: "Next 30 Days", items: ["Schedule specialist consult within 1-2 weeks", "Request follow-up imaging or biopsy if advised", "Prepare a questions list for your doctor"] },
        { title: "Next 60 Days", items: ["Complete recommended diagnostic procedures", "Review treatment or monitoring options", "Arrange a second opinion if needed"] },
        { title: "Next 90 Days", items: ["Begin agreed care plan", "Set a strict follow-up cadence", "Create a symptom and medication log"] },
      ];
    }

    if (riskLevel === "medium") {
      return [
        { title: "Next 30 Days", items: ["Schedule a follow-up appointment", "Confirm any additional tests", "Track symptoms weekly"] },
        { title: "Next 60 Days", items: ["Complete recommended imaging or labs", "Review findings with your clinician", "Adjust lifestyle factors if advised"] },
        { title: "Next 90 Days", items: ["Set a 6-12 month screening plan", "Monitor key metrics monthly", "Document any changes"] },
      ];
    }

    return base;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setError("");

    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        setReportText(text);
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setReportText(`[PDF Document: ${file.name}]\n\nPlease wait while we process your PDF...`);
      } else if (file.type.startsWith("image/")) {
        setReportText(`[Image: ${file.name}]\n\nImage upload detected. Processing for text extraction...`);
      } else {
        setError("Unsupported file type. Please upload a text file, PDF, or image.");
        return;
      }
    } catch (err) {
      setError("Failed to read file. Please try again.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      handleFileUpload({ target: { files: dt.files } } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setUploadedFile(null);
    setReportText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if ((!reportText.trim() || reportText.length < 10) && !uploadedFile) {
      setError("Please upload a file or enter your medical report text (at least 10 characters)");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    const apiKey = localStorage.getItem("cavista_api_key") || "";

    try {
      let requestBody: any = {
        reportText: reportText,
        reportType: reportType || "general",
      };

      if (uploadedFile && (uploadedFile.type !== "text/plain" && !uploadedFile.name.endsWith(".txt"))) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("reportType", reportType || "general");

        const res = await fetch("/api/screening/report/analyze/file", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
          },
          body: formData,
        });

        setIsUploading(false);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Analysis failed");
        }

        const data = await res.json();
        setResult(data.analysis);
      } else {
        const res = await fetch("/api/screening/report/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Analysis failed");
        }

        setResult(data.analysis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const report = `
═══════════════════════════════════════════════════
        MIRA REPORT ANALYSIS
        Prevention Through Early Detection
═══════════════════════════════════════════════════

DATE: ${new Date().toLocaleDateString()}

───────────────────────────────────────────
SUMMARY
───────────────────────────────────────────
${result.summary}

${result.findings.length > 0 ? `
───────────────────────────────────────────
KEY FINDINGS (Plain English)
───────────────────────────────────────────
${result.findings.map(f => `
• ${f.term}
  What this means: ${f.explanation}
  Status: ${f.severity.toUpperCase()}
`).join('\n')}
` : ''}

${result.recommendations.length > 0 ? `
───────────────────────────────────────────
RECOMMENDATIONS
───────────────────────────────────────────
${result.recommendations.map(r => `• ${r}`).join('\n')}
` : ''}

${result.questionsForDoctor.length > 0 ? `
───────────────────────────────────────────
QUESTIONS TO ASK YOUR DOCTOR
───────────────────────────────────────────
${result.questionsForDoctor.map(q => `• ${q}`).join('\n')}
` : ''}

───────────────────────────────────────────
RISK LEVEL: ${result.riskLevel.toUpperCase()}
──────────────────────────────────────────═

DISCLAIMER:
This AI analysis is for informational purposes only.
Always consult with a qualified healthcare professional
for proper medical advice and interpretation.

Generated by Mira AI
═══════════════════════════════════════════════════
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mira-Report-Analysis-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Report Analysis</h1>
        <p className="mt-1 text-muted">
          Paste your medical report for easy-to-understand AI analysis
        </p>
      </div>

      {!result && !isAnalyzing && (
        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Report Type (optional)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`p-4 border rounded-xl text-center transition-all ${
                      reportType === type.id ? "border-action bg-action/5" : "border-border hover:border-action/50"
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-muted" />
                    <div className="text-sm font-medium text-foreground">{type.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Upload Report File
            </label>
            {!uploadedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-action/50 hover:bg-surface transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-10 h-10 mx-auto mb-4 text-muted" />
                <p className="text-sm text-muted mb-2">
                  Drag and drop your report here, or click to browse
                </p>
                <p className="text-xs text-muted">
                  Supports: PDF, Text (.txt), Images (JPG, PNG)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl">
                {uploadedFile.type.startsWith("image/") ? (
                  <Image className="w-10 h-10 text-muted" />
                ) : uploadedFile.name.endsWith(".pdf") ? (
                  <FileText className="w-10 h-10 text-red-500" />
                ) : (
                  <File className="w-10 h-10 text-blue-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-xs text-muted">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 hover:bg-background rounded-lg"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
            )}
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Or paste your medical report
            </label>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Paste your blood test results, imaging report, biopsy results, or any medical report here...

Example:
Complete Blood Count (CBC)
WBC: 7.5 x10^9/L
RBC: 4.8 x10^12/L
Hemoglobin: 14.2 g/dL
Platelets: 250 x10^9/L"
              className="w-full h-48 border border-border rounded-xl p-4 text-sm bg-background text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-action"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={(!reportText.trim() || reportText.length < 10) && !uploadedFile || isAnalyzing || isUploading}
            className="w-full py-4 bg-action text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {(isAnalyzing || isUploading) ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Brain className="w-5 h-5" />
            )}
            {isUploading ? "Processing file..." : "Analyze with AI"}
          </button>
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-action/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-action rounded-full animate-spin"></div>
            <Brain className="absolute inset-0 m-auto w-10 h-10 text-action" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Analyzing your report...</h3>
          <p className="text-muted">Our AI is translating medical terms into plain English</p>
        </div>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">What this report means</h3>
                <p className="text-muted leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Risk Level */}
          <div className={`rounded-xl p-5 ${
            result.riskLevel === "high" ? "bg-red-50 border border-red-200" :
            result.riskLevel === "medium" ? "bg-yellow-50 border border-yellow-200" :
            result.riskLevel === "low" ? "bg-green-50 border border-green-200" :
            "bg-gray-50 border border-gray-200"
          }`}>
            <div className="flex items-center gap-3">
              {result.riskLevel === "high" || result.riskLevel === "medium" ? (
                <AlertCircle className={`w-6 h-6 ${result.riskLevel === "high" ? "text-red-600" : "text-yellow-600"}`} />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
              <div>
                <div className="font-semibold text-foreground">Risk Level: <span className="uppercase">{result.riskLevel}</span></div>
                <p className="text-sm text-muted">
                  {result.riskLevel === "high" ? "Follow-up recommended soon" :
                   result.riskLevel === "medium" ? "Consider scheduling a check-up" :
                   result.riskLevel === "low" ? "No immediate concerns" : "Review with your doctor"}
                </p>
              </div>
            </div>
          </div>

          {/* Findings */}
          {result.findings.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-action" />
                What we found
              </h4>
              <div className="space-y-3">
                {result.findings.map((finding, i) => (
                  <div key={i} className="p-4 bg-background rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{finding.term}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        finding.severity === "follow-up" ? "bg-yellow-100 text-yellow-700" :
                        finding.severity === "watch" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {finding.severity === "follow-up" ? "Needs Follow-up" :
                         finding.severity === "watch" ? "Watch" : "Normal"}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{finding.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explainability */}
          {result.findings.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-action" />
                Explainability Evidence
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {buildEvidenceSnippets(reportText, result.findings).map((item, i) => (
                  <div key={i} className="bg-background border border-border rounded-lg p-3">
                    <div className="text-xs text-muted mb-2">Matched Term</div>
                    <div className="text-sm font-medium text-foreground mb-2">{item.term}</div>
                    <div className="text-xs text-muted">{item.snippet}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                What to do next
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-green-700 flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prevention Plan */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-action" />
              Prevention Plan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {buildPreventionPlan(result.riskLevel).map((phase) => (
                <div key={phase.title} className="bg-background border border-border rounded-lg p-3">
                  <div className="text-xs text-muted mb-2">{phase.title}</div>
                  <ul className="space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted flex items-start gap-2">
                        <span className="text-action">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Questions for Doctor */}
          {result.questionsForDoctor.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Questions to ask your doctor
              </h4>
              <ul className="space-y-2">
                {result.questionsForDoctor.map((q, i) => (
                  <li key={i} className="text-blue-700 text-sm flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => { setResult(null); setReportText(""); setReportType(""); }}
              className="flex-1 py-3 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-surface"
            >
              Analyze Another Report
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-action text-white font-semibold rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> This AI analysis is for informational purposes only. 
              It is not a medical diagnosis. Always consult with a qualified healthcare professional 
              for proper interpretation of your medical reports.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportAnalysisPage;
