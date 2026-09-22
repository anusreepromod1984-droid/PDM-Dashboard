"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthProvider";
import { routes } from "@/lib/routes";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(routes.company(result.user.company.slug));
  }

  return (
    <div className="flex h-full items-center justify-center bg-surface-2 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-hairline bg-surface p-6 shadow-sm"
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
            style={{
              backgroundColor: "color-mix(in srgb, var(--status-critical) 12%, transparent)",
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
