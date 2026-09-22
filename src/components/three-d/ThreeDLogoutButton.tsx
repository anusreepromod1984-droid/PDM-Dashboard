"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { ROUTES_3D } from "@/lib/routes";
import { hardNavigate } from "@/lib/hardNavigate";
import { IconLogout } from "@/components/icons";
import { useEntranceAnimation } from "@/hooks/useEntranceAnimation";

/**
 * The /3d flow has no topbar/profile menu to host this, so it's its own floating
 * button — bottom-left, mirroring the bottom-right chat toggle. Uses the shared
 * .three-d-panel background (globals.css) — see that rule's comment for why it's
 * plain rgb()-with-alpha instead of a Tailwind opacity-modifier class/backdrop-blur.
 */
export function ThreeDLogoutButton() {
  const ref = useEntranceAnimation<HTMLButtonElement>(2);
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    // hardNavigate (a synthesized link click), not next/navigation's router.replace()
    // or a plain window.location assignment — see hardNavigate.ts and ThreeDGate.
    hardNavigate(ROUTES_3D.login());
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      aria-label="Log out"
      title="Log out"
      // pointer-events-auto: this button is a child of ThreeDShell's root wrapper,
      // which is pointer-events-none (so clicks fall through to the 3D world by
      // default) — without re-declaring auto here, it would inherit that none and
      // become unclickable.
      className="three-d-panel pointer-events-auto fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-hairline text-secondary shadow-2xl transition-colors hover:text-primary disabled:opacity-60"
    >
      <IconLogout className="h-5 w-5" />
    </button>
  );
}
