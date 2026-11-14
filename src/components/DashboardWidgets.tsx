"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, ArrowRight, AlertTriangle, Flame, Target } from "lucide-react";
import Link from "next/link";

export default function DashboardWidgets({ isMuted = false }: { isMuted?: boolean }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [mode, setMode] = useState("UPI");
  const [note, setNote] = useState("");
  const [isDebt, setIsDebt] = useState(false);

  // साउंड फ़ाइल को पहले से मेमोरी में लोड रखें (Zero Lag)
  const audioRef = useRef<HTMLAudioElement | null>(
    typeof Audio !== "undefined" ? new Audio("/sounds/expense-add.wav") : null
  );

  // फॉर्म सबमिट होने पर साउंड प्ले करें
  const handleLogExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    if (!isMuted && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // यहाँ आपका बाकी डेटा सेव करने का लॉजिक आएगा
    setAmount("");
    setNote("");
    setIsDebt(false);
  };

  return (
    <div className="flex flex-col gap-6 mt-6 w-full">
      
      {/* =========================================
          1. QUICK MANUAL ENTRY BAR (Full Width)
      ========================================= */}
      <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-4 shadow-[var(--shadow-brutal)]">
        <form className="flex flex-col md:flex-row items-center gap-3 w-full" >
          
          <div className="relative w-full md:w-32 flex-shrink-0">
            <span className="absolute left-3 top-3 font-mono text-[var(--color-muted)]">₹</span>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 pl-8 pr-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none" 
            />
          </div>

          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full md:w-40 bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none appearance-none"
          >
            <option value="FOOD">FOOD</option>
            <option value="TRAVEL">TRAVEL</option>
            <option value="BILLS">BILLS</option>
            <option value="SHOPPING">SHOPPING</option>
          </select>

          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)}
            className="w-full md:w-32 bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none appearance-none"
          >
            <option value="UPI">UPI</option>
            <option value="CASH">CASH</option>
            <option value="CARD">CARD</option>
          </select>

          <input 
            type="text" 
            placeholder="Note (Optional)" 
            value={note} 
            onChange={(e) => setNote(e.target.value)}
            className="w-full flex-1 bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none" 
          />

         <label className="flex items-center gap-2 cursor-pointer font-mono text-sm uppercase text-[var(--color-muted)] hover:text-white transition-colors">
  <input 
    type="checkbox" 
    checked={isDebt} 
    onChange={(e) => {
      setIsDebt(e.target.checked);
      if (!isMuted && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }}
    className="w-5 h-5 accent-[var(--color-amber)] bg-[var(--color-charcoal)] border-zinc-800 rounded-none cursor-pointer" 
  />
  Debt?
</label>


          <button 
            type="submit" 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-6 border-2 border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[4px_4px_0px_0px_rgba(234,88,12,0.4)] hover:shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Log Expense
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* =========================================
            2. RECENT ACTIVITY (Left Side - 60%)
        ========================================= */}
        <div className="lg:col-span-2 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] flex flex-col shadow-[var(--shadow-brutal)]">
          <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)]">Recent Activity //</h2>
          </div>
          
          <div className="flex flex-col">
            {[1, 2, 3, 4, 5].map((item, i) => (
              <div key={i} className="group flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-[var(--color-charcoal)] transition-colors">
                <div className="flex items-center gap-4">
                  <span className="bg-[var(--color-charcoal)] text-[var(--color-amber)] font-mono text-xs px-2 py-1 uppercase font-bold border border-zinc-700">Food</span>
                  <span className="font-sans text-[var(--color-coolwhite)]">Lunch at Cafe</span>
                  <span className="font-mono text-xs text-[var(--color-muted)] border border-zinc-800 px-2 py-0.5">UPI</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-[var(--color-coolwhite)]">₹450.00</span>
                  <button className="text-zinc-600 hover:text-[var(--color-crimson)] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 flex justify-end bg-[var(--color-charcoal)]/30">
            <Link href="/ledger" className="flex items-center gap-2 font-mono text-xs uppercase text-[var(--color-amber)] hover:text-white transition-colors font-bold tracking-widest">
              View All Ledger <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: ANALYTICS & ALERTS (40%)
        ========================================= */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* 3. Safe-To-Spend & Burn Rate */}
          <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-5 shadow-[var(--shadow-brutal)]">
            <h3 className="font-sans font-bold text-sm uppercase text-[var(--color-muted)] flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-[var(--color-amber)]" /> Burn Rate Analysis
            </h3>
            
            <div className="mb-6">
              <div className="font-mono text-[var(--color-muted)] text-xs uppercase mb-1">Daily Safe Limit</div>
              <div className="font-sans text-2xl font-bold text-[var(--color-coolwhite)]">₹1,150 <span className="text-sm font-mono text-[var(--color-muted)] font-normal">/ day</span></div>
            </div>

            <div>
              <div className="flex justify-between font-mono text-xs uppercase mb-2">
                <span className="text-[var(--color-muted)]">Monthly Burn</span>
                <span className="text-[var(--color-amber)] font-bold">40.2% Spent</span>
              </div>
              {/* Brutalist Progress Bar */}
              <div className="w-full h-3 bg-[var(--color-charcoal)] border border-zinc-700">
                <div className="h-full bg-[var(--color-amber)] w-[40.2%]"></div>
              </div>
            </div>
          </div>

          {/* 4. Top Drain & Pending Debts Alert */}
          <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-5 shadow-[var(--shadow-brutal)] flex flex-col gap-5">
            
            <div className="border-b border-zinc-800 pb-4">
              <div className="font-sans font-bold text-sm uppercase text-[var(--color-muted)] flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-[var(--color-crimson)]" /> Top Drain
              </div>
              <div className="font-mono text-sm text-[var(--color-coolwhite)]">
                Highest Drain: <span className="text-[var(--color-crimson)] font-bold">FOOD</span> (42% of total)
              </div>
            </div>

            <div>
              <div className="font-sans font-bold text-sm uppercase text-[var(--color-muted)] flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[var(--color-amber)]" /> Debt Action
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-[var(--color-coolwhite)]">2 Pending Settlements</span>
                <button className="bg-[var(--color-charcoal)] text-[var(--color-amber)] font-sans font-bold text-xs uppercase px-3 py-1.5 border border-zinc-700 hover:border-[var(--color-amber)] transition-colors">
                  Settle
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}