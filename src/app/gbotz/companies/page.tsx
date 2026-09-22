"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { GBOTZ } from "@/lib/routes";
import { Card } from "@/components/Card";
import type { GbotzCompany } from "@/lib/gbotzTypes";

export default function GbotzCompaniesPage() {
  const { data } = useSWR("/api/gbotz/companies", (p) => apiFetch<{ companies: GbotzCompany[] }>(p));
  const [search, setSearch] = useState("");

  const companies = (data?.companies ?? []).filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-primary">Companies</h1>
          <p className="mt-1 text-sm text-muted">Every tenant on this system.</p>
        </div>
        <Link
          href={GBOTZ.companyNew()}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          New company
        </Link>
      </div>

      <Card>
        <input
          type="search"
          placeholder="Search by name or slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full max-w-sm rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-[11px] font-semibold uppercase tracking-wider text-muted">
                <th className="py-2 pr-3">Company</th>
                <th className="py-2 pr-3">Slug</th>
                <th className="py-2 pr-3">Users</th>
                <th className="py-2 pr-3">Machines</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-hairline last:border-0">
                  <td className="py-2.5 pr-3">
                    <Link href={GBOTZ.company(c.id)} className="font-medium text-primary hover:text-accent">
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-secondary">/{c.slug}</td>
                  <td className="py-2.5 pr-3 text-secondary">{c.userCount}</td>
                  <td className="py-2.5 pr-3 text-secondary">{c.machineCount}</td>
                  <td className="py-2.5 pr-3">
                    {c.active ? (
                      <span className="text-xs" style={{ color: "var(--status-good)" }}>Active</span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--status-critical)" }}>Suspended</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-muted">
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
