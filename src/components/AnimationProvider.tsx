"use client";

import { useEffect } from "react";
import { gsap, prefersReducedMotion } from "@/lib/animation";

const PRESS_SELECTOR = "button, a[role='button'], [role='button']";

/**
 * App-wide press micro-interaction (scale down/back on pointerdown/up) for every
 * button-like element, via one delegated document listener — there's no shared
 * <Button> component in this app (48 files render raw <button> with their own
 * Tailwind classes), so wiring this per-component would mean touching every one of
 * them. Delegation gets full app-wide coverage with a single mount point instead.
 * One-shot, short (~80ms) — safe under the /3d flow's no-reliable-GPU-compositor
 * constraint the same way every other animation in this system is.
 */
export function AnimationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function press(e: PointerEvent) {
      if (prefersReducedMotion()) return;
      const target = (e.target as Element)?.closest?.(PRESS_SELECTOR);
      if (!target || (target as HTMLButtonElement).disabled) return;
      gsap.to(target, { scale: 0.96, duration: 0.08, ease: "power1.out", overwrite: true });
    }
    function release(e: PointerEvent) {
      const target = (e.target as Element)?.closest?.(PRESS_SELECTOR);
      if (!target) return;
      gsap.to(target, { scale: 1, duration: 0.15, ease: "power2.out", overwrite: true });
    }
    document.addEventListener("pointerdown", press);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    return () => {
      document.removeEventListener("pointerdown", press);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
    };
  }, []);

  return <>{children}</>;
}
