"use client";

import { useEffect, useState, useRef } from "react";
import {
  useAuthStore,
  applyThemeToken,
  clearThemeToken,
} from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/login", "/register"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userThemeId = useAuthStore((state) => state.user?.themeId);

  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const hasChecked = useRef(false);

  const cleanPath = pathname?.replace(/\/$/, "") || "/";
  const isPublicRoute = PUBLIC_ROUTES.includes(cleanPath);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const verifySession = async () => {
      try {
        await checkAuth();
      } finally {
        setIsChecking(false);
      }
    };

    verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logged-in user ke liye theme apply + save karein, warna default theme + storage clear
  useEffect(() => {
    if (isChecking) return;

    if (isAuthenticated && userThemeId) {
      applyThemeToken(userThemeId, true);
    } else if (!isAuthenticated) {
      clearThemeToken();
    }
  }, [isChecking, isAuthenticated, userThemeId]);

  useEffect(() => {
    if (isChecking) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
    } else if (isAuthenticated && isPublicRoute) {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, isAuthenticated, isPublicRoute]);

  const isRedirecting =
    !isChecking &&
    ((!isAuthenticated && !isPublicRoute) || (isAuthenticated && isPublicRoute));

  if (isChecking || isRedirecting) {
    return (
      <div className="min-h-screen bg-[var(--color-coolwhite)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-vanta)] border-2 border-[var(--color-charcoal)] p-10 shadow-[var(--shadow-brutal)] flex flex-col items-center gap-6 max-w-sm w-full">
          <Loader2 className="animate-spin text-[var(--color-amber)] h-12 w-12" />
          <div className="text-center">
            <p className="font-mono text-[var(--color-amber)] text-xs uppercase tracking-widest animate-pulse">
              Verifying ...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}