"use client";

import { useRealtime } from "@/context/RealtimeProvider";
import { IconSparkle } from "@/components/icons";
import { logThreeDEvent } from "@/lib/threeDEventLog";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

/**
 * Standalone floating open/close button for the AI assistant — stands in for the
 * Topbar's sparkle button, which doesn't exist here since the /3d flow has no topbar.
 * Uses the shared .three-d-panel translucent background (globals.css), matching
 * HomeLink/ThreeDLogoutButton, instead of an opaque bg-surface.
 */
export function ThreeDChatToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const ref = useEntranceAnimation<HTMLButtonElement>(3);
  const { activeAlerts } = useRealtime();
  const hasActiveAlerts = Object.values(activeAlerts).some((breaches) => breaches.length > 0);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        logThreeDEvent("ai assistant clicked");
        onToggle();
      }}
      aria-label="Toggle AI assistant"
      title="AI assistant"
      // pointer-events-auto: this button is a child of ThreeDShell's root wrapper,
      // which is pointer-events-none (so clicks fall through to the 3D world by
      // default) — without re-declaring auto here, this button would inherit that
      // none and become unclickable too.
      className="three-d-panel pointer-events-auto fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-hairline text-secondary shadow-2xl transition-colors hover:text-primary"
    >
      <IconSparkle className="h-5 w-5 text-accent" />
      {hasActiveAlerts && !open && (
        <span
          className="pulse-dot absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--status-critical)" }}
        />
      )}
    </button>
  );
}
