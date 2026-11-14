"use client";

import Sidebar from "@/components/Sidebar";
import DashboardBanners from "@/components/DashboardBanners";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)]">
      <Sidebar />
      
      {/* 
        Main content wrapper. 
        pl-24 is for collapsed sidebar space, pl-72 if expanded. 
        For now, md:pl-24 assumes the default collapsed space on load.
      */}
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-6 pb-6 lg:pr-10">
        
        {/* Page Header */}
        <header className="mb-10 pl-4">
          <h1 className="font-sans text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
            Command Center //
          </h1>
          <p className="font-mono text-sm text-[var(--color-muted)] mt-1 uppercase">
            Real-time Database Aggregations
          </p>
        </header>

        {/* The Colored Banners */}
        <div className="pl-4">
          <DashboardBanners />
        </div>

        {/* Charts will go here later */}

      </main>
    </div>
  );
}