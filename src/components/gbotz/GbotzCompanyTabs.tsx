"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { GBOTZ } from "@/lib/routes";
import type { GbotzCompany } from "@/lib/gbotzTypes";

const TABS = [
  { slug: "", label: "General" },
  { slug: "users", label: "Users" },
  { slug: "machines", label: "Machines" },
  { slug: "floor-map", label: "Floor map" },
];

export function GbotzCompanyTabs({ companyId, children }: { companyId: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSWR(`/api/gbotz/companies/${companyId}`, (p) =>
    apiFetch<{ company: GbotzCompany }>(p)
  );
  const base = GBOTZ.company(companyId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-primary">{data?.company.name ?? "Company"}</h1>
        <p className="mt-0.5 text-sm text-muted">/{data?.company.slug ?? "…"}</p>
      </div>

      <nav className="flex gap-1 border-b border-hairline">
        {TABS.map((tab) => {
          const href = tab.slug ? `${base}/${tab.slug}` : base;
          const active = pathname === href;
          return (
            <Link
              key={tab.slug}
              href={href}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "border-accent text-accent" : "border-transparent text-muted hover:text-primary"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
