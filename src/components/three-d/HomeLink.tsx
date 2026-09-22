"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompany } from "@/context/CompanyProvider";
import { stripTrailingSlash } from "@/lib/routes";
import { IconHome } from "@/components/icons";
import { logThreeDEvent } from "@/lib/threeDEventLog";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

/** The only way back to the plant overview from a machine page, now that the sidebar
 *  is gone — deliberately just this, no per-machine list (that now lives in the
 *  overview page's own right-hand panel, styled as MachineCard tiles). Hidden on the
 *  overview page itself — a link back to the page you're already on is redundant. */
export function HomeLink() {
  // Called unconditionally, before the early-return below, per rules of hooks — this
  // is the first thing to reveal in /3d's cinematic entrance sequence (index 0).
  const ref = useEntranceAnimation<HTMLAnchorElement>(0);
  const pathname = usePathname();
  const { routes } = useCompany();
  const href = routes.home();
  // stripTrailingSlash: see ThreeDGate — usePathname() can reflect a trailing slash
  // the URL was actually requested with, which route builders like this one never
  // produce.
  // We're already on the overview page — a link back to it is redundant.
  if (stripTrailingSlash(pathname) === href) return null;

  return (
    <Link
      ref={ref}
      href={href}
      onClick={() => logThreeDEvent("home clicked")}
      className="three-d-panel flex items-center gap-1.5 rounded-2xl border border-hairline px-4 py-3 text-xs font-medium text-secondary shadow-2xl transition-colors hover:text-primary"
    >
      <IconHome className="h-3.5 w-3.5" />
      Home
    </Link>
  );
}
