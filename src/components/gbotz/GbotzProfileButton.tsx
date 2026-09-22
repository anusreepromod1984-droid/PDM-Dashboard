"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGbotzAuth } from "@/context/GbotzAuthProvider";
import { GBOTZ } from "@/lib/routes";

/** Mirrors the tenant ProfileButton exactly — navigates to a profile page, doesn't log out on click. */
export function GbotzProfileButton() {
  const { admin } = useGbotzAuth();
  const pathname = usePathname();
  const initial = admin?.email?.[0]?.toUpperCase() ?? "?";
  const active = pathname === GBOTZ.profile();

  return (
    <Link
      href={GBOTZ.profile()}
      title={admin?.email ?? "Profile"}
      aria-label="Profile"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-hairline bg-surface-2 text-secondary hover:border-baseline hover:text-primary"
      }`}
    >
      {initial}
    </Link>
  );
}
