import path from "node:path";

// Object-key plugin references get require()'d relative to whatever internal bundle
// happens to be doing the requiring (a Turbopack implementation detail), not this
// file's own directory — an absolute path sidesteps that. import.meta.url doesn't
// work for computing it: Turbopack evaluates a copy of this config from inside
// .next/, so it resolves to .next/ instead of the real project root. process.cwd()
// (next dev/next build's invocation directory, i.e. this project root) does work.
// Plain Node built-ins only here (no package imports): importing @tailwindcss/postcss
// directly in this file broke Turbopack's resolution of its native lightningcss
// binding, which is why that plugin stays referenced by name below instead.
const unwrapLayersPath = path.join(process.cwd(), "postcss-unwrap-layers.mjs");

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // See postcss-unwrap-layers.mjs — strips @layer wrapping so the compiled CSS
    // works in the /3d flow's embedded (pre-Chrome-99) web widget.
    [unwrapLayersPath]: {},
  },
};

export default config;
