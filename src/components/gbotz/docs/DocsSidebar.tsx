"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_SECTIONS, DOC_GROUP_ORDER } from "@/components/gbotz/docs/docsContent";
import { GBOTZ } from "@/lib/routes";
import { IconChevronRight } from "@/components/icons";

export function DocsSidebar() {
  const pathname = usePathname();
  const activeId = pathname.split("/").pop();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleGroup(group: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3 text-sm">
      {DOC_GROUP_ORDER.map((group) => {
        const items = DOC_SECTIONS.filter((s) => s.group === group);
        if (items.length === 0) return null;
        const isCollapsed = collapsed.has(group);

        return (
          <div key={group} className="mb-1">
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted transition-colors hover:text-primary"
            >
              {group}
              <IconChevronRight className={`h-3 w-3 shrink-0 transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
            </button>
            {!isCollapsed && (
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={GBOTZ.docsSection(item.id)}
                      className={`block w-full truncate rounded-md px-2.5 py-1.5 text-left transition-colors ${
                        activeId === item.id
                          ? "bg-surface-2 font-medium text-primary"
                          : "text-secondary hover:bg-surface-2 hover:text-primary"
                      }`}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
