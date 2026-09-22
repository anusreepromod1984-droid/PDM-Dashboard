"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button with --status-critical instead of --accent, for destructive actions. */
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface MessageContextValue {
  /** Themed replacement for window.confirm — resolves true/false instead of blocking the thread. */
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const MessageContext = createContext<MessageContextValue | null>(null);

/**
 * Mounted once at the root (see app/layout.tsx) so any component can call useMessage()
 * without its own provider. Renders at most one dialog at a time — this app never
 * needs to stack confirmations, so a single `pending` slot (not a queue) keeps this
 * simple. z-[300] sits above everything else in the app's z-index scale (toasts z-50,
 * alert-glow z-100, Super Dashboard z-200), since a confirmation must interrupt
 * whatever the user was doing, including a fullscreen overlay.
 */
export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  useEffect(() => {
    if (pending) confirmButtonRef.current?.focus();
  }, [pending]);

  function settle(confirmed: boolean) {
    pending?.resolve(confirmed);
    setPending(null);
  }

  return (
    <MessageContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => settle(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") settle(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="message-dialog-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl border border-hairline bg-surface p-5 shadow-2xl"
          >
            <h2 id="message-dialog-title" className="text-sm font-semibold text-primary">
              {pending.title ?? "Are you sure?"}
            </h2>
            <p className="mt-1.5 text-sm text-secondary">{pending.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-surface-2"
              >
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={() => settle(true)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: pending.danger ? "var(--status-critical)" : "var(--accent)" }}
              >
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MessageContext.Provider>
  );
}

export function useMessage(): MessageContextValue {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessage must be used within MessageProvider");
  return ctx;
}
