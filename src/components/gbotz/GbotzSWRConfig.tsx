"use client";

import { SWRConfig } from "swr";
import { ApiError } from "@/lib/api";
import { useGbotzAuth } from "@/context/GbotzAuthProvider";

/**
 * Bridges SWR's background revalidation to the auth context: GbotzAuthProvider only
 * ever learns the session is dead from its own one-shot mount check (see its own doc
 * comment on why this isn't factored into a shared cross-system helper), so a 401
 * surfacing on some unrelated background refetch — the common case, since a Gbotz
 * staffer's 12h session often expires mid-tab rather than between page loads — would
 * otherwise just sit in SWR's unread error state while the page keeps showing stale
 * cached data. This turns that into an immediate sessionExpired(), which flips
 * GbotzGate's redirect effect on.
 */
export function GbotzSWRConfig({ children }: { children: React.ReactNode }) {
  const { sessionExpired } = useGbotzAuth();

  return (
    <SWRConfig
      value={{
        onError: (err) => {
          if (err instanceof ApiError && err.status === 401) sessionExpired();
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
