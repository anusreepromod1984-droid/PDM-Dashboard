export function ChartLegend({
  items,
  variant = "line",
}: {
  items: { label: string; color: string }[];
  variant?: "line" | "rect";
}) {
  if (items.length < 2) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs text-secondary">
          {variant === "line" ? (
            <span className="h-0.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          ) : (
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />
          )}
          <span className="truncate">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
