"use client";

import { useState, useEffect } from "react";
import { FileText, Filter, Download, AlertCircle, CheckCircle, Info } from "lucide-react";

type ScanResult = {
  id: string;
  type: string;
  date: string;
  result: string;
  riskLevel: string;
  details?: string;
};

function ResultsPage() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const apiKey = localStorage.getItem("cavista_api_key") || "";

      try {
        const res = await fetch("/api/screening/history", {
          headers: { "x-api-key": apiKey },
        });
        if (res.ok) {
          const data = await res.json();
          const scans: ScanResult[] = [];
          
          data.history?.predictions?.forEach((p: any) => {
            scans.push({
              id: p.id || Math.random().toString(),
              type: "Breast Cancer Prediction",
              date: p.date || new Date().toISOString(),
              result: p.result || "Completed",
              riskLevel: p.riskLevel || "low",
            });
          });
          
          data.history?.xrayAnalyses?.forEach((x: any) => {
            scans.push({
              id: x.id || Math.random().toString(),
              type: "X-Ray Analysis",
              date: x.date || new Date().toISOString(),
              result: x.result || "Completed",
              riskLevel: x.riskLevel || "low",
            });
          });
          
          // Sort by date descending
          scans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setResults(scans);
          setIsDemoMode(scans.length === 0);
        }
      } catch {
        setIsDemoMode(true);
      }

      setIsLoading(false);
    };

    fetchHistory();
  }, []);

  // Demo data for when no history exists
  const demoResults: ScanResult[] = [
    {
      id: "demo-1",
      type: "Chest X-Ray Analysis",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      result: "No abnormalities detected",
      riskLevel: "low",
      details: "Clear lung fields, normal cardiac silhouette"
    },
    {
      id: "demo-2",
      type: "Mammography Screening",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      result: "BI-RADS Category 1 - Negative",
      riskLevel: "low",
      details: "No masses, calcifications, or suspicious findings"
    },
    {
      id: "demo-3",
      type: "Breast Cancer Risk Assessment",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      result: "Low Risk",
      riskLevel: "low",
      details: "5-year risk: 0.8%, Lifetime risk: 12%"
    }
  ];

  const filteredResults = filter === "all" 
    ? results.length > 0 ? results : demoResults
    : (results.length > 0 ? results : demoResults).filter(r => r.riskLevel === filter);

  const displayResults = results.length > 0 ? results : demoResults;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Results History</h1>
        <p className="mt-1 text-muted">
          View all your past screening results
        </p>
      </div>

      {isDemoMode && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Demo Mode</p>
            <p className="text-sm text-blue-600 mt-1">
              Showing sample results. Complete a screening to see your actual results here.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Filter className="w-4 h-4" />
          Filter:
        </div>
        {(["all", "low", "medium", "high"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? f === "all" ? "bg-action text-white" :
                  f === "low" ? "bg-green-100 text-green-700" :
                  f === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f === "low" ? "Low Risk" : f === "medium" ? "Medium" : "High Risk"}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="border border-border rounded-xl p-8 text-center">
          <p className="text-muted">Loading results...</p>
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="space-y-4">
          {filteredResults.map((scan) => (
            <div
              key={scan.id}
              className="bg-surface border border-border rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    scan.riskLevel === "low" ? "bg-green-100" :
                    scan.riskLevel === "medium" ? "bg-yellow-100" : "bg-red-100"
                  }`}>
                    {scan.riskLevel === "low" ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{scan.type}</h3>
                    <p className="text-sm text-muted mt-1">
                      {new Date(scan.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {scan.details && (
                      <p className="text-sm text-muted mt-2">{scan.details}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    scan.riskLevel === "low" ? "bg-green-100 text-green-700" :
                    scan.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }`}>
                    {scan.riskLevel === "low" ? "Low Risk" :
                     scan.riskLevel === "medium" ? "Medium Risk" : "High Risk"}
                  </span>
                  <button className="text-sm text-action hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted mb-4" />
          <p className="text-lg font-medium text-foreground">No results found</p>
          <p className="text-muted mt-1">
            {filter === "all" 
              ? "You haven't completed any screenings yet" 
              : `No ${filter} risk results found`}
          </p>
        </div>
      )}

      {/* Summary */}
      {displayResults.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{displayResults.length}</p>
            <p className="text-sm text-muted">Total Screenings</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {displayResults.filter(r => r.riskLevel === "low").length}
            </p>
            <p className="text-sm text-green-600">Low Risk</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">
              {displayResults.filter(r => r.riskLevel === "medium").length}
            </p>
            <p className="text-sm text-yellow-600">Medium Risk</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700">
              {displayResults.filter(r => r.riskLevel === "high").length}
            </p>
            <p className="text-sm text-red-600">High Risk</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsPage;
