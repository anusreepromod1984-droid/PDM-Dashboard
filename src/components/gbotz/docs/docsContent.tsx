import { isValidElement, type ReactNode } from "react";
import { ELEMENT_REGISTRY } from "@/lib/dashboardTemplate/elementRegistry";
import { DEFAULT_FLEET_TEMPLATE, DEFAULT_MACHINE_TEMPLATES } from "@/lib/dashboardTemplate/defaultTemplates";
import { MACHINE_VIEWS } from "@/lib/machineViews";
import { DocsCallout } from "@/components/gbotz/docs/DocsCallout";
import { DocsCodeBlock } from "@/components/gbotz/docs/DocsCodeBlock";
import { DocsHeading } from "@/components/gbotz/docs/DocsHeading";

export interface DocSection {
  id: string;
  title: string;
  group: string;
  body: ReactNode;
  /** In-page anchors for the right-rail "On this page" nav — only sections with
   *  more than one distinct part need these; the rest fall back to their own title. */
  headings?: { id: string; title: string }[];
}

const GETTING_STARTED: DocSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    group: "Getting Started",
    headings: [
      { id: "introduction-what", title: "What templates are" },
      { id: "introduction-editing", title: "Editing a template" },
    ],
    body: (
      <>
        <DocsHeading id="introduction-what">What templates are</DocsHeading>
        <p>
          Every company&apos;s client-facing dashboard — the fleet Overview page and each of the 6 machine tabs
          (Overview, Vibration, Motor Faults, Energy Meter, Environment, Acoustic) — is written in a small,
          Liquid-style templating language. It mixes plain HTML with a handful of special tags that pull in
          live sensor data.
        </p>
        <DocsHeading id="introduction-editing">Editing a template</DocsHeading>
        <p>
          Templates are edited from <strong className="text-primary">Companies → a company → General → Advanced
          → Edit dashboard</strong>, which opens a full-screen editor with a live preview alongside it.
        </p>
        <DocsCallout>
          A new company can start from a <strong>blank</strong> template or the <strong>default</strong> one
          (a copy of the standard look) — either way, it&apos;s fully editable afterward.
        </DocsCallout>
      </>
    ),
  },
  {
    id: "how-it-works",
    title: "How live data works",
    group: "Getting Started",
    headings: [
      { id: "how-it-works-structure", title: "Templates describe structure" },
      { id: "how-it-works-values", title: "Values resolve at render time" },
    ],
    body: (
      <>
        <DocsHeading id="how-it-works-structure">Templates describe structure</DocsHeading>
        <p>
          A template only describes <em>structure</em>: which elements appear, in what order, bound to which
          machine and field. It&apos;s only re-parsed when a template is saved — never on every telemetry tick.
        </p>
        <DocsHeading id="how-it-works-values">Values resolve at render time</DocsHeading>
        <p>
          Live numbers are never written into the template itself. Each element (a stat card, a trend chart…)
          looks up its own current value the moment it renders, the same way the rest of the dashboard does, so
          it updates in real time without the template changing at all.
        </p>
        <DocsCallout type="warning">
          Plain <code>{"{{ machine.name }}"}</code>-style interpolation is resolved once, at save time. Never
          use it for a number that should visibly tick — use an element instead.
        </DocsCallout>
      </>
    ),
  },
];

