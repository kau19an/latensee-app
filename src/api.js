import AsyncStorage from '@react-native-async-storage/async-storage';

// Internet Quality API — documentação: https://internet-quality-api.onrender.com/docs
const BASE = 'https://internet-quality-api.onrender.com';
const V1 = '/api/v1';
const TIMEOUT_MS = 45000; // Render (plano grátis) pode levar quase 1 min para "acordar"

/* ============================================================
   Estado da última busca — usado nos avisos da interface
   fonte:  'api' | 'cache' (última resposta salva) | 'mock' (dados de exemplo)
   perfil: true quando a API não tem previsões para hoje e usamos o
           "perfil diário" (as 24 previsões do último dia disponível)
   base:   data (dd/mm/aaaa, UTC) do dia usado como perfil
   ============================================================ */
let info = { fonte: 'api', quando: null, perfil: false, base: null, modelo: null };
export const infoDados = () => info;

const hojeChave = () => new Date().toISOString().slice(0, 10);
const emVoo = new Map(); // evita pedir a mesma coisa várias vezes ao mesmo tempo

// Faz GET ou POST com timeout e cache do dia. Retorna { json, fonte, quando }.
// Lança erro se não houver API nem cache.
async function chamar(path, body) {
  const id = body ? `POST ${path} ${JSON.stringify(body)}` : path;
  if (emVoo.has(id)) return emVoo.get(id);
  const p = (async () => {
    const chave = `cache:${hojeChave()}:${id}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(BASE + path, {
        method: body ? 'POST' : 'GET',
        signal: ctrl.signal,
        headers: body ? { Accept: 'application/json', 'Content-Type': 'application/json' } : { Accept: 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!r.ok) { const e = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; }
      const json = await r.json();
      AsyncStorage.setItem(chave, JSON.stringify({ t: Date.now(), json })).catch(() => {});
      return { json, fonte: 'api', quando: Date.now() };
    } catch (e) {
      if (e.status && e.status < 500) throw e; // 4xx: o pedido é que está errado, cache não ajuda
      const salvo = await AsyncStorage.getItem(chave).catch(() => null);
      if (salvo) { const { t, json } = JSON.parse(salvo); return { json, fonte: 'cache', quando: t }; }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  })();
  emVoo.set(id, p);
  const limpar = () => setTimeout(() => emVoo.delete(id), 1000);
  p.then(limpar, limpar); // (não deixa rejeição "solta")
  return p;
}

/* ============================================================
   Conversões API → app
   ============================================================ */
// Regra de qualidade: a da API (decisão do grupo). GOOD/MODERATE/UNSTABLE → Boa/Regular/Instável
export const QUALIDADE = { GOOD: 'Boa', MODERATE: 'Regular', UNSTABLE: 'Instável' };
const dois = (n) => String(n).padStart(2, '0');
const dataUTC = (iso) => { const d = new Date(iso); return `${dois(d.getUTCDate())}/${dois(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`; };

// Um item da timeline → formato usado pelas telas (hora no fuso do celular)
const deTimeline = (x) => {
  const d = new Date(x.predictionFor);
  return {
    quando: x.predictionFor,          // instante UTC original (usado em /activity/check)
    h: d.getHours(),
    hora: `${dois(d.getHours())}:00`,
    latencia: Math.round(x.predictedAvgRttMs),
    perda: Math.round(x.predictedPacketLossPct * 10) / 10,
    nota: x.qualityScore,
    qualidade: QUALIDADE[x.quality] ?? null,
  };
};

// Nomes que a API não envia: cidade (pelo probe) e operadora (pelo ASN)
export const CIDADES = {
  900001: 'São Paulo', 900002: 'Rio de Janeiro', 900003: 'Belo Horizonte', 900004: 'Brasília',
  900005: 'Salvador', 900006: 'Recife', 900007: 'Fortaleza', 900008: 'Curitiba',
  900009: 'Porto Alegre', 900010: 'Manaus',
};
const OPERADORAS = { 28573: 'Claro', 7738: 'Oi', 16735: 'Algar Telecom', 18881: 'Vivo', 10429: 'Vivo (Telefônica)' };

/* ============================================================
   Dados de exemplo — só quando não há API nem cache
   ============================================================ */
const ruido = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
const exemploHora = (h) => {
  const pico = Math.exp(-((h - 20) ** 2) / 8);
  const n = ruido(h * 7);
  const latencia = Math.round(22 + 45 * pico + n * 8);
  const perda = Math.round((pico > 0.6 ? 2 + pico * 3.5 : n * 0.6) * 10) / 10;
  return { quando: null, h, hora: `${dois(h)}:00`, latencia, perda,
    nota: Math.max(0, Math.min(100, Math.round(100 - perda * 8 - latencia * 0.15))), qualidade: null };
};
const exemploDia = () => Array.from({ length: 24 }, (_, h) => exemploHora(h));

/* ============================================================
   Modelos e locais
   ============================================================ */
const MODELOS_EXEMPLO = [
  { id: 'model-a', name: 'Modelo A', groupName: 'Grupo 1', algorithm: 'Linear Regression', description: '' },
  { id: 'model-b', name: 'Modelo B', groupName: 'Grupo 2', algorithm: 'Random Forest', description: '' },
  { id: 'model-c', name: 'Modelo C', groupName: 'Grupo 3', algorithm: 'Decision Tree', description: '' },
  { id: 'model-d', name: 'Modelo D', groupName: 'Grupo 4', algorithm: 'Gradient Boosting', description: '' },
];
export async function getModelos() {
  try { return (await chamar(`${V1}/models`)).json.items; } catch (e) { return MODELOS_EXEMPLO; }
}

const LOCAIS_EXEMPLO = [
  [900001, 28573, -23.5505, -46.6333], [900002, 7738, -22.9068, -43.1729], [900003, 16735, -19.9167, -43.9345],
  [900004, 28573, -15.7975, -47.8919], [900005, 18881, -12.9714, -38.5014], [900006, 18881, -8.0476, -34.877],
  [900007, 10429, -3.7172, -38.5434], [900008, 28573, -25.4284, -49.2733], [900009, 10429, -30.0346, -51.2177],
  [900010, 7738, -3.119, -60.0217],
].map(([probeId, asnV4, latitude, longitude]) => ({ probeId, countryCode: 'BR', asnV4, location: { latitude, longitude } }));

const deLocal = (x) => ({
  id: x.probeId,
  cidade: CIDADES[x.probeId] ?? `Probe ${x.probeId}`,
  nome: `Ponto ${CIDADES[x.probeId] ?? x.probeId}`,
  local: CIDADES[x.probeId] ? `Região central de ${CIDADES[x.probeId]}` : `Probe ${x.probeId}`,
  pais: x.countryCode,
  asn: x.asnV4 ?? x.asnV6 ?? null,
  operadora: OPERADORAS[x.asnV4 ?? x.asnV6] ?? null,
  lat: x.location.latitude,
  lon: x.location.longitude,
});
export async function getLocais() {
  try { return (await chamar(`${V1}/locations`)).json.items.map(deLocal); } catch (e) { return LOCAIS_EXEMPLO.map(deLocal); }
}

// Probe mais próximo calculado NO CELULAR (Haversine) — a localização não é enviada à API
export function probeMaisProximo(locais, lat, lon) {
  const rad = (g) => (g * Math.PI) / 180;
  const dist = (p) => {
    const a = Math.sin(rad(p.lat - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(p.lat)) * Math.sin(rad(p.lon - lon) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  return locais.map((p) => ({ ...p, distanciaKm: Math.round(dist(p)) })).sort((a, b) => a.distanciaKm - b.distanciaKm)[0] ?? null;
}

/* ============================================================
   PREVISÃO: perfil de 24 horas de um probe
   1º tenta previsões reais das próximas 24h (from = agora).
   Se a API não tiver (hoje ela só tem 20/08/2026), usa o último dia
   disponível como "perfil diário", hora a hora, no fuso do celular.
   ============================================================ */
const qs = (o) => Object.entries(o).filter(([, v]) => v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

// A resposta carrega a própria origem (itens.meta), para cada tela mostrar o aviso certo
const comMeta = (itens, meta) => { info = meta; itens.meta = meta; return itens; };

export async function getPerfil({ modelo, probe }) {
  const caminho = `${V1}/forecasts/probes/${probe}/timeline`;
  try {
    const agora = new Date(); agora.setMinutes(0, 0, 0);
    const ate = new Date(agora.getTime() + 23 * 3600000);
    // Sem rede essa consulta falha (o "agora" muda a cada hora e não fica em cache): segue para o perfil salvo
    const futuro = await chamar(`${caminho}?${qs({ model_id: modelo, from: agora.toISOString(), to: ate.toISOString(), limit: 24 })}`)
      .catch(() => null);
    if (futuro?.json.items?.length) {
      const itens = futuro.json.items.map(deTimeline);
      return comMeta(itens, { fonte: futuro.fonte, quando: futuro.quando, perfil: false, base: null, modelo: futuro.json.model });
    }
    const tudo = await chamar(`${caminho}?${qs({ model_id: modelo, limit: 100 })}`);
    const ordenado = [...tudo.json.items].sort((a, b) => a.predictionFor.localeCompare(b.predictionFor));
    const ultimas = ordenado.slice(-24);
    if (!ultimas.length) throw new Error('timeline vazia');
    const porHora = new Map();
    ultimas.map(deTimeline).forEach((x) => porHora.set(x.h, x)); // uma previsão por hora do dia
    const itens = [...porHora.values()].sort((a, b) => a.h - b.h);
    return comMeta(itens, { fonte: tudo.fonte, quando: tudo.quando, perfil: true, base: dataUTC(ultimas[ultimas.length - 1].predictionFor), modelo: tudo.json.model });
  } catch (e) {
    return comMeta(exemploDia(), { fonte: 'mock', quando: null, perfil: false, base: null, modelo: null });
  }
}
// Previsão de uma hora do dia (0–23) dentro do perfil
export const naHora = (itens, h) => itens?.find((x) => x.h === h) ?? itens?.[0] ?? null;

/* ============================================================
   JANELA DE 11 DIAS: 5 dias antes, o dia central e 5 dias depois
   (a) centro = HOJE, se a API tiver previsões nessa janela;
   (c) senão, centro = ÚLTIMA data que a API tem (hoje: 20/08/2026).
   Os dias são agrupados no fuso do celular. Dias sem dado ficam vazios
   (a tela mostra "sem previsão"), nunca inventados.
   ============================================================ */
export const JANELA_DIAS = 5;
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const meiaNoite = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const somaDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const chaveDia = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
const dataBR = (d) => `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;

// A API devolve no máximo 100 itens por consulta: buscamos em blocos de 4 dias (96 horas)
async function timelineEntre(probe, modelo, de, ate) {
  const caminho = `${V1}/forecasts/probes/${probe}/timeline`;
  const itens = []; let fonte = 'api'; let quando = null;
  for (let ini = de; ini < ate; ini = somaDias(ini, 4)) {
    const fim = new Date(Math.min(somaDias(ini, 4).getTime(), ate.getTime()) - 1000);
    const r = await chamar(`${caminho}?${qs({ model_id: modelo, from: ini.toISOString(), to: fim.toISOString(), limit: 100 })}`);
    itens.push(...(r.json.items ?? []));
    if (r.fonte === 'cache') { fonte = 'cache'; quando = r.quando; }
  }
  return { itens, fonte, quando };
}

export async function getJanela({ modelo, probe }) {
  try {
    const hoje = meiaNoite(new Date());
    let centro = hoje;
    let busca = await timelineEntre(probe, modelo, somaDias(hoje, -JANELA_DIAS), somaDias(hoje, JANELA_DIAS + 1));
    let referencia = false;
    if (!busca.itens.length) {
      // Sem dados perto de hoje: o endpoint do probe devolve a última previsão disponível
      const ultima = await chamar(`${V1}/forecasts/probes/${probe}?${qs({ model_id: modelo })}`);
      centro = meiaNoite(new Date(ultima.json.prediction.predictionFor));
      busca = await timelineEntre(probe, modelo, somaDias(centro, -JANELA_DIAS), somaDias(centro, JANELA_DIAS + 1));
      referencia = true;
    }
    const porDia = new Map();
    busca.itens.map(deTimeline).forEach((x) => {
      const k = chaveDia(new Date(x.quando));
      if (!porDia.has(k)) porDia.set(k, new Map());
      porDia.get(k).set(x.h, x); // uma previsão por hora
    });
    const chaveHoje = chaveDia(hoje);
    const dias = Array.from({ length: 2 * JANELA_DIAS + 1 }, (_, i) => {
      const d = somaDias(centro, i - JANELA_DIAS);
      const k = chaveDia(d);
      const itens = [...(porDia.get(k)?.values() ?? [])].sort((a, b) => a.h - b.h);
      return {
        chave: k,
        data: dataBR(d),
        rotulo: k === chaveHoje ? 'Hoje' : `${SEMANA[d.getDay()]} ${dois(d.getDate())}/${dois(d.getMonth() + 1)}`,
        hoje: k === chaveHoje,
        itens,
      };
    });
    return {
      dias,
      centro: JANELA_DIAS,
      referencia,
      inicio: dias[0].data,
      fim: dias[dias.length - 1].data,
      centroData: dataBR(centro),
      meta: { fonte: busca.fonte, quando: busca.quando, perfil: false },
    };
  } catch (e) {
    return null; // sem API nem cache: a tela usa o perfil (ou os dados de exemplo)
  }
}

/* ============================================================
   Pontos de medição (mapa) com a previsão da hora atual
   ============================================================ */
export async function getServidores({ modelo }) {
  const locais = await getLocais();
  const h = new Date().getHours();
  const comPrevisao = await Promise.all(locais.map(async (l) => {
    const itens = await getPerfil({ modelo, probe: l.id });
    return { ...l, ...naHora(itens, h), fonte: itens.meta.fonte, meta: itens.meta };
  }));
  comPrevisao.meta = comPrevisao.find((x) => x.fonte === 'mock')?.meta ?? comPrevisao[0]?.meta ?? null;
  return comPrevisao;
}

/* ============================================================
   ATIVIDADES — POST /activity/check
   Enviamos as coordenadas do PROBE (não as do usuário) e o instante
   exato da previsão. Retorna { [codigo]: true/false } + recomendação.
   ============================================================ */
export async function checarAtividades({ modelo, local, item, codigos }) {
  if (!item?.quando || !local) return null; // dados de exemplo: a tela usa a regra local
  try {
    const res = await Promise.all(codigos.map((activity) => chamar(`${V1}/activity/check`, {
      modelId: modelo, latitude: local.lat, longitude: local.lon, dateTime: item.quando, activity,
    })));
    const adequado = {};
    res.forEach((r, i) => { adequado[codigos[i]] = r.json.suitable; });
    const r0 = res[0]?.json;
    return { adequado, recomendacao: r0?.recommendation ?? null, aviso: r0?.metadata?.disclaimer ?? null };
  } catch (e) {
    return null;
  }
}

/* ============================================================
   Comparação dos modelos: o MESMO instante previsto por todos os modelos ativos
   (GET /forecasts/probes/{id}/compare). A API não diz qual modelo é melhor.
   ============================================================ */
export async function getComparacao({ probe, quando }) {
  const q = quando ? `?prediction_for=${encodeURIComponent(quando)}` : '';
  try {
    const { json, fonte } = await chamar(`${V1}/forecasts/probes/${probe}/compare${q}`);
    const d = new Date(json.predictionFor);
    return {
      fonte,
      hora: `${dois(d.getHours())}:00`,
      base: dataUTC(json.predictionFor),
      modelos: json.models.map((m) => ({
        id: m.modelId,
        nome: m.modelName,
        latencia: Math.round(m.predictedAvgRttMs),
        perda: Math.round(m.predictedPacketLossPct * 10) / 10,
        qualidade: QUALIDADE[m.quality] ?? null,
      })),
    };
  } catch (e) {
    return null;
  }
}

/* ============================================================
   Status do servidor da API (GET /health), sem cache: mede o tempo de resposta.
   Retorna { estado: 'online' | 'lento' | 'fora', ms }
   'lento' = respondeu, mas demorou mais de 5 s (servidor gratuito "acordando")
   ============================================================ */
export async function verificarAPI() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}${V1}/health?t=${t0}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    const ms = Date.now() - t0;
    const json = r.ok ? await r.json() : null;
    if (json?.status !== 'ok') return { estado: 'fora', ms };
    return { estado: ms > 5000 ? 'lento' : 'online', ms };
  } catch (e) {
    return { estado: 'fora', ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}
