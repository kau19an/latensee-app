import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Paletas roxas com contraste >= 4.5:1 para texto (RNF04)
// Claro = branco + roxo · Escuro = preto + roxo
export const PALETAS = {
  claro: {
    dark: false,
    bg: '#FFFFFF', card: '#F4F0FB', text: '#14101F', sub: '#5B5270',
    primary: '#6D28D9',   // fundo de botões (branco por cima: 7,1:1)
    accent: '#6D28D9',    // ícones e textos roxos sobre o fundo
    onPrimary: '#FFFFFF',
    border: '#A79BC0', grid: '#E4DCF2', area: 'rgba(109,40,217,0.12)',
    boa: '#0B6B2E', regular: '#8A5A00', instavel: '#B3261E',
  },
  escuro: {
    dark: true,
    bg: '#000000', card: '#15101F', text: '#F5F3FF', sub: '#B8AECF',
    primary: '#7C3AED',   // branco por cima: 5,7:1
    accent: '#B794F6',    // sobre preto: 8,9:1
    onPrimary: '#FFFFFF',
    border: '#4C3D66', grid: '#2A2140', area: 'rgba(183,148,246,0.16)',
    boa: '#4ADE80', regular: '#FBBF24', instavel: '#F87171',
  },
};

// Tema: 'sistema' | 'claro' | 'escuro' — salvo no aparelho
const ThemeCtx = createContext({ c: PALETAS.claro, pref: 'sistema', setPref: () => {} });
export function ThemeProvider({ children }) {
  const sistema = useColorScheme();
  const [pref, setPrefState] = useState('sistema');
  useEffect(() => { AsyncStorage.getItem('tema').then((v) => v && setPrefState(v)); }, []);
  const setPref = (v) => { setPrefState(v); AsyncStorage.setItem('tema', v); };
  const modo = pref === 'sistema' ? (sistema === 'dark' ? 'escuro' : 'claro') : pref;
  const value = useMemo(() => ({ c: PALETAS[modo], pref, setPref }), [modo, pref]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);

// Status SEMPRE com texto + ícone (RNF03). "cor" é a chave da paleta.
export const STATUS = {
  Boa:        { cor: 'boa',      icon: 'checkmark-circle', desc: 'Sua conexão está ótima e estável.' },
  Regular:    { cor: 'regular',  icon: 'alert-circle',     desc: 'Dá para usar, mas pode haver lentidão.' },
  'Instável': { cor: 'instavel', icon: 'close-circle',     desc: 'Conexão oscilando. Evite atividades importantes.' },
};
// Regras da professora: perda 0.5/2 %, jitter 20/50 ms
export function classificar({ perda = 0, jitter = 0 }) {
  if (perda > 2 || jitter > 50) return 'Instável';
  if (perda >= 0.5 || jitter >= 20) return 'Regular';
  return 'Boa';
}
// RQ03 — atividades por categoria, em linguagem simples
export const ATIVIDADES = [
  { nome: 'Videochamadas', icon: 'videocam',     ok: ['Boa'] },
  { nome: 'Jogos online',  icon: 'game-controller', ok: ['Boa'] },
  { nome: 'Streaming',     icon: 'play-circle',  ok: ['Boa', 'Regular'] },
  { nome: 'Navegação',     icon: 'globe',        ok: ['Boa', 'Regular', 'Instável'] },
  { nome: 'Envio de arquivos', icon: 'cloud-upload', ok: ['Boa', 'Regular'] },
];
// RNF07 — glossário
export const GLOSSARIO = {
  'Latência': 'Tempo que a informação leva para ir e voltar (RTT). Quanto menor, melhor.',
  'Jitter': 'Quanto a latência oscila de um instante para outro. Alto = conexão "pulando".',
  'Perda de pacotes': 'Parte dos dados que se perde no caminho e precisa ser reenviada.',
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
