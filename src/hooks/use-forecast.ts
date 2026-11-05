import { useEffect, useEffectEvent, useState } from "react";

import { useSettings } from "@/hooks/use-settings";
import { useUserLocation, type Coordinates } from "@/hooks/use-user-location";
import { loadForecast } from "@/services/api/forecasts";
import type { NearbyForecast } from "@/types/api";

export type ForecastStatus = "waiting-location" | "loading" | "success" | "error";

interface ForecastResult {
  key: string;
  forecast: NearbyForecast | null; // null = a requisição falhou
}

function makeKey(coordinates: Coordinates, modelId: string, attempt: number): string {
  return `${coordinates.latitude},${coordinates.longitude},${modelId},${attempt}`;
}

export function useForecast() {
  const { settings, setModelId } = useSettings();
  const location = useUserLocation();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ForecastResult | null>(null);

  const { coordinates } = location;
  const modelId = settings.modelId;

  const onModelHealed = useEffectEvent((healedModelId: string) => setModelId(healedModelId));

  useEffect(() => {
    if (!coordinates) return undefined;

    const key = makeKey(coordinates, modelId, attempt);
    const controller = new AbortController();

    loadForecast({ ...coordinates, modelId, signal: controller.signal })
      .then((loaded) => {
        setResult({ key, forecast: loaded.forecast });
        if (loaded.modelId !== modelId) onModelHealed(loaded.modelId);
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, forecast: null });
      });

    return () => controller.abort();
  }, [coordinates, modelId, attempt]);

  let status: ForecastStatus;
  if (!coordinates) status = "waiting-location";
  else if (result?.key !== makeKey(coordinates, modelId, attempt)) status = "loading";
  else status = result.forecast ? "success" : "error";

  const forecast = status === "success" ? (result?.forecast ?? null) : null;

  function refresh() {
    setAttempt((current) => current + 1);
  }

  return { location, status, forecast, refresh };
}
