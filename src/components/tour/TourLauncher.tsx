"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useTour } from "@/context/TourProvider";
import { useCompany } from "@/context/CompanyProvider";
import { useRealtime } from "@/context/RealtimeProvider";
import { IconHelpCircle } from "@/components/icons";

const MOBILE_BREAKPOINT_PX = 768;

/**
 * No-render — watches the session and route, auto-starting the right tour the first
 * time a user with hasSeenTour === false lands on a page it applies to: Plant
 * Overview for the dashboard tour, any machine detail page for the machine tour.
 * Desktop-only (see MOBILE_BREAKPOINT_PX): several dashboard-tour targets live in
 * chrome that's cramped or hidden on a narrow viewport (Sidebar, the floor map's zoom
 * cluster) — the manual "?" button (TourRestartButton, below) still works there.
 * Also waits for the realtime socket's initial "bootstrap" payload (see
 * useRealtime().hasBootstrapped) before launching — the plant map, its legend, and
 * the machine tile are all driven by useMachines(), which stays empty until
 * bootstrap arrives. `connectionStatus === "connected"` fires on the socket's own
 * "connect" event, which lands *before* bootstrap, so it isn't enough by itself;
 * waiting for hasBootstrapped instead avoids needlessly time-skipping those steps
 * for every brand-new user instead of just companies with genuinely no placed
 * machines (whose bootstrap still arrives, just with an empty machine list).
 */
export function TourAutoTrigger() {
  const { user } = useAuth();
  const { hasSeenTour, activeTour, startTour } = useTour();
  const { slug, routes } = useCompany();
  const { hasBootstrapped } = useRealtime();
  const pathname = usePathname();

  useEffect(() => {
    if (!user || hasSeenTour !== false || activeTour) return;
    if (!hasBootstrapped) return;
    if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT_PX) return;
    if (pathname === routes.home()) {
      startTour("dashboard");
    } else if (pathname.startsWith(`/${slug}/machines/`)) {
      startTour("machine");
    }
  }, [user, hasSeenTour, activeTour, hasBootstrapped, pathname, slug, routes, startTour]);

  return null;
}

/**
 * Persistent manual re-entry point — the Topbar "?" button. Always navigates to Plant
 * Overview first for a predictable starting point, then replays the dashboard tour
 * (whose own last step chains into the machine tour), regardless of hasSeenTour.
 */
export function TourRestartButton() {
  const router = useRouter();
  const { routes } = useCompany();
  const { startTour } = useTour();

  return (
    <button
      type="button"
      onClick={() => {
        router.push(routes.home());
        startTour("dashboard");
      }}
      aria-label="Take the tour"
      title="Take the tour"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
    >
      <IconHelpCircle className="h-[18px] w-[18px]" />
    </button>
  );
}
