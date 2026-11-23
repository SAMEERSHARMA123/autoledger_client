"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/axios";
import { confirmPopup } from "@/lib/confirmPopup";
import {
  Camera,
  Trash2,
  Save,
  AlertTriangle,
  Loader2,
  Palette,
  Check,
} from "lucide-react";
import {
  useAuthStore,
  applyThemeToken,
  DEFAULT_THEME_ID,
  type ThemeId,
} from "@/store/useAuthStore";
import {
  budgetUpdated,
  budgetFailed,
  securityUpdated,
  securityFailed,
} from "@/lib/notifyAction";

interface ThemePreset {
  id: ThemeId;
  name: string;
  tag: string;
  colors: readonly [string, string, string, string, string, string];
}

const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: "industrial-forge",
    name: "Industrial Forge",
    tag: "DEFAULT",
    colors: ["#0A0A0A", "#161618", "#F4F4F5", "#EA580C", "#71717A", "#DC2626"],
  },
  {
    id: "cyber-circuit",
    name: "Cyber Circuit",
    tag: "EMERALD",
    colors: ["#070B09", "#111916", "#F1F5F3", "#10B981", "#6B7F76", "#E11D48"],
  },
  {
    id: "cobalt-blueprint",
    name: "Cobalt Blueprint",
    tag: "CYAN",
    colors: ["#080C14", "#111827", "#F0F4F8", "#0284C7", "#64748B", "#F43F5E"],
  },
  {
    id: "sovereign-vault",
    name: "Sovereign Vault",
    tag: "GOLD",
    colors: ["#0C0A08", "#1A1612", "#F7F5F0", "#D97706", "#78716C", "#B91C1C"],
  },
  {
    id: "acid-reactor",
    name: "Acid Reactor",
    tag: "LIME",
    colors: ["#0B0C0A", "#171915", "#F4F6F0", "#84CC16", "#737A6C", "#EF4444"],
  },
];

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  // Profile State
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null);
  const [avatarPayload, setAvatarPayload] = useState<string | null | undefined>(undefined);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme State
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(
    user?.themeId || DEFAULT_THEME_ID
  );
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeMsg, setThemeMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Budget State
  const [budgetLimit, setBudgetLimit] = useState(
    user?.monthlyBudget ? String(user.monthlyBudget) : "50000"
  );
  const [alertThreshold, setAlertThreshold] = useState(user?.alertThreshold || "80%");
  const [updatingBudget, setUpdatingBudget] = useState(false);

  // Security & Danger Zone State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) checkAuth();
  }, [user, checkAuth]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setAvatarUrl(user.avatar || null);
      const nextTheme = user.themeId || DEFAULT_THEME_ID;
      setSelectedTheme(nextTheme);
      applyThemeToken(nextTheme, true);

      if (user.monthlyBudget) setBudgetLimit(String(user.monthlyBudget));
      if (user.alertThreshold) setAlertThreshold(user.alertThreshold);
    }
  }, [user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      setAvatarPayload(result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setAvatarUrl(null);
    setAvatarPayload("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setProfileMsg({ type: "err", text: "Display name is required." });
      return;
    }

    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const payload: { name: string; avatar?: string | null } = { name: trimmedName };
      if (avatarPayload !== undefined) {
        payload.avatar = avatarPayload === "" ? null : avatarPayload;
      }

      const { data } = await api.put("/auth/profile", payload);
      const updated = data.user || data;

      setUser({
        id: updated._id || updated.id || user?.id || "",
        name: updated.name || trimmedName,
        email: updated.email || user?.email || "",
        avatar: updated.avatar ?? (avatarPayload === "" ? undefined : avatarUrl || undefined),
        themeId: updated.themeId || selectedTheme,
        monthlyBudget: updated.monthlyBudget ?? user?.monthlyBudget,
        alertThreshold: updated.alertThreshold ?? user?.alertThreshold,
      });
      setAvatarPayload(undefined);
      setProfileMsg({ type: "ok", text: "Profile updated." });
    } catch (err: any) {
      setProfileMsg({
        type: "err",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSelectTheme = (themeId: ThemeId) => {
    setSelectedTheme(themeId);
    setThemeMsg(null);
    // Live preview only; localStorage persists when saved
    applyThemeToken(themeId, false);
  };

  const handleSaveTheme = async () => {
    setSavingTheme(true);
    setThemeMsg(null);

    try {
      const { data } = await api.put("/auth/profile", { themeId: selectedTheme });
      const updated = data.user || data;
      const savedTheme: ThemeId = updated.themeId || selectedTheme;

      if (user) {
        setUser({
          ...user,
          themeId: savedTheme,
        });
      } else {
        applyThemeToken(savedTheme, true);
      }
      setThemeMsg({ type: "ok", text: "Theme saved to account." });
    } catch (err: any) {
      setThemeMsg({
        type: "err",
        text: err.response?.data?.message || "Failed to save theme.",
      });
    } finally {
      setSavingTheme(false);
    }
  };

  const handleUpdateLimits = async () => {
    const numericLimit = Number(budgetLimit);
    if (!numericLimit || numericLimit <= 0) {
      budgetFailed("Enter a valid monthly budget");
      return;
    }

    setUpdatingBudget(true);
    try {
      const { data } = await api.put("/auth/profile", {
        monthlyBudget: numericLimit,
        alertThreshold,
      });
      const updated = data.user || data;

      if (user) {
        setUser({
          ...user,
          monthlyBudget: updated.monthlyBudget ?? numericLimit,
          alertThreshold: updated.alertThreshold ?? alertThreshold,
        });
      }
      budgetUpdated(`₹${numericLimit.toLocaleString("en-IN")} • Alert ${alertThreshold}`);
    } catch (err: any) {
      budgetFailed(err.response?.data?.message || "Could not update limits");
    } finally {
      setUpdatingBudget(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      securityFailed("Enter both current and new password.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      securityUpdated("Password updated.");
    } catch (err: any) {
      securityFailed(err.response?.data?.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleResetData = async () => {
    const ok = await confirmPopup(
      "Reset all your expenses and debts permanently?",
      "Reset All Data"
    );
    if (!ok) return;

    setResettingData(true);
    try {
      await api.delete("/expenses/reset");
      securityUpdated("All expense & debt records reset.");
    } catch (err: any) {
      securityFailed(err.response?.data?.message || "Failed to reset data");
    } finally {
      setResettingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirmPopup(
      "Delete your account permanently? This cannot be undone.",
      "Delete Account"
    );
    if (!ok) return;

    setDeletingAccount(true);
    try {
      await api.delete("/auth/account");
      securityUpdated("Account deleted.");
      await logout();
    } catch (err: any) {
      securityFailed(err.response?.data?.message || "Failed to delete account");
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)]">
      <Sidebar />
      <main className="transition-all duration-300 ease-in-out md:pl-24 pt-10 pr-6 pb-12 lg:pr-10">
        {/* 1. INLINE PAGE HEADER */}
        <header className="mb-8 pl-4">
          <h1 className="font-sans text-4xl font-bold uppercase tracking-tight text-[var(--color-vanta)]">
            Account Settings //
          </h1>
          <p className="font-mono text-sm text-[var(--color-muted)] mt-1 uppercase">
            Manage profile, themes, budget limits & security
          </p>
        </header>

        {/* 2-COLUMN GRID LAYOUT */}
        <div className="pl-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-8">
            {/* CARD 1: PROFILE & IDENTITY */}
            <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-6 shadow-[var(--shadow-brutal)] flex flex-col rounded-none">
              <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] mb-6 border-b border-zinc-800 pb-2">
                Profile & Identity
              </h2>

              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-[var(--color-charcoal)] border-2 border-[var(--color-amber)] flex items-center justify-center overflow-hidden rounded-none flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-mono font-bold text-[var(--color-muted)] text-2xl">
                      {(displayName || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 font-sans font-bold text-xs uppercase text-[var(--color-vanta)] bg-[var(--color-amber)] border-2 border-[var(--color-amber)] px-4 py-2 hover:bg-[var(--color-amber)]/90 transition-colors rounded-none cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="flex items-center gap-2 font-sans font-bold text-xs uppercase text-[var(--color-muted)] hover:text-[var(--color-crimson)] transition-colors px-2 py-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2.5 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    Email Address (Read Only)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="w-full bg-zinc-900 border border-zinc-800 text-[var(--color-muted)] font-mono py-2.5 px-3 cursor-not-allowed rounded-none"
                  />
                </div>
              </div>

              {profileMsg && (
                <p
                  className={`font-mono text-xs mb-4 ${
                    profileMsg.type === "ok" ? "text-emerald-400" : "text-[var(--color-crimson)]"
                  }`}
                >
                  {profileMsg.text}
                </p>
              )}

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center justify-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-6 border-2 border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[3px_3px_0px_0px_rgba(234,88,12,0.4)] hover:shadow-[3px_3px_0px_0px_rgba(234,88,12,1)] transition-all rounded-none cursor-pointer disabled:opacity-70"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 stroke-[3]" />
                )}
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>

            {/* CARD 2: COLOR THEME PRESETS */}
            <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-6 shadow-[var(--shadow-brutal)] flex flex-col rounded-none">
              <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] mb-6 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--color-amber)]" />
                Color Theme Presets
              </h2>

              <div className="flex flex-col gap-3 mb-6">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = selectedTheme === preset.id;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handleSelectTheme(preset.id)}
                      className={`w-full p-3 border-2 text-left transition-all rounded-none cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-[var(--color-amber)] bg-[var(--color-charcoal)]"
                          : "border-zinc-800 bg-transparent hover:border-zinc-600"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-xs uppercase text-[var(--color-coolwhite)]">
                            {preset.name}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-zinc-900 text-[var(--color-amber)] border border-zinc-700">
                            {preset.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          {preset.colors.map((hex) => (
                            <span
                              key={hex}
                              title={hex}
                              style={{ backgroundColor: hex }}
                              className="w-5 h-5 border border-white/20 inline-block"
                            />
                          ))}
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-6 h-6 bg-[var(--color-amber)] text-[var(--color-vanta)] flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {themeMsg && (
                <p
                  className={`font-mono text-xs mb-4 ${
                    themeMsg.type === "ok" ? "text-emerald-400" : "text-[var(--color-crimson)]"
                  }`}
                >
                  {themeMsg.text}
                </p>
              )}

              <button
                type="button"
                onClick={handleSaveTheme}
                disabled={savingTheme}
                className="flex items-center justify-center gap-2 bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-3 px-6 border-2 border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-[3px_3px_0px_0px_rgba(234,88,12,0.4)] transition-all rounded-none cursor-pointer disabled:opacity-70"
              >
                {savingTheme ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 stroke-[3]" />
                )}
                {savingTheme ? "Saving Theme..." : "Save Theme"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-8">
            {/* CARD 3: BUDGET & ALERT LIMITS */}
            <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-6 shadow-[var(--shadow-brutal)] flex flex-col rounded-none">
              <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] mb-6 border-b border-zinc-800 pb-2">
                Budget & Alert Limits
              </h2>

              <div className="flex flex-col gap-6 mb-6">
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    Monthly Budget Limit (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2.5 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  />
                </div>

                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    Alert Warning Threshold
                  </label>
                  <div className="flex gap-3">
                    {["75%", "80%", "90%"].map((percent) => (
                      <button
                        type="button"
                        key={percent}
                        onClick={() => setAlertThreshold(percent)}
                        className={`flex-1 py-2 font-mono text-sm border-2 rounded-none transition-all cursor-pointer ${
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

              <button
                type="button"
                onClick={handleUpdateLimits}
                disabled={updatingBudget}
                className="flex items-center justify-center gap-2 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold uppercase py-3 px-6 border-2 border-zinc-700 hover:border-[var(--color-amber)] hover:-translate-y-[2px] hover:-translate-x-[2px] shadow-none hover:shadow-[3px_3px_0px_0px_rgba(234,88,12,0.4)] transition-all rounded-none cursor-pointer disabled:opacity-60"
              >
                {updatingBudget && <Loader2 className="w-4 h-4 animate-spin" />}
                {updatingBudget ? "Updating..." : "Update Limits"}
              </button>
            </div>

            {/* CARD 4: SECURITY & DANGER ZONE */}
            <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-crimson)] p-6 shadow-[4px_4px_0px_0px_var(--color-crimson)] flex flex-col rounded-none">
              <h2 className="font-sans font-bold text-lg uppercase tracking-wide text-[var(--color-coolwhite)] mb-6 border-b border-zinc-800 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--color-crimson)]" />
                Security & Danger Zone
              </h2>

              <div className="flex flex-col gap-4 mb-8">
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2.5 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase text-[var(--color-muted)] block mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-2.5 px-3 focus:outline-none focus:border-[var(--color-amber)] rounded-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                  className="flex items-center justify-center gap-2 bg-[var(--color-charcoal)] text-[var(--color-coolwhite)] font-sans font-bold text-sm uppercase py-2 px-6 border-2 border-zinc-700 hover:border-[var(--color-amber)] transition-colors rounded-none w-fit cursor-pointer disabled:opacity-60"
                >
                  {updatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Password
                </button>
              </div>

              <div className="pt-6 border-t border-[var(--color-crimson)]/30 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleResetData}
                  disabled={resettingData}
                  className="flex-1 font-sans font-bold text-xs uppercase py-3 border-2 border-[var(--color-crimson)] text-[var(--color-crimson)] hover:bg-[var(--color-crimson)]/10 transition-colors rounded-none cursor-pointer disabled:opacity-60"
                >
                  {resettingData ? "Resetting..." : "Reset All Data"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="flex-1 font-sans font-bold text-xs uppercase py-3 border-2 border-[var(--color-crimson)] bg-[var(--color-crimson)] text-[var(--color-vanta)] hover:bg-red-700 hover:border-red-700 transition-colors rounded-none cursor-pointer disabled:opacity-60"
                >
                  {deletingAccount ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}