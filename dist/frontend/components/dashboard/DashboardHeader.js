"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|-------------------------------------------------------------
| Npm Import
|-------------------------------------------------------------
*/
const navigation_1 = require("next/navigation");
/*
|-------------------------------------------------------------
| Dashboard Header Component
|-------------------------------------------------------------
*/
function DashboardHeader() {
    const router = (0, navigation_1.useRouter)();
    /*
    |-------------------------------------------------------------
    | Handlers
    |-------------------------------------------------------------
    | hndleLogout: Clears auth token and redirects to login page.
    | handleKeyDown: Allows logout via Enter or Space key for accessibility.
    |-------------------------------------------------------------
    */
    const handleLogout = () => {
        localStorage.removeItem("cavista_api_key");
        router.push("/login");
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleLogout();
        }
    };
    /*
    |-------------------------------------------------------------
    | Render
    |-------------------------------------------------------------
    */
    return ((0, jsx_runtime_1.jsx)("header", { className: "sticky top-0 z-40 bg-background border-b border-border", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between px-6 py-4", children: [(0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted", children: "BETA" }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-4", children: (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-muted hover:text-foreground transition-colors cursor-pointer", onClick: handleLogout, onKeyDown: handleKeyDown, tabIndex: 0, role: "button", children: "Log Out" }) })] }) }));
}
;
exports.default = DashboardHeader;
