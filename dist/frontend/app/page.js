"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*--------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
const react_1 = __importDefault(require("react"));
/*
|-------------------------------------------------------------
| Custom Imports
|-------------------------------------------------------------
*/
const Navbar_1 = __importDefault(require("@/components/Navbar"));
const Hero_1 = __importDefault(require("@/components/Hero"));
const Features_1 = __importDefault(require("@/components/Features"));
const HowItWorks_1 = __importDefault(require("@/components/HowItWorks"));
const Footer_1 = __importDefault(require("@/components/Footer"));
/*
|--------------------------------------------------------------
| Home Page
|-------------------------------------------------------------
*/
function Home() {
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Navbar_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { children: [(0, jsx_runtime_1.jsx)(Hero_1.default, {}), (0, jsx_runtime_1.jsx)(Features_1.default, {}), (0, jsx_runtime_1.jsx)(HowItWorks_1.default, {})] }), (0, jsx_runtime_1.jsx)(Footer_1.default, {})] }));
}
exports.default = Home;
