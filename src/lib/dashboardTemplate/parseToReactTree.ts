import { createElement, type ReactNode } from "react";
import { ELEMENT_REGISTRY } from "@/lib/dashboardTemplate/elementRegistry";

const DANGEROUS_ATTR = /^on/i;
const URL_ATTRS = new Set(["href", "src"]);

function isSafeUrl(value: string): boolean {
  return !/^\s*javascript:/i.test(value);
}

const ATTR_RENAME: Record<string, string> = { class: "className", for: "htmlFor" };

function sanitizedAttrs(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (DANGEROUS_ATTR.test(attr.name)) continue;
    if (URL_ATTRS.has(attr.name) && !isSafeUrl(attr.value)) continue;
    attrs[ATTR_RENAME[attr.name] ?? attr.name] = attr.value;
  }
  return attrs;
}

/**
 * Turns a Liquid-rendered HTML string into a real React element tree — via
 * DOMParser + a manual walk, never `dangerouslySetInnerHTML`. Nodes carrying
 * `data-gbotz-el` are swapped for their live React component (see elementRegistry);
 * everything else passes through as literal HTML. This is also where the one
 * security pass happens: `<script>` is dropped, `on*` attributes and
 * `javascript:`-scheme URLs are stripped — defense-in-depth against a careless
 * raw-HTML paste by a Gbotz admin (the actual privilege boundary is
 * requireGbotzAuth, not this).
 */
export function parseToReactTree(html: string): ReactNode[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let key = 0;
  const nextKey = () => `n${key++}`;

  function walk(node: Node): ReactNode {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const el = node as Element;
    if (el.tagName === "SCRIPT") return null;

    const elementName = el.getAttribute("data-gbotz-el");
    if (elementName) {
      const definition = ELEMENT_REGISTRY[elementName];
      if (!definition) {
        return createElement(
          "p",
          { key: nextKey(), className: "text-xs", style: { color: "var(--status-critical)" } },
          `Unknown dashboard element: "${elementName}"`
        );
      }
      let raw: Record<string, unknown> = {};
      try {
        raw = JSON.parse(el.getAttribute("data-gbotz-props") ?? "{}");
      } catch {
        // Malformed props JSON — render the element with whatever parseProps makes
        // of an empty object (typically a "no data" placeholder) rather than throwing.
      }
      return createElement(definition.component, { ...definition.parseProps(raw), key: nextKey() });
    }

    const children = Array.from(el.childNodes).map(walk);
    return createElement(el.tagName.toLowerCase(), { ...sanitizedAttrs(el), key: nextKey() }, ...children);
  }

  return Array.from(doc.body.childNodes).map(walk);
}
