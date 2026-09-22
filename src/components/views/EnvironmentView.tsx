"use client";

import { useMachineSeries } from "@/hooks/useMachineSeries";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { WaitingForData } from "@/components/WaitingForData";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { useChartPalette } from "@/components/charts/chartTheme";
import { motorTempSeverity } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { hasTelemetryField } from "@/lib/telemetry";
import { IconDroplet, IconThermometer } from "@/components/icons";

export function EnvironmentView({ machineId }: { machineId: string }) {
  const { latest, history } = useMachineSeries(machineId);
  const palette = useChartPalette();

  if (!latest) return <WaitingForData />;
  const hasMotorTemp = hasTelemetryField(latest, "tempMotor");
  const hasCompressorTemp = hasTelemetryField(latest, "tempCompressor", "tempAmbient");
  const hasHumidity = hasTelemetryField(latest, "humidity");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Motor temp"
          value={hasMotorTemp ? formatNumber(latest.temperature.motor, 1) : "N/A"}
          unit={hasMotorTemp ? "°C" : undefined}
          severity={hasMotorTemp ? motorTempSeverity(latest.temperature.motor) : undefined}
          icon={<IconThermometer className="h-4 w-4" />}
        />
        <StatCard
          label="Compressor temp"
          value={hasCompressorTemp ? formatNumber(latest.temperature.compressor, 1) : "N/A"}
          unit={hasCompressorTemp ? "°C" : undefined}
          icon={<IconThermometer className="h-4 w-4" />}
        />
        <StatCard
          label="NTC ΔT"
          value={hasMotorTemp && hasCompressorTemp ? formatNumber(latest.temperature.motor - latest.temperature.compressor, 1) : "N/A"}
          unit={hasMotorTemp && hasCompressorTemp ? "°C" : undefined}
          hint="Motor − package (NTC 1−2)"
        />
        <StatCard label="Humidity" value={hasHumidity ? formatNumber(latest.humidity, 0) : "N/A"} unit={hasHumidity ? "%RH" : undefined} icon={<IconDroplet className="h-4 w-4" />} />
      </div>

      <Card
        title="Sensor health"
        subtitle="Aggregate status reported by the on-device diagnostics"
        actions={<StatusBadge severity={latest.sensorStatus.ok ? "good" : "warning"} />}
      >
        <p className="text-sm text-secondary">{latest.sensorStatus.message}</p>
      </Card>

      <Card title="Temperature trend" subtitle="Motor and compressor (°C)">
        <TrendLineChart
          yTitle="degree Celsius"
          series={[
            { label: "Motor", color: palette.series[0], suffix: "°C", points: history.filter((h) => hasTelemetryField(h, "tempMotor")).map((h) => ({ x: h.timestamp, y: h.temperature.motor })) },
            { label: "Compressor", color: palette.series[1], suffix: "°C", points: history.filter((h) => hasTelemetryField(h, "tempCompressor", "tempAmbient")).map((h) => ({ x: h.timestamp, y: h.temperature.compressor })) },
          ]}
        />
      </Card>

      <Card title="Relative humidity" subtitle="%RH over time">
        <TrendLineChart
          yTitle="%RH"
          series={[
            { label: "Humidity", color: palette.series[2], suffix: "%RH", points: history.filter((h) => hasTelemetryField(h, "humidity")).map((h) => ({ x: h.timestamp, y: h.humidity })) },
          ]}
        />
      </Card>
    </div>
  );
}
