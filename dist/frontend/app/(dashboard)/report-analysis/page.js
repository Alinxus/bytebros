"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const REPORT_TYPES = [
    { id: "blood", name: "Blood Test", description: "Complete blood count, metabolic panel", icon: lucide_react_1.ClipboardList },
    { id: "imaging", name: "Imaging Report", description: "X-Ray, MRI, CT scan reports", icon: lucide_react_1.Stethoscope },
    { id: "biopsy", name: "Biopsy Report", description: "Pathology reports", icon: lucide_react_1.FileText },
    { id: "general", name: "General Medical", description: "Doctor's notes, summaries", icon: lucide_react_1.Brain },
];
function ReportAnalysisPage() {
    const [reportType, setReportType] = (0, react_1.useState)("");
    const [reportText, setReportText] = (0, react_1.useState)("");
    const [isAnalyzing, setIsAnalyzing] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)("");
    const fileInputRef = (0, react_1.useRef)(null);
    const buildEvidenceSnippets = (text, findings) => {
        if (!text || findings.length === 0)
            return [];
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
    const buildPreventionPlan = (riskLevel) => {
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
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
            const text = await file.text();
            setReportText(text);
        }
        else {
            setError("Please paste text content or upload a text file");
        }
    };
    const handleAnalyze = async () => {
        if (!reportText.trim() || reportText.length < 10) {
            setError("Please enter your medical report text (at least 10 characters)");
            return;
        }
        setIsAnalyzing(true);
        setError("");
        const apiKey = localStorage.getItem("cavista_api_key") || "";
        try {
            const res = await fetch("/api/screening/report/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    reportText: reportText,
                    reportType: reportType || "general",
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Analysis failed");
            }
            setResult(data.analysis);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const handleDownload = () => {
        if (!result)
            return;
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold text-foreground", children: "AI Report Analysis" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-muted", children: "Paste your medical report for easy-to-understand AI analysis" })] }), !result && !isAnalyzing && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-foreground mb-3", children: "Report Type (optional)" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: REPORT_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    return ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setReportType(type.id), className: `p-4 border rounded-xl text-center transition-all ${reportType === type.id ? "border-action bg-action/5" : "border-border hover:border-action/50"}`, children: [(0, jsx_runtime_1.jsx)(Icon, { className: "w-6 h-6 mx-auto mb-2 text-muted" }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm font-medium text-foreground", children: type.name })] }, type.id));
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-foreground mb-3", children: "Paste your medical report" }), (0, jsx_runtime_1.jsx)("textarea", { value: reportText, onChange: (e) => setReportText(e.target.value), placeholder: "Paste your blood test results, imaging report, biopsy results, or any medical report here...\n\nExample:\nComplete Blood Count (CBC)\nWBC: 7.5 x10^9/L\nRBC: 4.8 x10^12/L\nHemoglobin: 14.2 g/dL\nPlatelets: 250 x10^9/L", className: "w-full h-64 border border-border rounded-xl p-4 text-sm bg-background text-foreground placeholder:text-muted resize-none focus:outline-none focus:border-action" })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm", children: error })), (0, jsx_runtime_1.jsxs)("button", { onClick: handleAnalyze, disabled: !reportText.trim() || reportText.length < 10, className: "w-full py-4 bg-action text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Brain, { className: "w-5 h-5" }), "Analyze with AI"] })] })), isAnalyzing && ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-20 h-20 mx-auto mb-6 relative", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 border-4 border-action/20 rounded-full" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 border-4 border-t-action rounded-full animate-spin" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Brain, { className: "absolute inset-0 m-auto w-10 h-10 text-action" })] }), (0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-semibold text-foreground mb-2", children: "Analyzing your report..." }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted", children: "Our AI is translating medical terms into plain English" })] })), result && !isAnalyzing && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Brain, { className: "w-6 h-6 text-blue-600" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-foreground mb-2", children: "What this report means" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted leading-relaxed", children: result.summary })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: `rounded-xl p-5 ${result.riskLevel === "high" ? "bg-red-50 border border-red-200" :
                            result.riskLevel === "medium" ? "bg-yellow-50 border border-yellow-200" :
                                result.riskLevel === "low" ? "bg-green-50 border border-green-200" :
                                    "bg-gray-50 border border-gray-200"}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [result.riskLevel === "high" || result.riskLevel === "medium" ? ((0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: `w-6 h-6 ${result.riskLevel === "high" ? "text-red-600" : "text-yellow-600"}` })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-6 h-6 text-green-600" })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "font-semibold text-foreground", children: ["Risk Level: ", (0, jsx_runtime_1.jsx)("span", { className: "uppercase", children: result.riskLevel })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: result.riskLevel === "high" ? "Follow-up recommended soon" :
                                                result.riskLevel === "medium" ? "Consider scheduling a check-up" :
                                                    result.riskLevel === "low" ? "No immediate concerns" : "Review with your doctor" })] })] }) }), result.findings.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-surface border border-border rounded-xl p-5", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "font-semibold text-foreground mb-4 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-5 h-5 text-action" }), "What we found"] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: result.findings.map((finding, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-background rounded-lg", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-foreground", children: finding.term }), (0, jsx_runtime_1.jsx)("span", { className: `px-2 py-1 rounded text-xs font-medium ${finding.severity === "follow-up" ? "bg-yellow-100 text-yellow-700" :
                                                        finding.severity === "watch" ? "bg-orange-100 text-orange-700" :
                                                            "bg-green-100 text-green-700"}`, children: finding.severity === "follow-up" ? "Needs Follow-up" :
                                                        finding.severity === "watch" ? "Watch" : "Normal" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: finding.explanation })] }, i))) })] })), result.findings.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-surface border border-border rounded-xl p-5", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "font-semibold text-foreground mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-5 h-5 text-action" }), "Explainability Evidence"] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: buildEvidenceSnippets(reportText, result.findings).map((item, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-background border border-border rounded-lg p-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-muted mb-2", children: "Matched Term" }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm font-medium text-foreground mb-2", children: item.term }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-muted", children: item.snippet })] }, i))) })] })), result.recommendations.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-green-50 border border-green-200 rounded-xl p-5", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "font-semibold text-green-800 mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-5 h-5" }), "What to do next"] }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", children: result.recommendations.map((rec, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "text-green-700 flex items-start gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "w-4 h-4 mt-1 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { children: rec })] }, i))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "bg-surface border border-border rounded-xl p-5", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "font-semibold text-foreground mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-5 h-5 text-action" }), "Prevention Plan"] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: buildPreventionPlan(result.riskLevel).map((phase) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-background border border-border rounded-lg p-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-muted mb-2", children: phase.title }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", children: phase.items.map((item, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "text-xs text-muted flex items-start gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-action", children: "-" }), (0, jsx_runtime_1.jsx)("span", { children: item })] }, i))) })] }, phase.title))) })] }), result.questionsForDoctor.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-blue-50 border border-blue-200 rounded-xl p-5", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "font-semibold text-blue-800 mb-3 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MessageCircle, { className: "w-5 h-5" }), "Questions to ask your doctor"] }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", children: result.questionsForDoctor.map((q, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "text-blue-700 text-sm flex items-start gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-blue-500", children: "\u2022" }), (0, jsx_runtime_1.jsx)("span", { children: q })] }, i))) })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => { setResult(null); setReportText(""); setReportType(""); }, className: "flex-1 py-3 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-surface", children: "Analyze Another Report" }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleDownload, className: "flex-1 py-3 bg-action text-white font-semibold rounded-xl hover:opacity-90 flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { className: "w-5 h-5" }), "Download Report"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-yellow-50 border border-yellow-200 rounded-xl p-4", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-yellow-800", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Disclaimer:" }), " This AI analysis is for informational purposes only. It is not a medical diagnosis. Always consult with a qualified healthcare professional for proper interpretation of your medical reports."] }) })] }))] }));
}
exports.default = ReportAnalysisPage;
