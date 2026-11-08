import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Switch, Pressable, Platform, AccessibilityInfo, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle as MapCircle } from 'react-native-maps';
import { Screen, H, TituloTela, P, Card, Btn, Row, Badge, Aviso, AvisoDados, AvisoRota, Metric, Chips, ForecastChart, useBase } from './ui';
import { useTheme, STATUS, ATIVIDADES, CODIGOS_ATIVIDADE, GLOSSARIO, classificar, melhorHorario } from './theme';
import { getPerfil, naHora, getJanela, JANELA_DIAS, getServidores, getLocais, getModelos, checarAtividades, getComparacao, verificarAPI } from './api';
import { usePreferencias, regiaoPeloGPS } from './preferencias';
import { MAPA_EMBUTIDO } from './plataforma';
import { analisarRota, lerAvisoRota } from './rotas';
import { AMOSTRAS, INTERVALOS_MIN, HIST_MAX, lerHistorico, limparHistorico, resumoHistorico } from './medicao';
import { useMedicao } from './medicaoCtx';
import { PREFS_PADRAO, lerPrefs, salvarPrefs, pedirPermissao, reagendarAlertas } from './alertas';

/* ---------- utilidades ---------- */
// Perfil de 24h da região e do modelo escolhidos (recarrega quando a escolha muda)
function usePerfil() {
  const { modelo, regiao, pronto } = usePreferencias();
  const [lista, setLista] = useState(null);
  useEffect(() => {
    if (!pronto) return undefined;
    let vivo = true;
    setLista(null);
    getPerfil({ modelo, probe: regiao.id }).then((r) => vivo && setLista(r));
    return () => { vivo = false; };
  }, [modelo, regiao.id, pronto]);
  return lista;
}
// Coordenadas do probe da região (usadas no POST /activity/check — nunca as do usuário)
function useLocalDaRegiao() {
  const { regiao } = usePreferencias();
  const [local, setLocal] = useState(null);
  useEffect(() => { getLocais().then((ls) => setLocal(ls.find((l) => l.id === regiao.id) ?? null)); }, [regiao.id]);
  return local;
}
// Trechos SEGUIDOS de um status: ex. "15:00–17:00, 21:00"
function trechos(lista, status) {
  const out = [];
  lista.forEach((p, i) => {
    if (classificar(p) !== status) return;
    const ultimo = out[out.length - 1];
    if (ultimo && ultimo.fim === i - 1) { ultimo.fim = i; } else { out.push({ ini: i, fim: i }); }
  });
  return out.map(({ ini, fim }) => (ini === fim ? lista[ini].hora : `${lista[ini].hora}–${lista[fim].hora}`)).join(', ');
}
const Metricas = ({ x, center = true }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' }}>
    <Metric label="Latência" value={x.latencia} unit="ms" center={center} />
    <Metric label="Perda" value={x.perda} unit="%" center={center} />
    <Metric label="Nota" value={x.nota} unit="/100" center={center} />
  </View>
);

