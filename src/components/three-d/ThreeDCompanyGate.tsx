"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { Company3DProvider } from "@/context/Company3DProvider";
import { RealtimeProvider } from "@/context/RealtimeProvider";
import { ThreeDShell } from "@/components/three-d/ThreeDShell";
import { routes as rawRoutes, ROUTES_3D, remap3dSlug } from "@/lib/routes";
import { hardNavigate } from "@/lib/hardNavigate";
import { ThreeDLoadingPanel } from "@/components/three-d/ThreeDLoadingPanel";

/**
 * Mirrors CompanyGate's slug cross-check and forced-password-change redirect for the
 * /3d tree. There's no /3d/profile page (out of scope — see plan), so a pending forced
 * password change drops the user into the regular dashboard's profile page instead,
 * which the same session cookie already authorizes.
 *
 * Redirects use hardNavigate (a synthesized link click) rather than next/navigation's
 * router.replace() or a plain window.location assignment — see hardNavigate.ts and
 * ThreeDGate for why.
 */
export function ThreeDCompanyGate({ slug, children }: { slug: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, status } = useAuth();

  const mismatched = status === "authenticated" && user && user.company.slug !== slug;
  const mustChangePassword = status === "authenticated" && user?.mustChangePassword;

  useEffect(() => {
    if (status === "unauthenticated") {
      hardNavigate(ROUTES_3D.login());
      return;
    }
    if (mismatched && user) {
      hardNavigate(remap3dSlug(pathname, user.company.slug));
      return;
    }
    if (mustChangePassword && user) {
      hardNavigate(rawRoutes.companyProfile(user.company.slug));
    }
  }, [status, mismatched, mustChangePassword, user, pathname]);

  if (status !== "authenticated" || !user || mismatched || mustChangePassword) {
    return <ThreeDLoadingPanel />;
  }

  return (
    <Company3DProvider slug={slug}>
      <RealtimeProvider key={user.id}>
        <ThreeDShell>{children}</ThreeDShell>
      </RealtimeProvider>
    </Company3DProvider>
  );
}
