"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FloatingArrow,
  FloatingPortal,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { useTour } from "@/context/TourProvider";
import { useCompany } from "@/context/CompanyProvider";
import { useMachines } from "@/context/RealtimeProvider";

/**
 * The step card — positioned relative to `target` via @floating-ui/react (flip/shift
 * keep it on-screen near a viewport edge, offset+arrow give it the same "pointing at
 * the real thing" feel as a native tooltip). Visual style matches MessageProvider's
 * confirm dialog exactly (rounded-xl border-hairline bg-surface shadow-2xl) so a tour
 * step reads as "this app's dialog," not an injected third-party widget.
 */
export function TourTooltip({ target }: { target: HTMLElement }) {
  const { activeTour, step, stepIndex, totalSteps, next, prev, skip, finish, startTour } = useTour();
  const router = useRouter();
  const { routes } = useCompany();
  const machines = useMachines();
  const arrowRef = useRef<SVGSVGElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: step?.placement ?? "bottom",
    // eslint-disable-next-line react-hooks/refs -- @floating-ui/react's documented arrow-middleware API; it reads arrowRef.current during its own internal positioning pass (after render), not during ours
    middleware: [offset(12), flip({ padding: 8 }), shift({ padding: 8 }), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(target);
  }, [target, refs]);

  // Move focus to the panel on every step change — a11y parity with MessageProvider's
  // own confirm-dialog focus-on-open behavior.
  useEffect(() => {
    panelRef.current?.focus();
  }, [step?.id]);

  if (!step) return null;

  const isLastStep = stepIndex === totalSteps - 1;
  const isDashboardFinale = activeTour === "dashboard" && isLastStep;
  const firstMachineId = machines[0]?.id ?? null;

  function handlePrimary() {
    if (isDashboardFinale) {
      if (firstMachineId) {
        router.push(routes.machine(firstMachineId));
        startTour("machine");
      } else {
        finish();
      }
      return;
    }
    if (isLastStep) finish();
    else next();
  }

  const primaryLabel = isDashboardFinale
    ? firstMachineId
      ? "Take machine tour →"
      : "Finish"
    : isLastStep
      ? "Finish"
      : "Next";

  return (
    <FloatingPortal>
      <div
        ref={(el) => {
          refs.setFloating(el);
          panelRef.current = el;
        }}
        style={floatingStyles}
        tabIndex={-1}
        role="dialog"
        aria-label={step.title}
        className="z-[260] w-72 rounded-xl border border-hairline bg-surface p-5 shadow-2xl outline-none"
      >
        <FloatingArrow ref={arrowRef} context={context} fill="var(--surface-1)" stroke="var(--hairline)" strokeWidth={1} />
        <p className="text-xs text-muted">
          Step {stepIndex + 1} of {totalSteps}
        </p>
        <h3 className="mt-1 text-sm font-semibold text-primary">{step.title}</h3>
        <p className="mt-1.5 text-sm text-secondary">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={skip} className="text-sm font-medium text-secondary hover:text-primary">
            Skip
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={prev}
                className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-2"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handlePrimary}
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </FloatingPortal>
  );
}