/* ---------- ONBOARDING (5 passos, tudo centralizado) ---------- */
const PASSOS = [
  ['Boas-vindas', 'Veja como está e como ficará sua internet, em linguagem simples.', 'hand-right'],
  ['Velocidade', 'Mostramos se a conexão está Boa, Regular ou Instável em cada hora — de 5 dias antes a 5 dias depois — pela previsão dos modelos da turma.', 'speedometer'],
  ['Mapa', 'Escolha no mapa o ponto de medição da sua região — ou deixe o app achar o mais próximo.', 'map'],
  ['Privacidade', 'Não coletamos dados pessoais. Se você usar a localização, ela fica só no seu celular.', 'shield-checkmark'],
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

/* ---------- REGIÃO: opção (c) — GPS se o usuário permitir, senão escolha no mapa ---------- */
const MSG_GPS = {
  negado: 'Sem permissão de localização. Você pode escolher a região no mapa.',
  falhou: 'Não conseguimos achar sua localização agora. Tente de novo ou escolha no mapa.',
};
function CartaoRegiao({ navigation }) {
  const { c } = useTheme();
  const { regiao, setRegiao } = usePreferencias();
  const [buscando, setBuscando] = useState(false);
  const [msg, setMsg] = useState('');
  const usarGPS = async () => {
    setBuscando(true); setMsg('');
    const r = await regiaoPeloGPS();
    setBuscando(false);
    if (r.erro) setMsg(MSG_GPS[r.erro]); else setRegiao(r);
  };
  if (regiao.origem !== 'padrao') {
    const detalhe = regiao.origem === 'gps' ? `${regiao.cidade} · ${regiao.distanciaKm} km` : regiao.cidade;
    return <Row icon="location" label="Região" value={detalhe} onPress={() => navigation.navigate('Mapa')} />;
  }
  return (
    <Card>
      <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>De qual região você quer a previsão?</Text>
      <P style={{ color: c.sub, fontSize: 14 }}>Por enquanto mostramos {regiao.cidade}. Sua localização é usada só no celular para achar o ponto de medição mais próximo.</P>
      <Btn label={buscando ? 'Procurando…' : 'Usar minha localização'} icon="locate" onPress={buscando ? undefined : usarGPS} />
      <Btn kind="ghost" label="Escolher no mapa" icon="map" onPress={() => navigation.navigate('Mapa')} />
      {msg ? <P accessibilityLiveRegion="polite" style={{ fontSize: 14 }}>{msg}</P> : null}
    </Card>
  );
}

/* ---------- MEDIÇÃO REAL: "Medir minha conexão agora" ---------- */
function CartaoMedicao({ lista, navigation }) {
  const { c } = useTheme();
  const { ultima: r, progresso, erro, aviso, medir, auto } = useMedicao();
  const previsto = r && lista ? naHora(lista, r.h) : null;
  const quando = r ? new Date(r.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <Card>
      <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Sua conexão agora (medida)</Text>
      <P style={{ color: c.sub, fontSize: 14 }}>Mede o seu aparelho de verdade, com {AMOSTRAS} testes rápidos. A previsão acima é do ponto de medição da região.</P>
      {auto.ligado ? <P style={{ color: c.sub, fontSize: 14 }}>Medição automática ligada: a cada {auto.intervalo} min, com o app aberto.</P> : null}
      {r && (
        <>
          <Text style={{ color: c.sub, fontSize: 14 }}>Medido às {quando}{r.origem === 'auto' ? ' (automática)' : ''}</Text>
          <Badge status={classificar(r)} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' }}>
            <Metric label="Latência" value={r.latencia} unit="ms" center />
            <Metric label="Jitter" value={r.jitter} unit="ms" center />
            <Metric label="Perda" value={r.perda} unit="%" center />
          </View>
          {previsto && (
            <P style={{ color: c.sub, fontSize: 14 }}>
              Previsto para as {previsto.hora}: {previsto.latencia} ms e {previsto.perda}% de perda ({classificar(previsto)}). Medido: {r.latencia} ms e {r.perda}%.
              {' '}A previsão é do ponto de medição da região e a medição é do seu aparelho; diferenças são esperadas.
            </P>
          )}
          <AvisoRota aviso={aviso} />
        </>
      )}
      <Btn label={progresso != null ? `Medindo… ${progresso}/${AMOSTRAS}` : r ? 'Medir de novo' : 'Medir minha conexão agora'}
        icon="pulse" onPress={progresso != null ? undefined : () => medir('manual')}
        hint="Faz testes rápidos de tempo de resposta usando a sua internet" />
      {erro ? <P accessibilityLiveRegion="polite" style={{ fontSize: 14 }}>{erro}</P> : null}
      <Btn label="Ver histórico de medições" icon="time" kind="ghost" onPress={() => navigation.navigate('Historico')} />
    </Card>
  );
}

/* ---------- PAINEL DE CONEXÃO / INÍCIO (RQ01-RQ04) ---------- */
const PERIODOS = [['Agora', null], ['Manhã', 9], ['Tarde', 15], ['Noite', 21]];
export function Painel({ navigation }) {
  const { c } = useTheme();
  const { modelo, regiao } = usePreferencias();
  const lista = usePerfil();
  const local = useLocalDaRegiao();
  const [sel, setSel] = useState(0);
  const [ativ, setAtiv] = useState(0);
  const [api, setApi] = useState(undefined); // undefined = verificando · null = sem API (regra local)
  const hora = PERIODOS[sel][1] ?? new Date().getHours();
  const d = lista ? naHora(lista, hora) : null;
  const status = d ? classificar(d) : null;

  useEffect(() => { if (status) AccessibilityInfo.announceForAccessibility(`Previsão atualizada: conexão ${status}`); }, [d?.h, status]); // RNF08
  useEffect(() => {
    if (!d) return undefined;
    let vivo = true;
    setApi(undefined);
    checarAtividades({ modelo, local, item: d, codigos: CODIGOS_ATIVIDADE }).then((r) => vivo && setApi(r));
    return () => { vivo = false; };
  }, [d?.quando, d?.h, modelo, local?.id]);

  const melhor = melhorHorario(lista, ATIVIDADES[ativ].nome, new Date().getHours());
  const valorAtividade = (a) => {
    if (api === undefined && d?.quando) return 'Verificando…';
    const ok = api ? api.adequado[a.api] : a.ok.includes(status);
    return ok ? 'Recomendado' : 'Não recomendado';
  };
  return (
    <Screen>
      <TituloTela>Sua conexão</TituloTela>
      <CartaoRegiao navigation={navigation} />
      <AvisoDados info={lista?.meta} />
      <Chips items={PERIODOS.map(([n]) => n)} sel={sel} onSel={setSel} center label="Período" />
      {!d ? <P style={{ textAlign: 'center' }}>Carregando previsão… (o servidor pode levar até 1 minuto para acordar)</P> : (
        <>
          <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ color: c.sub, fontSize: 14, textAlign: 'center' }}>{PERIODOS[sel][0]} ({d.hora}) · {regiao.cidade}</Text>
            <Badge status={status} big center />
            <P style={{ textAlign: 'center' }}>{STATUS[status].desc}</P>
            <Metricas x={d} />
          </Card>
          <CartaoMedicao lista={lista} navigation={navigation} />
          <H>O que dá para fazer</H>
          {ATIVIDADES.map((a) => (
            <Row key={a.nome} icon={a.icon} label={a.estimativa ? `${a.nome} (estimativa)` : a.nome} value={valorAtividade(a)} />
          ))}
          {api?.recomendacao?.message ? <P style={{ color: c.sub, fontSize: 14 }}>{api.recomendacao.message}</P> : null}
          <H>Melhor horário para...</H>
          <Chips items={ATIVIDADES.map((a) => a.nome)} sel={ativ} onSel={setAtiv} scroll label="Atividade" />
          <Card style={{ alignItems: 'center' }}>
            {melhor ? (
              <>
                <Text style={{ color: c.sub, fontSize: 14 }}>Hoje · {ATIVIDADES[ativ].nome}</Text>
                <Text accessibilityLabel={`Melhor horário: ${melhor.hora}`} style={{ color: c.text, fontSize: 32, fontWeight: '700' }}>{melhor.hora}</Text>
                <Badge status={classificar(melhor)} center />
                <P style={{ color: c.sub }}>Latência prevista de {melhor.latencia} ms.</P>
              </>
            ) : (
              <P style={{ textAlign: 'center' }}>Nenhum horário bom para {ATIVIDADES[ativ].nome.toLowerCase()} no resto de hoje.</P>
            )}
          </Card>
          <Btn label="Ver detalhes" icon="information-circle"
            onPress={() => navigation.navigate('Diagnostico', { d, status, recomendacao: api?.recomendacao?.message, aviso: api?.aviso })} />
          <Btn label="Comparar os 4 modelos" icon="git-compare" kind="ghost"
            onPress={() => navigation.navigate('Comparacao', { quando: d.quando, hora: d.hora })} />
        </>
      )}
    </Screen>
  );
}

