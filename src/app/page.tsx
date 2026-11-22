"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DashboardBanners from "@/components/DashboardBanners";
import DashboardWidgets from "@/components/DashboardWidgets";
import DashboardPulse from "@/components/DashboardPulse";
import { Search, ChevronDown, User, Download, LogOut } from "lucide-react";
import VoiceExpenseButton from "@/components/VoiceExpenseButton";
import { useExpenseStore } from "@/store/useExpenseStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function Dashboard() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshDashboardData = useExpenseStore((state) => state.refreshDashboardData);

  useEffect(() => {
    refreshDashboardData();
  }, [refreshDashboardData]);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar]);

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)]">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-6 pb-12 lg:pr-10">
        
        <header className="mb-10 pl-4 pr-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
              Dashboard
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[var(--color-muted)] mt-1">
              Overview & Quick Expense Tracking
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="hidden lg:flex relative w-64 h-10 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[3px_3px_0px_0px_var(--color-amber)]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search expenses, notes..." 
                className="w-full h-full bg-transparent text-[var(--color-coolwhite)] font-mono text-xs pl-10 pr-3 focus:outline-none placeholder:text-[var(--color-muted)] rounded-none"
              />
            </div>

            <div className="relative">
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
                
                <div className="flex flex-col justify-center text-left max-w-[120px]">
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
                <div className="absolute right-0 mt-2 w-48 bg-[var(--color-coolwhite)] border-2 border-[var(--color-vanta)] shadow-[4px_4px_0px_0px_var(--color-muted)] z-40 flex flex-col">
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

        <div className="pl-4">
          <DashboardBanners />
          <DashboardWidgets />
          <DashboardPulse />
          <VoiceExpenseButton onSuccess={refreshDashboardData} />
        </div>

      </main>
    </div>
  );
}