import { useRef } from "react";
import { DUR_ENTRANCE, EASE_ENTRANCE, gsap, prefersReducedMotion, useGSAP } from "@/lib/animation";

/**
 * Standard mount entrance (opacity 0→1, y offset→0) for card/panel-style components —
 * Card, KpiTile, StatCard, GaugeStatCard, MachineCard all use this so every one of
 * their call sites gets it for free. `staggerIndex` (a sibling's position in a
 * `.map((x, i) => ...)`) offsets the start time so a list of these reads as a cascade
 * with no grid-level timeline needed — each child computes its own delay.
 *
 * Auto-detects the /3d flow via the same `html[data-flow="3d"]` attribute
 * app/3d/layout.tsx stamps (already the established pattern for /3d-only behavior in
 * this codebase — see globals.css, threeDEventLog.ts) and widens the rise
 * distance/stagger step there for a slower, more deliberate "systems coming online"
 * cinematic pace than the regular flow's snappier default — no per-call-site changes
 * needed to opt in, every shared component gets the flourish automatically just by
 * rendering inside /3d.
 */
export function useEntranceAnimation<T extends HTMLElement>(staggerIndex = 0) {
  const ref = useRef<T | null>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const cinematic = document.documentElement.dataset.flow === "3d";
    if (prefersReducedMotion()) {
      gsap.set(ref.current, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: cinematic ? 24 : 16 },
      {
        opacity: 1,
        y: 0,
        duration: DUR_ENTRANCE,
        ease: EASE_ENTRANCE,
        delay: staggerIndex * (cinematic ? 0.12 : 0.06),
      }
    );
  }, [staggerIndex]);

  return ref;
}
