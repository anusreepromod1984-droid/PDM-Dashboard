"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ShellFrame } from "@/components/ShellFrame";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { AlertToastStack } from "@/components/AlertToastStack";
import { AlertBorderGlow } from "@/components/AlertBorderGlow";
import { AiFaultAssistant } from "@/components/AiFaultAssistant";
import { TourAutoTrigger } from "@/components/tour/TourLauncher";
import { TourOverlay } from "@/components/tour/TourOverlay";
import { useCompany } from "@/context/CompanyProvider";

const SIDEBAR_STORAGE_KEY = "pdm-sidebar-open";
const ASSISTANT_STORAGE_KEY = "pdm-assistant-open";

export function TenantShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const { company } = useCompany();

  // Runs client-side only, after the default-closed first render, so the SSR
  // markup never mismatches what localStorage says — see ThemeProvider for the
  // same read-after-mount pattern.
  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser API (localStorage) on mount, not deriving state from a prop
    if (stored !== null) setSidebarOpen(stored === "true");
    const storedAssistant = window.localStorage.getItem(ASSISTANT_STORAGE_KEY);
    if (storedAssistant !== null) setAssistantOpen(storedAssistant === "true");
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((o) => {
      const next = !o;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const toggleAssistant = useCallback(() => {
    setAssistantOpen((o) => {
      const next = !o;
      window.localStorage.setItem(ASSISTANT_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const openAssistant = useCallback(() => {
    setAssistantOpen(true);
    window.localStorage.setItem(ASSISTANT_STORAGE_KEY, "true");
  }, []);

  // A single CSS custom-property override on the shell's root — globals.css already
  // routes every bg-accent/text-accent/border-accent through --accent, so this is a
  // zero-fight integration with the existing theme system. Scoped here (not
  // document.documentElement) so it never leaks into /login or /gbotz, which sit
  // outside this subtree, and needs no effect (SSR-safe).
  const style: CSSProperties | undefined = company.accentColor
    ? ({ "--accent": company.accentColor } as CSSProperties)
    : undefined;

  return (
    <ShellFrame
      style={style}
      topbar={<Topbar onToggleSidebar={toggleSidebar} onToggleAssistant={toggleAssistant} />}
      sidebar={<Sidebar open={sidebarOpen} />}
      rightPanel={<AiFaultAssistant open={assistantOpen} onRequestOpen={openAssistant} />}
    >
      {children}
      <AlertToastStack />
      <TourAutoTrigger />
      <TourOverlay />
    </ShellFrame>
  );
}
