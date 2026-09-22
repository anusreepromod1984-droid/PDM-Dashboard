"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyProvider";

const TABS = [
  { slug: "", label: "Users" },
  { slug: "branding", label: "Branding" },
  { slug: "views", label: "Views" },
  { slug: "thresholds", label: "Thresholds" },
];

/**
 * Role-gates the whole /admin subtree client-side (a UX convenience — the real
 * enforcement is requireCompanyAdmin on every backend /api/company/* write route) and
 * renders the tab bar, reusing MachineTabs' exact visual pattern rather than
 * inventing new visual language.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAdmin, company, routes } = useCompany();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) router.replace(routes.home());
  }, [isAdmin, routes, router]);

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-2 text-sm text-muted">
        Loading…
      </div>
    );
  }

  const base = routes.admin();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-primary">Administration</h1>
        <p className="mt-1 text-sm text-muted">{company.name}</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-hairline">
        {TABS.map((tab) => {
          const href = tab.slug ? `${base}/${tab.slug}` : base;
          const active = pathname === href;
          return (
            <Link
              key={tab.slug}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
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
