"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
const google_1 = require("next/font/google");
require("./globals.css");
const inter = (0, google_1.Inter)({
    variable: "--font-inter",
    subsets: ["latin"],
});
exports.metadata = {
    title: "Mira - Prevention Through Early Detection",
    description: "AI-powered cancer prevention platform. Catch cancer before it starts through early detection and risk assessment.",
};
function RootLayout({ children, }) {
    return ((0, jsx_runtime_1.jsx)("html", { lang: "en", children: (0, jsx_runtime_1.jsx)("body", { className: `${inter.variable} font-sans antialiased`, children: children }) }));
}
