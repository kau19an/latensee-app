import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Switch, Pressable, Platform, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle as MapCircle } from 'react-native-maps';
import { Screen, H, P, Card, Btn, Row, Badge, Metric, Chips, DayPicker, DIAS, ForecastChart } from './ui';
import { useTheme, STATUS, ATIVIDADES, GLOSSARIO, classificar } from './theme';
import { getPrevisao, getPrevisaoDia, getServidores } from './api';

/* ---------- ONBOARDING (5 passos, tudo centralizado) ---------- */
const PASSOS = [
  ['Boas-vindas', 'Veja como está e como ficará sua internet, em linguagem simples.', 'hand-right'],
  ['Velocidade', 'Mostramos se a conexão está Boa, Regular ou Instável — e a previsão para os próximos 5 dias.', 'speedometer'],
  ['Mapa', 'Veja no mapa onde ficam os pontos que medem a sua conexão.', 'map'],
  ['Privacidade', 'Não coletamos dados pessoais nem rastreamos você.', 'shield-checkmark'],
  ['Alertas', 'Avisamos quando a conexão estiver em risco.', 'notifications'],
];
export function Onboarding({ onDone }) {
  const { c } = useTheme();
  const [i, setI] = useState(0);
  const [t, d, ic] = PASSOS[i];
  return (
    <Screen center>
      <View style={{ alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <View accessible accessibilityLabel={`Passo ${i + 1} de ${PASSOS.length}`} style={{ flexDirection: 'row', gap: 8 }}>
          {PASSOS.map((_, k) => (
            <View key={k} style={{ width: k === i ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: k === i ? c.accent : c.border }} />
          ))}
        </View>
        <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={ic} size={88} color={c.accent} accessibilityElementsHidden importantForAccessibility="no" />
        </View>
        <H style={{ textAlign: 'center' }}>{t}</H>
        <P style={{ textAlign: 'center', color: c.sub, maxWidth: 340 }}>{d}</P>
      </View>
      <Btn label={i < PASSOS.length - 1 ? 'Próximo' : 'Começar'} onPress={() => (i < PASSOS.length - 1 ? setI(i + 1) : onDone())} />
      {i > 0 && <Btn kind="ghost" label="Voltar" onPress={() => setI(i - 1)} />}
      <Btn kind="ghost" label="Pular" onPress={onDone} />
    </Screen>
  );
}

/* ---------- PAINEL DE CONEXÃO / INÍCIO (RQ01-RQ04) ---------- */
const periodos = (dia) => (dia === 0
  ? [['Agora', new Date().getHours()], ['Manhã', 9], ['Tarde', 15], ['Noite', 21]]
  : [['Madrugada', 3], ['Manhã', 9], ['Tarde', 15], ['Noite', 21]]);
export function Painel({ navigation }) {
  const { c } = useTheme();
  const [dia, setDia] = useState(0);
  const [sel, setSel] = useState(0);
  const [d, setD] = useState(null);
  const PER = periodos(dia);
  useEffect(() => {
    setD(null);
    getPrevisao(PER[sel][1], dia).then((r) => {
      setD(r);
      AccessibilityInfo.announceForAccessibility(`Previsão atualizada: conexão ${classificar(r)}`); // RNF08
    });
  }, [sel, dia]);
  const status = d ? classificar(d) : null;
  return (
    <Screen>
      <H>Sua conexão</H>
      <DayPicker dia={dia} onDia={setDia} />
      <Chips items={PER.map(([n]) => n)} sel={sel} onSel={setSel} center label="Período" />
      {!d ? <P style={{ textAlign: 'center' }}>Carregando previsão…</P> : (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ color: c.sub, fontSize: 14 }}>{DIAS[dia]} · {PER[sel][0]}</Text>
            <Badge status={status} big center />
            <P style={{ textAlign: 'center' }}>{STATUS[status].desc}</P>
            <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
              <Metric label="Latência" value={d.latencia} unit="ms" center />
              <Metric label="Jitter" value={d.jitter} unit="ms" center />
              <Metric label="Perda" value={d.perda} unit="%" center />
            </View>
          </Card>
          <H>O que dá para fazer</H>
          {ATIVIDADES.map((a) => {
            const ok = a.ok.includes(status);
            return <Row key={a.nome} icon={a.icon} label={a.nome} value={ok ? 'Recomendado' : 'Não recomendado'} />;
          })}
          <Btn label="Ver detalhes" icon="information-circle" onPress={() => navigation.navigate('Diagnostico', { d, status })} />
        </>
      )}
    </Screen>
  );
}

