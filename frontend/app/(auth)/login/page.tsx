"use client";

/*
|-------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

/*
|-------------------------------------------------------------
| Login Types
|--------------------------------------------------------------
*/
type LoginFormState = {
    email: string;
    password: string;
};

/*
|------------------------------------------------------------
| Login Page
|-----------------------------------------------------------
*/
function LoginPage() {
    const router = useRouter();

/*
|----------------------------------------------------------
| States
|------------------------------------------------------------
*/
    const [formData, setFormData] = useState<LoginFormState>({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

/*
|----------------------------------------------------------
| Handlers
|-----------------------------------------------------------
| handleChange: Updates form state and clears errors on input change.
| handleSubmit: Validates input, sends login request, handles response, and manages loading state.
|------------------------------------------------------------
*/
    const handleChange = (field: keyof LoginFormState, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    const handleSubmit = async (e: FormEvent) => {
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

            localStorage.setItem("cavista_token", data.apiKey);
            router.push("/dashboard");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    /*
    |----------------------------------------------------------------
    |Render
    |----------------------------------------------------------------
    */
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="border border-border p-8 rounded-lg shadow-lg w-full max-w-md">
                <div className="mb-8">
                <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">
                    Welcome Back
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Log In
                </h1>
                <p className="mt-2 text-sm text-muted">
                    Access your cancer prediction dashboard.
                </p>
            </div>
            {error && (
                <div
                    className="mb-6 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
                    role="alert"
                >
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-xs font-medium tracking-widest uppercase text-muted mb-2"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="Enter your email address"
                        required
                        className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors"
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="block text-xs font-medium tracking-widest uppercase text-muted mb-2"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors"
                        autoComplete="current-password"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Log in to your account"
                >
                    {isLoading ? "Logging In..." : "Log In"}
                </button>
            </form>
            <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted">
                    Don&apos;t have an account?{" "}
                    <a
                        href="/signup"
                        className="text-action hover:underline"
                        tabIndex={0}
                    >
                        Sign up
                    </a>
                </p>
            </div>
            </div>
        </div>
    );
};

export default LoginPage;
