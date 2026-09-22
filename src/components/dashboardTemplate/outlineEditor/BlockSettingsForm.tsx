"use client";

import { useState } from "react";
import { IconChevronRight } from "@/components/icons";
import { ELEMENT_REGISTRY } from "@/lib/dashboardTemplate/elementRegistry";
import { parseArgsHash, updateBlockArgs, type ElementBlockNode } from "@/lib/dashboardTemplate/outlineParser";

const inputClass =
  "rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-accent";

interface BlockSettingsFormProps {
  block: ElementBlockNode;
  source: string;
  onChange: (next: string) => void;
  onBack: () => void;
  onDelete: () => void;
}

/**
 * Reads/writes the block's args as plain local state rather than round-tripping every
 * keystroke through parseOutline — the outline re-parses live as `source` changes
 * (for the preview + the outline's own labels), but keying this form by `block.id`
 * (stable across pure-args edits — see outlineParser) means React never remounts it
 * mid-edit, so local state is safe and avoids number inputs losing a trailing "." on
 * every keystroke.
 */
export function BlockSettingsForm({ block, source, onChange, onBack, onDelete }: BlockSettingsFormProps) {
  const definition = ELEMENT_REGISTRY[block.tagName];
  const fields = definition?.settingsFields ?? [];
  const [values, setValues] = useState<Record<string, string>>(() => parseArgsHash(block.argsRaw));

  function update(key: string, raw: string) {
    const next = { ...values, [key]: raw };
    setValues(next);

    const coerced: Record<string, string | number | undefined> = {};
    for (const field of fields) {
      const v = next[field.key];
      if (v === undefined || v === "") {
        coerced[field.key] = undefined;
      } else if (field.kind === "number") {
        const n = Number(v);
        coerced[field.key] = Number.isNaN(n) ? undefined : n;
      } else {
        coerced[field.key] = v;
      }
    }
    onChange(updateBlockArgs(source, block, coerced, fields.map((f) => f.key)));
  }

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={onBack}
        className="flex shrink-0 items-center gap-1 border-b border-hairline px-3 py-3 text-xs font-medium text-muted hover:text-primary"
      >
        <IconChevronRight className="h-3.5 w-3.5 rotate-180" />
        Back to outline
      </button>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-3 truncate text-sm font-semibold text-primary">{block.label}</p>
        {fields.length === 0 ? (
          <p className="text-xs text-muted">This block has no configurable settings.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-1 text-xs">
                <span className="text-secondary">{field.label}</span>
                {field.kind === "select" ? (
                  <select
                    className={inputClass}
                    value={values[field.key] ?? ""}
                    onChange={(e) => update(field.key, e.target.value)}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.kind === "number" ? "number" : "text"}
                    className={inputClass}
                    value={values[field.key] ?? ""}
                    onChange={(e) => update(field.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="m-3 shrink-0 rounded-lg border px-3 py-2 text-sm font-medium"
        style={{ borderColor: "var(--status-critical)", color: "var(--status-critical)" }}
      >
        Delete this block
      </button>
    </div>
  );
}
