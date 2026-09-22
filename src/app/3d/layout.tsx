"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthProvider";
import { ThreeDGate } from "@/components/three-d/ThreeDGate";

/**
 * Root of the /3d immersive flow — fully independent from the (tenant) route group
 * (own AuthProvider mount, own gate), same pattern as /gbotz's layout. Same backend
 * session cookie as the regular flow, just a separate client-side auth check/redirect
 * target so /3d/login <-> /3d/<company> never touches the regular /login <-> /<company>
 * redirects.
 */
export default function ThreeDLayout({ children }: { children: React.ReactNode }) {
  // Marks <html> so globals.css can scope the transparent-background override and the
  // GPU-compositing-dependent animation fallbacks to just this flow (see globals.css's
  // html[data-flow="3d"] rules) — this route tree is meant to be embedded as an overlay
  // inside Unreal Engine's web widget, with the 3D scene showing through everywhere
  // this page doesn't draw its own UI. Cleaned up on unmount since this is a client-side
  // SPA: navigating from here back into the regular (tenant) flow doesn't reload the
  // document, so a stale attribute would otherwise leak a transparent background into it.
  useEffect(() => {
    document.documentElement.dataset.flow = "3d";
    return () => {
      delete document.documentElement.dataset.flow;
    };
  }, []);

  return (
    <AuthProvider>
      <ThreeDGate>{children}</ThreeDGate>
    </AuthProvider>
  );
}
