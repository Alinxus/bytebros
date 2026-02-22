"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|--------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
const react_1 = require("react");
/*
|--------------------------------------------------------------
| Nav Links
|-------------------------------------------------------------
*/
const NAV_LINKS = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
];
/*
|--------------------------------------------------------------
| Navbar Component
|-------------------------------------------------------------
*/
function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = (0, react_1.useState)(false);
    const handleToggleMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggleMenu();
        }
    };
    return ((0, jsx_runtime_1.jsxs)("nav", { className: "sticky top-0 z-50 bg-background border-b border-border", role: "navigation", "aria-label": "Main navigation", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mx-auto max-w-6xl px-6 py-4 flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("a", { href: "/", className: "text-xl font-bold text-foreground", children: "MIRA" }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden md:flex items-center gap-8", children: [NAV_LINKS.map((link) => ((0, jsx_runtime_1.jsx)("a", { href: link.href, className: "text-sm text-muted hover:text-foreground transition-colors", children: link.label }, link.href))), (0, jsx_runtime_1.jsx)("a", { href: "/signup", className: "text-sm font-medium text-white bg-action px-4 py-2 hover:opacity-90 transition-opacity", children: "Get Started" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "md:hidden cursor-pointer p-2", onClick: handleToggleMenu, onKeyDown: handleKeyDown, tabIndex: 0, role: "button", "aria-label": "Toggle mobile menu", "aria-expanded": isMobileMenuOpen, children: [(0, jsx_runtime_1.jsx)("div", { className: "w-5 h-px bg-foreground mb-1.5" }), (0, jsx_runtime_1.jsx)("div", { className: "w-5 h-px bg-foreground mb-1.5" }), (0, jsx_runtime_1.jsx)("div", { className: "w-5 h-px bg-foreground" })] })] }), isMobileMenuOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "md:hidden border-t border-border px-6 py-4 bg-background", children: [NAV_LINKS.map((link) => ((0, jsx_runtime_1.jsx)("a", { href: link.href, className: "block py-2 text-sm text-muted hover:text-foreground transition-colors", children: link.label }, link.href))), (0, jsx_runtime_1.jsx)("a", { href: "/signup", className: "block mt-2 text-sm font-medium text-white bg-action px-4 py-2 text-center hover:opacity-90 transition-opacity", children: "Get Started" })] }))] }));
}
;
exports.default = Navbar;
