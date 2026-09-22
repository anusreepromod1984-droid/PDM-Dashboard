import { API_URL } from "@/lib/constants";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Shared fetch wrapper for both the tenant AuthProvider and (later) GbotzAuthProvider —
 * NOT a shared provider, just this. Always sends the session cookie cross-origin,
 * always JSON in/out, throws a typed ApiError on a non-2xx response instead of making
 * every call site duplicate the `if (!res.ok)` dance.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  // FormData (file uploads) must NOT be JSON-stringified or given an explicit
  // Content-Type — the browser needs to set its own multipart boundary.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  // If path starts with /api/, keep it relative so it always hits the Next.js server (port 3000)
  const url = path.startsWith("http")
    ? path
    : path.startsWith("/api/")
      ? path
      : `${API_URL}${path}`;
  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? `request failed (${res.status})`);
  }
  return data as T;
}
