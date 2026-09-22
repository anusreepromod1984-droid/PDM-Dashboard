"use client";

import Image from "next/image";
import { useCompany } from "@/context/CompanyProvider";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

/**
 * Persistent brand mark in the /3d flow's top-left corner, shown on every /3d page
 * including the overview (unlike HomeLink, which hides there since a link back to the
 * page you're already on is redundant). Falls back to the same static Greenbotz mark
 * every other logo in the app shows (Topbar.tsx, both login pages) when the company
 * has no logoUrl configured — which is most companies (it's a rarely-set optional
 * field, admin-editable via admin/branding). Previously fell back to a generic icon
 * instead, which read as "no logo" next to /[slug]'s Topbar always showing the real
 * Greenbotz mark regardless of company branding.
 *
 * The Greenbotz asset is a wide horizontal wordmark (2000x403, same file Topbar.tsx
 * and both login pages use at ~110-136px wide with height:auto) — sized here to match
 * that same aspect ratio instead of forcing it into a square icon badge, which would
 * either distort or shrink it to an illegible sliver. The container is a fit-content
 * pill (like HomeLink, not a fixed square) for the same reason.
 */
export function ThreeDLogo() {
  const ref = useEntranceAnimation<HTMLDivElement>(0);
  const { company } = useCompany();

  return (
    <div
      ref={ref}
      className="three-d-panel flex h-11 items-center justify-center rounded-2xl border border-hairline px-3 shadow-2xl"
    >
      {company.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL (per-company), same as the admin/branding preview
        <img src={company.logoUrl} alt={company.name} className="h-7 max-w-[140px] object-contain" />
      ) : (
        <Image
          src="/greenbotz-logo.png"
          alt="Greenbotz"
          width={2000}
          height={403}
          className="object-contain"
          style={{ width: 90, height: "auto" }}
        />
      )}
    </div>
  );
}
