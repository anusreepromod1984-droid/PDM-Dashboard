"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGbotzAuth } from "@/context/GbotzAuthProvider";
import { GbotzShell } from "@/components/gbotz/GbotzShell";
import { GBOTZ } from "@/lib/routes";

const PUBLIC_PATH = GBOTZ.login();

/**
 * The dashboard editor/preview and the docs site are full-screen tools — still gated
 * by auth below, just rendered without GbotzShell's sidebar/topbar chrome eating into
 * that space (docs builds its own 3-column layout with its own header).
 */
function isFullScreenPath(pathname: string): boolean {
  return (
    pathname.startsWith("/gbotz/dashboard-editor/") ||
    pathname.startsWith("/gbotz/dashboard-preview/") ||
    pathname.startsWith("/gbotz/docs")
  );
}

/** Mirrors TenantGate's shape exactly, against the separate Gbotz auth system. */
export function GbotzGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useGbotzAuth();
  const isPublicPath = pathname === PUBLIC_PATH;

  useEffect(() => {
    if (status === "unauthenticated" && !isPublicPath) router.replace(GBOTZ.login());
    if (status === "authenticated" && isPublicPath) router.replace(GBOTZ.home());
  }, [status, isPublicPath, router]);

  if (isPublicPath) return <>{children}</>;

  if (status !== "authenticated") {
    return (
      <div className="flex h-full items-center justify-center bg-surface-2 text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (isFullScreenPath(pathname)) return <>{children}</>;

  return <GbotzShell>{children}</GbotzShell>;
}
