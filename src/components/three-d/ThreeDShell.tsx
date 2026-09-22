"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { AiFaultAssistant } from "@/components/AiFaultAssistant";
import { ThreeDLogo } from "@/components/three-d/ThreeDLogo";
import { HomeLink } from "@/components/three-d/HomeLink";
import { ThreeDChatToggle } from "@/components/three-d/ThreeDChatToggle";
import { ThreeDLogoutButton } from "@/components/three-d/ThreeDLogoutButton";
import { PointerPassthroughBridge } from "@/components/three-d/PointerPassthroughBridge";
import { useCompany } from "@/context/CompanyProvider";

const ASSISTANT_STORAGE_KEY = "pdm-3d-assistant-open";

/**
 * Chrome for the /3d immersive flow — deliberately no sidebar and no topbar (see plan):
 * `children` fills the full viewport edge-to-edge as "frame 1", left empty (or split
 * left/right — see the overview and machine pages) by the pages that render it, so the
 * 3D team's Unreal Engine overlay ("frame 2") has clean space to sit on top of. Every
 * control here is `fixed` (viewport-anchored, not part of the document flow) so it
 * stays in place regardless of page content or what frame 2 renders underneath.
 */
export function ThreeDShell({ children }: { children: React.ReactNode }) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { company } = useCompany();

  useEffect(() => {
    // Embedded browser widgets (this flow renders inside Unreal Engine's web widget)
    // sometimes run with storage disabled/restricted — localStorage access there can
    // throw a SecurityError instead of just being unavailable. This is a UI
    // preference, not the session itself (that's an httpOnly cookie the backend
    // manages), so failing quietly and falling back to the default is correct.
    try {
      const stored = window.localStorage.getItem(ASSISTANT_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser API (localStorage) on mount, not deriving state from a prop
      if (stored !== null) setAssistantOpen(stored === "true");
    } catch {
      // Storage unavailable — keep the default closed state.
    }
  }, []);

  const toggleAssistant = useCallback(() => {
    setAssistantOpen((o) => {
      const next = !o;
      try {
        window.localStorage.setItem(ASSISTANT_STORAGE_KEY, String(next));
      } catch {
        // Storage unavailable — the toggle still works for this session, it just
        // won't be remembered across reloads.
      }
      return next;
    });
  }, []);

  const openAssistant = useCallback(() => {
    setAssistantOpen(true);
    try {
      window.localStorage.setItem(ASSISTANT_STORAGE_KEY, "true");
    } catch {
      // Storage unavailable — see toggleAssistant above.
    }
  }, []);

  // Same per-company accent override TenantShell applies, scoped here so it never
  // leaks outside this subtree.
  const style: CSSProperties | undefined = company.accentColor
    ? ({ "--accent": company.accentColor } as CSSProperties)
    : undefined;

  return (
    // Transparent, not bg-surface-2 — this flow is embedded as an overlay inside
    // Unreal Engine's web widget, and the 3D scene needs to show through everywhere
    // this page doesn't draw its own UI. See app/3d/layout.tsx (stamps data-flow="3d"
    // on <html>) and globals.css for the matching <body> override.
    //
    // pointer-events-none here is the other half of "transparent": a see-through div
    // still captures every click/drag/scroll by default, which would make the 3D
    // world underneath completely uninteractive. Setting it here lets clicks fall
    // through this wrapper (and everything under it that doesn't opt back in) to
    // whatever's behind/around it; every actual UI element below re-enables
    // `pointer-events-auto` on itself, and — because pointer-events is only ever
    // re-evaluated where it's explicitly set again — that re-enables the auto value
    // for that element's whole subtree too, no per-child opt-in needed beyond that
    // one root. Pages rendered via {children} follow the same pattern: an empty
    // "reserved for 3D" half stays none-by-inheritance, and their actual content
    // container opts back in.
    <div style={style} className="relative h-full w-full bg-transparent pointer-events-none">
      <main className="h-full w-full">{children}</main>

      <div className="pointer-events-auto fixed top-6 left-6 z-30 flex flex-row items-center gap-3">
        <ThreeDLogo />
        <HomeLink />
      </div>

      <AiFaultAssistant variant="floating" open={assistantOpen} onRequestOpen={openAssistant} />
      <ThreeDChatToggle open={assistantOpen} onToggle={toggleAssistant} />
      <ThreeDLogoutButton />
      <PointerPassthroughBridge />
    </div>
  );
}
