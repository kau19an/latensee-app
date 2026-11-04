import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useGlass, IOS } from './plataforma';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme, STATUS, classificar, rotuloDia, DIAS_PREVISAO } from './theme';

// Escala da fonte do sistema (1 = padrão). Reativo: atualiza se o usuário mudar o tamanho do texto.
export const useEscalaFonte = () => useWindowDimensions().fontScale || 1;
// Largura mínima que cresce com a fonte: com texto grande os itens descem para a linha de baixo
// em vez de cortar a palavra no meio (RNF05)
export const useBase = (pontos) => Math.round(pontos * useEscalaFonte());

const useS = () => {
  const { c } = useTheme();
  return [useMemo(() => estilos(c), [c]), c];
};

// center = conteúdo centralizado na vertical e horizontal (introdução)
export const Screen = ({ children, center }) => {
  const [s] = useS();
  return (
    // iOS: "automatic" desvia do título grande, da barra de navegação e da barra de abas translúcidas
    <ScrollView style={s.screen} contentContainerStyle={[s.screenC, center && s.screenCenter]}
      contentInsetAdjustmentBehavior={IOS ? 'automatic' : undefined}>{children}</ScrollView>
  );
};
export const H = ({ children, style }) => { const [s] = useS(); return <Text accessibilityRole="header" style={[s.h, style]}>{children}</Text>; };
// Título principal da tela: no iOS quem mostra é o título grande nativo da barra; no Android, a própria tela
export const TituloTela = ({ children }) => (IOS ? null : <H>{children}</H>);
export const P = ({ children, style }) => { const [s] = useS(); return <Text style={[s.p, style]}>{children}</Text>; };
export const Card = ({ children, style }) => { const [s] = useS(); return <View style={[s.card, style]}>{children}</View>; };

