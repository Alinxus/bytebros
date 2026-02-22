"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const link_1 = __importDefault(require("next/link"));
function DashboardPage() {
    const [recentScans, setRecentScans] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchHistory = async () => {
            const apiKey = localStorage.getItem("cavista_api_key") || "";
            try {
                const res = await fetch("/api/screening/history", {
                    headers: { "x-api-key": apiKey },
                });
                if (res.ok) {
                    const data = await res.json();
                    const scans = [];
                    data.history?.predictions?.forEach((p) => {
                        scans.push({
                            id: p.id || Math.random().toString(),
                            type: "Breast Cancer Prediction",
                            date: p.date || new Date().toISOString(),
                            result: p.result || "Completed",
                            riskLevel: p.riskLevel || "low",
                        });
                    });
                    data.history?.xrayAnalyses?.forEach((x) => {
                        scans.push({
                            id: x.id || Math.random().toString(),
                            type: "X-Ray Analysis",
                            date: x.date || new Date().toISOString(),
                            result: x.result || "Completed",
                            riskLevel: x.riskLevel || "low",
                        });
                    });
                    setRecentScans(scans.slice(0, 5));
                    if (scans.length > 0) {
                        setIsLoading(false);
                        return;
                    }
                }
            }
            catch (err) {
                // History not available
            }
            try {
                const raw = localStorage.getItem("cavista_scan_history");
                if (raw) {
                    const local = JSON.parse(raw);
                    setRecentScans(local.slice(0, 5));
                }
            }
            catch {
                // ignore
            }
            setIsLoading(false);
        };
        fetchHistory();
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-6xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold text-foreground", children: "Welcome Back" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-muted", children: "Manage your health screenings and track your results" })] }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/screening", className: "block mb-8 p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-bold", children: "Start Prevention Journey" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 opacity-90", children: "Get your AI-powered risk assessment and screening" })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 bg-white/20 rounded-full flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "w-6 h-6" }) })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-surface border border-border rounded-xl p-5", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-5 h-5 text-green-600" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-foreground", children: recentScans.length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: "Total Screenings" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-surface border border-border rounded-xl p-5", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "w-5 h-5 text-blue-600" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-foreground", children: recentScans.filter(s => s.riskLevel === "low").length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: "Low Risk Results" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-surface border border-border rounded-xl p-5", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-5 h-5 text-yellow-600" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-foreground", children: "Last 30 days" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: "Last Screening" })] })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold text-foreground", children: "Recent Results" }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/results", className: "text-sm text-action hover:underline flex items-center gap-1", children: ["View All ", (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowRight, { className: "w-4 h-4" })] })] }), isLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "border border-border rounded-xl p-8 text-center", children: (0, jsx_runtime_1.jsx)("p", { className: "text-muted", children: "Loading..." }) })) : recentScans.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "border border-border rounded-xl overflow-hidden", children: recentScans.map((scan, i) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between px-5 py-4 ${i !== recentScans.length - 1 ? "border-b border-border" : ""}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-10 h-10 rounded-lg flex items-center justify-center ${scan.riskLevel === "low" ? "bg-green-100" :
                                                scan.riskLevel === "medium" ? "bg-yellow-100" : "bg-red-100"}`, children: scan.riskLevel === "low" ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-5 h-5 text-green-600" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-5 h-5 text-yellow-600" })) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium text-foreground", children: scan.type }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: new Date(scan.date).toLocaleDateString() })] })] }), (0, jsx_runtime_1.jsx)("div", { className: `px-3 py-1 rounded-full text-xs font-medium ${scan.riskLevel === "low" ? "bg-green-100 text-green-700" :
                                        scan.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`, children: scan.riskLevel === "low" ? "Low Risk" :
                                        scan.riskLevel === "medium" ? "Medium" : "High Risk" })] }, scan.id))) })) : ((0, jsx_runtime_1.jsxs)("div", { className: "border border-border rounded-xl p-12 text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-12 h-12 mx-auto text-muted mb-4" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-medium text-foreground", children: "No screenings yet" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted mt-1 mb-4", children: "Start your first screening to see results here" }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/screening", className: "inline-flex items-center gap-2 px-4 py-2 bg-action text-white rounded-lg hover:opacity-90", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "w-4 h-4" }), "Start Screening"] })] }))] })] }));
}
exports.default = DashboardPage;
