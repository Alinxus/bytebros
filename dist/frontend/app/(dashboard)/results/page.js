"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function ResultsPage() {
    const [results, setResults] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [filter, setFilter] = (0, react_1.useState)("all");
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
                    scans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setResults(scans);
                    setIsLoading(false);
                    return;
                }
            }
            catch {
                // History not available
            }
            try {
                const raw = localStorage.getItem("cavista_scan_history");
                if (raw) {
                    const local = JSON.parse(raw);
                    setResults(local);
                }
            }
            catch {
                // ignore
            }
            setIsLoading(false);
        };
        fetchHistory();
    }, []);
    const filteredResults = filter === "all"
        ? results
        : results.filter(r => r.riskLevel === filter);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-6xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold text-foreground", children: "Results History" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-muted", children: "View all your past screening results" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-3 mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-sm text-muted", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Filter, { className: "w-4 h-4" }), "Filter:"] }), ["all", "low", "medium", "high"].map((f) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setFilter(f), className: `px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === f
                            ? f === "all" ? "bg-action text-white" :
                                f === "low" ? "bg-green-100 text-green-700" :
                                    f === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                            : "bg-surface text-muted hover:text-foreground"}`, children: f === "all" ? "All" : f === "low" ? "Low Risk" : f === "medium" ? "Medium" : "High Risk" }, f)))] }), isLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "border border-border rounded-xl p-8 text-center", children: (0, jsx_runtime_1.jsx)("p", { className: "text-muted", children: "Loading results..." }) })) : filteredResults.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: filteredResults.map((scan) => ((0, jsx_runtime_1.jsx)("div", { className: "bg-surface border border-border rounded-xl p-5", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center ${scan.riskLevel === "low" ? "bg-green-100" :
                                            scan.riskLevel === "medium" ? "bg-yellow-100" : "bg-red-100"}`, children: scan.riskLevel === "low" ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-6 h-6 text-green-600" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-6 h-6 text-yellow-600" })) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-foreground", children: scan.type }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted mt-1", children: new Date(scan.date).toLocaleDateString("en-US", {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }) }), scan.details && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted mt-2", children: scan.details }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-end gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `px-3 py-1 rounded-full text-sm font-medium ${scan.riskLevel === "low" ? "bg-green-100 text-green-700" :
                                            scan.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`, children: scan.riskLevel === "low" ? "Low Risk" :
                                            scan.riskLevel === "medium" ? "Medium Risk" : "High Risk" }), (0, jsx_runtime_1.jsxs)("button", { className: "text-sm text-action hover:underline flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { className: "w-4 h-4" }), "PDF"] })] })] }) }, scan.id))) })) : ((0, jsx_runtime_1.jsxs)("div", { className: "border border-border rounded-xl p-12 text-center", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-16 h-16 mx-auto text-muted mb-4" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-medium text-foreground", children: "No results found" }), (0, jsx_runtime_1.jsx)("p", { className: "text-muted mt-1", children: filter === "all"
                            ? "You haven't completed any screenings yet"
                            : `No ${filter} risk results found` })] })), results.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-8 grid grid-cols-1 md:grid-cols-4 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-surface border border-border rounded-xl p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-foreground", children: results.length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: "Total Screenings" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-green-50 border border-green-200 rounded-xl p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-green-700", children: results.filter(r => r.riskLevel === "low").length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-green-600", children: "Low Risk" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-yellow-700", children: results.filter(r => r.riskLevel === "medium").length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-yellow-600", children: "Medium Risk" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-xl p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-red-700", children: results.filter(r => r.riskLevel === "high").length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600", children: "High Risk" })] })] }))] }));
}
exports.default = ResultsPage;
