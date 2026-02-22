"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|--------------------------------------------------------------
| Features Data
|--------------------------------------------------------------
*/
const FEATURES = [
    {
        title: "Know Your Risk",
        description: "Understand your personal cancer risk before it becomes a problem. We analyze family history, genetics, and lifestyle to identify your risk factors early.",
        details: [
            "Family health history analysis",
            "Genetic marker screening (BRCA, etc.)",
            "Lifestyle risk factors",
            "Personalized prevention plan",
        ],
    },
    {
        title: "Early Detection",
        description: "Our AI analyzes your X-rays and mammograms to detect abnormalities years before they become serious. Early detection = easier treatment.",
        details: [
            "Chest X-ray analysis",
            "Mammogram screening",
            "Pattern recognition AI",
            "Second opinion verification",
        ],
    },
    {
        title: "Prevention Tracking",
        description: "Monitor your health over time. Track changes, see how lifestyle changes affect your risk, and catch problems before they develop.",
        details: [
            "Longitudinal comparison",
            "Risk trend analysis",
            "Progress tracking",
            "Actionable insights",
        ],
    },
];
/*
|--------------------------------------------------------------
| Features Component
|--------------------------------------------------------------
*/
function Features() {
    return ((0, jsx_runtime_1.jsx)("section", { id: "features", className: "border-b border-border", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-6xl px-6 py-20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-12 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-action mb-2", children: "Our Approach" }), (0, jsx_runtime_1.jsx)("h2", { id: "features-heading", className: "text-3xl md:text-4xl font-bold tracking-tight text-foreground", children: "From Detection to Prevention" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-muted max-w-2xl mx-auto", children: "We don't just find cancer \u2014 we help you prevent it. Our AI-powered platform identifies risks early so you can take action before cancer develops." })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: FEATURES.map((feature) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-8 bg-surface border border-border rounded-xl hover:border-action/50 transition-colors", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4", children: (0, jsx_runtime_1.jsx)("svg", { className: "w-6 h-6 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }) }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-semibold text-foreground mb-3", children: feature.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted leading-relaxed mb-4", children: feature.description }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", role: "list", children: feature.details.map((detail) => ((0, jsx_runtime_1.jsxs)("li", { className: "text-sm text-muted flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("svg", { className: "w-4 h-4 text-green-500 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }), detail] }, detail))) })] }, feature.title))) })] }) }));
}
;
exports.default = Features;
