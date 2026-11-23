"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowRight, AlertTriangle, Flame, Target, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/axios";
import { confirmPopup } from "@/lib/confirmPopup";
import { useExpenseStore, ExpenseItem } from "@/store/useExpenseStore";
import { expenseAdded, expenseFailed } from "@/lib/notifyAction";

export default function DashboardWidgets() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("FOOD");
  const [mode, setMode] = useState("UPI");
  const [note, setNote] = useState("");
  const [isDebt, setIsDebt] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const recentExpenses = useExpenseStore((state) => state.recentExpenses);
  const insights = useExpenseStore((state) => state.insights);
  const listLoading = useExpenseStore((state) => state.isLoading);
  const refreshDashboardData = useExpenseStore((state) => state.refreshDashboardData);
  const deleteExpense = useExpenseStore((state) => state.deleteExpense);

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const numericAmount = Number(amount);
    const trimmedNote = note.trim();

    setLoading(true);
    setError("");

    try {
      await api.post("/expenses", {
        amount: numericAmount,
        type: "EXPENSE",
        category,
        paymentMethod: mode,
        notes: trimmedNote,
        isDebtRelated: isDebt,
      });

      expenseAdded(
        `₹${numericAmount.toLocaleString("en-IN")} • ${category}${trimmedNote ? ` (${trimmedNote})` : ""}`
      );

      setAmount("");
      setNote("");
      setIsDebt(false);

      await refreshDashboardData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to log expense";
      setError(msg);
      expenseFailed(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (item: ExpenseItem) => {
    const confirmed = await confirmPopup(
      `Delete "${item.notes || item.category}" (₹${item.amount}) permanently?`,
      "Delete Expense"
    );
    if (!confirmed) return;

    try {
      await deleteExpense(item);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete expense";
      setError(msg);
      expenseFailed(msg);
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-6 w-full">

      {/* 1. QUICK MANUAL ENTRY BAR */}
      <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-4 shadow-[var(--shadow-brutal)]">
        {error && (
          <div className="text-[var(--color-crimson)] font-mono text-xs mb-3">
            Error: {error}
          </div>
        )}
        <form className="flex flex-col md:flex-row items-center gap-3 w-full" onSubmit={handleLogExpense}>
          <div className="relative w-full md:w-32 flex-shrink-0">
            <span className="absolute left-3 top-3 font-mono text-[var(--color-muted)]">₹</span>
            <input
              type="number"
              placeholder="0.00"
              min={1}
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

          <label className="flex items-center gap-2 cursor-pointer font-mono text-sm uppercase text-[var(--color-muted)] hover:text-white transition-colors select-none">
            <input
              type="checkbox"
              checked={isDebt}
              onChange={(e) => setIsDebt(e.target.checked)}
              className="w-5 h-5 accent-[var(--color-amber)] bg-[var(--color-charcoal)] border-zinc-800 rounded-none cursor-pointer"
            />
            Debt?
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-6 border-2 border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[4px_4px_0px_0px_rgba(234,88,12,0.4)] hover:shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] transition-all cursor-pointer disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <Plus className="w-5 h-5" strokeWidth={3} />}
            Log Expense
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 2. RECENT ACTIVITY */}
        <div className="lg:col-span-2 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] flex flex-col shadow-[var(--shadow-brutal)]">
          <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)]">
              Recent Activity //
            </h2>
          </div>

          <div className="flex flex-col flex-1">
            {listLoading ? (
              <div className="p-8 text-center font-mono text-xs text-[var(--color-muted)] uppercase animate-pulse">
                Loading expenses...
              </div>
            ) : recentExpenses.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-[var(--color-muted)] uppercase">
                No expenses recorded yet.
              </div>
            ) : (
              recentExpenses.map((item) => (
                <div key={item._id} className="group flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-[var(--color-charcoal)] transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="bg-[var(--color-charcoal)] text-[var(--color-amber)] font-mono text-xs px-2 py-1 uppercase font-bold border border-zinc-700 flex-shrink-0">
                      {item.category}
                    </span>
                    <span className="font-sans text-[var(--color-coolwhite)] truncate">
                      {item.notes || item.category}
                    </span>
                    {item.paymentMethod && (
                      <span className="hidden sm:inline-block font-mono text-xs text-[var(--color-muted)] border border-zinc-800 px-2 py-0.5 flex-shrink-0">
                        {item.paymentMethod}
                      </span>
                    )}
                    {item.isDebtRelated && (
                      <span className="font-mono text-[10px] text-[var(--color-crimson)] border border-[var(--color-crimson)] px-1.5 py-0.5 uppercase flex-shrink-0">
                        Debt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-2">
                    <span className="font-mono font-bold text-[var(--color-coolwhite)]">
                      ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(item)}
                      title="Delete Expense"
                      className="text-zinc-600 hover:text-[var(--color-crimson)] transition-colors sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 flex justify-end bg-[var(--color-charcoal)]/30">
            <Link href="/ledger" className="flex items-center gap-2 font-mono text-xs uppercase text-[var(--color-amber)] hover:text-white transition-colors font-bold tracking-widest">
              View All Ledger <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYTICS & ALERTS */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* 3. Safe-To-Spend & Burn Rate */}
          <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-5 shadow-[var(--shadow-brutal)]">
            <h3 className="font-sans font-bold text-sm uppercase text-[var(--color-muted)] flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-[var(--color-amber)]" /> Burn Rate Analysis
            </h3>

            <div className="mb-6">
              <div className="font-mono text-[var(--color-muted)] text-xs uppercase mb-1">Daily Safe Limit</div>
              <div className="font-sans text-2xl font-bold text-[var(--color-coolwhite)]">
                ₹{insights.burnRate.dailySafeLimit.toLocaleString("en-IN")}{" "}
                <span className="text-sm font-mono text-[var(--color-muted)] font-normal">/ day</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono text-xs uppercase mb-2">
                <span className="text-[var(--color-muted)]">Monthly Burn</span>
                <span className="text-[var(--color-amber)] font-bold">
                  {insights.burnRate.monthlyBurnPercent}% Spent
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--color-charcoal)] border border-zinc-700">
                <div
                  className="h-full bg-[var(--color-amber)] transition-all duration-500"
                  style={{ width: `${insights.burnRate.monthlyBurnPercent}%` }}
                />
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
                Highest Drain:{" "}
                <span className="text-[var(--color-crimson)] font-bold uppercase">
                  {insights.topDrain.category}
                </span>{" "}
                ({insights.topDrain.percentage}% of total)
              </div>
            </div>

            <div>
              <div className="font-sans font-bold text-sm uppercase text-[var(--color-muted)] flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[var(--color-amber)]" /> Debt Action
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-[var(--color-coolwhite)]">
                  {insights.pendingDebtsCount} Pending{" "}
                  {insights.pendingDebtsCount === 1 ? "Settlement" : "Settlements"}
                </span>
                <Link
                  href="/debts"
                  className="bg-[var(--color-charcoal)] text-[var(--color-amber)] font-sans font-bold text-xs uppercase px-3 py-1.5 border border-zinc-700 hover:border-[var(--color-amber)] transition-colors"
                >
                  Settle
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}