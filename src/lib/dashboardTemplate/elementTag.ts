import type { Context, Emitter } from "liquidjs";

/** Single-quotes can't appear inside a single-quoted HTML attribute value. */
function escapeForAttr(json: string): string {
  return json.replace(/'/g, "&#39;");
}

/**
 * One generic Liquid tag factory shared by every registered element (see
 * elementRegistry.tsx) — the tag itself only knows how to emit an inert placeholder
 * carrying the (already-resolved-by-Liquid) tag arguments as JSON. It never renders a
 * live value: parseToReactTree resolves the placeholder into the real React
 * component, which pulls its own live data via hooks. Uses liquidjs's TagImplOptions
 * form (not a raw `Tag` subclass) — liquidjs parses `key: value` args into `hash`
 * for us, already resolved against the current scope (so `machine: machine` inside a
 * `{% for machine in machines %}` loop resolves to the real object). `TagImplOptions`
 * itself isn't part of liquidjs's public top-level export surface, so this is
 * structurally typed instead of importing that interface name.
 */
export function makeElementTagOptions(elementName: string): {
  render: (ctx: Context, emitter: Emitter, hash: Record<string, unknown>) => void;
} {
  return {
    render(_ctx, emitter, hash) {
      const json = escapeForAttr(JSON.stringify(hash));
      emitter.write(`<div data-gbotz-el="${elementName}" data-gbotz-props='${json}'></div>`);
    },
  };
}
