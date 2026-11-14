"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, PieChart } from "lucide-react";

const pulseData = [
  { day: "MON", amount: 120, height: "25%" },
  { day: "TUE", amount: 340, height: "50%" },
  { day: "WED", amount: 850, height: "100%", isMax: true },
  { day: "THU", amount: 200, height: "35%" },
  { day: "FRI", amount: 450, height: "60%" },
  { day: "SAT", amount: 550, height: "75%" },
  { day: "SUN", amount: 90, height: "15%" },
];

const splitData = [
  { name: "FOOD", percent: 55, color: "bg-[var(--color-amber)]" },
  { name: "BILLS", percent: 30, color: "bg-[var(--color-coolwhite)]" },
  { name: "TRAVEL", percent: 15, color: "bg-[var(--color-muted)]" },
];

export default function DashboardPulse() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 } // मोबाइल पर जल्दी ट्रिगर होने के लिए 0.15 किया है
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
        
        {/* =========================================
            LEFT BOX: 7-DAY SPENDING PULSE (65% Width)
        ========================================= */}
        <div className="lg:col-span-2 bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-5 shadow-[var(--shadow-brutal)] flex flex-col">
          <div className="border-b border-zinc-800 pb-4 mb-6 flex justify-between items-center">
            <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--color-amber)]" />
              7-Day Pulse //
            </h2>
            <span className="font-mono text-xs text-[var(--color-muted)] uppercase border border-zinc-800 px-2 py-1">Last 7 Days</span>
          </div>
          
          {/* 1. यहाँ h-64 sm:h-72 फिक्स्ड ऊँचाई दी है ताकि मोबाइल पर बार्स गायब न हों और ऊँचे दिखें */}
          <div className="flex items-end justify-between gap-2 sm:gap-4 h-64 sm:h-72 pt-6">
            {pulseData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-3 w-full h-full justify-end group">
                {/* 2. flex-1 min-h-0 देने से अंदर का h-full प्रतिशत सही काम करेगा */}
                <div className="relative flex flex-col items-center w-full justify-end flex-1 min-h-0">
                  <span className="absolute -top-6 font-mono text-[10px] sm:text-xs text-[var(--color-coolwhite)] opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{data.amount}
                  </span>
                  <div 
                    className={`w-full max-w-[36px] sm:max-w-[44px] border border-zinc-800 transition-colors ${
                      inView ? "animate-chart-bar" : "scale-y-0"
                    } ${
                      data.isMax ? "bg-[var(--color-amber)]" : "bg-[var(--color-muted)] group-hover:bg-zinc-500"
                    }`}
                    style={{ 
                      height: data.height,
                      animationDelay: inView ? `${index * 0.14}s` : "0s"
                    }}
                  />
                </div>
                <span className={`font-mono text-[10px] sm:text-xs uppercase ${data.isMax ? "text-[var(--color-amber)] font-bold" : "text-[var(--color-muted)]"}`}>
                  {data.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================
            RIGHT BOX: CATEGORY SPLIT (35% Width)
        ========================================= */}
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
              {splitData.map((item) => (
                <div 
                  key={item.name} 
                  className={`h-full ${item.color} border-r border-zinc-900 last:border-r-0`}
                  style={{ width: `${item.percent}%` }}
                />
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {splitData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${item.color} border border-zinc-800`} />
                    <span className="font-mono text-sm text-[var(--color-coolwhite)] uppercase">{item.name}</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-[var(--color-muted)]">
                    {item.percent}%
                  </div>
                </div>
              ))}
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