/* ---------- VELOCIDADE: janela de 11 dias (5 antes, o dia central, 5 depois) ---------- */
function useJanela() {
  const { modelo, regiao, pronto } = usePreferencias();
  const [janela, setJanela] = useState(undefined); // undefined = carregando · null = sem API
  useEffect(() => {
    if (!pronto) return undefined;
    let vivo = true;
    setJanela(undefined);
    getJanela({ modelo, probe: regiao.id }).then((r) => vivo && setJanela(r));
    return () => { vivo = false; };
  }, [modelo, regiao.id, pronto]);
  return janela;
}
export function Velocidade({ navigation }) {
  const { c } = useTheme();
  const { regiao } = usePreferencias();
  const janela = useJanela();
  const perfil = usePerfil(); // reserva: sem API usamos o perfil (ou os dados de exemplo)
  const [dia, setDia] = useState(JANELA_DIAS);
  const [sel, setSel] = useState(0);
  const [lista, setLista] = useState(false);
  useEffect(() => { if (janela) setDia(janela.centro); }, [janela]);
  const diaAtual = janela ? janela.dias[dia] : null;
  const h = janela ? diaAtual.itens : perfil;
  useEffect(() => {
    if (!h?.length) return;
    const alvo = !janela || diaAtual?.hoje ? new Date().getHours() : 12;
    const i = h.findIndex((p) => p.h === alvo);
    setSel(i >= 0 ? i : 0);
  }, [h]);
  const carregando = janela === undefined || (!janela && !perfil);
  const x = h?.length ? h[Math.min(sel, h.length - 1)] : null;
  const st = x ? classificar(x) : null;
  const melhor = h?.length ? h.filter((p) => classificar(p) === 'Boa').sort((a, b) => a.latencia - b.latencia)[0] : null;
  const evitar = h?.length ? trechos(h, 'Instável') : '';
  const rotuloDia = diaAtual ? (diaAtual.hoje ? 'Hoje' : diaAtual.data) : 'Hoje';
  const parcial = h?.length && h.length < 24 ? `Previsão parcial: só há dados das ${h[0].hora} às ${h[h.length - 1].hora}.` : null;
  return (
    <Screen>
      <TituloTela>Previsão de velocidade</TituloTela>
      {janela?.referencia && (
        <Aviso icon="information-circle"
          msg={`A API não tem previsões para os 5 dias antes e depois de hoje. Mostrando de ${janela.inicio} a ${janela.fim}, em volta da última data disponível (${janela.centroData}).`} />
      )}
      <AvisoDados info={janela ? janela.meta : perfil?.meta} />
      {janela && (
        <Chips items={janela.dias.map((d) => d.rotulo)} sel={dia} onSel={setDia} scroll label="Dia da previsão" />
      )}
      {carregando ? <P>Carregando previsão… (o servidor pode levar até 1 minuto para acordar)</P> : !h?.length ? (
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Ionicons name="calendar-outline" size={40} color={c.sub} accessibilityElementsHidden importantForAccessibility="no" />
          <P style={{ textAlign: 'center' }}>Sem previsão para {rotuloDia === 'Hoje' ? 'hoje' : rotuloDia}.</P>
          <P style={{ color: c.sub, fontSize: 14, textAlign: 'center' }}>O modelo escolhido não tem dados para este dia. Escolha outro dia acima.</P>
        </Card>
      ) : (
        <>
          <Card>
            <Text style={{ color: c.sub, fontSize: 14 }}>Latência prevista (ms) · {rotuloDia} · {regiao.cidade}</Text>
            <ForecastChart data={h} sel={sel} onSel={setSel} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {Object.entries(STATUS).map(([k, v]) => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name={v.icon} size={16} color={c[v.cor]} /><Text style={{ color: c.text, fontSize: 14 }}>{k}</Text>
                </View>
              ))}
            </View>
            {parcial ? <P style={{ color: c.sub, fontSize: 14, textAlign: 'center' }}>{parcial}</P> : null}
            <P style={{ color: c.sub, fontSize: 14, textAlign: 'center' }}>Toque ou arraste no gráfico para ver cada horário.</P>
          </Card>
          {x && (
            <Card style={{ alignItems: 'center' }}>
              <Text style={{ color: c.sub, fontSize: 14 }}>{rotuloDia} às {x.hora}</Text>
              <Badge status={st} center />
              <Metricas x={x} />
              <View style={{ alignSelf: 'stretch' }}>
                <Btn kind="ghost" label="Detalhes do horário" onPress={() => navigation.navigate('DetalhesTeste', { x, rotulo: `${rotuloDia} às ${x.hora}` })} />
              </View>
            </Card>
          )}
          <Card>
            <Row icon="happy" label="Melhor horário" value={melhor ? `${melhor.hora} · ${melhor.latencia} ms` : 'Nenhum horário Boa'} />
            <Row icon="warning" label="Evite" value={evitar || 'Nenhum horário Instável'} />
          </Card>
          <Btn kind="ghost" icon={lista ? 'chevron-up' : 'list'} label={lista ? 'Ocultar lista de horários' : 'Ver lista de horários'} onPress={() => setLista(!lista)} />
          {lista && h.map((p) => (
            <Row key={p.hora} label={p.hora} value={`${p.latencia} ms · ${classificar(p)}`}
              onPress={() => navigation.navigate('DetalhesTeste', { x: p, rotulo: `${rotuloDia} às ${p.hora}` })} />
          ))}
        </>
      )}
    </Screen>
  );
}

