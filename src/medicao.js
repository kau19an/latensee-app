import AsyncStorage from '@react-native-async-storage/async-storage';
import { classificar } from './theme';

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

// Histórico (fila): a medição mais nova entra no início e a mais antiga sai quando passa de HIST_MAX
const CHAVE_HIST = 'historicoMedicoes';
export const HIST_MAX = 50;
export async function lerHistorico() {
  try { return JSON.parse(await AsyncStorage.getItem(CHAVE_HIST)) ?? []; } catch (e) { return []; }
}
async function guardarNoHistorico(m) {
  const lista = [m, ...(await lerHistorico())].slice(0, HIST_MAX);
  await AsyncStorage.setItem(CHAVE_HIST, JSON.stringify(lista)).catch(() => {});
}
export const limparHistorico = () => AsyncStorage.removeItem(CHAVE_HIST).catch(() => {});

// Indicadores do histórico (agregação): média de latência, % de medições Instável e total
export function resumoHistorico(lista) {
  const ok = lista.filter((m) => m.latencia != null);
  return {
    total: lista.length,
    latenciaMedia: ok.length ? Math.round(media(ok.map((m) => m.latencia))) : null,
    perdaMedia: lista.length ? Math.round(media(lista.map((m) => m.perda)) * 10) / 10 : null,
    instaveis: lista.filter((m) => m.status === 'Instável').length,
  };
}

// Medição automática (só com o app aberto): preferências
const CHAVE_AUTO = 'medicaoAuto';
export const INTERVALOS_MIN = [5, 15, 30];
export const AUTO_PADRAO = { ligado: false, intervalo: 5 };
export async function lerAuto() {
  try { return { ...AUTO_PADRAO, ...JSON.parse(await AsyncStorage.getItem(CHAVE_AUTO)) }; } catch (e) { return AUTO_PADRAO; }
}
export const salvarAuto = (a) => AsyncStorage.setItem(CHAVE_AUTO, JSON.stringify(a)).catch(() => {});

// aoProgredir(feitas, total) é chamado a cada requisição (para a barra de progresso)
// origem: 'manual' (botão) ou 'auto' (medição automática). Toda medição vai para o histórico,
// inclusive as que falham por completo (registradas como 100% de perda).
export async function medirConexao({ aoProgredir, origem = 'manual' } = {}) {
  await umaRequisicao(); // aquecimento, descartado
  const tempos = [];
  for (let i = 0; i < AMOSTRAS; i++) {
    const t = await umaRequisicao();
    if (t != null) tempos.push(t);
    aoProgredir?.(i + 1, AMOSTRAS);
    if (i < AMOSTRAS - 1) await esperar(PAUSA_MS);
  }
  const d = new Date();
  const base = { amostras: AMOSTRAS, quando: d.getTime(), h: d.getHours(), hora: `${dois(d.getHours())}:00`, alvo: ALVO.nome, origem };
  const r = calcularMedicao(tempos, AMOSTRAS);
  if (!r) {
    await guardarNoHistorico({ ...base, latencia: null, jitter: null, perda: 100, status: 'Instável', falhou: true });
    return { erro: 'sem-conexao' };
  }
  const resultado = { ...base, ...r, status: classificar(r) };
  AsyncStorage.setItem(CHAVE, JSON.stringify(resultado)).catch(() => {});
  await guardarNoHistorico(resultado);
  return resultado;
}

export async function lerUltimaMedicao() {
  try { return JSON.parse(await AsyncStorage.getItem(CHAVE)); } catch (e) { return null; }
}
