"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { routes } from "@/lib/routes";

const PUBLIC_PATHS = new Set([routes.login()]);

/**
 * Top-level tenant gate: only the authenticated/unauthenticated <-> /login redirect.
 * Everything else (the bare "/" redirect stub, and the slug cross-check + shell for
 * /[company]/**) is handled further down — see app/(tenant)/page.tsx and
 * components/tenant/CompanyGate.tsx. This is a UX convenience, NOT the security
 * boundary — the backend's requireAuth middleware and Socket.IO handshake check are
 * what actually refuse unauthenticated data access.
 */
export function TenantGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status } = useAuth();
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (status === "unauthenticated" && !isPublicPath) router.replace(routes.login());
    if (status === "authenticated" && isPublicPath && user) router.replace(routes.company(user.company.slug));
  }, [status, isPublicPath, user, router]);

  if (isPublicPath) {
    // /login renders its own centered layout — no sidebar/topbar/realtime connection.
    return <>{children}</>;
  }

  if (status === "loading") {
    // Covers the brief moment before either redirect above fires — never flash
    // protected content while we don't yet know if there's a valid session.
    return (
      <div className="flex h-full items-center justify-center bg-surface-2 text-sm text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
