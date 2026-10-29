import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as S from './src/screens';
import { ThemeProvider, useTheme } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const icons = { Início: 'home', Velocidade: 'speedometer', Mapa: 'map', Alertas: 'notifications', Ajustes: 'settings' };

function Tabs() {
  const { c } = useTheme();
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
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
  const { c } = useTheme();
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => { AsyncStorage.getItem('onboarded').then((v) => { setSeen(v === '1'); setReady(true); }); }, []);
  if (!ready) return null;
  const base = c.dark ? DarkTheme : DefaultTheme;
  const navTheme = { ...base, dark: c.dark, colors: { ...base.colors, primary: c.accent, background: c.bg, card: c.bg, text: c.text, border: c.grid } };
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <Stack.Navigator initialRouteName={seen ? 'Tabs' : 'Onboarding'}>
        <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
          {({ navigation }) => <S.Onboarding onDone={() => { AsyncStorage.setItem('onboarded', '1'); navigation.replace('Tabs'); }} />}
        </Stack.Screen>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="DetalhesTeste" component={S.DetalhesTeste} options={{ title: 'Detalhes do horário' }} />
        <Stack.Screen name="Diagnostico" component={S.Diagnostico} options={{ title: 'Diagnóstico da conexão' }} />
        <Stack.Screen name="Servidor" component={S.Servidor} options={{ title: 'Detalhes do servidor' }} />
        <Stack.Screen name="Privacidade" component={S.Privacidade} options={{ title: 'VPN e privacidade' }} />
        <Stack.Screen name="Alertas" component={S.Alertas} />
        <Stack.Screen name="Ajuda" component={S.Ajuda} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return <ThemeProvider><Navegacao /></ThemeProvider>;
}
