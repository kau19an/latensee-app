import { API_PATHS, HEALTH_TIMEOUT_MS } from "@/constants/api";
import type { HealthResponse } from "@/types/api";
import { ApiError, apiGet } from "./client";

function isHealthResponse(data: unknown): data is HealthResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    typeof data.status === "string" &&
    "service" in data &&
    typeof data.service === "string"
  );
}

export async function fetchApiHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const data = await apiGet(API_PATHS.health, {
    signal,
    timeoutMs: HEALTH_TIMEOUT_MS,
  });

  if (!isHealthResponse(data) || data.status !== "ok") {
    throw new ApiError("invalid", "Unexpected health response.");
  }

  return data;
}
