import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { TEMAS, type NomeTema, type TemaCores } from '@/styles/temas';

const CHAVE_TEMA = 'gerencia.tema';

type ContextoTema = {
  tema: NomeTema;
  cores: TemaCores;
  carregado: boolean;
  definirTema: (tema: NomeTema) => void;
};

const TemaContext = createContext<ContextoTema>({
  tema: 'light',
  cores: TEMAS.light,
  carregado: false,
  definirTema: () => {},
});

function normalizar(valor: unknown): NomeTema | null {
  return valor === 'light' || valor === 'dark' ? valor : null;
}

async function lerTemaSalvo(): Promise<NomeTema | null> {
  try {
    const bruto =
      Platform.OS === 'web'
        ? typeof window !== 'undefined'
          ? window.localStorage.getItem(CHAVE_TEMA)
          : null
        : await SecureStore.getItemAsync(CHAVE_TEMA);
    return normalizar(bruto);
  } catch {
    return null;
  }
}

async function guardarTema(tema: NomeTema): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(CHAVE_TEMA, tema);
      return;
    }
    await SecureStore.setItemAsync(CHAVE_TEMA, tema);
  } catch {
    // Preferência de aparência não pode quebrar o app.
  }
}

/**
 * Provedor central de tema do GERENCIA Mobile.
 * Padrão: `light` para novas instalações; respeita o valor salvo.
 */
export function ProvedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<NomeTema>('light');
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const salvo = await lerTemaSalvo();
      if (!ativo) return;
      if (salvo) setTema(salvo);
      setCarregado(true);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const definirTema = useCallback((proximo: NomeTema) => {
    setTema(proximo);
    void guardarTema(proximo);
  }, []);

  const valor = useMemo<ContextoTema>(
    () => ({ tema, cores: TEMAS[tema], carregado, definirTema }),
    [tema, carregado, definirTema],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

/** Acesso ao tema atual: `const { cores, tema, definirTema } = useTema();` */
export function useTema(): ContextoTema {
  return useContext(TemaContext);
}
