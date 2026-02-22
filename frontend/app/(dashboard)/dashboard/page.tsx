"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Activity, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

type RecentScan = {
  id: string;
  type: string;
  date: string;
  result: string;
  riskLevel: string;
};

function DashboardPage() {
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const apiKey = localStorage.getItem("cavista_api_key") || "";

      try {
        const res = await fetch("/api/screening/history", {
          headers: { "x-api-key": apiKey },
        });
        if (res.ok) {
          const data = await res.json();
          const scans: RecentScan[] = [];
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
          setRecentScans(scans.slice(0, 5));
          if (scans.length > 0) {
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        // History not available
      }

      try {
        const raw = localStorage.getItem("cavista_scan_history");
        if (raw) {
          const local = JSON.parse(raw) as RecentScan[];
          setRecentScans(local.slice(0, 5));
        }
      } catch {
        // ignore
      }

      setIsLoading(false);
    };

    fetchHistory();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        <p className="mt-1 text-muted">
          Manage your health screenings and track your results
        </p>
      </div>

      {/* Quick Action */}
      <Link
        href="/screening"
        className="block mb-8 p-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Start Prevention Journey</h2>
            <p className="mt-1 opacity-90">
              Get your AI-powered risk assessment and screening
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
        </div>
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{recentScans.length}</p>
              <p className="text-sm text-muted">Total Screenings</p>
            </div>
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {recentScans.filter(s => s.riskLevel === "low").length}
              </p>
              <p className="text-sm text-muted">Low Risk Results</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Last 30 days</p>
              <p className="text-sm text-muted">Last Screening</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Results</h2>
          <Link href="/results" className="text-sm text-action hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="border border-border rounded-xl p-8 text-center">
            <p className="text-muted">Loading...</p>
          </div>
        ) : recentScans.length > 0 ? (
          <div className="border border-border rounded-xl overflow-hidden">
            {recentScans.map((scan, i) => (
              <div
                key={scan.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i !== recentScans.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    scan.riskLevel === "low" ? "bg-green-100" :
                    scan.riskLevel === "medium" ? "bg-yellow-100" : "bg-red-100"
                  }`}>
                    {scan.riskLevel === "low" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{scan.type}</p>
                    <p className="text-sm text-muted">
                      {new Date(scan.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  scan.riskLevel === "low" ? "bg-green-100 text-green-700" :
                  scan.riskLevel === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                }`}>
                  {scan.riskLevel === "low" ? "Low Risk" :
                   scan.riskLevel === "medium" ? "Medium" : "High Risk"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted mb-4" />
            <p className="text-lg font-medium text-foreground">No screenings yet</p>
            <p className="text-muted mt-1 mb-4">Start your first screening to see results here</p>
            <Link href="/screening" className="inline-flex items-center gap-2 px-4 py-2 bg-action text-white rounded-lg hover:opacity-90">
              <Plus className="w-4 h-4" />
              Start Screening
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
