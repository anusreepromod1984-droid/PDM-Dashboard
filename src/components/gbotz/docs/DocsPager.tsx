import Link from "next/link";
import { GBOTZ } from "@/lib/routes";
import { IconChevronRight } from "@/components/icons";
import type { DocSection } from "@/components/gbotz/docs/docsContent";

function PagerLink({ section, direction }: { section: DocSection; direction: "prev" | "next" }) {
  return (
    <Link
      href={GBOTZ.docsSection(section.id)}
      className={`flex w-full flex-col gap-0.5 rounded-lg border border-hairline bg-surface px-4 py-3 transition-colors hover:border-baseline hover:bg-surface-2 sm:w-1/2 ${
        direction === "next" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="flex items-center gap-1 text-xs text-muted">
        {direction === "prev" && <IconChevronRight className="h-3 w-3 rotate-180" />}
        {direction === "prev" ? "Previous" : "Next"}
        {direction === "next" && <IconChevronRight className="h-3 w-3" />}
      </span>
      <span className="truncate text-sm font-medium text-primary">{section.title}</span>
    </Link>
  );
}

export function DocsPager({ prev, next }: { prev: DocSection | null; next: DocSection | null }) {
  if (!prev && !next) return null;

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row">
      {prev ? <PagerLink section={prev} direction="prev" /> : <div className="hidden sm:block sm:w-1/2" />}
      {next ? <PagerLink section={next} direction="next" /> : <div className="hidden sm:block sm:w-1/2" />}
    </div>
  );
}
