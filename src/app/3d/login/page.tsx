"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthProvider";

/**
 * Same functionality as the regular /login page — the post-login redirect target
 * differs (/3d/<slug> instead of /<slug>). This page deliberately does NOT navigate
 * itself after a successful login: it only calls login(), which updates AuthProvider's
 * state — ThreeDGate (which wraps this whole route tree, including this page) reacts
 * to that same state change and is the single place that actually redirects. Having
 * both this page AND ThreeDGate race to independently call a navigation API for the
 * same destination was a real, avoidable source of flakiness on its own, on top of
 * whatever CEF-specific navigation issue is being investigated there.
 */
export default function ThreeDLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(email, password);
    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
    }
    // On success, leave `submitting` true — ThreeDGate takes over from here, and the
    // disabled/"Signing in…" state doubles as feedback while that happens.
  }

  return (
    // Transparent, not bg-surface-2 — see ThreeDShell for why (this page renders
    // before ThreeDShell mounts, so it needs the same treatment on its own).
    <div className="flex h-full items-center justify-center bg-transparent p-4">
      <form
        onSubmit={handleSubmit}
        // three-d-panel (globals.css), not bg-surface like the regular /login page —
        // this form sits directly on the /3d flow's transparent background, so it
        // needs the same translucent-over-3D-scene treatment as the rest of the flow.
        className="three-d-panel flex w-full max-w-sm flex-col gap-4 rounded-xl border border-hairline p-6 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/greenbotz-logo.png"
            alt="Greenbotz"
            width={2000}
            height={403}
            priority
            className="object-contain"
            style={{ width: 136, height: "auto" }}
          />
          <div>
            <h1 className="text-lg font-semibold text-primary">PDM Sensor Portal</h1>
            <p className="mt-1 text-sm text-muted">Sign in to continue.</p>
          </div>
        </div>

        {error && (
          <p
            className="rounded-lg px-3 py-2 text-sm"
            // rgb()-with-alpha rather than color-mix() — same rendered color, but
            // supported by far older browser engines (see globals.css's "-rgb"
            // companion properties, and the same fix already applied to StatusBadge/
            // FaultGauge).
            style={{
              backgroundColor: "rgb(var(--status-critical-rgb) / 12%)",
              color: "var(--status-critical)",
            }}
          >
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-secondary">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-secondary">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
