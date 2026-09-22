"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    /** Unreal Engine's Web Browser widget JS bridge (present only inside that widget). */
    ue?: {
      interface?: {
        /**
         * Calls the UFUNCTION named HitState, bound in C++ via
         * Browser->BindUObject(TEXT("interface"), this, true). UE's WebBrowser JS
         * bridge lowercases all bound names by default
         * (bJSBindingsToLoweringEnabled = true in WebBrowserSingleton.cpp), so the
         * exposed function is "hitstate", not "HitState" — calling the capitalized
         * name silently resolves to undefined and throws when invoked.
         */
        hitstate?: (isInteractive: boolean) => void;
      };
    };
    /**
     * Set by this bridge; called from C++ (NativeTick in InteractiveBrowserWidget.cpp)
     * via ExecuteJavascript on a separate CEF scripting channel that keeps working
     * even while the widget is click-through (Self Hit Test Invisible). While
     * click-through, Slate stops delivering real DOM pointer events to this page
     * entirely, so the pointermove listener below goes silent and the tracked
     * position would otherwise freeze.
     */
    __nativeSyncPointer?: (x: number, y: number) => void;
  }
}

/**
 * Reports whether the cursor is currently over an interactive UI element or over
 * empty space (where the 3D scene should receive mouse input instead) to Unreal
 * Engine, via its Web Browser widget's JS bridge: `window.ue.interface.hitstate(bool)`.
 * This matches the 3D team's own reference integration (browser_overlay_option_a.html)
 * exactly, including the details it specifically calls out as necessary:
 *
 *   1. Re-evaluate on every animation frame, not just on pointermove. An animated
 *      element (this app has a few — the pulse-dot status indicators) can drift in or
 *      out from under an otherwise-stationary cursor purely because of its own
 *      animation; a pointermove-only check would miss that and report stale state.
 *   2. Only call hitstate() when the boolean actually changes, not on every frame —
 *      keeps this cheap and avoids spamming the bridge.
 *   3. Sync the tracked cursor position from window.__nativeSyncPointer, not just
 *      pointermove — see the property doc above for why pointermove alone isn't
 *      enough once the widget goes click-through.
 *
 * "Interactive" is determined the same way ThreeDShell's pointer-events-none/auto
 * zoning already works, rather than the reference's `.closest('.clickable')` marker
 * class: document.elementFromPoint() skips every pointer-events:none element (all the
 * "reserved for 3D" regions), so over empty space it bottoms out at <body>/<html>;
 * over a real UI island (which opts back into pointer-events-auto) it returns that
 * element instead. Equivalent in effect, but piggybacks on structure this app already
 * maintains instead of requiring every interactive element to carry an extra class.
 *
 * Also still exposes a `three-d-pointer-target` CustomEvent and a
 * `data-pointer-target` attribute on <body> — cheap, harmless secondary signals from
 * before this bridge's exact contract was known; left in in case anything else in the
 * embedding ends up wanting to poll the DOM instead of listening on window.ue.
 */
export function PointerPassthroughBridge() {
  const posRef = useRef({ x: -1, y: -1 });
  const lastReportedRef = useRef<boolean | null>(null);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      posRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.__nativeSyncPointer = (x: number, y: number) => {
      posRef.current = { x, y };
    };

    let rafId = requestAnimationFrame(function loop() {
      const { x, y } = posRef.current;
      if (x >= 0 && y >= 0) {
        const el = document.elementFromPoint(x, y);
        const interactive = el !== null && el !== document.body && el !== document.documentElement;
        if (interactive !== lastReportedRef.current) {
          lastReportedRef.current = interactive;
          document.body.dataset.pointerTarget = interactive ? "interactive" : "empty";
          window.dispatchEvent(new CustomEvent("three-d-pointer-target", { detail: { interactive } }));
          window.ue?.interface?.hitstate?.(interactive);
        }
      }
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      delete window.__nativeSyncPointer;
      cancelAnimationFrame(rafId);
      delete document.body.dataset.pointerTarget;
    };
  }, []);

  return null;
}
