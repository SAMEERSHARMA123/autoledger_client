"use client";

import { useState, useEffect } from "react";
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";

// TypeScript interface for the data we expect from your controller
interface SummaryData {
  netBalance: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  activeDebts: number;
}

export default function DashboardBanners() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Automatically sends the HttpOnly token to your Express backend
        const response = await api.get("/analytics/summary"); 
        setData(response.data.summary);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load aggregations");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // While waiting for the API, show the brutalist skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full pr-2 pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--color-charcoal)] border-2 border-zinc-800 p-6 h-32 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[var(--color-amber)] animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  // If the API fails
  if (error) {
    return (
      <div className="w-full bg-[var(--color-vanta)] border-2 border-[var(--color-crimson)] p-4 text-[var(--color-crimson)] font-mono text-sm mb-6">
        API ERROR: {error}
      </div>
    );
  }

  // Map the real data to the 4 UI Cards
  const KPI_DATA = [
    {
      id: 1,
      title: "Net Balance",
      value: formatCurrency(data?.netBalance || 0),
      colors: "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)]",
      labelColor: "text-[var(--color-vanta)]/80",
      hoverShadow: "hover:shadow-[6px_6px_0px_0px_var(--color-vanta)]",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: 2,
      title: "Monthly Inflow",
      value: formatCurrency(data?.monthlyInflow || 0),
      colors: "bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-[var(--color-charcoal)]",
      labelColor: "text-[var(--color-muted)]",
      hoverShadow: "hover:shadow-[6px_6px_0px_0px_var(--color-amber)]",
      icon: <ArrowUpRight className="w-5 h-5 text-[var(--color-amber)]" />,
    },
    {
      id: 3,
      title: "Monthly Outflow",
      value: formatCurrency(data?.monthlyOutflow || 0),
      colors: "bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] border-[var(--color-charcoal)]",
      labelColor: "text-[var(--color-muted)]",
      hoverShadow: "hover:shadow-[6px_6px_0px_0px_var(--color-amber)]",
      icon: <ArrowDownRight className="w-5 h-5 text-[var(--color-coolwhite)]/70" />,
    },
    {
      id: 4,
      title: "Active Debts",
      value: formatCurrency(data?.activeDebts || 0),
      colors: "bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-2 border-[var(--color-charcoal)]",
      labelColor: "text-[var(--color-charcoal)]",
      hoverShadow: "hover:shadow-[6px_6px_0px_0px_var(--color-vanta)]",
      icon: <CreditCard className="w-5 h-5 text-[var(--color-crimson)]" />,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full pr-2 pb-2">
      {KPI_DATA.map((card) => (
        <div
          key={card.id}
          className={`group relative overflow-hidden flex flex-col justify-between p-6 border-2 transition-all duration-200 hover:-translate-y-[4px] hover:-translate-x-[4px] cursor-default ${card.colors} ${card.hoverShadow}`}
        >
          {/* Header: Label & Icon */}
          <div className="flex justify-between items-start mb-6">
            <h2 className={`font-mono text-sm uppercase tracking-wide font-bold ${card.labelColor}`}>
              {card.title}
            </h2>
            <div className="transition-transform duration-300 group-hover:scale-110">
              {card.icon}
            </div>
          </div>
          
          {/* Main Value */}
          <div className="font-sans text-4xl font-bold tracking-tight">
            {card.value}
          </div>

          {/* Glossy/Shine highlight effect clipped inside card */}
          <div className="absolute inset-0 block -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full pointer-events-none" />
        </div>
      ))}
    </div>
  );
}