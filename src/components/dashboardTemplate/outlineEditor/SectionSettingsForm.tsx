"use client";

import { useState } from "react";
import { IconChevronRight } from "@/components/icons";
import {
  parseSectionLayout,
  updateSectionAttrs,
  type ContainerNode,
  type SectionLayout,
} from "@/lib/dashboardTemplate/outlineParser";

const inputClass =
  "rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent";

interface SectionSettingsFormProps {
  section: ContainerNode;
  source: string;
  onChange: (next: string) => void;
  onBack: () => void;
  onDelete: () => void;
}

/**
 * The container counterpart to BlockSettingsForm — only ever shown for a section
 * this editor itself created (`section.explicit`, see outlineParser's ContainerNode),
 * since that's the only kind of container with a heading/class span guaranteed to be
 * in the shape `updateSectionAttrs` knows how to rewrite. Local state for the same
 * reason BlockSettingsForm uses it: keyed by `section.id` (stable across pure-attrs
 * edits), so React never remounts this mid-edit.
 */
export function SectionSettingsForm({ section, source, onChange, onBack, onDelete }: SectionSettingsFormProps) {
  const [heading, setHeading] = useState(section.label);
  const [layout, setLayout] = useState<SectionLayout>(() => parseSectionLayout(section.attrsRaw));

  function updateHeading(next: string) {
    setHeading(next);
    onChange(updateSectionAttrs(source, section, { heading: next }));
  }

  function updateLayout(next: SectionLayout) {
    setLayout(next);
    onChange(updateSectionAttrs(source, section, { layout: next }));
  }

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={onBack}
        className="flex shrink-0 items-center gap-1 border-b border-hairline px-3 py-3 text-xs font-medium text-muted hover:text-primary"
      >
        <IconChevronRight className="h-3.5 w-3.5 rotate-180" />
        Back to outline
      </button>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-3 text-sm font-semibold text-primary">Section settings</p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-secondary">Heading</span>
            <input type="text" className={inputClass} value={heading} onChange={(e) => updateHeading(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-secondary">Layout</span>
            <select
              className={inputClass}
              value={layout.mode}
              onChange={(e) => updateLayout({ ...layout, mode: e.target.value as SectionLayout["mode"] })}
            >
              <option value="column">Column (stacked)</option>
              <option value="row">Row (side by side)</option>
              <option value="grid">Grid</option>
            </select>
          </label>

          {layout.mode === "grid" && (
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-secondary">Columns</span>
              <input
                type="number"
                min={1}
                max={6}
                className={inputClass}
                value={layout.columns}
                onChange={(e) => {
                  const columns = Number(e.target.value);
                  if (Number.isNaN(columns)) return;
                  updateLayout({ ...layout, columns: Math.min(6, Math.max(1, columns)) });
                }}
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-secondary">Gap</span>
            <input
              type="number"
              min={0}
              max={12}
              className={inputClass}
              value={layout.gap}
              onChange={(e) => {
                const gap = Number(e.target.value);
                if (Number.isNaN(gap)) return;
                updateLayout({ ...layout, gap: Math.min(12, Math.max(0, gap)) });
              }}
            />
          </label>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="m-3 shrink-0 rounded-lg border px-3 py-2 text-sm font-medium"
        style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}
      >
        Delete this section
      </button>
    </div>
  );
}
