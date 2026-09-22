"use client";

import { useMachineSeries } from "@/hooks/useMachineSeries";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { WaitingForData } from "@/components/WaitingForData";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { useChartPalette } from "@/components/charts/chartTheme";
import { formatNumber } from "@/lib/format";
import { hasTelemetryField } from "@/lib/telemetry";
import { IconZap } from "@/components/icons";

export function EnergyView({ machineId }: { machineId: string }) {
  const { latest, history } = useMachineSeries(machineId);
  const palette = useChartPalette();

  if (!latest) return <WaitingForData />;
  const e = latest.energyMeter;
  const has = (...keys: string[]) => hasTelemetryField(latest, ...keys);
  const thdMax = Math.max(e.thdVr, e.thdVy, e.thdVb);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Power"
          value={has("emPower") ? formatNumber(e.power, 1) : "N/A"}
          unit={has("emPower") ? "kW" : undefined}
          icon={<IconZap className="h-4 w-4" />}
          hint={
            e.powerEstimated && (e.estimatedPower ?? 0) > 0.05
              ? `kWh slope ${formatNumber(e.estimatedPower, 1)} kW — meter reports 0 kW`
              : undefined
          }
        />
        <StatCard label="Energy" value={has("emEnergy") ? formatNumber(e.energy, 2) : "N/A"} unit={has("emEnergy") ? "kWh" : undefined} hint="cumulative — PM interval clock" />
        <StatCard
          label="Machine load"
          value={has("emMachineLoad") || has("emPower") ? formatNumber(e.machineLoad, 0) : "N/A"}
          unit={has("emMachineLoad") || has("emPower") ? "%" : undefined}
          hint="of motor nameplate kW, not CT full-scale"
        />
        <StatCard
          label="Avg power factor"
          value={has("emPowerFactor") ? formatNumber(e.averagePowerFactor, 2) : "N/A"}
          unit={has("emPowerFactor") ? "pf" : undefined}
          severity={has("emPowerFactor") && e.power > 0.2 && e.averagePowerFactor < 0.75 ? "warning" : undefined}
        />
        <StatCard
          label="Frequency"
          value={has("emFrequency") ? formatNumber(e.frequency, 2) : "N/A"}
          unit={has("emFrequency") ? "Hz" : undefined}
          hint={has("emFrequencyDeviation") ? `${formatNumber(e.frequencyDeviation, 2)}% deviation` : undefined}
        />
        <StatCard
          label="Voltage imbalance"
          value={has("emVoltageImbalance") ? formatNumber(e.voltageImbalance, 2) : "N/A"}
          unit={has("emVoltageImbalance") ? "%" : undefined}
          severity={e.voltageImbalance > 2 ? "warning" : "good"}
        />
        <StatCard label="%THD Vr" value={has("emThdVr") ? formatNumber(e.thdVr, 1) : "N/A"} unit={has("emThdVr") ? "%" : undefined} severity={e.thdVr > 8 ? "warning" : undefined} />
        <StatCard label="%THD Vy" value={has("emThdVy") ? formatNumber(e.thdVy, 1) : "N/A"} unit={has("emThdVy") ? "%" : undefined} severity={e.thdVy > 8 ? "warning" : undefined} />
        <StatCard label="%THD Vb" value={has("emThdVb") ? formatNumber(e.thdVb, 1) : "N/A"} unit={has("emThdVb") ? "%" : undefined} severity={e.thdVb > 8 ? "warning" : undefined} />
        <StatCard label="Max THD" value={has("emThdVr", "emThdVy", "emThdVb") ? formatNumber(thdMax, 1) : "N/A"} unit="%" severity={thdMax > 8 ? "warning" : "good"} />
      </div>

      <Card title="Line currents" subtitle="Ir / Iy / Ib (Ampere)">
        <TrendLineChart
          yTitle="Ampere"
          series={[
            { label: "Ir", color: palette.series[0], suffix: "A", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.Ir })) },
            { label: "Iy", color: palette.series[1], suffix: "A", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.Iy })) },
            { label: "Ib", color: palette.series[2], suffix: "A", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.Ib })) },
          ]}
        />
      </Card>

      <Card title="Line voltages" subtitle="Vr / Vy / Vb (Volt)">
        <TrendLineChart
          yTitle="Volt"
          series={[
            { label: "Vr", color: palette.series[0], suffix: "V", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.Vr })) },
            { label: "Vy", color: palette.series[1], suffix: "V", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.Vy })) },
            { label: "Vb", color: palette.series[2], suffix: "V", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.Vb })) },
          ]}
        />
      </Card>

      <Card title="Voltage THD" subtitle="Total harmonic distortion per phase (%)">
        <TrendLineChart
          yTitle="Percentage"
          series={[
            { label: "%THD Vr", color: palette.series[0], suffix: "%", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.thdVr })) },
            { label: "%THD Vy", color: palette.series[1], suffix: "%", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.thdVy })) },
            { label: "%THD Vb", color: palette.series[2], suffix: "%", points: history.map((h) => ({ x: h.timestamp, y: h.energyMeter.thdVb })) },
          ]}
        />
      </Card>
    </div>
  );
}
