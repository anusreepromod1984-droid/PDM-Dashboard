import type { Severity } from "@/lib/types";
import { IconAlertTriangle } from "@/components/icons";

const CONFIG: Record<Severity, { label: string; color: string; rgbVar: string }> = {
  good: { label: "Normal", color: "var(--status-good)", rgbVar: "--status-good-rgb" },
  warning: { label: "Watch", color: "var(--status-warning)", rgbVar: "--status-warning-rgb" },
  critical: { label: "Critical", color: "var(--status-critical)", rgbVar: "--status-critical-rgb" },
};

export function StatusBadge({ severity }: { severity: Severity }) {
  const config = CONFIG[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      // rgb()-with-alpha rather than color-mix() — same rendered color, but supported
      // by far older browser engines (see globals.css's "-rgb" companion properties).
      style={{ backgroundColor: `rgb(var(${config.rgbVar}) / 16%)`, color: config.color }}
    >
      {severity !== "good" && <IconAlertTriangle className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
