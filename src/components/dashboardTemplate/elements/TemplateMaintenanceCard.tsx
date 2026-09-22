"use client";

import type { ReactNode } from "react";
import { MetricCard } from "@/components/MetricCard";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { MiniArcGauge, type ArcZone } from "@/components/charts/mini/MiniArcGauge";
import { MiniRadialProgress } from "@/components/charts/mini/MiniRadialProgress";
import { MiniLimitBars } from "@/components/charts/mini/MiniLimitBars";
import { MiniThresholdBar } from "@/components/charts/mini/MiniThresholdBar";
import { MiniWaveform } from "@/components/charts/mini/MiniWaveform";
import { MiniAlignmentDiagram } from "@/components/charts/mini/MiniAlignmentDiagram";
import { resolveStatIcon } from "@/lib/dashboardTemplate/statIcons";
import { IconGauge } from "@/components/icons";
import { useMachines } from "@/context/RealtimeProvider";
import { useMaintenanceMetrics } from "@/lib/dashboardTemplate/useMaintenanceMetrics";
import {
  MAINTENANCE_METRIC_META,
  SEVERITY_COLOR,
  type MaintenanceMetricKey,
  type MaintenanceMetricResult,
} from "@/lib/dashboardTemplate/maintenanceMetrics";

export interface TemplateMaintenanceCardProps {
  machineId: string;
  metric: MaintenanceMetricKey;
}

function vibrationZones(): ArcZone[] {
  return [
    { to: 4.5, color: "var(--status-good)" },
    { to: 11, color: "var(--status-warning)" },
    { to: 12, color: "var(--status-critical)" },
  ];
}

