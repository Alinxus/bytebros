"use client";

/*
|--------------------------------------------------------------
| Npm Import
|-------------------------------------------------------------
*/
import { usePathname } from "next/navigation";
import {  Square, Hexagon, Circle, ArrowRightLeft, Triangle } from "lucide-react";
import { LayoutDashboard, ScanHeart, Scan, HeartPulse, History, ShieldCheck } from "lucide-react";

/*
|--------------------------------------------------------------
| Nav Sections
|-------------------------------------------------------------
*/
const NAV_SECTIONS = [

  {
    label: "Main",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Screening",
    items: [
      { label: "Chest X-Ray", href: "/chest-xray", icon : ScanHeart },
      { label: "Mammography", href: "/mammography", icon: Scan },
      { label: "Breast Cancer", href: "/breast-cancer", icon: HeartPulse },
    ],
  },
  {
    label: "Analysis",
    items: [
      { label: "Longitudinal", href: "/longitudinal", icon: History },
      { label: "Risk Assessment", href: "/risk-assessment", icon: ShieldCheck },
    ],
  },
] as const;

/*
|----------------------------------------------------------------
| Sidebar Component
|----------------------------------------------------------------
*/
const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <a
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
          tabIndex={0}
        >
          BETA
        </a>
      </div>
      <nav
        className="flex-1 px-3 py-4 overflow-y-auto"
        aria-label="Dashboard navigation"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1.5 text-[10px] font-medium tracking-widest uppercase text-muted/60">
              {section.label}
            </p>
            <ul className="space-y-0.5" role="list">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-surface text-foreground font-medium"
                          : "text-muted hover:text-foreground hover:bg-surface"
                      }`}
                      tabIndex={0}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="text-sm" aria-hidden="true">
                        <Icon size={18} />
                      </span>
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted">Cavista v2.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
