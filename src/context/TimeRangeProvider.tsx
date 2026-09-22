"use client";

import { createContext, useContext, useState } from "react";
import { DEFAULT_RANGE } from "@/lib/constants";
import type { CustomRange, TimeRangeKey } from "@/lib/types";

interface TimeRangeContextValue {
  range: TimeRangeKey;
  setRange: (range: TimeRangeKey) => void;
  /** Only meaningful when range === "custom"; null until the user applies a custom range. */
  customRange: CustomRange | null;
  setCustomRange: (range: CustomRange | null) => void;
}

// Exported so dashboardTemplate/useTemplateMachineSeries.ts can read the range via
// useContext directly (never throwing) instead of the throwing useTimeRange() below —
// machine-scoped template elements must work both on machine-detail pages (a
// TimeRangeProvider is always mounted there, see MachineHeader) and on the fleet page
// (no TimeRangeProvider at all), degrading to "live" in the latter case.
export const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

/**
 * Mounted once in the machine layout (not per-view) — Next's layout doesn't remount
 * between sibling tab routes, so the selected range survives Overview -> Vibration ->
 * Energy navigation for free, and there's one picker UI instead of six.
 */
export function TimeRangeProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = useState<TimeRangeKey>(DEFAULT_RANGE);
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);
  return (
    <TimeRangeContext.Provider value={{ range, setRange, customRange, setCustomRange }}>
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRange(): TimeRangeContextValue {
  const ctx = useContext(TimeRangeContext);
  if (!ctx) throw new Error("useTimeRange must be used within TimeRangeProvider");
  return ctx;
}
