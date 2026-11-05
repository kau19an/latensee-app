import { AppText } from "@/components/app-text";
import { SETTINGS_TEXT } from "@/constants/app-content";
import { FontFamily } from "@/constants/theme";
import { useApiStatusColor } from "@/hooks/use-api-status-color";
import type { ApiHealthStatus } from "@/types/api";

interface ApiStatusLineProps {
  status: ApiHealthStatus;
}

export function ApiStatusLine({ status }: ApiStatusLineProps) {
  const statusColor = useApiStatusColor(status);
  const { prefix, statuses } = SETTINGS_TEXT.apiStatus;

  return (
    <AppText variant="label" tone="muted" accessibilityLiveRegion="polite">
      {prefix}{" "}
      <AppText variant="label" style={{ color: statusColor, fontFamily: FontFamily.bold }}>
        {statuses[status]}
      </AppText>
      .
    </AppText>
  );
}
