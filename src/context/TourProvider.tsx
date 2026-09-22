"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthProvider";
import { tourSteps, type TourId, type TourStep } from "@/lib/tourSteps";

interface TourContextValue {
  activeTour: TourId | null;
  stepIndex: number;
  step: TourStep | null;
  totalSteps: number;
  /** null while the session is still loading — callers should wait rather than treat
   *  that as "already seen." */
  hasSeenTour: boolean | null;
  startTour: (tour: TourId) => void;
  next: () => void;
  prev: () => void;
  /** Dismisses the current tour and marks it seen — same persistence as finish(), just
   *  a different trigger (Skip vs. reaching the last step's CTA). */
  skip: () => void;
  /** Closes the current tour and marks it seen, without advancing a step index. */
  finish: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

/**
 * Mounted inside AuthProvider (see app/(tenant)/layout.tsx) — company/tenant flow
 * only, never gbotz or the /3d flow, which sit in entirely separate layout trees.
 * A single server-side flag (`user.hasSeenTour`) covers both the dashboard and
 * machine tours: skipping or finishing either one marks it true, since the intended
 * path is dashboard → machine and skipping either counts as "seen enough" — see
 * lib/tourSteps.ts and components/tour/TourLauncher.tsx for the two entry points.
 */
export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth();
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  // Set synchronously the moment a tour is dismissed, ahead of the server round-trip
  // persistSeen() kicks off — without this, TourAutoTrigger sees activeTour flip to
  // null (dismissed) while user.hasSeenTour is still false (server write in flight)
  // and immediately restarts the very tour that was just closed.
  const [dismissedLocally, setDismissedLocally] = useState(false);

  const startTour = useCallback((tour: TourId) => {
    setActiveTour(tour);
    setStepIndex(0);
  }, []);

  const close = useCallback(() => {
    setActiveTour(null);
    setStepIndex(0);
  }, []);

  // Persisted immediately (not just on full completion) so a skipped tour never
  // reappears on the next login — mirrors AuthProvider.refresh's own doc comment:
  // re-fetch /api/auth/me so the shell repaints from the authoritative payload
  // instead of a hand-rolled optimistic flip.
  const persistSeen = useCallback(() => {
    void apiFetch("/api/auth/tour-seen", { method: "POST" })
      .then(() => refresh())
      .catch(() => {});
  }, [refresh]);

  const skip = useCallback(() => {
    close();
    setDismissedLocally(true);
    persistSeen();
  }, [close, persistSeen]);

  const finish = useCallback(() => {
    close();
    setDismissedLocally(true);
    persistSeen();
  }, [close, persistSeen]);

  const steps = useMemo(() => (activeTour ? tourSteps(activeTour) : []), [activeTour]);

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const value = useMemo<TourContextValue>(
    () => ({
      activeTour,
      stepIndex,
      step: steps[stepIndex] ?? null,
      totalSteps: steps.length,
      hasSeenTour: user ? user.hasSeenTour || dismissedLocally : null,
      startTour,
      next,
      prev,
      skip,
      finish,
    }),
    [activeTour, stepIndex, steps, user, dismissedLocally, startTour, next, prev, skip, finish]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
