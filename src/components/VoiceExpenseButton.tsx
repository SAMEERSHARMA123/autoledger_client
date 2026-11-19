"use client";

import { useState, useRef } from "react";
import { Mic, Loader2, Check } from "lucide-react";
import { api } from "@/lib/axios";

interface VoiceExpenseButtonProps {
  isMuted?: boolean;
  onSuccess?: () => void;
}

export default function VoiceExpenseButton({ isMuted = false, onSuccess }: VoiceExpenseButtonProps) {
  const [status, setStatus] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(
    typeof Audio !== "undefined" ? new Audio("/sounds/expense-add.wav") : null
  );

  const showTempFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2000);
  };

  const submitTranscript = async (spokenText: string) => {
    if (!spokenText.trim()) {
      setStatus("idle");
      return;
    }

    setStatus("processing");
    try {
      const { data } = await api.post("/ai/voice-expense", { transcript: spokenText });

      if (!isMuted && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      const expenses = data.expenses || [];
      if (expenses.length === 1) {
        const { amount, category } = expenses[0];
        const formattedCat = category.charAt(0) + category.slice(1).toLowerCase();
        showTempFeedback(`Added ₹${amount} (${formattedCat})`);
      } else {
        showTempFeedback(`Added ${expenses.length} expenses`);
      }

      onSuccess?.();
    } catch {
      showTempFeedback("Could not log expense");
    } finally {
      setStatus("idle");
      setTranscript("");
    }
  };

  const toggleListening = () => {
    if (status === "processing") return;

    if (status === "listening") {
      recognitionRef.current?.stop();
      setStatus("idle");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showTempFeedback("Voice input not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setStatus("listening");
      setTranscript("");
      setFeedback("");
    };

    recognition.onresult = (event: any) => {
      const current = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");

      setTranscript(current);

      if (event.results[event.results.length - 1].isFinal) {
        recognition.stop();
        submitTranscript(current);
      }
    };

    recognition.onerror = () => {
      setStatus("idle");
      setTranscript("");
      showTempFeedback("Voice capture failed");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Live Transcript Pill (Listening) */}
      {status === "listening" && (
        <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-crimson)] px-4 py-2 font-mono text-xs shadow-[3px_3px_0px_0px_var(--color-crimson)] max-w-xs truncate">
          {transcript || "Listening..."}
        </div>
      )}

      {/* Confirmation / Error Pill */}
      {feedback && status === "idle" && (
        <div className="flex items-center gap-2 bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-amber)] px-4 py-2 font-mono text-xs shadow-[3px_3px_0px_0px_var(--color-amber)]">
          <Check className="w-4 h-4 text-[var(--color-amber)]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Circular Floating Action Button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={status === "processing"}
        title="Add expense by voice"
        className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-[var(--color-vanta)] shadow-[4px_4px_0px_0px_var(--color-vanta)] transition-all cursor-pointer hover:-translate-y-[2px] hover:-translate-x-[2px] disabled:cursor-wait ${
          status === "listening"
            ? "bg-[var(--color-crimson)] text-white animate-pulse"
            : "bg-[var(--color-amber)] text-[var(--color-vanta)]"
        }`}
      >
        {status === "processing" ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Mic className="w-6 h-6 stroke-[2.5]" />
        )}
      </button>
    </div>
  );
}