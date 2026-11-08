import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AccessibilityInfo } from 'react-native';
import { medirConexao, lerUltimaMedicao, lerAuto, salvarAuto, AUTO_PADRAO } from './medicao';
import { avisarMedicao } from './alertas';
import { analisarRota } from './rotas';

/* ============================================================
   Estado da MEDIÇÃO REAL compartilhado pelo app
   - medir(origem): roda uma medição (botão ou automática), sem deixar duas ao mesmo tempo
   - medição automática: com o app aberto, mede a cada "intervalo" minutos (RF02 do projeto)
   - cada resultado vai para o histórico e, se der Instável, dispara o alerta de falha real
   ============================================================ */
const Ctx = createContext(null);
export const useMedicao = () => useContext(Ctx);

export function MedicaoProvider({ children }) {
  const [ultima, setUltima] = useState(null);
  const [progresso, setProgresso] = useState(null); // null = parado · número = testes feitos
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState(null);         // possível troca de rota (Ryan)
  const [auto, setAutoState] = useState(AUTO_PADRAO);
  const [versao, setVersao] = useState(0);          // muda a cada medição (para o histórico recarregar)
  const ocupado = useRef(false);

  useEffect(() => {
    lerUltimaMedicao().then((m) => m && setUltima(m));
    lerAuto().then(setAutoState);
  }, []);

  const medir = useCallback(async (origem = 'manual') => {
    if (ocupado.current) return null;
    ocupado.current = true;
    setErro(''); setProgresso(0);
    try {
      const m = await medirConexao({ origem, aoProgredir: (feitas) => setProgresso(feitas) });
      setVersao((v) => v + 1);
      avisarMedicao(m);
      if (m.erro) {
        setErro('Não foi possível medir: parece que o celular está sem internet.');
        return m;
      }
      setUltima(m);
      setAviso(await analisarRota({ id: 'medicao', ...m }));
      if (origem === 'manual') {
        AccessibilityInfo.announceForAccessibility(`Medição concluída: latência ${m.latencia} milissegundos, jitter ${m.jitter}, perda ${m.perda} por cento, conexão ${m.status}`);
      }
      return m;
    } finally {
      setProgresso(null);
      ocupado.current = false;
    }
  }, []);

  const setAuto = useCallback((novo) => { setAutoState(novo); salvarAuto(novo); }, []);

  // Medição automática: só enquanto o app está aberto e em primeiro plano
  useEffect(() => {
    if (!auto.ligado) return undefined;
    let ativo = AppState.currentState === 'active';
    const timer = setInterval(() => { if (ativo) medir('auto'); }, auto.intervalo * 60000);
    const sub = AppState.addEventListener('change', (s) => { ativo = s === 'active'; });
    return () => { clearInterval(timer); sub.remove(); };
  }, [auto.ligado, auto.intervalo, medir]);

  return (
    <Ctx.Provider value={{ ultima, progresso, erro, aviso, medir, auto, setAuto, versao }}>
      {children}
    </Ctx.Provider>
  );
}