/** Fills the same slot as a mini chart when a card (or half of one) has no backing sensor. */
function NoSensorSlot({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-hairline p-3 text-center ${className ?? ""}`}>
      {label && <span className="text-[10px] font-medium text-muted">{label}</span>}
      <span className="text-[11px] text-muted">No sensor data</span>
    </div>
  );
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

function visualFor(metric: MaintenanceMetricKey, r: MaintenanceMetricResult): ReactNode {
  const color = SEVERITY_COLOR[r.severity];

  if (r.unavailable) {
    return <NoSensorSlot className="h-full w-full" />;
  }

  switch (metric) {
    case "vibration":
      return (
        <div className="flex w-full items-center gap-2">
          <MiniArcGauge
            value={r.value ?? 0}
            min={r.min ?? 0}
            max={r.max ?? 12}
            zones={vibrationZones()}
            valueLabel={(r.value ?? 0).toFixed(1)}
            size={110}
          />
          <div className="min-w-0 flex-1">
            <TrendLineChart
              compact
              height={100}
              series={[{ label: "Vibration", color: "var(--accent)", points: r.series ?? [] }]}
              thresholds={r.threshold !== undefined ? [{ value: r.threshold }] : undefined}
            />
          </div>
        </div>
      );
    case "temperature":
    case "frequency":
      return (
        <div className="w-full">
          <TrendLineChart
            compact
            height={110}
            series={[{ label: MAINTENANCE_METRIC_META[metric].title, color: "var(--accent)", points: r.series ?? [] }]}
            thresholds={r.threshold !== undefined ? [{ value: r.threshold }] : undefined}
          />
        </div>
      );
    case "current":
      return (
        <div className="flex w-full items-center gap-2">
          <div className="min-w-0 flex-1">
            <TrendLineChart compact height={100} series={[{ label: "Current", color: "var(--accent)", points: r.series ?? [] }]} />
          </div>
          <MiniRadialProgress fraction={(r.secondaryValue ?? 0) / 100} label={`${(r.secondaryValue ?? 0).toFixed(0)}%`} color={color} size={90} />
        </div>
      );
    case "voltageImbalance":
      return <MiniLimitBars bars={r.bars ?? []} min={r.min ?? 200} max={r.max ?? 260} limit={r.limit} unit=" V" />;
    case "power":
      return (
        <div className="flex w-full flex-col gap-1">
          <TrendLineChart
            compact
            height={r.secondaryUnavailable ? 90 : 110}
            series={
              r.secondaryUnavailable
                ? [{ label: "Actual", color: "var(--series-8)", points: r.series ?? [] }]
                : [
                    { label: "Actual", color: "var(--series-8)", points: r.series ?? [] },
                    { label: "Baseline", color: "var(--series-1)", points: r.secondarySeries ?? [], dashed: true },
                  ]
            }
          />
          {r.secondaryUnavailable && <span className="text-center text-[10px] text-muted">Baseline: no sensor data</span>}
        </div>
      );
    case "rpm": {
      const setpoint = r.setpoint ?? 1500;
      const max = r.max ?? 2500;
      return (
        <MiniArcGauge
          value={r.value ?? 0}
          min={0}
          max={max}
          zones={bandZones(0, max, setpoint * 0.95, setpoint * 1.05)}
          sweep={250}
          size={160}
          valueLabel={(r.value ?? 0).toFixed(0)}
          subLabel={`Setpoint ${setpoint.toFixed(0)} RPM`}
        />
      );
    }
    case "flowPressure":
      return (
        <div className="flex w-full items-center justify-center gap-3">
          {r.valueUnavailable ? (
            <NoSensorSlot label="Flow" className="h-[100px] w-[100px] flex-none" />
          ) : (
            <MiniArcGauge
              value={r.value ?? 0}
              min={0}
              max={120}
              zones={[
                { to: 40, color: "var(--status-warning)" },
                { to: 90, color: "var(--status-good)" },
                { to: 100, color: "var(--status-warning)" },
                { to: 120, color: "var(--status-critical)" },
              ]}
              size={100}
              valueLabel={(r.value ?? 0).toFixed(0)}
              subLabel="L/min"
            />
          )}
          <MiniArcGauge
            value={r.secondaryValue ?? 0}
            min={0}
            max={10}
            zones={[
              { to: 3, color: "var(--status-warning)" },
              { to: 7.5, color: "var(--status-good)" },
              { to: 9, color: "var(--status-warning)" },
              { to: 10, color: "var(--status-critical)" },
            ]}
            size={100}
            valueLabel={(r.secondaryValue ?? 0).toFixed(1)}
            subLabel="bar"
          />
        </div>
      );
    case "noise":
      return (
        <div className="flex w-full flex-col gap-2">
          <MiniWaveform value={r.value ?? 0} min={0} max={110} unit="dB" color={color} label="Acoustic" />
          {r.secondaryUnavailable ? <NoSensorSlot label="Ultrasonic" /> : (
            <MiniWaveform value={r.secondaryValue ?? 0} min={0} max={50} unit="kHz" color={color} label="Ultrasonic" />
          )}
        </div>
      );
    case "humidityDust":
      return (
        <div className="flex w-full items-center justify-center gap-3">
          <MiniArcGauge
            value={r.value ?? 0}
            min={0}
            max={100}
            zones={bandZones(0, 100, 40, 60)}
            size={100}
            valueLabel={`${(r.value ?? 0).toFixed(0)}%`}
            subLabel="RH"
          />
          {r.secondaryUnavailable ? (
            <NoSensorSlot label="PM / Dust" className="h-[88px] w-[60px] flex-none" />
          ) : (
            <MiniThresholdBar value={r.secondaryValue ?? 0} max={r.max ?? 200} color={color} valueLabel={(r.secondaryValue ?? 0).toFixed(0)} axisLabel="µg/m³" />
          )}
        </div>
      );
    case "plcFaults":
      return (
        // Deliberately theme-invariant — reads as a physical PLC/HMI readout panel
        // embedded in the card, not a themed surface, so it stays dark in light mode too.
        <div className="w-full rounded-lg p-2.5 text-[11px]" style={{ backgroundColor: "#15151a" }}>
          <div className="mb-1.5 font-mono font-semibold tracking-wide text-white/70">PLC FAULT CODES</div>
          {(r.faults ?? []).length === 0 ? (
            <div className="py-2 text-center text-white/50">No active faults</div>
          ) : (
            <div className="space-y-1">
              {r.faults!.map((f) => (
                <div key={f.code} className="flex items-center justify-between gap-2 font-mono text-white/85">
                  <span className="text-[var(--status-warning)]">{f.code}</span>
                  <span className="truncate text-white/70">{f.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    case "alignment":
      return <MiniAlignmentDiagram offset={r.value ?? 0} limit={r.limit ?? 5} unit="°" color={color} />;
    // viscosity, leakage, and toolWear are always `unavailable` (no backing sensor exists
    // yet), handled by the early return above. Kept so the switch stays exhaustive.
    case "viscosity":
    case "leakage":
    case "toolWear":
      return null;
  }
}

export function TemplateMaintenanceCard({ machineId, metric }: TemplateMaintenanceCardProps) {
  const results = useMaintenanceMetrics(machineId);
  const machines = useMachines();
  const result = results[metric];
  const meta = MAINTENANCE_METRIC_META[metric];
  const Icon = resolveStatIcon(meta.iconName) ?? IconGauge;
  const machine = machines.find((m) => m.id === machineId);

  return (
    <MetricCard
      icon={Icon}
      title={meta.title}
      severity={result.severity}
      current={result.current}
      normal={meta.normal}
      location={machine?.location ?? "Unknown location"}
      recommendation={meta.recommendation}
      unavailable={result.unavailable}
    >
      {visualFor(metric, result)}
    </MetricCard>
  );
}
