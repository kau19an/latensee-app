import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrevisaoDia, infoDados } from './api';
import { classificar, STATUS, rotuloDia } from './theme';

// Se true, agenda avisos mesmo com dados de exemplo (bom só para testar/demonstrar)
const PERMITIR_DADOS_EXEMPLO = false;
const ANTECEDENCIA_MIN = 30;   // avisa 30 min antes
const HORAS_SEGUIDAS = 2;      // só avisa se ficar ruim por 2h ou mais

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export const PREFS_PADRAO = { risco: true, falha: true };
export const lerPrefs = async () => {
  try { return { ...PREFS_PADRAO, ...JSON.parse(await AsyncStorage.getItem('alertas')) }; } catch (e) { return PREFS_PADRAO; }
};
export const salvarPrefs = (p) => AsyncStorage.setItem('alertas', JSON.stringify(p));

export async function pedirPermissao() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alertas', { name: 'Alertas de conexão', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// Retorna: nº de avisos agendados (>= 0) | -1 sem previsão real | -2 alertas desligados | -3 sem permissão
export async function reagendarAlertas() {
  const prefs = await lerPrefs();
  if (!prefs.risco && !prefs.falha) { await Notifications.cancelAllScheduledNotificationsAsync(); return -2; }
  if (!(await Notifications.getPermissionsAsync()).granted) return -3;

  const listas = [];
  for (const dia of [0, 1]) {
    const l = await getPrevisaoDia(dia);
    if (infoDados().fonte === 'mock' && !PERMITIR_DADOS_EXEMPLO) return -1; // mantém avisos antigos
    listas.push(l);
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const ruim = (p) => { const st = classificar(p); return (st === 'Instável' && prefs.falha) || (st === 'Regular' && prefs.risco); };
  const agora = Date.now();
  let total = 0;

  for (let dia = 0; dia < listas.length; dia++) {
    const lista = listas[dia];
    let i = 0;
    while (i < lista.length) {
      if (!ruim(lista[i])) { i++; continue; }
      let j = i;
      while (j + 1 < lista.length && ruim(lista[j + 1])) j++;       // trecho ruim: i..j
      const trecho = lista.slice(i, j + 1);
      if (trecho.length >= HORAS_SEGUIDAS) {
        const status = trecho.some((p) => classificar(p) === 'Instável') ? 'Instável' : 'Regular';
        const quando = new Date(); quando.setDate(quando.getDate() + dia); quando.setHours(parseInt(lista[i].hora, 10), 0, 0, 0);
        const data = new Date(quando.getTime() - ANTECEDENCIA_MIN * 60000);
        if (data.getTime() > agora && total < 8) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Conexão ${status} prevista`,
              body: `${rotuloDia(dia)}, das ${lista[i].hora} às ${lista[j].hora}. ${STATUS[status].desc}`,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: data, channelId: 'alertas' },
          });
          total++;
        }
      }
      i = j + 1;
    }
  }
  return total;
}
