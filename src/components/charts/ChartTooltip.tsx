export interface TooltipRow {
  label: string;
  value: string;
  color: string;
}

export function ChartTooltip({
  x,
  y,
  title,
  rows,
  containerWidth,
}: {
  x: number;
  y: number;
  title: string;
  rows: TooltipRow[];
  containerWidth: number;
}) {
  // Flip to the left of the cursor once it would overflow the chart's right edge.
  const flip = x > containerWidth - 160;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-[9rem] rounded-lg border border-hairline bg-surface px-3 py-2 text-xs shadow-lg"
      style={{
        left: flip ? undefined : x + 12,
        right: flip ? containerWidth - x + 12 : undefined,
        top: Math.max(0, y - 12),
      }}
    >
      <div className="mb-1.5 font-medium text-secondary">{title}</div>
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
            <span className="min-w-0 flex-1 truncate text-secondary">{row.label}</span>
            <span className="font-semibold tabular-nums text-primary">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
