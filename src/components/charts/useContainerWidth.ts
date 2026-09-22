"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function useContainerWidth(defaultWidth = 600) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(defaultWidth);

  // useLayoutEffect, not useEffect: measures and applies the real width before the
  // browser paints, instead of after — matters most in narrow containers (e.g. the
  // /3d flow's half-viewport machine panel), where `defaultWidth` is often wider than
  // the real container and would otherwise be visible, overflowing the panel, for one
  // frame on every mount (every tab switch remounts this chart) until the passive
  // effect's ResizeObserver caught up.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth || defaultWidth);
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, width] as const;
}
