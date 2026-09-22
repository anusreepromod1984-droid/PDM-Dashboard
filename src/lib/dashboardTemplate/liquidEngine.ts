import { Liquid } from "liquidjs";
import { ELEMENT_REGISTRY } from "@/lib/dashboardTemplate/elementRegistry";
import { makeElementTagOptions } from "@/lib/dashboardTemplate/elementTag";
import { formatNumber, timeAgo } from "@/lib/format";

let engine: Liquid | null = null;

/**
 * One shared engine instance. Tag/filter registration is re-run on every call rather
 * than only at construction — cheap (just Map.set calls) — so a registry entry added
 * after this module already ran once (e.g. a dev-server hot-reload that preserved
 * this module's state but not elementRegistry's) can never leave a previously-cached
 * engine missing a tag.
 */
export function getLiquidEngine(): Liquid {
  if (!engine) {
    engine = new Liquid();
    engine.registerFilter("formatNumber", (value: number, decimals = 1) => formatNumber(value, decimals));
    engine.registerFilter("timeAgo", (value: number) => timeAgo(value, Date.now()));
  }

  for (const name of Object.keys(ELEMENT_REGISTRY)) {
    engine.registerTag(name, makeElementTagOptions(name));
  }

  return engine;
}
