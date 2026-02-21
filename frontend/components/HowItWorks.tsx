/*
|--------------------------------------------------------------
| How It Works Component 
*/


/*
|--------------------------------------------------------------
| Steps Data
|-------------------------------------------------------------
*/
const STEPS = [
    {
        step: "01",
        title: "Upload Data",
        description:
            "Submit X-ray images, clinical features, genetic markers, and lifestyle factors through the platform.",
    },
    {
        step: "02",
        title: "AI Analysis",
        description:
            "Our ML models and OpenAI Vision process your data — analyzing abnormalities, calculating risk scores, and tracking longitudinal trends.",
    },
    {
        step: "03",
        title: "Get Prediction",
        description:
            "Receive a comprehensive risk assessment with 5-year, 10-year, and lifetime predictions plus actionable recommendations.",
    },
] as const;

function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="border-b border-border">
            <div className="mx-auto max-w-6xl px-6 py-20">
                <div className="mb-12">
                    <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">
                        Process
                    </p>
                    <h2
                        id="how-it-works-heading"
                        className="text-3xl font-semibold tracking-tight text-foreground"
                    >
                        How It Works
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border divide-y md:divide-y-0 md:divide-x divide-border">
                    {STEPS.map((step) => (
                        <div key={step.step} className="p-6">
                            <span className="text-xs font-mono font-medium text-action mb-3 block">
                                {step.step}
                            </span>
                            <h3 className="text-base font-semibold text-foreground mb-2">
                                {step.title}
                            </h3>
                            <p className="text-sm text-muted leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
