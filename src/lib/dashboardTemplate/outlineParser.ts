import { ELEMENT_REGISTRY } from "@/lib/dashboardTemplate/elementRegistry";

/**
 * Turns the raw (pre-Liquid) template source into a draggable/editable outline, and
 * back again. This is deliberately NOT a full HTML/Liquid parser — it's a best-effort
 * scanner over a small, curated templating DSL (see defaultTemplates.ts for the shape
 * of every template this needs to handle). It never guesses when nesting doesn't add
 * up: `ok: false` means the caller falls back to raw-source-only editing, so a
 * malformed template can never be silently corrupted by a drag or a settings edit.
 *
 * The key trick that makes reordering safe: every sibling's `start` is redefined to
 * include the whitespace/text since the previous sibling ended (or since the parent's
 * content began, for the first child). That makes a parent's children a set of
 * contiguous, gapless string chunks spanning exactly `childrenSpan` — so permuting
 * that chunk array and rejoining it always reconstructs valid, lossless source.
 *
 * One accepted simplification: non-block "filler" content (e.g. a purely decorative
 * wrapper div with no element tags inside) isn't itself a node, so it becomes trailing
 * glue absorbed by whichever kept sibling precedes it — dragging that sibling carries
 * the filler along. This never occurs in any of the shipped default templates (every
 * container either wraps exactly one block, or wraps only other blocks/sections), so
 * it's a documented edge case rather than something worth a second sibling-tracking
 * pass for.
 */

export interface OutlineChildSpan {
  start: number;
  end: number;
}

interface OutlineNodeBase {
  id: string;
  /** Chunk start — includes leading glue since the previous sibling. */
  start: number;
  /** End of this node's own content (not including trailing glue). */
  end: number;
}

export interface ElementBlockNode extends OutlineNodeBase {
  kind: "element";
  tagName: string;
  /** Raw hash text between the tag name and the closing `%}`. */
  argsRaw: string;
  label: string;
  /** Start of the `{%` itself — unlike `start`, excludes leading glue. */
  tagStart: number;
  /** End of the `%}` itself — unlike `end`, unaffected by singleton-wrapper
   *  collapsing (see the "html" close-tag handling in parseOutline), which widens
   *  `start`/`end` to the collapsed wrapper's own span so the outline shows one row
   *  per real block instead of a redundant nesting level for a "section" that only
   *  ever wrapped that one block. updateBlockArgs must use this, not `end`. */
  tagEnd: number;
}

export interface ConditionalNode extends OutlineNodeBase {
  kind: "conditional";
  label: string;
}

export interface ContainerNode extends OutlineNodeBase {
  kind: "container" | "repeater";
  tagName: string;
  label: string;
  childrenSpan: OutlineChildSpan;
  children: OutlineNode[];
  /** Raw attribute text of the opening tag (e.g. `class="..." data-gbotz-section="1"`)
   *  — only meaningful for `kind: "container"`; a `repeater`'s "tag" is a Liquid
   *  `{% for %}`, which has no attributes to read or rewrite. */
  attrsRaw: string;
  /** Absolute offsets bracketing the opening `<div ...>` itself — lets
   *  `updateSectionAttrs` reserialize just that one tag, the same way
   *  `ElementBlockNode.tagStart/tagEnd` let `updateBlockArgs` reserialize one element
   *  tag. `-1` for a `repeater` (no such span exists). */
  openTagStart: number;
  openTagEnd: number;
  /** True only for a container stamped with the `data-gbotz-section` marker this
   *  editor writes on every section it creates (see `buildEmptySectionCard`) — lets
   *  the outline tell a deliberate, user-created section apart from an incidental
   *  layout wrapper div that happens to hold multiple blocks, which the outline
   *  represents as a container too but was never meant to be edited/dragged into as
   *  a "section" in its own right. */
  explicit: boolean;
  /** Absolute offsets of this container's own heading text (between its `<h2>` and
   *  `</h2>`, whether the heading sits directly inside this container or bubbled up
   *  from a discarded 0-child title wrapper) — `null` if it has none. Lets
   *  `updateSectionAttrs` rewrite the heading in place. */
  headingTextStart: number | null;
  headingTextEnd: number | null;
}

export type OutlineNode = ElementBlockNode | ConditionalNode | ContainerNode;

export interface OutlineResult {
  ok: boolean;
  error?: string;
  /** Synthetic root — its `children` are the top-level outline rows. */
  root: ContainerNode;
  /** Source with `data-gbotz-outline-id` markers injected, for hover-to-locate. */
  annotatedSource: string;
}

const VOID_TAGS = new Set(["img", "br", "hr", "input", "meta", "link"]);
const HEADING_TAGS = new Set(["h1", "h2", "h3"]);

/** Marker attribute this editor stamps on every section it creates through
 *  `buildEmptySectionCard` — see `ContainerNode.explicit`. */
const SECTION_MARKER_RE = /\bdata-gbotz-section\s*=\s*"1"/;
function hasSectionMarker(attrsRaw: string): boolean {
  return SECTION_MARKER_RE.test(attrsRaw);
}

