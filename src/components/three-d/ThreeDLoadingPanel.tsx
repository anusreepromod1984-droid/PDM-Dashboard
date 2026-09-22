"use client";

import Image from "next/image";

/**
 * Small branded loading panel shared by ThreeDGate/ThreeDCompanyGate's loading states
 * (both can render before company context resolves — see their own comments — so this
 * always shows the static app mark rather than attempting a per-tenant logo). Replaces
 * the previous bare "Loading…" gray text with the same .three-d-panel chrome used
 * everywhere else in the flow.
 */
export function ThreeDLoadingPanel() {
  return (
    <div className="flex h-full items-center justify-center bg-transparent p-4">
      <div className="three-d-panel flex items-center gap-3 rounded-2xl border border-hairline px-5 py-3 shadow-2xl">
        <Image
          src="/greenbotz-logo.png"
          alt="Greenbotz"
          width={2000}
          height={403}
          priority
          className="object-contain"
          style={{ width: 72, height: "auto" }}
        />
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-hairline border-t-accent" />
        <span className="text-sm text-muted">Loading…</span>
      </div>
    </div>
  );
}
