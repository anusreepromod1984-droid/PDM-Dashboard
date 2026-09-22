"use client";

import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

/**
 * Thin client wrapper around useEntranceAnimation for server-component layouts that
 * need an animated panel but can't call hooks themselves (e.g. machines/[machineId]/
 * layout.tsx, an async server component reading `params`) — avoids restructuring
 * those layouts into client components just to animate one wrapper div.
 */
export function EntranceDiv({
  staggerIndex = 0,
  className,
  children,
}: {
  staggerIndex?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useEntranceAnimation<HTMLDivElement>(staggerIndex);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
