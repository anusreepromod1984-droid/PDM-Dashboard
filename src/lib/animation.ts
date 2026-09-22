import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** One shared vocabulary of eases/durations so every animated component reads as part
 *  of the same motion system instead of each hand-picking its own numbers. */
export const EASE_SWEEP = "power3.out";
export const EASE_SETTLE = "back.out(1.7)";
export const EASE_UPDATE = "power2.out";
export const EASE_ENTRANCE = "power2.out";
export const EASE_DRAW = "power2.inOut";

export const DUR_ENTRANCE = 0.4;
export const DUR_GAUGE_SWEEP = 0.5;
export const DUR_GAUGE_SETTLE = 0.8;
export const DUR_UPDATE = 0.35;
export const DUR_DRAW = 1.1;

export { gsap, useGSAP };

/** Checked at the start of every tween in this animation system — when true, callers
 *  should use gsap.set() (instant) instead of gsap.to()/timeline() (animated). Read
 *  fresh each time rather than cached, since the OS-level preference can change while
 *  the app is open. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
