import type { ApiErrorPayload } from "@/types/api";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(opts: { code: string; message: string; status: number; details?: unknown }) {
    super(opts.message);
    this.name = "ApiError";
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  token?: string | null;
  body?: unknown;
};

async function parseJsonSafe(res: Response): Promise<unknown | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set("accept", "application/json");
  if (opts.token) headers.set("authorization", `Bearer ${opts.token}`);

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(path, {
    ...opts,
    headers,
    body,
  });

  const payload = await parseJsonSafe(res);

  if (!res.ok) {
    const apiErr = (payload as ApiErrorPayload | null)?.error;
    throw new ApiError({
      status: res.status,
      code: apiErr?.code ?? "http_error",
      message: apiErr?.message ?? `HTTP ${res.status}`,
      details: apiErr?.details ?? payload,
    });
  }

  return payload as T;
}

