export function formatNumber(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "--";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatWithUnit(value: number | undefined | null, unit: string, decimals = 1): string {
  return `${formatNumber(value, decimals)}${unit ? ` ${unit}` : ""}`;
}

export function formatClock(timestamp: number | undefined | null): string {
  if (!timestamp) return "--:--:--";
  return new Date(timestamp).toLocaleTimeString(undefined, { hour12: false });
}

export function formatHours(hours: number | undefined | null): string {
  if (hours === undefined || hours === null || Number.isNaN(hours)) return "--";
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return `${days}d ${rem}h`;
}

export function timeAgo(timestamp: number | undefined | null, now: number): string {
  if (!timestamp) return "never";
  const diff = Math.max(0, now - timestamp);
  if (diff < 1500) return "just now";
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return `${Math.round(diff / 86400000)}d ago`;
}
