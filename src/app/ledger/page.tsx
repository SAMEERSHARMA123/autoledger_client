"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Search, SlidersHorizontal, Download, FileText, ChevronDown, Receipt, Trash2, Edit2, Calendar, FileSpreadsheet, File } from "lucide-react";

// Preloaded realistic data
const MOCK_TRANSACTIONS = [
  { id: 1, date: "2026-11-14", note: "Swiggy Lunch Order", category: "FOOD", method: "UPI", amount: 450, type: "EXPENSE", hasProof: true, isDebt: false },
  { id: 2, date: "2026-11-13", note: "Metro Card Recharge", category: "TRAVEL", method: "UPI", amount: 1000, type: "EXPENSE", hasProof: true, isDebt: false },
  { id: 3, date: "2026-11-12", note: "Petrol Station", category: "TRAVEL", method: "CASH", amount: 1500, type: "EXPENSE", hasProof: false, isDebt: false },
  { id: 4, date: "2026-11-10", note: "Freelance Client (Web)", category: "INCOME", method: "UPI", amount: 12500, type: "INCOME", hasProof: true, isDebt: false },
  { id: 5, date: "2026-11-09", note: "Dmart Monthly Groceries", category: "BILLS", method: "CARD", amount: 4200, type: "EXPENSE", hasProof: true, isDebt: false },
  { id: 6, date: "2026-11-08", note: "Friend Dinner Split", category: "FOOD", method: "UPI", amount: 850, type: "EXPENSE", hasProof: false, isDebt: true },
  { id: 7, date: "2026-11-05", note: "Jio Fiber Broadband", category: "BILLS", method: "UPI", amount: 849, type: "EXPENSE", hasProof: true, isDebt: false },
  { id: 8, date: "2026-11-02", note: "Sneakers Purchase", category: "SHOPPING", method: "CARD", amount: 3500, type: "EXPENSE", hasProof: true, isDebt: false },
];

