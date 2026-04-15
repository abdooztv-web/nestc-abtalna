"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 precision-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white" style={{ fontSize: 32 }}>hub</span>
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Nestec</h1>
          <p className="uppercase tracking-widest text-[11px] font-bold text-on-surface-variant mt-1">
            Admin Engine
          </p>
          <p className="text-sm text-on-surface-variant mt-3">
            NESTC × Abtalna Verification Portal
          </p>
        </div>

        {/* Form */}
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/20">
          <h2 className="text-lg font-extrabold text-on-surface mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold text-on-surface-variant mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold text-on-surface-variant mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary focus:outline-none rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full precision-gradient text-white py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_open</span>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-surface-container rounded-lg text-xs text-on-surface-variant">
          <p className="font-bold uppercase tracking-wider mb-2 text-[10px]">Demo Accounts</p>
          <div className="space-y-1">
            <p><span className="font-bold">Admin:</span> admin@nestc.com / admin123</p>
            <p><span className="font-bold">NESTC Agent:</span> agent@nestc.com / agent123</p>
            <p><span className="font-bold">Partner:</span> partner@abtalna.com / partner123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
