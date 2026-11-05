# Integração com a Internet Quality API

Este documento explica como o Latensee passou a usar os dados reais da
[Internet Quality API](https://internet-quality-api.onrender.com/docs) (versão 0.2.0),
as decisões tomadas pelo grupo e as limitações conhecidas.

## 1. Por que o app mostrava sempre "dados de exemplo"

O `src/api.js` chamava caminhos provisórios (`/predict`, `/forecast`, `/history`, `/servers`)
que **não existem** na API. Todas as chamadas falhavam e o app caía nos dados de exemplo.
Os caminhos reais ficam em `/api/v1/...`.

## 2. Endpoints usados

| Endpoint | Uso no app |
|---|---|
| `GET /api/v1/models` | Lista de modelos (A, B, C, D — um por grupo) para escolher em Ajustes |
| `GET /api/v1/locations` | Os 10 pontos de medição (probes) no Mapa e no cálculo do ponto mais próximo |
| `GET /api/v1/forecasts/probes/{id}/timeline` | Previsão hora a hora: Início, Velocidade (janela de 11 dias), melhor horário, "Evite", alertas, pílula de status (iOS) |
| `GET /api/v1/forecasts/probes/{id}` | Descobrir a última data disponível, para centralizar a janela quando não há dados perto de hoje |
| `POST /api/v1/activity/check` | "O que dá para fazer" (videochamada, voz, streaming, navegação, envio de arquivos, mensagens) |

Não usados por enquanto: `/health`, `/models/{id}`, `/forecasts/nearby`
e `/forecasts/probes/{id}/compare`. O `/nearby` não é usado de propósito (ver Privacidade).

Todas as respostas ficam em cache no aparelho durante o dia. Sem internet, o app usa a última
resposta salva; sem nada salvo, usa dados de exemplo — e avisa o usuário nos dois casos.
O tempo limite das chamadas é de 45 s, porque o servidor gratuito do Render pode levar quase
1 minuto para "acordar".

## 3. Limitação principal: a API só tem previsões de um dia (20/08/2026)

Consultando a timeline do probe 900001 (São Paulo) com **os 4 modelos (A, B, C e D)**, a API devolve
**24 previsões em cada, uma por hora, todas de 20/08/2026 (UTC)**. Pedindo previsões a partir de hoje,
a resposta vem vazia.

Como o app lida com isso (**perfil diário**):

1. Primeiro tenta buscar previsões reais das próximas 24 h (`from` = agora).
2. Se vier vazio, usa as 24 previsões do último dia disponível como o **comportamento típico
   de cada hora do dia**, convertidas para o fuso do celular (ex.: 00:00 UTC = 21:00 em Brasília).
3. O usuário vê o aviso: *"Perfil diário previsto pelo Modelo A (base: 20/08/2026). A API ainda
   não tem previsões para hoje…"*.
4. O Início, os alertas e a pílula de status (iOS) usam esse perfil para "agora".

### Janela de 11 dias na tela Velocidade (requisito: 5 dias antes e 5 depois)

- **(a)** O app busca as previsões de **5 dias antes até 5 dias depois de hoje** (em blocos de 4 dias,
  porque a API devolve no máximo 100 itens por consulta).
- **(c)** Se não houver nada nessa janela, o app pergunta à API a **última data disponível**
  (`GET /forecasts/probes/{id}`) e monta a janela em volta dela — hoje, **de 15/08 a 25/08/2026** —
  com o aviso: *"A API não tem previsões para os 5 dias antes e depois de hoje…"*.
- Os dias são mostrados no fuso do celular. Como os dados são de 20/08 em UTC, no horário de Brasília
  eles caem em **19/08 (21h–23h)** e **20/08 (0h–20h)**: o app indica "previsão parcial".
- Dias sem dados aparecem como **"Sem previsão para este dia"** — nada é inventado.
- Quando a API tiver previsões perto de hoje, o app passa sozinho para o modo (a).

**Quando a API passar a ter datas reais, o app usa essas datas automaticamente**, sem mudar código
(o passo 1 passa a retornar dados).

## 4. Decisões do grupo

| Tema | Decisão |
|---|---|
| Classificação Boa/Regular/Instável | **Regra da API** (campo `quality`: GOOD/MODERATE/UNSTABLE) |
| Alertas com o perfil diário | **Mantidos funcionando** por enquanto (ver seção 5) |
| Região do usuário | **GPS se o usuário permitir; senão, escolha no mapa** (padrão: São Paulo) |
| Modelo de previsão | Escolha em Ajustes; o padrão depende da versão (seção 6) |
| "Jogos online" | Mantido como **estimativa do app**: usa o resultado de videochamada da API |

### Comparação das regras de classificação (mesmas 24 h, Modelo A, São Paulo)

| Regra | Boa | Regular | Instável |
|---|---|---|---|
| API (`quality`) | 8 h | 13 h | 3 h |
| Regra antiga do app (perda 0,5 / 2 %) | 5 h | 5 h | 14 h |

A regra antiga do app também usava jitter (20 / 50 ms), mas **a API não fornece jitter**. O card
"Jitter" foi trocado pela **nota de qualidade (0–100)** que a API calcula.

Sem dados da API (modo exemplo), o app usa uma **aproximação** da regra da API, observada na
timeline real dos 4 modelos: abaixo de 1 % de perda = Boa; de 1 % a 5 % = Regular; a partir de 5 % = Instável
(ex.: 0,9 % é Boa no Modelo B e 1,0 % já é Regular no Modelo D).

## 5. Alertas

Os alertas continuam avisando 30 minutos antes de trechos de 2 h ou mais com conexão Regular
ou Instável, para hoje e amanhã. **Enquanto a API só tiver o perfil diário, o mesmo perfil é usado
para os dois dias**, e o texto da notificação indica isso: *"… (perfil diário · Modelo A)"*.
O alerta também informa a região (ex.: "em São Paulo"). Os avisos são reagendados ao abrir o app
e sempre que o modelo ou a região mudam.

**Expo Go no Android:** o Expo Go limita notificações no Android e pode recusar a criação do canal
de alertas. O app trata essa falha e mostra a mensagem *"Este aparelho não deixou agendar avisos…"*
em vez de quebrar. Para testar os alertas no Android, use um build do app (EAS).

> Atenção: com o perfil diário, um alerta como "Instável prevista hoje às 15h" se baseia no dia
> de referência (20/08/2026), não em uma previsão para hoje.

## 6. Versões A e B

O código das duas versões é idêntico, exceto **uma linha** em `src/config.js`:

```js
export const MODELO_PADRAO = 'model-a'; // versão A
export const MODELO_PADRAO = 'model-b'; // versão B — trocar pelo modelo do nosso grupo
```

Nas duas versões o usuário pode trocar o modelo em **Ajustes → Previsão**.

## 7. Privacidade

- A localização (se o usuário permitir) é usada **só no celular**, para calcular o ponto de medição
  mais próximo (fórmula de Haversine sobre a lista de `/locations`). **Ela não é enviada à API**,
  por isso o app não usa `/forecasts/nearby`.
- No `POST /activity/check` o app envia as coordenadas **do ponto de medição**, não as do usuário.
- A permissão no iOS pede localização **aproximada** por padrão.
- A tela "VPN e privacidade" e o texto da introdução foram atualizados.

## 8. O que mudou em cada tela

| Tela | Mudança |
|---|---|
| Início | Cartão de região (GPS ou mapa); métricas Latência / Perda / Nota; atividades vindas da API (7 itens, incluindo Chamadas de voz e Mensagens); mensagem de recomendação da API |
| Velocidade | **Janela de 11 dias** (5 antes, o dia central, 5 depois) com dias vazios e parciais indicados; gráfico, melhor horário, "Evite" e lista **do dia escolhido**; **"Evite" agora lista só trechos seguidos** (ex.: "15:00–17:00"), corrigindo o "05:00 – 22:00" que juntava horários não seguidos |
| Mapa | Os 10 pontos reais da API com cidade e operadora; botão "Usar esta região"; saíram "Google DNS" e "Gateway local" (não existem na API) |
| Detalhes do ponto | Operadora (ASN), país e nº do probe; sem IP (a API nunca envia IP) |
| Ajustes | Nova seção "Previsão": região e escolha do modelo |
| Diagnóstico | Recomendação da API e o aviso obrigatório ("a previsão é do ponto de medição, não do seu aparelho") |
| Ajuda | Glossário atualizado (nota de qualidade, probe, modelo) e explicação da regra da API |
| Mudança de rota (contribuição do Ryan) | Sem jitter na API, "conexão saudável" passou a ser só perda ≤ 0,5 %; o histórico é guardado **por hora** para não confundir o pico da noite com troca de rota |

## 9. Pendências e pontos a confirmar

- [ ] Definir o **modelo do nosso grupo** e ajustar `MODELO_PADRAO` na versão B.
- [ ] Confirmar no material da disciplina se a regra "perda 0,5/2 % e jitter 20/50 ms" é da
      professora e se ela aceita usar a regra da API.
- [ ] Decidir se "Jogos online" deve ter uma regra própria de latência (hoje usa videochamada).
- [ ] "Melhor horário para…" usa uma regra local por qualidade (chamar a API para as 24 horas de
      cada atividade seria pesado demais); pode divergir da lista "O que dá para fazer".
- [ ] Os nomes das cidades e das operadoras vêm de uma tabela do app (`CIDADES` e `OPERADORAS`
      em `src/api.js`), porque a API só envia coordenadas e números de ASN. Conferir.
- [ ] Revisar os alertas quando a API tiver datas reais.
- [ ] Avisar quem mantém a API que **todos os modelos só têm 20/08/2026**: o requisito de 5 dias antes
      e depois só fica completo quando a API tiver mais datas.
- [ ] Expo sugere `react-native` 0.88.1 (o repositório está em 0.88.0).

## 10. Como testar

1. `npm install` e `npx expo start --go` (Android pelo Expo Go).
2. iOS sem Mac: `npx eas-cli build --platform ios --profile ios-simulator` e enviar o `.tar.gz` ao Appetize.
3. Na primeira abertura, o servidor pode demorar até 1 minuto: aguarde o "Carregando previsão…".
4. Conferir: aviso de perfil diário, região (GPS e mapa), troca de modelo em Ajustes, lista de
   atividades e o "Evite" na Velocidade.
