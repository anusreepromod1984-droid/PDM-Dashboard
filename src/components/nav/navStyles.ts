/**
 * Shared between the tenant Sidebar and (later) the Gbotz sidebar — pure styling
 * helpers, no provider coupling, so they're safe to share across the two otherwise
 * fully-separate shell trees.
 */
export function navClass(active: boolean): string {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active ? "bg-accent/10 text-accent" : "text-secondary hover:bg-surface-2 hover:text-primary"
  }`;
}

export function subNavClass(active: boolean): string {
  return `flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
    active ? "bg-accent/10 text-accent font-medium" : "text-muted hover:bg-surface-2 hover:text-primary"
  }`;
}
