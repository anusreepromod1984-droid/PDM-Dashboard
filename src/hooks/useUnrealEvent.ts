"use client";

import { useEffect, useRef } from "react";

/**
 * Subscribes to an event Unreal sends into the /3d page via its Web Browser widget's
 * InteractiveBrowserWidget::SendEventToBrowser(EventName, PayloadJson) — which lands
 * here as a plain `window` CustomEvent named EventName, carrying PayloadJson as
 * `detail`. Mirrors the receiving side of the 3D team's reference integration
 * (browser_overlay_option_a.html), generalized to any event name/payload instead of
 * that file's single demo event.
 */
export function useUnrealEvent<T = unknown>(eventName: string, handler: (payload: T) => void): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    function onEvent(e: Event) {
      handlerRef.current((e as CustomEvent<T>).detail);
    }
    window.addEventListener(eventName, onEvent);
    return () => window.removeEventListener(eventName, onEvent);
  }, [eventName]);
}
