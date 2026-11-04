import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { MODELO_PADRAO, PROBE_PADRAO } from './config';
import { getLocais, probeMaisProximo, CIDADES } from './api';

// Preferências da previsão, salvas no aparelho:
//  modelo: id do modelo da API ('model-a'...)
//  regiao: { id, cidade, origem: 'padrao' | 'gps' | 'mapa', distanciaKm? }
const CHAVE = 'previsao';
const PADRAO = { modelo: MODELO_PADRAO, regiao: { id: PROBE_PADRAO, cidade: CIDADES[PROBE_PADRAO], origem: 'padrao' } };

export async function lerPreferencias() {
  try { return { ...PADRAO, ...JSON.parse(await AsyncStorage.getItem(CHAVE)) }; } catch (e) { return PADRAO; }
}

const Ctx = createContext({ ...PADRAO, pronto: false, setModelo: () => {}, setRegiao: () => {} });

export function PreferenciasProvider({ children }) {
  const [prefs, setPrefs] = useState(PADRAO);
  const [pronto, setPronto] = useState(false);
  useEffect(() => { lerPreferencias().then((p) => { setPrefs(p); setPronto(true); }); }, []);
  const salvar = (novo) => { setPrefs(novo); AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => {}); };
  const value = useMemo(() => ({
    ...prefs,
    pronto,
    setModelo: (modelo) => salvar({ ...prefs, modelo }),
    setRegiao: (regiao) => salvar({ ...prefs, regiao }),
  }), [prefs, pronto]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const usePreferencias = () => useContext(Ctx);

// Opção (c): usa o GPS se o usuário permitir. A conta do ponto mais próximo é feita NO CELULAR;
// a localização não é enviada para a API. Retorna a região ou { erro: 'negado' | 'falhou' }.
export async function regiaoPeloGPS() {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return { erro: 'negado' };
    const pos = (await Location.getLastKnownPositionAsync({ maxAge: 15 * 60000 }))
      ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    const p = probeMaisProximo(await getLocais(), pos.coords.latitude, pos.coords.longitude);
    if (!p) return { erro: 'falhou' };
    return { id: p.id, cidade: p.cidade, origem: 'gps', distanciaKm: p.distanciaKm };
  } catch (e) {
    return { erro: 'falhou' };
  }
}
