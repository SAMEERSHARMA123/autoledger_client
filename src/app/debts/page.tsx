"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/axios";
import { confirmPopup } from "@/lib/confirmPopup";
import { useExpenseStore } from "@/store/useExpenseStore";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  History,
  IndianRupee,
  Loader2,
} from "lucide-react";

interface DebtEntry {
  _id: string;
  date: string;
  note: string;
  amount: number;
  isOverdue?: boolean;
}

interface DebtPerson {
  _id: string;
  personName: string;
  type: "LENT" | "BORROWED";
  totalAmount: number;
  activeCount: number;
  entries: DebtEntry[];
}

interface SettledItem {
  _id: string;
  personName: string;
  note: string;
  amount: number;
  settledAt: string;
}

interface PersonCardProps {
  person: DebtPerson;
  isExpanded: boolean;
  activePartialEntry: string | null;
  partialAmount: string;
  onToggleExpand: (id: string) => void;
  onStartPartial: (entryId: string) => void;
  onCancelPartial: () => void;
  onChangePartialAmount: (val: string) => void;
  onPartialPay: (accountId: string, entry: DebtEntry) => void;
  onSettleFull: (person: DebtPerson) => void;
}

const formatShortDate = (iso: string) => new Date(iso).toISOString().slice(0, 10);

