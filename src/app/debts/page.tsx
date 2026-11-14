"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Search, Plus, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, History, IndianRupee } from "lucide-react";

// Preloaded Realistic Data (Grouped by Person)
const INITIAL_PEOPLE = [
  {
    id: "p1",
    name: "Rahul Sharma",
    type: "RECEIVE", // You lent them money
    totalPending: 1250,
    entries: [
      { id: "e1", date: "2026-11-10", note: "Dinner Split at BBQ Nation", amount: 800, isOverdue: true },
      { id: "e2", date: "2026-11-12", note: "Movie Tickets", amount: 450, isOverdue: false },
    ]
  },
  {
    id: "p2",
    name: "Amit Verma",
    type: "RECEIVE",
    totalPending: 3500,
    entries: [
      { id: "e3", date: "2026-11-01", note: "Emergency Cash Transfer", amount: 3500, isOverdue: true },
    ]
  },
  {
    id: "p3",
    name: "Sneha Kapoor",
    type: "PAY", // You borrowed money from them
    totalPending: 1500,
    entries: [
      { id: "e4", date: "2026-11-05", note: "Paid for my Uber", amount: 500, isOverdue: false },
      { id: "e5", date: "2026-11-08", note: "Concert Ticket Advance", amount: 1000, isOverdue: false },
    ]
  }
];

