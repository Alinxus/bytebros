"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|--------------------------------------------------------------
| How It Works Component
*/
/*
|--------------------------------------------------------------
| Steps Data
|-------------------------------------------------------------
*/
const STEPS = [
    {
        step: "01",
        title: "Upload Data",
        description: "Submit X-ray images, clinical features, genetic markers, and lifestyle factors through the platform.",
    },
    {
        step: "02",
        title: "AI Analysis",
        description: "Our ML models and OpenAI Vision process your data — analyzing abnormalities, calculating risk scores, and tracking longitudinal trends.",
    },
    {
        step: "03",
        title: "Get Prediction",
        description: "Receive a comprehensive risk assessment with 5-year, 10-year, and lifetime predictions plus actionable recommendations.",
    },
];
function HowItWorks() {
    return ((0, jsx_runtime_1.jsx)("section", { id: "how-it-works", className: "border-b border-border", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-6xl px-6 py-20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-12", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Process" }), (0, jsx_runtime_1.jsx)("h2", { id: "how-it-works-heading", className: "text-3xl font-semibold tracking-tight text-foreground", children: "How It Works" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-0 border border-border divide-y md:divide-y-0 md:divide-x divide-border", children: STEPS.map((step) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-6", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs font-mono font-medium text-action mb-3 block", children: step.step }), (0, jsx_runtime_1.jsx)("h3", { className: "text-base font-semibold text-foreground mb-2", children: step.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted leading-relaxed", children: step.description })] }, step.step))) })] }) }));
}
;
exports.default = HowItWorks;
