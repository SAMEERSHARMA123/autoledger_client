"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardBanners from "@/components/DashboardBanners";
import DashboardWidgets from "@/components/DashboardWidgets";
import DashboardPulse from "@/components/DashboardPulse";
import { Search, ChevronDown, User, Download, LogOut, ArrowUpRight } from "lucide-react";
import VoiceExpenseButton from "@/components/VoiceExpenseButton";
import { useExpenseStore } from "@/store/useExpenseStore";
import { useAuthStore } from "@/store/useAuthStore";

interface QuickNavOption {
  title: string;
  description: string;
  path: string;
  keywords: string;
}

const QUICK_NAV_OPTIONS: QuickNavOption[] = [
  {
    title: "Dashboard",
    description: "Quick expense entry, burn rate & recent activity",
    path: "/",
    keywords: "dashboard home overview expense log burn rate recent activity",
  },
  {
    title: "Ledger History",
    description: "Full transaction logs, filters, pagination & export CSV/XLSX/PDF",
    path: "/ledger",
    keywords: "ledger history transactions filter search export csv xlsx pdf statement",
  },
  {
    title: "Debts Matrix",
    description: "Track borrowed/lent balances & pending settlements",
    path: "/debts",
    keywords: "debts matrix settlement borrow lend split pending",
  },
  {
    title: "Spending Insights",
    description: "3D curved cards, donut & bar charts, weekly summary",
    path: "/insights",
    keywords: "insights analytics charts donut bar 3d weekly summary",
  },
  {
    title: "Settings",
    description: "Profile settings, budget & color theme presets",
    path: "/settings",
    keywords: "settings profile theme color preset budget preferences",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshDashboardData = useExpenseStore((state) => state.refreshDashboardData);

  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar]);

  const matchedOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return QUICK_NAV_OPTIONS;
    const words = q.split(/\s+/).filter(Boolean);
    return QUICK_NAV_OPTIONS.filter((item) => {
      const hay = `${item.title} ${item.description} ${item.keywords}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [searchQuery]);

  const handleSelectOption = (path: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)] overflow-x-hidden">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-4 sm:pr-6 pb-12 lg:pr-10 overflow-x-hidden">
        
        <header className="mb-10 pl-2 sm:pl-4 pr-1 sm:pr-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
              Dashboard
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[var(--color-muted)] mt-1">
              Overview & Quick Expense Tracking
            </p>
          </div>

          <div className="flex items-center justify-end sm:justify-normal gap-3 w-full sm:w-auto">
            <div className="hidden lg:block relative w-72">
              <div className="relative w-full h-10 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[3px_3px_0px_0px_var(--color-amber)]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  placeholder="Jump to page or feature..."
                  className="w-full h-full bg-transparent text-[var(--color-coolwhite)] font-mono text-xs pl-10 pr-3 focus:outline-none placeholder:text-[var(--color-muted)] rounded-none"
                />
              </div>

              {searchOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[4px_4px_0px_0px_var(--color-amber)] z-50 max-h-72 overflow-y-auto">
                  {matchedOptions.length === 0 ? (
                    <div className="px-3.5 py-3 font-mono text-xs text-[var(--color-muted)]">
                      No matching page or feature
                    </div>
                  ) : (
                    matchedOptions.map((opt) => (
                      <button
                        key={opt.path}
                        type="button"
                        onMouseDown={() => handleSelectOption(opt.path)}
                        className="w-full px-3.5 py-2.5 text-left border-b border-zinc-800 last:border-b-0 hover:bg-[var(--color-charcoal)] transition-colors flex items-start justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-sans text-xs font-bold uppercase text-[var(--color-amber)] truncate">
                            {opt.title}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--color-coolwhite)]/80 truncate mt-0.5">
                            {opt.description}
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-muted)] flex-shrink-0 mt-0.5" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center h-10 bg-[var(--color-coolwhite)] border-2 border-[var(--color-vanta)] shadow-[3px_3px_0px_0px_var(--color-muted)] pl-1.5 pr-3 gap-2.5 cursor-pointer hover:bg-[var(--color-muted)]/15 transition-colors rounded-none"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--color-muted)] border border-[var(--color-vanta)] flex flex-shrink-0 items-center justify-center overflow-hidden">
                  {user?.avatar && !imgError ? (
                    <img
                      src={user.avatar}
                      alt={user?.name || "User"}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-[var(--color-coolwhite)] stroke-[2.5]" />
                  )}
                </div>
                
                <div className="flex flex-col justify-center text-left max-w-[110px] sm:max-w-[120px]">
                  <span className="font-sans text-xs font-bold text-[var(--color-vanta)] leading-none truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-muted)] leading-none mt-1 truncate">
                    AutoLedger
                  </span>
                </div>

                <ChevronDown className={`w-4 h-4 text-[var(--color-muted)] ml-1 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-[var(--color-coolwhite)] border-2 border-[var(--color-vanta)] shadow-[4px_4px_0px_0px_var(--color-muted)] z-40 flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/settings");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 font-sans text-xs font-medium text-[var(--color-vanta)] hover:bg-[var(--color-muted)]/15 text-left border-b border-[var(--color-muted)]/30 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                    Profile Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/ledger");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2.5 font-sans text-xs font-medium text-[var(--color-vanta)] hover:bg-[var(--color-muted)]/15 text-left border-b border-[var(--color-muted)]/30 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                    Export Data
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-2.5 px-3 py-2.5 font-sans text-xs font-bold text-[var(--color-crimson)] hover:bg-[var(--color-crimson)]/10 text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="pl-2 sm:pl-4">
          <DashboardBanners />
          <DashboardWidgets />
          <DashboardPulse />
          <VoiceExpenseButton onSuccess={refreshDashboardData} />
        </div>

      </main>
    </div>
  );
}