export default function DebtsPage() {
  // State
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCards, setExpandedCards] = useState<string[]>(["p1"]); // Rahul expanded by default
  const [showSettled, setShowSettled] = useState(false);
  
  // New Debt Form State
  const [debtType, setDebtType] = useState<"RECEIVE" | "PAY">("RECEIVE");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Partial Payment UI State: Tracks which person's partial pay input is open
  const [activePartialPay, setActivePartialPay] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState("");

  // Derived Metrics
  const filteredPeople = people.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && p.totalPending > 0);
  const toReceivePeople = filteredPeople.filter(p => p.type === "RECEIVE");
  const toPayPeople = filteredPeople.filter(p => p.type === "PAY");

  const totalToReceive = toReceivePeople.reduce((sum, p) => sum + p.totalPending, 0);
  const totalToPay = toPayPeople.reduce((sum, p) => sum + p.totalPending, 0);
  const netBalance = totalToReceive - totalToPay;

  // Handlers
  const toggleExpand = (id: string) => {
    setExpandedCards(prev => prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]);
  };

  const handleSettleFull = (id: string) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, totalPending: 0 } : p));
  };

  const handlePartialPay = (id: string) => {
    const payAmt = Number(partialAmount);
    if (payAmt > 0) {
      setPeople(prev => prev.map(p => {
        if (p.id === id) {
          const newPending = Math.max(0, p.totalPending - payAmt);
          return { ...p, totalPending: newPending };
        }
        return p;
      }));
      setActivePartialPay(null);
      setPartialAmount("");
    }
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount) return;
    
    // In a real app, this would merge with existing person or create new.
    // For UI demo, we reset the form.
    setPersonName("");
    setAmount("");
    setNote("");
    setDueDate("");
  };

  // Reusable Component for a Person Card
  const PersonCard = ({ person }: { person: typeof INITIAL_PEOPLE[0] }) => {
    const isExpanded = expandedCards.includes(person.id);
    const isPaying = activePartialPay === person.id;

    return (
      <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[var(--shadow-brutal)] flex flex-col mb-4 rounded-none">
        
        {/* Card Header (Clickable) */}
        <div 
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-[var(--color-charcoal)] transition-colors border-b border-zinc-800/50"
          onClick={() => toggleExpand(person.id)}
        >
          <div>
            <h3 className="font-sans font-bold text-lg text-[var(--color-coolwhite)] uppercase">{person.name}</h3>
            <span className="font-mono text-xs text-[var(--color-muted)]">{person.entries.length} active entries</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`font-mono text-xl font-bold ${person.type === "RECEIVE" ? "text-[#21A366]" : "text-[var(--color-crimson)]"}`}>
              ₹{person.totalPending.toLocaleString()}
            </span>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--color-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--color-muted)]" />}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 bg-[#0F0F0F] flex flex-col gap-4">
            
            {/* Breakdown List */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase text-[var(--color-muted)] tracking-widest border-b border-zinc-800 pb-2">Breakdown</span>
              {person.entries.map(entry => (
                <div key={entry.id} className="flex justify-between items-start py-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-[var(--color-muted)]">{entry.date}</span>
                    <span className="font-sans text-sm text-[var(--color-coolwhite)]">{entry.note}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm font-bold text-[var(--color-coolwhite)]">₹{entry.amount}</span>
                    {entry.isOverdue && (
                      <span className="flex items-center gap-1 text-[var(--color-crimson)] font-mono text-[10px] uppercase mt-1">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
              
              {/* Inline Partial Payment Form */}
              {isPaying ? (
                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                    <input 
                      type="number" 
                      placeholder="Amount..." 
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      className="w-full bg-[var(--color-charcoal)] border border-zinc-700 text-[var(--color-coolwhite)] font-mono py-2 pl-9 pr-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none text-sm"
                    />
                  </div>
                  <button 
                    onClick={() => handlePartialPay(person.id)}
                    className="bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold text-xs uppercase px-4 py-2 border-2 border-[var(--color-amber)] hover:-translate-y-[1px] hover:-translate-x-[1px] shadow-[2px_2px_0px_0px_var(--color-vanta)] transition-all"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => { setActivePartialPay(null); setPartialAmount(""); }}
                    className="text-[var(--color-muted)] font-sans font-bold text-xs uppercase px-3 py-2 hover:text-[var(--color-coolwhite)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-4">
                  <button 
                    onClick={() => setActivePartialPay(person.id)}
                    className="flex-1 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold text-xs uppercase py-2 border border-zinc-700 hover:border-[var(--color-amber)] transition-colors"
                  >
                    Partial Payment
                  </button>
                  <button 
                    onClick={() => handleSettleFull(person.id)}
                    className="flex items-center justify-center gap-2 flex-1 bg-[var(--color-vanta)] text-[var(--color-coolwhite)] font-sans font-bold text-xs uppercase py-2 border border-zinc-700 hover:border-[#21A366] hover:text-[#21A366] transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Settle Full
                  </button>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)]">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-6 pb-12 lg:pr-10">
        
        {/* =========================================
            1. INLINE PAGE HEADER & FILTER
        ========================================= */}
        <header className="mb-8 pl-4 pr-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-sans text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
              Debts & Settlements //
            </h1>
            <p className="font-mono text-sm text-[var(--color-muted)] mt-1 uppercase">
              Track lent & borrowed money by person
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
            <input 
              type="text" 
              placeholder="Search person..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-mono py-2 pl-9 pr-3 focus:outline-none focus:border-[var(--color-amber)] shadow-[3px_3px_0px_0px_var(--color-amber)] rounded-none text-sm"
            />
          </div>
        </header>

        {/* =========================================
            2. TOP DEBT SUMMARY STRIP
        ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-4 mb-8">
          {/* To Receive */}
          <div className="bg-[var(--color-amber)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-vanta)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-vanta)]/80 mb-2 flex justify-between">
              To Receive <span>({toReceivePeople.length} people)</span>
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight">₹{totalToReceive.toLocaleString()}</div>
          </div>
          
          {/* To Pay */}
          <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-5 shadow-[4px_4px_0px_0px_var(--color-amber)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2 flex justify-between">
              To Pay <span>({toPayPeople.length} people)</span>
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight">₹{totalToPay.toLocaleString()}</div>
          </div>

          {/* Net Balance */}
          <div className="bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-charcoal)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2">Net Balance</h3>
            <div className={`font-sans text-3xl font-bold tracking-tight ${netBalance > 0 ? "text-[#21A366]" : netBalance < 0 ? "text-[var(--color-crimson)]" : ""}`}>
              {netBalance > 0 ? "+" : ""}₹{netBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* =========================================
            3. QUICK ADD DEBT BAR
        ========================================= */}
        <div className="pl-4 mb-8">
          <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-4 shadow-[var(--shadow-brutal)] flex flex-col gap-4 rounded-none">
            
            {/* Type Toggle */}
            <div className="flex gap-2 w-full md:w-64">
              <button 
                onClick={() => setDebtType("RECEIVE")}
                className={`flex-1 py-2 font-sans font-bold text-xs uppercase border-2 rounded-none transition-colors ${
                  debtType === "RECEIVE" 
                  ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)]" 
                  : "bg-transparent text-[var(--color-muted)] border-zinc-800 hover:border-[var(--color-coolwhite)]"
                }`}
              >
                Lent (Receive)
              </button>
              <button 
                onClick={() => setDebtType("PAY")}
                className={`flex-1 py-2 font-sans font-bold text-xs uppercase border-2 rounded-none transition-colors ${
                  debtType === "PAY" 
                  ? "bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-zinc-600 shadow-[2px_2px_0px_0px_#52525B]" // Subtle inverted style for Borrowed
                  : "bg-transparent text-[var(--color-muted)] border-zinc-800 hover:border-[var(--color-coolwhite)]"
                }`}
              >
                Borrowed (Pay)
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddDebt} className="flex flex-col lg:flex-row gap-3 w-full">
              <div className="w-full lg:w-1/4">
                <input 
                  type="text" 
                  list="people-list"
                  placeholder="Person Name..." 
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  required
                />
                <datalist id="people-list">
                  {people.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
              </div>

              <div className="relative w-full lg:w-32">
                <span className="absolute left-3 top-3 font-mono text-[var(--color-muted)]">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 pl-8 pr-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none" 
                  required
                />
              </div>

              <input 
                type="text" 
                placeholder="Reason / Note" 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full lg:flex-1 bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none" 
              />

              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full lg:w-40 bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none" 
              />

              <button 
                type="submit" 
                className="w-full lg:w-auto flex items-center justify-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-6 border-2 border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[4px_4px_0px_0px_rgba(234,88,12,0.4)] hover:shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] transition-all whitespace-nowrap"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
                Add Record
              </button>
            </form>
          </div>
        </div>

        {/* =========================================
            4. PERSON-WISE GROUPED MATRIX
        ========================================= */}
        <div className="pl-4 grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          
          {/* Left Column: TO RECEIVE */}
          <div className="flex flex-col">
            <h2 className="font-sans font-bold text-xl uppercase tracking-wide text-[var(--color-vanta)] mb-4 flex items-center gap-2 border-b-2 border-[var(--color-charcoal)] pb-2">
              <span className="w-3 h-3 bg-[#21A366] inline-block border border-[var(--color-vanta)]" /> 
              To Receive
            </h2>
            {toReceivePeople.length > 0 ? (
              toReceivePeople.map(person => <PersonCard key={person.id} person={person} />)
            ) : (
              <div className="font-mono text-sm text-[var(--color-muted)] p-4 border border-dashed border-[var(--color-charcoal)]">No pending receivables.</div>
            )}
          </div>

          {/* Right Column: TO PAY */}
          <div className="flex flex-col">
            <h2 className="font-sans font-bold text-xl uppercase tracking-wide text-[var(--color-vanta)] mb-4 flex items-center gap-2 border-b-2 border-[var(--color-charcoal)] pb-2">
              <span className="w-3 h-3 bg-[var(--color-crimson)] inline-block border border-[var(--color-vanta)]" /> 
              To Pay
            </h2>
            {toPayPeople.length > 0 ? (
              toPayPeople.map(person => <PersonCard key={person.id} person={person} />)
            ) : (
              <div className="font-mono text-sm text-[var(--color-muted)] p-4 border border-dashed border-[var(--color-charcoal)]">No pending payables.</div>
            )}
          </div>

        </div>

        {/* =========================================
            5. COLLAPSIBLE SETTLED HISTORY
        ========================================= */}
        <div className="pl-4">
          <button 
            onClick={() => setShowSettled(!showSettled)}
            className="flex items-center gap-2 font-mono text-sm uppercase text-[var(--color-muted)] hover:text-[var(--color-vanta)] transition-colors py-2"
          >
            <History className="w-4 h-4" />
            Settled History
            {showSettled ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showSettled && (
            <div className="mt-4 bg-transparent border-2 border-[var(--color-charcoal)] p-4 rounded-none">
              <div className="flex justify-between items-center py-2 border-b border-zinc-300">
                <span className="font-mono text-sm text-[var(--color-vanta)] line-through">Nikhil Kumar (₹500)</span>
                <span className="font-mono text-xs text-[#21A366] uppercase">Settled on 10 Nov</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-mono text-sm text-[var(--color-vanta)] line-through">Office Lunch Pool (₹1200)</span>
                <span className="font-mono text-xs text-[#21A366] uppercase">Settled on 05 Nov</span>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}