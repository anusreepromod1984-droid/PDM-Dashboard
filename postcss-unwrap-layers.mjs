/**
 * Unwraps CSS Cascade Layers (@layer) from Tailwind v4's compiled output: replaces
 * `@layer name { ... }` with its contents in place — preserving source order, which is
 * exactly what layer ordering degrades to once the at-rule itself is gone — and drops
 * bare `@layer name;` statements (pure ordering declarations, meaningless once
 * unwrapped).
 *
 * Why: Tailwind v4 wraps essentially its entire output (base styles AND every utility
 * class) in `@layer` blocks. Cascade Layers only shipped in Chrome 99 (Mar 2022), and
 * the /3d flow gets rendered inside Unreal Engine's embedded web widget, whose bundled
 * Chromium/CEF build is old enough not to recognize it — confirmed against a real
 * screenshot from inside that widget showing zero styling applied (plain
 * browser-default text/inputs) despite the exact same page rendering correctly in an
 * actual browser. Per the CSS spec, a block-type at-rule the parser doesn't recognize
 * is discarded in its entirety, not degraded property-by-property — so instead of one
 * missing effect (the color-mix() compatibility issue already fixed elsewhere), the
 * *entire* stylesheet was silently dropped.
 *
 * Why this is safe to apply everywhere (not just gated to the /3d flow): removing the
 * @layer wrapper is visually a no-op for any codebase that only relies on flat utility
 * classes, which this one does throughout (no arbitrary `@layer components` classes
 * authored anywhere in src/) — cascade layers exist to resolve cross-layer specificity
 * conflicts that flat utility classes essentially never create, and source order
 * (which this preserves) already keeps `properties` < `theme` < `base` < `components`
 * < `utilities` in the same precedence order the layers expressed explicitly.
 *
 * Kept in its own file (rather than inlined in postcss.config.mjs) and referenced by
 * name in that file's plugins object, mirroring how @tailwindcss/postcss is declared
 * there — a direct top-level `import` of a plugin in postcss.config.mjs broke
 * Turbopack's resolution of lightningcss's native binding (a Tailwind dependency);
 * this sidesteps that entirely.
 */
function unwrapCascadeLayers() {
  return {
    postcssPlugin: "unwrap-cascade-layers",
    OnceExit(root) {
      root.walkAtRules("layer", (rule) => {
        if (rule.nodes) {
          rule.replaceWith(rule.nodes);
        } else {
          rule.remove();
        }
      });
    },
  };
}
unwrapCascadeLayers.postcss = true;

export default unwrapCascadeLayers;
