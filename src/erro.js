import React from 'react';
import { ScrollView, Text } from 'react-native';

// Se algum erro de código acontecer ao desenhar as telas, mostramos o erro em texto
// em vez de o app fechar sozinho ("falhas contínuas"). Ajuda a diagnosticar e não deixa o usuário sem resposta.
export class ProtecaoErro extends React.Component {
  constructor(props) { super(props); this.state = { erro: null }; }
  static getDerivedStateFromError(erro) { return { erro }; }
  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#000000' }} contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 12 }}>
        <Text accessibilityRole="header" style={{ color: '#F5F3FF', fontSize: 22, fontWeight: '700' }}>O Latensee encontrou um erro</Text>
        <Text style={{ color: '#F5F3FF', fontSize: 16 }}>Feche e abra o app de novo. Se continuar, envie o texto abaixo para a equipe.</Text>
        <Text selectable style={{ color: '#B8AECF', fontSize: 14 }}>{String(erro?.message ?? erro)}</Text>
        <Text selectable style={{ color: '#B8AECF', fontSize: 12 }}>{String(erro?.stack ?? '').slice(0, 2000)}</Text>
      </ScrollView>
    );
  }
}
