import { useThemeColors } from "@/hooks/use-theme-colors";
import type { ApiHealthStatus } from "@/types/api";

export function useApiStatusColor(status: ApiHealthStatus): string {
  const colors = useThemeColors();

  const statusColors: Record<ApiHealthStatus, string> = {
    checking: colors.warning,
    active: colors.success,
    unavailable: colors.danger,
  };

  return statusColors[status];
}
