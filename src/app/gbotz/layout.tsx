"use client";

import { GbotzAuthProvider } from "@/context/GbotzAuthProvider";
import { GbotzGate } from "@/components/gbotz/GbotzGate";
import { GbotzSWRConfig } from "@/components/gbotz/GbotzSWRConfig";

/**
 * Fully independent from the tenant tree — no ThemeProvider nesting needed beyond the
 * root layout, and deliberately no AuthProvider/RealtimeProvider here at all. See
 * backend README / plan: /gbotz is a completely separate system, not a role inside
 * the tenant system.
 */
export default function GbotzLayout({ children }: { children: React.ReactNode }) {
  return (
    <GbotzAuthProvider>
      <GbotzSWRConfig>
        <GbotzGate>{children}</GbotzGate>
      </GbotzSWRConfig>
    </GbotzAuthProvider>
  );
}