const REFERENCE: DocSection[] = [
  {
    id: "variables",
    title: "Variables",
    group: "Reference",
    headings: [
      { id: "variables-scope", title: "Fleet page vs. machine tab" },
      { id: "variables-machine-param", title: "The machine parameter" },
    ],
    body: (
      <>
        <DocsHeading id="variables-scope">Fleet page vs. machine tab</DocsHeading>
        <p>
          The fleet Overview template sees a <code>company</code> object and a <code>machines</code> array.
          Each of the 6 machine-tab templates instead sees a single <code>machine</code> variable — the
          machine whose page is currently open.
        </p>
        <DocsCodeBlock>{`{{ company.name }}, company.slug, company.logoUrl, company.accentColor

{% for machine in machines %}
  {{ machine.name }}
{% endfor %}

machine.id, machine.name, machine.location, machine.ratedRpm, machine.online`}</DocsCodeBlock>
        <DocsHeading id="variables-machine-param">The machine parameter</DocsHeading>
        <p>
          Every element tag takes <code>machine: machine</code> — the loop variable on the fleet page, or the
          single <code>machine</code> variable on a machine tab. It means the same thing either way.
        </p>
      </>
    ),
  },
  {
    id: "elements",
    title: "Elements overview",
    group: "Reference",
    body: (
      <>
        <p>
          Elements are the only way a template shows a live number, chart, or gauge — each one resolves its own
          value at render time from that machine&apos;s current sensor feed. Every element is listed individually
          on the left.
        </p>
        <DocsCallout>
          This list comes straight from the element registry — a new element added to the codebase shows up
          here automatically.
        </DocsCallout>
      </>
    ),
  },
  ...Object.entries(ELEMENT_REGISTRY).map(([name, def]) => ({
    id: `element-${name}`,
    title: name,
    group: "Elements",
    body: (
      <>
        <DocsCodeBlock>{def.usage}</DocsCodeBlock>
        <p>{def.description}</p>
      </>
    ),
  })),
  {
    id: "filters",
    title: "Filters",
    group: "Reference",
    body: (
      <>
        <p>Applied to plain interpolated output with a pipe — useful for static/structural values.</p>
        <DocsCodeBlock>{'{{ machine.ratedRpm | formatNumber: 0 }}'}</DocsCodeBlock>
      </>
    ),
  },
  {
    id: "raw-html",
    title: "Raw HTML & layout",
    group: "Reference",
    headings: [
      { id: "raw-html-layout", title: "Layout is just markup" },
      { id: "raw-html-stripped", title: "What gets stripped" },
    ],
    body: (
      <>
        <DocsHeading id="raw-html-layout">Layout is just markup</DocsHeading>
        <p>
          Anything that isn&apos;t a recognized tag is passed through exactly as written — Tailwind utility
          classes work, so layout and section containers are just plain markup around the elements above.
        </p>
        <DocsCodeBlock>{'<div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">\n  <h2 class="text-sm font-semibold text-primary">Section title</h2>\n  <p class="mt-0.5 text-xs text-muted">Subtitle</p>\n  {% stat_card machine: machine, field: "rpm", label: "RPM" %}\n</div>'}</DocsCodeBlock>
        <DocsHeading id="raw-html-stripped">What gets stripped</DocsHeading>
        <DocsCallout type="warning">
          <code>{"<script>"}</code> tags and inline <code>on*</code> event handlers are stripped at render time
          — they never reach a client&apos;s browser.
        </DocsCallout>
      </>
    ),
  },
];

const EXAMPLES: DocSection[] = [
  {
    id: "example-fleet",
    title: "Fleet Overview",
    group: "Examples",
    body: (
      <>
        <p>The default fleet-level Overview — fleet-wide stat cards, the health map, and a machine card grid.</p>
        <DocsCodeBlock>{DEFAULT_FLEET_TEMPLATE}</DocsCodeBlock>
      </>
    ),
  },
  ...MACHINE_VIEWS.map((view) => ({
    id: `example-${view.key}`,
    title: view.label,
    group: "Examples",
    body: (
      <>
        <p>{view.description}</p>
        <DocsCodeBlock>{DEFAULT_MACHINE_TEMPLATES[view.key]}</DocsCodeBlock>
      </>
    ),
  })),
];

export const DOC_SECTIONS: DocSection[] = [...GETTING_STARTED, ...REFERENCE, ...EXAMPLES];

/** Group order + which groups collapse under a parent in the sidebar tree. */
export const DOC_GROUP_ORDER = ["Getting Started", "Reference", "Elements", "Examples"];

export function findDocSection(id: string): DocSection | undefined {
  return DOC_SECTIONS.find((s) => s.id === id);
}

/**
 * DOC_SECTIONS's own array order interleaves groups (the Elements registry entries
 * are spliced into the middle of REFERENCE) so it isn't reading order. This walks
 * DOC_GROUP_ORDER and pulls each group's members together, matching what the sidebar
 * actually displays top to bottom — that's the order Prev/Next should follow.
 */
export function getOrderedDocSections(): DocSection[] {
  return DOC_GROUP_ORDER.flatMap((group) => DOC_SECTIONS.filter((s) => s.group === group));
}

export function getDocNeighbors(id: string): { prev: DocSection | null; next: DocSection | null } {
  const ordered = getOrderedDocSections();
  const index = ordered.findIndex((s) => s.id === id);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? ordered[index - 1]! : null,
    next: index < ordered.length - 1 ? ordered[index + 1]! : null,
  };
}

function extractText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return extractText(node.props.children);
  return "";
}

/**
 * Flattens every DOC_SECTIONS body down to plain text — the grounding context sent
 * to the docs AI assistant. Computed from the same source the pages render, so it
 * can never drift out of sync with what's actually documented.
 */
export function getDocsCorpusText(): string {
  return getOrderedDocSections()
    .map((s) => `## ${s.group} — ${s.title}\n${extractText(s.body)}`)
    .join("\n\n");
}
