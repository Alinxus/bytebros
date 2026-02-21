"use client";
/*
|-------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type SignupFormState = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

const SignupPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<SignupFormState>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (field: keyof SignupFormState, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    const handleSubmit = async (e: FormEvent) => {
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

            router.push("/login");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="border border-border p-8 rounded-lg shadow-lg w-full max-w-md">
            <div className="mb-8">
                <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">
                    Get Started
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Create an Account
                </h1>
                <p className="mt-2 text-sm text-muted">
                    Sign up to access the cancer prediction platform.
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
                        htmlFor="name"
                        className="block text-xs font-medium tracking-widest uppercase text-muted mb-2"
                    >
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Jane Doe"
                        required
                        className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors"
                        autoComplete="name"
                    />
                </div>
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
                        placeholder="you@hospital.org"
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
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            placeholder="Minimum 8 characters"
                            required
                            minLength={8}
                            className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors pr-10"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                            onClick={() => setShowPassword((prev) => !prev)}
                            tabIndex={0}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-xs font-medium tracking-widest uppercase text-muted mb-2"
                    >
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                            placeholder="Re-enter your password"
                            required
                            minLength={8}
                            className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground transition-colors pr-10"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            tabIndex={0}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-sm font-medium text-white bg-action px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Create account"
                >
                    {isLoading ? "Creating Account..." : "Create Account"}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className="text-action hover:underline"
                        tabIndex={0}
                        aria-label="Go to login page"
                    >
                        Log in
                    </a>
                </p>
            </div>
            </div>
        </div>
    );
};

export default SignupPage;
