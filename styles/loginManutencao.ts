import { StyleSheet } from 'react-native';
import { TEMA_ESCURO, type TemaCores } from '@/styles/temas';

export function criarLoginManutencaoStyles(CORES: TemaCores) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: CORES.texto,
    letterSpacing: 1,
  },
  logoTextAccent: {
    color: CORES.destaque,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: CORES.textoSecundario,
  },
  form: {
    width: '100%',
  },
  label: {
    color: CORES.destaque,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: CORES.superficieAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    color: CORES.texto,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    marginTop: 28,
    backgroundColor: CORES.primaria,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: CORES.sobrePrimaria,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    color: CORES.textoMuted,
    fontSize: 12,
    marginTop: 32,
  },
});
}
/** Tema escuro (compatibilidade — telas usam `criarLoginManutencaoStyles(cores)` de `useTema()`). */
export const styles = criarLoginManutencaoStyles(TEMA_ESCURO);
