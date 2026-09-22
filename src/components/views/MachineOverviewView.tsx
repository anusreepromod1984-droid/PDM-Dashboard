"use client";

import { useMachineSeries } from "@/hooks/useMachineSeries";
import { useMachines, useRealtime } from "@/context/RealtimeProvider";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { GaugeStatCard } from "@/components/GaugeStatCard";
import { KpiTile } from "@/components/KpiTile";
import { FaultGauge } from "@/components/FaultGauge";
import { StatusBadge } from "@/components/StatusBadge";
import { WaitingForData } from "@/components/WaitingForData";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { MiniArcGauge, type ArcZone } from "@/components/charts/mini/MiniArcGauge";
import { MiniRadialProgress } from "@/components/charts/mini/MiniRadialProgress";
import { useChartPalette } from "@/components/charts/chartTheme";
import {
  faultSeverity,
  motorTempSeverity,
  vibrationSeverity,
  visibleMotorFaults,
  worstSeverity,
  STATUS_COLORS,
} from "@/lib/constants";
import { isFaultBreached } from "@/lib/faultSignature";
import { formatHours, formatNumber } from "@/lib/format";
import { nextMaintenanceDisplay } from "@/lib/injectedRul";
import { hasTelemetryField } from "@/lib/telemetry";
import { useMachineProgram } from "@/hooks/useMachineProgram";
import {
  IconActivity,
  IconAlertTriangle,
  IconCpu,
  IconDroplet,
  IconGauge,
  IconHeartPulse,
  IconThermometer,
  IconVolume,
  IconZap,
} from "@/components/icons";
import type { Severity } from "@/lib/types";

// Same dial-gauge zone bands the Super Dashboard's per-metric cards use
// (dashboardTemplate/elements/TemplateMaintenanceCard.tsx) — kept as small local pure
// functions rather than a shared import since the two view systems (hardcoded vs
// Liquid-template) are deliberately hand-synced, independent implementations.
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

// A 3-signal analog of TemplateMaintenanceKpiStrip's 15-signal health formula —
// larger per-signal weights since there are far fewer signals to average over.
const HEALTH_PENALTY: Record<Severity, number> = { good: 0, warning: 8, critical: 30 };

function healthPercent(severities: Severity[]): number {
  const penalty = severities.reduce((sum, s) => sum + HEALTH_PENALTY[s], 0);
  return Math.max(0, Math.round(100 - penalty));
}

