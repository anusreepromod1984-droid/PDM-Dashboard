import type { ReactNode } from "react";

export function DocsHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mt-1 text-base font-semibold text-primary">
      {children}
    </h3>
  );
}
