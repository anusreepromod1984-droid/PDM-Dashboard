"use client";

import { useHeadingScrollSpy } from "@/components/gbotz/docs/useHeadingScrollSpy";
import { DocsAssistant } from "@/components/gbotz/docs/DocsAssistant";

export function DocsPageAside({ headings }: { headings: { id: string; title: string }[] }) {
  const activeId = useHeadingScrollSpy(headings.map((h) => h.id));

  return (
    <div className="sticky top-10 flex flex-col gap-6">
      <DocsAssistant />

      <nav className="flex flex-col gap-1 text-xs">
        <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">On this page</div>
        <ul className="flex flex-col gap-0.5 border-l border-hairline">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`-ml-px block truncate border-l-2 px-3 py-1 transition-colors ${
                  activeId === h.id
                    ? "border-accent font-medium text-primary"
                    : "border-transparent text-muted hover:text-primary"
                }`}
              >
                {h.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
