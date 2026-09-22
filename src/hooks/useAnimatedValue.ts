"use client";

import { useEffect, useRef, useState } from "react";
import { DUR_ENTRANCE, DUR_UPDATE, EASE_ENTRANCE, EASE_UPDATE, gsap, prefersReducedMotion } from "@/lib/animation";

const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

function decimalsOf(v: string): number {
  return v.includes(".") ? v.split(".")[1].length : 0;
}

/**
 * Animates a KpiTile/StatCard-style `value: string` prop: counts up (via a tweened
 * proxy number, not innerText interpolation, so it composes with each caller's own
 * formatting) when the string is a bare number — decimal places preserved from the
 * incoming string's own shape — or cross-fades in place when it isn't (status text,
 * "3/8"-style values that don't parse as one number). On first mount, numeric values
 * count up from 0; non-numeric values render immediately with no extra animation of
 * their own, since the containing tile already fades in as a whole
 * (useEntranceAnimation) — only value *changes* after that get the cross-fade.
 * Returns the string to render and a ref to attach to the value element (used for the
 * cross-fade case only).
 */
export function useAnimatedValue<T extends HTMLElement>(value: string) {
  const [display, setDisplay] = useState(() => {
    if (prefersReducedMotion()) return value;
    const m = value.match(NUMERIC_RE);
    return m ? (0).toFixed(decimalsOf(value)) : value;
  });
  const ref = useRef<T | null>(null);
  const prevRef = useRef(value);
  const needsFadeRef = useRef(false);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    const isFirstRun = isFirstRunRef.current;
    isFirstRunRef.current = false;

    if (prefersReducedMotion()) {
      // Mirroring a prop change into local state so later runs can diff against the
      // *previous* value (needed for the animated branch below) — the initial render
      // already handles the reduced-motion case via useState's initializer, this only
      // fires on later prop changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    if (!isFirstRun && prevRef.current === value) return;

    const numericMatch = value.match(NUMERIC_RE);
    const prevNumericMatch = prevRef.current.match(NUMERIC_RE);
    prevRef.current = value;

    if (numericMatch) {
      const decimals = decimalsOf(value);
      const from = isFirstRun ? 0 : prevNumericMatch ? Number(prevNumericMatch[0]) : 0;
      const proxy = { v: from };
      gsap.to(proxy, {
        v: Number(value),
        duration: isFirstRun ? DUR_ENTRANCE : DUR_UPDATE,
        ease: isFirstRun ? EASE_ENTRANCE : EASE_UPDATE,
        onUpdate: () => setDisplay(proxy.v.toFixed(decimals)),
      });
    } else if (isFirstRun) {
      setDisplay(value);
    } else {
      needsFadeRef.current = true;
      setDisplay(value);
    }
  }, [value]);

  useEffect(() => {
    if (!needsFadeRef.current || !ref.current) return;
    needsFadeRef.current = false;
    gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: DUR_ENTRANCE, ease: EASE_ENTRANCE });
  }, [display]);

  return { display, ref };
}
