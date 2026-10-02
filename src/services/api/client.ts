import { API_BASE_URL } from "@/constants/api";

export type ApiErrorKind = "timeout" | "network" | "http" | "invalid" | "aborted";

export class ApiError extends Error {
  kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
  }
}

interface ApiGetOptions {
  signal?: AbortSignal;
  timeoutMs: number;
}

export async function apiGet(
  path: string,
  { signal, timeoutMs }: ApiGetOptions,
): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener("abort", abortFromCaller);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new ApiError("http", `Request failed with status ${response.status}.`);
    }

    try {
      return await response.json();
    } catch {
      throw new ApiError("invalid", "Response is not valid JSON.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError("timeout", "Request timed out.");
    if (signal?.aborted) throw new ApiError("aborted", "Request was cancelled.");
    throw new ApiError("network", "Network request failed.");
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
