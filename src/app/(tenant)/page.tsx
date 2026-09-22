"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { routes } from "@/lib/routes";

/**
 * Bare "/" is not a real page anymore — every tenant page lives under /[company]/...
 * This redirects to the logged-in user's own company slug (or /login if there isn't
 * one), so a bookmarked "/" from before this migration still lands somewhere useful
 * instead of 404ing.
 */
export default function RootRedirectPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) router.replace(routes.company(user.company.slug));
    if (status === "unauthenticated") router.replace(routes.login());
  }, [status, user, router]);

  return (
    <div className="flex h-full items-center justify-center bg-surface-2 text-sm text-muted">Loading…</div>
  );
}