const TOKEN_RE =
  /<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)([^>]*?)(\/?)>|\{%-?\s*([a-zA-Z_]\w*)([\s\S]*?)-?%\}/g;

interface Frame {
  kind: "root" | "html" | "repeater" | "heading";
  tagName: string;
  openTagStart: number;
  openTagEnd: number;
  /** Raw attribute text of this frame's own opening tag — "" for kinds that don't
   *  come from an HTML open tag (root, repeater, heading). */
  attrsRaw: string;
  children: OutlineNode[];
  lastEnd: number;
  headingText: string | null;
  /** Offsets of `headingText` itself, for rewriting it in place later. */
  headingTextStart: number | null;
  headingTextEnd: number | null;
  /** End of whatever markup produced `headingText` (a heading tag's own `</hN>`, or
   *  a bubbled-up wrapper's own closing tag) — used as the children-span start for a
   *  container that ends up with zero real children, so a block dropped into a
   *  freshly-created empty-but-titled section lands after its heading instead of
   *  before it (nothing else advances `lastEnd` until a real child is added). */
  headingMarkupEnd: number | null;
  textBuf: string;
}

let uid = 0;
function nextId(): string {
  return `n${uid++}`;
}

function addChild(frame: Frame, node: OutlineNode, ownEnd: number) {
  node.start = frame.lastEnd;
  node.end = ownEnd;
  frame.children.push(node);
  frame.lastEnd = ownEnd;
}

function findMatchingEndif(source: string, fromIndex: number): number | null {
  const RE = /\{%-?\s*(if|endif)\b[\s\S]*?-?%\}/g;
  RE.lastIndex = fromIndex;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(source))) {
    if (m[1] === "if") depth++;
    else {
      depth--;
      if (depth === 0) return RE.lastIndex;
    }
  }
  return null;
}

/** Best-effort extraction of `key: value` pairs, for labels and for prefilling the
 *  settings form — not a real Liquid expression parser, just enough to read literals
 *  back out of hash args we ourselves generate. */
