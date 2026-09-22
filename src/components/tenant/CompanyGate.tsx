"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { CompanyProvider } from "@/context/CompanyProvider";
import { RealtimeProvider } from "@/context/RealtimeProvider";
import { TenantShell } from "@/components/tenant/TenantShell";
import { remapSlug, routes } from "@/lib/routes";

/**
 * The slug cross-check: a tenant user must never be able to view another company's
 * slug, even by typing the URL directly. `slug` comes from the URL (passed down by
 * the async server [company]/layout.tsx); if it doesn't match the authenticated
 * user's own company slug, rewrite the URL in place (swap segment 0, keep the rest —
 * friendlier for a post-rename bookmark than always dropping to the bare home) rather
 * than rendering anything for the wrong company, even for an instant.
 *
 * Also mirrors the backend's hard-enforced `mustChangePassword` here: the backend
 * 403s every REST route except /auth/me and /auth/change-password while it's set
 * (requireAuth.ts), but a plain page navigation isn't an API call — without this
 * redirect, a user with a pending forced password change could still browse most of
 * the dashboard via the socket connection (which doesn't check the flag) while
 * individual REST-backed features silently 403 in the background. Force them to
 * /profile (which hosts the change-password form) first.
 *
 * Same "UX convenience, not the security boundary" framing as the auth redirect one
 * level up (TenantGate) — the backend's per-company data scoping is what actually
 * enforces this; see backend/src/http/middleware/requireMachineAccess.ts.
 */
/**
 * The dashboard editor/preview are full-screen tools — still gated by auth below,
 * just rendered without TenantShell's sidebar/topbar chrome eating into that space.
 * Mirrors GbotzGate's isFullScreenPath exactly. `slug` is the segment right before
 * these, e.g. /<slug>/dashboard-preview — checked via startsWith, not an exact match,
 * so a bare /<slug>/dashboard-editor still matches with no trailing content.
 */
function isFullScreenPath(pathname: string, slug: string): boolean {
  return (
    pathname.startsWith(`/${slug}/dashboard-editor`) || pathname.startsWith(`/${slug}/dashboard-preview`)
  );
}

export function CompanyGate({ slug, children }: { slug: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status } = useAuth();

  const mismatched = status === "authenticated" && user && user.company.slug !== slug;
  const profilePath = user ? routes.companyProfile(user.company.slug) : null;
  const mustChangePassword = status === "authenticated" && user?.mustChangePassword && pathname !== profilePath;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(routes.login());
      return;
    }
    if (mismatched && user) {
      router.replace(remapSlug(pathname, user.company.slug));
      return;
    }
    if (mustChangePassword && profilePath) {
      router.replace(profilePath);
    }
  }, [status, mismatched, mustChangePassword, user, profilePath, pathname, router]);

  if (status !== "authenticated" || !user || mismatched || mustChangePassword) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-2 text-sm text-muted">
        Loading…
      </div>
    );
  }

  return (
    <CompanyProvider slug={slug}>
      <RealtimeProvider key={user.id}>
        {isFullScreenPath(pathname, slug) ? children : <TenantShell>{children}</TenantShell>}
      </RealtimeProvider>
    </CompanyProvider>
  );
}