/* ---------- MAPA: pontos de medição (probes) da API ---------- */
// Estilo escuro do Google Maps (Android). No iOS usamos userInterfaceStyle.
const MAPA_ESCURO = [
  { elementType: 'geometry', stylers: [{ color: '#121016' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#B8AECF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2A2140' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B0A12' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1A1524' }] },
];
const regiaoMapa = (p, delta = 0.3) => ({ latitude: p.lat, longitude: p.lon, latitudeDelta: delta, longitudeDelta: delta });

// Sem chave do Google Maps (APK Android): em vez do mapa embutido, abre o ponto no app de mapas do celular
function MapaAlternativo({ foco, height }) {
  const { c } = useTheme();
  const abrir = () => foco && Linking.openURL(`geo:${foco.lat},${foco.lon}?q=${foco.lat},${foco.lon}(${encodeURIComponent(foco.cidade ?? 'Ponto de medição')})`).catch(() => {});
  return (
    <View style={{ minHeight: Math.min(height, 200), borderRadius: 16, borderWidth: 1, borderColor: c.grid, backgroundColor: c.card, padding: 16, gap: 12, justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name="map" size={24} color={c.accent} accessibilityElementsHidden importantForAccessibility="no" />
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', flex: 1 }}>{foco ? foco.cidade : 'Pontos de medição'}</Text>
      </View>
      <Text style={{ color: c.sub, fontSize: 14 }}>O mapa embutido não está disponível nesta versão do app. Escolha o ponto pelos botões de cidade e, se quiser ver onde ele fica, abra no app de mapas.</Text>
      {foco ? <Btn kind="ghost" icon="open-outline" label="Abrir no app de mapas" onPress={abrir} /> : null}
    </View>
  );
}

function Mapinha({ pontos, foco, height = 320, interativo = true, mapRef, onMarker, delta }) {
  const { c } = useTheme();
  if (!MAPA_EMBUTIDO) return <MapaAlternativo foco={foco} height={height} />;
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.grid }}
      accessible={!interativo} accessibilityLabel={foco ? `Mapa: ${foco.local}` : 'Mapa'}>
      <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={foco ? regiaoMapa(foco, delta) : undefined}
        scrollEnabled={interativo} zoomEnabled={interativo} rotateEnabled={false} pitchEnabled={false}
        userInterfaceStyle={c.dark ? 'dark' : 'light'}
        customMapStyle={Platform.OS === 'android' && c.dark ? MAPA_ESCURO : undefined}>
        {pontos.map((p) => (
          <React.Fragment key={p.id}>
            <MapCircle center={{ latitude: p.lat, longitude: p.lon }} radius={2000}
              fillColor={c.area} strokeColor={c.accent} strokeWidth={1} />
            <Marker coordinate={{ latitude: p.lat, longitude: p.lon }} pinColor={c.primary}
              title={p.cidade} description={p.latencia != null ? `${p.latencia} ms · ${classificar(p)}` : undefined}
              onPress={() => onMarker && onMarker(p)} />
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
}

export function Mapa({ navigation }) {
  const { c } = useTheme();
  const { modelo, regiao, setRegiao } = usePreferencias();
  const [s, setS] = useState(null);
  const [sel, setSel] = useState(0);
  const mapRef = useRef(null);
  const [avisos, setAvisos] = useState({});
  useEffect(() => {
    let vivo = true;
    getServidores({ modelo }).then(async (lista) => {
      if (!vivo) return;
      setS(lista);
      const i = lista.findIndex((x) => x.id === regiao.id);
      setSel(i >= 0 ? i : 0);
      if (lista.meta?.fonte !== 'api') return; // só aprende rota com dado vindo da API
      const r = {};
      for (const x of lista) r[x.id] = await analisarRota(x);
      if (vivo) setAvisos(r);
    });
    return () => { vivo = false; };
  }, [modelo]);
  const p = s?.[sel];
  const focar = (k) => { setSel(k); mapRef.current?.animateToRegion(regiaoMapa(s[k]), 600); };
  const atual = p && p.id === regiao.id;
  return (
    <Screen>
      <TituloTela>Pontos de medição</TituloTela>
      <P style={{ color: c.sub }}>Pontos da rede RIPE Atlas que a API usa como referência. Escolha o da sua região.</P>
      <AvisoDados info={s?.meta} />
      {!s ? <P>Carregando pontos… (o servidor pode levar até 1 minuto para acordar)</P> : (
        <>
          <Chips items={s.map((x) => x.cidade)} sel={sel} onSel={focar} scroll label="Ponto de medição" />
          <Mapinha pontos={s} foco={p} mapRef={mapRef}
            onMarker={(m) => setSel(s.findIndex((x) => x.id === m.id))} />
          {p && (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location" size={24} color={c.accent} />
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', flex: 1 }}>{p.cidade}</Text>
              </View>
              <P style={{ color: c.sub }}>{p.operadora ? `${p.operadora} · ` : ''}{p.asn ? `AS${p.asn} · ` : ''}probe {p.id}</P>
              <Badge status={classificar(p)} />
              {p.latencia != null && <P style={{ color: c.sub, fontSize: 14 }}>Às {p.hora}: {p.latencia} ms · {p.perda}% de perda · nota {p.nota}</P>}
              <AvisoRota aviso={avisos[p.id]} />
              {atual
                ? <Row icon="checkmark-circle" label="Esta é a sua região" />
                : <Btn label="Usar esta região" icon="location" onPress={() => setRegiao({ id: p.id, cidade: p.cidade, origem: 'mapa' })} />}
              <Btn kind="ghost" label="Detalhes do ponto" icon="server" onPress={() => navigation.navigate('Servidor', { x: p })} />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

/* ---------- ALERTAS ---------- */
const MSG_ALERTA = {
  '-1': 'Sem previsão do servidor agora. Tentamos de novo ao abrir o app.',
  '-2': 'Alertas desligados.',
  '-3': 'Notificações bloqueadas. Ative nas configurações do celular.',
  '-4': 'Este aparelho não deixou agendar avisos. No Expo Go do Android as notificações são limitadas; num build do app elas funcionam.',
  0: 'Nenhum horário ruim previsto. Sem avisos por enquanto.',
};
export function Alertas() {
  const { c } = useTheme();
  const { regiao } = usePreferencias();
  const [on, setOn] = useState(PREFS_PADRAO);
  const [msg, setMsg] = useState('');
  useEffect(() => { lerPrefs().then(setOn); }, []);
  const mudar = async (k, v) => {
    const novo = { ...on, [k]: v };
    setOn(novo); await salvarPrefs(novo);
    if (v) await pedirPermissao();
    const n = await reagendarAlertas();
    setMsg(n > 0 ? `${n} aviso(s) agendado(s) para hoje e amanhã.` : MSG_ALERTA[n]);
  };
  const Sw = ({ k, label }) => (
    <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <P style={{ flex: 1 }}>{label}</P>
      <Switch value={on[k]} onValueChange={(v) => mudar(k, v)} accessibilityLabel={label}
        trackColor={{ true: c.primary, false: c.border }} thumbColor="#FFFFFF" />
    </View>
  );
  return (
    <Screen>
      <TituloTela>Alertas</TituloTela>
      <Card><Sw k="risco" label="Avisar quando estiver Regular" /><Sw k="falha" label="Avisar quando estiver Instável" /></Card>
      <Card><Sw k="medicao" label="Avisar na hora quando a medição real der Instável" /></Card>
      <P style={{ color: c.sub }}>Usamos a previsão de {regiao.cidade}. Só avisamos se a conexão ficar ruim por 2 horas seguidas ou mais, para evitar alarme falso. O aviso chega 30 minutos antes.</P>
      <P style={{ color: c.sub }}>O aviso da medição real é diferente: chega no momento em que uma medição do seu aparelho (botão ou automática) dá Instável ou não recebe resposta.</P>
      {msg ? <P accessibilityLiveRegion="polite">{msg}</P> : null}
    </Screen>
  );
}

/* ---------- VPN E PRIVACIDADE ---------- */
export function Privacidade() {
  return (
    <Screen>
      <TituloTela>VPN e privacidade</TituloTela>
      <Card>
        <P>• Não coletamos dados pessoais.</P>
        <P>• Se você usar "minha localização", ela é usada só no celular para achar o ponto de medição mais próximo. A localização não é enviada para a API nem salva.</P>
        <P>• Para a API vão apenas o ponto de medição escolhido e o modelo de previsão.</P>
        <P>• "Medir minha conexão agora" faz {AMOSTRAS} requisições vazias a um servidor de teste do Google só para cronometrar o tempo de resposta. Nenhum dado pessoal é enviado e o resultado fica só no celular.</P>
        <P>• A previsão é do ponto de medição da sua região, não uma medição do seu aparelho.</P>
        <P>• Usar VPN pode aumentar a latência: o caminho fica mais longo, mesmo sem defeito na rede.</P>
      </Card>
    </Screen>
  );
}

/* ---------- AJUSTES DA MEDIÇÃO REAL (automática) ---------- */
function CartaoMedicaoAuto({ navigation }) {
  const { c } = useTheme();
  const { auto, setAuto } = useMedicao();
  const label = 'Medir automaticamente com o app aberto';
  return (
    <Card>
      <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Medição real</Text>
      <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <P style={{ flex: 1 }}>{label}</P>
        <Switch value={auto.ligado} onValueChange={(v) => setAuto({ ...auto, ligado: v })} accessibilityLabel={label}
          trackColor={{ true: c.primary, false: c.border }} thumbColor="#FFFFFF" />
      </View>
      {auto.ligado ? (
        <>
          <Text style={{ color: c.sub, fontSize: 14 }}>Intervalo entre as medições</Text>
          <Chips items={INTERVALOS_MIN.map((m) => `${m} min`)} sel={Math.max(0, INTERVALOS_MIN.indexOf(auto.intervalo))}
            onSel={(k) => setAuto({ ...auto, intervalo: INTERVALOS_MIN[k] })} label="Intervalo" />
        </>
      ) : null}
      <P style={{ color: c.sub, fontSize: 14 }}>O celular não permite medir com o app fechado; a medição automática acontece só enquanto ele está aberto.</P>
      <Row icon="time" label="Histórico de medições" onPress={() => navigation.navigate('Historico')} />
    </Card>
  );
}

/* ---------- STATUS DO SERVIDOR DA API (GET /health) ---------- */
const ESTADO_API = {
  online: ['Boa', 'Online'],
  lento: ['Regular', 'Respondendo devagar (servidor acordando)'],
  fora: ['Instável', 'Fora do ar ou sem conexão'],
};
function CartaoStatusAPI() {
  const { c } = useTheme();
  const [st, setSt] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const verificar = async () => {
    setVerificando(true);
    const r = await verificarAPI();
    setSt({ ...r, quando: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    setVerificando(false);
    AccessibilityInfo.announceForAccessibility(`Servidor da previsão: ${ESTADO_API[r.estado][1]}`);
  };
  useEffect(() => { verificar(); }, []);
  return (
    <Card>
      <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Servidor da previsão</Text>
      {st ? (
        <>
          <Badge status={ESTADO_API[st.estado][0]} />
          <P>{ESTADO_API[st.estado][1]} · resposta em {(st.ms / 1000).toFixed(1).replace('.', ',')} s · verificado às {st.quando}</P>
        </>
      ) : <P>Verificando…</P>}
      <Btn label={verificando ? 'Verificando…' : 'Verificar de novo'} icon="refresh" kind="ghost"
        onPress={verificando ? undefined : verificar} hint="Consulta o status da Internet Quality API" />
    </Card>
  );
}

/* ---------- HISTÓRICO DE MEDIÇÕES ---------- */
export function Historico() {
  const { c } = useTheme();
  const { versao } = useMedicao();
  const [lista, setLista] = useState(null);
  useEffect(() => { lerHistorico().then(setLista); }, [versao]);
  if (!lista) return <Screen><P>Carregando…</P></Screen>;
  const r = resumoHistorico(lista);
  const limpar = async () => { await limparHistorico(); setLista([]); };
  return (
    <Screen>
      <TituloTela>Histórico de medições</TituloTela>
      {lista.length === 0 ? (
        <P>Nenhuma medição ainda. Use "Medir minha conexão agora" no Início ou ligue a medição automática em Ajustes.</P>
      ) : (
        <>
          <Card>
            <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Resumo</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' }}>
              <Metric label="Medições" value={r.total} unit="" center />
              <Metric label="Latência média" value={r.latenciaMedia ?? '—'} unit="ms" center />
              <Metric label="Instáveis" value={r.instaveis} unit="" center />
            </View>
            <P style={{ color: c.sub, fontSize: 14 }}>Guardamos as {HIST_MAX} medições mais recentes, só neste celular.</P>
          </Card>
          {lista.map((m) => {
            const d = new Date(m.quando);
            const data = `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            return (
              <Card key={m.quando}>
                <Text style={{ color: c.sub, fontSize: 14 }}>{data} · {m.origem === 'auto' ? 'automática' : 'manual'}</Text>
                <Badge status={m.status ?? classificar(m)} />
                <P>{m.falhou ? 'Nenhum teste respondeu (sem internet).' : `Latência ${m.latencia} ms · Jitter ${m.jitter} ms · Perda ${m.perda}%`}</P>
              </Card>
            );
          })}
          <Btn label="Apagar histórico" icon="trash" kind="ghost" onPress={limpar} />
        </>
      )}
    </Screen>
  );
}

/* ---------- COMPARAÇÃO DOS MODELOS (GET /compare) ---------- */
export function Comparacao({ route }) {
  const { c } = useTheme();
  const { regiao, modelo } = usePreferencias();
  const [r, setR] = useState(undefined); // undefined = carregando · null = sem resposta
  const quando = route.params?.quando;
  useEffect(() => {
    let vivo = true;
    getComparacao({ probe: regiao.id, quando }).then((x) => vivo && setR(x));
    return () => { vivo = false; };
  }, [regiao.id, quando]);
  return (
    <Screen>
      <TituloTela>Comparar os modelos</TituloTela>
      <P style={{ color: c.sub }}>Mesmo horário e mesmo ponto de medição ({regiao.cidade}), previstos por cada modelo da turma. A API não diz qual é o melhor: as diferenças vêm só das previsões.</P>
      {r === undefined ? <P>Carregando… (o servidor pode levar até 1 minuto para acordar)</P>
        : r === null ? <P>Não foi possível comparar agora. Verifique a internet e tente de novo.</P> : (
          <>
            <P>Horário comparado: {r.hora} (dia de referência {r.base}){r.fonte === 'cache' ? ' · resposta salva' : ''}</P>
            {r.modelos.map((m) => (
              <Card key={m.id}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{m.nome}{m.id === modelo ? ' (em uso)' : ''}</Text>
                <Badge status={m.qualidade ?? classificar(m)} />
                <P>Latência {m.latencia} ms · Perda {m.perda}%</P>
              </Card>
            ))}
          </>
        )}
    </Screen>
  );
}

/* ---------- CONFIGURAÇÕES (aparência, previsão e mais) ---------- */
const TEMAS = [['claro', 'Claro', 'sunny'], ['escuro', 'Escuro', 'moon'], ['sistema', 'Automático', 'phone-portrait']];
export function Configuracoes({ navigation, onReset }) {
  const { c, pref, setPref } = useTheme();
  const { modelo, setModelo, regiao } = usePreferencias();
  const [modelos, setModelos] = useState([]);
  useEffect(() => { getModelos().then(setModelos); }, []);
  const baseTema = useBase(100);
  return (
    <Screen>
      <TituloTela>Configurações</TituloTela>
      <Card>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Aparência</Text>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TEMAS.map(([k, label, ic]) => {
            const ativo = pref === k;
            return (
              <Pressable key={k} onPress={() => setPref(k)} accessibilityRole="radio" accessibilityState={{ checked: ativo }}
                accessibilityLabel={`Tema ${label}`}
                style={{ flexGrow: 1, flexBasis: baseTema, minHeight: 72, padding: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 4,
                  backgroundColor: ativo ? c.primary : c.bg, borderWidth: 2, borderColor: ativo ? c.primary : c.grid }}>
                <Ionicons name={ic} size={24} color={ativo ? c.onPrimary : c.accent} />
                <Text style={{ color: ativo ? c.onPrimary : c.text, fontWeight: '700' }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <P style={{ color: c.sub, fontSize: 14 }}>Automático segue o modo claro/escuro do seu celular.</P>
      </Card>
      <Card>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Previsão</Text>
        <Row icon="location" label="Região" value={regiao.cidade} onPress={() => navigation.navigate('Mapa')} />
        <Row icon="git-compare" label="Comparar os modelos" onPress={() => navigation.navigate('Comparacao', {})} />
        <Text style={{ color: c.sub, fontSize: 14 }}>Modelo de previsão (cada grupo da turma treinou um)</Text>
        <View accessibilityRole="radiogroup">
          {modelos.map((m) => {
            const ativo = m.id === modelo;
            return (
              <Pressable key={m.id} onPress={() => setModelo(m.id)} accessibilityRole="radio" accessibilityState={{ checked: ativo }}
                accessibilityLabel={`${m.name}, ${m.groupName}, ${m.algorithm}`}
                style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                <Ionicons name={ativo ? 'radio-button-on' : 'radio-button-off'} size={24} color={c.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 16, fontWeight: ativo ? '700' : '400' }}>{m.name}</Text>
                  <Text style={{ color: c.sub, fontSize: 14 }}>{m.groupName} · {m.algorithm}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <CartaoStatusAPI />
      <CartaoMedicaoAuto navigation={navigation} />
      <Row icon="notifications" label="Alertas" onPress={() => navigation.navigate('Alertas')} />
      <Row icon="shield-checkmark" label="VPN e privacidade" onPress={() => navigation.navigate('Privacidade')} />
      <Row icon="help-circle" label="Ajuda" onPress={() => navigation.navigate('Ajuda')} />
      <Row icon="refresh" label="Rever introdução" onPress={onReset} />
      <P style={{ color: c.sub }}>O app respeita o tamanho de fonte do seu aparelho.</P>
    </Screen>
  );
}

/* ---------- DETALHES DO HORÁRIO ---------- */
export function DetalhesTeste({ route }) {
  const { x, rotulo } = route.params; const st = classificar(x);
  return (
    <Screen>
      <H>{rotulo ? `Previsão ${rotulo}` : `Previsão das ${x.hora}`}</H><Badge status={st} />
      <Metric label="Latência" value={x.latencia} unit="ms" />
      <Metric label="Perda de pacotes" value={x.perda} unit="%" />
      <Metric label="Nota de qualidade" value={x.nota} unit="/100" />
    </Screen>
  );
}

/* ---------- DIAGNÓSTICO DA CONEXÃO ---------- */
const AVISO_PADRAO = 'A previsão está associada ao ponto de medição da sua região e não é uma medição direta do seu aparelho.';
export function Diagnostico({ route }) {
  const { c } = useTheme();
  const { d, status, recomendacao, aviso } = route.params;
  const dicas = status === 'Boa' ? ['Tudo certo, nada a fazer.']
    : ['Aproxime-se do roteador ou use cabo.', 'Pause downloads grandes.', 'Reinicie o roteador se continuar assim.'];
  return (
    <Screen>
      <TituloTela>Diagnóstico</TituloTela><Badge status={status} />
      <Card><P>Latência {d.latencia} ms · Perda {d.perda}% · Nota {d.nota}/100</P></Card>
      {recomendacao ? <Card><Text style={{ fontWeight: '700', color: c.text }}>Recomendação da API</Text><P>{recomendacao}</P></Card> : null}
      <H>O que fazer</H>{dicas.map((t) => <P key={t}>• {t}</P>)}
      <P style={{ color: c.sub, fontSize: 14 }}>{aviso || AVISO_PADRAO}</P>
      <H>Termos</H>
      {Object.entries(GLOSSARIO).map(([k, v]) => <Card key={k}><Text style={{ fontWeight: '700', color: c.text }}>{k}</Text><P>{v}</P></Card>)}
    </Screen>
  );
}

/* ---------- DETALHES DO PONTO DE MEDIÇÃO ---------- */
export function Servidor({ route }) {
  const { c } = useTheme();
  const x = route.params.x;
  const [aviso, setAviso] = useState(null);
  useEffect(() => { lerAvisoRota(x.id, x.hora).then(setAviso); }, [x.id, x.hora]);
  return (
    <Screen>
      <H>{x.nome}</H><Badge status={classificar(x)} />
      <AvisoRota aviso={aviso} />
      {x.lat != null && (
        <>
          <Mapinha pontos={[x]} foco={x} height={200} interativo={false} delta={0.05} />
          <P>Local de medição: {x.local}</P>
        </>
      )}
      <P>Operadora: {x.operadora ?? 'não informada'}{x.asn ? ` (AS${x.asn})` : ''}</P>
      <P>País: {x.pais} · Probe RIPE Atlas nº {x.id}</P>
      {x.latencia != null && (
        <>
          <P style={{ color: c.sub }}>Previsão às {x.hora}</P>
          <Metric label="Latência" value={x.latencia} unit="ms" />
          <Metric label="Perda" value={x.perda} unit="%" />
          <Metric label="Nota" value={x.nota} unit="/100" />
        </>
      )}
      <P style={{ color: c.sub }}>{AVISO_PADRAO} As coordenadas públicas dos pontos são aproximadas pelo RIPE Atlas, por privacidade.</P>
    </Screen>
  );
}

/* ---------- AJUDA ---------- */
export function Ajuda() {
  const { c } = useTheme();
  return (
    <Screen>
      <TituloTela>Ajuda</TituloTela>
      {Object.entries(GLOSSARIO).map(([k, v]) => <Card key={k}><Text style={{ fontWeight: '700', color: c.text }}>{k}</Text><P>{v}</P></Card>)}
      <Card><Text style={{ fontWeight: '700', color: c.text }}>Boa / Regular / Instável</Text>
        <P>A classificação vem da própria API (regra experimental do protótipo da disciplina), a partir da latência e da perda previstas.</P>
        <P style={{ color: c.sub, fontSize: 14 }}>Sem conexão com a API, o app usa uma aproximação: abaixo de 1% de perda = Boa, de 1% a 5% = Regular, a partir de 5% = Instável.</P></Card>
      <Card><Text style={{ fontWeight: '700', color: c.text }}>Jogos online (estimativa)</Text>
        <P>A API não avalia jogos. Usamos o resultado de videochamada, que é a atividade mais exigente que ela avalia.</P></Card>
    </Screen>
  );
}
