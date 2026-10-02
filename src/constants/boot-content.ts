export const BOOT_MESSAGES = [
  { fromSeconds: 0, text: "Conectando ao servidor..." },
  { fromSeconds: 6, text: "Acordando o servidor.\nIsso pode levar até um minuto." },
  { fromSeconds: 30, text: "Só mais um pouco..." },
] as const;

export function getBootMessage(elapsedSeconds: number): string {
  let current: string = BOOT_MESSAGES[0].text;
  for (const message of BOOT_MESSAGES) {
    if (elapsedSeconds >= message.fromSeconds) current = message.text;
  }
  return current;
}

export const BOOT_TEXT = {
  statusPrefix: "Status da API",
  statusLabels: {
    checking: "Verificando",
    active: "Ativa",
    unavailable: "Indisponível",
  },
  elapsed: (seconds: number) => `Aguardando há ${seconds}s`,
  activeTitle: "Tudo certo!",
  activeDescription: "Estamos te levando para o aplicativo.",
  unavailableTitle: "Não foi possível obter comunicação com o servidor",
  unavailableDescription:
    "Verifique sua conexão com a internet e tente novamente.",
  retry: "Tentar de novo",
  retryHint: "Tenta se conectar ao servidor mais uma vez",
  loadingIndicator: "Carregando",
} as const;
