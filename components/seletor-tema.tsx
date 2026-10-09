import { Moon, Sun } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTema } from '@/hooks/use-tema';
import type { NomeTema, TemaCores } from '@/styles/temas';

/**
 * Seletor de aparência (Claro / Escuro) — segmento simples para usuário comum.
 * Usa as cores do tema ativo; a troca é global e persistida pelo `ProvedorTema`.
 */
export function SeletorTema() {
  const { cores, tema, definirTema } = useTema();
  const styles = useMemo(() => criarStyles(cores), [cores]);

  const opcoes: { id: NomeTema; rotulo: string; Icone: typeof Sun }[] = [
    { id: 'light', rotulo: 'Claro', Icone: Sun },
    { id: 'dark', rotulo: 'Escuro', Icone: Moon },
  ];

  return (
    <View
      accessible
      accessibilityLabel="Aparência do aplicativo"
      accessibilityRole="radiogroup"
    >
      <Text style={styles.rotulo}>Aparência</Text>
      <View style={styles.segmento}>
        {opcoes.map(({ id, rotulo, Icone }) => {
          const ativo = tema === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.opcao, ativo && styles.opcaoAtiva]}
              activeOpacity={0.8}
              onPress={() => definirTema(id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={`Tema ${rotulo.toLowerCase()}`}
            >
              <Icone
                color={ativo ? cores.sobrePrimaria : cores.textoSecundario}
                size={16}
              />
              <Text style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtiva]}>
                {rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function criarStyles(CORES: TemaCores) {
  return StyleSheet.create({
    rotulo: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: CORES.textoMuted,
      marginLeft: 4,
      marginBottom: 10,
    },
    segmento: {
      flexDirection: 'row',
      gap: 8,
      padding: 4,
      borderRadius: 14,
      backgroundColor: CORES.superficie,
      borderWidth: 1,
      borderColor: CORES.linha,
    },
    opcao: {
      flex: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 10,
    },
    opcaoAtiva: {
      backgroundColor: CORES.primaria,
    },
    opcaoTexto: {
      fontSize: 14,
      fontWeight: '700',
      color: CORES.textoSecundario,
    },
    opcaoTextoAtiva: {
      color: CORES.sobrePrimaria,
    },
  });
}
