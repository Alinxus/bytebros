"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const Sidebar_1 = __importDefault(require("@/components/dashboard/Sidebar"));
const DashboardHeader_1 = __importDefault(require("@/components/dashboard/DashboardHeader"));
const DashboardLayout = ({ children, }) => {
    const router = (0, navigation_1.useRouter)();
    const [isAuthed, setIsAuthed] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const token = localStorage.getItem("cavista_api_key");
        if (!token) {
            router.push("/login");
            return;
        }
        setIsAuthed(true);
    }, [router]);
    if (!isAuthed) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-background flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-muted", children: "Loading..." }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-screen bg-background", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.default, {}), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col", children: [(0, jsx_runtime_1.jsx)(DashboardHeader_1.default, {}), (0, jsx_runtime_1.jsx)("main", { className: "flex-1 px-6 py-6", children: children })] })] }));
};
exports.default = DashboardLayout;
