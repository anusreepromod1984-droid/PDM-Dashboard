"use client";

import { useRef } from "react";
import { useChartPalette } from "@/components/charts/chartTheme";
import {
  DUR_GAUGE_SWEEP,
  DUR_UPDATE,
  EASE_SWEEP,
  EASE_UPDATE,
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/animation";
import { useAnimatedValue } from "@/hooks/useAnimatedValue";

/** A % donut ring with the number centered inside — load %, tool-life-remaining %. */
export function MiniRadialProgress({
  fraction,
  label,
  color,
  size = 96,
}: {
  /** 0-1 */
  fraction: number;
  label: string;
  color: string;
  size?: number;
}) {
  const palette = useChartPalette();
  const stroke = 10;
  const r = size / 2 - stroke / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const clamped = Math.min(1, Math.max(0, fraction));
  const circumference = 2 * Math.PI * r;
  const dash = circumference * clamped;

  const circleRef = useRef<SVGCircleElement | null>(null);
  const proxyRef = useRef({ d: 0 });
  const isFirstRunRef = useRef(true);
  const { display, ref: labelRef } = useAnimatedValue<HTMLSpanElement>(label);

  // No overshoot on a ring — can't visually exceed 100% the way a needle can point
  // past its "normal" range — so mount and update both just tween toward the real
  // fraction, mount slightly slower/decelerating for a deliberate "filling up" feel.
  useGSAP(() => {
    if (!circleRef.current) return;
    const isFirstRun = isFirstRunRef.current;
    isFirstRunRef.current = false;

    function apply(d: number) {
      circleRef.current?.setAttribute("stroke-dasharray", `${d.toFixed(1)} ${(circumference - d).toFixed(1)}`);
    }

    gsap.killTweensOf(proxyRef.current);

    if (prefersReducedMotion()) {
      proxyRef.current.d = dash;
      apply(dash);
      return;
    }

    // Sync the DOM to the proxy's current value before starting the tween (rather
    // than relying on gsap.to()'s immediateRender default) so there's no one-frame
    // flash of the pre-tween state.
    apply(proxyRef.current.d);
    gsap.to(proxyRef.current, {
      d: dash,
      duration: isFirstRun ? DUR_GAUGE_SWEEP : DUR_UPDATE,
      ease: isFirstRun ? EASE_SWEEP : EASE_UPDATE,
      onUpdate: () => apply(proxyRef.current.d),
    });
  }, [dash]);

  return (
    <div className="relative" style={{ width: "100%", maxWidth: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={palette.grid} strokeWidth={stroke} />
        <circle
          ref={circleRef}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${(circumference - dash).toFixed(1)}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span ref={labelRef} className="text-base font-semibold" style={{ color }}>
          {display}
        </span>
      </div>
    </div>
  );
}
