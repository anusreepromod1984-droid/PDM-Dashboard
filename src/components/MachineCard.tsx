"use client";

import Link from "next/link";
import { useMachineTelemetry } from "@/context/RealtimeProvider";
import { useCompany } from "@/context/CompanyProvider";
import { useNow } from "@/hooks/useNow";
import { faultSeverity, motorTempSeverity, vibrationSeverity, worstSeverity } from "@/lib/constants";
import { formatNumber, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { IconChevronRight } from "@/components/icons";
import { logThreeDEvent } from "@/lib/threeDEventLog";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";

export function MachineCard({
  id,
  name,
  location,
  online,
  staggerIndex = 0,
}: {
  id: string;
  name: string;
  location: string;
  online: boolean;
  /** This card's position in a list of siblings mounting together — see Card's
   *  staggerIndex for the same convention. */
  staggerIndex?: number;
}) {
  const ref = useEntranceAnimation<HTMLAnchorElement>(staggerIndex);
  const { routes } = useCompany();
  const { latest, freshness } = useMachineTelemetry(id);
  const now = useNow(1000);
  const stale = freshness === "stale" || freshness === "offline";

  const worstFault =
    latest && latest.motorFaults.length > 0
      ? latest.motorFaults.reduce((a, b) => (a.confidence > b.confidence ? a : b))
      : null;

  const severity = latest
    ? worstSeverity([
        worstFault ? faultSeverity(worstFault.confidence) : "good",
        vibrationSeverity(latest.imuAcceleration),
        motorTempSeverity(latest.temperature.motor),
      ])
    : "good";

  return (
    <Link
      ref={ref}
      href={routes.machine(id)}
      data-stale={stale}
      onClick={() => logThreeDEvent(`${name} clicked`)}
      className="group flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-5 transition-colors hover:border-baseline"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${online ? "pulse-dot" : ""}`}
              style={{ backgroundColor: online ? "var(--status-good)" : "var(--text-muted)" }}
            />
            <h3 className="truncate text-sm font-semibold text-primary">{name}</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted">{location}</p>
        </div>
        <IconChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
      </div>

      {latest ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="RPM" value={formatNumber(latest.rpm, 0)} />
            <MiniStat label="Vibration" value={`${formatNumber(latest.imuAcceleration, 1)}`} unit="mm/s" />
            <MiniStat label="Motor temp" value={`${formatNumber(latest.temperature.motor, 0)}`} unit="°C" />
            <MiniStat label="Load" value={`${formatNumber(latest.energyMeter.machineLoad, 0)}`} unit="%" />
            <MiniStat label="Power" value={`${formatNumber(latest.energyMeter.power, 1)}`} unit="kW" />
            <MiniStat label="Sound" value={`${formatNumber(latest.microphone.soundLevel, 0)}`} unit="dB" />
          </div>
          <div className="flex items-center justify-between border-t border-hairline pt-3">
            <span className={`text-xs ${stale ? "font-medium" : "text-muted"}`} style={stale ? { color: "var(--status-warning)" } : undefined}>
              Updated {timeAgo(latest.timestamp, now)}
            </span>
            <StatusBadge severity={severity} />
          </div>
        </>
      ) : (
        <p className="text-xs text-muted">Waiting for telemetry…</p>
      )}
    </Link>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  const { display, ref } = useAnimatedValue<HTMLDivElement>(value);

  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div ref={ref} className="text-sm font-semibold tabular-nums text-primary">
        {display}
        {unit && <span className="ml-1 text-xs font-normal text-muted">{unit}</span>}
      </div>
    </div>
  );
}