export function parseArgsHash(argsRaw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const RE = /([a-zA-Z_]\w*)\s*:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^\s,]+))/g;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(argsRaw))) {
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    out[m[1]!] = value.replace(/\\(["'])/g, "$1");
  }
  return out;
}

function describeBlock(tagName: string, argsRaw: string): string {
  const hash = parseArgsHash(argsRaw);
  switch (tagName) {
    case "stat_card":
      return hash.label || hash.field || "Stat card";
    case "trend_chart":
      return hash.label || hash.labels || hash.field || hash.fields || "Trend chart";
    case "fault_gauge":
      return hash.faultCode ? `Fault gauge (${hash.faultCode})` : "Fault gauge";
    case "status_badge":
      return "Status badge";
    case "machine_card":
      return "Machine card";
    case "fleet_stat":
      return hash.label || "Fleet stat";
    case "fleet_bubble_chart":
      return hash.title || "Fleet health map";
    case "scatter_chart":
      return hash.xLabel && hash.yLabel ? `${hash.yLabel} vs ${hash.xLabel}` : "Scatter chart";
    case "spectrum_chart":
      return hash.source === "acoustic" ? "Acoustic spectrum" : "Vibration spectrum";
    case "fault_gauge_grid":
      return "Fault gauge grid";
    case "fault_confidence_trend":
      return "Fault confidence trend";
    case "sensor_health":
      return "Sensor health";
    default:
      return ELEMENT_REGISTRY[tagName]?.description ?? tagName.replace(/_/g, " ");
  }
}

export function parseOutline(source: string): OutlineResult {
  uid = 0;
  const root: Frame = {
    kind: "root",
    tagName: "",
    openTagStart: 0,
    openTagEnd: 0,
    attrsRaw: "",
    children: [],
    lastEnd: 0,
    headingText: null,
    headingTextStart: null,
    headingTextEnd: null,
    headingMarkupEnd: null,
    textBuf: "",
  };
  const stack: Frame[] = [root];
  let ok = true;
  let error: string | undefined;
  let cursor = 0;

  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  outer: while ((m = TOKEN_RE.exec(source))) {
    const start = m.index;
    const textRun = source.slice(cursor, start);
    const top = stack[stack.length - 1]!;
    if (top.kind === "heading") top.textBuf += textRun;

    const [full, closeName, openName, attrsRaw, selfClose, liquidName, liquidArgs] = m;
    const end = start + full!.length;
    cursor = end;

    if (closeName) {
      const lower = closeName.toLowerCase();
      if (top.kind === "heading") {
        if (lower !== top.tagName) {
          ok = false;
          error = `Mismatched closing tag </${closeName}>`;
          break outer;
        }
        stack.pop();
        const parent = stack[stack.length - 1]!;
        const text = top.textBuf.trim();
        if (text && !parent.headingText) {
          parent.headingText = text;
          parent.headingTextStart = top.openTagEnd;
          parent.headingTextEnd = start;
          parent.headingMarkupEnd = end;
          // A container's own heading must never be treated as glue that gets
          // absorbed into whichever real child follows it — addChild would
          // otherwise widen that child's own `start` back to include it (the same
          // mechanism that, intentionally, lets a single hoisted block adopt its
          // wrapper's heading as its own label). For a container with ITS OWN
          // heading and more than one real child, that absorption is a bug, not a
          // feature: reordering/moving/deleting whichever child happened to land
          // right after the heading would silently carry the container's own title
          // away with it, or delete it — see the "else" branch below, which relies
          // on `lastEnd` already sitting past the heading by the time the first
          // real child is added. Advancing it here, unconditionally, is what makes
          // that possible for every container, not just ones stamped as sections.
          parent.lastEnd = end;
        }
        continue;
      }
      if (top.kind === "html") {
        if (lower !== top.tagName) {
          ok = false;
          error = `Mismatched closing tag: expected </${top.tagName}>, found </${closeName}>`;
          break outer;
        }
        stack.pop();
        const parent = stack[stack.length - 1]!;
        // A container the user deliberately created as a section (stamped with
        // data-gbotz-section) must always surface as its own outline row — even with
        // zero or one children — so it stays a valid drag/drop target and doesn't
        // vanish the moment it's created empty. Everything else keeps the original
        // collapsing behavior untouched.
        const explicit = hasSectionMarker(top.attrsRaw);
        if (top.children.length === 0 && !explicit) {
          // Discarded (no kept descendants) — its heading would otherwise be lost, so
          // hand it up to the parent, which might end up being the one that's kept.
          if (top.headingText && !parent.headingText) {
            parent.headingText = top.headingText;
            parent.headingTextStart = top.headingTextStart;
            parent.headingTextEnd = top.headingTextEnd;
            parent.headingMarkupEnd = end;
            // Same reasoning as the direct-heading case above — the wrapper this
            // heading bubbled up from must not be swallowed by whichever real child
            // of `parent` comes next.
            parent.lastEnd = end;
          }
        } else if (top.children.length === 1 && !explicit) {
          // A wrapper that contributes nothing but a heading/layout around exactly one
          // real block is never useful as its own outline row — there's nothing to
          // reorder within a group of one, and showing it anyway is what made a title
          // bar that's visually a *row* (e.g. a heading next to a status_badge) look
          // like it nested the badge in its own *column* one level deeper than the
          // fault_gauge_grid sitting right beside it. Hoist the one child up to take
          // the wrapper's place directly (adopting the wrapper's own outer span, so
          // reordering a sibling later still splices the whole wrapper, not just the
          // block's own narrower tag), and prefer the wrapper's heading as its label.
          const only = top.children[0]!;
          only.label = top.headingText ?? only.label;
          addChild(parent, only, end);
        } else {
          // childrenSpan starts right after the container's own heading, if it has
          // one (see the `lastEnd` advancement above), or right after its opening
          // tag otherwise. Using `headingMarkupEnd` here — not `openTagEnd` — is
          // what keeps a container's own title from being silently reparented onto
          // whichever child happens to sit first: that child's own widened `start`
          // (see addChild) already begins at the same point, since nothing advances
          // `lastEnd` until after the heading is accounted for.
          const childrenStart = top.headingMarkupEnd ?? top.openTagEnd;
          const node: ContainerNode = {
            id: nextId(),
            kind: "container",
            tagName: top.tagName,
            label: top.headingText ?? "Section",
            start: 0,
            end: 0,
            childrenSpan: { start: childrenStart, end: top.lastEnd },
            children: top.children,
            attrsRaw: top.attrsRaw,
            openTagStart: top.openTagStart,
            openTagEnd: top.openTagEnd,
            explicit,
            headingTextStart: top.headingTextStart,
            headingTextEnd: top.headingTextEnd,
          };
          addChild(parent, node, end);
        }
        continue;
      }
      ok = false;
      error = `Unexpected closing tag </${closeName}>`;
      break outer;
    }

    if (openName) {
      const lower = openName.toLowerCase();
      if (selfClose === "/" || VOID_TAGS.has(lower)) continue; // glue, not tracked
      if (HEADING_TAGS.has(lower)) {
        stack.push({
          kind: "heading",
          tagName: lower,
          openTagStart: start,
          openTagEnd: end,
          attrsRaw: "",
          children: [],
          lastEnd: end,
          headingText: null,
          headingTextStart: null,
          headingTextEnd: null,
          headingMarkupEnd: null,
          textBuf: "",
        });
        continue;
      }
      stack.push({
        kind: "html",
        tagName: lower,
        openTagStart: start,
        openTagEnd: end,
        attrsRaw: attrsRaw ?? "",
        children: [],
        lastEnd: end,
        headingText: null,
        headingTextStart: null,
        headingTextEnd: null,
        headingMarkupEnd: null,
        textBuf: "",
      });
      continue;
    }

    // Liquid tag
    const name = liquidName!;
    if (name === "for") {
      stack.push({
        kind: "repeater",
        tagName: liquidArgs!.trim(),
        openTagStart: start,
        openTagEnd: end,
        attrsRaw: "",
        children: [],
        lastEnd: end,
        headingText: null,
        headingTextStart: null,
        headingTextEnd: null,
        headingMarkupEnd: null,
        textBuf: "",
      });
      continue;
    }
    if (name === "endfor") {
      if (top.kind !== "repeater") {
        ok = false;
        error = "Unexpected {% endfor %} without matching {% for %}";
        break outer;
      }
      stack.pop();
      const parent = stack[stack.length - 1]!;
      if (top.children.length > 0) {
        const node: ContainerNode = {
          id: nextId(),
          kind: "repeater",
          tagName: top.tagName,
          label: `Repeats for each ${top.tagName.split(/\s+in\s+/)[0] || "item"}`,
          start: 0,
          end: 0,
          childrenSpan: { start: top.openTagEnd, end: top.lastEnd },
          children: top.children,
          // A repeater's "tag" is a Liquid {% for %}, not an HTML element — it has no
          // attributes/class to read or rewrite, and is never a section a user can
          // style, so these are inert placeholders rather than real spans.
          attrsRaw: "",
          openTagStart: -1,
          openTagEnd: top.openTagEnd,
          explicit: false,
          headingTextStart: null,
          headingTextEnd: null,
        };
        addChild(parent, node, end);
      }
      continue;
    }
    if (name === "if") {
      const matchEnd = findMatchingEndif(source, end);
      if (matchEnd === null) {
        ok = false;
        error = "Unmatched {% if %}";
        break outer;
      }
      const node: ConditionalNode = {
        id: nextId(),
        kind: "conditional",
        label: `If: ${liquidArgs!.trim()}`,
        start: 0,
        end: 0,
      };
      addChild(top, node, matchEnd);
      TOKEN_RE.lastIndex = matchEnd;
      cursor = matchEnd;
      continue;
    }
    if (name === "endif" || name === "elsif" || name === "else") {
      ok = false;
      error = `Unexpected {% ${name} %} without matching {% if %}`;
      break outer;
    }
    if (name in ELEMENT_REGISTRY) {
      const node: ElementBlockNode = {
        id: nextId(),
        kind: "element",
        tagName: name,
        argsRaw: liquidArgs ?? "",
        label: describeBlock(name, liquidArgs ?? ""),
        tagStart: start,
        tagEnd: end,
        start: 0,
        end: 0,
      };
      addChild(top, node, end);
      continue;
    }
    // Unknown/other Liquid tag (assign, capture, comment, ...) — inert glue.
  }

  if (ok && stack.length !== 1) {
    ok = false;
    error = `Unclosed tag: <${stack[stack.length - 1]!.tagName}>`;
  }

  const rootNode: ContainerNode = {
    id: "root",
    kind: "container",
    tagName: "root",
    label: "Page",
    start: 0,
    end: source.length,
    childrenSpan: { start: 0, end: root.lastEnd },
    children: root.children,
    attrsRaw: "",
    openTagStart: 0,
    openTagEnd: 0,
    explicit: false,
    headingTextStart: null,
    headingTextEnd: null,
  };

  return { ok, error, root: rootNode, annotatedSource: ok ? annotateSource(source, rootNode) : source };
}

/**
 * `end` of one node commonly equals `start` of its next sibling (that's the whole
 * "contiguous chunks" trick reordering relies on) — so open/close insertions collide
 * at the exact same offset constantly, e.g. between any two adjacent leaf blocks in
 * the same row. Applying same-position insertions via repeated fixed-offset splicing
 * reverses their relative order (each new splice at an already-used offset lands to
 * the *left* of the previous one) — so processing "close" before "open" at a tie, as
 * a naive single-key sort does, prints `<span></span>` back to back instead of
 * `</span><span>`, corrupting the boundary between the two blocks. Ties must put
 * "open" first so the reversal puts "close" first in the actual output.
 */
type Insertion = { pos: number; text: string; order: number };

function annotateSource(source: string, root: ContainerNode): string {
  const insertions: Insertion[] = [];

  function walk(node: OutlineNode) {
    if (node.kind === "container") {
      if (node.id !== "root") {
        insertions.push({ pos: node.childrenSpan.start - 1, text: ` data-gbotz-outline-id="${node.id}"`, order: 0 });
      }
      for (const child of node.children) walk(child);
      return;
    }
    if (node.kind === "repeater") {
      insertions.push({ pos: node.start, text: `<span data-gbotz-outline-id="${node.id}">`, order: 0 });
      insertions.push({ pos: node.end, text: `</span>`, order: 1 });
      for (const child of node.children) walk(child);
      return;
    }
    insertions.push({ pos: node.start, text: `<span data-gbotz-outline-id="${node.id}">`, order: 0 });
    insertions.push({ pos: node.end, text: `</span>`, order: 1 });
  }
  walk(root);

  insertions.sort((a, b) => (b.pos !== a.pos ? b.pos - a.pos : a.order - b.order));
  let result = source;
  for (const { pos, text } of insertions) {
    result = result.slice(0, pos) + text + result.slice(pos);
  }
  return result;
}

export function findNodeAndParent(
  root: ContainerNode,
  id: string
): { node: OutlineNode; parent: ContainerNode; index: number } | null {
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i]!;
    if (child.id === id) return { node: child, parent: root, index: i };
    if (child.kind === "container" || child.kind === "repeater") {
      const found = findNodeAndParent(child, id);
      if (found) return found;
    }
  }
  return null;
}

