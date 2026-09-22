"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompany } from "@/context/CompanyProvider";
import { stripTrailingSlash } from "@/lib/routes";
import { MACHINE_VIEWS } from "@/lib/machineViews";
import { logThreeDEvent } from "@/lib/threeDEventLog";

/**
 * The view-switcher tab strip — shared by MachineTabs (regular flow, bundled with the
 * machine name/location header and Super Dashboard button) and the /3d flow's machine
 * layout (just the strip, no header/Super Dashboard — see plan). Filters to the
 * company's enabledViews and resolves hrefs via useCompany().routes, so it lands on
 * /[slug]/machines/[id]/... or /3d/[slug]/machines/[id]/... automatically depending on
 * which CompanyContext provider is mounted above it.
 */
export function MachineViewNav({ machineId }: { machineId: string }) {
  const pathname = usePathname();
  const normalizedPathname = stripTrailingSlash(pathname);
  const { routes, enabledViews } = useCompany();

  return (
    <nav data-tour="machine-view-nav" className="flex gap-1 overflow-x-auto border-b border-hairline">
      {MACHINE_VIEWS.filter((view) => enabledViews.includes(view.key)).map((view) => {
        const href = routes.machineView(machineId, view.slug);
        const active = normalizedPathname === href;
        const Icon = view.icon;
        return (
          <Link
            key={view.slug}
            href={href}
            onClick={() => logThreeDEvent(`${view.key} clicked`)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "border-accent text-accent" : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
