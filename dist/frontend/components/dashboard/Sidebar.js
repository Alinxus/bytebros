"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|--------------------------------------------------------------
| Npm Import
|-------------------------------------------------------------
*/
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
/*
|--------------------------------------------------------------
| Nav Sections
|-------------------------------------------------------------
*/
const NAV_SECTIONS = [
    {
        label: "Main",
        items: [
            { label: "Overview", href: "/dashboard", icon: lucide_react_1.LayoutDashboard },
        ],
    },
    {
        label: "Prevention",
        items: [
            { label: "New Screening", href: "/screening", icon: lucide_react_1.Plus },
            { label: "Prevention Timeline", href: "/longitudinal", icon: lucide_react_1.Activity },
            { label: "Results History", href: "/results", icon: lucide_react_1.FileText },
            { label: "Report Analysis", href: "/report-analysis", icon: lucide_react_1.ClipboardList },
        ],
    },
    {
        label: "Assessment",
        items: [
            { label: "Risk Profile", href: "/risk-assessment", icon: lucide_react_1.ShieldCheck },
        ],
    },
];
/*
|--------------------------------------------------------------
| Sidebar Component
|-------------------------------------------------------------
*/
const Sidebar = () => {
    const pathname = (0, navigation_1.usePathname)();
    return ((0, jsx_runtime_1.jsxs)("aside", { className: "w-64 border-r border-border bg-background flex flex-col h-screen sticky top-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-6 py-5 border-b border-border", children: [(0, jsx_runtime_1.jsx)("a", { href: "/", className: "text-lg font-semibold tracking-tight text-foreground", tabIndex: 0, children: "MIRA" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mt-1", children: "Early Detection AI" })] }), (0, jsx_runtime_1.jsx)("nav", { className: "flex-1 px-3 py-4 overflow-y-auto", "aria-label": "Dashboard navigation", children: NAV_SECTIONS.map((section) => ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "px-3 mb-1.5 text-[10px] font-medium tracking-widest uppercase text-muted/60", children: section.label }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-0.5", role: "list", children: section.items.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsxs)("a", { href: item.href, className: `flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${isActive
                                            ? "bg-action/10 text-action font-medium"
                                            : "text-muted hover:text-foreground hover:bg-surface"}`, tabIndex: 0, "aria-label": item.label, "aria-current": isActive ? "page" : undefined, children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm", "aria-hidden": "true", children: (0, jsx_runtime_1.jsx)(Icon, { size: 18 }) }), item.label] }) }, item.href));
                            }) })] }, section.label))) }), (0, jsx_runtime_1.jsx)("div", { className: "px-6 py-4 border-t border-border", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-action/5 rounded-lg p-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium text-action", children: "Need Help?" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-muted mt-1", children: "Contact your healthcare provider for medical advice." })] }) })] }));
};
exports.default = Sidebar;