// Área mínima 48x48 (RNF09)
export const Btn = ({ label, onPress, icon, kind = 'primary', hint }) => {
  const [s, c] = useS();
  const glass = useGlass();
  const ghost = kind === 'ghost';
  const botao = (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
      style={[s.btn, ghost && s.ghost, glass && s.btnGlass]}>
      {icon && <Ionicons name={icon} size={22} color={ghost ? c.accent : c.onPrimary} />}
      <Text style={[s.btnT, { flexShrink: 1, textAlign: 'center' }, ghost && { color: c.accent }]}>{label}</Text>
    </Pressable>
  );
  if (!glass) return botao;
  // iOS 26+: vidro. Primário = vidro roxo · Ghost = vidro neutro
  return (
    <GlassView isInteractive tintColor={ghost ? undefined : c.primary} style={{ borderRadius: 24 }}>
      {botao}
    </GlassView>
  );
};
export const Row = ({ icon, label, value, onPress }) => {
  const [s, c] = useS();
  // Fonte grande: o valor desce para baixo do nome (e, em tamanhos de acessibilidade, o ícone vai para cima),
  // para nenhuma palavra ser cortada no meio (RNF05)
  const escala = useEscalaFonte();
  const empilha = escala >= 1.3;
  const enorme = escala >= 2;
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={[s.row, enorme && { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
      {icon && <Ionicons name={icon} size={24} color={c.accent} />}
      <View style={{ flex: enorme ? 0 : 1, alignSelf: 'stretch', justifyContent: 'center',
        flexDirection: empilha ? 'column' : 'row', alignItems: empilha ? 'flex-start' : 'center', gap: empilha ? 2 : 12 }}>
        <Text style={[s.p, { flex: empilha ? 0 : 1 }]}>{label}</Text>
        {value ? <Text style={[s.p, { color: c.sub, flexShrink: 1, maxWidth: empilha ? undefined : '45%', textAlign: empilha ? 'left' : 'right' }]}>{value}</Text> : null}
      </View>
      {onPress && !enorme && <Ionicons name="chevron-forward" size={20} color={c.sub} />}
    </Pressable>
  );
};
// Aviso quando a previsão não veio direto do servidor (texto + ícone, RNF03)
export const AvisoDados = ({ info }) => {
  const [s, c] = useS();
  if (!info || info.fonte === 'api') return null;
  const hora = info.quando ? new Date(info.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  const msg = info.fonte === 'cache'
    ? `Sem conexão com o servidor. Mostrando a última previsão salva (às ${hora}).`
    : 'Sem conexão com o servidor. Mostrando dados de exemplo.';
  return (
    <View accessible accessibilityLiveRegion="polite" accessibilityLabel={msg}
      style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: c.border }}>
      <Ionicons name="cloud-offline" size={22} color={c.accent} />
      <Text style={[s.p, { flex: 1, fontSize: 14 }]}>{msg}</Text>
    </View>
  );
};
// Aviso de mudança de rota (RTT mudou muito, mas jitter e perda continuam baixos)
export const AvisoRota = ({ aviso }) => {
  const [s, c] = useS();
  if (!aviso) return null;
  const msg = `Rota alterada: a latência mudou de ${aviso.de} ms para ${aviso.para} ms, mas a conexão continua saudável. Provavelmente o caminho até o servidor mudou.`;
  return (
    <View accessible accessibilityLabel={msg}
      style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: c.card, borderRadius: 12, padding: 12, borderWidth: 2, borderColor: c.accent }}>
      <Ionicons name="git-branch" size={22} color={c.accent} />
      <Text style={[s.p, { flex: 1, fontSize: 14 }]}>{msg}</Text>
    </View>
  );
};
export const Badge = ({ status, big, center }) => {
  const [s, c] = useS();
  const st = STATUS[status]; const cor = c[st.cor];
  return (
    <View accessible accessibilityLabel={`Conexão ${status}`} style={[s.badge, { borderColor: cor }, center && { alignSelf: 'center' }]}>
      <Ionicons name={st.icon} size={big ? 40 : 22} color={cor} />
      <Text style={{ color: cor, fontSize: big ? 32 : 18, fontWeight: '700' }}>{status}</Text>
    </View>
  );
};
export const Metric = ({ label, value, unit, center }) => {
  const [s] = useS();
  // center = métricas lado a lado (Início/Velocidade). Só aí a largura mínima vale;
  // nas telas de detalhe elas ficam em coluna e flexBasis viraria altura fixa.
  const base = useBase(100);
  return (
    <View style={[s.metric, center && { flexBasis: base, alignItems: 'center' }]} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <Text style={s.mv}>{value}<Text style={s.mu}> {unit}</Text></Text>
      <Text style={s.p}>{label}</Text>
    </View>
  );
};

// Grupo de "pílulas" selecionáveis (períodos, dias, pontos do mapa)
export const Chips = ({ items, sel, onSel, scroll, center, label }) => {
  const [s, c] = useS();
  const conteudo = items.map((n, k) => (
    <Pressable key={n} onPress={() => { Haptics.selectionAsync().catch(() => {}); onSel(k); }} accessibilityRole="tab" accessibilityState={{ selected: sel === k }}
      accessibilityLabel={label ? `${label}: ${n}` : n}
      style={[s.chip, { backgroundColor: sel === k ? c.primary : c.card }]}>
      <Text style={{ color: sel === k ? c.onPrimary : c.text, fontWeight: '700', fontSize: 15 }}>{n}</Text>
    </Pressable>
  ));
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist"
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}>{conteudo}</ScrollView>
    );
  }
  return <View accessibilityRole="tablist" style={[s.chips, center && { justifyContent: 'center' }]}>{conteudo}</View>;
};

// Hoje + 5 dias
export const DIAS = Array.from({ length: DIAS_PREVISAO + 1 }, (_, n) => rotuloDia(n));
export const DayPicker = ({ dia, onDia }) => <Chips items={DIAS} sel={dia} onSel={onDia} scroll label="Dia da previsão" />;

