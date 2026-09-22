"use client";

import Image from "next/image";
import Link from "next/link";
import { LiveClock } from "@/components/LiveClock";
import { GbotzProfileButton } from "@/components/gbotz/GbotzProfileButton";
import { IconDotsGrid } from "@/components/icons";
import { GBOTZ } from "@/lib/routes";

/** Matches the tenant Topbar's structure/classes exactly, for visual consistency across every dashboard surface. */
export function GbotzTopbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-hairline bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          title="Toggle menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
        >
          <IconDotsGrid className="h-[18px] w-[18px]" />
        </button>

        <Image
          src="/greenbotz-logo.png"
          alt="Greenbotz"
          width={2000}
          height={403}
          priority
          className="object-contain"
          style={{ width: 110, height: "auto" }}
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <LiveClock />
        <GbotzProfileButton />
        <Link
          href={GBOTZ.docs()}
          title="Docs"
          className="flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
        >
          DOCS
        </Link>
      </div>
    </header>
  );
}
