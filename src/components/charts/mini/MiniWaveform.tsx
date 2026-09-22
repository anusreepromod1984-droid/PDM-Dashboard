"use client";

import { useMemo } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";

/** A stylized oscillation trace whose amplitude tracks the live value — acoustic/ultrasonic
 *  noise. Deterministic (pure function of props, no randomness) so it never jitters between
 *  renders for the same reading. */
export function MiniWaveform({
  value,
  min,
  max,
  unit,
  color,
  label,
}: {
  value: number;
  min: number;
  max: number;
  unit?: string;
  color: string;
  label: string;
}) {
  const palette = useChartPalette();
  const width = 220;
  const height = 46;
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const amplitude = 4 + fraction * (height / 2 - 6);

  const path = useMemo(() => {
    const steps = 64;
    const pts = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      const x = t * width;
      const y =
        height / 2 +
        amplitude * (Math.sin(t * Math.PI * 9) * 0.55 + Math.sin(t * Math.PI * 21 + 1.1) * 0.3 + Math.sin(t * Math.PI * 4 + 0.6) * 0.15);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M${pts.join(" L")}`;
  }, [amplitude]);

  return (
    <div className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke={palette.grid} strokeWidth={1} />
        <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
      </svg>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold" style={{ color }}>
          {value.toFixed(1)} {unit}
        </span>
      </div>
    </div>
  );
}
