import AsyncStorage from '@react-native-async-storage/async-storage';

// Detecta mudança de rota (ideia do material da profa.): o RTT muda muito (> 3 desvios padrão),
// mas perda e jitter continuam baixos => o caminho mudou, não é falha. Aí recalibra o baseline.
const MIN_AMOSTRAS = 10, MAX_AMOSTRAS = 50, DIAS_AVISO = 1;

// A previsão muda ao longo do dia (pico à noite). Para não confundir isso com troca de rota,
// cada probe guarda um histórico POR HORA: só comparamos 21h com 21h, por exemplo.
export async function analisarRota(s) {
  const chave = `rota:${s.id}:${s.hora ?? 'x'}`;
  let est = { amostras: [], aviso: null };
  try { est = { ...est, ...JSON.parse(await AsyncStorage.getItem(chave)) }; } catch (e) { /* começa do zero */ }

  const am = est.amostras;
  if (am.length >= MIN_AMOSTRAS) {
    const media = am.reduce((a, v) => a + v, 0) / am.length;
    const dp = Math.sqrt(am.reduce((a, v) => a + (v - media) ** 2, 0) / am.length);
    const limite = 3 * Math.max(dp, 2); // piso de 2 ms, para não disparar por ruído
    // "Conexão saudável": a API não tem jitter, então vale a perda baixa (e o jitter só se existir)
    const saudavel = s.perda <= 0.5 && (s.jitter == null || s.jitter <= 20);
    if (Math.abs(s.latencia - media) > limite && saudavel) {
      est = { amostras: [s.latencia], aviso: { de: Math.round(media), para: s.latencia, quando: Date.now() } };
    } else { am.push(s.latencia); }
  } else { am.push(s.latencia); }
  if (est.amostras.length > MAX_AMOSTRAS) est.amostras.shift();

  AsyncStorage.setItem(chave, JSON.stringify(est)).catch(() => {});
  return avisoValido(est.aviso);
}
const avisoValido = (a) => (a && Date.now() - a.quando < DIAS_AVISO * 86400000 ? a : null);
export async function lerAvisoRota(id, hora) {
  try { return avisoValido(JSON.parse(await AsyncStorage.getItem(`rota:${id}:${hora ?? 'x'}`)).aviso); } catch (e) { return null; }
}
