"use client";

import type { Severity } from "@/lib/types";
import { IconAlertTriangle } from "@/components/icons";
import { useLanguage } from "@/context/LanguageProvider";

const CONFIG: Record<Severity, { key: string; fallback: string; color: string; rgbVar: string }> = {
  good: { key: "normal", fallback: "Normal", color: "var(--status-good)", rgbVar: "--status-good-rgb" },
  warning: { key: "warning", fallback: "Watch", color: "var(--status-warning)", rgbVar: "--status-warning-rgb" },
  critical: { key: "critical", fallback: "Critical", color: "var(--status-critical)", rgbVar: "--status-critical-rgb" },
};

export function StatusBadge({ severity, localized = false }: { severity: Severity; localized?: boolean }) {
  const { t } = useLanguage();
  const config = CONFIG[severity] ?? CONFIG.good;
  const label = localized ? (t(config.key) || config.fallback) : config.fallback;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `rgb(var(${config.rgbVar}) / 16%)`, color: config.color }}
    >
      {severity !== "good" && <IconAlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );
}
