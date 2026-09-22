export function WaitingForData({ label = "telemetry" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-hairline bg-surface p-10 text-sm text-muted">
      Waiting for {label} from the server…
    </div>
  );
}
