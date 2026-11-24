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
  const setUser = useAuthStore((state) => state.setUser);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      
      // अब सिर्फ setUser कॉल होगा (जो अपने आप isAuthenticated: true कर देगा)
      setUser(data.user);
      
      router.push("/"); 
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/google", {
        idToken: credentialResponse.credential,
      });
      setUser(data.user);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-[var(--color-coolwhite)] flex items-center justify-center p-4 sm:p-8">
        
        {/* The Brutalist Black Container */}
        <div className="bg-[var(--color-vanta)] text-[var(--color-coolwhite)] border-2 border-[var(--color-charcoal)] w-full max-w-md p-8 shadow-[var(--shadow-brutal)]">
          
          <div className="mb-8">
            <h1 className="font-sans text-3xl font-bold uppercase tracking-tight mb-2">
              Create Account 
            </h1>
            <p className="font-mono text-[var(--color-muted)] text-sm">
              START TRACKING YOUR EXPENSES WITH AUTOLEDGER
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
                  placeholder="Rahul Sharma"
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
                  placeholder="rahul@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-sm text-[var(--color-muted)] uppercase">Password</label>
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
              className="mt-2 flex items-center justify-center gap-2 w-full bg-[var(--color-amber)] text-[var(--color-vanta)] font-sans font-bold uppercase py-4 border-2 border-[var(--color-amber)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-brutal-sm)] shadow-[var(--shadow-brutal)] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Create Account"}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-zinc-800 flex-1"></div>
            <span className="font-mono text-xs text-[var(--color-muted)] uppercase">OR CONTINUE WITH</span>
            <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          {/* Custom Brutalist Google Button */}
          <div className="relative flex justify-center mb-8 w-full overflow-hidden">
            <div className="flex items-center justify-center gap-3 w-full bg-[var(--color-coolwhite)] text-[var(--color-vanta)] font-sans font-bold uppercase py-4 border-2 border-[var(--color-coolwhite)] shadow-[3px_3px_0px_0px_rgba(243,244,246,0.4)] pointer-events-none">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>CONTINUE WITH GOOGLE</span>
            </div>

            <div className="absolute inset-0 opacity-0 cursor-pointer flex items-center justify-center scale-150">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login Failed")}
                width="400"
              />
            </div>
          </div>

          {/* Navigation to Login */}
          <div className="text-center font-mono text-sm">
            <span className="text-[var(--color-muted)]">
              ALREADY HAVE AN ACCOUNT?{" "}
            </span>
            <Link 
              href="/login"
              className="text-[var(--color-amber)] hover:underline focus:outline-none uppercase font-bold"
            >
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
