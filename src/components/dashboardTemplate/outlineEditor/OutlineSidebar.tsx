"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { IconChevronRight, IconDotsGrid, IconGrid, IconPlus, IconSettings, IconX } from "@/components/icons";
import {
  countBlocks,
  deleteChild,
  findNode,
  findNodeAndParent,
  isDescendant,
  moveChild,
  reorderSibling,
  type ContainerNode,
  type OutlineNode,
  type OutlineResult,
} from "@/lib/dashboardTemplate/outlineParser";
import { BlockSettingsForm } from "@/components/dashboardTemplate/outlineEditor/BlockSettingsForm";
import { AddBlockPicker } from "@/components/dashboardTemplate/outlineEditor/AddBlockPicker";
import { SectionSettingsForm } from "@/components/dashboardTemplate/outlineEditor/SectionSettingsForm";
import { AddSectionPicker } from "@/components/dashboardTemplate/outlineEditor/AddSectionPicker";
import type { TemplateView } from "@/lib/dashboardTemplate/useDashboardTemplateDraft";
import { useMessage } from "@/context/MessageProvider";
import { DEFAULT_MACHINE_TEMPLATES } from "@/lib/dashboardTemplate/defaultTemplates";

/** Built-in starting layouts a staff member can pick between for the "Machine:
 *  Overview" tab — plain content swaps (same mechanism as the editor's existing
 *  "Load default" action), not a real saved-template/variant system. "Super
 *  Dashboard" reuses the exact layout already used by the standalone Super
 *  Dashboard overlay (DEFAULT_MACHINE_TEMPLATES.super) rather than a new design. */
const OVERVIEW_TEMPLATE_CHOICES = [
  { key: "default", label: "Default template", source: DEFAULT_MACHINE_TEMPLATES.overview },
  { key: "superDashboard", label: "Super Dashboard template", source: DEFAULT_MACHINE_TEMPLATES.super },
] as const;
type OverviewTemplateChoice = (typeof OVERVIEW_TEMPLATE_CHOICES)[number]["key"];

interface OutlineSidebarProps {
  outline: OutlineResult;
  source: string;
  view: TemplateView;
  onChange: (next: string) => void;
}

interface DragRef {
  parentId: string;
  index: number;
}

/** Where a drop would land. `"reorder"` means "as a sibling, in `parentId`'s
 *  children, at `index`" — the same list-position semantics as before. `"nest"`
 *  means "as the last child of the container `parentId` itself refers to" — only
 *  ever produced by hovering dead-center on a container's own row. */
interface DropRef {
  parentId: string;
  index: number;
  mode: "reorder" | "nest";
}

const PLACEHOLDER_KEY = "__drop-placeholder__";

/** Top/bottom fraction of a row's own height that means "reorder as a sibling"
 *  rather than "nest inside" — see `zoneRefFor`. Wider than a naive 3-way even
 *  split (25/50/25): rows are only ~30px tall, so a narrow reorder band made it
 *  easy to overshoot into "nest" by accident and hard to land precisely — this
 *  gives reordering, the far more common gesture, the easier target. */
