
/*
|--------------------------------------------------------------
| Features Data
|-------------------------------------------------------------
*/
const FEATURES = [
  {
    title: "X-Ray Analysis Engine",
    description:
      "Upload X-ray images for AI-powered abnormality detection. Identify nodules, masses, and classify severity with OpenAI Vision.",
    details: [
      "Accept URL or base64 images",
      "Detect abnormalities & nodules",
      "Classify severity levels",
      "Identify cancer type indicators",
    ],
  },
  {
    title: "Risk Prediction Engine",
    description:
      "ML-based diagnosis using clinical features, genetic markers, and lifestyle factors for comprehensive risk scoring.",
    details: [
      "Wisconsin dataset classification",
      "Genetic marker analysis (BRCA1/2)",
      "Lifestyle factor assessment",
      "Confidence scoring",
    ],
  },
  {
    title: "Longitudinal Tracking",
    description:
      "Track X-ray results and clinical data over time to detect progression patterns and predict trajectory.",
    details: [
      "Compare scans over years",
      "Detect progression patterns",
      "Predict trajectory trends",
      "5-year & 10-year risk forecasts",
    ],
  },
] as const;


/*
|--------------------------------------------------------------
| Features Component
|-------------------------------------------------------------
*/

function Features() {
  return (
    <section
      id="features"
      className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <p className="text-xs font-medium tracking-widest uppercase text-muted mb-2">
            Capabilities
          </p>
          <h2
            id="features-heading"
            className="text-3xl font-semibold tracking-tight text-foreground"
          >
            Three Prediction Pillars
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border divide-y md:divide-y-0 md:divide-x divide-border">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="p-6">
              <h3 className="text-base font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2" role="list">
                {feature.details.map((detail) => (
                  <li
                    key={detail}
                    className="text-sm text-muted flex items-start gap-2"
                  >
                    <span
                      className="text-action mt-0.5 text-xs"
                      aria-hidden="true"
                    >
                      &#x2022;
                    </span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
