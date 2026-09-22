"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useCompany } from "@/context/CompanyProvider";

export function ProfileButton() {
  const { user } = useAuth();
  const { routes } = useCompany();
  const pathname = usePathname();
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";
  const active = pathname === routes.profile();

  return (
    <Link
      href={routes.profile()}
      data-tour="topbar-profile"
      title={user?.email ?? "Profile"}
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
