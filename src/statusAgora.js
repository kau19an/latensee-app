import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createNavigationContainerRef } from '@react-navigation/native';
import { getPerfil, naHora } from './api';
import { usePreferencias } from './preferencias';
import { classificar, STATUS, useTheme } from './theme';
import { IOS_VERSAO } from './plataforma';

// Referência da navegação, para o acessório (fora das telas) conseguir abrir o Início
export const navRef = createNavigationContainerRef();

// Pílula de vidro acima das abas (bottomAccessory) — só existe no iOS 26+
export const ACESSORIO_DISPONIVEL = IOS_VERSAO >= 26;
const ATUALIZAR_MIN = 10;

/* ---------- Status de "agora", compartilhado ---------- */
// O sistema desenha o acessório duas vezes (normal e minimizado), então o estado fica aqui fora.
const Ctx = createContext(null);
export function StatusAgoraProvider({ children }) {
  const [agora, setAgora] = useState(null);
  const { modelo, regiao, pronto } = usePreferencias();
  useEffect(() => {
    if (!ACESSORIO_DISPONIVEL || !pronto) return undefined; // Android e iOS antigo: não busca nada a mais
    let vivo = true;
    const carregar = () => getPerfil({ modelo, probe: regiao.id })
      .then((itens) => {
        const d = naHora(itens, new Date().getHours());
        if (vivo && d) setAgora({ ...d, status: classificar(d), fonte: itens.meta.fonte, cidade: regiao.cidade });
      })
      .catch(() => {});
    carregar();
    const timer = setInterval(carregar, ATUALIZAR_MIN * 60000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && carregar());
    return () => { vivo = false; clearInterval(timer); sub.remove(); };
  }, [modelo, regiao.id, pronto]);
  return <Ctx.Provider value={agora}>{children}</Ctx.Provider>;
}

export function StatusAcessorio({ placement }) {
  const { c } = useTheme();
  const agora = useContext(Ctx);
  const inline = placement === 'inline'; // barra de abas minimizada: versão curta
  const abrir = () => navRef.isReady() && navRef.navigate('Tabs', { screen: 'Início' });

  if (!agora) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
        <Text style={{ color: c.sub, fontSize: 15 }}>{inline ? '…' : 'Verificando conexão…'}</Text>
      </View>
    );
  }
  const st = STATUS[agora.status];
  const cor = c[st.cor];
  const exemplo = agora.fonte === 'mock';
  const label = `Conexão agora: ${agora.status}, latência ${agora.latencia} milissegundos${exemplo ? ', dados de exemplo' : ''}. Toque para abrir o Início.`;
  return (
    <Pressable onPress={abrir} accessibilityRole="button" accessibilityLabel={label}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }}>
      <Ionicons name={st.icon} size={inline ? 18 : 20} color={cor} />
      {inline ? (
        <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>{agora.latencia} ms</Text>
      ) : (
        <>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: '600', flex: 1 }} numberOfLines={1}>
            Agora: <Text style={{ color: cor }}>{agora.status}</Text>{exemplo ? <Text style={{ color: c.sub, fontWeight: '400' }}> · exemplo</Text> : null}
          </Text>
          <Text style={{ color: c.sub, fontSize: 15 }}>{agora.latencia} ms</Text>
        </>
      )}
    </Pressable>
  );
}
