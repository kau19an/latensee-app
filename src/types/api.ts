export type ApiHealthStatus = "checking" | "active" | "unavailable";

export interface HealthResponse {
  status: string;
  service: string;
}

export type ApiQuality = "GOOD" | "MODERATE" | "UNSTABLE";

export type ApiRecommendationCode = "NORMAL_USE" | "REDUCE_NETWORK_USAGE" | "PREPARE_OFFLINE";

export interface PredictionModel {
  id: string;
  name: string;
  description: string;
  groupName: string;
  algorithm: string;
  version: string;
}

export interface NearbyForecast {
  model: { id: string; name: string; version: string };
  probeId: number;
  distanceKm: number;
  predictionFor: string;
  predictedAvgRttMs: number;
  predictedPacketLossPct: number;
  quality: ApiQuality;
  qualityScore: number;
  recommendationCode: ApiRecommendationCode;
  disclaimer: string;
  locationPrivacy: string;
}
