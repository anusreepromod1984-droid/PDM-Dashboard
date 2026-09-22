"use client";

import { useNow } from "@/hooks/useNow";

export function LiveClock() {
  const now = useNow(1000);

  return (
    <span className="hidden font-mono text-xs text-muted sm:inline" suppressHydrationWarning>
      {new Date(now).toLocaleString(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })}
    </span>
  );
}
