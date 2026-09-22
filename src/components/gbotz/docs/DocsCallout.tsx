import type { ReactNode } from "react";
import { IconAlertTriangle } from "@/components/icons";

export function DocsCallout({ type = "note", children }: { type?: "note" | "warning"; children: ReactNode }) {
  const color = type === "warning" ? "var(--status-warning)" : "var(--accent)";
  return (
    <div
      className="flex gap-2.5 rounded-lg border-l-4 py-2.5 pl-3 pr-3 text-sm"
      style={{ borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)` }}
    >
      {type === "warning" && (
        <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
      )}
      <div className="text-secondary [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary">
        {children}
      </div>
    </div>
  );
}