export default function LedgerPage() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [proofStatus, setProofStatus] = useState("ALL");
  const [groupBy, setGroupBy] = useState("FLAT");

  // Calculate Aggregations (Mock logic for the UI based on preloaded data)
  const totalExpense = MOCK_TRANSACTIONS.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
  const highestExpense = MOCK_TRANSACTIONS.filter(t => t.type === "EXPENSE").sort((a, b) => b.amount - a.amount)[0];
  const expenseCount = MOCK_TRANSACTIONS.filter(t => t.type === "EXPENSE").length;
  const avgSpend = expenseCount > 0 ? (totalExpense / expenseCount).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)]">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-6 pb-12 lg:pr-10">
        
        {/* =========================================
            1. INLINE PAGE HEADER & EXPORT
        ========================================= */}
        <header className="mb-8 pl-4 pr-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative">
          <div>
            <h1 className="font-sans text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
              Ledger History //
            </h1>
            <p className="font-mono text-sm text-[var(--color-muted)] mt-1 uppercase">
              Complete transaction logs & aggregations
            </p>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-5 border-2 border-[var(--color-vanta)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[3px_3px_0px_0px_var(--color-vanta)] transition-all rounded-none"
            >
              <Download className="w-5 h-5" strokeWidth={2.5} />
              Export Data
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Brutalist Export Popover */}
            {showExportMenu && (
              <div className="absolute right-0 top-14 w-80 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[4px_4px_0px_0px_var(--color-amber)] z-50 p-5">
                <div className="mb-4 pb-4 border-b border-zinc-800">
                  <span className="font-mono text-xs text-[var(--color-muted)] uppercase block mb-3">Data Scope</span>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold text-xs uppercase py-2 border-2 border-[var(--color-amber)]">Current View</button>
                    <button className="flex-1 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold text-xs uppercase py-2 border border-zinc-700 hover:border-[var(--color-amber)]">Custom Range</button>
                  </div>
                </div>
                <div>
                  <span className="font-mono text-xs text-[var(--color-muted)] uppercase block mb-3">Format</span>
                  <div className="flex flex-col gap-2">
                    <button className="w-full flex items-center gap-3 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-mono text-sm py-2 px-3 hover:bg-zinc-800 border border-transparent hover:border-[var(--color-amber)] transition-colors text-left">
                      <FileSpreadsheet className="w-4 h-4 text-[#21A366]" /> .CSV Database
                    </button>
                    <button className="w-full flex items-center gap-3 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-mono text-sm py-2 px-3 hover:bg-zinc-800 border border-transparent hover:border-[var(--color-amber)] transition-colors text-left">
                      <FileText className="w-4 h-4 text-[#107C41]" /> .XLSX Spreadsheet
                    </button>
                    <button className="w-full flex items-center gap-3 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-mono text-sm py-2 px-3 hover:bg-zinc-800 border border-transparent hover:border-[var(--color-amber)] transition-colors text-left">
                      <File className="w-4 h-4 text-[var(--color-crimson)]" /> .PDF Statement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* =========================================
            2. LIVE AGGREGATION STRIP
        ========================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-4 mb-8">
          {/* Card 1: Filtered Total */}
          <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-5 shadow-[4px_4px_0px_0px_var(--color-amber)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2 flex justify-between">
              Filtered Total <span>({expenseCount} items)</span>
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight">₹{totalExpense.toLocaleString()}</div>
          </div>
          
          {/* Card 2: Highest Expense */}
          <div className="bg-[var(--color-amber)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-vanta)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-vanta)]/80 mb-2">Highest Expense</h3>
            <div className="flex items-end justify-between">
              <div className="font-sans text-3xl font-bold tracking-tight">₹{highestExpense?.amount.toLocaleString()}</div>
              <span className="font-mono text-xs bg-[var(--color-vanta)] text-[var(--color-coolwhite)] px-2 py-1 uppercase">{highestExpense?.category}</span>
            </div>
          </div>

          {/* Card 3: Average Spend */}
          <div className="bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-charcoal)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2">Average Spend</h3>
            <div className="font-sans text-3xl font-bold tracking-tight">₹{avgSpend}</div>
          </div>
        </div>

        {/* =========================================
            3. TWO-TIER FILTER CONTROL BOX
        ========================================= */}
        <div className="pl-4 mb-8">
          <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[var(--shadow-brutal)] flex flex-col rounded-none">
            
            {/* Primary Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 p-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                <input 
                  type="text" 
                  placeholder="Search by note or item..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 pl-10 pr-4 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                />
              </div>

              <select className="w-full md:w-48 bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none appearance-none">
                <option>This Month</option>
                <option>Last 7 Days</option>
                <option>All Time</option>
                <option>Custom Range</option>
              </select>

              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full md:w-auto flex items-center justify-center gap-2 font-sans font-bold uppercase py-3 px-5 border-2 transition-all rounded-none ${
                  showFilters 
                  ? "bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-[var(--color-coolwhite)]" 
                  : "bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] border-zinc-800 hover:border-[var(--color-amber)]"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "More Filters"}
              </button>
            </div>

            {/* Expandable Advanced Filter Drawer */}
            {showFilters && (
              <div className="p-5 border-t border-zinc-800 bg-[#0F0F0F] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Method */}
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Payment Method</label>
                  <div className="flex gap-2">
                    {["ALL", "UPI", "CASH", "CARD"].map(method => (
                      <button 
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-2 font-mono text-xs uppercase border rounded-none transition-colors ${
                          paymentMethod === method 
                          ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)] font-bold" 
                          : "bg-transparent text-[var(--color-muted)] border-zinc-700 hover:border-[var(--color-coolwhite)]"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Amount Range (₹)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2 px-2 focus:outline-none focus:border-[var(--color-amber)] rounded-none text-xs" />
                    <span className="text-[var(--color-muted)]">-</span>
                    <input type="number" placeholder="Max" className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2 px-2 focus:outline-none focus:border-[var(--color-amber)] rounded-none text-xs" />
                  </div>
                </div>

                {/* Proof Status */}
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Receipt Proof</label>
                  <select 
                    value={proofStatus}
                    onChange={(e) => setProofStatus(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none appearance-none text-sm"
                  >
                    <option value="ALL">All Transactions</option>
                    <option value="PROOF">With Scanned Proof</option>
                    <option value="NO_PROOF">No Proof</option>
                  </select>
                </div>

                {/* Group By & Reset */}
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Group View</label>
                    <select 
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                      className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none appearance-none text-sm"
                    >
                      <option value="FLAT">Flat List (Date)</option>
                      <option value="CATEGORY">Group by Category</option>
                      <option value="METHOD">Group by Payment Method</option>
                    </select>
                  </div>
                  <button className="mt-4 font-mono text-xs uppercase text-[var(--color-muted)] hover:text-[var(--color-coolwhite)] text-right w-full">
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            4. LEDGER TABLE
        ========================================= */}
        <div className="pl-4">
          <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[var(--shadow-brutal)] rounded-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-800 bg-zinc-900/50">
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 whitespace-nowrap">Date</th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 w-full">Note & Category</th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 whitespace-nowrap">Method</th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 text-center whitespace-nowrap">Proof</th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 text-right whitespace-nowrap">Amount</th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {MOCK_TRANSACTIONS.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--color-charcoal)] transition-colors group">
                      {/* Date */}
                      <td className="p-4">
                        <div className="font-mono text-xs text-[var(--color-coolwhite)] flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-[var(--color-muted)]" />
                          {tx.date}
                        </div>
                      </td>
                      
                      {/* Note & Category */}
                      <td className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="font-sans text-[var(--color-coolwhite)] font-medium">{tx.note}</span>
                          <div className="flex items-center gap-2">
                            <span className="bg-zinc-800 text-[var(--color-amber)] font-mono text-[10px] px-2 py-0.5 uppercase border border-zinc-700">
                              {tx.category}
                            </span>
                            {tx.isDebt && (
                              <span className="bg-[var(--color-crimson)]/10 text-[var(--color-crimson)] font-mono text-[10px] px-2 py-0.5 uppercase border border-[var(--color-crimson)]/30">
                                Debt
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="p-4">
                        <span className="font-mono text-xs text-[var(--color-muted)] border border-zinc-800 px-2 py-1">
                          {tx.method}
                        </span>
                      </td>

                      {/* Proof */}
                      <td className="p-4 text-center">
                        {tx.hasProof ? (
                          <button className="inline-flex items-center gap-1 text-[var(--color-amber)] hover:text-white font-mono text-[10px] uppercase border border-[var(--color-amber)]/30 px-2 py-1 transition-colors">
                            <Receipt className="w-3 h-3" /> View Bill
                          </button>
                        ) : (
                          <span className="text-[var(--color-muted)]">-</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className={`p-4 text-right font-mono font-bold whitespace-nowrap ${tx.type === "INCOME" ? "text-[#21A366]" : "text-[var(--color-coolwhite)]"}`}>
                        {tx.type === "INCOME" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[var(--color-muted)] hover:text-[var(--color-coolwhite)] transition-colors" title="Edit Entry">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="text-[var(--color-muted)] hover:text-[var(--color-crimson)] transition-colors" title="Delete Entry">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}