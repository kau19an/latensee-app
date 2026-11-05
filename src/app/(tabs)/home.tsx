import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-text";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Screen } from "@/components/screen";
import { Spacing } from "@/constants/theme";
import { useForecast } from "@/hooks/use-forecast";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatDecimal, formatTime } from "@/utils/format";

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="mono">{value}</AppText>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const { location, status, forecast, refresh } = useForecast();

  const isBusy =
    location.status === "checking" ||
    location.status === "locating" ||
    status === "loading";

  return (
    <Screen title="Sua região" subtitle="Etapa 3a · dados reais (tela provisória)">
      {location.status === "needs-permission" && (
        <Card>
          <AppText variant="section">Precisamos da sua localização</AppText>
          <AppText tone="muted">
            Usamos uma posição aproximada, só para achar o ponto de medição mais próximo.
          </AppText>
          <Button label="Permitir localização" onPress={() => void location.requestPermission()} />
        </Card>
      )}

      {location.status === "denied" && (
        <Card>
          <AppText variant="section">Localização desativada</AppText>
          <AppText tone="muted">
            Sem ela não dá para achar o ponto de medição. Você pode ativar nos ajustes do
            aparelho.
          </AppText>
          <Button label="Abrir ajustes" onPress={location.openSettings} />
        </Card>
      )}

      {location.status === "error" && (
        <Card>
          <AppText variant="section">Não encontramos onde você está</AppText>
          <AppText tone="muted">Confira se a localização do aparelho está ligada.</AppText>
          <Button label="Tentar de novo" onPress={location.retry} />
        </Card>
      )}

      {isBusy && (
        <Card style={styles.busy}>
          <ActivityIndicator color={colors.primary} />
          <AppText tone="muted">Buscando a previsão para a sua região…</AppText>
        </Card>
      )}

      {status === "error" && (
        <Card>
          <AppText variant="section">Não conseguimos carregar a previsão</AppText>
          <AppText tone="muted">Verifique sua internet e tente de novo.</AppText>
          <Button label="Tentar de novo" onPress={refresh} />
        </Card>
      )}

      {forecast && (
        <Card>
          <DataRow label="Qualidade" value={`${forecast.quality} (${forecast.qualityScore})`} />
          <DataRow label="Latência prevista" value={`${formatDecimal(forecast.predictedAvgRttMs)} ms`} />
          <DataRow label="Perda de pacotes" value={`${formatDecimal(forecast.predictedPacketLossPct)} %`} />
          <DataRow label="Previsão para" value={formatTime(forecast.predictionFor)} />
          <DataRow label="Ponto de medição" value={`#${forecast.probeId}`} />
          <DataRow label="Distância" value={`${formatDecimal(forecast.distanceKm)} km`} />
          <DataRow label="Modelo" value={`${forecast.model.name} v${forecast.model.version}`} />
          <DataRow label="Recomendação" value={forecast.recommendationCode} />
          <AppText variant="caption" tone="muted">
            {forecast.disclaimer}
          </AppText>
          <Button label="Atualizar previsão" icon="activity" onPress={refresh} />
        </Card>
      )}

      <Button label="Atividades" variant="secondary" onPress={() => router.push("/activities")} />
      <Button label="Privacidade" variant="secondary" onPress={() => router.push("/privacy")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  busy: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
});
