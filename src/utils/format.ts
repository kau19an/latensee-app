function pad(value: number): string {
  return String(value).padStart(2, "0");
}

// vírgula decimal do português: 2.7 -> "2,7".
export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace(".", ",");
}

// ISO -> "HH:mm" local.
export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
