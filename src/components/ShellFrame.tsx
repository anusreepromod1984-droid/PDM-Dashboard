/**
 * Generic topbar+sidebar+main flex skeleton, shared by the tenant shell and (later)
 * the Gbotz shell — the two provider trees are fully separate, but the layout
 * geometry is identical, so this is a safe, presentation-only thing to share.
 */
export function ShellFrame({
  topbar,
  sidebar,
  rightPanel,
  children,
  style,
}: {
  topbar: React.ReactNode;
  sidebar: React.ReactNode;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style} className="flex h-full flex-col">
      {topbar}
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <main className="relative min-w-0 flex-1 overflow-y-auto bg-surface-2 p-4 sm:p-6">{children}</main>
        {rightPanel}
      </div>
    </div>
  );
}