export function findNode(root: ContainerNode, id: string): OutlineNode | null {
  if (root.id === id) return root;
  return findNodeAndParent(root, id)?.node ?? null;
}

/** Reorders one child within `parentId`'s children (siblings only — no cross-parent
 *  moves). Lossless: children chunks partition `childrenSpan` exactly, so any
 *  permutation rejoins into valid source. */
export function reorderSibling(source: string, root: ContainerNode, parentId: string, fromIndex: number, toIndex: number): string {
  const parent = parentId === root.id ? root : (findNodeAndParent(root, parentId)?.node as ContainerNode | undefined);
  if (!parent || (parent.kind !== "container" && parent.kind !== "repeater")) return source;
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= parent.children.length) return source;

  const chunks = parent.children.map((c) => source.slice(c.start, c.end));
  const [moved] = chunks.splice(fromIndex, 1);
  chunks.splice(toIndex, 0, moved!);
  const newInner = chunks.join("");
  return source.slice(0, parent.childrenSpan.start) + newInner + source.slice(parent.childrenSpan.end);
}

/** Removes one child from `parentId`'s children entirely — the mirror image of
 *  `insertChild`. Same lossless-chunk mechanism as `reorderSibling`, just with the
 *  removed chunk dropped instead of moved. */
export function deleteChild(source: string, root: ContainerNode, parentId: string, index: number): string {
  const parent = parentId === root.id ? root : (findNodeAndParent(root, parentId)?.node as ContainerNode | undefined);
  if (!parent || (parent.kind !== "container" && parent.kind !== "repeater")) return source;
  if (index < 0 || index >= parent.children.length) return source;

  const chunks = parent.children.map((c) => source.slice(c.start, c.end));
  chunks.splice(index, 1);
  const newInner = chunks.join("");
  return source.slice(0, parent.childrenSpan.start) + newInner + source.slice(parent.childrenSpan.end);
}

