"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Ledger", icon: Wallet, path: "/ledger" },
  { name: "Debts Matrix", icon: CreditCard, path: "/debts" },
  { name: "Insights", icon: BarChart3, path: "/insights" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <>
      {/* 1. Mobile Floating Widget */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          title="Open Menu"
          className="md:hidden fixed left-0 top-[42dvh] z-40 bg-[var(--color-amber)] text-[var(--color-vanta)] border-y-2 border-r-2 border-[var(--color-vanta)] py-3 px-2 shadow-[3px_3px_0px_0px_var(--color-vanta)] active:translate-x-[1px]"
        >
          <PanelLeftOpen className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* 2. Overlay Backdrop */}
      {!isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        />
      )}

      {/* 3. Main Sidebar Aside */}
      <aside
        className={`h-screen bg-[var(--color-coolwhite)] border-r-2 border-[var(--color-charcoal)] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "-translate-x-full md:translate-x-0 md:w-20"
            : "translate-x-0 w-72 shadow-[6px_0px_0px_0px_var(--color-vanta)]"
        }`}
      >
        {/* Collapse / Expand Toggle Centered Vertically on Right Border */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
          className={`hidden md:flex items-center justify-center w-7 h-7 bg-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] text-[var(--color-charcoal)] hover:bg-[var(--color-amber)] hover:text-[var(--color-vanta)] transition-colors absolute -right-[15px] top-1/2 -translate-y-1/2 z-50 cursor-pointer shadow-[2px_2px_0px_0px_var(--color-vanta)] ${
            !isCollapsed ? "!flex" : ""
          }`}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>

        {/* Logo Area */}
        <div className={`mt-8 flex items-center mb-10 ${isCollapsed ? "justify-center" : "px-6"}`}>
          <Link href="/" onClick={() => setIsCollapsed(true)} className="flex items-center gap-3">
            <img
              src="/slogo (2).svg"
              alt="AutoLedger Logo"
              className="w-13 h-13 object-contain flex-shrink-0"
            />
          </Link>
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