import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, AccessibilityInfo } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

// Ponto único para decidir "UI do sistema" vs. "UI atual".
// Android: nada muda (nativo = false, glass = false).
export const IOS = Platform.OS === 'ios';
export const IOS_VERSAO = IOS ? parseInt(String(Platform.Version), 10) : 0;
// Liquid Glass depende do iOS 26+ E do app compilado com o SDK do iOS 26 (Xcode 26)
const LIQUID_GLASS = IOS && isLiquidGlassAvailable();

const PlataformaCtx = createContext({ nativo: IOS, glass: false, reduzTransparencia: false });

export function PlataformaProvider({ children }) {
  // "Reduzir transparência" (Acessibilidade do iOS) desliga o vidro — um único listener para o app todo
  const [reduz, setReduz] = useState(false);
  useEffect(() => {
    if (!IOS) return undefined;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduz).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduz);
    return () => sub.remove();
  }, []);
  const value = useMemo(() => ({
    nativo: IOS,                       // usar controles do sistema (SwiftUI / UIKit)
    glass: LIQUID_GLASS && !reduz,     // usar efeitos Liquid Glass
    reduzTransparencia: reduz,
  }), [reduz]);
  return <PlataformaCtx.Provider value={value}>{children}</PlataformaCtx.Provider>;
}

export const usePlataforma = () => useContext(PlataformaCtx);
export const useGlass = () => useContext(PlataformaCtx).glass;
