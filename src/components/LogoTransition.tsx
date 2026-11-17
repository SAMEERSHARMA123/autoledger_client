"use client";

import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LogoTransitionProps {
  onComplete: () => void;
}

export default function LogoTransition({ onComplete }: LogoTransitionProps) {
  const [dotLottie, setDotLottie] = useState<any>(null);

  useEffect(() => {
    if (!dotLottie) return;

    const handleComplete = () => {
      onComplete();
    };

    // जब एनिमेशन पूरी तरह खत्म हो जाए, तभी यह चलेगा
    dotLottie.addEventListener("complete", handleComplete);

    return () => {
      dotLottie.removeEventListener("complete", handleComplete);
    };
  }, [dotLottie, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-coolwhite)] flex flex-col items-center justify-center">
      <div className="w-52 h-52 sm:w-64 sm:h-64">
        <DotLottieReact
          src="/logo-anim.lottie"
          loop={false}
          autoplay={true}
          dotLottieRefCallback={setDotLottie}
        />
      </div>
      <p className="font-mono text-xs text-[var(--color-amber)] uppercase tracking-widest mt-4">
        Welcome to AutoLedger 
      </p>
    </div>
  );
}
