"use client";

import { useMachines } from "@/context/RealtimeProvider";
import { useTemplateMachineSeries } from "@/lib/dashboardTemplate/useTemplateMachineSeries";
import { GaugeStatCard } from "@/components/GaugeStatCard";
import { MiniArcGauge, type ArcZone } from "@/components/charts/mini/MiniArcGauge";
import { MiniRadialProgress } from "@/components/charts/mini/MiniRadialProgress";
import { resolveStatIcon } from "@/lib/dashboardTemplate/statIcons";
import { IconGauge } from "@/components/icons";
import { formatNumber } from "@/lib/format";
import { motorTempSeverity, pressureSeverity, vibrationSeverity } from "@/lib/constants";
import type { Severity } from "@/lib/types";
import type { GaugeStatMetric } from "@/lib/dashboardTemplate/gaugeStatMetrics";

export interface TemplateGaugeStatCardProps {
  machineId: string;
  metric: GaugeStatMetric;
  label: string;
  icon?: string;
}

// Same zone/band functions as MachineOverviewView.tsx / PressureView.tsx — kept as a
// hand-synced duplicate rather than a shared import, same rationale as those files'
// own copies (see their top-of-file comments): the hardcoded and Liquid-template view
// systems are deliberately independent implementations.
function vibrationZones(): ArcZone[] {
  return [
    { to: 4.5, color: "var(--status-good)" },
    { to: 11, color: "var(--status-warning)" },
    { to: 12, color: "var(--status-critical)" },
  ];
}

function motorTempZones(): ArcZone[] {
  return [
    { to: 70, color: "var(--status-good)" },
    { to: 90, color: "var(--status-warning)" },
    { to: 100, color: "var(--status-critical)" },
  ];
}

function bandZones(min: number, max: number, goodFrom: number, goodTo: number): ArcZone[] {
  const span = max - min;
  return [
    { to: goodFrom, color: "var(--status-warning)" },
    { to: goodTo, color: "var(--status-good)" },
    { to: goodTo + span * 0.08, color: "var(--status-warning)" },
    { to: max, color: "var(--status-critical)" },
  ];
}

function pressureZones(): ArcZone[] {
  return [
    { to: 2, color: "var(--status-warning)" },
    { to: 7, color: "var(--status-good)" },
    { to: 7.5, color: "var(--status-warning)" },
    { to: 9, color: "var(--status-critical)" },
  ];
}

interface GaugeSpec {
  value: number;
  min: number;
  max: number;
  zones: ArcZone[];
  sweep?: number;
  valueLabel: string;
  subLabel?: string;
  size: number;
  severity?: Severity;
}

// Every metric except machineLoad renders through MiniArcGauge with these specs — one
// place that decides the numbers, so the "no data yet" branch below doesn't have to
// duplicate each case's zones/min/max just to show a dash.
function specFor(metric: Exclude<GaugeStatMetric, "machineLoad">, latest: ReturnType<typeof useTemplateMachineSeries>["latest"], ratedRpm: number | undefined): GaugeSpec {
  switch (metric) {
    case "rpm": {
      const setpoint = ratedRpm || 1500;
      const max = Math.max(2500, Math.round((setpoint * 1.6) / 100) * 100);
      const value = latest?.rpm ?? 0;
      return {
        value,
        min: 0,
        max,
        zones: bandZones(0, max, setpoint * 0.95, setpoint * 1.05),
        sweep: 250,
        size: 140,
        valueLabel: formatNumber(latest?.rpm, 0),
        subLabel: `Setpoint ${setpoint.toFixed(0)} RPM`,
      };
    }
    case "vibration":
      return {
        value: latest?.imuAcceleration ?? 0,
        min: 0,
        max: 12,
        zones: vibrationZones(),
        size: 110,
        valueLabel: formatNumber(latest?.imuAcceleration, 1),
        subLabel: "mm/s",
        severity: latest
          ? vibrationSeverity(latest.imuAcceleration, latest.rpm, latest.sensorStatus?.ok)
          : undefined,
      };
    case "motorTemp":
      return {
        value: latest?.temperature.motor ?? 0,
        min: 0,
        max: 100,
        zones: motorTempZones(),
        size: 110,
        valueLabel: latest ? `${formatNumber(latest.temperature.motor, 0)}°C` : "--",
        severity: latest ? motorTempSeverity(latest.temperature.motor) : undefined,
      };
    case "humidity":
      return {
        value: latest?.humidity ?? 0,
        min: 0,
        max: 100,
        zones: bandZones(0, 100, 40, 60),
        size: 110,
        valueLabel: latest ? `${formatNumber(latest.humidity, 0)}%` : "--",
        subLabel: "RH",
      };
    case "pressure":
      return {
        value: latest?.pressure ?? 0,
        min: 0,
        max: 9,
        zones: pressureZones(),
        size: 130,
        valueLabel: latest ? `${formatNumber(latest.pressure, 2)} Bar` : "--",
        severity: latest ? pressureSeverity(latest.pressure) : undefined,
      };
  }
}

export function TemplateGaugeStatCard({ machineId, metric, label, icon }: TemplateGaugeStatCardProps) {
  const { latest } = useTemplateMachineSeries(machineId);
  const machines = useMachines();
  const machine = machines.find((m) => m.id === machineId);
  const Icon = resolveStatIcon(icon) ?? IconGauge;

  if (metric === "machineLoad") {
    return (
      <GaugeStatCard icon={Icon} title={label}>
        <MiniRadialProgress
          fraction={(latest?.energyMeter.machineLoad ?? 0) / 100}
          label={latest ? `${formatNumber(latest.energyMeter.machineLoad, 0)}%` : "--"}
          color="var(--accent)"
          size={96}
        />
      </GaugeStatCard>
    );
  }

  const spec = specFor(metric, latest, machine?.ratedRpm);
  return (
    <GaugeStatCard icon={Icon} title={label} severity={spec.severity}>
      <MiniArcGauge
        value={spec.value}
        min={spec.min}
        max={spec.max}
        zones={spec.zones}
        sweep={spec.sweep}
        size={spec.size}
        valueLabel={spec.valueLabel}
        subLabel={spec.subLabel}
      />
    </GaugeStatCard>
  );
}