/* ---------- GRÁFICO DE PREVISÃO (latência por hora, ponto colorido pelo status) ---------- */
const ALT = 220, PD = 12, PT = 14;
export function ForecastChart({ data, sel, onSel }) {
  const [, c] = useS();
  const [w, setW] = useState(0);
  const fs = Math.round(11 * Math.min(useEscalaFonte(), 2)); // RNF05: texto do SVG acompanha a fonte do sistema
  const PE = Math.round(fs * 3.6), PB = fs + 17;
  const n = data.length;
  const maior = Math.max(...data.map((d) => d.latencia), 0);
  const passo = maior > 160 ? 50 : maior > 80 ? 25 : 20; // números redondos no eixo
  const max = Math.max(passo * 2, Math.ceil(maior / passo) * passo);
  const larg = Math.max(0, w - PE - PD), alt = ALT - PT - PB;
  const x = (i) => PE + (n <= 1 ? 0 : (i * larg) / (n - 1));
  const y = (v) => PT + alt - (v / max) * alt;
  const linha = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.latencia).toFixed(1)}`).join(' ');
  const area = n ? `${linha} L${x(n - 1)},${PT + alt} L${x(0)},${PT + alt} Z` : '';
  const ticks = Array.from({ length: max / passo + 1 }, (_, k) => k * passo);

  // Toque/arraste no gráfico escolhe a hora mais próxima
  const escolher = (e) => {
    if (!n || !larg) return;
    const i = Math.round(((e.nativeEvent.locationX - PE) / larg) * (n - 1));
    onSel(Math.min(n - 1, Math.max(0, i)));
  };
  const melhor = data.reduce((a, d) => (!a || d.latencia < a.latencia ? d : a), null);
  const pior = data.reduce((a, d) => (!a || d.latencia > a.latencia ? d : a), null);

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={escolher} onResponderMove={escolher}
      accessible accessibilityRole="image"
      accessibilityLabel={melhor ? `Gráfico de latência prevista. Menor às ${melhor.hora} com ${melhor.latencia} milissegundos, maior às ${pior.hora} com ${pior.latencia} milissegundos.` : 'Gráfico de latência prevista'}
      style={{ height: ALT }}>
      {w > 0 && (
        <Svg width={w} height={ALT}>
          {ticks.map((t) => (
            <React.Fragment key={t}>
              <Line x1={PE} x2={w - PD} y1={y(t)} y2={y(t)} stroke={c.grid} strokeWidth={1} />
              <SvgText x={PE - 6} y={y(t) + 4} fontSize={fs} fill={c.sub} textAnchor="end">{t}</SvgText>
            </React.Fragment>
          ))}
          {[0, 6, 12, 18, 23].filter((i) => i < n).map((i) => (
            <SvgText key={i} x={x(i)} y={ALT - 6} fontSize={fs} fill={c.sub} textAnchor="middle">{data[i].hora.slice(0, 2)}h</SvgText>
          ))}
          <Path d={area} fill={c.area} />
          <Path d={linha} stroke={c.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          {sel != null && sel < n && (
            <Line x1={x(sel)} x2={x(sel)} y1={PT} y2={PT + alt} stroke={c.sub} strokeWidth={1} strokeDasharray="4 4" />
          )}
          {data.map((d, i) => (
            <Circle key={i} cx={x(i)} cy={y(d.latencia)} r={i === sel ? 7 : 3.5}
              fill={c[STATUS[classificar(d)].cor]} stroke={i === sel ? c.bg : 'none'} strokeWidth={2} />
          ))}
        </Svg>
      )}
    </View>
  );
}

const estilos = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  screenC: { padding: 16, gap: 12 },
  screenCenter: { flexGrow: 1, justifyContent: 'center', alignItems: 'stretch' },
  h: { fontSize: 24, fontWeight: '700', color: c.text },
  p: { fontSize: 16, color: c.text },
  card: { backgroundColor: c.card, borderRadius: 16, padding: 16, gap: 8 },
  btn: { minHeight: 48, minWidth: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary, borderRadius: 12, paddingHorizontal: 16 },
  btnGlass: { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 24 },
  ghost: { backgroundColor: 'transparent', borderWidth: 2, borderColor: c.accent },
  btnT: { color: c.onPrimary, fontSize: 16, fontWeight: '700' },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 14, padding: 12, alignSelf: 'flex-start' },
  metric: { flexGrow: 1, backgroundColor: c.bg, borderRadius: 12, padding: 12 },
  mv: { fontSize: 24, fontWeight: '700', color: c.text }, mu: { fontSize: 14, color: c.sub },
  chip: { minHeight: 48, minWidth: 48, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
