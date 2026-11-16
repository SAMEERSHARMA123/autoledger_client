"use client";

import { useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { Camera, Trash2, Save, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  // Profile State
  const [displayName, setDisplayName] = useState(user?.name || "System Admin");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Budget State
  const [budgetLimit, setBudgetLimit] = useState("50000");
  const [alertThreshold, setAlertThreshold] = useState("80%");

  // Preferences State
  const [language, setLanguage] = useState("English");
  const [currency, setCurrency] = useState("₹ INR");

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)]">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-6 pb-12 lg:pr-10">
        
        {/* =========================================
            1. INLINE PAGE HEADER
        ========================================= */}
        <header className="mb-8 pl-4">
          <h1 className="font-sans text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
            Account Settings //
          </h1>
          <p className="font-mono text-sm text-[var(--color-muted)] mt-1 uppercase">
            Manage profile, preferences & budget limits
          </p>
        </header>

        {/* =========================================
            2-COLUMN GRID LAYOUT
        ========================================= */}
        <div className="pl-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* =========================================
              LEFT COLUMN
          ========================================= */}
          <div className="flex flex-col gap-8">
            
            {/* CARD 1: PROFILE & IDENTITY */}
            <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-6 shadow-[var(--shadow-brutal)] flex flex-col rounded-none">
              <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] mb-6 border-b border-zinc-800 pb-2">
                Profile & Identity
              </h2>
              
              {/* Avatar Upload */}
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-[var(--color-charcoal)] border-2 border-[var(--color-amber)] flex items-center justify-center overflow-hidden rounded-none flex-shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-mono font-bold text-[var(--color-muted)] text-2xl">{displayName.charAt(0)}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 font-sans font-bold text-xs uppercase text-[var(--color-vanta)] bg-[var(--color-amber)] border-2 border-[var(--color-amber)] px-4 py-2 hover:bg-[var(--color-amber)]/90 transition-colors rounded-none"
                  >
                    <Camera className="w-4 h-4" /> Upload Photo
                  </button>
                  <button 
                    onClick={removePhoto}
                    className="flex items-center gap-2 font-sans font-bold text-xs uppercase text-[var(--color-muted)] hover:text-[var(--color-crimson)] transition-colors px-2 py-1"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>

              {/* Inputs */}
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2.5 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Email Address (Read Only)</label>
                  <input 
                    type="email" 
                    value={user?.email || "admin@autoledger.com"}
                    readOnly
                    className="w-full bg-zinc-900 border border-zinc-800 text-[var(--color-muted)] font-mono py-2.5 px-3 cursor-not-allowed rounded-none"
                  />
                </div>
              </div>

              <button className="flex items-center justify-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-6 border-2 border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[3px_3px_0px_0px_rgba(234,88,12,0.4)] hover:shadow-[3px_3px_0px_0px_rgba(234,88,12,1)] transition-all rounded-none">
                <Save className="w-4 h-4 stroke-[3]" /> Save Profile
              </button>
            </div>

            {/* CARD 2: BUDGET & ALERT LIMITS */}
            <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-6 shadow-[var(--shadow-brutal)] flex flex-col rounded-none">
              <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] mb-6 border-b border-zinc-800 pb-2">
                Budget & Alert Limits
              </h2>
              
              <div className="flex flex-col gap-6 mb-6">
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Monthly Budget Limit (₹)</label>
                  <input 
                    type="number" 
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2.5 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  />
                </div>
                
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Alert Warning Threshold</label>
                  <div className="flex gap-3">
                    {["75%", "80%", "90%"].map((percent) => (
                      <button 
                        key={percent}
                        onClick={() => setAlertThreshold(percent)}
                        className={`flex-1 py-2 font-mono text-sm border-2 rounded-none transition-all ${
                          alertThreshold === percent 
                          ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)] font-bold" 
                          : "bg-transparent text-[var(--color-coolwhite)] border-zinc-700 hover:border-[var(--color-coolwhite)]"
                        }`}
                      >
                        {percent}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button className="flex items-center justify-center gap-2 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold uppercase py-3 px-6 border-2 border-zinc-700 hover:border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-none hover:shadow-[3px_3px_0px_0px_rgba(234,88,12,0.4)] transition-all rounded-none">
                Update Limits
              </button>
            </div>

          </div>

          {/* =========================================
              RIGHT COLUMN
          ========================================= */}
          <div className="flex flex-col gap-8">
            
            {/* CARD 3: LANGUAGE & CURRENCY */}
            <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-6 shadow-[var(--shadow-brutal)] flex flex-col rounded-none">
              <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] mb-6 border-b border-zinc-800 pb-2">
                Language & Currency
              </h2>
              
              <div className="flex flex-col gap-6 mb-6">
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">App Language</label>
                  <div className="flex flex-wrap gap-3">
                    {["English", "हिन्दी (Hindi)", "Hinglish"].map((lang) => (
                      <button 
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`flex-1 min-w-[100px] py-2 font-mono text-xs uppercase border-2 rounded-none transition-all ${
                          language === lang 
                          ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)] font-bold" 
                          : "bg-transparent text-[var(--color-coolwhite)] border-zinc-700 hover:border-[var(--color-coolwhite)]"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Primary Currency</label>
                  <div className="flex gap-3">
                    {["₹ INR", "$ USD", "€ EUR"].map((curr) => (
                      <button 
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`flex-1 py-2 font-mono text-xs uppercase border-2 rounded-none transition-all ${
                          currency === curr 
                          ? "bg-[var(--color-amber)] text-[var(--color-vanta)] border-[var(--color-amber)] font-bold" 
                          : "bg-transparent text-[var(--color-coolwhite)] border-zinc-700 hover:border-[var(--color-coolwhite)]"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button className="flex items-center justify-center gap-2 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold uppercase py-3 px-6 border-2 border-zinc-700 hover:border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-none hover:shadow-[3px_3px_0px_0px_rgba(234,88,12,0.4)] transition-all rounded-none">
                Save Preferences
              </button>
            </div>

            {/* CARD 4: SECURITY & DANGER ZONE */}
            <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-crimson)] p-6 shadow-[4px_4px_0px_0px_var(--color-crimson)] flex flex-col rounded-none">
              <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] mb-6 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--color-crimson)]" />
                Security & Danger Zone
              </h2>
              
              {/* Change Password */}
              <div className="flex flex-col gap-4 mb-8">
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2.5 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2.5 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  />
                </div>
                <button className="flex items-center justify-center bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold text-sm uppercase py-2 px-6 border-2 border-zinc-700 hover:border-[var(--color-amber)] transition-colors rounded-none w-fit">
                  Update Password
                </button>
              </div>

              {/* Danger Zone Actions */}
              <div className="pt-6 border-t border-[var(--color-crimson)]/30 flex flex-col sm:flex-row gap-4">
                <button className="flex-1 font-sans font-bold text-xs uppercase py-3 border-2 border-[var(--color-crimson)] text-[var(--color-crimson)] hover:bg-[var(--color-crimson)]/10 transition-colors rounded-none">
                  Reset All Data
                </button>
                <button className="flex-1 font-sans font-bold text-xs uppercase py-3 border-2 border-[var(--color-crimson)] bg-[var(--color-crimson)] text-[var(--color-vanta)] hover:bg-red-700 hover:border-red-700 transition-colors rounded-none">
                  Delete Account
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
}