function findContainerById(root: ContainerNode, id: string): ContainerNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    if (child.kind === "container" || child.kind === "repeater") {
      const found = findContainerById(child, id);
      if (found) return found;
    }
  }
  return null;
}

/** True if `nodeId` is `ancestorId` itself, or sits anywhere inside its subtree —
 *  used to reject a drag-and-drop move that would drop a node into itself or one of
 *  its own descendants (most concretely: dragging a section into a section nested
 *  inside it). */
export function isDescendant(root: ContainerNode, ancestorId: string, nodeId: string): boolean {
  if (ancestorId === nodeId) return true;
  const ancestor = findContainerById(root, ancestorId);
  if (!ancestor) return false;
  function contains(node: ContainerNode): boolean {
    for (const child of node.children) {
      if (child.id === nodeId) return true;
      if ((child.kind === "container" || child.kind === "repeater") && contains(child)) return true;
    }
    return false;
  }
  return contains(ancestor);
}

/** Locates a container by its `childrenSpan.start` rather than its `id` — the
 *  offset-based counterpart to `findNodeAndParent`, needed because `moveChild` must
 *  re-resolve the destination container in a tree reparsed after the source already
 *  changed once (deleting the moved child), by which point every id past that edit
 *  has shifted (see `insertChild`'s doc comment for the same reason `AddBlockPicker`
 *  locates by offset, not id). `childrenSpan.start` is a stable-enough anchor: it's a
 *  unique absolute offset, and shifting it by the length of whatever was deleted
 *  elsewhere (see `moveChild`) reproduces exactly where it lands in the new source. */
