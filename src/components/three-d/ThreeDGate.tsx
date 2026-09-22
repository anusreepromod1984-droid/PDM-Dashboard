"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { ROUTES_3D, stripTrailingSlash } from "@/lib/routes";
import { hardNavigate } from "@/lib/hardNavigate";
import { ThreeDLoadingPanel } from "@/components/three-d/ThreeDLoadingPanel";

const PUBLIC_PATHS = new Set([ROUTES_3D.login()]);

/**
 * Top-level gate for the /3d immersive flow — the exact same auth <-> /3d/login
 * redirect TenantGate does for the regular flow, just pointed at /3d/login and
 * /3d/<slug> instead. Fully independent auth check (this route tree mounts its own
 * AuthProvider, see app/3d/layout.tsx) even though it's the same backend session
 * cookie — not the security boundary, same as TenantGate; the backend's requireAuth
 * middleware and Socket.IO handshake check are what actually enforce this.
 *
 * Redirects use hardNavigate (a synthesized link click), not next/navigation's
 * router.replace() or a plain window.location assignment — see hardNavigate.ts. Both
 * of those were tried first and confirmed to still not work inside the /3d flow's
 * embedded web widget despite working in every real browser; a synthesized click is
 * the best available way to make the navigation look like a genuine one to whatever
 * navigation policy the widget enforces.
 */
export function ThreeDGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, status } = useAuth();
  // stripTrailingSlash: the /3d flow's embedding widget was observed requesting
  // "/3d/login/" (trailing slash) — see stripTrailingSlash's own comment for why that
  // reaches here unmodified instead of being normalized away by Next.js itself.
  // Without this, isPublicPath is wrongly false for that URL, so this gate never takes
  // its "public path, just render the login page" branch — it falls through to the
  // loading/redirect logic instead, which was bouncing the very first load through an
  // extra, unnecessary hard-navigation cycle before the login page ever settled.
  const isPublicPath = PUBLIC_PATHS.has(stripTrailingSlash(pathname));

  useEffect(() => {
    if (status === "unauthenticated" && !isPublicPath) hardNavigate(ROUTES_3D.login());
    if (status === "authenticated" && isPublicPath && user) {
      hardNavigate(ROUTES_3D.company(user.company.slug));
    }
  }, [status, isPublicPath, user]);

  if (isPublicPath) {
    // /3d/login renders its own centered layout — no shell, no realtime connection.
    return <>{children}</>;
  }

  if (status === "loading") {
    return <ThreeDLoadingPanel />;
  }

  return <>{children}</>;
}
