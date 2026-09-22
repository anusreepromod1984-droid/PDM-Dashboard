"use client";

import { useMachineSeries } from "@/hooks/useMachineSeries";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { WaitingForData } from "@/components/WaitingForData";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { SpectrumBarChart } from "@/components/charts/SpectrumBarChart";
import { ScatterChart } from "@/components/charts/ScatterChart";
import { useChartPalette } from "@/components/charts/chartTheme";
import { vibrationSeverity } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { hasTelemetryField } from "@/lib/telemetry";
import { IconActivity, IconGauge } from "@/components/icons";

export function VibrationView({ machineId }: { machineId: string }) {
  const { latest, history } = useMachineSeries(machineId);
  const palette = useChartPalette();

  if (!latest) return <WaitingForData />;

  const hasVibration = hasTelemetryField(latest, "imuAcceleration");
  const hasX = hasTelemetryField(latest, "xAxisVibration");
  const hasY = hasTelemetryField(latest, "yAxisVibration");
  const hasZ = hasTelemetryField(latest, "zAxisVibration");
  const hasAxes = hasX || hasY || hasZ;
  const hasRpm = hasTelemetryField(latest, "rpm", "motorRpm", "machineRpm");
  const hasHarmonics = hasTelemetryField(latest, "vibrationHarmonics");
  const hasOrientation = ["magRoll", "magPitch", "magYaw"].some((key) => hasTelemetryField(latest, key));
  const dominant = latest.vibration.harmonics[0] ?? { frequency: 0, amplitude: 0 };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Overall vibration"
          value={hasVibration ? formatNumber(latest.imuAcceleration, 2) : "N/A"}
          unit={hasVibration ? "mm/sec" : undefined}
          severity={hasVibration ? vibrationSeverity(latest.imuAcceleration, hasRpm ? latest.rpm : undefined, latest.sensorStatus?.ok) : undefined}
          icon={<IconActivity className="h-4 w-4" />}
        />
        <StatCard label="Rotational speed" value={hasRpm ? formatNumber(latest.rpm, 0) : "N/A"} unit={hasRpm ? "RPM" : undefined} icon={<IconGauge className="h-4 w-4" />} />
        <StatCard label="Dominant frequency" value={hasHarmonics ? formatNumber(dominant.frequency, 1) : "N/A"} unit={hasHarmonics ? "Hz" : undefined} />
        <StatCard
          label="X / Y / Z"
          value={
            hasAxes
              ? `${hasX ? formatNumber(latest.xAxisVibration, 2) : "—"} / ${hasY ? formatNumber(latest.yAxisVibration, 2) : "—"} / ${hasZ ? formatNumber(latest.zAxisVibration, 2) : "—"}`
              : "N/A"
          }
          unit={hasAxes ? "mm/s ISO 20816" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Vibration spectrum" subtitle="Five dominant frequency components">
          <SpectrumBarChart harmonics={latest.vibration.harmonics} amplitudeUnit={dominant.amplitude < 0 ? "dB" : "mm/s"} />
        </Card>
        <Card title="Vibration trend" subtitle="ISO 20816 overall RMS and orthogonal axes">
          <TrendLineChart
            series={[
              {
                label: "Overall RMS",
                color: palette.series[0],
                suffix: "mm/s",
                points: history.filter((h) => hasTelemetryField(h, "imuAcceleration")).map((h) => ({ x: h.timestamp, y: h.imuAcceleration })),
              },
              ...(hasX
                ? [{
                    label: "X axis",
                    color: palette.series[1],
                    suffix: "mm/s",
                    points: history.filter((h) => hasTelemetryField(h, "xAxisVibration")).map((h) => ({ x: h.timestamp, y: h.xAxisVibration ?? 0 })),
                  }]
                : []),
              ...(hasY
                ? [{
                    label: "Y axis",
                    color: palette.series[2],
                    suffix: "mm/s",
                    points: history.filter((h) => hasTelemetryField(h, "yAxisVibration")).map((h) => ({ x: h.timestamp, y: h.yAxisVibration ?? 0 })),
                  }]
                : []),
              ...(hasZ
                ? [{
                    label: "Z axis",
                    color: palette.series[3],
                    suffix: "mm/s",
                    points: history.filter((h) => hasTelemetryField(h, "zAxisVibration")).map((h) => ({ x: h.timestamp, y: h.zAxisVibration ?? 0 })),
                  }]
                : []),
            ]}
          />
        </Card>
      </div>

      <Card title="Vibration vs motor temperature" subtitle="Each dot is one reading — a cluster drifting up-right signals a developing fault">
        <ScatterChart
          xLabel="Motor temp"
          yLabel="Vibration"
          xSuffix="°C"
          ySuffix="mm/s"
          color={palette.series[3]}
          points={history.filter((h) => hasTelemetryField(h, "tempMotor") && hasTelemetryField(h, "imuAcceleration")).map((h) => ({ x: h.temperature.motor, y: h.imuAcceleration, timestamp: h.timestamp }))}
        />
      </Card>

      <Card title="Rotational speed trend" subtitle="Derived from IMU tachometer (RPM)">
        <TrendLineChart
          series={[
            {
              label: "RPM",
              color: palette.series[2],
              points: history.filter((h) => hasTelemetryField(h, "rpm", "motorRpm", "machineRpm")).map((h) => ({ x: h.timestamp, y: h.rpm })),
            },
          ]}
        />
      </Card>

      <Card title="Mounting orientation" subtitle="IMU magnetometer roll / pitch / yaw">
        <TrendLineChart
          yTitle="degrees"
          series={[
            {
              label: "Roll",
              color: palette.series[0],
              suffix: "°",
              points: hasOrientation ? history.filter((h) => hasTelemetryField(h, "magRoll")).map((h) => ({ x: h.timestamp, y: h.magnetometer.roll })) : [],
            },
            {
              label: "Pitch",
              color: palette.series[1],
              suffix: "°",
              points: hasOrientation ? history.filter((h) => hasTelemetryField(h, "magPitch")).map((h) => ({ x: h.timestamp, y: h.magnetometer.pitch })) : [],
            },
            {
              label: "Yaw",
              color: palette.series[2],
              suffix: "°",
              points: hasOrientation ? history.filter((h) => hasTelemetryField(h, "magYaw")).map((h) => ({ x: h.timestamp, y: h.magnetometer.yaw })) : [],
            },
          ]}
        />
      </Card>
    </div>
  );
}
