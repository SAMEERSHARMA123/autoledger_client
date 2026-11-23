"use client";

import React from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  AlertTriangle,
  X,
} from "lucide-react";

type ToneKind = "expense" | "lent" | "borrowed" | "budget" | "error";

interface NoteSpec {
  freq: number;
  delay: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextCtor = win.AudioContext || win.webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextCtor();
  }

  if (audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

function playToneSequence(notes: NoteSpec[]) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = n.type ?? "triangle";
      osc.frequency.setValueAtTime(n.freq, now + n.delay);

      const peak = n.gain ?? 0.12;
      gainNode.gain.setValueAtTime(0.0001, now + n.delay);
      gainNode.gain.exponentialRampToValueAtTime(peak, now + n.delay + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        now + n.delay + n.duration
      );

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + n.delay);
      osc.stop(now + n.delay + n.duration + 0.02);
    }
  } catch {
    // Ignore audio context blocks or unsupported playback
  }
}

export function playActionSound(kind: ToneKind) {
  switch (kind) {
    case "expense":
      playToneSequence([
        { freq: 523.25, delay: 0, duration: 0.12, type: "triangle", gain: 0.12 },
        { freq: 659.25, delay: 0.08, duration: 0.16, type: "triangle", gain: 0.13 },
      ]);
      break;
    case "lent":
      playToneSequence([
        { freq: 587.33, delay: 0, duration: 0.11, type: "sine", gain: 0.13 },
        { freq: 880, delay: 0.09, duration: 0.18, type: "sine", gain: 0.13 },
      ]);
      break;
    case "borrowed":
      playToneSequence([
        { freq: 440, delay: 0, duration: 0.11, type: "triangle", gain: 0.12 },
        { freq: 349.23, delay: 0.09, duration: 0.16, type: "triangle", gain: 0.12 },
      ]);
      break;
    case "budget":
      playToneSequence([
        { freq: 493.88, delay: 0, duration: 0.1, type: "sine", gain: 0.12 },
        { freq: 659.25, delay: 0.08, duration: 0.1, type: "sine", gain: 0.12 },
        { freq: 783.99, delay: 0.16, duration: 0.2, type: "sine", gain: 0.14 },
      ]);
      break;
    case "error":
      playToneSequence([
        { freq: 220, delay: 0, duration: 0.14, type: "sawtooth", gain: 0.1 },
        { freq: 174.61, delay: 0.11, duration: 0.2, type: "sawtooth", gain: 0.1 },
      ]);
      break;
  }
}

interface ToastConfig {
  badge: string;
  title: string;
  subtitle?: string;
  accent?: "amber" | "emerald" | "crimson";
  icon: React.ReactNode;
  tone: ToneKind;
  duration?: number;
}

