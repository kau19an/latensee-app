export type ApiHealthStatus = "checking" | "active" | "unavailable";

export interface HealthResponse {
  status: string;
  service: string;
}
