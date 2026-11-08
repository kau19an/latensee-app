import AsyncStorage from '@react-native-async-storage/async-storage';

/* ============================================================
   MEDIÇÃO REAL DA CONEXÃO (projeto 2 — branch feat/medicao-real)
   Diferente da previsão (que vem da API e é do ponto de medição da região),
   aqui o próprio celular mede a SUA conexão, agora.

   Como mede: faz AMOSTRAS requisições HTTP pequenas a um servidor e cronometra.
   - Latência = média dos tempos de resposta (ida e volta)
   - Jitter   = média da diferença entre um tempo e o seguinte (quanto "oscila")
   - Perda    = % de requisições que falharam ou passaram de TIMEOUT_MS
   A 1ª requisição é descartada (aquecimento: inclui DNS e abertura da conexão segura).

   Limitação: não é um ping de verdade (ICMP, como o RIPE Atlas faz). Por HTTP o tempo
   inclui um pouco de processamento do servidor, então tende a sair um pouco maior.
   ============================================================ */

// Servidor de teste: endpoint do Google feito para checar conexão. Responde vazio (HTTP 204)
// e tem servidores no Brasil — mais representativo da sua internet do que a API (que fica no exterior).
export const ALVO = { url: 'https://www.google.com/generate_204', nome: 'servidor de teste do Google' };
export const AMOSTRAS = 20;     // cada requisição perdida = 5% de perda
const TIMEOUT_MS = 3000;
const PAUSA_MS = 150;
const CHAVE = 'ultimaMedicao';

const agoraMs = () => globalThis.performance?.now?.() ?? Date.now();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const media = (xs) => xs.reduce((a, v) => a + v, 0) / xs.length;
const dois = (n) => String(n).padStart(2, '0');

// Uma requisição: retorna o tempo em ms, ou null se falhou/expirou
async function umaRequisicao() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = agoraMs();
  try {
    const r = await fetch(`${ALVO.url}?t=${Date.now()}`, { // ?t= evita resposta guardada em cache
      method: 'GET', signal: ctrl.signal, cache: 'no-store', headers: { 'Cache-Control': 'no-cache' },
    });
    if (!r.ok) return null;
    return agoraMs() - t0;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Cálculo separado da rede, para poder testar: tempos (ms) das requisições que deram certo + quantas foram feitas
export function calcularMedicao(tempos, total) {
  if (!tempos.length) return null;
  const variacoes = tempos.slice(1).map((t, i) => Math.abs(t - tempos[i]));
  return {
    latencia: Math.round(media(tempos)),
    jitter: variacoes.length ? Math.round(media(variacoes)) : 0,
    perda: Math.round(((total - tempos.length) / total) * 1000) / 10,
  };
}

// aoProgredir(feitas, total) é chamado a cada requisição (para a barra de progresso)
export async function medirConexao({ aoProgredir } = {}) {
  await umaRequisicao(); // aquecimento, descartado
  const tempos = [];
  for (let i = 0; i < AMOSTRAS; i++) {
    const t = await umaRequisicao();
    if (t != null) tempos.push(t);
    aoProgredir?.(i + 1, AMOSTRAS);
    if (i < AMOSTRAS - 1) await esperar(PAUSA_MS);
  }
  const r = calcularMedicao(tempos, AMOSTRAS);
  if (!r) return { erro: 'sem-conexao' };
  const d = new Date();
  const resultado = { ...r, amostras: AMOSTRAS, quando: d.getTime(), h: d.getHours(), hora: `${dois(d.getHours())}:00`, alvo: ALVO.nome };
  AsyncStorage.setItem(CHAVE, JSON.stringify(resultado)).catch(() => {});
  return resultado;
}

export async function lerUltimaMedicao() {
  try { return JSON.parse(await AsyncStorage.getItem(CHAVE)); } catch (e) { return null; }
}
