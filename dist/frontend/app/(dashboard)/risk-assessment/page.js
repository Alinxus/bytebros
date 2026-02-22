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
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold tracking-tight text-foreground", children: "Risk Assessment" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-muted", children: "Comprehensive risk evaluation using genetics, lifestyle, and prior imaging results." })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger", role: "alert", children: error })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-4", children: "Patient Data" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "risk-age", className: "block text-xs text-muted mb-1", children: "Age" }), (0, jsx_runtime_1.jsx)("input", { id: "risk-age", type: "number", min: "0", max: "120", value: age, onChange: (e) => setAge(e.target.value), placeholder: "e.g. 55", required: true, className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "risk-gender", className: "block text-xs text-muted mb-1", children: "Gender" }), (0, jsx_runtime_1.jsxs)("select", { id: "risk-gender", value: gender, onChange: (e) => setGender(e.target.value), required: true, className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select" }), (0, jsx_runtime_1.jsx)("option", { value: "male", children: "Male" }), (0, jsx_runtime_1.jsx)("option", { value: "female", children: "Female" })] })] })] }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 cursor-pointer", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: familyHistory, onChange: (e) => setFamilyHistory(e.target.checked), className: "accent-action" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-foreground", children: "Family history of cancer" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-4", children: "Genetic Markers" }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: GENETIC_MARKERS.map((marker) => {
                                    const isSelected = selectedMarkers.includes(marker);
                                    return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleToggleMarker(marker), className: `text-xs px-3 py-1.5 border transition-colors ${isSelected
                                            ? "border-action bg-action/5 text-action"
                                            : "border-border text-muted hover:border-foreground hover:text-foreground"}`, "aria-pressed": isSelected, children: marker }, marker));
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-4", children: "Lifestyle" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "risk-smoking", className: "block text-xs text-muted mb-1", children: "Smoking" }), (0, jsx_runtime_1.jsxs)("select", { id: "risk-smoking", value: smoking, onChange: (e) => setSmoking(e.target.value), className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select" }), (0, jsx_runtime_1.jsx)("option", { value: "current", children: "Current" }), (0, jsx_runtime_1.jsx)("option", { value: "former", children: "Former" }), (0, jsx_runtime_1.jsx)("option", { value: "never", children: "Never" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "risk-obesity", className: "block text-xs text-muted mb-1", children: "BMI Category" }), (0, jsx_runtime_1.jsxs)("select", { id: "risk-obesity", value: obesity, onChange: (e) => setObesity(e.target.value), className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select" }), (0, jsx_runtime_1.jsx)("option", { value: "obese", children: "Obese" }), (0, jsx_runtime_1.jsx)("option", { value: "overweight", children: "Overweight" }), (0, jsx_runtime_1.jsx)("option", { value: "normal", children: "Normal" })] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-4", children: "Prior Imaging Results (Optional)" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 cursor-pointer", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: hasAbnormality, onChange: (e) => setHasAbnormality(e.target.checked), className: "accent-action" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-foreground", children: "Abnormality detected" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "imaging-risk", className: "block text-xs text-muted mb-1", children: "Imaging Risk Level" }), (0, jsx_runtime_1.jsxs)("select", { id: "imaging-risk", value: imagingRisk, onChange: (e) => setImagingRisk(e.target.value), className: "w-full border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select" }), (0, jsx_runtime_1.jsx)("option", { value: "low", children: "Low" }), (0, jsx_runtime_1.jsx)("option", { value: "medium", children: "Medium" }), (0, jsx_runtime_1.jsx)("option", { value: "high", children: "High" })] })] })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Calculate risk assessment", children: isLoading ? "Calculating..." : "Calculate Risk" })] }), result && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-8 space-y-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "Results" }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center mb-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Overall Risk Score" }), (0, jsx_runtime_1.jsx)("p", { className: `text-4xl font-semibold ${result.riskAssessment.overallRisk >= 70
                                            ? "text-danger"
                                            : result.riskAssessment.overallRisk >= 40
                                                ? "text-yellow-600"
                                                : "text-action"}`, children: result.riskAssessment.overallRisk }), (0, jsx_runtime_1.jsxs)("span", { className: `inline-block mt-2 text-xs font-medium tracking-widest uppercase px-3 py-1 border ${result.riskAssessment.riskLevel === "high"
                                            ? "border-danger/30 text-danger"
                                            : result.riskAssessment.riskLevel === "medium"
                                                ? "border-yellow-400/30 text-yellow-600"
                                                : "border-action/30 text-action"}`, children: [result.riskAssessment.riskLevel, " risk"] })] }), result.riskAssessment.factors.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-2", children: "Contributing Factors" }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-1", role: "list", children: result.riskAssessment.factors.map((factor, i) => ((0, jsx_runtime_1.jsx)("li", { className: "text-sm text-foreground border-l-2 border-border pl-3", children: factor }, i))) })] })), result.riskAssessment.recommendations.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "border-t border-border pt-4 mt-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-2", children: "Recommendations" }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-1", role: "list", children: result.riskAssessment.recommendations.map((rec, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "text-sm text-muted flex items-start gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-action mt-0.5 text-xs", "aria-hidden": "true", children: "\u2713" }), rec] }, i))) })] }))] })] }))] }));
};
exports.default = RiskAssessmentPage;
