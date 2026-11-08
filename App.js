import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Barra nativa (iOS 26 = Liquid Glass automático)
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as S from './src/screens';
import { ThemeProvider, useTheme } from './src/theme';
import { reagendarAlertas } from './src/alertas';
import { IOS, PlataformaProvider, useGlass } from './src/plataforma';
import { navRef, StatusAgoraProvider, StatusAcessorio, ACESSORIO_DISPONIVEL } from './src/statusAgora';
import { PreferenciasProvider, usePreferencias } from './src/preferencias';
import { MedicaoProvider } from './src/medicaoCtx';
import { ProtecaoErro } from './src/erro';

const Stack = createNativeStackNavigator();
// iOS usa a barra nativa do sistema; Android continua com a barra atual
const Tab = IOS ? createNativeBottomTabNavigator() : createBottomTabNavigator();
const sf = { Início: 'house.fill', Velocidade: 'speedometer', Mapa: 'map.fill', Alertas: 'bell.fill', Ajustes: 'gearshape.fill' };
const icons = { Início: 'home', Velocidade: 'speedometer', Mapa: 'map', Alertas: 'notifications', Ajustes: 'settings' };
// iOS: título grande nativo no topo de cada aba (no Android o título continua dentro da tela)
const TITULOS = { Início: 'Sua conexão', Velocidade: 'Velocidade', Mapa: 'Pontos de medição', Alertas: 'Alertas', Ajustes: 'Ajustes' };
const acessorio = ACESSORIO_DISPONIVEL ? ({ placement }) => <StatusAcessorio placement={placement} /> : undefined;

function Tabs() {
  const { c } = useTheme();
  const glass = useGlass();
  return (
    <Tab.Navigator screenOptions={({ route }) => (IOS
      ? {
        tabBarIcon: () => ({ type: 'sfSymbol', name: sf[route.name] }),
        tabBarActiveTintColor: c.accent,
        tabBarLabel: route.name,
        tabBarMinimizeBehavior: 'onScrollDown',   // iOS 26: barra encolhe ao rolar para baixo
        bottomAccessory: acessorio,                // iOS 26: pílula de vidro com o status de agora
        title: TITULOS[route.name],
        headerShown: true,
        headerLargeTitleEnabled: true,             // título grande que encolhe ao rolar
        headerTransparent: true,                   // conteúdo passa por baixo (efeito de borda do sistema)
        headerBlurEffect: glass ? undefined : 'systemChromeMaterial', // iOS < 26 / reduzir transparência
        headerTintColor: c.accent,
      }
      : {
        tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
        tabBarActiveTintColor: c.accent, tabBarInactiveTintColor: c.sub,
        tabBarStyle: { minHeight: 60, backgroundColor: c.bg, borderTopColor: c.grid },
      })}>
      <Tab.Screen name="Início" component={S.Painel} />
      <Tab.Screen name="Velocidade" component={S.Velocidade} />
      <Tab.Screen name="Mapa" component={S.Mapa} />
      <Tab.Screen name="Alertas" component={S.Alertas} />
      <Tab.Screen name="Ajustes">{(p) => <S.Configuracoes {...p} onReset={() => p.navigation.getParent()?.navigate('Onboarding')} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

function Navegacao() {
  const { c, pronto: temaPronto } = useTheme();
  const glass = useGlass();
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => { AsyncStorage.getItem('onboarded').then((v) => { setSeen(v === '1'); setReady(true); }); }, []);
  const { modelo, regiao, pronto } = usePreferencias();
  // renova avisos ao abrir e sempre que o modelo ou a região mudarem
  useEffect(() => { if (ready && pronto) reagendarAlertas().catch(() => {}); }, [ready, pronto, modelo, regiao.id]);
  if (!ready || !temaPronto) return null; // espera o tema salvo (sem piscar) e a introdução
  const base = c.dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, dark: c.dark, colors: { ...base.colors, primary: c.accent, background: c.bg, card: c.bg, text: c.text, border: c.grid } };
  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName={seen ? 'Tabs' : 'Onboarding'}
        screenOptions={IOS ? {
          headerTransparent: true,                 // barra do sistema sobre o conteúdo
          headerBlurEffect: glass ? undefined : 'systemChromeMaterial',
          headerBackButtonDisplayMode: 'minimal',  // só a seta (padrão iOS 26), sem "Tabs" escrito
          headerTintColor: c.accent,
        } : undefined}>
        <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
          {({ navigation }) => <S.Onboarding onDone={() => { AsyncStorage.setItem('onboarded', '1'); navigation.replace('Tabs'); }} />}
        </Stack.Screen>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false, title: 'Início' }} />
        <Stack.Screen name="DetalhesTeste" component={S.DetalhesTeste} options={{ title: 'Detalhes do horário' }} />
        <Stack.Screen name="Diagnostico" component={S.Diagnostico} options={{ title: 'Diagnóstico da conexão' }} />
        <Stack.Screen name="Servidor" component={S.Servidor} options={{ title: 'Detalhes do servidor' }} />
        <Stack.Screen name="Privacidade" component={S.Privacidade} options={{ title: 'VPN e privacidade' }} />
        <Stack.Screen name="Ajuda" component={S.Ajuda} />
        <Stack.Screen name="Historico" component={S.Historico} options={{ title: 'Histórico de medições' }} />
        <Stack.Screen name="Comparacao" component={S.Comparacao} options={{ title: 'Comparar os modelos' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ProtecaoErro>
    <PlataformaProvider>
      <ThemeProvider>
        <PreferenciasProvider>
          <StatusAgoraProvider><MedicaoProvider><Navegacao /></MedicaoProvider></StatusAgoraProvider>
        </PreferenciasProvider>
      </ThemeProvider>
    </PlataformaProvider>
    </ProtecaoErro>
  );
}
