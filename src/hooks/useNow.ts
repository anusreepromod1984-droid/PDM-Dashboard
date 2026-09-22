"use client";

import { useSyncExternalStore } from "react";

/**
 * One shared 1Hz ticker for the whole app (generalizes the interval previously
 * duplicated in MachineCard.tsx and LiveClock.tsx) — every subscriber re-renders off
 * the same setInterval instead of each mounting its own, and the interval stops
 * entirely once nothing is subscribed.
 */
let currentNow = Date.now();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function start(intervalMs: number): void {
  if (intervalId) return;
  intervalId = setInterval(() => {
    currentNow = Date.now();
    listeners.forEach((l) => l());
  }, intervalMs);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot(): number {
  return currentNow;
}

/**
 * useSyncExternalStore's third argument is specifically for what the server rendered,
 * so the client's first (pre-hydration) pass can reproduce the exact same output —
 * React compares them and logs a hydration mismatch (error #418) for any consumer
 * that renders the value into visible text if they differ. Passing getSnapshot itself
 * here (as this used to) can never satisfy that: it reads the module-level `currentNow`,
 * captured via `Date.now()` once at module load — a genuinely different wall-clock
 * moment in the server's process versus the client's, in two separate JS environments
 * that can't share it. A fixed placeholder is the correct fix: SSR and the client's
 * first pass both render this same constant (a real hydration match), and the real
 * clock only takes over afterward — a normal post-mount update via the
 * subscribe/interval mechanism above, not a hydration mismatch.
 */
function getServerSnapshot(): number {
  return 0;
}

export function useNow(intervalMs = 1000): number {
  start(intervalMs);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
