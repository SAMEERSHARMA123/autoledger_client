"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import EmptyLedgerIllustration from "@/components/EmptyLedgerIllustration";
import { api } from "@/lib/axios";
import { confirmPopup } from "@/lib/confirmPopup";
import { useAuthStore } from "@/store/useAuthStore";
import {
  exportLedgerAsCsv,
  exportLedgerAsXlsx,
  exportLedgerAsPdfStatement,
} from "@/lib/exportLedger";
import {
  Search,
  SlidersHorizontal,
  Download,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Trash2,
  Edit2,
  Calendar,
  FileSpreadsheet,
  File,
  Loader2,
  RotateCcw,
  Camera,
  X,
  ExternalLink,
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
  totalIncome: number;
  incomeCount: number;
}

const DEFAULT_SUMMARY: LedgerSummary = {
  filteredTotal: 0,
  itemCount: 0,
  highestExpense: { amount: 0, category: "NONE" },
  averageSpend: 0,
  totalIncome: 0,
  incomeCount: 0,
};

const ITEMS_PER_PAGE = 10;

export default function LedgerPage() {
  const user = useAuthStore((state) => state.user);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [exportScope, setExportScope] = useState<"CURRENT_VIEW" | "CUSTOM_RANGE">("CURRENT_VIEW");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [exportingFormat, setExportingFormat] = useState<"CSV" | "XLSX" | "PDF" | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("THIS_MONTH");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [proofStatus, setProofStatus] = useState("ALL");
  const [groupBy, setGroupBy] = useState("FLAT");
  const [isFiltered, setIsFiltered] = useState(false);

  const [transactions, setTransactions] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummary>(DEFAULT_SUMMARY);
  const [loading, setLoading] = useState(true);

  const [previewTx, setPreviewTx] = useState<LedgerItem | null>(null);

  const [editingTx, setEditingTx] = useState<LedgerItem | null>(null);
  const [editType, setEditType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("FOOD");
  const [editPaymentMethod, setEditPaymentMethod] = useState("UPI");
  const [editNotes, setEditNotes] = useState("");
  const [editIsDebt, setEditIsDebt] = useState(false);
  const [editProofUrl, setEditProofUrl] = useState("");
  const [proofError, setProofError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const closePreview = () => {
    setPreviewTx(null);
  };

  const openProofInNewTab = (url?: string) => {
    if (!url) return;

    if (!url.startsWith("data:")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const [header, base64Data] = url.split(",");
      const mimeMatch = header.match(/data:(.*?);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const byteChars = atob(base64Data);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error("Failed to open proof link:", err);
    }
  };

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

  const buildActiveFilterParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {
      ...getDateBounds(dateRange),
    };
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (paymentMethod !== "ALL") params.paymentMethod = paymentMethod;
    if (minAmount) params.minAmount = minAmount;
    if (maxAmount) params.maxAmount = maxAmount;
    if (proofStatus !== "ALL") params.proofStatus = proofStatus;
    return params;
  }, [searchQuery, dateRange, paymentMethod, minAmount, maxAmount, proofStatus]);

  const fetchLedgerData = useCallback(
    async (
      targetPage = 1,
      overrideParams?: Record<string, string>,
      includeSummary = true
    ) => {
      setLoading(true);
      try {
        const params: Record<string, string> =
          overrideParams ?? buildActiveFilterParams();

        if (!overrideParams) {
          setIsFiltered(
            Boolean(
              searchQuery.trim() ||
              dateRange !== "THIS_MONTH" ||
              paymentMethod !== "ALL" ||
              minAmount ||
              maxAmount ||
              proofStatus !== "ALL"
            )
          );
        } else {
          setIsFiltered(false);
        }

        if (includeSummary) {
          const [expensesRes, summaryRes] = await Promise.all([
            api.get("/expenses", {
              params: { ...params, page: targetPage, limit: ITEMS_PER_PAGE },
            }),
            api.get("/analytics/ledger-summary", { params }),
          ]);

          setTransactions(expensesRes.data.data || []);
          setCurrentPage(expensesRes.data.pagination?.page || targetPage);
          setTotalPages(Math.max(1, expensesRes.data.pagination?.totalPages || 1));
          setTotalItems(expensesRes.data.pagination?.total || 0);
          setSummary({
            ...DEFAULT_SUMMARY,
            ...(summaryRes.data.summary || {}),
          });
        } else {
          const expensesRes = await api.get("/expenses", {
            params: { ...params, page: targetPage, limit: ITEMS_PER_PAGE },
          });

          setTransactions(expensesRes.data.data || []);
          setCurrentPage(expensesRes.data.pagination?.page || targetPage);
          setTotalPages(Math.max(1, expensesRes.data.pagination?.totalPages || 1));
          setTotalItems(expensesRes.data.pagination?.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch ledger data:", error);
      } finally {
        setLoading(false);
      }
    },
    [buildActiveFilterParams, searchQuery, dateRange, paymentMethod, minAmount, maxAmount, proofStatus]
  );

  useEffect(() => {
    fetchLedgerData(1);
  }, []);

  const openEditModal = (tx: LedgerItem) => {
    setEditingTx(tx);
    setEditType(tx.type?.toUpperCase() === "INCOME" ? "INCOME" : "EXPENSE");
    setEditAmount(String(tx.amount));
    setEditCategory(tx.category || "FOOD");
    setEditPaymentMethod(tx.paymentMethod || "UPI");
    setEditNotes(tx.notes || "");
    setEditIsDebt(Boolean(tx.isDebtRelated));
    setEditProofUrl(tx.receiptUrl || "");
    setProofError("");
  };

  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      e.target.value = "";
      setProofError("Only image files (JPG, PNG, WEBP, etc.) are allowed.");
      return;
    }

    setProofError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditProofUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    setSavingEdit(true);

    const resolvedCategory = editType === "INCOME" ? "OTHER" : editCategory;

    try {
      const { data } = await api.put(`/expenses/${editingTx._id}`, {
        type: editType,
        amount: Number(editAmount || editingTx.amount),
        category: resolvedCategory,
        paymentMethod: editPaymentMethod,
        notes: editNotes.trim() || (editType === "INCOME" ? "Income" : ""),
        isDebtRelated: editType === "EXPENSE" ? editIsDebt : false,
        receiptUrl: editProofUrl.trim(),
      });

      const updatedDoc: LedgerItem = data?.expense || {
        ...editingTx,
        type: editType,
        amount: Number(editAmount || editingTx.amount),
        category: resolvedCategory,
        paymentMethod: editPaymentMethod,
        notes: editNotes.trim() || (editType === "INCOME" ? "Income" : ""),
        isDebtRelated: editType === "EXPENSE" ? editIsDebt : false,
        receiptUrl: editProofUrl.trim(),
      };

      setTransactions((prev) =>
        prev.map((item) => (item._id === editingTx._id ? updatedDoc : item))
      );
      if (previewTx?._id === editingTx._id) {
        setPreviewTx(updatedDoc);
      }
      setEditingTx(null);
      fetchLedgerData(currentPage, undefined, true);
    } catch (error) {
      console.error("Failed to update entry:", error);
    } finally {
      setSavingEdit(false);
    }
  };

  const getExportPayload = async () => {
    if (exportScope === "CURRENT_VIEW") {
      const res = await api.get("/expenses", {
        params: {
          ...buildActiveFilterParams(),
          page: 1,
          limit: 500,
        },
      });

      const filterParts: string[] = [`Date: ${dateRange}`];
      if (searchQuery.trim()) filterParts.push(`Search: "${searchQuery.trim()}"`);
      if (paymentMethod !== "ALL") filterParts.push(`Method: ${paymentMethod}`);
      if (minAmount || maxAmount) {
        filterParts.push(`Amt: ₹${minAmount || 0}–₹${maxAmount || "∞"}`);
      }
      if (proofStatus !== "ALL") filterParts.push(`Proof: ${proofStatus}`);

      return {
        items: (res.data.data || []) as LedgerItem[],
        scopeLabel: "Current View",
        filtersSummary: filterParts.join(" | "),
        filePrefix: `autoledger-current-view-${new Date().toISOString().slice(0, 10)}`,
      };
    }

    let start = customStartDate;
    let end = customEndDate;
    if (start && end && start > end) {
      [start, end] = [end, start];
    }

    const rangeParams: Record<string, string> = { page: "1", limit: "500" };
    if (start) {
      rangeParams.startDate = new Date(`${start}T00:00:00.000`).toISOString();
    }
    if (end) {
      rangeParams.endDate = new Date(`${end}T23:59:59.999`).toISOString();
    }

    const res = await api.get("/expenses", { params: rangeParams });
    const rawItems = (res.data.data || []) as LedgerItem[];

    const filteredItems = rawItems.filter((item) => {
      const itemTime = new Date(item.date).getTime();
      if (Number.isNaN(itemTime)) return true;
      if (start && itemTime < new Date(`${start}T00:00:00.000`).getTime()) return false;
      if (end && itemTime > new Date(`${end}T23:59:59.999`).getTime()) return false;
      return true;
    });

    return {
      items: filteredItems,
      scopeLabel: `Custom Range (${start || "Beginning"} → ${end || "Today"})`,
      filtersSummary:
        start || end
          ? `Date Window: ${start || "Start"} to ${end || "End"}`
          : "All Recorded Transactions",
      filePrefix: `autoledger-custom-${start || "all"}-to-${end || "now"}`,
    };
  };

  const handleExport = async (format: "CSV" | "XLSX" | "PDF") => {
    setExportingFormat(format);
    try {
      const { items, scopeLabel, filtersSummary, filePrefix } = await getExportPayload();

      if (format === "CSV") {
        exportLedgerAsCsv(items, filePrefix);
      } else if (format === "XLSX") {
        exportLedgerAsXlsx(items, filePrefix);
      } else {
        const expensesOnly = items.filter((i) => i.type?.toUpperCase() === "EXPENSE");
        const filteredTotal = expensesOnly.reduce((acc, i) => acc + i.amount, 0);
        const highestExpense = expensesOnly.reduce(
          (max, i) =>
            i.amount > max.amount ? { amount: i.amount, category: i.category } : max,
          { amount: 0, category: "NONE" }
        );
        const averageSpend =
          expensesOnly.length > 0
            ? Number((filteredTotal / expensesOnly.length).toFixed(2))
            : 0;
        const totalIncome = items
          .filter((i) => i.type?.toUpperCase() === "INCOME")
          .reduce((acc, i) => acc + i.amount, 0);
        const incomeCount = items.filter((i) => i.type?.toUpperCase() === "INCOME").length;

        exportLedgerAsPdfStatement(items, {
          scopeLabel,
          userName: user?.name,
          userEmail: user?.email,
          filtersSummary,
          summary: {
            filteredTotal,
            itemCount: expensesOnly.length,
            highestExpense,
            averageSpend,
            totalIncome,
            incomeCount,
          },
        });
      }
      setShowExportMenu(false);
    } catch (error) {
      console.error("Failed to export ledger data:", error);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleApplyFilters = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchLedgerData(1, undefined, true);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange("THIS_MONTH");
    setPaymentMethod("ALL");
    setMinAmount("");
    setMaxAmount("");
    setProofStatus("ALL");
    setGroupBy("FLAT");
    fetchLedgerData(1, getDateBounds("THIS_MONTH"), true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage || loading) return;
    fetchLedgerData(newPage, undefined, false);
  };

  const handleDelete = async (tx: LedgerItem) => {
    const confirmed = await confirmPopup(
      `Delete "${tx.notes || tx.category}" (₹${tx.amount}) permanently?`,
      "Delete Entry"
    );
    if (!confirmed) return;

    const prevTx = transactions;
    const prevSummary = summary;
    const prevTotal = totalItems;

    const updatedTx = prevTx.filter((item) => item._id !== tx._id);
    const isExpense = tx.type?.toUpperCase() === "EXPENSE";
    const isIncome = tx.type?.toUpperCase() === "INCOME";

    const nextTotalSpend = isExpense
      ? Math.max(0, prevSummary.filteredTotal - tx.amount)
      : prevSummary.filteredTotal;
    const nextItemCount = isExpense
      ? Math.max(0, prevSummary.itemCount - 1)
      : prevSummary.itemCount;
    const nextTotalIncome = isIncome
      ? Math.max(0, prevSummary.totalIncome - tx.amount)
      : prevSummary.totalIncome;
    const nextIncomeCount = isIncome
      ? Math.max(0, prevSummary.incomeCount - 1)
      : prevSummary.incomeCount;

    setTransactions(updatedTx);
    setTotalItems(Math.max(0, prevTotal - 1));
    setSummary({
      ...prevSummary,
      filteredTotal: nextTotalSpend,
      itemCount: nextItemCount,
      averageSpend:
        nextItemCount > 0 ? Number((nextTotalSpend / nextItemCount).toFixed(2)) : 0,
      totalIncome: nextTotalIncome,
      incomeCount: nextIncomeCount,
    });
    if (previewTx?._id === tx._id) {
      closePreview();
    }

    try {
      await api.delete(`/expenses/${tx._id}`);
      if (updatedTx.length === 0 && currentPage > 1) {
        fetchLedgerData(currentPage - 1, undefined, false);
      }
    } catch (error) {
      console.error("Failed to delete entry, rolling back:", error);
      setTransactions(prevTx);
      setSummary(prevSummary);
      setTotalItems(prevTotal);
    }
  };

  const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  const previewIsIncome = previewTx?.type?.toUpperCase() === "INCOME";

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)] overflow-x-hidden">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-4 sm:pr-6 pb-12 lg:pr-10 overflow-x-hidden">
        <header className="mb-8 pl-2 sm:pl-4 pr-1 sm:pr-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative">
          <div>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
              Ledger History
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[var(--color-muted)] mt-1 uppercase">
              Complete transaction logs & aggregations
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-5 border-2 border-[var(--color-vanta)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[3px_3px_0px_0px_var(--color-vanta)] transition-all rounded-none cursor-pointer"
            >
              <Download className="w-5 h-5" strokeWidth={2.5} />
              Export Data
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-14 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[4px_4px_0px_0px_var(--color-amber)] z-50 p-5">
                <div className="mb-4 pb-4 border-b border-zinc-800">
                  <span className="font-mono text-xs text-[var(--color-muted)] uppercase block mb-3">
                    Data Scope
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExportScope("CURRENT_VIEW")}
                      className={`flex-1 font-sans font-bold text-xs uppercase py-2 border-2 cursor-pointer ${
                        exportScope === "CURRENT_VIEW"
                          ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)]"
                          : "bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] border-zinc-700 hover:border-[var(--color-amber)]"
                      }`}
                    >
                      Current View
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportScope("CUSTOM_RANGE")}
                      className={`flex-1 font-sans font-bold text-xs uppercase py-2 border-2 cursor-pointer ${
                        exportScope === "CUSTOM_RANGE"
                          ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)]"
                          : "bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] border-zinc-700 hover:border-[var(--color-amber)]"
                      }`}
                    >
                      Custom Range
                    </button>
                  </div>

                  {exportScope === "CUSTOM_RANGE" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-[var(--color-charcoal)] border border-zinc-700 text-[var(--color-coolwhite)] font-mono text-[11px] py-1.5 px-2 focus:outline-none focus:border-[var(--color-amber)]"
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-[var(--color-charcoal)] border border-zinc-700 text-[var(--color-coolwhite)] font-mono text-[11px] py-1.5 px-2 focus:outline-none focus:border-[var(--color-amber)]"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-mono text-xs text-[var(--color-muted)] uppercase block mb-3">
                    Format {exportingFormat ? `(${exportingFormat}...)` : ""}
                  </span>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={Boolean(exportingFormat)}
                      onClick={() => handleExport("CSV")}
                      className="w-full flex items-center gap-3 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-mono text-sm py-2 px-3 hover:bg-zinc-800 border border-transparent hover:border-[var(--color-amber)] transition-colors text-left cursor-pointer disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#21A366]" /> .CSV Database
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(exportingFormat)}
                      onClick={() => handleExport("XLSX")}
                      className="w-full flex items-center gap-3 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-mono text-sm py-2 px-3 hover:bg-zinc-800 border border-transparent hover:border-[var(--color-amber)] transition-colors text-left cursor-pointer disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4 text-[#107C41]" /> .XLSX Spreadsheet
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(exportingFormat)}
                      onClick={() => handleExport("PDF")}
                      className="w-full flex items-center gap-3 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-mono text-sm py-2 px-3 hover:bg-zinc-800 border border-transparent hover:border-[var(--color-amber)] transition-colors text-left cursor-pointer disabled:opacity-50"
                    >
                      <File className="w-4 h-4 text-[var(--color-crimson)]" /> .PDF Statement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pl-2 sm:pl-4 mb-8">
          <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-5 shadow-[4px_4px_0px_0px_var(--color-amber)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2 flex justify-between">
              {isFiltered ? "Filtered Spend" : "Total Spend"} <span>({summary.itemCount} items)</span>
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight">
              {loading ? (
                <Loader2 className="w-6 h-6 text-[var(--color-amber)] animate-spin" />
              ) : (
                `₹${summary.filteredTotal.toLocaleString("en-IN")}`
              )}
            </div>
          </div>

          <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-5 shadow-[4px_4px_0px_0px_#21A366] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2 flex justify-between">
              Total Income <span>({summary.incomeCount} items)</span>
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight text-[#21A366]">
              {loading ? (
                <Loader2 className="w-6 h-6 text-[#21A366] animate-spin" />
              ) : (
                `+₹${summary.totalIncome.toLocaleString("en-IN")}`
              )}
            </div>
          </div>

          <div className="bg-[var(--color-amber)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-vanta)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-vanta)]/80 mb-2">
              Highest Expense
            </h3>
            <div className="flex items-end justify-between">
              <div className="font-sans text-3xl font-bold tracking-tight">
                {loading ? (
                  <Loader2 className="w-6 h-6 text-[var(--color-vanta)] animate-spin" />
                ) : (
                  `₹${summary.highestExpense.amount.toLocaleString("en-IN")}`
                )}
              </div>
              <span className="font-mono text-xs bg-[var(--color-vanta)] text-[var(--color-coolwhite)] px-2 py-1 uppercase">
                {summary.highestExpense.category}
              </span>
            </div>
          </div>

          <div className="bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-5 shadow-[4px_4px_0px_0px_var(--color-charcoal)] rounded-none">
            <h3 className="font-mono text-xs uppercase text-[var(--color-muted)] mb-2">
              Average Spend
            </h3>
            <div className="font-sans text-3xl font-bold tracking-tight">
              {loading ? (
                <Loader2 className="w-6 h-6 text-[var(--color-vanta)] animate-spin" />
              ) : (
                `₹${summary.averageSpend.toLocaleString("en-IN")}`
              )}
            </div>
          </div>
        </div>

        <div className="pl-2 sm:pl-4 mb-8">
          <form
            onSubmit={handleApplyFilters}
            className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[var(--shadow-brutal)] flex flex-col rounded-none"
          >
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
                className={`w-full md:w-auto flex items-center justify-center gap-2 font-sans font-bold uppercase py-3 px-5 border-2 transition-all rounded-none cursor-pointer ${showFilters
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

            {showFilters && (
              <div className="p-5 border-t border-zinc-800 bg-[#0F0F0F] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    Payment Method
                  </label>
                  <div className="flex gap-2">
                    {["ALL", "UPI", "CASH", "CARD"].map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`flex-1 py-2 font-mono text-xs uppercase border rounded-none transition-colors cursor-pointer ${paymentMethod === method
                            ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)] font-bold"
                            : "bg-transparent text-[var(--color-muted)] border-zinc-700 hover:border-[var(--color-coolwhite)]"
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    Amount Range (₹)
                  </label>
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

                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    Receipt Proof
                  </label>
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

                <div className="flex flex-col justify-between">
                  <div>
                    <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                      Group View
                    </label>
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

        <div className="pl-2 sm:pl-4">
          <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] shadow-[var(--shadow-brutal)] rounded-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-800 bg-zinc-900/50">
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 whitespace-nowrap">
                      Date
                    </th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 w-full">
                      Note & Tag
                    </th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 whitespace-nowrap">
                      Method
                    </th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 text-center whitespace-nowrap">
                      Proof
                    </th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 text-right whitespace-nowrap">
                      Amount
                    </th>
                    <th className="font-mono text-xs uppercase text-[var(--color-muted)] p-4 text-center whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center font-mono text-xs text-[var(--color-muted)] uppercase"
                      >
                        Loading ledger records...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 sm:py-16">
                        <div className="max-w-md mx-auto flex flex-col items-center text-center gap-3">
                          <EmptyLedgerIllustration className="w-32 h-32 sm:w-44 sm:h-44 shrink-0" />
                          <h3 className="font-sans text-base sm:text-lg font-bold uppercase text-[var(--color-coolwhite)]">
                            No Ledger History Yet
                          </h3>
                          <p className="font-mono text-xs text-[var(--color-muted)]">
                            {isFiltered
                              ? "No entries match your current filters. Try adjusting or resetting filters."
                              : "Add expenses or record entries to start building your ledger history."}
                          </p>
                          {isFiltered && (
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-1 inline-flex items-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold text-xs uppercase py-2 px-4 border-2 border-[var(--color-amber)] hover:-translate-y-[1px] transition-all rounded-none cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reset Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isIncome = tx.type?.toUpperCase() === "INCOME";
                      return (
                        <tr
                          key={tx._id}
                          onClick={() => setPreviewTx(tx)}
                          className="hover:bg-[var(--color-charcoal)] transition-colors group cursor-pointer"
                        >
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-mono text-xs text-[var(--color-coolwhite)] flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-[var(--color-muted)]" />
                              {formatDate(tx.date)}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="font-sans text-[var(--color-coolwhite)] font-medium">
                                {tx.notes || (isIncome ? "Income" : tx.category)}
                              </span>
                              <div className="flex items-center gap-2">
                                {isIncome ? (
                                  <span className="bg-[#21A366]/15 text-[#21A366] font-mono text-[10px] px-2 py-0.5 uppercase border border-[#21A366]/40">
                                    Income
                                  </span>
                                ) : (
                                  <span className="bg-zinc-800 text-[var(--color-amber)] font-mono text-[10px] px-2 py-0.5 uppercase border border-zinc-700">
                                    {tx.category}
                                  </span>
                                )}
                                {!isIncome && tx.isDebtRelated && (
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

                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            {tx.receiptUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewTx(tx)}
                                className="inline-flex items-center gap-1 text-[var(--color-amber)] hover:text-white font-mono text-[10px] uppercase border border-[var(--color-amber)]/30 px-2 py-1 transition-colors cursor-pointer"
                              >
                                <Receipt className="w-3 h-3" /> View Bill
                              </button>
                            ) : (
                              <span className="text-[var(--color-muted)]">-</span>
                            )}
                          </td>

                          <td
                            className={`p-4 text-right font-mono font-bold whitespace-nowrap ${
                              isIncome ? "text-[#21A366]" : "text-[var(--color-coolwhite)]"
                            }`}
                          >
                            {isIncome ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                          </td>

                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEditModal(tx)}
                                className="text-[var(--color-muted)] hover:text-[var(--color-coolwhite)] transition-colors cursor-pointer"
                                title="Edit Entry & Proof"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(tx)}
                                className="text-[var(--color-muted)] hover:text-[var(--color-crimson)] transition-colors cursor-pointer"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-4 border-t-2 border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    className="flex items-center gap-1 px-3 py-1.5 font-mono text-xs uppercase border border-zinc-700 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer rounded-none"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>

                  <span className="font-mono text-xs uppercase px-3 py-1.5 bg-[var(--color-vanta)] border border-zinc-800 text-[var(--color-coolwhite)]">
                    Page <span className="text-[var(--color-amber)] font-bold">{currentPage}</span> / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    className="flex items-center gap-1 px-3 py-1.5 font-mono text-xs uppercase border border-zinc-700 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] hover:border-[var(--color-amber)] hover:text-[var(--color-amber)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer rounded-none"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="font-mono text-[11px] uppercase text-[var(--color-muted)]">
                  Showing {startItem}–{endItem} of {totalItems} entries
                </span>
              </div>
            )}
          </div>
        </div>

        {previewTx && (
          <div
            onClick={closePreview}
            className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] shadow-none p-6 sm:p-8 flex flex-col gap-6"
            >
              <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <span className="font-mono text-[11px] uppercase text-[var(--color-amber)] block">
                    {previewIsIncome ? "Income Detail Preview" : "Expense Detail Preview"}
                  </span>
                  <h2 className="font-sans text-2xl sm:text-3xl font-bold uppercase mt-1">
                    {previewTx.notes || (previewIsIncome ? "Income" : previewTx.category)}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closePreview}
                  className="p-2 border border-zinc-800 text-[var(--color-muted)] hover:text-white hover:border-[var(--color-amber)] cursor-pointer"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`grid grid-cols-2 ${previewIsIncome ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-4 border-b border-zinc-800 pb-5`}>
                <div className="bg-[var(--color-charcoal)] border border-zinc-800 p-3.5">
                  <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">
                    Amount
                  </div>
                  <div
                    className={`font-mono text-lg font-bold mt-1 ${
                      previewIsIncome ? "text-[#21A366]" : "text-[var(--color-amber)]"
                    }`}
                  >
                    {previewIsIncome ? "+" : "-"}₹
                    {previewTx.amount.toLocaleString("en-IN")}
                  </div>
                </div>

                {!previewIsIncome && (
                  <div className="bg-[var(--color-charcoal)] border border-zinc-800 p-3.5">
                    <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">
                      Category
                    </div>
                    <div className="font-mono text-sm font-bold uppercase mt-1">
                      {previewTx.category}
                    </div>
                  </div>
                )}

                <div className="bg-[var(--color-charcoal)] border border-zinc-800 p-3.5">
                  <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">
                    Method
                  </div>
                  <div className="font-mono text-sm font-bold uppercase mt-1">
                    {previewTx.paymentMethod}
                  </div>
                </div>

                <div className="bg-[var(--color-charcoal)] border border-zinc-800 p-3.5">
                  <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">
                    Date
                  </div>
                  <div className="font-mono text-sm font-bold mt-1">
                    {formatDate(previewTx.date)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase text-[var(--color-muted)]">
                    Proof / Receipt Image
                  </span>
                  {previewTx.receiptUrl && (
                    <button
                      type="button"
                      onClick={() => openProofInNewTab(previewTx.receiptUrl)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-[var(--color-amber)] hover:underline cursor-pointer"
                    >
                      Open Full Image <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {previewTx.receiptUrl ? (
                  <div className="w-full bg-[var(--color-charcoal)] border border-zinc-800 p-3 flex items-center justify-center">
                    <img
                      src={previewTx.receiptUrl}
                      alt={previewTx.notes || previewTx.category}
                      className="w-full max-h-[420px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full bg-[var(--color-charcoal)] border border-dashed border-zinc-800 py-10 px-4 text-center font-mono text-xs text-[var(--color-muted)]">
                    No proof image attached to this entry.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    const target = previewTx;
                    closePreview();
                    openEditModal(target);
                  }}
                  className="px-4 py-2 font-mono text-xs uppercase bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] border border-zinc-700 hover:border-[var(--color-amber)] cursor-pointer"
                >
                  Edit Entry
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="px-5 py-2 font-sans text-xs font-bold uppercase bg-[var(--color-amber)] text-[var(--color-vanta)] border border-[var(--color-amber)] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {editingTx && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveEdit}
              className="w-full max-w-md bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-amber)] shadow-[6px_6px_0px_0px_var(--color-amber)] p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="font-sans text-base font-bold uppercase">Edit Entry & Proof</h2>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="text-[var(--color-muted)] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex border border-zinc-800 bg-[var(--color-charcoal)]">
                <button
                  type="button"
                  onClick={() => setEditType("EXPENSE")}
                  className={`flex-1 py-2 font-mono text-xs uppercase font-bold cursor-pointer ${
                    editType === "EXPENSE"
                      ? "bg-[var(--color-amber)] text-[var(--color-vanta)]"
                      : "text-[var(--color-muted)] hover:text-white"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditType("INCOME");
                    setEditIsDebt(false);
                  }}
                  className={`flex-1 py-2 font-mono text-xs uppercase font-bold cursor-pointer ${
                    editType === "INCOME"
                      ? "bg-[#21A366] text-white"
                      : "text-[var(--color-muted)] hover:text-white"
                  }`}
                >
                  Income
                </button>
              </div>

              <div className={`grid ${editType === "EXPENSE" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                <div>
                  <label className="font-mono text-[10px] uppercase text-[var(--color-muted)] block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 px-3 py-2 font-mono text-xs focus:outline-none focus:border-[var(--color-amber)]"
                  />
                </div>
                {editType === "EXPENSE" && (
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[var(--color-muted)] block mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-[var(--color-charcoal)] border border-zinc-800 px-3 py-2 font-mono text-xs focus:outline-none focus:border-[var(--color-amber)]"
                    >
                      <option value="FOOD">FOOD</option>
                      <option value="TRAVEL">TRAVEL</option>
                      <option value="BILLS">BILLS</option>
                      <option value="SHOPPING">SHOPPING</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                )}
              </div>

              <div className={`grid ${editType === "EXPENSE" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                <div>
                  <label className="font-mono text-[10px] uppercase text-[var(--color-muted)] block mb-1">
                    Method
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 px-3 py-2 font-mono text-xs focus:outline-none focus:border-[var(--color-amber)]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>
                {editType === "EXPENSE" && (
                  <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 font-mono text-xs uppercase text-[var(--color-muted)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsDebt}
                        onChange={(e) => setEditIsDebt(e.target.checked)}
                        className="accent-[var(--color-amber)]"
                      />
                      Debt Related
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-[var(--color-muted)] block mb-1">
                  {editType === "INCOME" ? "Source / Note" : "Note"}
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={editType === "INCOME" ? "Salary, refund, allowance..." : "Expense note..."}
                  className="w-full bg-[var(--color-charcoal)] border border-zinc-800 px-3 py-2 font-mono text-xs focus:outline-none focus:border-[var(--color-amber)]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[10px] uppercase text-[var(--color-muted)]">
                    Receipt Proof (Upload / Capture Image Only)
                  </label>
                  {editProofUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditProofUrl("");
                        setProofError("");
                      }}
                      className="font-mono text-[10px] uppercase text-[var(--color-crimson)] hover:underline cursor-pointer"
                    >
                      Remove Proof
                    </button>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 w-full bg-[var(--color-charcoal)] border border-dashed border-zinc-700 hover:border-[var(--color-amber)] py-2.5 px-3 font-mono text-xs text-[var(--color-coolwhite)] cursor-pointer">
                  <Camera className="w-4 h-4 text-[var(--color-amber)]" />
                  <span>{editProofUrl ? "Change Proof Image" : "Capture or Choose Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleProofImageChange}
                    className="hidden"
                  />
                </label>
                {proofError && (
                  <p className="mt-1.5 font-mono text-[11px] text-[var(--color-crimson)]">
                    {proofError}
                  </p>
                )}
                {editProofUrl && (
                  <div className="mt-2.5 bg-[var(--color-charcoal)] border border-zinc-800 p-2 flex items-center justify-center">
                    <img
                      src={editProofUrl}
                      alt="Proof preview"
                      className="max-h-36 object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 font-mono text-xs uppercase bg-[var(--color-charcoal)] text-[var(--color-muted)] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 font-sans text-xs font-bold uppercase bg-[var(--color-amber)] text-[var(--color-vanta)] border border-[var(--color-amber)] cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}