const EDGE_ZONE = 0.35;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * The reason this exists: locate a section/block, then either drag its six-dot handle
 * to move it, or click its name to edit its settings — see the dashboard-preview page
 * for how `outline`/`source` get here. Two mutually-exclusive screens (outline list vs.
 * one block's settings) share this single aside rather than adding a second panel —
 * there's no drawer/overlay precedent anywhere else in this app (see Sidebar.tsx).
 *
 * Drag-and-drop is native HTML5 DnD (no library). Dragging a row collapses it in
 * place (the browser's own drag ghost follows the cursor), and a dashed
 * placeholder — sized to match the dragged row — opens up in whichever list is
 * the current target, at the exact index it'll land at; hovering a container's
 * top/bottom edge reorders it as a sibling, hovering its center nests into it
 * (see `zoneRefFor`).
 *
 * Deliberately NOT animated beyond that (no sliding/FLIP transform on sibling
 * rows): hit-testing (`hitTestRow`) works by reading each row's live
 * `getBoundingClientRect()`, and a CSS `transform` changes exactly what that
 * returns — animating siblings out of the way with one turns hit-testing into a
 * moving target for the whole duration of the animation, which is what made
 * earlier versions of this feel unpredictable (fast sweeps re-triggered
 * animations faster than they could finish; the resulting mid-animation
 * geometry fed back into more, slightly-wrong, hit tests). The placeholder
 * itself still uses ordinary CSS layout (real `height`, not `transform`), so
 * everything's geometry is always exactly where it visually appears — instant,
 * but reliable.
 */
export function OutlineSidebar({ outline, source, view, onChange }: OutlineSidebarProps) {
  const { confirm } = useMessage();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [addingSectionParentId, setAddingSectionParentId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragRef | null>(null);
  const [dropTarget, setDropTarget] = useState<DropRef | null>(null);
  const [draggedHeight, setDraggedHeight] = useState<number | null>(null);

  // The single-line draggable handle of every currently-rendered row, keyed by
  // node id — non-overlapping regardless of nesting, so hit-testing by clientY
  // below can unambiguously find exactly one row. Deliberately just this, and
  // not also each row's full wrapper (row + expanded children): nothing here
  // needs to measure anything beyond the row's own line.
  const rowHandleElsRef = useRef<Map<string, HTMLElement>>(new Map());

  function registerRowHandleEl(id: string, el: HTMLElement | null) {
    if (el) rowHandleElsRef.current.set(id, el);
    else rowHandleElsRef.current.delete(id);
  }

  /** Finds whichever row's handle currently contains `clientY` — used instead of
   *  relying on the native drag event's own target, because once the placeholder
   *  (or the collapsed drag source) occupies the space under the cursor, it has no
   *  drag handlers of its own: the event would land there and never reach a row,
   *  silently breaking the drop. Doing our own geometric hit-test from ONE listener
   *  at the top of the whole list sidesteps that entirely. */
  function hitTestRow(clientY: number): { id: string; rect: DOMRect } | null {
    for (const [id, el] of rowHandleElsRef.current) {
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY < rect.bottom) return { id, rect };
    }
    return null;
  }

  const selectedNode = selectedId ? findNode(outline.root, selectedId) : null;

  // Which built-in choice the current source matches, if any — content-based (no
  // separate "which variant is active" field is stored anywhere), so it falls back
  // to "default" the moment the source is hand-edited away from either constant.
  const activeOverviewChoice: OverviewTemplateChoice | null =
    view === "overview"
      ? OVERVIEW_TEMPLATE_CHOICES.find((c) => c.source.trim() === source.trim())?.key ?? "default"
      : null;

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Classifies where in `node`'s own row the cursor is into a `DropRef`. A
   *  container's top/bottom `EDGE_ZONE` reorders it as a sibling (in its own
   *  parent); its middle nests into it. A leaf has no nest zone — the row's
   *  own half decides before/after. */
  function zoneRefFor(node: OutlineNode, parentId: string, index: number, fraction: number): DropRef {
    const isContainer = node.kind === "container" || node.kind === "repeater";
    if (isContainer) {
      if (fraction < EDGE_ZONE) return { parentId, index, mode: "reorder" };
      if (fraction > 1 - EDGE_ZONE) return { parentId, index: index + 1, mode: "reorder" };
      return { parentId: node.id, index: node.children.length, mode: "nest" };
    }
    return fraction < 0.5 ? { parentId, index, mode: "reorder" } : { parentId, index: index + 1, mode: "reorder" };
  }

  function draggedNodeId(): string | null {
    if (!dragging) return null;
    const parent =
      dragging.parentId === outline.root.id ? outline.root : (findNodeAndParent(outline.root, dragging.parentId)?.node as ContainerNode | undefined);
    return parent?.children[dragging.index]?.id ?? null;
  }

  function handleDrop(targetParentId: string, targetIndex: number) {
    if (dragging) {
      const nodeId = draggedNodeId();
      const isValidTarget = !(nodeId && isDescendant(outline.root, nodeId, targetParentId));
      if (isValidTarget) {
        if (dragging.parentId === targetParentId) {
          if (dragging.index !== targetIndex) {
            onChange(reorderSibling(source, outline.root, targetParentId, dragging.index, targetIndex));
          }
        } else {
          onChange(moveChild(source, outline.root, dragging.parentId, dragging.index, targetParentId, targetIndex));
        }
      }
    }
    setDragging(null);
    setDropTarget(null);
    setDraggedHeight(null);
  }

  /** Computes the live `DropRef` for `clientY`, or `null` if nothing valid is
   *  under it (no row there, or it's the dragged node's own subtree). Shared by
   *  drag-over (to drive the visual gap/highlight) and drop (see below for why
   *  drop needs its own fresh computation rather than trusting that state). */
  function computeDropRef(clientY: number): DropRef | null {
    const hit = hitTestRow(clientY);
    if (!hit) return null;
    const found = findNodeAndParent(outline.root, hit.id);
    if (!found) return null;
    const fraction = (clientY - hit.rect.top) / hit.rect.height;
    const ref = zoneRefFor(found.node, found.parent.id, found.index, fraction);
    const nodeId = draggedNodeId();
    if (nodeId && isDescendant(outline.root, nodeId, ref.parentId)) return null;
    return ref;
  }

  /** The single dragover listener for the entire row list (see `hitTestRow`).
   *  `preventDefault` is called unconditionally, whenever a drag is in progress and
   *  the cursor is anywhere over the list — not just when a row is actually hit —
   *  so the browser keeps allowing a drop even while the cursor sits over the
   *  placeholder/collapsed-source gap between two hits; `dropTarget` itself only
   *  updates on an actual hit, otherwise it stays frozen at its last valid value.
   *  Updates immediately, no debounce — see the class doc comment for why that's
   *  safe here (nothing about showing a new target is expensive or animated). */
  function handleListDragOver(e: DragEvent) {
    if (!dragging) return;
    e.preventDefault();
    const ref = computeDropRef(e.clientY);
    if (!ref) return;
    setDropTarget((prev) =>
      prev && prev.parentId === ref.parentId && prev.index === ref.index && prev.mode === ref.mode ? prev : ref
    );
  }

  /** Browsers throttle `dragover` — it can lag several frames behind the cursor's
   *  actual position, so `dropTarget` (last updated by whichever `dragover` most
   *  recently got processed) can be a beat stale by the time the mouse is
   *  released, especially for a fast drag-and-release gesture. The `drop` event
   *  itself always carries the true final coordinates, though, so recomputing the
   *  target from `e.clientY` here — instead of trusting the possibly-stale
   *  `dropTarget` state — is what makes the drop always land where the cursor
   *  actually was, not one dragover-tick behind it. Falls back to the last known
   *  `dropTarget` only if this exact point misses (e.g. the drop lands in the
   *  gap right at a row boundary). */
  function handleListDrop(e: DragEvent) {
    e.preventDefault();
    const ref = computeDropRef(e.clientY) ?? dropTarget;
    if (ref) handleDrop(ref.parentId, ref.index);
  }

  async function handleDelete(parentId: string, index: number, node: OutlineNode) {
    const isContainerNode = node.kind === "container" || node.kind === "repeater";
    const count = countBlocks(node);
    const message = isContainerNode
      ? `Delete "${node.label}"? This also removes ${count} block${count === 1 ? "" : "s"} inside it.`
      : `Delete "${node.label}"?`;
    const confirmed = await confirm({ title: "Delete block", message, confirmLabel: "Delete", danger: true });
    if (!confirmed) return;
    if (selectedId === node.id) setSelectedId(null);
    onChange(deleteChild(source, outline.root, parentId, index));
  }

  /** Renders `children` as rows, splicing in the dashed drop placeholder at the
   *  right index when this exact list (`parentId`) is the live reorder target —
   *  shared by the root-level render and every container's own children, so both
   *  get the placeholder treatment identically. */
  function renderChildren(children: OutlineNode[], parentId: string, depth: number): ReactNode[] {
    const rows: ReactNode[] = children.map((child, i) => renderRow(child, parentId, i, depth));
    if (dragging && dropTarget?.mode === "reorder" && dropTarget.parentId === parentId && draggedHeight !== null) {
      const insertAt = clamp(dropTarget.index, 0, rows.length);
      rows.splice(
        insertAt,
        0,
        <div
          key={PLACEHOLDER_KEY}
          style={{ height: draggedHeight, paddingLeft: `${depth * 14 + 8}px` }}
          className="my-0.5 shrink-0 rounded-lg border-2 border-dashed border-accent/40 bg-accent/5"
        />
      );
    }
    return rows;
  }

  function renderRow(node: OutlineNode, parentId: string, index: number, depth: number) {
    const isContainer = node.kind === "container" || node.kind === "repeater";
    const isSection = node.kind === "container" && node.explicit;
    const isOpen = !collapsed.has(node.id);
    const isDragging = dragging?.parentId === parentId && dragging.index === index;
    const isNestTarget = dropTarget?.mode === "nest" && dropTarget.parentId === node.id;

    return (
      <div key={node.id}>
        <div
          ref={(el) => registerRowHandleEl(node.id, el)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            const wrapper = e.currentTarget.parentElement;
            setDraggedHeight(wrapper ? wrapper.getBoundingClientRect().height : null);
            setDragging({ parentId, index });
          }}
          onDragEnd={() => {
            setDragging(null);
            setDropTarget(null);
            setDraggedHeight(null);
          }}
          onMouseEnter={() => setHoveredId(node.id)}
          onMouseLeave={() => setHoveredId((id) => (id === node.id ? null : id))}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center gap-1.5 rounded-lg pr-2 text-xs transition-all duration-150 ${
            isDragging ? "max-h-0 overflow-hidden py-0 opacity-0" : "max-h-10 py-1.5"
          } ${isNestTarget ? "bg-surface-2 ring-1 ring-inset ring-accent" : "hover:bg-surface-2"}`}
        >
          <span className="shrink-0 cursor-grab text-muted active:cursor-grabbing" title="Drag to reorder or move">
            <IconDotsGrid className="h-3.5 w-3.5" />
          </span>

          {isContainer ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-secondary hover:text-primary"
            >
              <IconChevronRight className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              <span className="truncate font-medium">{node.label}</span>
            </button>
          ) : node.kind === "element" ? (
            <button
              type="button"
              onClick={() => setSelectedId(node.id)}
              className="min-w-0 flex-1 truncate text-left text-secondary hover:text-accent hover:underline"
            >
              {node.label}
            </button>
          ) : (
            <span className="min-w-0 flex-1 truncate italic text-muted">{node.label}</span>
          )}

          {isSection && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(node.id);
              }}
              title="Section settings"
              className="shrink-0 rounded-md p-0.5 text-muted hover:bg-surface hover:text-accent"
            >
              <IconSettings className="h-3.5 w-3.5" />
            </button>
          )}

          {isContainer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAddingSectionParentId(node.id);
              }}
              title="Add a section here"
              className="shrink-0 rounded-md p-0.5 text-muted hover:bg-surface hover:text-accent"
            >
              <IconGrid className="h-3.5 w-3.5" />
            </button>
          )}

          {isContainer && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAddingParentId(node.id);
              }}
              title="Add a block to this section"
              className="shrink-0 rounded-md p-0.5 text-muted hover:bg-surface hover:text-accent"
            >
              <IconPlus className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(parentId, index, node);
            }}
            title={isContainer ? "Delete this section" : "Delete this block"}
            className="delete-row-btn shrink-0 rounded-md p-0.5 text-muted hover:bg-surface"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>

        {isContainer && isOpen && (
          <div>
            {(() => {
              const rows = renderChildren((node as ContainerNode).children, node.id, depth + 1);
              return rows.length === 0 && isSection ? (
                <p
                  className="truncate py-1 text-[11px] italic text-muted"
                  style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
                >
                  Empty — drag a block onto this section
                </p>
              ) : (
                rows
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-r border-hairline bg-surface">
      {addingParentId ? (
        <AddBlockPicker
          parentId={addingParentId}
          root={outline.root}
          view={view}
          source={source}
          onChange={onChange}
          onDone={(newId) => {
            setAddingParentId(null);
            setSelectedId(newId);
          }}
          onBack={() => setAddingParentId(null)}
        />
      ) : addingSectionParentId ? (
        <AddSectionPicker
          parentId={addingSectionParentId}
          root={outline.root}
          source={source}
          onChange={onChange}
          onDone={(newId) => {
            setAddingSectionParentId(null);
            setSelectedId(newId);
          }}
          onBack={() => setAddingSectionParentId(null)}
        />
      ) : selectedNode && selectedNode.kind === "element" ? (
        <BlockSettingsForm
          key={selectedNode.id}
          block={selectedNode}
          source={source}
          onChange={onChange}
          onBack={() => setSelectedId(null)}
          onDelete={async () => {
            const found = findNodeAndParent(outline.root, selectedNode.id);
            if (!found) return;
            const confirmed = await confirm({
              title: "Delete block",
              message: `Delete "${selectedNode.label}"?`,
              confirmLabel: "Delete",
              danger: true,
            });
            if (!confirmed) return;
            setSelectedId(null);
            onChange(deleteChild(source, outline.root, found.parent.id, found.index));
          }}
        />
      ) : selectedNode && selectedNode.kind === "container" && selectedNode.explicit ? (
        <SectionSettingsForm
          key={selectedNode.id}
          section={selectedNode}
          source={source}
          onChange={onChange}
          onBack={() => setSelectedId(null)}
          onDelete={async () => {
            const found = findNodeAndParent(outline.root, selectedNode.id);
            if (!found) return;
            const count = countBlocks(selectedNode);
            const confirmed = await confirm({
              title: "Delete section",
              message: `Delete "${selectedNode.label}"? This also removes ${count} block${count === 1 ? "" : "s"} inside it.`,
              confirmLabel: "Delete",
              danger: true,
            });
            if (!confirmed) return;
            setSelectedId(null);
            onChange(deleteChild(source, outline.root, found.parent.id, found.index));
          }}
        />
      ) : outline.ok ? (
        <>
          <div className="shrink-0 border-b border-hairline px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Sections &amp; blocks
          </div>
          {activeOverviewChoice && (
            <div className="flex shrink-0 items-center gap-2 border-b border-hairline px-3 py-2.5">
              <label htmlFor="overview-template-choice" className="text-xs font-medium text-secondary">
                Template
              </label>
              <select
                id="overview-template-choice"
                value={activeOverviewChoice}
                onChange={(e) => {
                  const choice = OVERVIEW_TEMPLATE_CHOICES.find((c) => c.key === e.target.value);
                  if (choice) onChange(choice.source);
                }}
                className="flex-1 rounded-lg border border-hairline bg-surface px-2 py-1.5 text-xs text-primary outline-none focus:border-accent"
              >
                {OVERVIEW_TEMPLATE_CHOICES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex-1 overflow-y-auto py-2" onDragOver={handleListDragOver} onDrop={handleListDrop}>
            {outline.root.children.length === 0 ? (
              <div className="flex flex-col items-start gap-2 px-3 py-2 text-xs text-muted">
                <p>No blocks in this template yet.</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAddingParentId(outline.root.id)}
                    className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-secondary hover:bg-surface-2 hover:text-primary"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                    Add a block
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingSectionParentId(outline.root.id)}
                    className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1 text-secondary hover:bg-surface-2 hover:text-primary"
                  >
                    <IconGrid className="h-3.5 w-3.5" />
                    Add a section
                  </button>
                </div>
              </div>
            ) : (
              renderChildren(outline.root.children, outline.root.id, 0)
            )}
          </div>
          <style>{`.delete-row-btn:hover { color: var(--status-critical); }`}</style>
          {hoveredId && (
            <style>{`[data-gbotz-outline-id="${hoveredId}"] { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 6px; }`}</style>
          )}
        </>
      ) : (
        <div className="p-3 text-xs text-muted">
          Visual editing unavailable for this template — edit it in the{" "}
          <span className="font-medium text-primary">Code editor</span> instead.
          {outline.error && <p className="mt-2 text-[11px] text-muted">({outline.error})</p>}
        </div>
      )}
    </aside>
  );
}
