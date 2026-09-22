"use client";

import { useState } from "react";
import type { CompanyRole, CompanyUserSummary } from "@/lib/types";

export interface UserTableProps {
  users: CompanyUserSummary[];
  /** Disables self-modification (own role/remove) when set — omit on the Gbotz surface, which has no self-row. */
  currentUserId?: string;
  onUpdateRole: (userId: string, role: CompanyRole) => Promise<void>;
  onResetPassword: (userId: string) => Promise<{ newPassword: string }>;
  onRemove: (userId: string) => Promise<void>;
  /** Renders the "Dashboard edit" column when provided — omit on the Gbotz surface, which has no use for it (staff already edit any company's dashboard directly). */
  onToggleDashboardAccess?: (userId: string, canEditDashboard: boolean) => Promise<void>;
}

/**
 * Shared, provider-agnostic table — safe to reuse between the tenant company-admin
 * users page and the Gbotz per-company users page (pure presentation + injected
 * callbacks), unlike the auth providers themselves. No new DataTable abstraction:
 * this is a plain semantic <table> styled with the app's existing tokens.
 */
export function UserTable({
  users,
  currentUserId,
  onUpdateRole,
  onResetPassword,
  onRemove,
  onToggleDashboardAccess,
}: UserTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ userId: string; password: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const adminCount = users.filter((u) => u.role === "COMPANY_ADMIN").length;

  async function handleRoleChange(user: CompanyUserSummary, role: CompanyRole) {
    setBusyId(user.id);
    try {
      await onUpdateRole(user.id, role);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleDashboardAccess(user: CompanyUserSummary, canEditDashboard: boolean) {
    if (!onToggleDashboardAccess) return;
    setBusyId(user.id);
    try {
      await onToggleDashboardAccess(user.id, canEditDashboard);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReset(user: CompanyUserSummary) {
    setBusyId(user.id);
    try {
      const { newPassword } = await onResetPassword(user.id);
      setResetResult({ userId: user.id, password: newPassword });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(user: CompanyUserSummary) {
    setBusyId(user.id);
    try {
      await onRemove(user.id);
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-hairline text-[11px] font-semibold uppercase tracking-wider text-muted">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Role</th>
            {onToggleDashboardAccess && <th className="py-2 pr-3">Dashboard edit</th>}
            <th className="py-2 pr-3">Added</th>
            <th className="py-2 pr-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isLastAdmin = user.role === "COMPANY_ADMIN" && adminCount <= 1;
            const disabled = isSelf || isLastAdmin || busyId === user.id;

            return (
              <tr key={user.id} className="border-b border-hairline last:border-0">
                <td className="py-2.5 pr-3 text-primary">{user.name ?? "—"}</td>
                <td className="py-2.5 pr-3 text-secondary">{user.email}</td>
                <td className="py-2.5 pr-3">
                  <select
                    value={user.role}
                    disabled={disabled}
                    onChange={(e) => handleRoleChange(user, e.target.value as CompanyRole)}
                    title={isSelf ? "You can't change your own role" : isLastAdmin ? "A company must have at least one administrator" : undefined}
                    className="rounded-lg border border-hairline bg-surface px-2 py-1 text-xs text-primary outline-none focus:border-accent disabled:opacity-50"
                  >
                    <option value="COMPANY_MEMBER">Member</option>
                    <option value="COMPANY_ADMIN">Admin</option>
                  </select>
                </td>
                {onToggleDashboardAccess && (
                  <td className="py-2.5 pr-3">
                    <input
                      type="checkbox"
                      checked={user.role === "COMPANY_ADMIN" || user.canEditDashboard}
                      disabled={user.role === "COMPANY_ADMIN" || busyId === user.id}
                      onChange={(e) => handleToggleDashboardAccess(user, e.target.checked)}
                      title={
                        user.role === "COMPANY_ADMIN"
                          ? "Admins can always edit the dashboard"
                          : "Let this employee edit the company dashboard"
                      }
                    />
                  </td>
                )}
                <td className="py-2.5 pr-3 text-muted">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="py-2.5 pr-3 text-right">
                  {resetResult?.userId === user.id ? (
                    <span className="font-mono text-xs text-primary">{resetResult.password}</span>
                  ) : confirmingId === user.id ? (
                    <span className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemove(user)}
                        className="text-xs font-medium"
                        style={{ color: "var(--status-critical)" }}
                      >
                        Confirm?
                      </button>
                      <button type="button" onClick={() => setConfirmingId(null)} className="text-xs text-muted">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleReset(user)}
                        disabled={busyId === user.id}
                        className="text-xs font-medium text-accent disabled:opacity-50"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(user.id)}
                        disabled={disabled}
                        title={isSelf ? "You can't remove yourself" : isLastAdmin ? "A company must have at least one administrator" : undefined}
                        className="text-xs font-medium disabled:opacity-50"
                        style={{ color: disabled ? undefined : "var(--status-critical)" }}
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
