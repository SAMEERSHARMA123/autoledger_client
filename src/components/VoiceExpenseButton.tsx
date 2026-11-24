"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Loader2, Check, Sparkles } from "lucide-react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

interface VoiceExpenseButtonProps {
  isMuted?: boolean;
  onSuccess?: () => void;
}

const WEEKLY_AI_LIMIT = 2;

function getCurrentWeekKey(): string {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default function VoiceExpenseButton({
  isMuted = false,
  onSuccess,
}: VoiceExpenseButtonProps) {
  const userId = useAuthStore((state) => state.user?.id || "guest");

  const [status, setStatus] = useState<"idle" | "recording" | "processing">("idle");
  const [feedback, setFeedback] = useState("");
  const [weeklyUsed, setWeeklyUsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(
    typeof Audio !== "undefined" ? new Audio("/sounds/expense-add.wav") : null
  );

  const getStorageKey = useCallback(
    () => `al_ai_weekly_${userId}_${getCurrentWeekKey()}`,
    [userId]
  );

  const readWeeklyCount = useCallback((): number => {
    if (typeof window === "undefined") return 0;
    try {
      const raw = window.localStorage.getItem(getStorageKey());
      const parsed = Number(raw || "0");
      return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, WEEKLY_AI_LIMIT) : 0;
    } catch {
      return 0;
    }
  }, [getStorageKey]);

  const incrementWeeklyCount = useCallback((): number => {
    const next = Math.min(WEEKLY_AI_LIMIT, readWeeklyCount() + 1);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(getStorageKey(), String(next));
      } catch {
        // ignore storage errors
      }
    }
    setWeeklyUsed(next);
    return next;
  }, [getStorageKey, readWeeklyCount]);

  useEffect(() => {
    setWeeklyUsed(readWeeklyCount());
  }, [readWeeklyCount]);

  const showTempFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2800);
  };

  const sendAudio = async (blob: Blob) => {
    setStatus("processing");
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });

      const { data } = await api.post("/ai/voice-expense", {
        audioBase64: base64,
        mimeType: blob.type || "audio/webm",
      });

      const updatedCount = incrementWeeklyCount();
      const remaining = Math.max(0, WEEKLY_AI_LIMIT - updatedCount);

      if (!isMuted && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      const expenses = data.expenses || [];
      if (expenses.length === 1) {
        const { amount, category } = expenses[0];
        showTempFeedback(`Added ₹${amount} (${category}) • ${remaining} AI left`);
      } else {
        showTempFeedback(`Added ${expenses.length} expenses • ${remaining} AI left`);
      }

      onSuccess?.();
    } catch (err: any) {
      showTempFeedback(err.response?.data?.message || "Could not log expense");
    } finally {
      setStatus("idle");
    }
  };

  const toggleRecording = async () => {
    if (status === "processing") return;

    if (status === "recording") {
      mediaRecorderRef.current?.stop();
      return;
    }

    const currentUsed = readWeeklyCount();
    setWeeklyUsed(currentUsed);
    if (currentUsed >= WEEKLY_AI_LIMIT) {
      showTempFeedback(`Weekly AI limit reached (${WEEKLY_AI_LIMIT}/${WEEKLY_AI_LIMIT} used)`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { audioBitsPerSecond: 32000 });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (audioBlob.size > 0) sendAudio(audioBlob);
        else setStatus("idle");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setFeedback("");
      setStatus("recording");
    } catch {
      showTempFeedback("Microphone permission denied");
    }
  };

  const remainingUses = Math.max(0, WEEKLY_AI_LIMIT - weeklyUsed);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 group">
      <style>{`
        @keyframes ai-alive-shine {
          0% {
            transform: translateX(-160%) skewX(-25deg);
          }
          45%, 100% {
            transform: translateX(260%) skewX(-25deg);
          }
        }
      `}</style>

      {/* Hover Hint */}
      {status === "idle" && !feedback && (
        <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 bg-[var(--color-coolwhite)] text-[var(--color-vanta)] border-2 border-[var(--color-vanta)] px-3 py-1.5 font-mono text-xs font-bold shadow-[3px_3px_0px_0px_var(--color-vanta)]">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-amber)]" />
          <span>
            AI Voice ({remainingUses}/{WEEKLY_AI_LIMIT} left/wk)
          </span>
        </div>
      )}

      {/* Recording Pill */}
      {status === "recording" && (
        <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-crimson)] px-4 py-2 font-mono text-xs shadow-[3px_3px_0px_0px_var(--color-crimson)]">
          Listening... Tap to send
        </div>
      )}

      {/* Processing Pill */}
      {status === "processing" && (
        <div className="flex items-center gap-2 bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-muted)] px-4 py-2 font-mono text-xs shadow-[3px_3px_0px_0px_var(--color-vanta)]">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-amber)] animate-pulse" />
          <span>AI is logging...</span>
        </div>
      )}

      {/* Confirmation / Limit / Error Pill */}
      {feedback && status === "idle" && (
        <div className="flex items-center gap-2 bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-vanta)] px-4 py-2 font-mono text-xs shadow-[3px_3px_0px_0px_var(--color-muted)]">
          <Check className="w-4 h-4 text-[var(--color-amber)]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Circular AI Floating Action Button */}
      <button
        type="button"
        onClick={toggleRecording}
        disabled={status === "processing"}
        title={
          status === "recording"
            ? "Stop & log expense"
            : remainingUses > 0
            ? `Add expense with AI Voice (${remainingUses}/${WEEKLY_AI_LIMIT} left this week)`
            : `Weekly AI limit reached (${WEEKLY_AI_LIMIT}/${WEEKLY_AI_LIMIT} used)`
        }
        className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 border-[var(--color-vanta)] shadow-[4px_4px_0px_0px_var(--color-vanta)] transition-all cursor-pointer hover:-translate-y-[2px] hover:-translate-x-[2px] disabled:cursor-wait ${
          status === "recording"
            ? "bg-[var(--color-crimson)] text-[var(--color-coolwhite)] animate-pulse"
            : remainingUses === 0
            ? "bg-[var(--color-charcoal)] text-[var(--color-muted)] opacity-85"
            : "bg-[var(--color-muted)] text-[var(--color-coolwhite)] hover:bg-[var(--color-charcoal)]"
        }`}
      >
        {/* Always-on Sweeping Shine */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full overflow-hidden"
        >
          <span
            style={{ animation: "ai-alive-shine 3s ease-in-out infinite" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          />
        </span>

        {/* Sharp AI Identity Badge */}
        {status !== "recording" && (
          <span className="absolute -top-1 -right-1 z-10 flex items-center gap-0.5 bg-[var(--color-vanta)] text-[var(--color-coolwhite)] font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[var(--color-coolwhite)] leading-none">
            <Sparkles className="w-2.5 h-2.5 text-[var(--color-amber)]" />
            {remainingUses}/{WEEKLY_AI_LIMIT}
          </span>
        )}

        {status === "processing" ? (
          <Loader2 className="relative z-10 w-7 h-7 text-[var(--color-coolwhite)] animate-spin" />
        ) : status === "recording" ? (
          <Square className="relative z-10 w-5 h-5 fill-current" />
        ) : (
          <Mic className="relative z-10 w-7 h-7 stroke-[2.2]" />
        )}
      </button>
    </div>
  );
}