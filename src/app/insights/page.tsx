"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Sparkles,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  CalendarCheck,
  Loader2,
  Layers,
} from "lucide-react";

interface ExpenseRecord {
  _id: string;
  date: string;
  notes?: string;
  category: string;
  paymentMethod: string;
  amount: number;
  type: string;
  isDebtRelated?: boolean;
}

interface CategorySlice {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  denoterLabel: string;
}

interface WeeklySummaryPayload {
  weekKey: string;
  generatedAt: string;
  headline: string;
  summary: string;
  source: "gemini" | "local-fallback";
}

const THEME_SERIES_COLORS = [
  { color: "var(--color-amber)", denoterLabel: "Primary Accent" },
  { color: "var(--color-crimson)", denoterLabel: "Alert / High Impact" },
  { color: "var(--color-muted)", denoterLabel: "Secondary Neutral" },
  { color: "var(--color-coolwhite)", denoterLabel: "Surface Highlight" },
  { color: "#38BDF8", denoterLabel: "Stream Accent" },
  { color: "#A78BFA", denoterLabel: "Category Tag" },
] as const;

function getIsoWeekInfo(dateInput: Date = new Date()) {
  const utcDate = new Date(
    Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
  );
  const dayNum = utcDate.getUTCDay() || 7; // 1 = Mon ... 7 = Sun
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  const weekKey = `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  const isWeekCompletionDay = dateInput.getDay() === 0; // Sunday week completion
  return { weekKey, isWeekCompletionDay, dayNum };
}

export default function InsightsPage() {
  const user = useAuthStore((state) => state.user);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [weeklyInsight, setWeeklyInsight] = useState<WeeklySummaryPayload | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadExpenses = async () => {
      setLoading(true);
      try {
        const res = await api.get("/expenses", {
          params: { page: 1, limit: 300 },
        });
        if (!active) return;
        const list = (res.data.data || []) as ExpenseRecord[];
        setExpenses(list.filter((item) => item.type?.toUpperCase() === "EXPENSE"));
      } catch (err) {
        console.error("Failed to load expenses for insights:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadExpenses();
    return () => {
      active = false;
    };
  }, []);

  const totalSpend = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const monthlyBudget = Number(user?.monthlyBudget || 50000);
  const budgetRemaining = Math.max(0, monthlyBudget - totalSpend);
  const burnPercent =
    monthlyBudget > 0 ? Math.min(100, Math.round((totalSpend / monthlyBudget) * 100)) : 0;

  const categoryBreakdown: CategorySlice[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of expenses) {
      const key = (item.category || "OTHER").toUpperCase();
      map.set(key, (map.get(key) || 0) + Number(item.amount || 0));
    }
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const grandTotal = entries.reduce((acc, [, val]) => acc + val, 0) || 1;

    return entries.map(([category, amount], index) => {
      const palette = THEME_SERIES_COLORS[index % THEME_SERIES_COLORS.length];
      return {
        category,
        amount,
        percentage: Math.round((amount / grandTotal) * 100),
        color: palette.color,
        denoterLabel: palette.denoterLabel,
      };
    });
  }, [expenses]);

  const topCategory = categoryBreakdown[0] || {
    category: "NONE",
    amount: 0,
    percentage: 0,
    color: "var(--color-amber)",
    denoterLabel: "Primary Accent",
  };

  const debtCount = useMemo(
    () => expenses.filter((item) => Boolean(item.isDebtRelated)).length,
    [expenses]
  );

  // Weekly-once Gemini call on week completion day (Sunday) or once per completed week
  useEffect(() => {
    if (loading) return;

    const { weekKey, isWeekCompletionDay } = getIsoWeekInfo(new Date());
    const userScope = user?.id || "guest";
    const storageKey = `al_weekly_gemini_${userScope}_${weekKey}`;

    try {
      const cachedRaw = window.localStorage.getItem(storageKey);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw) as WeeklySummaryPayload;
        setWeeklyInsight(parsed);
        return;
      }
    } catch {
      // ignore storage read issues
    }

    const fallbackSummary: WeeklySummaryPayload = {
      weekKey,
      generatedAt: new Date().toISOString(),
      headline: isWeekCompletionDay
        ? `Week ${weekKey} Wrap-Up`
        : `Weekly Spending Snapshot (${weekKey})`,
      summary:
        totalSpend > 0
          ? `Total recorded spend is ₹${totalSpend.toLocaleString("en-IN")} across ${
              expenses.length
            } entries, with ${topCategory.category} leading at ${
              topCategory.percentage
            }%. ${
              isWeekCompletionDay
                ? "Week completion checkpoint reached."
                : "Automatic Gemini wrap-up runs once on week completion day (Sunday)."
            }`
          : "No expenses logged yet this period. Add entries to generate a richer weekly spending summary on week completion.",
      source: "local-fallback",
    };

    if (!isWeekCompletionDay) {
      setWeeklyInsight(fallbackSummary);
      return;
    }

    let cancelled = false;
    const runWeeklyGeminiOnce = async () => {
      setAiLoading(true);
      try {
        const { data } = await api.post("/ai/weekly-summary", {
          weekKey,
          totalSpend,
          entryCount: expenses.length,
          topCategory: topCategory.category,
          topCategoryPercent: topCategory.percentage,
          categories: categoryBreakdown.map(({ category, amount, percentage }) => ({
            category,
            amount,
            percentage,
          })),
        });

        const resolvedSource: "gemini" | "local-fallback" =
          data?.source === "local-fallback" ? "local-fallback" : "gemini";

        const payload: WeeklySummaryPayload = {
          weekKey,
          generatedAt: new Date().toISOString(),
          headline: data?.headline || `Week ${weekKey} Summary`,
          summary: data?.summary || data?.message || fallbackSummary.summary,
          source: resolvedSource,
        };

        if (!cancelled) {
          setWeeklyInsight(payload);
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(payload));
          } catch {
            // ignore storage write issues
          }
        }
      } catch {
        if (!cancelled) {
          setWeeklyInsight(fallbackSummary);
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };

    runWeeklyGeminiOnce();
    return () => {
      cancelled = true;
    };
  }, [loading, user?.id, totalSpend, expenses.length, topCategory, categoryBreakdown]);

  // Donut SVG geometry
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)] overflow-x-hidden">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-4 sm:pr-6 pb-12 lg:pr-10 overflow-x-hidden">
        {/* Header */}
        <header className="mb-8 pl-2 sm:pl-4 pr-1 sm:pr-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-sans text-3xl sm:text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
              Spending Insights
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[var(--color-muted)] mt-1 uppercase">
              3D curved overview, theme charts & weekly wrap-up
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] px-3.5 py-2 rounded-2xl shadow-[3px_3px_0px_0px_var(--color-amber)] font-mono text-xs">
            <CalendarCheck className="w-4 h-4 text-[var(--color-amber)]" />
            <span>{getIsoWeekInfo().weekKey}</span>
          </div>
        </header>

        {/* ROW 1: TWO LARGE 3D CURVED CARDS (LEFT & RIGHT) */}
        <section className="pl-2 sm:pl-4 grid grid-cols-1 lg:grid-cols-2 gap-7 mb-8">
          {/* Left 3D Curved Card: Budget & Burn */}
          <div className="relative rounded-[28px] bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-6 sm:p-7 shadow-[0_10px_0_0_var(--color-amber)] transition-transform duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase px-3 py-1 rounded-full bg-[var(--color-charcoal)] text-[var(--color-amber)] border border-zinc-700">
                <TrendingUp className="w-3.5 h-3.5" />
                3D Budget & Burn
              </span>
              <span className="font-mono text-xs text-[var(--color-muted)] uppercase">
                {burnPercent}% Used
              </span>
            </div>

            <div className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              ₹{totalSpend.toLocaleString("en-IN")}
            </div>
            <p className="font-mono text-xs text-[var(--color-muted)] mb-5">
              Budget: ₹{monthlyBudget.toLocaleString("en-IN")} • Remaining: ₹
              {budgetRemaining.toLocaleString("en-IN")}
            </p>

            {/* Smooth 3D Track */}
            <div className="w-full h-4 rounded-full bg-[var(--color-charcoal)] border border-zinc-700 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-[var(--color-amber)] transition-all duration-500"
                style={{ width: `${burnPercent}%` }}
              />
            </div>

            {/* Denoters */}
            <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-wrap items-center gap-4 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-[var(--color-coolwhite)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-amber)] inline-block" />
                Active Burn ({burnPercent}%)
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--color-muted)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-charcoal)] border border-zinc-600 inline-block" />
                Remaining Capacity ({Math.max(0, 100 - burnPercent)}%)
              </span>
            </div>
          </div>

          {/* Right 3D Curved Card: Top Drain & Debt Snapshot */}
          <div className="relative rounded-[28px] bg-[var(--color-amber)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] p-6 sm:p-7 shadow-[0_10px_0_0_var(--color-vanta)] transition-transform duration-200 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase px-3 py-1 rounded-full bg-[var(--color-vanta)] text-[var(--color-coolwhite)]">
                <Layers className="w-3.5 h-3.5 text-[var(--color-amber)]" />
                3D Drain & Debt
              </span>
              <span className="font-mono text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-[var(--color-coolwhite)]/80 text-[var(--color-vanta)]">
                {debtCount} Debt Tags
              </span>
            </div>

            <div className="font-sans text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              {topCategory.category}
            </div>
            <p className="font-mono text-xs text-[var(--color-vanta)]/85 mb-5">
              Highest category spend: ₹{topCategory.amount.toLocaleString("en-IN")} (
              {topCategory.percentage}% of total expenses)
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--color-vanta)] text-[var(--color-coolwhite)] p-3.5">
                <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">
                  Entries Tracked
                </div>
                <div className="font-sans text-xl font-bold mt-0.5">{expenses.length}</div>
              </div>
              <div className="rounded-2xl bg-[var(--color-coolwhite)] text-[var(--color-vanta)] p-3.5 border border-[var(--color-vanta)]/20">
                <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">
                  Categories Active
                </div>
                <div className="font-sans text-xl font-bold mt-0.5">
                  {categoryBreakdown.length}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROW 2: SMOOTH DONUT CHART + HORIZONTAL BAR CHART WITH DENOTERS */}
        <section className="pl-2 sm:pl-4 grid grid-cols-1 xl:grid-cols-2 gap-7 mb-8">
          {/* Smooth Donut Chart Card */}
          <div className="rounded-[26px] bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-6 shadow-[var(--shadow-brutal)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-sans text-lg font-bold uppercase flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[var(--color-amber)]" />
                Category Donut Chart
              </h2>
              <span className="font-mono text-[11px] text-[var(--color-muted)] uppercase">
                Share %
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[var(--color-amber)] animate-spin" />
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <p className="py-10 text-center font-mono text-xs text-[var(--color-muted)]">
                No expense data available for donut chart.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
                    <circle
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="none"
                      stroke="var(--color-charcoal)"
                      strokeWidth="20"
                    />
                    {categoryBreakdown.map((slice) => {
                      const dashLength = (slice.percentage / 100) * circumference;
                      const dashOffset = -(cumulativePercent / 100) * circumference;
                      cumulativePercent += slice.percentage;

                      return (
                        <circle
                          key={slice.category}
                          cx="90"
                          cy="90"
                          r={radius}
                          fill="none"
                          stroke={slice.color}
                          strokeWidth="20"
                          strokeDasharray={`${dashLength} ${circumference}`}
                          strokeDashoffset={dashOffset}
                          className="transition-all duration-500"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="font-mono text-[10px] uppercase text-[var(--color-muted)]">
                      Total
                    </span>
                    <span className="font-sans text-sm font-bold text-[var(--color-coolwhite)]">
                      ₹{totalSpend.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Color Denoters / Legend */}
                <div className="flex-1 w-full flex flex-col gap-2.5">
                  {categoryBreakdown.map((slice) => (
                    <div
                      key={slice.category}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-charcoal)] px-3.5 py-2 border border-zinc-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20"
                          style={{ backgroundColor: slice.color }}
                        />
                        <div className="truncate">
                          <div className="font-mono text-xs font-bold uppercase text-[var(--color-coolwhite)] truncate">
                            {slice.category}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--color-muted)] truncate">
                            {slice.denoterLabel}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs flex-shrink-0">
                        <div className="font-bold text-[var(--color-coolwhite)]">
                          ₹{slice.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-[var(--color-amber)]">
                          {slice.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Horizontal Bar Chart Card */}
          <div className="rounded-[26px] bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-6 shadow-[var(--shadow-brutal)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-sans text-lg font-bold uppercase flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[var(--color-amber)]" />
                Horizontal Spend Bar Chart
              </h2>
              <span className="font-mono text-[11px] text-[var(--color-muted)] uppercase">
                By Category
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[var(--color-amber)] animate-spin" />
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <p className="py-10 text-center font-mono text-xs text-[var(--color-muted)]">
                No expense data available for bar chart.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {categoryBreakdown.map((slice) => {
                  const maxVal = categoryBreakdown[0]?.amount || 1;
                  const barWidth = Math.max(6, Math.round((slice.amount / maxVal) * 100));

                  return (
                    <div key={slice.category} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="inline-flex items-center gap-2 font-bold uppercase text-[var(--color-coolwhite)]">
                          <span
                            className="w-3 h-3 rounded-sm inline-block border border-white/20"
                            style={{ backgroundColor: slice.color }}
                          />
                          {slice.category}
                          <span className="text-[10px] font-normal text-[var(--color-muted)]">
                            ({slice.denoterLabel})
                          </span>
                        </span>
                        <span className="font-bold text-[var(--color-coolwhite)]">
                          ₹{slice.amount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="w-full h-3.5 rounded-full bg-[var(--color-charcoal)] border border-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: slice.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ROW 3: WEEKLY-ONCE GEMINI SUMMARY BANNER */}
        <section className="pl-2 sm:pl-4">
          <div className="rounded-[26px] bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] p-6 shadow-[0_8px_0_0_var(--color-amber)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-[var(--color-amber)]">
                <Sparkles className="w-4 h-4" />
                <span>{weeklyInsight?.headline || "Weekly Spending Digest"}</span>
              </div>
              <span className="font-mono text-[10px] uppercase px-2.5 py-1 rounded-full bg-[var(--color-charcoal)] text-[var(--color-muted)] border border-zinc-700">
                {aiLoading
                  ? "Syncing Weekly Digest..."
                  : weeklyInsight?.source === "gemini"
                  ? "Gemini Weekly Wrap-Up (1x/Week)"
                  : "Weekly Digest Ready"}
              </span>
            </div>

            <p className="font-mono text-xs sm:text-sm text-[var(--color-coolwhite)]/90 leading-relaxed">
              {weeklyInsight?.summary || "Loading weekly spending overview..."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}