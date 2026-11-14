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
    <>
      {/* 1. MOBILE FLOATING WIDGET: अब स्क्रॉल करने पर ऊपर-नीचे नहीं हिलेगा */}
{isCollapsed && (
  <button
    onClick={() => setIsCollapsed(false)}
    title="Open Menu"
    className="md:hidden fixed left-0 top-[42dvh] z-40 bg-[var(--color-amber)] text-[var(--color-vanta)] border-y-2 border-r-2 border-[var(--color-vanta)] py-3 px-2 shadow-[3px_3px_0px_0px_var(--color-vanta)] active:translate-x-[1px]"
  >
    <PanelLeftOpen className="w-5 h-5 stroke-[2.5]" />
  </button>
)}


      {/* 2. OVERLAY BACKDROP */}
      {!isCollapsed && (
        <div 
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        />
      )}

      {/* 3. MAIN SIDEBAR ASIDE */}
      <aside 
        className={`h-screen bg-[var(--color-coolwhite)] border-r-2 border-[var(--color-charcoal)] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? "-translate-x-full md:translate-x-0 md:w-20" 
            : "translate-x-0 w-72 shadow-[6px_0px_0px_0px_var(--color-vanta)]"
        }`}
      >
        
        {/* Logo & Toggle Area */}
        <div className={`mt-8 flex items-center mb-10 ${isCollapsed ? "justify-center" : "justify-between px-6"}`}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[var(--color-charcoal)] hover:text-[var(--color-amber)] transition-colors"
            title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <h1 className="font-sans text-2xl font-bold uppercase tracking-tight text-[var(--color-vanta)] cursor-pointer">
                AutoLedger <span className="text-[var(--color-amber)]">//</span>
              </h1>
            )}
          </button>
          
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="text-[var(--color-charcoal)] hover:text-[var(--color-amber)] transition-colors"
            >
              <PanelLeftClose className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className={`flex-1 flex flex-col gap-4 ${isCollapsed ? "px-0 items-center" : "px-5"}`}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                title={item.name}
                onClick={() => setIsCollapsed(true)}
              >
                <div
                  className={`flex items-center font-sans font-bold uppercase transition-all duration-100 border-2 ${
                    isCollapsed ? "justify-center w-11 h-11" : "gap-4 px-4 py-3"
                  } ${
                    isActive
                      ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-vanta)] shadow-[4px_4px_0px_0px_var(--color-vanta)] -translate-y-[2px] -translate-x-[2px]"
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

        {/* Logout Button at the bottom */}
        <div className={`border-t-2 border-[var(--color-charcoal)] flex ${isCollapsed ? "justify-center py-5" : "p-5"}`}>
          <button
            onClick={logout}
            title="Terminate Session"
            className={`flex items-center font-sans font-bold uppercase text-[var(--color-crimson)] border-2 border-transparent hover:border-[var(--color-crimson)] hover:bg-[var(--color-crimson)]/10 transition-colors ${
              isCollapsed ? "justify-center w-11 h-11" : "gap-4 w-full px-4 py-3"
            }`}
          >
            <LogOut className="w-5 h-5 stroke-[2.5] flex-shrink-0" />
            {!isCollapsed && <span>Terminate</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
