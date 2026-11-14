"use client";

import { useState } from "react";
// Import useGoogleLogin instead of the pre-built component
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { configDotenv } from "dotenv";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// We extract the form content into a child component so we can use the useGoogleLogin hook
// (The hook must be inside the GoogleOAuthProvider context)
function AuthFormContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, { email, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Custom Google Login Hook
  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        // When using useGoogleLogin, we get an access_token that we send to the backend
        const { data } = await api.post("/auth/google", {
          access_token: codeResponse.access_token,
        });
        setAccessToken(data.accessToken);
        setUser(data.user);
        router.push("/");
      } catch (err: any) {
        setError("Google authentication failed");
      }
    },
    onError: () => setError("Google Login Failed"),
  });

  return (
    <div className="min-h-screen bg-[var(--color-coolwhite)] flex items-center justify-center p-4 sm:p-8">
      <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] w-full max-w-md p-8 shadow-[var(--shadow-brutal)]">
        
        <div className="mb-10">
          <h1 className="font-sans text-3xl font-bold uppercase tracking-tight mb-2">
            {isLogin ? "System Login //" : "Initialize User //"}
          </h1>
          <p className="font-mono text-[var(--color-muted)] text-sm">
            {isLogin ? "ENTER CREDENTIALS TO ACCESS DATABASE" : "CREATE A NEW SECURE LEDGER ACCOUNT"}
          </p>
        </div>

        {error && (
          <div className="bg-[var(--color-crimson)]/10 border border-[var(--color-crimson)] text-[var(--color-crimson)] font-mono text-sm p-3 mb-6">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-sm text-[var(--color-muted)] uppercase">User Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-[var(--color-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 pl-10 pr-4 focus:outline-none focus:border-[var(--color-amber)] transition-colors rounded-none"
                placeholder="admin@autoledger.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-sm text-[var(--color-muted)] uppercase">Passkey</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-[var(--color-muted)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 pl-10 pr-4 focus:outline-none focus:border-[var(--color-amber)] transition-colors rounded-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative mt-4 flex items-center justify-center gap-2 w-full overflow-hidden bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-4 border-2 border-[var(--color-amber)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] shadow-[3px_3px_0px_0px_rgba(245,158,11,0.4),_6px_6px_0px_0px_rgba(245,158,11,0.15)] hover:shadow-[0px_0px_0px_0px_rgba(245,158,11,0)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {/* Shining Tilted Wave Layer */}
            <span className="absolute inset-0 block -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />

            {/* Button Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? "Authenticate" : "Deploy Account")}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </span>
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-zinc-800 flex-1"></div>
          <span className="font-mono text-xs text-[var(--color-muted)] uppercase">OR OVERRIDE WITH</span>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        {/* Custom Brutalist Google Button */}
        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={() => googleLogin()}
            className="group relative flex items-center justify-center gap-3 w-full overflow-hidden bg-[var(--color-coolwhite)] text-[var(--color-vanta)] font-sans font-bold uppercase py-4 border-2 border-[var(--color-coolwhite)] transition-all hover:translate-x-[3px] hover:translate-y-[3px] shadow-[3px_3px_0px_0px_rgba(243,244,246,0.4),_6px_6px_0px_0px_rgba(243,244,246,0.15)] hover:shadow-[0px_0px_0px_0px_rgba(243,244,246,0)]"
          >
            {/* Shining Layer */}
            <span className="absolute inset-0 block -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
            
            <span className="relative z-10 flex items-center justify-center gap-3">
              {/* Google SVG Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isLogin ? "SIGN IN WITH GOOGLE" : "SIGN UP WITH GOOGLE"}
            </span>
          </button>
        </div>

        <div className="text-center font-mono text-sm">
          <span className="text-[var(--color-muted)]">
            {isLogin ? "NO ACCESS YET? " : "ALREADY INITIALIZED? "}
          </span>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-[var(--color-amber)] hover:underline focus:outline-none uppercase"
          >
            {isLogin ? "Request Access" : "Return to Login"}
          </button>
        </div>

      </div>
    </div>
  );
}

// Wrapping the component with the Provider at the top level
export default function AuthPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthFormContent />
    </GoogleOAuthProvider>
  );
}