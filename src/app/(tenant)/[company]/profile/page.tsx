"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/context/ThemeProvider";
import { useTour } from "@/context/TourProvider";
import { useCompany } from "@/context/CompanyProvider";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { routes } from "@/lib/routes";

export default function ProfilePage() {
  const { user, logout, refresh } = useAuth();
  const { theme } = useTheme();
  const { startTour } = useTour();
  const { routes: companyRoutes } = useCompany();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace(routes.login());
  }

  function handleTakeTour() {
    // Same behavior as the Topbar "?" button — always start from Plant Overview so
    // the tour has a predictable, consistent starting point.
    router.push(companyRoutes.home());
    startTour("dashboard");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangeError(null);
    if (newPassword !== confirmPassword) {
      setChangeError("New passwords don't match");
      return;
    }
    setChanging(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      await refresh();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChanged(true);
    } catch (err) {
      setChangeError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">Profile</h1>
        <p className="mt-1 text-sm text-muted">Account and appearance settings.</p>
      </div>

      <Card title="Account">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 text-sm text-primary">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
            <dd className="mt-1 text-sm text-primary">{user?.name ?? "—"}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-fit rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
        >
          Log out
        </button>
      </Card>

      <Card
        title="Change password"
        subtitle={
          user?.mustChangePassword
            ? "An administrator set your password directly — please choose your own before continuing."
            : undefined
        }
      >
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          {changeError && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ color: "var(--status-critical)" }}>
              {changeError}
            </p>
          )}
          {changed && (
            <p className="rounded-lg px-3 py-2 text-sm" style={{ color: "var(--status-good)" }}>
              Password changed.
            </p>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Current password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-secondary">New password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-secondary">Confirm new password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={changing}
            className="mt-1 w-fit rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {changing ? "Changing…" : "Change password"}
          </button>
        </form>
      </Card>

      <Card title="Appearance" subtitle="Choose how the dashboard looks.">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-secondary">
            Currently <span className="font-medium text-primary">{theme}</span> mode
          </span>
        </div>
      </Card>

      <Card title="Product tour" subtitle="Walk back through the dashboard and machine tour.">
        <button
          type="button"
          onClick={handleTakeTour}
          className="w-fit rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
        >
          Take the tour
        </button>
      </Card>
    </div>
  );
}
