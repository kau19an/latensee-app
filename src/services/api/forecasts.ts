import { API_PATHS, REQUEST_TIMEOUT_MS } from "@/constants/api";
import type { ApiQuality, ApiRecommendationCode, NearbyForecast } from "@/types/api";

import { ApiError, apiGet } from "./client";
import { fetchModels, resolveModelId } from "./models";
import { isRecord, readNumber, readRecord, readString } from "./parsers";

const QUALITIES: readonly string[] = ["GOOD", "MODERATE", "UNSTABLE"];
const RECOMMENDATIONS: readonly string[] = ["NORMAL_USE", "REDUCE_NETWORK_USAGE", "PREPARE_OFFLINE"];

function isQuality(value: string | null): value is ApiQuality {
  return value !== null && QUALITIES.includes(value);
}

function isRecommendationCode(value: string | null): value is ApiRecommendationCode {
  return value !== null && RECOMMENDATIONS.includes(value);
}

// precisão de ~1km: a API só precisa da uma posição estimada para encontrar o probe mais próximo
function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseForecast(data: unknown): NearbyForecast {
  const invalid = () => new ApiError("invalid", "Unexpected forecast response.");

  if (!isRecord(data)) throw invalid();

  const model = readRecord(data, "model");
  const probe = readRecord(data, "matchedProbe");
  const prediction = readRecord(data, "prediction");
  const assessment = readRecord(data, "assessment");
  const recommendation = readRecord(data, "recommendation");
  const metadata = readRecord(data, "metadata");

  if (!model || !probe || !prediction || !assessment || !recommendation || !metadata) {
    throw invalid();
  }

  const modelId = readString(model, "id");
  const modelName = readString(model, "name");
  const modelVersion = readString(model, "version");
  const probeId = readNumber(probe, "probeId");
  const distanceKm = readNumber(probe, "distanceKm");
  const predictionFor = readString(prediction, "predictionFor");
  const predictedAvgRttMs = readNumber(prediction, "predictedAvgRttMs");
  const predictedPacketLossPct = readNumber(prediction, "predictedPacketLossPct");
  const quality = readString(assessment, "quality");
  const qualityScore = readNumber(assessment, "qualityScore");
  const recommendationCode = readString(recommendation, "code");
  const disclaimer = readString(metadata, "disclaimer");
  const locationPrivacy = readString(metadata, "locationPrivacy");

  if (
    modelId === null ||
    modelName === null ||
    modelVersion === null ||
    probeId === null ||
    distanceKm === null ||
    predictionFor === null ||
    predictedAvgRttMs === null ||
    predictedPacketLossPct === null ||
    qualityScore === null ||
    disclaimer === null ||
    locationPrivacy === null ||
    !isQuality(quality) ||
    !isRecommendationCode(recommendationCode)
  ) {
    throw invalid();
  }

  return {
    model: { id: modelId, name: modelName, version: modelVersion },
    probeId,
    distanceKm,
    predictionFor,
    predictedAvgRttMs,
    predictedPacketLossPct,
    quality,
    qualityScore,
    recommendationCode,
    disclaimer,
    locationPrivacy,
  };
}

interface ForecastParams {
  latitude: number;
  longitude: number;
  modelId: string;
  signal?: AbortSignal;
}

export async function fetchNearbyForecast({
  latitude,
  longitude,
  modelId,
  signal,
}: ForecastParams): Promise<NearbyForecast> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError("invalid", "Invalid coordinates.");
  }

  const query = [
    `lat=${roundCoordinate(latitude)}`,
    `lon=${roundCoordinate(longitude)}`,
    `model_id=${encodeURIComponent(modelId)}`,
  ].join("&");

  const data = await apiGet(`${API_PATHS.nearbyForecast}?${query}`, {
    signal,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  return parseForecast(data);
}

export interface LoadedForecast {
  forecast: NearbyForecast;
  modelId: string;
}

export async function loadForecast(params: ForecastParams): Promise<LoadedForecast> {
  try {
    return { forecast: await fetchNearbyForecast(params), modelId: params.modelId };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;

    const models = await fetchModels(params.signal);
    const fallbackId = resolveModelId(models, params.modelId);
    if (fallbackId === null || fallbackId === params.modelId) throw error;

    const forecast = await fetchNearbyForecast({ ...params, modelId: fallbackId });
    return { forecast, modelId: fallbackId };
  }
}
