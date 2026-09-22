import { notFound } from "next/navigation";
import { DOC_SECTIONS, findDocSection, getDocNeighbors } from "@/components/gbotz/docs/docsContent";
import { DocsPager } from "@/components/gbotz/docs/DocsPager";
import { DocsPageAside } from "@/components/gbotz/docs/DocsPageAside";

export async function generateStaticParams() {
  return DOC_SECTIONS.map((section) => ({ id: section.id }));
}

export default async function GbotzDocsSectionPage({ params }: PageProps<"/gbotz/docs/[id]">) {
  const { id } = await params;
  const section = findDocSection(id);
  if (!section) notFound();

  const { prev, next } = getDocNeighbors(id);
  const headings = section.headings?.length ? section.headings : [{ id: section.id, title: section.title }];

  return (
    <div className="flex gap-10">
      <article className="min-w-0 max-w-2xl flex-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">{section.group}</div>
        <h1 id={section.id} className="mb-3 text-xl font-semibold text-primary">
          {section.title}
        </h1>
        <div
          className="flex flex-col gap-3 text-sm leading-relaxed text-secondary
          [&_strong]:font-semibold [&_strong]:text-primary
          [&_em]:not-italic [&_em]:font-medium [&_em]:text-primary
          [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-primary"
        >
          {section.body}
        </div>
        <DocsPager prev={prev} next={next} />
      </article>

      <aside className="hidden w-56 shrink-0 lg:block">
        <DocsPageAside headings={headings} />
      </aside>
    </div>
  );
}
