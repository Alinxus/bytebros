"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|--------------------------------------------------------------
| Footer Component
|-------------------------------------------------------------
*/
/*
|--------------------------------------------------------------
| Footer Links Data
|-------------------------------------------------------------
*/
const FOOTER_LINKS = {
    Product: [
        { label: "Features", href: "#features" },
        { label: "API Reference", href: "#api" },
        { label: "Pricing", href: "#pricing" },
        { label: "Documentation", href: "#" },
    ],
    Company: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
    ],
    Legal: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "HIPAA Compliance", href: "#" },
    ],
};
/*
|--------------------------------------------------------------
| Render
|-------------------------------------------------------------
*/
function Footer() {
    return ((0, jsx_runtime_1.jsx)("footer", { className: "border-t border-border", role: "contentinfo", children: (0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-6xl px-6 py-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-base font-semibold text-foreground", children: "BETA" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-muted leading-relaxed", children: "AI-powered cancer prediction platform. Predict, prevent, protect." })] }), Object.entries(FOOTER_LINKS).map(([category, links]) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-4", children: category }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2", role: "list", children: links.map((link) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: link.href, className: "text-sm text-muted hover:text-foreground transition-colors", tabIndex: 0, children: link.label }) }, link.label))) })] }, category)))] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-muted", children: ["\u00A9 ", new Date().getFullYear(), " Mira. All rights reserved."] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted", children: "Built for early cancer detection." })] })] }) }));
}
;
exports.default = Footer;
