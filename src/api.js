// Ajuste BASE e os caminhos conforme https://internet-quality-api.onrender.com/docs
const BASE = 'https://internet-quality-api.onrender.com';

async function get(path, fallback) {
  try {
    const r = await fetch(BASE + path);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    return fallback; // mock quando a API estiver fora/dormindo (Render free)
  }
}

/* ---------- PREVISÃO (hoje + até 5 dias) ---------- */
// Mock determinístico: pico de uso à noite, variando um pouco a cada dia
const ruido = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
const prevHora = (h, dia = 0) => {
  const pico = Math.exp(-((h - 20) ** 2) / 8);          // horário de pico ~20h
  const fatorDia = 1 + 0.35 * ((dia * 7) % 3) / 2;      // alguns dias piores que outros
  const n = ruido(dia * 31 + h * 7);
  return {
    dia,
    hora: `${String(h).padStart(2, '0')}:00`,
    latencia: Math.round(22 + 45 * pico * fatorDia + n * 8),
    jitter: Math.round(6 + 40 * pico * fatorDia + n * 5),
    perda: Math.round((pico * fatorDia > 0.9 ? 1.2 + n * 1.5 : n * 0.3) * 10) / 10,
  };
};

export const getPrevisao = (h, dia = 0) => get(`/predict?hour=${h}&days_ahead=${dia}`, prevHora(h, dia));
export const getPrevisaoDia = (dia = 0) =>
  get(`/forecast?days_ahead=${dia}`, Array.from({ length: 24 }, (_, h) => prevHora(h, dia)));
export const getHistorico = () => get('/history', Array.from({ length: 24 }, (_, h) => prevHora(h)));

/* ---------- PONTOS DE MEDIÇÃO (mapa) ---------- */
// Quando a API mandar só o nome da cidade, usamos o marco central dela.
export const PONTOS_CIDADE = {
  'São Paulo':      { local: 'Praça da Sé (Marco Zero)', lat: -23.55052, lon: -46.633308 },
  'Rio de Janeiro': { local: 'Praça XV de Novembro',     lat: -22.90278, lon: -43.17389 },
  'Belo Horizonte': { local: 'Praça Sete de Setembro',   lat: -19.91910, lon: -43.93860 },
  'Brasília':       { local: 'Praça dos Três Poderes',   lat: -15.79970, lon: -47.86110 },
  'Curitiba':       { local: 'Praça Tiradentes',         lat: -25.42960, lon: -49.27130 },
};
// Aceita lat/lon com nomes diferentes (lat/latitude, lon/lng/longitude)
function comLocal(x) {
  const lat = x.lat ?? x.latitude;
  const lon = x.lon ?? x.lng ?? x.longitude;
  if (lat != null && lon != null) return { ...x, lat: Number(lat), lon: Number(lon) };
  const p = PONTOS_CIDADE[x.cidade];
  return p ? { ...p, ...x, lat: p.lat, lon: p.lon, local: x.local ?? p.local } : x;
}

export const getServidores = () => get('/servers', [
  { id: 1, nome: 'Ponto São Paulo', ip: 'sp.latensee', cidade: 'São Paulo', rota: 'Sua casa ⇄ São Paulo', latencia: 18, jitter: 4, perda: 0 },
  { id: 2, nome: 'Ponto Rio de Janeiro', ip: 'rj.latensee', cidade: 'Rio de Janeiro', rota: 'Sua casa ⇄ Rio de Janeiro', latencia: 26, jitter: 9, perda: 0.2 },
  { id: 3, nome: 'Google DNS', ip: '8.8.8.8', rota: 'Brasil ⇄ EUA', latencia: 132, jitter: 6, perda: 0 },
  { id: 4, nome: 'Gateway local', ip: '192.168.0.1', rota: 'Rede local', latencia: 2, jitter: 1, perda: 0 },
]).then((lista) => lista.map(comLocal));
