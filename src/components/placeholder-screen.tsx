import { AppText } from "@/components/app-text";
import { Screen } from "@/components/screen";
import { SCREEN_TEXT } from "@/constants/app-content";

interface PlaceholderScreenProps {
  title?: string;
  description: string;
}

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <Screen title={title}>
      <AppText variant="eyebrow" tone="accent">
        {SCREEN_TEXT.comingSoon}
      </AppText>
      <AppText tone="muted">{description}</AppText>
    </Screen>
  );
}
