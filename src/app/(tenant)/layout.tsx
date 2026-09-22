"use client";

import { AuthProvider } from "@/context/AuthProvider";
import { TourProvider } from "@/context/TourProvider";
import { TenantGate } from "@/components/tenant/TenantGate";

/**
 * Wraps both /login and /[company] (once PR2 lands) — this shared ancestor is what
 * lets a post-login `router.replace()` carry the just-set auth state through the
 * navigation without unmounting/remounting AuthProvider (which would otherwise
 * re-fire /api/auth/me and flash a loading screen right after a successful login).
 *
 * TourProvider nests inside AuthProvider (it reads useAuth()) and outside TenantGate
 * — the guided product tour is company/tenant-only by construction, since this whole
 * layout subtree is; it never mounts for gbotz or the /3d flow, which have their own
 * separate layout trees.
 */
export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TourProvider>
        <TenantGate>{children}</TenantGate>
      </TourProvider>
    </AuthProvider>
  );
}
