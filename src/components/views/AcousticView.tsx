"use client";

import { useMachineSeries } from "@/hooks/useMachineSeries";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { WaitingForData } from "@/components/WaitingForData";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { SpectrumBarChart } from "@/components/charts/SpectrumBarChart";
import { useChartPalette } from "@/components/charts/chartTheme";
import { formatNumber } from "@/lib/format";
import { hasTelemetryField } from "@/lib/telemetry";
import { IconVolume } from "@/components/icons";

export function AcousticView({ machineId }: { machineId: string }) {
  const { latest, history } = useMachineSeries(machineId);
  const palette = useChartPalette();

  if (!latest) return <WaitingForData />;

  const hasSound = hasTelemetryField(latest, "soundLevel");
  const hasHarmonics = hasTelemetryField(latest, "micHarmonics");
  const dominant = latest.microphone.harmonics[0] ?? { frequency: 0, amplitude: 0 };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Sound level"
          value={hasSound ? formatNumber(latest.microphone.soundLevel, 1) : "N/A"}
          unit={hasSound ? "dB" : undefined}
          icon={<IconVolume className="h-4 w-4" />}
          severity={hasSound ? (latest.microphone.soundLevel > -2 ? "warning" : "good") : undefined}
          hint="Gateway relative dB (not dB(A))"
        />
        <StatCard label="Dominant frequency" value={hasHarmonics ? formatNumber(dominant.frequency, 1) : "N/A"} unit={hasHarmonics ? "Hz" : undefined} />
        <StatCard label="Dominant amplitude" value={hasHarmonics ? formatNumber(dominant.amplitude, 1) : "N/A"} unit={hasHarmonics ? "dB" : undefined} />
        <StatCard label="Harmonics tracked" value={hasHarmonics ? String(latest.microphone.harmonics.length) : "N/A"} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Acoustic spectrum" subtitle="Five dominant frequency components">
          <SpectrumBarChart harmonics={latest.microphone.harmonics} amplitudeUnit="dB" color={palette.series[4]} />
        </Card>
        <Card title="Sound level trend" subtitle="Overall SPL over time">
          <TrendLineChart
            series={[
              {
                label: "Sound level",
                color: palette.series[4],
                suffix: "dB",
                points: history.filter((h) => hasTelemetryField(h, "soundLevel")).map((h) => ({ x: h.timestamp, y: h.microphone.soundLevel })),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