export function MachineOverviewView({ machineId }: { machineId: string }) {
  const { latest, history, scenario } = useMachineSeries(machineId);
  const { data: program } = useMachineProgram(machineId);
  const palette = useChartPalette();
  const machines = useMachines();
  const machine = machines.find((m) => m.id === machineId);
  const { activeAlerts } = useRealtime();

  if (!latest) return <WaitingForData />;

  const breaches = activeAlerts[machineId] ?? [];
  const hasVibration = hasTelemetryField(latest, "imuAcceleration");
  const hasRpm = hasTelemetryField(latest, "rpm", "motorRpm", "machineRpm");
  const hasMotorTemp = hasTelemetryField(latest, "tempMotor");
  const hasLoad = hasTelemetryField(latest, "emMachineLoad");
  const hasPower = hasTelemetryField(latest, "emPower");
  const hasHumidity = hasTelemetryField(latest, "humidity");
  const hasCompressorTemp = hasTelemetryField(latest, "tempCompressor", "tempAmbient");
  const hasRuntime = hasTelemetryField(latest, "runHours");
  const hasRemainingHours = hasTelemetryField(latest, "remainingHours");
  const hasPressure = hasTelemetryField(latest, "pressure");
  const hasSound = hasTelemetryField(latest, "soundLevel");
  const hasPf = hasTelemetryField(latest, "emPowerFactor");
  const hasThd = hasTelemetryField(latest, "emThdVr", "emThdVy", "emThdVb");
  const hasEnergy = hasTelemetryField(latest, "emEnergy");
  const hasFreq = hasTelemetryField(latest, "emFrequency");
  const thdMax = Math.max(
    latest.energyMeter.thdVr,
    latest.energyMeter.thdVy,
    latest.energyMeter.thdVb,
  );
  const worstFault =
    latest.motorFaults.length > 0
      ? latest.motorFaults.reduce((a, b) => (a.confidence > b.confidence ? a : b))
      : null;
  const faultSev = worstFault ? faultSeverity(worstFault.confidence) : "good";
  const vibSev = hasVibration
    ? vibrationSeverity(latest.imuAcceleration, hasRpm ? latest.rpm : undefined, latest.sensorStatus?.ok)
    : "good";
  const tempSev = hasMotorTemp ? motorTempSeverity(latest.temperature.motor) : "good";
  const requiredUnavailable = !hasMotorTemp && !hasPressure;
  const overall = worstSeverity([faultSev, vibSev, tempSev]);
  const activeFaultCount = latest.motorFaults.filter((f) => faultSeverity(f.confidence) !== "good").length;
  const sensorDead = latest.sensorStatus?.ok === false
    || (hasVibration && hasRpm && latest.rpm > 500 && latest.imuAcceleration <= 0);
  const healthSignals: Severity[] = [faultSev];
  if (hasMotorTemp) healthSignals.push(tempSev);
  if (hasVibration) healthSignals.push(vibSev);
  const health = sensorDead ? null : healthPercent(healthSignals);
  const nextMaintenance = nextMaintenanceDisplay(
    latest.runtime.remainingHours,
    scenario,
    hasRemainingHours || scenario !== "nominal",
  );

  const setpoint = machine?.ratedRpm || 1500;
  const rpmMax = Math.max(2500, Math.round((setpoint * 1.6) / 100) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <KpiTile
          icon={IconHeartPulse}
          label="Machine Health"
          value={health === null ? "N/A" : `${health}%`}
          color={health === null ? "var(--status-critical)" : "var(--accent)"}
        />
        <KpiTile
          icon={IconCpu}
          label="Status"
          value={machine?.online ? "Online" : "Offline"}
          color={machine?.online ? "var(--status-good)" : undefined}
        />
        <KpiTile
          icon={IconAlertTriangle}
          label="Active Faults"
          value={String(activeFaultCount)}
          color={activeFaultCount > 0 ? "var(--status-warning)" : undefined}
        />
        <KpiTile
          icon={IconHeartPulse}
          label="Condition"
          value={requiredUnavailable ? "Incomplete" : overall.charAt(0).toUpperCase() + overall.slice(1)}
          color={requiredUnavailable ? "var(--status-warning)" : STATUS_COLORS[overall]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <GaugeStatCard icon={IconGauge} title="RPM">
          <MiniArcGauge
            value={hasRpm ? latest.rpm : 0}
            min={0}
            max={rpmMax}
            zones={bandZones(0, rpmMax, setpoint * 0.95, setpoint * 1.05)}
            sweep={250}
            size={140}
            valueLabel={hasRpm ? formatNumber(latest.rpm, 0) : "N/A"}
            subLabel={hasRpm ? `Setpoint ${setpoint.toFixed(0)} RPM` : "RPM not received"}
          />
        </GaugeStatCard>
        <GaugeStatCard icon={IconActivity} title="Vibration" severity={hasVibration ? vibSev : undefined}>
          <MiniArcGauge
            key={`vib-${scenario}-${hasVibration ? latest.imuAcceleration : 0}`}
            value={hasVibration ? latest.imuAcceleration : 0}
            min={0}
            max={12}
            zones={vibrationZones()}
            valueLabel={hasVibration ? formatNumber(latest.imuAcceleration, 1) : "N/A"}
            subLabel={hasVibration ? "mm/s" : "Acceleration not received"}
            size={110}
          />
        </GaugeStatCard>
        <GaugeStatCard icon={IconThermometer} title="Motor temp" severity={hasMotorTemp ? tempSev : undefined}>
          <MiniArcGauge
            value={hasMotorTemp ? latest.temperature.motor : 0}
            min={0}
            max={100}
            zones={motorTempZones()}
            valueLabel={hasMotorTemp ? `${formatNumber(latest.temperature.motor, 0)}°C` : "N/A"}
            size={110}
          />
        </GaugeStatCard>
        <GaugeStatCard icon={IconZap} title="Machine load">
          <MiniRadialProgress
            fraction={hasLoad ? latest.energyMeter.machineLoad / 100 : 0}
            label={hasLoad ? `${formatNumber(latest.energyMeter.machineLoad, 0)}%` : "N/A"}
            color="var(--accent)"
            size={96}
          />
        </GaugeStatCard>
        <StatCard
          label="Power"
          value={hasPower ? formatNumber(latest.energyMeter.power, 1) : "N/A"}
          unit={hasPower ? "kW" : undefined}
          icon={<IconZap className="h-4 w-4" />}
          hint={
            latest.energyMeter.powerEstimated && (latest.energyMeter.estimatedPower ?? 0) > 0.05
              ? `kWh slope ${formatNumber(latest.energyMeter.estimatedPower, 1)} kW — meter reports 0 kW`
              : undefined
          }
        />
        <GaugeStatCard icon={IconDroplet} title="Humidity">
          <MiniArcGauge
            value={hasHumidity ? latest.humidity : 0}
            min={0}
            max={100}
            zones={bandZones(0, 100, 40, 60)}
            valueLabel={hasHumidity ? `${formatNumber(latest.humidity, 0)}%` : "N/A"}
            subLabel={hasHumidity ? "RH" : "Humidity not received"}
            size={110}
          />
        </GaugeStatCard>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Pressure"
          value={hasPressure ? formatNumber(latest.pressure, 2) : "N/A"}
          unit={hasPressure ? "Bar" : undefined}
          icon={<IconGauge className="h-4 w-4" />}
        />
        <StatCard
          label="Sound level"
          value={hasSound ? formatNumber(latest.microphone.soundLevel, 1) : "N/A"}
          unit={hasSound ? "dB" : undefined}
          icon={<IconVolume className="h-4 w-4" />}
          hint={hasTelemetryField(latest, "micHarmonics") && latest.microphone.harmonics[0] ? `${formatNumber(latest.microphone.harmonics[0].frequency, 0)} Hz peak` : undefined}
        />
        <StatCard
          label="Power factor"
          value={hasPf ? formatNumber(latest.energyMeter.averagePowerFactor, 2) : "N/A"}
          unit={hasPf ? "pf" : undefined}
        />
        <StatCard
          label="Max THD"
          value={hasThd ? formatNumber(thdMax, 1) : "N/A"}
          unit={hasThd ? "%" : undefined}
          severity={hasThd && thdMax > 8 ? "warning" : undefined}
        />
        <StatCard
          label="Energy"
          value={hasEnergy ? formatNumber(latest.energyMeter.energy, 2) : "N/A"}
          unit={hasEnergy ? "kWh" : undefined}
          hint="PM usage clock"
        />
        <StatCard
          label="Grid frequency"
          value={hasFreq ? formatNumber(latest.energyMeter.frequency, 2) : "N/A"}
          unit={hasFreq ? "Hz" : undefined}
          hint={hasTelemetryField(latest, "emFrequencyDeviation") ? `${formatNumber(latest.energyMeter.frequencyDeviation, 2)}% dev` : undefined}
        />
      </div>

      <Card
        title="Motor fault indicators"
        subtitle="Model confidence per fault class"
        actions={<StatusBadge severity={faultSev} />}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {visibleMotorFaults(latest.motorFaults).length === 0 ? (
            <p className="col-span-full text-sm text-muted">No active fault classes on this snapshot.</p>
          ) : (
            visibleMotorFaults(latest.motorFaults).map((f) => (
              <FaultGauge key={f.fault_code} fault={f} breached={isFaultBreached(breaches, f.fault_code)} />
            ))
          )}
        </div>
      </Card>

      <Card
        title="Remaining useful life"
        subtitle="Days left. Amber marker = diagnosis call. Green marker = repair recovery."
      >
        {program?.points && program.points.length > 0 ? (
          <TrendLineChart
            series={[
              {
                label: "RUL",
                color: palette.series[2] ?? palette.series[0],
                suffix: "d",
                points: program.points,
              },
            ]}
            yTitle="Days"
            height={220}
            markers={program.markers}
          />
        ) : (
          <p className="text-sm text-muted">RUL clock starts after the first Gamma run is stored.</p>
        )}
        {program?.repair_window && (
          <p className="mt-2 text-[11px] text-muted">
            Next approved window: {program.repair_window.label}
            {program.pm_tasks?.[0]
              ? ` · ${program.pm_tasks[0].name} due ${program.pm_tasks[0].due_at}${program.pm_tasks[0].overdue ? " (overdue)" : ""}`
              : ""}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Vibration trend" subtitle="IMU acceleration (mm/sec)">
          <TrendLineChart
            series={[
              {
                label: "Vibration",
                color: palette.series[0],
                suffix: "mm/s",
                points: history
                  .filter((h) => hasTelemetryField(h, "imuAcceleration"))
                  .map((h) => ({ x: h.timestamp, y: h.imuAcceleration })),
              },
            ]}
            thresholds={[{ value: 4.5 }]}
          />
        </Card>
        <Card title="Power draw" subtitle="Meter kW (pdm/electricity)">
          <TrendLineChart
            series={[
              {
                label: "Power",
                color: palette.series[1],
                suffix: "kW",
                points: history
                  .filter((h) => hasTelemetryField(h, "emPower"))
                  .map((h) => ({ x: h.timestamp, y: h.energyMeter.power })),
              },
            ]}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Compressor temp"
          value={hasCompressorTemp ? formatNumber(latest.temperature.compressor, 0) : "N/A"}
          unit={hasCompressorTemp ? "°C" : undefined}
          hint={hasCompressorTemp ? "NTC channel 2" : "Second NTC not received"}
        />
        <StatCard
          label="Runtime"
          value={hasRuntime ? formatHours(latest.runtime.machineRunHours) : "N/A"}
          hint={hasRuntime ? "Hours accumulated while electrically running" : "Runtime not received"}
        />
        <StatCard
          label="Next maintenance"
          value={nextMaintenance.value}
          hint={nextMaintenance.hint}
          severity={nextMaintenance.severity}
        />
      </div>
    </div>
  );
}
