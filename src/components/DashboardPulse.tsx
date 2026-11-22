"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, PieChart } from "lucide-react";
import { useExpenseStore } from "@/store/useExpenseStore";

const SPLIT_COLORS = [
  "bg-[var(--color-amber)]",
  "bg-[var(--color-coolwhite)]",
  "bg-[var(--color-muted)]",
];

export default function DashboardPulse() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { sevenDayPulse, categorySplit } = useExpenseStore((state) => state.insights);
  const isLoading = useExpenseStore((state) => state.isLoading);

  const maxSpend = Math.max(...sevenDayPulse.map((d) => d.amount), 1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes chartGrow {
          0% { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
        @keyframes chartGrowHorizontal {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .animate-chart-bar {
          transform-origin: bottom;
          animation: chartGrow 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-chart-horizontal {
          transform-origin: left;
          animation: chartGrowHorizontal 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both;
        }
      `}} />

      <div ref={sectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 w-full">
        
        {/* LEFT BOX: 7-DAY SPENDING PULSE */}
        <div className="lg:col-span-2 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-5 shadow-[var(--shadow-brutal)] flex flex-col">
          <div className="border-b border-zinc-800 pb-4 mb-6 flex justify-between items-center">
            <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--color-amber)]" />
              7-Day Pulse //
            </h2>
            <span className="font-mono text-xs text-[var(--color-muted)] uppercase border border-zinc-800 px-2 py-1">
              Last 7 Days
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-4 h-64 sm:h-72 pt-6">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center font-mono text-xs text-[var(--color-muted)] uppercase">
                Loading pulse...
              </div>
            ) : (
              sevenDayPulse.map((data, index) => {
                const heightPercent =
                  data.amount > 0 ? Math.max(8, Math.round((data.amount / maxSpend) * 100)) : 4;

                return (
                  <div
                    key={data.date}
                    className="flex flex-col items-center gap-3 w-full h-full justify-end group"
                  >
                    <div className="relative flex flex-col items-center w-full justify-end flex-1 min-h-0">
                      <span className="absolute -top-6 font-mono text-[10px] sm:text-xs text-[var(--color-coolwhite)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₹{data.amount.toLocaleString("en-IN")}
                      </span>
                      <div
                        className={`w-full max-w-[36px] sm:max-w-[44px] border border-zinc-800 transition-colors ${
                          inView ? "animate-chart-bar" : "scale-y-0"
                        } ${
                          data.isHighest
                            ? "bg-[var(--color-amber)]"
                            : data.amount > 0
                            ? "bg-[var(--color-muted)] group-hover:bg-zinc-500"
                            : "bg-zinc-800"
                        }`}
                        style={{
                          height: `${heightPercent}%`,
                          animationDelay: inView ? `${index * 0.14}s` : "0s",
                        }}
                      />
                    </div>
                    <span
                      className={`font-mono text-[10px] sm:text-xs uppercase ${
                        data.isHighest
                          ? "text-[var(--color-amber)] font-bold"
                          : "text-[var(--color-muted)]"
                      }`}
                    >
                      {data.day}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT BOX: CATEGORY SPLIT */}
        <div className="lg:col-span-1 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-5 shadow-[var(--shadow-brutal)] flex flex-col">
          <div className="border-b border-zinc-800 pb-4 mb-6">
            <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[var(--color-amber)]" />
              Category Split
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div
              className={`w-full h-4 flex bg-zinc-900 border border-zinc-800 mb-8 ${
                inView ? "animate-chart-horizontal" : "scale-x-0"
              }`}
            >
              {categorySplit.length > 0 ? (
                categorySplit.map((item, idx) => (
                  <div
                    key={item.category}
                    className={`h-full ${SPLIT_COLORS[idx] || "bg-zinc-700"} border-r border-zinc-900 last:border-r-0`}
                    style={{ width: `${item.percentage}%` }}
                  />
                ))
              ) : (
                <div className="w-full h-full bg-zinc-800" />
              )}
            </div>

            <div className="flex flex-col gap-4">
              {categorySplit.length === 0 ? (
                <span className="font-mono text-xs text-[var(--color-muted)] uppercase text-center">
                  No expenses this month
                </span>
              ) : (
                categorySplit.map((item, idx) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 ${SPLIT_COLORS[idx] || "bg-zinc-700"} border border-zinc-800`} />
                      <span className="font-mono text-sm text-[var(--color-coolwhite)] uppercase">
                        {item.category}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold text-[var(--color-muted)]">
                      {item.percentage}%
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800 text-center">
              <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-widest">
                Top 3 Expense Drains
              </span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}