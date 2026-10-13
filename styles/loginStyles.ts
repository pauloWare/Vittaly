import { StyleSheet } from 'react-native';
import { TEMA_ESCURO, type TemaCores } from '@/styles/temas';

export function criarLoginStyles(CORES: TemaCores) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 420, // Garante que em telas grandes/web a interface não fique esticada
    alignItems: 'stretch',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: CORES.superficieAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabAtiva: {
    backgroundColor: CORES.primaria,
  },
  tabTexto: {
    color: CORES.textoSecundario,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextoAtivo: {
    color: CORES.sobrePrimaria,
  },
  form: {
    width: '100%',
  },
  label: {
    color: CORES.destaque,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
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
  passwordWrapper: {
    justifyContent: 'center',
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  button: {
    marginTop: 24,
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
  buttonSecundario: {
    marginTop: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: CORES.primaria,
  },
  buttonTextSecundario: {
    color: CORES.primaria,
  },
  footer: {
    textAlign: 'center',
    color: CORES.textoMuted,
    fontSize: 12,
    marginTop: 28,
  },
});
}
/** Tema escuro (compatibilidade — telas usam `criarLoginStyles(cores)` de `useTema()`). */
export const styles = criarLoginStyles(TEMA_ESCURO);
