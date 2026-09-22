"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMachines } from "@/context/RealtimeProvider";
import { useCompany } from "@/context/CompanyProvider";
import { MACHINE_VIEWS } from "@/lib/machineViews";
import { IconGrid, IconSettings, IconShield, IconClipboard, IconCalendar } from "@/components/icons";
import { navClass, subNavClass } from "@/components/nav/navStyles";
import { ResizeDivider } from "@/components/ResizeDivider";

const SIDEBAR_WIDTH_STORAGE_KEY = "apms_sidebar_panel_width";
const DEFAULT_SIDEBAR_WIDTH = 220;
const MIN_SIDEBAR_WIDTH = 175;
const MAX_SIDEBAR_WIDTH = 420;

/**
 * An in-flow panel toggled by the 9-dots button in the Topbar — not an overlay: it sits
 * beside the page content (pushing it over) rather than floating on top of it.
 * Supports smooth dragging to customize width, saved to localStorage.
 */
export function Sidebar({ open }: { open: boolean }) {
  const pathname = usePathname();
  const machines = useMachines();
  const { routes, isAdmin, enabledViews } = useCompany();

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val >= MIN_SIDEBAR_WIDTH && val <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(val);
        }
      }
    } catch {}
  }, []);

  return (
    <aside
      style={open ? { width: `${sidebarWidth}px` } : { width: 0 }}
      className={`relative flex shrink-0 border-hairline bg-surface transition-[width] ${
        isResizing ? "transition-none select-none" : "duration-200"
      } ${open ? "border-r" : "border-r-0"}`}
    >
      {open && (
        <ResizeDivider
          side="right"
          width={sidebarWidth}
          minWidth={MIN_SIDEBAR_WIDTH}
          maxWidth={MAX_SIDEBAR_WIDTH}
          defaultWidth={DEFAULT_SIDEBAR_WIDTH}
          onResize={(newWidth) => {
            setIsResizing(true);
            setSidebarWidth(newWidth);
          }}
          onResizeEnd={(finalWidth) => {
            setIsResizing(false);
            setSidebarWidth(finalWidth);
            try {
              window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(finalWidth));
            } catch {}
          }}
          onReset={() => {
            setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
            try {
              window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(DEFAULT_SIDEBAR_WIDTH));
            } catch {}
          }}
        />
      )}
      <div className="flex h-full w-full flex-col overflow-hidden">
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <Link href={routes.home()} data-tour="sidebar-overview" className={navClass(pathname === routes.home())}>
            <IconGrid className="h-4 w-4" />
            Overview
          </Link>

          <div className="mt-5 mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Machines
          </div>

          {machines.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted">Waiting for machine list…</div>
          )}

          <ul data-tour="sidebar-machines" className="flex flex-col gap-0.5">
            {machines.map((machine) => {
              const base = routes.machine(machine.id);
              const isActiveMachine = pathname === base || pathname.startsWith(`${base}/`);
              return (
                <li key={machine.id}>
                  <Link href={base} className={navClass(pathname === base)}>
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${machine.online ? "pulse-dot" : ""}`}
                      style={{
                        backgroundColor: machine.online ? "var(--status-good)" : "var(--text-muted)",
                      }}
                    />
                    <span className="truncate">{machine.name}</span>
                  </Link>
                  {isActiveMachine && (
                    <ul className="mb-1 ml-3.5 mt-0.5 flex flex-col gap-0.5 border-l border-hairline pl-2.5">
                      {MACHINE_VIEWS.filter((v) => v.key !== "overview" && enabledViews.includes(v.key)).map(
                        (view) => {
                          const href = routes.machineView(machine.id, view.slug);
                          const Icon = view.icon;
                          return (
                            <li key={view.slug}>
                              <Link href={href} className={subNavClass(pathname === href)}>
                                <Icon className="h-3.5 w-3.5" />
                                {view.shortLabel}
                              </Link>
                            </li>
                          );
                        }
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div data-tour="sidebar-settings" className="flex flex-col gap-0.5 border-t border-hairline p-3">
          <Link href={routes.crm()} className={navClass(pathname === routes.crm() || pathname.startsWith(`${routes.crm()}/`))}>
            <IconClipboard className="h-4 w-4" />
            CRM
          </Link>
          <Link href={routes.calendar()} className={navClass(pathname === routes.calendar() || pathname.startsWith(`${routes.calendar()}/`))}>
            <IconCalendar className="h-4 w-4" />
            Calendar
          </Link>
          {isAdmin && (
            <Link href={routes.admin()} className={navClass(pathname.startsWith(routes.admin()))}>
              <IconShield className="h-4 w-4" />
              Administration
            </Link>
          )}
          <Link href={routes.settings()} className={navClass(pathname === routes.settings())}>
            <IconSettings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