/* ---------- VELOCIDADE: gráfico da previsão (hoje + 5 dias) ---------- */
export function Velocidade({ navigation }) {
  const { c } = useTheme();
  const [dia, setDia] = useState(0);
  const [h, setH] = useState(null);
  const [sel, setSel] = useState(dia === 0 ? new Date().getHours() : 12);
  const [lista, setLista] = useState(false);
  useEffect(() => {
    setH(null);
    getPrevisaoDia(dia).then((r) => { setH(r); setSel(dia === 0 ? Math.min(new Date().getHours(), r.length - 1) : 12); });
  }, [dia]);
  const x = h && h[sel];
  const st = x ? classificar(x) : null;
  const melhor = h && h.filter((p) => classificar(p) === 'Boa').sort((a, b) => a.latencia - b.latencia)[0];
  const ruins = h ? h.filter((p) => classificar(p) === 'Instável') : [];
  return (
    <Screen>
      <H>Previsão de velocidade</H>
      <DayPicker dia={dia} onDia={setDia} />
      {!h ? <P>Carregando previsão…</P> : (
        <>
          <Card>
            <Text style={{ color: c.sub, fontSize: 14 }}>Latência prevista (ms) · {DIAS[dia]}</Text>
            <ForecastChart data={h} sel={sel} onSel={setSel} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {Object.entries(STATUS).map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name={v.icon} size={16} color={c[v.cor]} /><Text style={{ color: c.text, fontSize: 14 }}>{k}</Text>
                </View>
              ))}
            </View>
            <P style={{ color: c.sub, fontSize: 14, textAlign: 'center' }}>Toque ou arraste no gráfico para ver cada horário.</P>
          </Card>
          {x && (
            <Card style={{ alignItems: 'center' }}>
              <Text style={{ color: c.sub, fontSize: 14 }}>{DIAS[dia]} às {x.hora}</Text>
              <Badge status={st} center />
              <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
                <Metric label="Latência" value={x.latencia} unit="ms" center />
                <Metric label="Jitter" value={x.jitter} unit="ms" center />
                <Metric label="Perda" value={x.perda} unit="%" center />
              </View>
              <View style={{ alignSelf: 'stretch' }}>
                <Btn kind="ghost" label="Detalhes do horário" onPress={() => navigation.navigate('DetalhesTeste', { x, rotulo: `${DIAS[dia]} às ${x.hora}` })} />
              </View>
            </Card>
          )}
          <Card>
            <Row icon="happy" label="Melhor horário" value={melhor ? `${melhor.hora} · ${melhor.latencia} ms` : 'Nenhum horário Boa'} />
            <Row icon="warning" label="Evite" value={ruins.length ? `${ruins[0].hora} – ${ruins[ruins.length - 1].hora}` : 'Nenhum horário Instável'} />
          </Card>
          <Btn kind="ghost" icon={lista ? 'chevron-up' : 'list'} label={lista ? 'Ocultar lista de horários' : 'Ver lista de horários'} onPress={() => setLista(!lista)} />
          {lista && h.map((p) => (
            <Row key={p.hora} label={p.hora} value={`${p.latencia} ms · ${classificar(p)}`}
              onPress={() => navigation.navigate('DetalhesTeste', { x: p, rotulo: `${DIAS[dia]} às ${p.hora}` })} />
          ))}
        </>
      )}
    </Screen>
  );
}

