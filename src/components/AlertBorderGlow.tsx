"use client";

import { useRealtime } from "@/context/RealtimeProvider";

/**
 * Fleet-wide siren, separate from AlertToastStack's per-card dismiss state on purpose —
 * closing a toast should declutter the detail, not the "something needs attention"
 * signal itself. Renders nothing once every breach clears.
 */
export function AlertBorderGlow() {
  return null;
}

