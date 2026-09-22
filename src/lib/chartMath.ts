// "Nice" round tick values for an axis spanning [min, max] — mirrors the classic
// d3-style linear tick algorithm so labels land on clean numbers (0 / 5 / 10, not 0 / 4.7 / 9.4).
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min > max) {
    const swap = min;
    min = max;
    max = swap;
  }
  if (!(max > min)) {
    const delta = Math.abs(min) * 0.1 || 1;
    min -= delta;
    max += delta;
  }
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [min, max];

  const n = Math.max(1, Math.min(20, Math.floor(count) || 5));
  const rawStep = span / n;
  const log = Math.log10(rawStep);
  if (!Number.isFinite(log)) return [min, max];
  const magnitude = Math.pow(10, Math.floor(log));
  if (!Number.isFinite(magnitude) || magnitude <= 0) return [min, max];
  const residual = rawStep / magnitude;
  let step: number;
  if (residual > 5) step = 10 * magnitude;
  else if (residual > 2) step = 5 * magnitude;
  else if (residual > 1) step = 2 * magnitude;
  else step = magnitude;
  // step 0 / Infinity / tiny-vs-large-value makes `v += step` a no-op and grows
  // ticks until V8 throws RangeError: Invalid array length.
  if (!Number.isFinite(step) || step <= 0) return [min, max];

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  if (!Number.isFinite(niceMin) || !Number.isFinite(niceMax)) return [min, max];

  const ticks: number[] = [];
  const guard = n * 8;
  let v = niceMin;
  for (let i = 0; i < guard && v <= niceMax + step * 0.5; i++) {
    ticks.push(Math.round(v / step) * step);
    const next = v + step;
    if (next <= v) break;
    v = next;
  }
  return ticks.length > 0 ? ticks : [min, max];
}

export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

// Bubble-chart radius scale: interpolates on AREA, not radius, so a value twice as
// large renders at ~1.41x the radius (matching perceived area) instead of 2x.
export function scaleSqrtArea(domain: [number, number], radiusRange: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = radiusRange;
  const span = d1 - d0 || 1;
  const a0 = r0 * r0;
  const a1 = r1 * r1;
  return (value: number) => Math.sqrt(a0 + ((value - d0) / span) * (a1 - a0));
}

export function formatTickNumber(value: number): string {
  const abs = Math.abs(value);
  const decimals = abs !== 0 && abs < 10 ? 1 : 0;
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// `spanMs` is the plotted axis's own time range (xMax - xMin), not the nominal
// picker duration — pass it whenever it's known so a tick/tooltip on a >24h chart
// (e.g. the 7d range) includes a date, not just a time-of-day that repeats every
// day and can't disambiguate which day a point falls on.
export function formatTickTime(ts: number, spanMs?: number): string {
  const date = new Date(ts);
  if (spanMs !== undefined && spanMs > ONE_DAY_MS) {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return date.toLocaleTimeString(undefined, { hour12: false });
}

// Greedy declutter: given label anchor Y positions (already sorted ascending), push
// overlapping labels apart so end-of-line labels never stack on top of one another.
export function declutter(positions: number[], minGap: number): number[] {
  const result = [...positions];
  for (let i = 1; i < result.length; i++) {
    if (result[i] - result[i - 1] < minGap) {
      result[i] = result[i - 1] + minGap;
    }
  }
  return result;
}

// Polar -> cartesian for pie/donut/radar charts. angleDeg 0 points straight up (12
// o'clock) and increases clockwise, matching how a viewer reads a dial.
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
