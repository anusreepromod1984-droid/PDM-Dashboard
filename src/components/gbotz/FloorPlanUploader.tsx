"use client";

import { useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

/**
 * Upload/replace/remove the company's floor-plan background image (see FloorCanvas's
 * backgroundImageUrl prop). Lives above the map in PlantMapEditor rather than on the
 * general company-settings page — this is where an admin is already looking at the
 * result and can see it update immediately.
 */
export function FloorPlanUploader({
  companyId,
  imageUrl,
  onChange,
}: {
  companyId: string;
  imageUrl: string | null;
  onChange: () => void | Promise<unknown>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      await apiFetch(`/api/gbotz/companies/${companyId}/floor-plan`, { method: "POST", body: form });
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/gbotz/companies/${companyId}/floor-plan`, { method: "DELETE" });
      await onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "remove failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface px-3 py-2">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, arbitrary-origin image
        <img src={imageUrl} alt="" className="h-10 w-16 rounded-md border border-hairline object-cover" />
      )}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Floor-plan background</span>
        {error && (
          <span className="text-xs" style={{ color: "var(--status-critical)" }}>
            {error}
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-hairline bg-surface-2 px-2.5 py-1 text-xs font-medium text-secondary transition-colors hover:border-baseline hover:text-primary disabled:opacity-50"
        >
          {imageUrl ? "Replace image" : "Upload image"}
        </button>
        {imageUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={handleRemove}
            className="rounded-md border border-hairline px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-baseline hover:text-primary disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
