"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|---------------------------------------------------
| Npm Import
|---------------------------------------------------
*/
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const RISK_FACTORS_INFO = [
    {
        id: "age",
        name: "Age",
        category: "demographic",
        description: "Risk increases with age, especially after 50",
        impact: "medium",
        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-4 h-4" }),
    },
    {
        id: "family-history",
        name: "Family History",
        category: "demographic",
        description: "Genetic predisposition based on family cancer history",
        impact: "high",
        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Heart, { className: "w-4 h-4" }),
    },
    {
        id: "brca",
        name: "BRCA Genes",
        category: "genetic",
        description: "BRCA1/2 mutations significantly increase cancer risk",
        impact: "high",
        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Dna, { className: "w-4 h-4" }),
    },
    {
        id: "smoking",
        name: "Smoking",
        category: "lifestyle",
        description: "Tobacco use is a major cancer risk factor",
        impact: "high",
        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-4 h-4" }),
    },
    {
        id: "obesity",
        name: "BMI/Weight",
        category: "lifestyle",
        description: "Obesity is linked to multiple cancer types",
        impact: "medium",
        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-4 h-4" }),
    },
    {
        id: "imaging",
        name: "Prior Imaging",
        category: "imaging",
        description: "Previous imaging findings may indicate elevated risk",
        impact: "varies",
        icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Brain, { className: "w-4 h-4" }),
    },
];
const getImpactColor = (impact) => {
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
const getRiskLevelColor = (level) => {
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
];
const RiskAssessmentPage = () => {
    /*
   |---------------------------------------------------
   | States
   |---------------------------------------------------
   */
    const [age, setAge] = (0, react_1.useState)("");
    const [gender, setGender] = (0, react_1.useState)("");
    const [familyHistory, setFamilyHistory] = (0, react_1.useState)(false);
    const [selectedMarkers, setSelectedMarkers] = (0, react_1.useState)([]);
    const [smoking, setSmoking] = (0, react_1.useState)("");
    const [obesity, setObesity] = (0, react_1.useState)("");
    const [hasAbnormality, setHasAbnormality] = (0, react_1.useState)(false);
    const [imagingRisk, setImagingRisk] = (0, react_1.useState)("");
    const [error, setError] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    const [expandedSections, setExpandedSections] = (0, react_1.useState)(["factors"]);
    const toggleSection = (section) => {
        setExpandedSections((prev) => prev.includes(section)
            ? prev.filter((s) => s !== section)
            : [...prev, section]);
    };
    const handleToggleMarker = (marker) => {
        setSelectedMarkers((prev) => prev.includes(marker)
            ? prev.filter((m) => m !== marker)
            : [...prev, marker]);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResult(null);
        if (!age || !gender) {
            setError("Age and gender are required.");
            return;
        }
        setIsLoading(true);
        const apiKey = localStorage.getItem("cavista_api_key") || "";
        const body = {
            patientData: {
                age: parseInt(age),
                gender,
                familyHistory: familyHistory || undefined,
                geneticMarkers: selectedMarkers.length > 0 ? selectedMarkers : undefined,
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
            }
            catch {
                // ignore storage errors
            }
        }
        catch {
            setError("Network error. Please try again.");
        }
        finally {
            setIsLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-5xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 mb-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "p-2 bg-action/10 rounded-lg", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { className: "w-6 h-6 text-action" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold tracking-tight text-foreground", children: "AI Risk Assessment" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: "Know your risk factors" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-muted ml-12", children: "Comprehensive risk evaluation using AI-powered analysis of genetics, lifestyle factors, and prior imaging results." })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-surface rounded-lg border border-border p-4 mb-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-sm text-muted", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Brain, { className: "w-4 h-4 text-action" }), (0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("strong", { className: "text-foreground font-medium", children: "AI-Powered Analysis:" }), " Your assessment is processed by our advanced AI model to provide personalized risk evaluation."] })] }) }), error && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger rounded-lg flex items-center gap-2", role: "alert", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-4 h-4 flex-shrink-0" }), error] })), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "lg:col-span-2", children: (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6 rounded-lg bg-background", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-4 h-4 text-action" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "Patient Data" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "risk-age", className: "block text-xs text-muted mb-1", children: "Age *" }), (0, jsx_runtime_1.jsx)("input", { id: "risk-age", type: "number", min: "0", max: "120", value: age, onChange: (e) => setAge(e.target.value), placeholder: "e.g. 55", required: true, className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "risk-gender", className: "block text-xs text-muted mb-1", children: "Gender *" }), (0, jsx_runtime_1.jsxs)("select", { id: "risk-gender", value: gender, onChange: (e) => setGender(e.target.value), required: true, className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select" }), (0, jsx_runtime_1.jsx)("option", { value: "male", children: "Male" }), (0, jsx_runtime_1.jsx)("option", { value: "female", children: "Female" })] })] })] }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-surface transition-colors", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: familyHistory, onChange: (e) => setFamilyHistory(e.target.checked), className: "w-4 h-4 accent-action" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-foreground", children: "Family history of cancer" }), (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "w-3.5 h-3.5 text-muted ml-auto" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6 rounded-lg bg-background", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Dna, { className: "w-4 h-4 text-action" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "Genetic Markers" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: GENETIC_MARKERS.map((marker) => {
                                                const isSelected = selectedMarkers.includes(marker);
                                                return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleToggleMarker(marker), className: `text-xs px-3 py-1.5 border transition-colors ${isSelected
                                                        ? "border-action bg-action/5 text-action"
                                                        : "border-border text-muted hover:border-foreground hover:text-foreground"}`, "aria-pressed": isSelected, children: marker }, marker));
                                            }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6 rounded-lg bg-background", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Heart, { className: "w-4 h-4 text-action" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "Lifestyle" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "risk-smoking", className: "block text-xs text-muted mb-1", children: "Smoking" }), (0, jsx_runtime_1.jsxs)("select", { id: "risk-smoking", value: smoking, onChange: (e) => setSmoking(e.target.value), className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select" }), (0, jsx_runtime_1.jsx)("option", { value: "current", children: "Current" }), (0, jsx_runtime_1.jsx)("option", { value: "former", children: "Former" }), (0, jsx_runtime_1.jsx)("option", { value: "never", children: "Never" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "risk-obesity", className: "block text-xs text-muted mb-1", children: "BMI Category" }), (0, jsx_runtime_1.jsxs)("select", { id: "risk-obesity", value: obesity, onChange: (e) => setObesity(e.target.value), className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select" }), (0, jsx_runtime_1.jsx)("option", { value: "obese", children: "Obese" }), (0, jsx_runtime_1.jsx)("option", { value: "overweight", children: "Overweight" }), (0, jsx_runtime_1.jsx)("option", { value: "normal", children: "Normal" })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6 rounded-lg bg-background", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Brain, { className: "w-4 h-4 text-action" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "Prior Imaging Results (Optional)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-surface transition-colors", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: hasAbnormality, onChange: (e) => setHasAbnormality(e.target.checked), className: "w-4 h-4 accent-action" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-foreground", children: "Abnormality detected" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "imaging-risk", className: "block text-xs text-muted mb-1", children: "Imaging Risk Level" }), (0, jsx_runtime_1.jsxs)("select", { id: "imaging-risk", value: imagingRisk, onChange: (e) => setImagingRisk(e.target.value), className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-colors", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select" }), (0, jsx_runtime_1.jsx)("option", { value: "low", children: "Low" }), (0, jsx_runtime_1.jsx)("option", { value: "medium", children: "Medium" }), (0, jsx_runtime_1.jsx)("option", { value: "high", children: "High" })] })] })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed rounded-lg", "aria-label": "Calculate risk assessment", children: isLoading ? ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "w-4 h-4 animate-spin" }), "Analyzing Risk Factors..."] })) : ("Calculate Risk Assessment") })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "lg:col-span-1", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-surface rounded-lg border border-border p-4 sticky top-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-medium text-foreground mb-3", children: "Understanding Risk Factors" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: RISK_FACTORS_INFO.map((factor) => ((0, jsx_runtime_1.jsxs)("div", { className: `p-3 rounded-lg border text-xs ${getImpactColor(factor.impact)}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-1", children: [factor.icon, (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: factor.name })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted opacity-80", children: factor.description })] }, factor.id))) })] }) })] }), result && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-8 space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Brain, { className: "w-5 h-5 text-action" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium tracking-widest uppercase text-muted", children: "AI Analysis Results" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `border border-border p-6 rounded-lg bg-gradient-to-br ${getRiskLevelColor(result.riskAssessment.riskLevel)}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center mb-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Overall Risk Score" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative inline-block", children: [(0, jsx_runtime_1.jsx)("p", { className: `text-5xl font-semibold ${result.riskAssessment.overallRisk >= 70
                                                    ? "text-danger"
                                                    : result.riskAssessment.overallRisk >= 40
                                                        ? "text-yellow-600"
                                                        : "text-action"}`, children: result.riskAssessment.overallRisk }), (0, jsx_runtime_1.jsx)("span", { className: "text-lg text-muted", children: "/100" })] }), (0, jsx_runtime_1.jsxs)("span", { className: `inline-block mt-3 text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full ${result.riskAssessment.riskLevel === "high"
                                            ? "bg-danger/10 text-danger border border-danger/20"
                                            : result.riskAssessment.riskLevel === "medium"
                                                ? "bg-yellow-100 text-yellow-700 border border-yellow-400/20"
                                                : "bg-action/10 text-action border border-action/20"}`, children: [result.riskAssessment.riskLevel, " risk"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-surface rounded-full h-2 mb-6 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full transition-all duration-1000 ${result.riskAssessment.overallRisk >= 70
                                        ? "bg-danger"
                                        : result.riskAssessment.overallRisk >= 40
                                            ? "bg-yellow-500"
                                            : "bg-action"}`, style: { width: `${result.riskAssessment.overallRisk}%` } }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-4 text-center mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-background/50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Low" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold text-action", children: "0-39" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-background/50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Medium" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold text-yellow-600", children: "40-69" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-background/50 rounded-lg", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "High" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold text-danger", children: "70-100" })] })] }), result.riskAssessment.factors.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => toggleSection("factors"), className: "flex items-center justify-between w-full text-left mb-2", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-xs font-medium text-muted flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-3.5 h-3.5" }), "Contributing Factors"] }), expandedSections.includes("factors") ? ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronUp, { className: "w-4 h-4 text-muted" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "w-4 h-4 text-muted" }))] }), expandedSections.includes("factors") && ((0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", role: "list", children: result.riskAssessment.factors.map((factor, i) => ((0, jsx_runtime_1.jsx)("li", { className: "text-sm text-foreground bg-background/50 border-l-2 border-action pl-3 py-2 rounded-r", children: factor }, i))) }))] })), result.riskAssessment.recommendations.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "border-t border-border/50 pt-4 mt-4", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => toggleSection("recommendations"), className: "flex items-center justify-between w-full text-left mb-2", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-xs font-medium text-muted flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "w-3.5 h-3.5" }), "Recommendations"] }), expandedSections.includes("recommendations") ? ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronUp, { className: "w-4 h-4 text-muted" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "w-4 h-4 text-muted" }))] }), expandedSections.includes("recommendations") && ((0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", role: "list", children: result.riskAssessment.recommendations.map((rec, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "text-sm text-foreground flex items-start gap-2 bg-background/50 p-2 rounded", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle2, { className: "w-4 h-4 text-action mt-0.5 flex-shrink-0" }), rec] }, i))) }))] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-yellow-50 border border-yellow-400/20 rounded-lg p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-yellow-800", children: "Important Disclaimer" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-yellow-700 mt-1", children: "This AI-powered risk assessment is for informational purposes only and should not replace professional medical advice. Please consult with your healthcare provider for personalized risk evaluation and appropriate screening recommendations." })] })] }) })] }))] }));
};
exports.default = RiskAssessmentPage;
