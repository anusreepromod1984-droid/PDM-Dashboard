export function DocsCodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-hairline bg-surface-2 p-3 text-xs leading-relaxed">
      <code className="font-mono text-primary">{children}</code>
    </pre>
  );
}
