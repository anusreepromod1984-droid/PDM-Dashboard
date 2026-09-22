"use client";

import { useRef } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation";

const WIDTH = 264;
const HEIGHT = 56;
const DASH_PERIOD = 12; // "7 5" below — every travel distance must stay a multiple of this

/** Samples a sine wave across the viewBox width as an SVG path — a fixed shape, not
 *  re-sampled per frame; only the flowing-dash animation below is what actually moves. */
function wavePath(amplitude: number, cycles: number, phase: number, yOffset: number): string {
  const steps = 48;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * WIDTH;
    const t = (i / steps) * cycles * Math.PI * 2 + phase;
    const y = yOffset + Math.sin(t) * amplitude;
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

/**
 * Stands in for a spinner while a diagnosis run is in flight (backend/src/domain/
 * diagnosisPipeline.ts can take up to ~2 minutes) — two flowing sine curves rather than
 * a generic spinner, reusing this app's own "drawing" motion language (see
 * TrendLineChart's one-shot strokeDasharray/strokeDashoffset reveal) run continuously
 * instead of once. Each path travels a whole multiple of its own dash period so the
 * infinite loop has no visible seam/jump.
 */
export function DiagnosingGraph() {
  const palette = useChartPalette();
  const pathARef = useRef<SVGPathElement | null>(null);
  const pathBRef = useRef<SVGPathElement | null>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    [pathARef.current, pathBRef.current].forEach((path, i) => {
      if (!path) return;
      gsap.set(path, { strokeDasharray: "7 5" });
      gsap.to(path, {
        strokeDashoffset: i === 0 ? -DASH_PERIOD * 40 : DASH_PERIOD * 40,
        duration: i === 0 ? 6 : 7.5,
        ease: "none",
        repeat: -1,
      });
    });
    // useGSAP reverts every tween created above automatically on unmount — no manual kill needed.
  }, []);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} role="img" aria-label="Analyzing" className="block">
      <line x1={0} x2={WIDTH} y1={HEIGHT / 2} y2={HEIGHT / 2} stroke={palette.grid} strokeWidth={1} />
      <path
        ref={pathARef}
        d={wavePath(15, 2.5, 0, HEIGHT / 2 - 5)}
        fill="none"
        stroke={palette.series[0]}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        ref={pathBRef}
        d={wavePath(9, 1.5, Math.PI / 3, HEIGHT / 2 + 7)}
        fill="none"
        stroke={palette.series[2]}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.75}
      />
    </svg>
  );
}
