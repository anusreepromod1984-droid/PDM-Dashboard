"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which of `ids` (heading elements within the current page's content) is
 * nearest the top of the viewport. Unlike the old cross-page version, this needs no
 * scroll-container ref — getBoundingClientRect is relative to the real viewport
 * regardless of which ancestor actually scrolls, so `root: null` just works.
 */
export function useHeadingScrollSpy(ids: string[]): string {
  const [activeId, setActiveId] = useState(ids[0] ?? "");

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0]!.target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}
