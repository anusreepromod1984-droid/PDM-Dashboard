"use client";

import { useCallback, useState } from "react";
import { ShellFrame } from "@/components/ShellFrame";
import { GbotzSidebar } from "@/components/gbotz/GbotzSidebar";
import { GbotzTopbar } from "@/components/gbotz/GbotzTopbar";

export function GbotzShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  return (
    <ShellFrame
      topbar={<GbotzTopbar onToggleSidebar={toggleSidebar} />}
      sidebar={<GbotzSidebar open={sidebarOpen} />}
    >
      {children}
    </ShellFrame>
  );
}
