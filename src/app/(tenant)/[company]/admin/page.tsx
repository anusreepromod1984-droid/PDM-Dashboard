"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components/Card";
import { UserTable } from "@/components/users/UserTable";
import { AddUserForm, type CreateUserInput, type CreateUserResult } from "@/components/users/AddUserForm";
import type { CompanyRole, CompanyUserSummary } from "@/lib/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { data, mutate } = useSWR("/api/company/users", (p) => apiFetch<{ users: CompanyUserSummary[] }>(p));

  async function handleCreate(input: CreateUserInput): Promise<CreateUserResult> {
    const result = await apiFetch<{ user: CompanyUserSummary; initialPassword: string }>("/api/company/users", {
      method: "POST",
      body: input,
    });
    await mutate();
    return result;
  }

  async function handleUpdateRole(userId: string, role: CompanyRole) {
    await apiFetch(`/api/company/users/${userId}`, { method: "PATCH", body: { role } });
    await mutate();
  }

  async function handleResetPassword(userId: string) {
    const result = await apiFetch<{ newPassword: string }>(`/api/company/users/${userId}/reset-password`, {
      method: "POST",
      body: {},
    });
    await mutate();
    return result;
  }

  async function handleRemove(userId: string) {
    await apiFetch(`/api/company/users/${userId}`, { method: "DELETE" });
    await mutate();
  }

  async function handleToggleDashboardAccess(userId: string, canEditDashboard: boolean) {
    await apiFetch(`/api/company/users/${userId}/dashboard-access`, {
      method: "PATCH",
      body: { canEditDashboard },
    });
    await mutate();
  }

  return (
    <Card title="Users" subtitle="People who can sign in to your company's dashboard.">
      <div className="flex flex-col gap-4">
        <AddUserForm onCreate={handleCreate} />
        {data && (
          <UserTable
            users={data.users}
            currentUserId={user?.id}
            onUpdateRole={handleUpdateRole}
            onResetPassword={handleResetPassword}
            onRemove={handleRemove}
            onToggleDashboardAccess={handleToggleDashboardAccess}
          />
        )}
      </div>
    </Card>
  );
}
