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
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const SignupPage = () => {
    const router = (0, navigation_1.useRouter)();
    const [formData, setFormData] = (0, react_1.useState)({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [showConfirmPassword, setShowConfirmPassword] = (0, react_1.useState)(false);
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!formData.name || !formData.email || !formData.password) {
            setError("All fields are required.");
            return;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Something went wrong.");
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
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center min-h-screen bg-background", children: (0, jsx_runtime_1.jsxs)("div", { className: "border border-border p-8 rounded-lg shadow-lg w-full max-w-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Get Started" }), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold tracking-tight text-foreground", children: "Create an Account" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-muted", children: "Sign up to access the cancer prediction platform." })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger", role: "alert", children: error })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-5", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "name", className: "block text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Name" }), (0, jsx_runtime_1.jsx)("input", { id: "name", type: "text", value: formData.name, onChange: (e) => handleChange("name", e.target.value), placeholder: "Jane Doe", required: true, className: "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors", autoComplete: "name" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", className: "block text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Email" }), (0, jsx_runtime_1.jsx)("input", { id: "email", type: "email", value: formData.email, onChange: (e) => handleChange("email", e.target.value), placeholder: "you@hospital.org", required: true, className: "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors", autoComplete: "email" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "password", className: "block text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { id: "password", type: showPassword ? "text" : "password", value: formData.password, onChange: (e) => handleChange("password", e.target.value), placeholder: "Minimum 8 characters", required: true, minLength: 8, className: "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors pr-10", autoComplete: "new-password" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted", onClick: () => setShowPassword((prev) => !prev), tabIndex: 0, "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 20 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 20 }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "confirmPassword", className: "block text-xs font-medium tracking-widest uppercase text-muted mb-2", children: "Confirm Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { id: "confirmPassword", type: showConfirmPassword ? "text" : "password", value: formData.confirmPassword, onChange: (e) => handleChange("confirmPassword", e.target.value), placeholder: "Re-enter your password", required: true, minLength: 8, className: "w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors pr-10", autoComplete: "new-password" }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted", onClick: () => setShowConfirmPassword((prev) => !prev), tabIndex: 0, "aria-label": showConfirmPassword ? "Hide password" : "Show password", children: showConfirmPassword ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 20 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 20 }) })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": "Create account", children: isLoading ? "Creating Account..." : "Create Account" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 pt-6 border-t border-border text-center", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-muted", children: ["Already have an account?", " ", (0, jsx_runtime_1.jsx)("a", { href: "/login", className: "text-action hover:underline", tabIndex: 0, "aria-label": "Go to login page", children: "Log in" })] }) })] }) }));
};
exports.default = SignupPage;
