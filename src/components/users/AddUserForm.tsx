"use client";

import { useEffect, useRef, useState } from "react";
import type { CompanyRole, CompanyUserSummary } from "@/lib/types";

export interface CreateUserInput {
  email: string;
  name?: string;
  role: CompanyRole;
  password?: string;
}

export interface CreateUserResult {
  user: CompanyUserSummary;
  initialPassword: string;
}

function generatePassword(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 16; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/**
 * "Add user," never "Invite" — there's no email infrastructure anywhere in this
 * system to send a link. The admin sets or generates a password here and hands it
 * over directly; the new account is always forced through a password change on first
 * login (mustChangePassword, hard-enforced by the backend).
 */
export function AddUserForm({ onCreate }: { onCreate: (input: CreateUserInput) => Promise<CreateUserResult> }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<CompanyRole>("COMPANY_MEMBER");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateUserResult | null>(null);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  function reset() {
    setOpen(false);
    setEmail("");
    setName("");
    setRole("COMPANY_MEMBER");
    setPassword("");
    setError(null);
    setResult(null);
    setCopied(false);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        reset();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") reset();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await onCreate({ email, name: name || undefined, role, password: password || undefined });
      setResult(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPassword() {
    if (!result) return;
    await navigator.clipboard.writeText(result.initialPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Add user
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-20 mt-2 w-[min(90vw,26rem)] rounded-lg border border-hairline bg-surface shadow-lg"
        >
          {result ? (
            <div
              className="flex flex-col gap-3 rounded-lg p-4 text-sm"
              style={{ backgroundColor: "color-mix(in srgb, var(--status-good) 10%, transparent)" }}
            >
              <p className="text-secondary">
                Account created for <span className="font-medium text-primary">{result.user.email}</span>. Share
                this password with them directly — it can&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="rounded bg-surface-2 px-2 py-1 font-mono text-sm text-primary">
                  {result.initialPassword}
                </code>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="rounded-lg border border-hairline px-2.5 py-1 text-xs font-medium text-secondary hover:bg-surface-2"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <button type="button" onClick={reset} className="w-fit text-xs font-medium text-accent">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
              <p className="text-xs text-muted">
                There&apos;s no email delivery in this system. Create the account with a password you choose or
                generate, then pass it to the person directly. They can change it later from their profile.
              </p>
              {error && (
                <p className="rounded-lg px-3 py-2 text-sm" style={{ color: "var(--status-critical)" }}>
                  {error}
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-secondary">Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-secondary">Name (optional)</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-secondary">Role</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as CompanyRole)}
                    className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                  >
                    <option value="COMPANY_MEMBER">Member</option>
                    <option value="COMPANY_ADMIN">Admin</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-secondary">Initial password</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="leave blank to generate"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setPassword(generatePassword())}
                      className="shrink-0 rounded-lg border border-hairline px-2.5 text-xs font-medium text-secondary hover:bg-surface-2"
                    >
                      Generate
                    </button>
                  </div>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Creating…" : "Create account"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
