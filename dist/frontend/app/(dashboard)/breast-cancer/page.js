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
/*
|-------------------------------------------------------------
| Constants
|-------------------------------------------------------------
*/
const FEATURE_LABELS = [
    "radius_mean",
    "texture_mean",
    "perimeter_mean",
    "area_mean",
    "smoothness_mean",
    "compactness_mean",
    "concavity_mean",
    "concave_points_mean",
    "symmetry_mean",
    "fractal_dim_mean",
    "radius_se",
    "texture_se",
    "perimeter_se",
    "area_se",
    "smoothness_se",
    "compactness_se",
    "concavity_se",
    "concave_points_se",
    "symmetry_se",
    "fractal_dim_se",
    "radius_worst",
    "texture_worst",
    "perimeter_worst",
    "area_worst",
    "smoothness_worst",
    "compactness_worst",
    "concavity_worst",
    "concave_points_worst",
    "symmetry_worst",
    "fractal_dim_worst",
];
const BreastCancerPage = () => {
    /*
    |-------------------------------------------------------------
    | States
    |-------------------------------------------------------------
    */
    const [features, setFeatures] = (0, react_1.useState)(new Array(30).fill(0));
    const [error, setError] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    const handleFeatureChange = (index, value) => {
        setFeatures((prev) => {
            const next = [...prev];
            next[index] = parseFloat(value) || 0;
            return next;
        });
    };
    /*
    |-------------------------------------------------------------
    | Handlers
    |-------------------------------------------------------------
    | handleFeatureChange: Updates the specific feature value in state when an input changes.
    | handleSubmit: Validates input, sends prediction request to API, handles response, and manages loading/error states.
    | handleReset: Resets all feature values to 0 and clears results/errors.
    |-------------------------------------------------------------
    */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResult(null);
        setIsLoading(true);
        const apiKey = localStorage.getItem("cavista_api_key") || "";
        try {
            const res = await fetch("/api/screening/breast-cancer-predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({ features }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Prediction failed.");
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
    const handleReset = () => {
        setFeatures(new Array(30).fill(0));
        setResult(null);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold tracking-tight text-foreground", children: "Breast Cancer Prediction" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-muted", children: "Random Forest model using 30 Wisconsin dataset features for benign/malignant classification." })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger", role: "alert", children: error })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "30 Features (Wisconsin Dataset)" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleReset, className: "text-xs text-action hover:underline", tabIndex: 0, "aria-label": "Reset all feature values", children: "Reset" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: FEATURE_LABELS.map((label, i) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: `f-${i}`, className: "block text-[10px] text-muted mb-0.5 truncate", title: label, children: label }), (0, jsx_runtime_1.jsx)("input", { id: `f-${i}`, type: "number", step: "any", value: features[i], onChange: (e) => handleFeatureChange(i, e.target.value), className: "w-full border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors" })] }, label))) })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Run breast cancer prediction", children: isLoading ? "Predicting..." : "Run Prediction" })] }), result && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-8 space-y-6", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "Results" }), (0, jsx_runtime_1.jsx)("div", { className: "border border-border p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Prediction" }), (0, jsx_runtime_1.jsx)("p", { className: `text-2xl font-semibold capitalize ${result.prediction.prediction === "malignant"
                                                ? "text-danger"
                                                : "text-action"}`, children: result.prediction.prediction })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Confidence" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-2xl font-semibold text-foreground", children: [(result.prediction.confidence * 100).toFixed(1), "%"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mb-1", children: "Risk Level" }), (0, jsx_runtime_1.jsx)("p", { className: `text-2xl font-semibold capitalize ${result.prediction.riskLevel === "high"
                                                ? "text-danger"
                                                : result.prediction.riskLevel === "medium"
                                                    ? "text-yellow-600"
                                                    : "text-action"}`, children: result.prediction.riskLevel })] })] }) })] }))] }));
};
exports.default = BreastCancerPage;
