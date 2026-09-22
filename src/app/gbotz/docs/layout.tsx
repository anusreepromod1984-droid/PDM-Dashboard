"use client";

import { useState } from "react";
import Link from "next/link";
import { GBOTZ } from "@/lib/routes";
import { IconDotsGrid } from "@/components/icons";
import { DocsSidebar } from "@/components/gbotz/docs/DocsSidebar";
import { DocsSearch } from "@/components/gbotz/docs/DocsSearch";

/**
 * Full-screen (see GbotzGate's isFullScreenPath) — a tree-nav + reading-column docs
 * layout needs the whole viewport, not a slice of it next to the app's own sidebar.
 * Each DOC_SECTIONS entry is its own route under [id]/page.tsx; this layout persists
 * the header/sidebar chrome across those navigations instead of remounting it.
 */
export default function GbotzDocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full flex-col bg-surface-2">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-hairline bg-surface px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-2 hover:text-primary"
          >
            <IconDotsGrid className="h-[18px] w-[18px]" />
          </button>
          <Link href={GBOTZ.home()} className="shrink-0 text-sm text-muted hover:text-primary">
            ← Gbotz
          </Link>
          <span className="h-4 w-px shrink-0 bg-hairline" />
          <span className="truncate text-sm font-medium text-primary">Dashboard template docs</span>
        </div>
        <DocsSearch />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={`shrink-0 overflow-hidden border-hairline bg-surface transition-all duration-200 ${
            sidebarOpen ? "w-64 border-r" : "w-0 border-r-0"
          }`}
        >
          <div className="h-full w-64">
            <DocsSidebar />
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
