"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getDocsCorpusText } from "@/components/gbotz/docs/docsContent";
import { IconSparkle, IconX } from "@/components/icons";

interface Exchange {
  question: string;
  answer?: string;
  error?: string;
}

/**
 * Lives inline in the docs right rail (DocsPageAside), not a modal — collapsed it's
 * just the trigger button; expanded it grows in place above the "On this page" list,
 * both scrolling together as part of that sticky column.
 */
export function DocsAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const docsContext = useMemo(() => getDocsCorpusText(), []);

  async function ask() {
    const q = question.trim();
    if (!q || submitting) return;

    setSubmitting(true);
    setQuestion("");
    setExchanges((prev) => [...prev, { question: q }]);

    try {
      const { answer } = await apiFetch<{ answer: string }>("/api/gbotz/docs/ask", {
        method: "POST",
        body: { question: q, docsContext },
      });
      setExchanges((prev) => prev.map((ex, i) => (i === prev.length - 1 ? { ...ex, answer } : ex)));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong asking the assistant.";
      setExchanges((prev) => prev.map((ex, i) => (i === prev.length - 1 ? { ...ex, error: message } : ex)));
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex w-full items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-secondary transition-colors hover:border-baseline hover:text-primary"
      >
        <IconSparkle className="h-4 w-4 shrink-0 text-accent" />
        Ask AI
      </button>
    );
  }

  return (
    <div className="flex max-h-[60vh] flex-col overflow-hidden rounded-lg border border-hairline bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <IconSparkle className="h-3.5 w-3.5 text-accent" />
          Ask the docs
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-primary"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
        {exchanges.length === 0 && (
          <p className="text-xs leading-relaxed text-muted">
            Ask anything about the templating language, elements, filters, or examples.
          </p>
        )}
        {exchanges.map((ex, i) => (
          <div key={i} className="flex flex-col gap-1">
            <p className="text-xs font-medium text-primary">{ex.question}</p>
            {ex.answer && <p className="whitespace-pre-wrap text-xs leading-relaxed text-secondary">{ex.answer}</p>}
            {ex.error && (
              <p className="text-xs leading-relaxed" style={{ color: "var(--status-critical)" }}>
                {ex.error}
              </p>
            )}
            {!ex.answer && !ex.error && <p className="text-xs text-muted">Thinking…</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-hairline p-2">
        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question…"
          rows={2}
          className="w-full resize-none rounded-lg border border-hairline bg-surface-2 px-2.5 py-1.5 text-xs text-primary outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="button"
          onClick={ask}
          disabled={submitting || !question.trim()}
          className="w-full rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
