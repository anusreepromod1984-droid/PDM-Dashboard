"use client";

import { useState } from "react";
import { IconChevronRight } from "@/components/icons";
import { ELEMENT_REGISTRY } from "@/lib/dashboardTemplate/elementRegistry";
import {
  buildElementTag,
  buildSectionCard,
  findElementByTagStart,
  insertChild,
  isInsideRepeater,
  parseOutline,
  wrapInMachineLoop,
  type ContainerNode,
} from "@/lib/dashboardTemplate/outlineParser";
import type { TemplateView } from "@/lib/dashboardTemplate/useDashboardTemplateDraft";

const inputClass =
  "rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent";

interface AddBlockPickerProps {
  parentId: string;
  root: ContainerNode;
  view: TemplateView;
  source: string;
  onChange: (next: string) => void;
  /** Called with the newly-inserted block's id, once it's confirmed present in the
   *  re-parsed source — lets the sidebar jump straight into its settings. */
  onDone: (newNodeId: string) => void;
  onBack: () => void;
}

function prettifyTagName(tagName: string): string {
  return tagName.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Third sidebar screen (outline / settings / **add**) — see OutlineSidebar's `+`
 * buttons for how `parentId` gets chosen. Filters element types by `pageScope`
 * (elementRegistry.tsx): the fleet template has no singular `machine` in scope
 * outside its {% for %} loop, and a per-machine view has no `machines` collection,
 * so each page only offers what could possibly render there.
 *
 * On the fleet page, a `bindsMachine` element (stat_card, trend_chart, ...) still
 * needs an actual loop to bind through. If `parentId` is already inside one
 * (isInsideRepeater — e.g. the picker was opened from the default "repeats per
 * machine" section), it binds directly; otherwise a brand-new
 * `{% for machine in machines %}` loop is added around it automatically, so the
 * fleet page ends up offering every element a machine view does, not just the two
 * fleet-wide aggregates.
 */
export function AddBlockPicker({ parentId, root, view, source, onChange, onDone, onBack }: AddBlockPickerProps) {
  const options = Object.entries(ELEMENT_REGISTRY).filter(([, def]) =>
    view === "fleet" ? def.pageScope !== "machine" : def.pageScope !== "fleet"
  );
  const insideRepeater = isInsideRepeater(root, parentId);

  const [tagName, setTagName] = useState<string>(options[0]?.[0] ?? "");
  const [wrapInSection, setWrapInSection] = useState(false);
  const [heading, setHeading] = useState("New section");

  const definition = ELEMENT_REGISTRY[tagName];
  const needsNewLoop = view === "fleet" && !!definition?.bindsMachine && !insideRepeater;

  function add() {
    if (!definition) return;
    const binding = definition.bindsMachine ? "machine: machine" : null;
    const tag = buildElementTag(tagName, binding, definition.defaultArgs ?? {});

    let childText = tag;
    let elementOffset = 0;
    if (needsNewLoop) {
      const loop = wrapInMachineLoop(childText);
      childText = loop.text;
      elementOffset += loop.elementTagOffset;
    }
    if (wrapInSection) {
      const card = buildSectionCard(heading.trim() || "New section", childText);
      childText = card.text;
      elementOffset += card.elementTagOffset;
    }

    const { source: nextSource, insertedAt } = insertChild(source, root, parentId, childText);
    if (insertedAt < 0) return; // parentId didn't resolve to a container — nothing to do
    onChange(nextSource);

    const reparsed = parseOutline(nextSource);
    if (!reparsed.ok) return; // shouldn't happen — insertChild only ever grows a childrenSpan
    const newNode = findElementByTagStart(reparsed.root, insertedAt + elementOffset);
    if (newNode) onDone(newNode.id);
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
        <p className="mb-3 text-sm font-semibold text-primary">Add a block</p>

        {options.length === 0 ? (
          <p className="text-xs text-muted">No addable block types for this view.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {options.map(([name, def]) => (
              <label
                key={name}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-2.5 text-xs ${
                  tagName === name ? "border-accent bg-surface-2" : "border-hairline hover:bg-surface-2"
                }`}
              >
                <span className="flex items-center gap-2 font-medium text-primary">
                  <input
                    type="radio"
                    name="block-type"
                    checked={tagName === name}
                    onChange={() => setTagName(name)}
                    className="shrink-0"
                  />
                  {prettifyTagName(name)}
                </span>
                <span className="pl-5 text-muted">{def.description}</span>
              </label>
            ))}

            {needsNewLoop && (
              <p className="rounded-lg px-2.5 py-2 text-[11px]" style={{ color: "var(--status-warning)" }}>
                This repeats once for every machine — added inside a new for-each-machine loop.
              </p>
            )}

            <label className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-hairline p-3 text-xs">
              <span className="text-secondary">Wrap in a new titled section</span>
              <input
                type="checkbox"
                checked={wrapInSection}
                onChange={(e) => setWrapInSection(e.target.checked)}
                className="shrink-0"
              />
            </label>

            {wrapInSection && (
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-secondary">Section heading</span>
                <input
                  type="text"
                  className={inputClass}
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                />
              </label>
            )}

            <button
              type="button"
              onClick={add}
              disabled={!definition}
              className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
