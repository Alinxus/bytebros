/*
|--------------------------------------------------------------
| Footer Component
|-------------------------------------------------------------
*/

/*
|--------------------------------------------------------------
| Footer Links Data
|-------------------------------------------------------------
*/
const FOOTER_LINKS = {
    Product: [
        { label: "Features", href: "#features" },
        { label: "API Reference", href: "#api" },
        { label: "Pricing", href: "#pricing" },
        { label: "Documentation", href: "#" },
    ],
    Company: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
    ],
    Legal: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "HIPAA Compliance", href: "#" },
    ],
} as const;

/*
|--------------------------------------------------------------
| Render
|-------------------------------------------------------------
*/
function Footer() {
    return (
        <footer className="border-t border-border" role="contentinfo">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <p className="text-base font-semibold text-foreground">BETA</p>
                        <p className="mt-2 text-sm text-muted leading-relaxed">
                            AI-powered cancer prediction platform. Predict, prevent, protect.
                        </p>
                    </div>
                    {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                        <div key={category}>
                            <p className="text-xs font-medium tracking-widest uppercase text-muted mb-4">
                                {category}
                            </p>
                            <ul className="space-y-2" role="list">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-muted hover:text-foreground transition-colors"
                                            tabIndex={0}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted">
                        &copy; {new Date().getFullYear()} Mira. All rights reserved.
                    </p>
                    <p className="text-xs text-muted">
                        Built for early cancer detection.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