/* ---------- MAPA: onde a API mede (ex.: São Paulo = Praça da Sé) ---------- */
// Estilo escuro do Google Maps (Android). No iOS usamos userInterfaceStyle.
const MAPA_ESCURO = [
  { elementType: 'geometry', stylers: [{ color: '#121016' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#B8AECF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A2140' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B0A12' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1A1524' }] },
];
const regiao = (p, delta = 0.02) => ({ latitude: p.lat, longitude: p.lon, latitudeDelta: delta, longitudeDelta: delta });

function Mapinha({ pontos, foco, height = 320, interativo = true, mapRef, onMarker }) {
  const { c } = useTheme();
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.grid }}
      accessible={!interativo} accessibilityLabel={foco ? `Mapa: ${foco.local}, ${foco.cidade ?? ''}` : 'Mapa'}>
      <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={foco ? regiao(foco) : undefined}
        scrollEnabled={interativo} zoomEnabled={interativo} rotateEnabled={false} pitchEnabled={false}
        userInterfaceStyle={c.dark ? 'dark' : 'light'}
        customMapStyle={Platform.OS === 'android' && c.dark ? MAPA_ESCURO : undefined}>
        {pontos.map((p) => (
          <React.Fragment key={p.id}>
            <MapCircle center={{ latitude: p.lat, longitude: p.lon }} radius={250}
              fillColor={c.area} strokeColor={c.accent} strokeWidth={1} />
            <Marker coordinate={{ latitude: p.lat, longitude: p.lon }} pinColor={c.primary}
              title={p.local} description={`${p.nome} · ${classificar(p)}`} onPress={() => onMarker && onMarker(p)} />
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
}

export function Mapa({ navigation }) {
  const { c } = useTheme();
  const [s, setS] = useState([]);
  const [sel, setSel] = useState(0);
  const mapRef = useRef(null);
  useEffect(() => { getServidores().then(setS); }, []);
  const noMapa = s.filter((x) => x.lat != null);
  const fora = s.filter((x) => x.lat == null);
  const p = noMapa[sel];
  const focar = (k) => { setSel(k); mapRef.current?.animateToRegion(regiao(noMapa[k]), 600); };
  return (
    <Screen>
      <H>Pontos de medição</H>
      <P style={{ color: c.sub }}>Onde a API testa a sua conexão.</P>
      {noMapa.length > 0 && (
        <>
          <Chips items={noMapa.map((x) => x.cidade ?? x.nome)} sel={sel} onSel={focar} scroll label="Ponto de medição" />
          <Mapinha pontos={noMapa} foco={p} mapRef={mapRef}
            onMarker={(m) => setSel(noMapa.findIndex((x) => x.id === m.id))} />
          {p && (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={24} color={c.accent} />
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', flex: 1 }}>{p.local}</Text>
              </View>
              <P style={{ color: c.sub }}>{p.cidade ? `${p.cidade} · ` : ''}{p.lat.toFixed(5)}, {p.lon.toFixed(5)}</P>
              <Badge status={classificar(p)} />
              <Btn label="Detalhes do servidor" icon="server" onPress={() => navigation.navigate('Servidor', { x: p })} />
            </Card>
          )}
        </>
      )}
      {fora.length > 0 && (
        <>
          <H>Outras rotas monitoradas</H>
          {fora.map((x) => (
            <Row key={x.id} icon="server" label={`${x.nome} — ${x.rota}`} value={classificar(x)}
              onPress={() => navigation.navigate('Servidor', { x })} />
          ))}
        </>
      )}
    </Screen>
  );
}

/* ---------- ALERTAS ---------- */
export function Alertas() {
  const { c } = useTheme();
  const [on, setOn] = useState({ risco: true, falha: true });
  const Sw = ({ k, label }) => (
    <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <P>{label}</P>
      <Switch value={on[k]} onValueChange={(v) => setOn({ ...on, [k]: v })} accessibilityLabel={label}
        trackColor={{ true: c.primary, false: c.border }} thumbColor="#FFFFFF" />
    </View>
  );
  return (
    <Screen>
      <H>Alertas</H>
      <Card><Sw k="risco" label="Avisar quando estiver Regular" /><Sw k="falha" label="Avisar quando estiver Instável" /></Card>
      <P style={{ color: c.sub }}>Só avisamos após 2–3 medições seguidas, para evitar alarme falso.</P>
    </Screen>
  );
}

/* ---------- VPN E PRIVACIDADE ---------- */
export function Privacidade() {
  return (
    <Screen>
      <H>VPN e privacidade</H>
      <Card>
        <P>• Não coletamos dados pessoais.</P><P>• Não rastreamos sua localização.</P>
        <P>• Usar VPN pode aumentar a latência: o caminho fica mais longo, mesmo sem defeito na rede.</P>
      </Card>
    </Screen>
  );
}

/* ---------- CONFIGURAÇÕES (com modo escuro) ---------- */
const TEMAS = [['claro', 'Claro', 'sunny'], ['escuro', 'Escuro', 'moon'], ['sistema', 'Automático', 'phone-portrait']];
export function Configuracoes({ navigation, onReset }) {
  const { c, pref, setPref } = useTheme();
  return (
    <Screen>
      <H>Configurações</H>
      <Card>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Aparência</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
          {TEMAS.map(([k, label, ic]) => {
            const ativo = pref === k;
            return (
              <Pressable key={k} onPress={() => setPref(k)} accessibilityRole="radio" accessibilityState={{ checked: ativo }}
                accessibilityLabel={`Tema ${label}`}
                style={{ flex: 1, minHeight: 72, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4,
                  backgroundColor: ativo ? c.primary : c.bg, borderWidth: 2, borderColor: ativo ? c.primary : c.grid }}>
                <Ionicons name={ic} size={24} color={ativo ? c.onPrimary : c.accent} />
                <Text style={{ color: ativo ? c.onPrimary : c.text, fontWeight: '700' }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <P style={{ color: c.sub, fontSize: 14 }}>Automático segue o modo claro/escuro do seu celular.</P>
      </Card>
      <Row icon="notifications" label="Alertas" onPress={() => navigation.navigate('Alertas')} />
      <Row icon="shield-checkmark" label="VPN e privacidade" onPress={() => navigation.navigate('Privacidade')} />
      <Row icon="help-circle" label="Ajuda" onPress={() => navigation.navigate('Ajuda')} />
      <Row icon="refresh" label="Rever introdução" onPress={onReset} />
      <P style={{ color: c.sub }}>O app respeita o tamanho de fonte do seu aparelho.</P>
    </Screen>
  );
}

/* ---------- DETALHES DO TESTE / HORÁRIO ---------- */
export function DetalhesTeste({ route }) {
  const { x, rotulo } = route.params; const st = classificar(x);
  return (
    <Screen>
      <H>{rotulo ? `Previsão: ${rotulo}` : `Teste das ${x.hora}`}</H><Badge status={st} />
      <Metric label="Latência" value={x.latencia} unit="ms" />
      <Metric label="Jitter" value={x.jitter} unit="ms" />
      <Metric label="Perda de pacotes" value={x.perda} unit="%" />
    </Screen>
  );
}

/* ---------- DIAGNÓSTICO DA CONEXÃO ---------- */
export function Diagnostico({ route }) {
  const { c } = useTheme();
  const { d, status } = route.params;
  const dicas = status === 'Boa' ? ['Tudo certo, nada a fazer.']
    : ['Aproxime-se do roteador ou use cabo.', 'Pause downloads grandes.', 'Reinicie o roteador se continuar assim.'];
  return (
    <Screen>
      <H>Diagnóstico</H><Badge status={status} />
      <Card><P>Latência {d.latencia} ms · Jitter {d.jitter} ms · Perda {d.perda}%</P></Card>
      <H>O que fazer</H>{dicas.map((t) => <P key={t}>• {t}</P>)}
      <H>Termos</H>
      {Object.entries(GLOSSARIO).map(([k, v]) => <Card key={k}><Text style={{ fontWeight: '700', color: c.text }}>{k}</Text><P>{v}</P></Card>)}
    </Screen>
  );
}

/* ---------- DETALHES DO SERVIDOR ---------- */
export function Servidor({ route }) {
  const { c } = useTheme();
  const x = route.params.x;
  return (
    <Screen>
      <H>{x.nome}</H><Badge status={classificar(x)} />
      {x.lat != null && (
        <>
          <Mapinha pontos={[x]} foco={x} height={200} interativo={false} />
          <P>Local de medição: {x.local}{x.cidade ? ` — ${x.cidade}` : ''}</P>
        </>
      )}
      <P>Endereço: {x.ip}</P><P>Rota: {x.rota}</P>
      <Metric label="Latência" value={x.latencia} unit="ms" />
      <Metric label="Jitter" value={x.jitter} unit="ms" />
      <Metric label="Perda" value={x.perda} unit="%" />
      <P style={{ color: c.sub }}>Rotas longas têm latência alta naturalmente (ex.: Brasil ⇄ EUA ~110–160 ms). Isso só é problema se houver perda ou jitter alto.</P>
    </Screen>
  );
}

/* ---------- AJUDA ---------- */
export function Ajuda() {
  const { c } = useTheme();
  return (
    <Screen>
      <H>Ajuda</H>
      {Object.entries(GLOSSARIO).map(([k, v]) => <Card key={k}><Text style={{ fontWeight: '700', color: c.text }}>{k}</Text><P>{v}</P></Card>)}
      <Card><Text style={{ fontWeight: '700', color: c.text }}>Boa / Regular / Instável</Text>
        <P>Boa: perda &lt; 0,5% e jitter &lt; 20 ms. Regular: perda 0,5–2% ou jitter 20–50 ms. Instável: acima disso.</P></Card>
    </Screen>
  );
}
