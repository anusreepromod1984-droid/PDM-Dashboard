"use client";

import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
  staggerIndex = 0,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** This card's position in a list of siblings mounting together (e.g. a
   *  `.map((x, i) => <Card staggerIndex={i} ...>)`) — offsets its entrance so the
   *  list reads as a cascade instead of every card animating in at once. */
  staggerIndex?: number;
}) {
  const ref = useEntranceAnimation<HTMLElement>(staggerIndex);

  return (
    <section
      ref={ref}
      className={`flex flex-col rounded-xl border border-hairline bg-surface p-4 sm:p-5 ${className}`}
    >
      {(title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-primary">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
