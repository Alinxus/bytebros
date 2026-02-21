"use client";
/*
|-------------------------------------------------------------
| Npm Imports
|-------------------------------------------------------------
*/
import { useState, useEffect } from "react";
import { ScanHeart, Scan, HeartPulse, History, ShieldCheck, Flag } from "lucide-react";

/*
|-------------------------------------------------------------
| Types
|-------------------------------------------------------------
*/
type HistoryItem = {
  date: string;
  type: string;
  result: string;
};

/*
|-------------------------------------------------------------
| Quick Actions & Service Status Data
|-------------------------------------------------------------
*/
const QUICK_ACTIONS = [
  {
    title: "Chest X-Ray",
    description: "AI-powered DenseNet121 lung analysis",
    href: "/chest-xray",
    icon: ScanHeart,
  },
  {
    title: "Mammography",
    description: "Image-based breast analysis",
    href: "/mammography",
    icon: Scan,
  },
  {
    title: "Breast Cancer",
    description: "Random Forest feature prediction",
    href: "/breast-cancer",
    icon: HeartPulse,
  },
  {
    title: "Longitudinal",
    description: "Track screening changes over time",
    href: "/longitudinal",
    icon: History,
  },
  {
    title: "Risk Assessment",
    description: "Genetics, lifestyle, and imaging analysis",
    href: "/risk-assessment",
    icon: ShieldCheck,
  },
  {
    title: "Triage",
    description: "Symptom-based pre-screening",
    href: "/triage",
    icon: Flag,
  },
] as const;


const DashboardPage = () => {
  const [history, setHistory] = useState<{
    predictions: HistoryItem[];
    xrayAnalyses: HistoryItem[];
  } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const apiKey = localStorage.getItem("cavista_api_key") || "";

      try {
        const res = await fetch("/api/screening/history", {
          headers: { "x-api-key": apiKey },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history);
        }
      } catch {
        // History not available
      }

      setIsLoadingHistory(false);
    };

    fetchHistory();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Early cancer detection through AI-powered screening tools.
        </p>
      </div>

      {/* ML Services Status */}
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-muted mb-3">
          ML Services
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <p className="text-xs font-medium tracking-widest uppercase text-muted mb-3">
          Screening Tools
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="p-5 bg-background hover:bg-surface transition-colors group"
              tabIndex={0}
              aria-label={action.title}
            >
              <span className="text-xl mb-2 block" aria-hidden="true">
                {action.icon && <action.icon size={24} />}
              </span>
              <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-action transition-colors">
                {action.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {action.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Patient History */}
      <div>
        <p className="text-xs font-medium tracking-widest uppercase text-muted mb-3">
          Recent History
        </p>
        {isLoadingHistory ? (
          <div className="border border-border p-6 text-center">
            <p className="text-sm text-muted">Loading history...</p>
          </div>
        ) : history &&
          (history.predictions?.length > 0 ||
            history.xrayAnalyses?.length > 0) ? (
          <div className="border border-border divide-y divide-border">
            {history.predictions?.slice(0, 5).map((item, i) => (
              <div
                key={`pred-${i}`}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-foreground">Prediction</span>
                <span className="text-xs text-muted">{item.result}</span>
              </div>
            ))}
            {history.xrayAnalyses?.slice(0, 5).map((item, i) => (
              <div
                key={`xray-${i}`}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-foreground">X-Ray Analysis</span>
                <span className="text-xs text-muted">{item.result}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border p-6 text-center">
            <p className="text-sm text-muted">
              No screening history yet. Run your first screening above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
