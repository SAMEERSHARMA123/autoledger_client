"use client";

export default function AuthArtPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-white p-12 flex-col justify-between">
      
      {/* Top Brand Header (बिना // के) */}
      <div className="flex items-center gap-3">
        <img src="/slogo (2).svg" alt="AutoLedger" className="w-9 h-9 object-contain" />
        <span className="font-sans text-xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
          AutoLedger
        </span>
      </div>

      {/* Center Bauhaus Geometric Artwork */}
      <div className="my-10 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-3.5 w-60 h-60">
          <div className="bg-[var(--color-vanta)] rounded-tl-full" />
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-[var(--color-amber)] rotate-45" />
          </div>
          <div className="bg-[var(--color-vanta)] rounded-tr-full" />

          <div className="bg-zinc-100" />
          <div className="bg-zinc-300 rounded-full" />
          <div className="bg-[var(--color-vanta)] rounded-br-full" />

          <div className="bg-[var(--color-muted)] rounded-bl-full" />
          <div className="flex items-end justify-center pb-1">
            <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[52px] border-b-[var(--color-vanta)]" />
          </div>
          <div className="bg-[var(--color-muted)] rounded-tr-full" />
        </div>
      </div>

      {/* Bottom Value Proposition (User-Focused & Natural Text) */}
      <div>
        <h2 className="font-sans text-2xl font-bold uppercase text-[var(--color-vanta)] leading-tight mb-2">
          Master Your Daily Expenses.
        </h2>
        <p className="font-sans text-sm text-[var(--color-muted)] leading-relaxed mb-6">
          Log daily spending in seconds, split bills effortlessly with friends, and stay on top of your monthly budget.
        </p>
        
        <div className="grid grid-cols-3 gap-4 border-t border-zinc-200 pt-4">
          <div>
            <div className="font-sans font-bold text-base text-[var(--color-vanta)]">Smart</div>
            <div className="font-mono text-[10px] text-[var(--color-muted)] uppercase">Expense Logs</div>
          </div>
          <div>
            <div className="font-sans font-bold text-base text-[var(--color-amber)]">Clear</div>
            <div className="font-mono text-[10px] text-[var(--color-muted)] uppercase">Debt Tracking</div>
          </div>
          <div>
            <div className="font-sans font-bold text-base text-[var(--color-vanta)]">Visual</div>
            <div className="font-mono text-[10px] text-[var(--color-muted)] uppercase">Spend Insights</div>
          </div>
        </div>
      </div>

    </div>
  );
}
