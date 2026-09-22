"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTour } from "@/context/TourProvider";
import { TourTooltip } from "@/components/tour/TourTooltip";

const TARGET_POLL_MS = 150;
const TARGET_TIMEOUT_MS = 1500;
const SPOTLIGHT_PADDING = 4;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * The spotlight/coachmark engine — portal-rendered, mounted once in TenantShell.
 * Purely additive: the dim/spotlight layer is `pointer-events: none`, so the tour
 * never blocks interacting with (or scrolling past) the real page underneath — only
 * the tooltip card (TourTooltip, positioned via @floating-ui/react) captures clicks.
 * z-[250] — above SuperDashboard (z-[200]), below MessageProvider's confirm dialog
 * (z-[300]), matching the app's existing z-index scale (AlertToastStack 50 →
 * AlertBorderGlow 100 → SuperDashboard 200 → MessageProvider 300).
 */
export function TourOverlay() {
  const { activeTour, step, stepIndex, totalSteps, next, finish, skip } = useTour();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- confirming client mount (createPortal needs document.body, unavailable during SSR), same post-mount pattern TenantShell/ThemeProvider already use
  useEffect(() => setMounted(true), []);

  // Find (and poll for) the current step's target element; auto-advance past a step
  // whose target never mounts (e.g. a company on a custom Gbotz-authored template
  // with no plant-map, or zero machines placed) rather than leaving the tour stuck.
  useEffect(() => {
    if (!step) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing local target state to match a real DOM query result, not deriving from a prop
      setTarget(null);
      return;
    }
    let cancelled = false;
    setTarget(null);
    const targetSelector = step.target;
    const deadline = Date.now() + TARGET_TIMEOUT_MS;

    function poll() {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-tour="${targetSelector}"]`);
      if (el) {
        setTarget(el);
        return;
      }
      if (Date.now() >= deadline) {
        if (stepIndex >= totalSteps - 1) finish();
        else next();
        return;
      }
      window.setTimeout(poll, TARGET_POLL_MS);
    }
    poll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the step's own target identity should restart the search; next/finish/stepIndex/totalSteps are read fresh from this render's closure, not stale, since every step in both tours has a distinct target
  }, [step?.target]);

  // Keep the spotlight rect in sync with the live target — step change, resize,
  // scroll (capture phase, since Sidebar's machine list and the floor map's pan/zoom
  // viewport both scroll internally without a window-level scroll event), and the
  // target's own size changing (Sidebar width animates open/closed, tab strips wrap).
  useEffect(() => {
    if (!target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing local rect state to match a real DOM measurement, not deriving from a prop
      setRect(null);
      return;
    }
    const update = () => setRect(measure(target));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const ro = new ResizeObserver(update);
    ro.observe(target);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      ro.disconnect();
    };
  }, [target]);

  useEffect(() => {
    if (!activeTour) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTour, skip]);

  if (!mounted || !activeTour || !step) return null;

  return createPortal(
    <>
      {rect && (
        <div
          aria-hidden="true"
          className="fixed z-[250] rounded-lg transition-all duration-200"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            pointerEvents: "none",
          }}
        />
      )}
      {target && <TourTooltip target={target} />}
    </>,
    document.body
  );
}