function PersonCard({
  person,
  isExpanded,
  activePartialEntry,
  partialAmount,
  onToggleExpand,
  onStartPartial,
  onCancelPartial,
  onChangePartialAmount,
  onPartialPay,
  onSettleFull,
}: PersonCardProps) {
  const firstEntry = person.entries[0];
  const isPaying = Boolean(firstEntry && activePartialEntry === firstEntry._id);

  return (
    <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[var(--shadow-brutal)] flex flex-col mb-4 rounded-none">
      <div
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-[var(--color-charcoal)] transition-colors border-b border-zinc-800/50"
        onClick={() => onToggleExpand(person._id)}
      >
        <div>
          <h3 className="font-sans font-bold text-lg text-[var(--color-coolwhite)] uppercase">
            {person.personName}
          </h3>
          <span className="font-mono text-xs text-[var(--color-muted)]">
            {person.activeCount} active {person.activeCount === 1 ? "entry" : "entries"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`font-mono text-xl font-bold ${
              person.type === "LENT" ? "text-[#21A366]" : "text-[var(--color-crimson)]"
            }`}
          >
            ₹{person.totalAmount.toLocaleString("en-IN")}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--color-muted)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--color-muted)]" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-[#0F0F0F] flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase text-[var(--color-muted)] tracking-widest border-b border-zinc-800 pb-2">
              Breakdown
            </span>
            {person.entries.map((entry) => (
              <div key={entry._id} className="flex justify-between items-start py-2">
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-[var(--color-muted)]">
                    {formatShortDate(entry.date)}
                  </span>
                  <span className="font-sans text-sm text-[var(--color-coolwhite)]">
                    {entry.note}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-sm font-bold text-[var(--color-coolwhite)]">
                    ₹{entry.amount.toLocaleString("en-IN")}
                  </span>
                  {entry.isOverdue && (
                    <span className="flex items-center gap-1 text-[var(--color-crimson)] font-mono text-[10px] uppercase mt-1">
                      <AlertCircle className="w-3 h-3" /> Overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
            {isPaying && firstEntry ? (
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                  <input
                    type="number"
                    min={1}
                    max={firstEntry.amount}
                    placeholder={`Max ₹${firstEntry.amount}`}
                    value={partialAmount}
                    onChange={(e) => onChangePartialAmount(e.target.value)}
                    autoFocus
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-700 text-[var(--color-coolwhite)] font-mono py-2 pl-9 pr-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onPartialPay(person._id, firstEntry)}
                  className="bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold text-xs uppercase px-4 py-2 border-2 border-[var(--color-amber)] hover:-translate-y-[1px] hover:-translate-x-[1px] shadow-[2px_2px_0px_0px_var(--color-vanta)] transition-all cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onCancelPartial}
                  className="text-[var(--color-muted)] font-sans font-bold text-xs uppercase px-3 py-2 hover:text-[var(--color-coolwhite)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (firstEntry) onStartPartial(firstEntry._id);
                  }}
                  className="flex-1 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold text-xs uppercase py-2 border border-zinc-700 hover:border-[var(--color-amber)] transition-colors cursor-pointer"
                >
                  Partial Payment
                </button>
                <button
                  type="button"
                  onClick={() => onSettleFull(person)}
                  className="flex items-center justify-center gap-2 flex-1 bg-[var(--color-vanta)] text-[var(--color-coolwhite)] font-sans font-bold text-xs uppercase py-2 border border-zinc-700 hover:border-[#21A366] hover:text-[#21A366] transition-colors cursor-pointer"
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
}

export default function DebtsPage() {
  const refreshDashboardData = useExpenseStore((state) => state.refreshDashboardData);

  const [toReceiveList, setToReceiveList] = useState<DebtPerson[]>([]);
  const [toPayList, setToPayList] = useState<DebtPerson[]>([]);
  const [settledHistory, setSettledHistory] = useState<SettledItem[]>([]);
  const [banners, setBanners] = useState({
    toReceive: 0,
    toReceivePeople: 0,
    toPay: 0,
    toPayPeople: 0,
    netBalance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [showSettled, setShowSettled] = useState(false);

  const [debtType, setDebtType] = useState<"LENT" | "BORROWED">("LENT");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [activePartialEntry, setActivePartialEntry] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState("");

  const syncFromResponse = useCallback((data: any) => {
    setToReceiveList(data.toReceiveList || []);
    setToPayList(data.toPayList || []);
    setSettledHistory(data.settledHistory || []);
    if (data.banners) setBanners(data.banners);
  }, []);

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/debts");
      syncFromResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load debts");
    } finally {
      setLoading(false);
    }
  }, [syncFromResponse]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((cardId) => cardId !== id) : [...prev, id]
    );
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount || Number(amount) <= 0) return;

    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/debts", {
        personName: personName.trim(),
        type: debtType,
        amount: Number(amount),
        note: note.trim(),
        date: dueDate || undefined,
      });

      syncFromResponse(data);
      if (data.account?._id) {
        setExpandedCards((prev) =>
          prev.includes(data.account._id) ? prev : [...prev, data.account._id]
        );
      }

      setPersonName("");
      setAmount("");
      setNote("");
      setDueDate("");
      refreshDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add record");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePartialPay = async (accountId: string, entry: DebtEntry) => {
    const payAmt = Number(partialAmount);
    if (!payAmt || payAmt <= 0 || payAmt > entry.amount) return;

    setError("");
    try {
      const { data } = await api.patch(
        `/debts/${accountId}/entries/${entry._id}/partial`,
        { amount: payAmt }
      );
      syncFromResponse(data);
      setActivePartialEntry(null);
      setPartialAmount("");
      refreshDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Partial payment failed");
    }
  };

  const handleSettleFull = async (person: DebtPerson) => {
    const confirmed = await confirmPopup(
      `Settle full ₹${person.totalAmount.toLocaleString("en-IN")} with ${person.personName}?`,
      "Settle Full"
    );
    if (!confirmed) return;

    setError("");
    try {
      const { data } = await api.patch(`/debts/${person._id}/settle`);
      syncFromResponse(data);
      setActivePartialEntry(null);
      refreshDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to settle");
    }
  };

  const allPersonNames = Array.from(
    new Set([...toReceiveList, ...toPayList].map((p) => p.personName))
  );

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)]">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-6 pb-12 lg:pr-10">
        <header className="mb-8 pl-4 pr-2">
          <h1 className="font-sans text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
            Debts & Settlements //
          </h1>
          <p className="font-mono text-sm text-[var(--color-muted)] mt-1 uppercase">
            Track lent & borrowed money by person
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-4 mb-8">
          <div className="bg-[var(--color-amber)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-vanta)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-vanta)]/80 mb-2 flex justify-between">
              To Receive <span>({banners.toReceivePeople} people)</span>
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight">
              ₹{banners.toReceive.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-5 shadow-[4px_4px_0px_0px_var(--color-amber)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2 flex justify-between">
              To Pay <span>({banners.toPayPeople} people)</span>
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight">
              ₹{banners.toPay.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-charcoal)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2">
              Net Balance
            </h3>
            <div
              className={`font-sans text-3xl font-bold tracking-tight ${
                banners.netBalance > 0
                  ? "text-[#21A366]"
                  : banners.netBalance < 0
                  ? "text-[var(--color-crimson)]"
                  : ""
              }`}
            >
              {banners.netBalance > 0 ? "+" : ""}₹{banners.netBalance.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div className="pl-4 mb-8">
          <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-4 shadow-[var(--shadow-brutal)] flex flex-col gap-4 rounded-none">
            {error && (
              <div className="font-mono text-xs text-[var(--color-crimson)]">{error}</div>
            )}

            <div className="flex gap-2 w-full md:w-64">
              <button
                type="button"
                onClick={() => setDebtType("LENT")}
                className={`flex-1 py-2 font-sans font-bold text-xs uppercase border-2 rounded-none transition-colors cursor-pointer ${
                  debtType === "LENT"
                    ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)]"
                    : "bg-transparent text-[var(--color-muted)] border-zinc-800 hover:border-[var(--color-coolwhite)]"
                }`}
              >
                Lent (Receive)
              </button>
              <button
                type="button"
                onClick={() => setDebtType("BORROWED")}
                className={`flex-1 py-2 font-sans font-bold text-xs uppercase border-2 rounded-none transition-colors cursor-pointer ${
                  debtType === "BORROWED"
                    ? "bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-zinc-600 shadow-[2px_2px_0px_0px_#52525B]"
                    : "bg-transparent text-[var(--color-muted)] border-zinc-800 hover:border-[var(--color-coolwhite)]"
                }`}
              >
                Borrowed (Pay)
              </button>
            </div>

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
                  {allPersonNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="relative w-full lg:w-32">
                <span className="absolute left-3 top-3 font-mono text-[var(--color-muted)]">₹</span>
                <input
                  type="number"
                  min={1}
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
                disabled={submitting}
                className="w-full lg:w-auto flex items-center justify-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-6 border-2 border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[4px_4px_0px_0px_rgba(234,88,12,0.4)] hover:shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] transition-all whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" strokeWidth={3} />
                )}
                Add Record
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="pl-4 mb-8 font-mono text-xs uppercase text-[var(--color-muted)]">
            Loading debts...
          </div>
        ) : (
          <div className="pl-4 grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col">
              <h2 className="font-sans font-bold text-xl uppercase tracking-wide text-[var(--color-vanta)] mb-4 flex items-center gap-2 border-b-2 border-[var(--color-charcoal)] pb-2">
                <span className="w-3 h-3 bg-[#21A366] inline-block border border-[var(--color-vanta)]" />
                To Receive
              </h2>
              {toReceiveList.length > 0 ? (
                toReceiveList.map((person) => (
                  <PersonCard
                    key={person._id}
                    person={person}
                    isExpanded={expandedCards.includes(person._id)}
                    activePartialEntry={activePartialEntry}
                    partialAmount={partialAmount}
                    onToggleExpand={toggleExpand}
                    onStartPartial={(entryId) => {
                      setActivePartialEntry(entryId);
                      setPartialAmount("");
                    }}
                    onCancelPartial={() => {
                      setActivePartialEntry(null);
                      setPartialAmount("");
                    }}
                    onChangePartialAmount={setPartialAmount}
                    onPartialPay={handlePartialPay}
                    onSettleFull={handleSettleFull}
                  />
                ))
              ) : (
                <div className="font-mono text-sm text-[var(--color-muted)] p-4 border border-dashed border-[var(--color-charcoal)]">
                  No pending receivables.
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h2 className="font-sans font-bold text-xl uppercase tracking-wide text-[var(--color-vanta)] mb-4 flex items-center gap-2 border-b-2 border-[var(--color-charcoal)] pb-2">
                <span className="w-3 h-3 bg-[var(--color-crimson)] inline-block border border-[var(--color-vanta)]" />
                To Pay
              </h2>
              {toPayList.length > 0 ? (
                toPayList.map((person) => (
                  <PersonCard
                    key={person._id}
                    person={person}
                    isExpanded={expandedCards.includes(person._id)}
                    activePartialEntry={activePartialEntry}
                    partialAmount={partialAmount}
                    onToggleExpand={toggleExpand}
                    onStartPartial={(entryId) => {
                      setActivePartialEntry(entryId);
                      setPartialAmount("");
                    }}
                    onCancelPartial={() => {
                      setActivePartialEntry(null);
                      setPartialAmount("");
                    }}
                    onChangePartialAmount={setPartialAmount}
                    onPartialPay={handlePartialPay}
                    onSettleFull={handleSettleFull}
                  />
                ))
              ) : (
                <div className="font-mono text-sm text-[var(--color-muted)] p-4 border border-dashed border-[var(--color-charcoal)]">
                  No pending payables.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pl-4">
          <button
            type="button"
            onClick={() => setShowSettled(!showSettled)}
            className="flex items-center gap-2 font-mono text-sm uppercase text-[var(--color-muted)] hover:text-[var(--color-vanta)] transition-colors py-2 cursor-pointer"
          >
            <History className="w-4 h-4" />
            Settled History ({settledHistory.length})
            {showSettled ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showSettled && (
            <div className="mt-4 bg-transparent border-2 border-[var(--color-charcoal)] p-4 rounded-none">
              {settledHistory.length === 0 ? (
                <div className="font-mono text-xs text-[var(--color-muted)] py-2">
                  No settled entries yet.
                </div>
              ) : (
                settledHistory.map((item, idx) => (
                  <div
                    key={item._id}
                    className={`flex justify-between items-center py-2 ${
                      idx !== settledHistory.length - 1 ? "border-b border-zinc-300" : ""
                    }`}
                  >
                    <span className="font-mono text-sm text-[var(--color-vanta)] line-through">
                      {item.personName} — {item.note} (₹{item.amount.toLocaleString("en-IN")})
                    </span>
                    <span className="font-mono text-xs text-[#21A366] uppercase">
                      Settled on {formatShortDate(item.settledAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}