"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navClass } from "@/components/nav/navStyles";
import { IconBuilding, IconCpu, IconGrid } from "@/components/icons";
import { GBOTZ } from "@/lib/routes";

// Docs lives behind a topbar button (next to the profile button), not here — it's a
// full-screen destination outside this app shell, see GbotzTopbar/GbotzGate.
const NAV = [
  { href: GBOTZ.home(), label: "Overview", icon: IconGrid },
  { href: GBOTZ.companies(), label: "Companies", icon: IconBuilding },
  { href: GBOTZ.machines(), label: "Machines", icon: IconCpu },
];

/**
 * Deliberately NOT the tenant Sidebar — that component calls useMachines(), which
 * requires RealtimeProvider, which /gbotz never mounts (REST-only, no telemetry; see
 * the confirmed "configuration-only" scope decision). Shares only pure styling
 * helpers (navClass) with the tenant sidebar.
 */
export function GbotzSidebar({ open }: { open: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex shrink-0 overflow-hidden border-hairline bg-surface transition-all duration-200 ${
        open ? "w-64 border-r" : "w-0 border-r-0"
      }`}
    >
      <div className="flex h-full w-64 flex-col">
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Gbotz Operations
          </div>
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== GBOTZ.home() && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} className={navClass(active)}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
