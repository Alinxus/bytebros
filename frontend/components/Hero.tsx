/**
|--------------------------------------------------------------
| Hero Component
|-------------------------------------------------------------
*/


/*
|--------------------------------------------------------------
| Stats Data
|-------------------------------------------------------------
*/
const STATS = [
  { value: "5-Year", label: "Risk Predictions" },
  { value: "AI", label: "X-Ray Analysis" },
  { value: "ML", label: "Predictive Models" },
] as const;


/*
|--------------------------------------------------------------
| Render
|-------------------------------------------------------------
*/
function Hero() {
  return (
    <section className="border-b border-border" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <h1
          id="hero-heading"
          className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground max-w-3xl"
        >
          Predict Cancer
          <br />
          Before It Happens
        </h1>
        <p className="mt-6 text-lg text-muted max-w-2xl leading-relaxed">
          AI-powered 5-year risk predictions using X-ray longitudinal analysis,
          genetic markers, lifestyle factors, and family history. Not just
          detection — prevention.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="/signup"
            className="text-sm font-medium text-white bg-action px-6 py-3 hover:opacity-90 transition-opacity"
            tabIndex={0}
            aria-label="Get started with Cavista"
          >
            Get Started
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border divide-y sm:divide-y-0 sm:divide-x divide-border">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-6 py-5 text-center">
              <p className="text-2xl font-semibold text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
