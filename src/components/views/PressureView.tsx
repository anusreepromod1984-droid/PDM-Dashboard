"use client";

import { useMachineSeries } from "@/hooks/useMachineSeries";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { GaugeStatCard } from "@/components/GaugeStatCard";
import { WaitingForData } from "@/components/WaitingForData";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { MiniArcGauge, type ArcZone } from "@/components/charts/mini/MiniArcGauge";
import { useChartPalette } from "@/components/charts/chartTheme";
import { pressureSeverity } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { hasTelemetryField } from "@/lib/telemetry";
import { IconGauge } from "@/components/icons";

// Bands from defaultAlertProfile.ts's "Pressure sensor" group: good 2-7 Bar,
// warning below 2 or up to the 7.5 Bar alert_threshold, critical beyond that.
function pressureZones(): ArcZone[] {
  return [
    { to: 2, color: "var(--status-warning)" },
    { to: 7, color: "var(--status-good)" },
    { to: 7.5, color: "var(--status-warning)" },
    { to: 9, color: "var(--status-critical)" },
  ];
}

export function PressureView({ machineId }: { machineId: string }) {
  const { latest, history } = useMachineSeries(machineId);
  const palette = useChartPalette();

  if (!latest) return <WaitingForData />;

  const hasPressure = hasTelemetryField(latest, "pressure");
  const severity = hasPressure ? pressureSeverity(latest.pressure) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GaugeStatCard icon={IconGauge} title="Pressure" severity={severity}>
          <MiniArcGauge
            value={hasPressure ? latest.pressure : 0}
            min={0}
            max={9}
            zones={pressureZones()}
            valueLabel={hasPressure ? `${formatNumber(latest.pressure, 2)} Bar` : "N/A"}
            size={130}
          />
        </GaugeStatCard>
        <StatCard
          label="Pressure"
          value={hasPressure ? formatNumber(latest.pressure, 2) : "N/A"}
          unit={hasPressure ? "Bar" : undefined}
          severity={severity}
          hint="Normal 2-7 Bar · alert above 7.5 Bar"
          icon={<IconGauge className="h-4 w-4" />}
        />
      </div>

      <Card title="Pressure trend" subtitle="Bar over time">
        <TrendLineChart
          yTitle="Bar"
          series={[
            { label: "Pressure", color: palette.series[0], suffix: "Bar", points: history.filter((h) => hasTelemetryField(h, "pressure")).map((h) => ({ x: h.timestamp, y: h.pressure })) },
          ]}
          thresholds={[{ value: 7.5, label: "Alert" }]}
        />
      </Card>
    </div>
  );
}