function findContainerByChildrenSpanStart(root: ContainerNode, targetStart: number): ContainerNode | null {
  if (root.childrenSpan.start === targetStart) return root;
  for (const child of root.children) {
    if (child.kind === "container" || child.kind === "repeater") {
      const found = findContainerByChildrenSpanStart(child, targetStart);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Moves one child from `fromParentId` to `toParentId` — the cross-container
 * counterpart to `reorderSibling` (which only permutes siblings sharing one parent).
 * Works uniformly for a leaf block or a whole section (with everything inside it),
 * since the tree doesn't distinguish node kinds here.
 *
 * Implementation note: this can't just splice both parents' spans against the
 * original `source` in one pass and call it done, because `toParentId`'s own id may
 * no longer resolve correctly by the time the destination is re-located — ids are
 * assigned by scan order (see `nextId`) and a deletion shifts every id the scanner
 * reaches afterward. So instead: delete the moved chunk, reparse, re-find the
 * destination by its (shift-adjusted) `childrenSpan.start` via
 * `findContainerByChildrenSpanStart`, insert there, and — unless the destination
 * index is already "last" (`insertChild` always appends) — reparse once more and
 * `reorderSibling` it into its exact requested position.
 */
export function moveChild(
  source: string,
  root: ContainerNode,
  fromParentId: string,
  fromIndex: number,
  toParentId: string,
  toIndex: number
): string {
  if (fromParentId === toParentId) {
    return reorderSibling(source, root, fromParentId, fromIndex, toIndex);
  }

  const fromParent = fromParentId === root.id ? root : (findNodeAndParent(root, fromParentId)?.node as ContainerNode | undefined);
  if (!fromParent || (fromParent.kind !== "container" && fromParent.kind !== "repeater")) return source;
  if (fromIndex < 0 || fromIndex >= fromParent.children.length) return source;
  const movedNode = fromParent.children[fromIndex]!;

  if (isDescendant(root, movedNode.id, toParentId)) return source;

  const toParent = toParentId === root.id ? root : (findNodeAndParent(root, toParentId)?.node as ContainerNode | undefined);
  if (!toParent || (toParent.kind !== "container" && toParent.kind !== "repeater")) return source;

  const movedText = source.slice(movedNode.start, movedNode.end);
  const deletedLength = movedNode.end - movedNode.start;
  // toParent and movedNode are guaranteed disjoint ranges (the isDescendant check
  // above rules out toParent being inside movedNode, and toParent can't equal or
  // contain fromParent's own ancestry back to movedNode either) — so toParent's own
  // childrenSpan.start either sits entirely before the deleted range (unaffected) or
  // entirely after it (shifts left by exactly what got deleted).
  const targetChildrenStart =
    toParent.childrenSpan.start > movedNode.start ? toParent.childrenSpan.start - deletedLength : toParent.childrenSpan.start;

  const midSource = deleteChild(source, root, fromParentId, fromIndex);
  const reparsed = parseOutline(midSource);
  if (!reparsed.ok) return source;

  const relocatedToParent = findContainerByChildrenSpanStart(reparsed.root, targetChildrenStart);
  if (!relocatedToParent) return source;

  const { source: withInserted, insertedAt } = insertChild(midSource, reparsed.root, relocatedToParent.id, movedText);
  if (insertedAt < 0) return source;

  if (toIndex >= relocatedToParent.children.length) return withInserted; // appended last — already the requested position

  const finalReparsed = parseOutline(withInserted);
  if (!finalReparsed.ok) return withInserted;
  const finalToParent = findContainerByChildrenSpanStart(finalReparsed.root, targetChildrenStart);
  if (!finalToParent) return withInserted;
  const newIndex = finalToParent.children.length - 1; // insertChild always appends last
  return reorderSibling(withInserted, finalReparsed.root, finalToParent.id, newIndex, toIndex);
}

/** Number of ElementBlockNodes in `node`'s subtree (`node` included) — used to warn
 *  before deleting a section that isn't just one block. */
export function countBlocks(node: OutlineNode): number {
  if (node.kind === "element") return 1;
  if (node.kind === "conditional") return 0;
  return node.children.reduce((sum, child) => sum + countBlocks(child), 0);
}

/** True if `targetId` is a `{% for %}` repeater, or sits anywhere inside one — i.e.
 *  whether `machine` already resolves to something at that point, independent of
 *  which page-level view (fleet vs. machine) is open. Fleet templates have no
 *  singular `machine` outside their existing loop; this is what lets the "add block"
 *  picker offer machine-scoped elements there too, once it knows to bind through
 *  that loop instead of assuming the page-level view decides everything. */
export function isInsideRepeater(root: ContainerNode, targetId: string): boolean {
  function walk(node: ContainerNode, insideRepeater: boolean): boolean | null {
    const nowInside = insideRepeater || node.kind === "repeater";
    if (node.id === targetId) return nowInside;
    for (const child of node.children) {
      if (child.kind === "container" || child.kind === "repeater") {
        // Recurse rather than checking child.id directly here — if child is itself
        // a repeater, "inside" only becomes true one level down, inside its own
        // walk() call (see nowInside above), not from this parent's nowInside.
        const result = walk(child, nowInside);
        if (result !== null) return result;
      } else if (child.id === targetId) {
        return nowInside;
      }
    }
    return null;
  }
  return walk(root, false) ?? false;
}

function serializeValue(value: string | number | boolean): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return `"${value.replace(/"/g, '\\"')}"`;
}

/** Builds one `{% tagName ... %}` invocation — `binding` (e.g. `"machine: machine"`)
 *  goes first, verbatim, exactly like the binding `updateBlockArgs` preserves on an
 *  edit; pass `null` for fleet-scoped elements, which take none. */
export function buildElementTag(tagName: string, binding: string | null, hash: Record<string, string | number>): string {
  const parts: string[] = [];
  if (binding) parts.push(binding);
  for (const [key, value] of Object.entries(hash)) {
    parts.push(`${key}: ${serializeValue(value)}`);
  }
  const argsText = parts.length ? ` ${parts.join(", ")} ` : " ";
  return `{% ${tagName}${argsText}%}`;
}

/** `<`/`>`/`&` in a user-typed heading would otherwise be parsed as real markup — by
 *  both the Liquid+HTML render pass and this module's own scanner on the next edit. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Same card markup every hand-authored section in defaultTemplates.ts uses, so a
 *  newly-added section is indistinguishable from one an admin wrote by hand. Returns
 *  `elementTagOffset` — `elementTag`'s position within `text` — so a caller inserting
 *  this card can compute exactly where the element itself ends up in the final
 *  source (see `insertChild`'s doc comment for why that's needed instead of an id). */
export function buildSectionCard(heading: string, innerContent: string): { text: string; elementTagOffset: number } {
  const prefix = [
    `<div class="rounded-xl border border-hairline bg-surface p-4 sm:p-5">`,
    `  <div class="mb-3">`,
    `    <h2 class="text-sm font-semibold text-primary">${escapeHtml(heading)}</h2>`,
    `  </div>`,
    `  `,
  ].join("\n");
  return { text: prefix + innerContent + `\n</div>`, elementTagOffset: prefix.length };
}

/** A section's layout, as a small curated preset rather than free-form classes —
 *  every other settings field in this app (see elementRegistry's `SettingsField`) is
 *  a flat select/number, so this stays consistent with that rather than exposing raw
 *  Tailwind. `columns` only matters in `"grid"` mode. */
export interface SectionLayout {
  mode: "column" | "row" | "grid";
  gap: number;
  columns: number;
}

export const DEFAULT_SECTION_LAYOUT: SectionLayout = { mode: "column", gap: 4, columns: 3 };

const SECTION_CARD_CLASS = "rounded-xl border border-hairline bg-surface p-4 sm:p-5";

function extractClassValue(attrsRaw: string): string {
  const m = attrsRaw.match(/\bclass\s*=\s*"([^"]*)"/) ?? attrsRaw.match(/\bclass\s*=\s*'([^']*)'/);
  return m ? m[1]! : "";
}

/** Best-effort read of a section's own `class` attribute back into the curated
 *  layout preset it's editable as — recognizes exactly the `flex flex-col gap-N` /
 *  `flex flex-row gap-N` / `grid grid-cols-N gap-N` conventions `buildSectionClass`
 *  writes (the same ones every hand-authored section in defaultTemplates.ts already
 *  uses); anything else falls back to the default so an unrecognized class string
 *  can never crash the settings form, just reset it to a sensible starting point. */
export function parseSectionLayout(attrsRaw: string): SectionLayout {
  const cls = extractClassValue(attrsRaw);
  const gapMatch = cls.match(/\bgap-(\d+)\b/);
  const gap = gapMatch ? Number(gapMatch[1]) : DEFAULT_SECTION_LAYOUT.gap;
  if (/\bgrid\b/.test(cls)) {
    const colsMatch = cls.match(/\bgrid-cols-(\d+)\b/);
    return { mode: "grid", gap, columns: colsMatch ? Number(colsMatch[1]) : DEFAULT_SECTION_LAYOUT.columns };
  }
  if (/\bflex-row\b/.test(cls)) {
    return { mode: "row", gap, columns: DEFAULT_SECTION_LAYOUT.columns };
  }
  return { mode: "column", gap, columns: DEFAULT_SECTION_LAYOUT.columns };
}

/** The inverse of `parseSectionLayout` — composes a section's full `class` string.
 *  `card: true` keeps the same chrome `buildSectionCard` already uses everywhere, so
 *  a section built or edited through this editor is indistinguishable from one an
 *  admin wrote by hand. */
export function buildSectionClass(layout: SectionLayout, opts: { card: boolean } = { card: true }): string {
  const layoutClass =
    layout.mode === "grid"
      ? `grid grid-cols-${layout.columns} gap-${layout.gap}`
      : layout.mode === "row"
      ? `flex flex-row gap-${layout.gap}`
      : `flex flex-col gap-${layout.gap}`;
  return opts.card ? `${SECTION_CARD_CLASS} ${layoutClass}` : layoutClass;
}

/** Builds a brand-new, deliberately empty section — stamped with the
 *  `data-gbotz-section` marker (see `ContainerNode.explicit`) so it survives the
 *  reparse that happens right after it's inserted instead of being discarded as an
 *  empty wrapper, and stays a valid drag-and-drop target until a block lands in it. */
export function buildEmptySectionCard(heading: string, layout: SectionLayout): string {
  const cls = buildSectionClass(layout, { card: true });
  return [
    `<div class="${cls}" data-gbotz-section="1">`,
    `  <h2 class="text-sm font-semibold text-primary">${escapeHtml(heading)}</h2>`,
    `</div>`,
  ].join("\n");
}

/** Wraps a single element tag in a brand-new `{% for machine in machines %}` loop —
 *  for adding a machine-scoped element to the fleet view somewhere that doesn't
 *  already have one (see `isInsideRepeater`). Mirrors `buildSectionCard`'s shape:
 *  returns where the element tag itself landed, for the same offset-based
 *  post-insertion lookup `insertChild` already relies on. */
export function wrapInMachineLoop(elementTag: string): { text: string; elementTagOffset: number } {
  const prefix = `{% for machine in machines %}\n        `;
  return { text: prefix + elementTag + `\n      {% endfor %}`, elementTagOffset: prefix.length };
}

/**
 * Appends `childText` as the new last child of `parentId`'s children — the mirror
 * image of `reorderSibling`: instead of permuting existing chunks within
 * `childrenSpan`, it grows `childrenSpan` by one chunk at the end. Whatever glue
 * already follows `childrenSpan.end` (the parent's own closing tag and its leading
 * whitespace) is untouched, so the new line still lands before that closing tag.
 *
 * Returns `insertedAt` — `childText`'s absolute offset in the *returned* source —
 * rather than an id, because ids are assigned by scan order (see `nextId`): adding a
 * node shifts the id of every node the scanner reaches afterward, including
 * `parentId` itself once it's re-parsed. An offset a caller computed from the exact
 * string it just built stays correct across that reparse; a captured id would not.
 */
export function insertChild(
  source: string,
  root: ContainerNode,
  parentId: string,
  childText: string
): { source: string; insertedAt: number } {
  const parent = parentId === root.id ? root : (findNodeAndParent(root, parentId)?.node as ContainerNode | undefined);
  if (!parent || (parent.kind !== "container" && parent.kind !== "repeater")) return { source, insertedAt: -1 };
  const pos = parent.childrenSpan.end;
  const prefix = "\n      ";
  return { source: source.slice(0, pos) + prefix + childText + source.slice(pos), insertedAt: pos + prefix.length };
}

/** Finds the ElementBlockNode whose `{%` starts at exactly `tagStart` — the
 *  offset-based counterpart to `findNode`, used to locate a block just inserted by
 *  `insertChild` (see its doc comment for why offset, not id). */
export function findElementByTagStart(root: ContainerNode, tagStart: number): ElementBlockNode | null {
  for (const child of root.children) {
    if (child.kind === "element" && child.tagStart === tagStart) return child;
    if ((child.kind === "container" || child.kind === "repeater") && child.children.length) {
      const found = findElementByTagStart(child, tagStart);
      if (found) return found;
    }
  }
  return null;
}

const BINDING_RE = /\bmachine\s*:\s*machine\b|\bmachineId\s*:\s*"(?:[^"\\]|\\.)*"/;

