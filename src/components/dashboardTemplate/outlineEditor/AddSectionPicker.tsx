"use client";

import { useState } from "react";
import { IconChevronRight } from "@/components/icons";
import {
  DEFAULT_SECTION_LAYOUT,
  buildEmptySectionCard,
  insertChild,
  parseOutline,
  type ContainerNode,
  type SectionLayout,
} from "@/lib/dashboardTemplate/outlineParser";

const inputClass =
  "rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent";

interface AddSectionPickerProps {
  parentId: string;
  root: ContainerNode;
  source: string;
  onChange: (next: string) => void;
  /** Called with the newly-inserted section's id, once it's confirmed present in the
   *  re-parsed source — lets the sidebar jump straight into its settings. */
  onDone: (newNodeId: string) => void;
  onBack: () => void;
}

/**
 * Sibling to AddBlockPicker, for creating an empty section on its own rather than
 * only ever getting one implicitly by wrapping a block. Always produces an
 * `explicit` container (see outlineParser's `buildEmptySectionCard`) so it survives
 * being empty and stays a valid drag-and-drop target until a block lands in it.
 */
export function AddSectionPicker({ parentId, root, source, onChange, onDone, onBack }: AddSectionPickerProps) {
  const [heading, setHeading] = useState("New section");
  const [layout, setLayout] = useState<SectionLayout>(DEFAULT_SECTION_LAYOUT);

  function add() {
    const childText = buildEmptySectionCard(heading.trim() || "New section", layout);
    const { source: nextSource, insertedAt } = insertChild(source, root, parentId, childText);
    if (insertedAt < 0) return; // parentId didn't resolve to a container — nothing to do
    onChange(nextSource);

    const reparsed = parseOutline(nextSource);
    if (!reparsed.ok) return; // shouldn't happen — insertChild only ever grows a childrenSpan
    const newNode = findSectionByOpenTagStart(reparsed.root, insertedAt);
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
        <p className="mb-3 text-sm font-semibold text-primary">Add a section</p>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-secondary">Heading</span>
            <input type="text" className={inputClass} value={heading} onChange={(e) => setHeading(e.target.value)} />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="text-secondary">Layout</span>
            <select
              className={inputClass}
              value={layout.mode}
              onChange={(e) => setLayout({ ...layout, mode: e.target.value as SectionLayout["mode"] })}
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
                  if (!Number.isNaN(columns)) setLayout({ ...layout, columns: Math.min(6, Math.max(1, columns)) });
                }}
              />
            </label>
          )}

          <button
            type="button"
            onClick={add}
            className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/** Finds the ContainerNode whose opening `<div ...>` starts at exactly `openTagStart`
 *  — the section counterpart to outlineParser's `findElementByTagStart`, used to
 *  locate a section just inserted by `insertChild` (see its doc comment for why
 *  offset, not id). */
function findSectionByOpenTagStart(root: ContainerNode, openTagStart: number): ContainerNode | null {
  for (const child of root.children) {
    if (child.kind === "container" && child.openTagStart === openTagStart) return child;
    if ((child.kind === "container" || child.kind === "repeater") && child.children.length) {
      const found = findSectionByOpenTagStart(child, openTagStart);
      if (found) return found;
    }
  }
  return null;
}
