"use client";
/*
|--------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
import { useState } from "react";

/*
|--------------------------------------------------------------
| Nav Links
|-------------------------------------------------------------
*/
const NAV_LINKS = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
] as const;

/*
|--------------------------------------------------------------
| Navbar Component
|-------------------------------------------------------------
*/
function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleToggleMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggleMenu();
        }
    };

    return (
        <nav
            className="sticky top-0 z-50 bg-background border-b border-border"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
                
                <a href="/" className="text-xl font-bold text-foreground">
                  MIRA
                </a>

                
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm text-muted hover:text-foreground transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    <a
                        href="/signup"
                        className="text-sm font-medium text-white bg-action px-4 py-2 hover:opacity-90 transition-opacity"
                    >
                        Get Started
                    </a>
                </div>

          
                <div
                    className="md:hidden cursor-pointer p-2"
                    onClick={handleToggleMenu}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-label="Toggle mobile menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <div className="w-5 h-px bg-foreground mb-1.5" />
                    <div className="w-5 h-px bg-foreground mb-1.5" />
                    <div className="w-5 h-px bg-foreground" />
                </div>
            </div>

     
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border px-6 py-4 bg-background">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="block py-2 text-sm text-muted hover:text-foreground transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    <a
                        href="/signup"
                        className="block mt-2 text-sm font-medium text-white bg-action px-4 py-2 text-center hover:opacity-90 transition-opacity"
                    >
                        Get Started
                    </a>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
