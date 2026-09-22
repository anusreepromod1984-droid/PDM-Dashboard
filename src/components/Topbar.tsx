"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMachines, useRealtime } from "@/context/RealtimeProvider";
import { useCompany } from "@/context/CompanyProvider";
import { LiveClock } from "@/components/LiveClock";
import { ProfileButton } from "@/components/ProfileButton";
import { TourRestartButton } from "@/components/tour/TourLauncher";
import { IconDotsGrid, IconEdit, IconSparkle } from "@/components/icons";
import { machineViewLabel } from "@/lib/machineViews";

/** Breadcrumb treats segment 0 as the company slug (validated by CompanyGate) and everything after it as what the old flat routes used to call segment 0. */
function useBreadcrumb() {
  const pathname = usePathname();
  const machines = useMachines();
  const { slug } = useCompany();
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== slug) return []; // mid-redirect — render nothing rather than garbage
  const rest = segments.slice(1);

  if (rest.length === 0) return ["Overview"];
  if (rest[0] === "settings") return ["Settings"];
  if (rest[0] === "crm") return ["CRM"];
  if (rest[0] === "calendar") return ["Calendar"];
  if (rest[0] === "profile") return ["Profile"];
  if (rest[0] === "admin") return ["Administration"];
  if (rest[0] === "machines" && rest[1]) {
    const machine = machines.find((m) => m.id === rest[1]);
    const crumbs = [machine?.name ?? rest[1]];
    crumbs.push(rest[2] ? machineViewLabel(rest[2]) : "Overview");
    return crumbs;
  }
  return [];
}

function MobileNavSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const machines = useMachines();
  const { routes } = useCompany();

  return (
    <select
      className="rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-primary md:hidden"
      value={pathname}
      onChange={(e) => router.push(e.target.value)}
    >
      <option value={routes.home()}>Overview</option>
      <option value={routes.crm()}>CRM</option>
      <option value={routes.calendar()}>Calendar</option>
      <optgroup label="Machines">
        {machines.map((m) => (
          <option key={m.id} value={routes.machine(m.id)}>
            {m.name}
          </option>
        ))}
      </optgroup>
      <option value={routes.settings()}>Settings</option>
    </select>
  );
}

export function Topbar({
  onToggleSidebar,
  onToggleAssistant,
}: {
  onToggleSidebar: () => void;
  onToggleAssistant: () => void;
}) {
  const crumbs = useBreadcrumb();
  const { activeAlerts } = useRealtime();
  const { canEditDashboard, routes } = useCompany();
  const hasActiveAlerts = Object.values(activeAlerts).some((breaches) => breaches.length > 0);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-hairline bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          data-tour="topbar-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          title="Toggle menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
        >
          <IconDotsGrid className="h-[18px] w-[18px]" />
        </button>

        <Image
          src="/greenbotz-logo.png"
          alt="Greenbotz"
          width={2000}
          height={403}
          priority
          className="object-contain"
          style={{ width: 110, height: "auto" }}
        />

        <MobileNavSelect />
        <div className="hidden min-w-0 items-baseline gap-2 md:flex">
        {crumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-2 min-w-0">
            {idx > 0 && <span className="text-muted">/</span>}
            <span
              className={`truncate ${
                idx === crumbs.length - 1
                  ? "text-base font-semibold text-primary"
                  : "text-sm text-muted"
              }`}
            >
              {crumb}
            </span>
          </span>
        ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <LiveClock />
        <TourRestartButton />
        {canEditDashboard && (
          <Link
            href={routes.dashboardPreview()}
            aria-label="Edit dashboard"
            title="Edit dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
          >
            <IconEdit className="h-[18px] w-[18px]" />
          </Link>
        )}
        <button
          type="button"
          data-tour="topbar-ai-assistant"
          onClick={onToggleAssistant}
          aria-label="Toggle AI assistant"
          title="AI assistant"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
        >
          <IconSparkle className="h-[18px] w-[18px]" />
          {hasActiveAlerts && (
            <span
              className="pulse-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--status-critical)" }}
            />
          )}
        </button>
        <ProfileButton />
      </div>
    </header>
  );
}
