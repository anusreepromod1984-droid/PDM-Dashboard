"use client";

import { use } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/Card";
import { UserTable } from "@/components/users/UserTable";
import { AddUserForm, type CreateUserInput, type CreateUserResult } from "@/components/users/AddUserForm";
import type { CompanyRole, CompanyUserSummary } from "@/lib/types";

export default function GbotzCompanyUsersPage({
  params,
}: PageProps<"/gbotz/companies/[companyId]/users">) {
  const { companyId } = use(params);
  const { data, mutate } = useSWR(`/api/gbotz/companies/${companyId}/users`, (p) =>
    apiFetch<{ users: CompanyUserSummary[] }>(p)
  );

  async function handleCreate(input: CreateUserInput): Promise<CreateUserResult> {
    const result = await apiFetch<{ user: CompanyUserSummary; initialPassword: string }>(
      `/api/gbotz/companies/${companyId}/users`,
      { method: "POST", body: input }
    );
    await mutate();
    return result;
  }

  async function handleUpdateRole(userId: string, role: CompanyRole) {
    await apiFetch(`/api/gbotz/users/${userId}`, { method: "PATCH", body: { role } });
    await mutate();
  }

  async function handleResetPassword(userId: string) {
    const result = await apiFetch<{ newPassword: string }>(`/api/gbotz/users/${userId}/reset-password`, {
      method: "POST",
      body: {},
    });
    await mutate();
    return result;
  }

  async function handleRemove(userId: string) {
    await apiFetch(`/api/gbotz/users/${userId}`, { method: "DELETE" });
    await mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Users"
        subtitle="Accounts that can sign in to this company's dashboard."
        actions={<AddUserForm onCreate={handleCreate} />}
      >
        {data && (
          <UserTable
            users={data.users}
            onUpdateRole={handleUpdateRole}
            onResetPassword={handleResetPassword}
            onRemove={handleRemove}
          />
        )}
      </Card>
    </div>
  );
}
