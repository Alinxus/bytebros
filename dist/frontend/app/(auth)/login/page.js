"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("hono/jsx/jsx-runtime");
/*
|-------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const navigation_1 = require("next/navigation");
/*
|------------------------------------------------------------
| Login Page
|-----------------------------------------------------------
*/
function LoginPage() {
    const router = (0, navigation_1.useRouter)();
    /*
    |----------------------------------------------------------
    | States
    |------------------------------------------------------------
    */
    const [formData, setFormData] = (0, react_1.useState)({
        email: "",
        password: "",
    });
    const [error, setError] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    /*
    |----------------------------------------------------------
    | Handlers
    |-----------------------------------------------------------
    | handleChange: Updates form state and clears errors on input change.
    | handleSubmit: Validates input, sends login request, handles response, and manages loading state.
    |------------------------------------------------------------
    */
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.email || !formData.password) {
            setError("Email and password are required.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Invalid credentials.");
                return;
            }
            localStorage.setItem("cavista_api_key", data.apiKey);
            router.push("/dashboard");
        }
        catch {
            setError("Network error. Please try again.");
        }
        finally {
            setIsLoading(false);
        }
    };
    /*
    |----------------------------------------------------------------
    |Render
    |----------------------------------------------------------------
    */
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center min-h-screen bg-background", children: (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-8 rounded-lg shadow-lg w-full max-w-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Welcome Back" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold tracking-tight text-foreground", children: "Log In" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-muted", children: "Access your cancer prediction dashboard." })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger", role: "alert", children: error })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", className: "block text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Email" }), (0, jsx_runtime_1.jsx)("input", { id: "email", type: "email", value: formData.email, onChange: (e) => handleChange("email", e.target.value), placeholder: "Enter your email address", required: true, className: "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors", autoComplete: "email" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "password", className: "block text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { id: "password", type: showPassword ? "text" : "password", value: formData.password, onChange: (e) => handleChange("password", e.target.value), placeholder: "Enter your password", required: true, className: "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors pr-10", autoComplete: "current-password" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted", onClick: () => setShowPassword((prev) => !prev), tabIndex: 0, "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 20 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 20 }) })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Log in to your account", children: isLoading ? "Logging In..." : "Log In" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 pt-6 border-t border-border text-center", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-muted", children: ["Don't have an account?", " ", (0, jsx_runtime_1.jsx)("a", { href: "/signup", className: "text-action hover:underline", tabIndex: 0, children: "Sign up" })] }) })] }) }));
}
;
exports.default = LoginPage;
