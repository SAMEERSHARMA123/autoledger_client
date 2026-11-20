"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/axios";
import { confirmPopup } from "@/lib/confirmPopup";
import {
  Search,
  SlidersHorizontal,
  Download,
  FileText,
  ChevronDown,
  Receipt,
  Trash2,
  Edit2,
  Calendar,
  FileSpreadsheet,
  File,
  Loader2,
} from "lucide-react";

interface LedgerItem {
  _id: string;
  date: string;
  notes?: string;
  category: string;
  paymentMethod: string;
  amount: number;
  type: string;
  receiptUrl?: string;
  isDebtRelated?: boolean;
}

interface LedgerSummary {
  filteredTotal: number;
  itemCount: number;
  highestExpense: { amount: number; category: string };
  averageSpend: number;
}

const DEFAULT_SUMMARY: LedgerSummary = {
  filteredTotal: 0,
  itemCount: 0,
  highestExpense: { amount: 0, category: "NONE" },
  averageSpend: 0,
};

export default function LedgerPage() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [proofStatus, setProofStatus] = useState("ALL");
  const [groupBy, setGroupBy] = useState("FLAT");

  // API Data States
  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);

  // Helper: Convert dropdown selection into startDate / endDate
  const getDateBounds = (range: string): Record<string, string> => {
  const now = new Date();
  if (range === "THIS_MONTH") {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    };
  }
  if (range === "LAST_7_DAYS") {
    const start = new Date();
    start.setDate(now.getDate() - 7);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  return {};
};

  // Fetch Table + 3 Banners in parallel with active filters
  const fetchLedgerData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        ...getDateBounds(dateRange),
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (paymentMethod !== "ALL") params.paymentMethod = paymentMethod;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;
      if (proofStatus !== "ALL") params.proofStatus = proofStatus;

      const [expensesRes, summaryRes] = await Promise.all([
        api.get("/expenses", { params: { ...params, page: 1, limit: 50 } }),
        api.get("/analytics/ledger-summary", { params }),
      ]);

      setTransactions(expensesRes.data.data || []);
      setSummary(summaryRes.data.summary || DEFAULT_SUMMARY);
    } catch (error) {
      console.error("Failed to fetch ledger data:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, dateRange, paymentMethod, minAmount, maxAmount, proofStatus]);

  // Debounced fetch so typing in search/amount doesn't spam the backend
 // 1. Sirf page mount par ek baar data load hoga (typing par nahi)
useEffect(() => {
  fetchLedgerData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// 2. Apply Filters Handler (Button click ya Search mein Enter dabane par)
const handleApplyFilters = (e?: React.FormEvent) => {
  e?.preventDefault();
  fetchLedgerData();
};

// 3. Reset Filters Handler
const handleResetFilters = () => {
  setSearchQuery("");
  setDateRange("THIS_MONTH");
  setPaymentMethod("ALL");
  setMinAmount("");
  setMaxAmount("");
  setProofStatus("ALL");
  setGroupBy("FLAT");
  // Reset ke baad default data fetch karega
  setTimeout(() => fetchLedgerData(), 0);
};

// 4. Zero-GET Optimistic Delete (Table + 3 Banners turant update honge)
const handleDelete = async (tx: LedgerItem) => {
  const confirmed = await confirmPopup(
    `Delete "${tx.notes || tx.category}" (₹${tx.amount}) permanently?`,
    "Delete Entry"
  );
  if (!confirmed) return;

  const prevTx = transactions;
  const prevSummary = summary;

  const updatedTx = prevTx.filter((item) => item._id !== tx._id);
  const expensesOnly = updatedTx.filter((item) => item.type?.toUpperCase() === "EXPENSE");
  const filteredTotal = expensesOnly.reduce((sum, item) => sum + item.amount, 0);
  const highest = expensesOnly.reduce(
    (max, item) => (item.amount > max.amount ? { amount: item.amount, category: item.category } : max),
    { amount: 0, category: "NONE" }
  );

  setTransactions(updatedTx);
  setSummary({
    filteredTotal,
    itemCount: expensesOnly.length,
    highestExpense: highest,
    averageSpend: expensesOnly.length > 0 ? Number((filteredTotal / expensesOnly.length).toFixed(2)) : 0,
  });

  try {
    await api.delete(`/expenses/${tx._id}`);
  } catch (error) {
    console.error("Failed to delete entry, rolling back:", error);
    setTransactions(prevTx);
    setSummary(prevSummary);
  }
};

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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
              className="flex items-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-5 border-2 border-[var(--color-vanta)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[3px_3px_0px_0px_var(--color-vanta)] transition-all rounded-none cursor-pointer"
            >
              <Download className="w-5 h-5" strokeWidth={2.5} />
              Export Data
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-14 w-80 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[4px_4px_0px_0px_var(--color-amber)] z-50 p-5">
                <div className="mb-4 pb-4 border-b border-zinc-800">
                  <span className="font-mono text-xs text-[var(--color-muted)] uppercase block mb-3">Data Scope</span>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold text-xs uppercase py-2 border-2 border-[var(--color-amber)]">
                      Current View
                    </button>
                    <button className="flex-1 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold text-xs uppercase py-2 border border-zinc-700 hover:border-[var(--color-amber)]">
                      Custom Range
                    </button>
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
              Filtered Total <span>({summary.itemCount} items)</span>
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight">
              {loading ? <Loader2 className="w-6 h-6 text-[var(--color-amber)] animate-spin" /> : `₹${summary.filteredTotal.toLocaleString("en-IN")}`}
            </div>
          </div>

          {/* Card 2: Highest Expense */}
          <div className="bg-[var(--color-amber)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-vanta)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-vanta)]/80 mb-2">Highest Expense</h3>
            <div className="flex items-end justify-between">
              <div className="font-sans text-3xl font-bold tracking-tight">
                {loading ? <Loader2 className="w-6 h-6 text-[var(--color-vanta)] animate-spin" /> : `₹${summary.highestExpense.amount.toLocaleString("en-IN")}`}
              </div>
              <span className="font-mono text-xs bg-[var(--color-vanta)] text-[var(--color-coolwhite)] px-2 py-1 uppercase">
                {summary.highestExpense.category}
              </span>
            </div>
          </div>

          {/* Card 3: Average Spend */}
          <div className="bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-charcoal)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2">Average Spend</h3>
            <div className="font-sans text-3xl font-bold tracking-tight">
              {loading ? <Loader2 className="w-6 h-6 text-[var(--color-vanta)] animate-spin" /> : `₹${summary.averageSpend.toLocaleString("en-IN")}`}
            </div>
          </div>
        </div>

       {/* =========================================
            3. TWO-TIER FILTER CONTROL BOX
        ========================================= */}
        <div className="pl-4 mb-8">
          <form
            onSubmit={handleApplyFilters}
            className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[var(--shadow-brutal)] flex flex-col rounded-none"
          >
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

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full md:w-48 bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none appearance-none"
              >
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="ALL">All Time</option>
              </select>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full md:w-auto flex items-center justify-center gap-2 font-sans font-bold uppercase py-3 px-5 border-2 transition-all rounded-none cursor-pointer ${
                  showFilters
                    ? "bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-[var(--color-coolwhite)]"
                    : "bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] border-zinc-800 hover:border-[var(--color-amber)]"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "More Filters"}
              </button>

              <button
                type="submit"
                className="w-full md:w-auto bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-5 border-2 border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[3px_3px_0px_0px_rgba(234,88,12,0.4)] transition-all rounded-none cursor-pointer"
              >
                Apply Filters
              </button>
            </div>

            {/* Expandable Advanced Filter Drawer */}
            {showFilters && (
              <div className="p-5 border-t border-zinc-800 bg-[#0F0F0F] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Method */}
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Payment Method</label>
                  <div className="flex gap-2">
                    {["ALL", "UPI", "CASH", "CARD"].map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-2 font-mono text-xs uppercase border rounded-none transition-colors cursor-pointer ${
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
                    <input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2 px-2 focus:outline-none focus:border-[var(--color-amber)] rounded-none text-xs"
                    />
                    <span className="text-[var(--color-muted)]">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2 px-2 focus:outline-none focus:border-[var(--color-amber)] rounded-none text-xs"
                    />
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
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-4 font-mono text-xs uppercase text-[var(--color-muted)] hover:text-[var(--color-coolwhite)] text-right w-full cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </form>
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
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center font-mono text-xs text-[var(--color-muted)] uppercase">
                        Loading ledger records...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center font-mono text-xs text-[var(--color-muted)] uppercase">
                        No transactions match your filters.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-[var(--color-charcoal)] transition-colors group">
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-mono text-xs text-[var(--color-coolwhite)] flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-[var(--color-muted)]" />
                            {formatDate(tx.date)}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-sans text-[var(--color-coolwhite)] font-medium">
                              {tx.notes || tx.category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="bg-zinc-800 text-[var(--color-amber)] font-mono text-[10px] px-2 py-0.5 uppercase border border-zinc-700">
                                {tx.category}
                              </span>
                              {tx.isDebtRelated && (
                                <span className="bg-[var(--color-crimson)]/10 text-[var(--color-crimson)] font-mono text-[10px] px-2 py-0.5 uppercase border border-[var(--color-crimson)]/30">
                                  Debt
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-mono text-xs text-[var(--color-muted)] border border-zinc-800 px-2 py-1">
                            {tx.paymentMethod}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          {tx.receiptUrl ? (
                            <a
                              href={tx.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--color-amber)] hover:text-white font-mono text-[10px] uppercase border border-[var(--color-amber)]/30 px-2 py-1 transition-colors"
                            >
                              <Receipt className="w-3 h-3" /> View Bill
                            </a>
                          ) : (
                            <span className="text-[var(--color-muted)]">-</span>
                          )}
                        </td>

                        <td className={`p-4 text-right font-mono font-bold whitespace-nowrap ${tx.type === "INCOME" ? "text-[#21A366]" : "text-[var(--color-coolwhite)]"}`}>
                          {tx.type === "INCOME" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-center gap-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button className="text-[var(--color-muted)] hover:text-[var(--color-coolwhite)] transition-colors cursor-pointer" title="Edit Entry">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx)}
                              className="text-[var(--color-muted)] hover:text-[var(--color-crimson)] transition-colors cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}