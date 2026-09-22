"use client";

import { useRouter } from "next/navigation";
import { useGbotzAuth } from "@/context/GbotzAuthProvider";
import { useTheme } from "@/context/ThemeProvider";
import { Card } from "@/components/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GBOTZ } from "@/lib/routes";

export default function GbotzProfilePage() {
  const { admin, logout } = useGbotzAuth();
  const { theme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace(GBOTZ.login());
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-primary">Profile</h1>
        <p className="mt-1 text-sm text-muted">Gbotz staff account.</p>
      </div>

      <Card title="Account">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 text-sm text-primary">{admin?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
            <dd className="mt-1 text-sm text-primary">{admin?.name ?? "—"}</dd>
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

      <Card title="Appearance" subtitle="Choose how the dashboard looks.">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-secondary">
            Currently <span className="font-medium text-primary">{theme}</span> mode
          </span>
        </div>
      </Card>
    </div>
  );
}