/** Re-serializes an element tag's args, preserving its `machine: machine` (or literal
 *  `machineId: "..."`) binding verbatim — that's a Liquid variable reference, never
 *  user-editable — and writing every other key from `values` in `fieldOrder`. */
export function updateBlockArgs(
  source: string,
  node: ElementBlockNode,
  values: Record<string, string | number | boolean | undefined>,
  fieldOrder: string[]
): string {
  const binding = node.argsRaw.match(BINDING_RE)?.[0];
  const parts: string[] = [];
  if (binding) parts.push(binding);
  for (const key of fieldOrder) {
    const v = values[key];
    if (v === undefined || v === "") continue;
    parts.push(`${key}: ${serializeValue(v)}`);
  }
  const argsText = parts.length ? ` ${parts.join(", ")} ` : " ";
  const newTag = `{% ${node.tagName}${argsText}%}`;
  return source.slice(0, node.tagStart) + newTag + source.slice(node.tagEnd);
}

/** Rewrites an explicit section's own heading text and/or layout — the container
 *  counterpart to `updateBlockArgs`. Only meaningful for `node.explicit` containers
 *  (see `SectionSettingsForm`, the only caller): those are always built by
 *  `buildEmptySectionCard`, so `headingTextStart`/`headingTextEnd` are always set —
 *  editing the heading of a section with no heading at all isn't a reachable case
 *  through this editor's UI, so it's left as a no-op rather than handled.
 *
 *  Applies the heading edit first, then the class-attribute edit, deliberately in
 *  that order: the heading always sits after the opening tag in the source, so
 *  rewriting it first doesn't shift `openTagStart`/`openTagEnd`, which the second
 *  edit still needs at their original offsets (same "higher offset first" rule
 *  `annotateSource` documents above). */
export function updateSectionAttrs(source: string, node: ContainerNode, values: { heading?: string; layout?: SectionLayout }): string {
  let result = source;

  if (values.heading !== undefined && node.headingTextStart !== null && node.headingTextEnd !== null) {
    result = result.slice(0, node.headingTextStart) + escapeHtml(values.heading) + result.slice(node.headingTextEnd);
  }

  if (values.layout) {
    const newOpenTag = `<div class="${buildSectionClass(values.layout, { card: true })}" data-gbotz-section="1">`;
    result = result.slice(0, node.openTagStart) + newOpenTag + result.slice(node.openTagEnd);
  }

  return result;
}
