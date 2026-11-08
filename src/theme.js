import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Paletas roxas com contraste >= 4.5:1 para texto e >= 3:1 para elementos gráficos, como a borda/switch desligado (RNF04)
// Claro = branco + roxo · Escuro = preto + roxo
export const PALETAS = {
  claro: {
    dark: false,
    bg: '#FFFFFF', card: '#F4F0FB', text: '#14101F', sub: '#5B5270',
    primary: '#6D28D9',   // fundo de botões (branco por cima: 7,1:1)
    accent: '#6D28D9',    // ícones e textos roxos sobre o fundo
    onPrimary: '#FFFFFF',
    border: '#857A9E', grid: '#E4DCF2', area: 'rgba(109,40,217,0.12)',
    boa: '#0B6B2E', regular: '#8A5A00', instavel: '#B3261E',
  },
  escuro: {
    dark: true,
    bg: '#000000', card: '#15101F', text: '#F5F3FF', sub: '#B8AECF',
    primary: '#7C3AED',   // branco por cima: 5,7:1
    accent: '#B794F6',    // sobre preto: 8,9:1
    onPrimary: '#FFFFFF',
    border: '#7A6A99', grid: '#2A2140', area: 'rgba(183,148,246,0.16)',
    boa: '#4ADE80', regular: '#FBBF24', instavel: '#F87171',
  },
};

// Tema: 'sistema' | 'claro' | 'escuro' — salvo no aparelho
const ThemeCtx = createContext({ c: PALETAS.claro, pref: 'sistema', setPref: () => {}, pronto: false });
export function ThemeProvider({ children }) {
  const sistema = useColorScheme();
  const [pref, setPrefState] = useState('sistema');
  // "pronto": só desenhamos o app depois de ler o tema salvo — evita piscar o tema do sistema ao abrir
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('tema').then((v) => v && setPrefState(v)).catch(() => {}).finally(() => setPronto(true));
  }, []);
  const setPref = (v) => { setPrefState(v); AsyncStorage.setItem('tema', v); };
  const modo = pref === 'sistema' ? (sistema === 'dark' ? 'escuro' : 'claro') : pref;
  const value = useMemo(() => ({ c: PALETAS[modo], pref, setPref, pronto }), [modo, pref, pronto]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);

// Status SEMPRE com texto + ícone (RNF03). "cor" é a chave da paleta.
export const STATUS = {
  Boa:        { cor: 'boa',      icon: 'checkmark-circle', desc: 'Sua conexão está ótima e estável.' },
  Regular:    { cor: 'regular',  icon: 'alert-circle',     desc: 'Dá para usar, mas pode haver lentidão.' },
  'Instável': { cor: 'instavel', icon: 'close-circle',     desc: 'Conexão oscilando. Evite atividades importantes.' },
};
// Classificação: decisão do grupo = usar a regra da API (campo "quality": GOOD/MODERATE/UNSTABLE).
// Só quando não há dado da API (dados de exemplo) usamos uma APROXIMAÇÃO dessa regra, pela perda,
// observada na timeline real dos 4 modelos: abaixo de 1% = Boa · de 1% a 5% = Regular · a partir de 5% = Instável.
// (Regra antiga do app, registrada como "da professora": perda 0,5/2 % e jitter 20/50 ms — a API não tem jitter.)
export function classificar(p) {
  if (p?.qualidade) return p.qualidade;
  const perda = p?.perda ?? 0;
  if (perda >= 5) return 'Instável';
  if (perda >= 1) return 'Regular';
  return 'Boa';
}
// RQ03 — atividades por categoria, em linguagem simples
// api: código do POST /activity/check · ok: regra local (usada no "melhor horário" e sem API)
// Jogos online não existe na API: usamos o resultado de Videochamada (a atividade mais exigente) — "estimativa do app"
export const ATIVIDADES = [
  { nome: 'Videochamadas',     icon: 'videocam',        api: 'VIDEO_CALL',   ok: ['Boa'] },
  { nome: 'Chamadas de voz',   icon: 'call',            api: 'AUDIO_CALL',   ok: ['Boa', 'Regular'] },
  { nome: 'Jogos online',      icon: 'game-controller', api: 'VIDEO_CALL',   ok: ['Boa'], estimativa: true },
  { nome: 'Streaming',         icon: 'play-circle',     api: 'STREAMING',    ok: ['Boa', 'Regular'] },
  { nome: 'Navegação',         icon: 'globe',           api: 'WEB_BROWSING', ok: ['Boa', 'Regular', 'Instável'] },
  { nome: 'Envio de arquivos', icon: 'cloud-upload',    api: 'FILE_UPLOAD',  ok: ['Boa', 'Regular'] },
  { nome: 'Mensagens',         icon: 'chatbubbles',     api: 'MESSAGING',    ok: ['Boa', 'Regular', 'Instável'] },
];
export const CODIGOS_ATIVIDADE = [...new Set(ATIVIDADES.map((a) => a.api))];
// Melhor horário para uma atividade: menor latência entre os horários que servem para ela
export function melhorHorario(lista, nomeAtividade, aPartirDe = 0) {
  const a = ATIVIDADES.find((x) => x.nome === nomeAtividade);
  if (!a || !lista) return null;
  return lista
    .filter((p) => parseInt(p.hora, 10) >= aPartirDe && a.ok.includes(classificar(p)))
    .sort((x, y) => x.latencia - y.latencia)[0] || null;
}
// RNF07 — glossário
export const GLOSSARIO = {
  'Latência': 'Tempo que a informação leva para ir e voltar (RTT). Quanto menor, melhor.',
  'Perda de pacotes': 'Parte dos dados que se perde no caminho e precisa ser reenviada.',
  'Jitter': 'Quanto a latência oscila de um instante para outro. Alto = conexão "pulando", ruim para chamadas e jogos. Os modelos de previsão da API não informam jitter; ele aparece na medição real ("Medir minha conexão agora").',
  'Nota de qualidade': 'Nota de 0 a 100 calculada pela API a partir da latência e da perda previstas. Quanto maior, melhor.',
  'Ponto de medição (probe)': 'Equipamento da rede RIPE Atlas usado como referência da sua região. A previsão é dele, não do seu celular.',
  'Modelo de previsão': 'Cada grupo da turma treinou um modelo diferente. Você escolhe qual usar em Ajustes.',
};

// Rótulos dos dias da previsão (hoje + 5 dias)
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const DIAS_PREVISAO = 5;
export function rotuloDia(n) {
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  const d = new Date(); d.setDate(d.getDate() + n);
  return `${SEMANA[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