function showCustomToast({
  badge,
  title,
  subtitle,
  accent = "amber",
  icon,
  tone,
  duration = 3200,
}: ToastConfig) {
  playActionSound(tone);

  const borderAccent =
    accent === "emerald"
      ? "border-l-4 border-l-[#21A366]"
      : accent === "crimson"
      ? "border-l-4 border-l-[var(--color-crimson)]"
      : "border-l-4 border-l-[var(--color-amber)]";

  const badgeStyle =
    accent === "emerald"
      ? "bg-[#21A366]/15 text-[#21A366] border-[#21A366]/40"
      : accent === "crimson"
      ? "bg-[var(--color-crimson)]/15 text-[var(--color-crimson)] border-[var(--color-crimson)]/40"
      : "bg-[var(--color-amber)]/15 text-[var(--color-amber)] border-[var(--color-amber)]/40";

  toast.custom(
    (toastId) => (
      <div
        className={`w-[340px] max-w-[92vw] bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] ${borderAccent} shadow-[var(--shadow-brutal)] p-3.5 rounded-none flex items-start gap-3 select-none`}
      >
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={`font-mono text-[10px] uppercase px-1.5 py-0.5 border ${badgeStyle}`}
            >
              {badge}
            </span>
            <button
              type="button"
              onClick={() => toast.dismiss(toastId)}
              aria-label="Close notification"
              className="text-[var(--color-muted)] hover:text-[var(--color-coolwhite)] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="font-sans font-bold text-sm uppercase tracking-tight truncate">
            {title}
          </p>
          {subtitle && (
            <p className="font-mono text-xs text-[var(--color-muted)] mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    ),
    { duration }
  );
}

// Direct 2-word API notification triggers
export function expenseAdded(detail?: string) {
  showCustomToast({
    tone: "expense",
    badge: "EXPENSE LOGGED",
    title: "Expense Added",
    subtitle: detail || "Ledger updated",
    accent: "amber",
    icon: <CheckCircle2 className="w-5 h-5 text-[var(--color-amber)]" />,
  });
}

export function expenseFailed(detail?: string) {
  showCustomToast({
    tone: "error",
    badge: "API ERROR",
    title: "Expense Failed",
    subtitle: detail || "Could not log expense",
    accent: "crimson",
    icon: <AlertTriangle className="w-5 h-5 text-[var(--color-crimson)]" />,
    duration: 3800,
  });
}

export function moneyLent(detail?: string) {
  showCustomToast({
    tone: "lent",
    badge: "TO RECEIVE",
    title: "Money Lent",
    subtitle: detail || "Added to receivables",
    accent: "emerald",
    icon: <ArrowUpRight className="w-5 h-5 text-[#21A366]" />,
  });
}

export function lentFailed(detail?: string) {
  showCustomToast({
    tone: "error",
    badge: "API ERROR",
    title: "Lent Failed",
    subtitle: detail || "Could not save lent entry",
    accent: "crimson",
    icon: <AlertTriangle className="w-5 h-5 text-[var(--color-crimson)]" />,
    duration: 3800,
  });
}

export function moneyBorrowed(detail?: string) {
  showCustomToast({
    tone: "borrowed",
    badge: "TO PAY",
    title: "Money Borrowed",
    subtitle: detail || "Added to payables",
    accent: "crimson",
    icon: <ArrowDownLeft className="w-5 h-5 text-[var(--color-crimson)]" />,
  });
}

export function borrowedFailed(detail?: string) {
  showCustomToast({
    tone: "error",
    badge: "API ERROR",
    title: "Borrowed Failed",
    subtitle: detail || "Could not save borrowed entry",
    accent: "crimson",
    icon: <AlertTriangle className="w-5 h-5 text-[var(--color-crimson)]" />,
    duration: 3800,
  });
}

export function budgetUpdated(detail?: string) {
  showCustomToast({
    tone: "budget",
    badge: "BUDGET SAVED",
    title: "Budget Updated",
    subtitle: detail || "Monthly limit synced",
    accent: "amber",
    icon: <Wallet className="w-5 h-5 text-[var(--color-amber)]" />,
  });
}

export function budgetFailed(detail?: string) {
  showCustomToast({
    tone: "error",
    badge: "API ERROR",
    title: "Budget Failed",
    subtitle: detail || "Could not update budget",
    accent: "crimson",
    icon: <AlertTriangle className="w-5 h-5 text-[var(--color-crimson)]" />,
    duration: 3800,
  });
}
export function securityUpdated(detail?: string) {
  showCustomToast({
    tone: "budget",
    badge: "SECURITY SYNC",
    title: "Security Updated",
    subtitle: detail || "Password changed",
    accent: "amber",
    icon: <Wallet className="w-5 h-5 text-[var(--color-amber)]" />,
  });
}

export function securityFailed(detail?: string) {
  showCustomToast({
    tone: "error",
    badge: "API ERROR",
    title: "Action Failed",
    subtitle: detail || "Request rejected",
    accent: "crimson",
    icon: <AlertTriangle className="w-5 h-5 text-[var(--color-crimson)]" />,
    duration: 3800,
  });
}