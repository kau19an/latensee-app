const DEFAULT_API_BASE_URL = "https://internet-quality-api.onrender.com";

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

if (!__DEV__ && !API_BASE_URL.startsWith("https://")) {
  throw new Error("API_BASE_URL must use https in production builds.");
}

export const API_PATHS = {
  health: "/api/v1/health",
  models: "/api/v1/models",
  nearbyForecast: "/api/v1/forecasts/nearby",
} as const;

export const HEALTH_TIMEOUT_MS = 60_000; // Tempo para a hospedagem da API acordar
export const REQUEST_TIMEOUT_MS = 30_000;
