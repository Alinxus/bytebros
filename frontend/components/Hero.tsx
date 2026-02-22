/**
 |--------------------------------------------------------------
 | Hero Component
 |--------------------------------------------------------------
 */


/*
 |--------------------------------------------------------------
 | Stats Data
 |--------------------------------------------------------------
 */
const STATS = [
  { value: "92%", label: "Early Detection Rate" },
  { value: "5-Year", label: "Survival Rate" },
  { value: "Prevention", label: "Our Focus" },
] as const;


/*
 |--------------------------------------------------------------
 | Render
 |--------------------------------------------------------------
 */
function Hero() {
  return (
    <section className="border-b border-border" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full mb-6">
              <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
              Prevention Through Early Detection
            </div>
            <h1
              id="hero-heading"
              className="text-4xl md:text-5xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground"
            >
              Catch Cancer <br />
              <span className="text-action">Before It Starts</span>
            </h1>
            <p className="mt-6 text-lg text-muted leading-relaxed">
              The best way to beat cancer is to never let it develop. Our AI analyzes 
              your health data, imaging, and risk factors to help you take action <strong>before</strong> cancer appears.
            </p>
            <p className="mt-4 text-sm text-muted">
              Trusted by patients who chose prevention. This is not about finding cancer — 
              it's about making sure you never have to fight it.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/signup"
                className="text-sm font-medium text-white bg-action px-8 py-4 hover:opacity-90 transition-opacity rounded-lg"
                tabIndex={0}
                aria-label="Start your prevention journey"
              >
                Start Prevention Journey
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-foreground border border-border px-8 py-4 hover:bg-surface transition-colors rounded-lg"
                tabIndex={0}
              >
                How It Works
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-action" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Early detection saves lives
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-action" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                Prevention {'>'} Treatment
              </span>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl blur-2xl"></div>
              <div className="relative bg-surface border border-border rounded-xl p-6 shadow-xl">
                <div className="text-xs text-muted mb-4 uppercase tracking-wider">Prevention Journey</div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <div className="font-medium text-foreground">Risk Assessment</div>
                      <div className="text-xs text-muted">Know your risk factors</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <div className="font-medium text-foreground">AI Screening</div>
                      <div className="text-xs text-muted">Detect abnormalities early</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <div className="font-medium text-foreground">Prevention Plan</div>
                      <div className="text-xs text-muted">Take action before cancer</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border divide-y sm:divide-y-0 sm:divide-x divide-border">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-6 py-5 text-center">
              <p className="text-3xl font-bold text-action">
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
