import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme, STATUS, classificar, rotuloDia, DIAS_PREVISAO } from './theme';

const useS = () => {
  const { c } = useTheme();
  return [useMemo(() => estilos(c), [c]), c];
};

// center = conteúdo centralizado na vertical e horizontal (introdução)
export const Screen = ({ children, center }) => {
  const [s] = useS();
  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.screenC, center && s.screenCenter]}>{children}</ScrollView>
  );
};
export const H = ({ children, style }) => { const [s] = useS(); return <Text accessibilityRole="header" style={[s.h, style]}>{children}</Text>; };
export const P = ({ children, style }) => { const [s] = useS(); return <Text style={[s.p, style]}>{children}</Text>; };
export const Card = ({ children, style }) => { const [s] = useS(); return <View style={[s.card, style]}>{children}</View>; };

// Área mínima 48x48 (RNF09)
export const Btn = ({ label, onPress, icon, kind = 'primary', hint }) => {
  const [s, c] = useS();
  const ghost = kind === 'ghost';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
      style={[s.btn, ghost && s.ghost]}>
      {icon && <Ionicons name={icon} size={22} color={ghost ? c.accent : c.onPrimary} />}
      <Text style={[s.btnT, ghost && { color: c.accent }]}>{label}</Text>
    </Pressable>
  );
};
export const Row = ({ icon, label, value, onPress }) => {
  const [s, c] = useS();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={value ? `${label}: ${value}` : label} style={s.row}>
      {icon && <Ionicons name={icon} size={24} color={c.accent} />}
      <Text style={[s.p, { flex: 1 }]}>{label}</Text>
      {value ? <Text style={[s.p, { color: c.sub }]}>{value}</Text> : null}
      {onPress && <Ionicons name="chevron-forward" size={20} color={c.sub} />}
    </Pressable>
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
  return (
    <View style={[s.metric, center && { alignItems: 'center' }]} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <Text style={s.mv}>{value}<Text style={s.mu}> {unit}</Text></Text>
      <Text style={s.p}>{label}</Text>
    </View>
  );
};

// Grupo de "pílulas" selecionáveis (períodos, dias, pontos do mapa)
export const Chips = ({ items, sel, onSel, scroll, center, label }) => {
  const [s, c] = useS();
  const conteudo = items.map((n, k) => (
    <Pressable key={n} onPress={() => onSel(k)} accessibilityRole="tab" accessibilityState={{ selected: sel === k }}
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
const ALT = 220, PE = 40, PD = 12, PT = 14, PB = 28;
export function ForecastChart({ data, sel, onSel }) {
  const [, c] = useS();
  const [w, setW] = useState(0);
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
              <SvgText x={PE - 6} y={y(t) + 4} fontSize={11} fill={c.sub} textAnchor="end">{t}</SvgText>
            </React.Fragment>
          ))}
          {[0, 6, 12, 18, 23].filter((i) => i < n).map((i) => (
            <SvgText key={i} x={x(i)} y={ALT - 8} fontSize={11} fill={c.sub} textAnchor="middle">{data[i].hora.slice(0, 2)}h</SvgText>
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
  ghost: { backgroundColor: 'transparent', borderWidth: 2, borderColor: c.accent },
  btnT: { color: c.onPrimary, fontSize: 16, fontWeight: '700' },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 14, padding: 12, alignSelf: 'flex-start' },
  metric: { flex: 1, backgroundColor: c.bg, borderRadius: 12, padding: 12 },
  mv: { fontSize: 24, fontWeight: '700', color: c.text }, mu: { fontSize: 14, color: c.sub },
  chip: { minHeight: 48, minWidth: 48, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
