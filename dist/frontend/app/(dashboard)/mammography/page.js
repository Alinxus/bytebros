"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|-------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
const react_1 = require("react");
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
});
const MammographyPage = () => {
    /*
    |-------------------------------------------------------------
    | States
    |-------------------------------------------------------------
    */
    const [file, setFile] = (0, react_1.useState)(null);
    const [preview, setPreview] = (0, react_1.useState)("");
    const [error, setError] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    const [auditDetails, setAuditDetails] = (0, react_1.useState)(null);
    const [auditError, setAuditError] = (0, react_1.useState)("");
    /*
    |-------------------------------------------------------------
    | Handlers
    |-------------------------------------------------------------
    | handleFileChange: Validates and sets the selected file, generates a preview, and resets results/errors.
    | handleSubmit: Validates input, converts image to base64, sends analysis request, handles response, and manages loading state.
    |-------------------------------------------------------------
    */
    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if (!selected)
            return;
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setResult(null);
        setError("");
    };
    const handleSubmit = async (e) => {
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
        }
        catch {
            setError("Network error. Please try again.");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleFetchAudit = async (id) => {
        setAuditError("");
        setAuditDetails(null);
        try {
            const apiKey = localStorage.getItem("cavista_api_key") || "";
            const res = await fetch(`/api/screening/audit/${id}`, {
                headers: { "x-api-key": apiKey },
            });
            const data = await res.json();
            if (!res.ok) {
                setAuditError(data.error || "Unable to load audit trail.");
                return;
            }
            setAuditDetails(data);
        }
        catch {
            setAuditError("Unable to load audit trail.");
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold tracking-tight text-foreground", children: "Mammography Analysis" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-muted", children: "AI-powered breast imaging analysis. Upload a mammogram for screening." })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger", role: "alert", children: error })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-4", children: "Upload Mammogram" }), (0, jsx_runtime_1.jsxs)("label", { htmlFor: "mammo-file", className: "block border-2 border-dashed border-border hover:border-muted transition-colors cursor-pointer text-center py-10", children: [preview ? ((0, jsx_runtime_1.jsx)("img", { src: preview, alt: "Mammogram preview", className: "mx-auto max-h-48 object-contain" })) : ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted mb-1", children: "Click to upload or drag and drop" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted/60", children: "PNG, JPG, DICOM" })] })), (0, jsx_runtime_1.jsx)("input", { id: "mammo-file", type: "file", accept: "image/*", onChange: handleFileChange, className: "hidden" })] }), file && ((0, jsx_runtime_1.jsxs)("p", { className: "mt-2 text-xs text-muted", children: [file.name, " (", (file.size / 1024).toFixed(1), " KB)"] }))] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading || !file, className: "w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Analyze mammogram", children: isLoading ? "Analyzing..." : "Analyze Mammogram" })] }), result && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-8 space-y-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "Results" }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-4 mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Prediction" }), (0, jsx_runtime_1.jsx)("p", { className: `text-lg font-semibold capitalize ${result.analysis.prediction === "malignant"
                                                    ? "text-danger"
                                                    : "text-action"}`, children: result.analysis.prediction })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Confidence" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-lg font-semibold text-foreground", children: [((result.analysis.calibratedConfidence ?? result.analysis.confidence) * 100).toFixed(1), "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Risk Level" }), (0, jsx_runtime_1.jsx)("p", { className: `text-lg font-semibold capitalize ${result.analysis.riskLevel === "high"
                                                    ? "text-danger"
                                                    : result.analysis.riskLevel === "medium"
                                                        ? "text-yellow-600"
                                                        : "text-action"}`, children: result.analysis.riskLevel })] })] }), result.analysis.riskScore !== undefined && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Risk Score" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-semibold text-foreground", children: [result.analysis.riskScore, "/100"] })] })), result.analysis.quality && ((0, jsx_runtime_1.jsxs)("div", { className: `mb-4 rounded-lg border p-3 ${result.analysis.quality.quality === "poor"
                                    ? "bg-yellow-50 border-yellow-200"
                                    : "bg-green-50 border-green-200"}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-4 flex-wrap", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium text-foreground", children: "Image Quality Check" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted", children: "Low-quality images reduce confidence." })] }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs font-semibold uppercase ${result.analysis.quality.quality === "poor" ? "text-yellow-700" : "text-green-700"}`, children: result.analysis.quality.quality })] }), result.analysis.quality.issues.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "mt-2 flex flex-wrap gap-2", children: result.analysis.quality.issues.map((issue, i) => ((0, jsx_runtime_1.jsx)("span", { className: "text-xs bg-background border border-border rounded-full px-2 py-0.5 text-muted", children: issue.replace(/_/g, " ") }, i))) }))] })), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-2", children: "Probability Breakdown" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Benign" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 h-2 bg-surface", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-action", style: {
                                                                width: `${result.analysis.probabilities.benign * 100}%`,
                                                            } }) }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm font-medium text-foreground", children: [(result.analysis.probabilities.benign * 100).toFixed(1), "%"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Malignant" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 h-2 bg-surface", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-danger", style: {
                                                                width: `${result.analysis.probabilities.malignant * 100}%`,
                                                            } }) }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm font-medium text-foreground", children: [(result.analysis.probabilities.malignant * 100).toFixed(1), "%"] })] })] })] })] }), result.auditId && ((0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-xs text-muted", children: "Audit Trail" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-foreground flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Audit ID: ", result.auditId] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleFetchAudit(result.auditId), className: "text-xs text-action hover:underline", children: "View" })] }), auditError && ((0, jsx_runtime_1.jsx)("div", { className: "text-xs text-red-600 mt-2", children: auditError })), auditDetails && ((0, jsx_runtime_1.jsx)("pre", { className: "text-xs mt-3 bg-background border border-border rounded-lg p-3 overflow-auto", children: JSON.stringify(auditDetails, null, 2) }))] }))] }))] }));
};
exports.default = MammographyPage;
