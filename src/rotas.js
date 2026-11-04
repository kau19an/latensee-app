import AsyncStorage from '@react-native-async-storage/async-storage';

// Detecta mudança de rota (ideia do material da profa.): o RTT muda muito (> 3 desvios padrão),
// mas perda e jitter continuam baixos => o caminho mudou, não é falha. Aí recalibra o baseline.
const MIN_AMOSTRAS = 10, MAX_AMOSTRAS = 50, DIAS_AVISO = 1;

export async function analisarRota(s) {
  const chave = `rota:${s.id}`;
  let est = { amostras: [], aviso: null };
  try { est = { ...est, ...JSON.parse(await AsyncStorage.getItem(chave)) }; } catch (e) { /* começa do zero */ }

  const am = est.amostras;
  if (am.length >= MIN_AMOSTRAS) {
    const media = am.reduce((a, v) => a + v, 0) / am.length;
    const dp = Math.sqrt(am.reduce((a, v) => a + (v - media) ** 2, 0) / am.length);
    const limite = 3 * Math.max(dp, 2); // piso de 2 ms, para não disparar por ruído
    if (Math.abs(s.latencia - media) > limite && s.perda <= 0.5 && s.jitter <= 20) {
      est = { amostras: [s.latencia], aviso: { de: Math.round(media), para: s.latencia, quando: Date.now() } };
    } else { am.push(s.latencia); }
  } else { am.push(s.latencia); }
  if (est.amostras.length > MAX_AMOSTRAS) est.amostras.shift();

  AsyncStorage.setItem(chave, JSON.stringify(est)).catch(() => {});
  return avisoValido(est.aviso);
}
const avisoValido = (a) => (a && Date.now() - a.quando < DIAS_AVISO * 86400000 ? a : null);
export async function lerAvisoRota(id) {
  try { return avisoValido(JSON.parse(await AsyncStorage.getItem(`rota:${id}`)).aviso); } catch (e) { return null; }
}
