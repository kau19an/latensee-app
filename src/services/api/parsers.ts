export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(source: JsonRecord, key: string): string | null {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

export function readNumber(source: JsonRecord, key: string): number | null {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function readRecord(source: JsonRecord, key: string): JsonRecord | null {
  const value = source[key];
  return isRecord(value) ? value : null;
}
