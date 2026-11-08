# Medição real da conexão ("Medir minha conexão agora")

Branch `feat/medicao-real` — projeto 2, separado da janela de projeção (`feat/janela-projecao`).

## Por que existe

A Internet Quality API entrega **previsões já calculadas** (lidas de um CSV), feitas para os pontos de
medição (probes) do RIPE Atlas. Ela não mede a rede do usuário e não fornece jitter. Este recurso faz o
**próprio celular medir a conexão dele, agora**, ao lado da previsão.

| | Previsão (API) | Medição (este recurso) |
|---|---|---|
| De onde vem | Modelos da turma (CSV na API) | O celular, na hora |
| Sobre o quê | Ponto de medição da região | A internet do aparelho |
| Quando | Perfil diário (base 20/08/2026) | Agora |
| Jitter | Não tem | **Tem** |

## Como mede (`src/medicao.js`)

1. Faz 1 requisição de aquecimento (descartada: inclui DNS e abertura da conexão segura).
2. Faz **20 requisições** pequenas, com 150 ms de intervalo, e cronometra cada uma.
   - Servidor: `https://www.google.com/generate_204` — endpoint do Google feito para checar conexão,
     responde vazio (HTTP 204) e tem servidores no Brasil.
   - Cada URL leva `?t=<horário>` e o cabeçalho `Cache-Control: no-cache`, para não vir de cache.
3. Calcula:
   - **Latência** = média dos tempos de ida e volta;
   - **Jitter** = média da diferença absoluta entre um tempo e o seguinte;
   - **Perda** = % de requisições que falharam ou passaram de 3 s (cada uma = 5 %).
4. Guarda a última medição no aparelho (`AsyncStorage`, chave `ultimaMedicao`).

Leva cerca de 7 segundos. A classificação Boa/Regular/Instável usa a mesma aproximação da regra da
API usada sem internet (perda: abaixo de 1 % = Boa; de 1 % a 5 % = Regular; a partir de 5 % = Instável).

## Limitações (importante para a apresentação)

- **Não é um ping de verdade** (ICMP, como o RIPE Atlas faz): é medição por HTTP, que inclui um pouco de
  processamento do servidor. Os valores tendem a sair um pouco maiores que os de um ping.
- Com 20 amostras, a perda tem resolução de **5 %**: uma única falha já leva a medição para "Instável".
- Mede até **um** servidor (Google). Outro destino daria outros números.
- **Previsto e medido não devem ser iguais**: um é do probe da região, o outro é do aparelho do usuário.
  O app mostra os dois lado a lado e explica isso.

## Integração com a detecção de mudança de rota (contribuição do Ryan)

Cada medição alimenta a detecção de rota (`src/rotas.js`) com a chave `medicao`, por hora do dia.
Depois de 10 medições na mesma hora, se a latência saltar mais de 3 desvios padrão **com perda e jitter
baixos**, o app mostra "Rota alterada". Aqui ela usa **dados reais e jitter real** — na previsão isso não
era possível.

## Privacidade

As requisições são vazias (não enviam dados pessoais) e o resultado fica só no celular. A tela
"VPN e privacidade" foi atualizada com essa informação.

## Onde aparece

Início → cartão **"Sua conexão agora (medida)"**, logo abaixo da previsão, com latência, jitter, perda,
a classificação e a comparação com a previsão da mesma hora. O termo "Jitter" voltou ao glossário.

## Como testar

1. `npx expo start --go` e abrir o Início.
2. Tocar em **"Medir minha conexão agora"** e aguardar ~7 s ("Medindo… N/20").
3. Ver os números e a comparação com o previsto.
4. Ativar o modo avião e medir de novo: deve aparecer "parece que o celular está sem internet".

## Recursos adicionados na v6 (alinhamento com o tutorial do projeto integrador)

| Recurso | Onde | Item do tutorial |
|---|---|---|
| Histórico de medições (fila com as 50 mais recentes, incluindo as que falharam) + resumo (total, latência média, nº de Instáveis) | Botão "Ver histórico de medições" no Início; Ajustes → Medição real | RF03, RF05; Etapa 3 (listas/filas e agregação) |
| Medição automática a cada 5, 15 ou 30 min, só com o app aberto (desligada por padrão) | Ajustes → Medição real | RF02 (verificações em intervalos) |
| Alerta de falha real: notificação na hora quando a medição dá Instável ou ninguém responde | Alertas → "Avisar na hora quando a medição real der Instável" | RF05 (alertas) |
| Equivalência de status: Boa = OK, Regular = RISCO, Instável = FALHA | Ajuda / glossário | Classificação OK, RISCO ou FALHA |
| Comparação dos modelos A–D no mesmo horário (`GET /forecasts/probes/{id}/compare`) | Início → "Comparar os 4 modelos"; Ajustes → Previsão | Redes: comparação dos modelos |
| Status do servidor da API (`GET /health`) com tempo de resposta | Ajustes → Servidor da previsão | Etapa 4: cenário indisponível |

Limitações que continuam: a medição é por HTTP (o celular não permite ICMP sem código nativo) e não roda com o app fechado.
