"use client";

import { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Direct integration with your Express backend
      const { data } = await api.post("/auth/register", { name, email, password });
      
      // Save to Zustand store (Cookie is automatically saved by browser)
      setAccessToken(data.accessToken);
      setUser(data.user);
      
      // Redirect to the secure dashboard
      router.push("/"); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const { data } = await api.post("/auth/google", {
        idToken: credentialResponse.credential,
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
      router.push("/");
    } catch (err: any) {
      setError("Google authentication failed");
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-[var(--color-coolwhite)] flex items-center justify-center p-4 sm:p-8">
        
        {/* The Brutalist Black Container */}
        <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] w-full max-w-md p-8 shadow-[var(--shadow-brutal)]">
          
          <div className="mb-8">
            <h1 className="font-sans text-3xl font-bold uppercase tracking-tight mb-2">
              Initialize User //
            </h1>
            <p className="font-mono text-[var(--color-muted)] text-sm">
              CREATE A NEW SECURE LEDGER ACCOUNT
            </p>
          </div>

          {error && (
            <div className="bg-[var(--color-crimson)]/10 border border-[var(--color-crimson)] text-[var(--color-crimson)] font-mono text-sm p-3 mb-6">
              ERROR: {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-sm text-[var(--color-muted)] uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-[var(--color-muted)]" />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--color-charcoal)] border border-zinc-800 text-[var(--color-coolwhite)] font-mono py-3 pl-10 pr-4 focus:outline-none focus:border-[var(--color-amber)] transition-colors rounded-none"
                  placeholder="System Admin"
                />
              </div>
            </div>

            {/* Email Input */}
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

            {/* Password Input */}
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

            {/* Primary Submit Action */}
            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 w-full bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-4 border-2 border-[var(--color-amber)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-brutal-sm)] shadow-[var(--shadow-brutal)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Deploy Account"}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-zinc-800 flex-1"></div>
            <span className="font-mono text-xs text-[var(--color-muted)] uppercase">OR OVERRIDE WITH</span>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          {/* Google Auth Integration */}
          <div className="flex justify-center mb-8">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError("Google Login Failed")}
              theme="outline" 
              shape="rectangular"
              text="signup_with"
            />
          </div>

          {/* Navigation to Login */}
          <div className="text-center font-mono text-sm">
            <span className="text-[var(--color-muted)]">
              ALREADY INITIALIZED?{" "}
            </span>
            <Link 
              href="/login"
              className="text-[var(--color-amber)] hover:underline focus:outline-none uppercase"
            >
              Return to Login
            </Link>
          </div>

        </div>
      </div>
    </GoogleOAuthProvider>
  );
}