import { API_PATHS, REQUEST_TIMEOUT_MS } from "@/constants/api";
import { DEFAULT_MODEL_ID } from "@/constants/settings";
import type { PredictionModel } from "@/types/api";

import { ApiError, apiGet } from "./client";
import { isRecord, readString } from "./parsers";

function parseModel(item: unknown): PredictionModel | null {
  if (!isRecord(item)) return null;

  const id = readString(item, "id");
  const name = readString(item, "name");
  const description = readString(item, "description");
  const groupName = readString(item, "groupName");
  const algorithm = readString(item, "algorithm");
  const version = readString(item, "version");

  if (
    id === null ||
    id === "" ||
    name === null ||
    description === null ||
    groupName === null ||
    algorithm === null ||
    version === null
  ) {
    return null;
  }

  return { id, name, description, groupName, algorithm, version };
}

export async function fetchModels(signal?: AbortSignal): Promise<PredictionModel[]> {
  const data = await apiGet(API_PATHS.models, { signal, timeoutMs: REQUEST_TIMEOUT_MS });
  const items = isRecord(data) ? data.items : null;

  if (!Array.isArray(items)) {
    throw new ApiError("invalid", "Unexpected models response.");
  }

  return items.flatMap((item) => {
    const model = parseModel(item);
    return model ? [model] : [];
  });
}

export function resolveModelId(
  models: readonly PredictionModel[],
  preferredId: string,
): string | null {
  if (models.some((model) => model.id === preferredId)) return preferredId;
  if (models.some((model) => model.id === DEFAULT_MODEL_ID)) return DEFAULT_MODEL_ID;
  return models[0]?.id ?? null;
}
