"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, CreditCard, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Ledger", icon: Wallet, path: "/ledger" },
  { name: "Debts Matrix", icon: CreditCard, path: "/debts" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside 
      className={`h-screen bg-[var(--color-coolwhite)] border-r-2 border-[var(--color-charcoal)] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-24" : "w-72"
      }`}
    >
      
      {/* 1. Logo & Toggle Area (40px top margin) */}
      <div className={`mt-[40px] flex items-center mb-12 ${isCollapsed ? "justify-center" : "justify-between px-8"}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[var(--color-charcoal)] hover:text-[var(--color-amber)] transition-colors"
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <h1 className="font-sans text-3xl font-bold uppercase tracking-tight text-[var(--color-vanta)] cursor-pointer">
              AutoLedger <span className="text-[var(--color-amber)]">//</span>
            </h1>
          )}
        </button>
        
        {/* Collapse Button when Expanded */}
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="text-[var(--color-charcoal)] hover:text-[var(--color-amber)] transition-colors"
          >
             <PanelLeftClose className="w-6 h-6 stroke-[2]" />
          </button>
        )}
      </div>

      {/* 2. Navigation Sections */}
      <nav className={`flex-1 flex flex-col gap-4 ${isCollapsed ? "px-0 items-center" : "px-5"}`}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path} title={item.name}>
              <div
                className={`flex items-center font-sans font-bold uppercase transition-all duration-100 border-2 ${
                  isCollapsed ? "justify-center w-12 h-12" : "gap-4 px-4 py-3"
                } ${
                  isActive
                    // Active State: Orange background, Dark Vanta shadow shifted right & bottom
                    ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-vanta)] shadow-[4px_4px_0px_0px_var(--color-vanta)] -translate-y-[2px] -translate-x-[2px]"
                    // Inactive State: Transparent, Dark Grey text, no shadow
                    : "bg-transparent text-[var(--color-charcoal)] border-transparent hover:bg-gray-200"
                }`}
              >
                <item.icon className="w-5 h-5 stroke-[2.5] flex-shrink-0" />
                {!isCollapsed && (
                  <span className="tracking-wide whitespace-nowrap">{item.name}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* 3. Logout Button at the bottom */}
      <div className={`border-t-2 border-[var(--color-charcoal)] flex ${isCollapsed ? "justify-center py-5" : "p-5"}`}>
        <button
          onClick={logout}
          title="Terminate Session"
          className={`flex items-center font-sans font-bold uppercase text-[var(--color-crimson)] border-2 border-transparent hover:border-[var(--color-crimson)] hover:bg-[var(--color-crimson)]/10 transition-colors ${
            isCollapsed ? "justify-center w-12 h-12" : "gap-4 w-full px-4 py-3"
          }`}
        >
          <LogOut className="w-5 h-5 stroke-[2.5] flex-shrink-0" />
          {!isCollapsed && <span>Terminate</span>}
        </button>
      </div>
    </aside>
  );
}