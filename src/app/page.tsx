"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardBanners from "@/components/DashboardBanners";
import DashboardWidgets from "@/components/DashboardWidgets";
import DashboardPulse from "@/components/DashboardPulse";
import { Search, Volume2, VolumeX, ChevronDown, User, Download, LogOut } from "lucide-react";
import VoiceExpenseButton from "@/components/VoiceExpenseButton";

export default function Dashboard() {
  const [isMuted, setIsMuted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)]">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-6 pb-12 lg:pr-10">
        
        {/* =========================================
            CLEAN INLINE HEADER
        ========================================= */}
        <header className="mb-10 pl-4 pr-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          
          {/* Left Side: Title */}
          <div>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
              Dashboard 
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[var(--color-muted)] mt-1">
              Overview & Quick Expense Tracking
            </p>
          </div>

          {/* Right Side: Clean Search, Sound & Profile */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            
            {/* 1. Search Bar */}
            <div className="hidden lg:flex relative w-64 h-10 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[3px_3px_0px_0px_var(--color-amber)]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)] pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search expenses, notes..." 
                className="w-full h-full bg-transparent text-[var(--color-coolwhite)] font-mono text-xs pl-10 pr-3 focus:outline-none placeholder:text-[var(--color-muted)] rounded-none"
              />
            </div>

            {/* 2. Sound Toggle Button */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="flex flex-shrink-0 items-center justify-center h-10 w-10 bg-[var(--color-coolwhite)] border-2 border-[var(--color-vanta)] shadow-[3px_3px_0px_0px_var(--color-vanta)] hover:bg-gray-200 transition-colors cursor-pointer rounded-none"
              title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-[var(--color-crimson)]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[var(--color-vanta)]" />
              )}
            </button>

            {/* 3. Clean Profile Pill with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center h-10 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[3px_3px_0px_0px_var(--color-amber)] pl-1.5 pr-3 gap-2.5 cursor-pointer hover:bg-[var(--color-charcoal)] transition-colors rounded-none"
              >
                <div className="w-7 h-7 bg-[var(--color-amber)] flex flex-shrink-0 items-center justify-center rounded-none">
                  <User className="w-4 h-4 text-[var(--color-vanta)] stroke-[2.5]" />
                </div>
                
                <div className="flex flex-col justify-center text-left">
                  <span className="font-sans text-xs font-bold text-[var(--color-coolwhite)] leading-none">
                    Account
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-amber)] leading-none mt-1">
                    AutoLedger
                  </span>
                </div>

                <ChevronDown className={`w-4 h-4 text-[var(--color-muted)] ml-1 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Simple Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[4px_4px_0px_0px_var(--color-amber)] z-40 flex flex-col">
                  <button className="flex items-center gap-2.5 px-3 py-2.5 font-sans text-xs font-medium text-[var(--color-coolwhite)] hover:bg-[var(--color-charcoal)] text-left border-b border-zinc-800">
                    <User className="w-3.5 h-3.5 text-[var(--color-amber)]" />
                    Profile Settings
                  </button>
                  <button className="flex items-center gap-2.5 px-3 py-2.5 font-sans text-xs font-medium text-[var(--color-coolwhite)] hover:bg-[var(--color-charcoal)] text-left border-b border-zinc-800">
                    <Download className="w-3.5 h-3.5 text-[var(--color-amber)]" />
                    Export Data
                  </button>
                  <button className="flex items-center gap-2.5 px-3 py-2.5 font-sans text-xs font-bold text-[var(--color-crimson)] hover:bg-[var(--color-crimson)]/10 text-left">
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Main Dashboard Content Area */}
        <div className="pl-4">
          <DashboardBanners />
          <DashboardWidgets /> 
          <DashboardPulse />
          <VoiceExpenseButton/>
        </div>

      </main>
    </div>
  );
}
