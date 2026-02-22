"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, Activity, Calendar, AlertTriangle, CheckCircle, Share2, Download } from "lucide-react";

type ScanEntry = {
  id: string;
  date: string;
  type: string;
  result: string;
  riskScore: number;
  findings?: string;
};

type LongitudinalAnalysis = {
  trend: "improving" | "stable" | "concerning";
  changePercent: number;
  totalScans: number;
  firstScan: { date: string; riskScore: number };
  latestScan: { date: string; riskScore: number };
  changes: string[];
  recommendation: string;
  trajectory: string;
};

type ProjectionPoint = {
  date: string;
  riskScore: number;
  low: number;
  high: number;
};

function LongitudinalPage() {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<LongitudinalAnalysis | null>(null);
  const [error, setError] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  const buildProjection = (sortedScans: ScanEntry[], months = 12): ProjectionPoint[] => {
    if (sortedScans.length < 2) return [];
    const firstDate = new Date(sortedScans[0].date);
    const toDays = (d: Date) => Math.floor((d.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const xs = sortedScans.map(s => toDays(new Date(s.date)));
    const ys = sortedScans.map(s => s.riskScore);

    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

    const denom = n * sumX2 - sumX * sumX;
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY / n) - slope * (sumX / n);

    let errorSum = 0;
    for (let i = 0; i < n; i++) {
      const predicted = slope * xs[i] + intercept;
      errorSum += Math.pow(ys[i] - predicted, 2);
    }
    const std = Math.sqrt(errorSum / n);
    const band = Math.max(6, std * 1.5);

    const lastDate = new Date(sortedScans[sortedScans.length - 1].date);
    const projection: ProjectionPoint[] = [];
    for (let i = 1; i <= months; i++) {
      const next = new Date(lastDate);
      next.setMonth(next.getMonth() + i);
      const x = toDays(next);
      const y = Math.min(100, Math.max(0, slope * x + intercept));
      const low = Math.min(100, Math.max(0, y - band));
      const high = Math.min(100, Math.max(0, y + band));
      projection.push({
        date: next.toISOString().split("T")[0],
        riskScore: Math.round(y),
        low: Math.round(low),
        high: Math.round(high),
      });
    }

    return projection;
  };

  // Load saved scans from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cavista_longitudinal_scans");
    if (saved) {
      try {
        setScans(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save scans to localStorage
  useEffect(() => {
    if (scans.length > 0) {
      localStorage.setItem("cavista_longitudinal_scans", JSON.stringify(scans));
    }
  }, [scans]);

  const handleAddScan = () => {
    const newScan: ScanEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split("T")[0],
      type: "Chest X-Ray",
      result: "Normal",
      riskScore: 20,
      findings: "",
    };
    setScans([...scans, newScan]);
  };

  const handleRemoveScan = (id: string) => {
    setScans(scans.filter((s) => s.id !== id));
  };

  const handleScanChange = (id: string, field: keyof ScanEntry, value: string | number) => {
    setScans(scans.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleAnalyze = async () => {
    if (scans.length < 2) {
      setError("Add at least 2 scans to analyze trends");
      return;
    }

    setIsLoading(true);
    setError("");

    const apiKey = localStorage.getItem("cavista_api_key") || "";

    try {
      const sortedScans = [...scans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const res = await fetch("/api/screening/longitudinal-track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          previousScans: sortedScans.map((s) => ({
            date: s.date,
            result: s.result === "Normal" ? "benign" : "malignant",
            riskLevel: s.riskScore < 30 ? "low" : s.riskScore < 60 ? "medium" : "high",
            confidence: 1 - s.riskScore / 100,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Use local analysis if API fails
        const localAnalysis = generateLocalAnalysis(sortedScans);
        setAnalysis(localAnalysis);
      } else {
        setAnalysis({
          trend: data.longitudinalAnalysis?.trend || "stable",
          changePercent: calculateChange(sortedScans),
          totalScans: sortedScans.length,
          firstScan: { date: sortedScans[0].date, riskScore: sortedScans[0].riskScore },
          latestScan: { date: sortedScans[sortedScans.length - 1].date, riskScore: sortedScans[sortedScans.length - 1].riskScore },
          changes: data.longitudinalAnalysis?.changes || [],
          recommendation: data.longitudinalAnalysis?.recommendation || "Continue regular monitoring",
          trajectory: data.longitudinalAnalysis?.trend || "stable",
        });
      }
    } catch {
      const localAnalysis = generateLocalAnalysis(scans);
      setAnalysis(localAnalysis);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalAnalysis = (sortedScans: ScanEntry[]): LongitudinalAnalysis => {
    const first = sortedScans[0].riskScore;
    const last = sortedScans[sortedScans.length - 1].riskScore;
    const change = ((last - first) / first) * 100;

    let trend: "improving" | "stable" | "concerning" = "stable";
    if (change < -10) trend = "improving";
    else if (change > 10) trend = "concerning";

    const changes: string[] = [];
    for (let i = 1; i < sortedScans.length; i++) {
      const diff = sortedScans[i].riskScore - sortedScans[i - 1].riskScore;
      if (diff > 15) changes.push(`Risk increased by ${diff.toFixed(0)}% between ${sortedScans[i - 1].date} and ${sortedScans[i].date}`);
      else if (diff < -15) changes.push(`Risk decreased by ${Math.abs(diff).toFixed(0)}% between ${sortedScans[i - 1].date} and ${sortedScans[i].date}`);
    }

    return {
      trend,
      changePercent: change,
      totalScans: sortedScans.length,
      firstScan: { date: sortedScans[0].date, riskScore: first },
      latestScan: { date: sortedScans[sortedScans.length - 1].date, riskScore: last },
      changes,
      recommendation: trend === "concerning" 
        ? "Schedule immediate follow-up with your healthcare provider" 
        : trend === "improving"
        ? "Great progress! Continue current prevention measures"
        : "Maintain regular screening schedule",
      trajectory: trend,
    };
  };

  const calculateChange = (sortedScans: ScanEntry[]) => {
    if (sortedScans.length < 2) return 0;
    const first = sortedScans[0].riskScore;
    const last = sortedScans[sortedScans.length - 1].riskScore;
    return ((last - first) / first) * 100;
  };

  const handleShare = () => {
    if (!analysis) return;
    const text = `My Mira Prevention Report:\n- Trend: ${analysis.trend}\n- Risk Change: ${analysis.changePercent.toFixed(1)}%\n- Total Scans: ${analysis.totalScans}\n- Recommendation: ${analysis.recommendation}\n\nGenerated by Mira AI`;
    
    if (navigator.share) {
      navigator.share({ title: "Mira Prevention Report", text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Report copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (!analysis) return;
    const report = `
═══════════════════════════════════════
       MIRA PREVENTION REPORT
═══════════════════════════════════════

LONGITUDINAL ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Scans Analyzed: ${analysis.totalScans}
Analysis Period: ${analysis.firstScan.date} to ${analysis.latestScan.date}

RISK TREND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trend: ${analysis.trend.toUpperCase()}
Change: ${analysis.changePercent > 0 ? '+' : ''}${analysis.changePercent.toFixed(1)}%
First Scan Risk: ${analysis.firstScan.riskScore}%
Latest Scan Risk: ${analysis.latestScan.riskScore}%

${analysis.changes.length > 0 ? `CHANGES DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysis.changes.map(c => `• ${c}`).join('\n')}

` : ''}RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${analysis.recommendation}

═══════════════════════════════════════
Generated: ${new Date().toLocaleString()}
Mira - Prevention Through Early Detection
═══════════════════════════════════════
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mira-Longitudinal-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedScans = [...scans].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const projection = analysis ? buildProjection(sortedScans, 12) : [];
  const thresholdCrossing = projection.find(p => p.riskScore >= 60);
  const projectionPoints = projection.map((p, i) => {
    const x = projection.length <= 1 ? 0 : (i / (projection.length - 1)) * 100;
    return {
      x,
      y: 100 - p.riskScore,
      yLow: 100 - p.low,
      yHigh: 100 - p.high,
    };
  });
  const linePath = projectionPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = projectionPoints.length > 0
    ? `M ${projectionPoints[0].x} ${projectionPoints[0].yHigh} ` +
      projectionPoints.map(p => `L ${p.x} ${p.yHigh}`).join(" ") +
      " " +
      projectionPoints.slice().reverse().map(p => `L ${p.x} ${p.yLow}`).join(" ") +
      ` L ${projectionPoints[0].x} ${projectionPoints[0].yHigh} Z`
    : "";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Prevention Timeline</h1>
        <p className="mt-1 text-muted">
          Track your health over time. Compare past scans to detect patterns and trends before they become problems.
        </p>
      </div>

      {/* Timeline Visualization */}
      {scans.length >= 2 && (
        <div className="mb-8 bg-surface border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-action" />
            Your Risk Timeline
          </h3>
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-border"></div>
            <div 
              className="absolute top-5 h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
              style={{ 
                left: '0%', 
                right: `${100 - Math.max(...scans.map(s => s.riskScore)) + 20}%` 
              }}
            ></div>
            <div className="relative flex justify-between">
              {scans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((scan, i) => (
                <div key={scan.id} className="flex flex-col items-center">
                  <div 
                    className={`w-4 h-4 rounded-full border-2 ${
                      scan.riskScore < 30 ? "bg-green-500 border-green-500" :
                      scan.riskScore < 60 ? "bg-yellow-500 border-yellow-500" : "bg-red-500 border-red-500"
                    }`}
                  ></div>
                  <div className="mt-2 text-xs text-muted text-center">
                    <div className="font-medium">{new Date(scan.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    <div className={scan.riskScore < 30 ? "text-green-600" : scan.riskScore < 60 ? "text-yellow-600" : "text-red-600"}>
                      {scan.riskScore}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Scans */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Your Scans</h3>
          <button
            onClick={handleAddScan}
            className="flex items-center gap-2 px-4 py-2 bg-action text-white text-sm font-medium rounded-lg hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add Past Scan
          </button>
        </div>

        {scans.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted mb-4" />
            <p className="text-foreground font-medium">No scans added yet</p>
            <p className="text-sm text-muted mt-1">Add your past scan results to track changes over time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <div key={scan.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-xs text-muted mb-1">Date</label>
                    <input
                      type="date"
                      value={scan.date}
                      onChange={(e) => handleScanChange(scan.id, "date", e.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Scan Type</label>
                    <select
                      value={scan.type}
                      onChange={(e) => handleScanChange(scan.id, "type", e.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm rounded-lg"
                    >
                      <option value="Chest X-Ray">Chest X-Ray</option>
                      <option value="Mammogram">Mammogram</option>
                      <option value="CT Scan">CT Scan</option>
                      <option value="Risk Assessment">Risk Assessment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Result</label>
                    <select
                      value={scan.result}
                      onChange={(e) => handleScanChange(scan.id, "result", e.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm rounded-lg"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Abnormal">Abnormal</option>
                      <option value="Follow-up">Follow-up Required</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Risk Score (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scan.riskScore}
                      onChange={(e) => handleScanChange(scan.id, "riskScore", parseInt(e.target.value) || 0)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm rounded-lg"
                    />
                  </div>
                  <div>
                    <button
                      onClick={() => handleRemoveScan(scan.id)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={isLoading || scans.length < 2}
        className="w-full py-4 bg-action text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>Analyzing...</>
        ) : (
          <>
            <Activity className="w-5 h-5" />
            Analyze Trends
          </>
        )}
      </button>

      {/* Results */}
      {analysis && (
        <div className="mt-8 space-y-6">
          {/* Trend Banner */}
          <div className={`rounded-2xl p-6 ${
            analysis.trend === "concerning" ? "bg-red-50 border-2 border-red-200" :
            analysis.trend === "improving" ? "bg-green-50 border-2 border-green-200" :
            "bg-blue-50 border-2 border-blue-200"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                analysis.trend === "concerning" ? "bg-red-100" :
                analysis.trend === "improving" ? "bg-green-100" : "bg-blue-100"
              }`}>
                {analysis.trend === "concerning" ? (
                  <TrendingUp className="w-7 h-7 text-red-600" />
                ) : analysis.trend === "improving" ? (
                  <TrendingDown className="w-7 h-7 text-green-600" />
                ) : (
                  <Minus className="w-7 h-7 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground capitalize">
                  {analysis.trend === "concerning" ? "Risk Increasing" : 
                   analysis.trend === "improving" ? "Risk Decreasing" : "Risk Stable"}
                </h3>
                <p className="text-muted">
                  {analysis.changePercent > 0 ? "+" : ""}{analysis.changePercent.toFixed(1)}% change over {analysis.totalScans} scans
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-foreground">{analysis.totalScans}</div>
                <div className="text-xs text-muted">Scans</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{analysis.firstScan.riskScore}%</div>
              <div className="text-xs text-muted">First Scan</div>
              <div className="text-xs text-muted">{analysis.firstScan.date}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{analysis.latestScan.riskScore}%</div>
              <div className="text-xs text-muted">Latest Scan</div>
              <div className="text-xs text-muted">{analysis.latestScan.date}</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${
                analysis.changePercent > 0 ? "text-red-600" : analysis.changePercent < 0 ? "text-green-600" : "text-foreground"
              }`}>
                {analysis.changePercent > 0 ? "+" : ""}{analysis.changePercent.toFixed(1)}%
              </div>
              <div className="text-xs text-muted">Change</div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{scans.length}</div>
              <div className="text-xs text-muted">Total Entries</div>
            </div>
          </div>

          {projection.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h4 className="font-semibold text-foreground">Projection (Next 12 Months)</h4>
                  <p className="text-xs text-muted">Linear forecast with uncertainty band based on prior scans.</p>
                </div>
                {thresholdCrossing && (
                  <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                    Projected high-risk threshold around {thresholdCrossing.date}
                  </div>
                )}
              </div>
              <div className="h-44 bg-background rounded-lg border border-border p-3">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d={areaPath} fill="rgba(59, 130, 246, 0.15)" stroke="none" />
                  <path d={linePath} fill="none" stroke="rgba(59, 130, 246, 0.9)" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {projection.slice(0, 4).map((p) => (
                  <div key={p.date} className="bg-background border border-border rounded-lg p-3">
                    <div className="text-xs text-muted">{p.date}</div>
                    <div className="text-lg font-semibold text-foreground">{p.riskScore}%</div>
                    <div className="text-xs text-muted">Range {p.low}-{p.high}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Changes */}
          {analysis.changes.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Changes Detected
              </h4>
              <ul className="space-y-2">
                {analysis.changes.map((change, i) => (
                  <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                    <span className="text-yellow-500">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recommendation
            </h4>
            <p className="text-green-700">{analysis.recommendation}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleShare}
              className="flex-1 py-3 border-2 border-border text-foreground font-semibold rounded-xl hover:bg-surface flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Report
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-action text-white font-semibold rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LongitudinalPage;
