import { StyleSheet } from 'react-native';
import { TEMA_ESCURO, type TemaCores } from '@/styles/temas';

export function criarCadastroManutencaoStyles(CORES: TemaCores) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  scrollContent: { padding: 20, paddingBottom: 48 },
  header: { marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: CORES.texto },
  headerSubtitle: { fontSize: 13, color: CORES.textoSecundario, marginTop: 4 },

  // Encerrar sessão: ação destrutiva, então texto vermelho sobre fundo
  // transparente (sem bloco sólido vermelho competindo com o conteúdo).
  sairButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(230, 48, 48, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  sairButtonText: { color: CORES.perigoTexto, fontWeight: '700', fontSize: 13 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: CORES.destaque,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
  },

  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { color: CORES.destaque, fontSize: 13, marginBottom: 6, marginTop: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginTop: 14 },
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
  inputInvalido: {
    borderColor: CORES.perigo,
  },
  fieldError: {
    color: CORES.perigoTexto,
    fontSize: 12,
    marginTop: 6,
  },
  fieldInfo: {
    color: CORES.textoMuted,
    fontSize: 12,
    marginTop: 6,
  },
  fieldWarning: {
    color: CORES.aviso,
    fontSize: 12,
    marginTop: 6,
  },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { borderColor: CORES.indicador, backgroundColor: CORES.selecionadoFundo },
  chipText: { color: CORES.textoSecundario, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: CORES.texto },

  button: {
    marginTop: 28,
    backgroundColor: CORES.primaria,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: CORES.primariaSuave,
  },
  buttonText: { color: CORES.sobrePrimaria, fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },

  // Lista da equipe
  listTitle: { fontSize: 16, fontWeight: '700', color: CORES.texto, marginTop: 36, marginBottom: 12 },
  emptyText: { color: CORES.textoMuted, fontSize: 13, textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: CORES.superficie,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardNome: { color: CORES.texto, fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 },
  cardLinha: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  cardLinhaTexto: { color: CORES.textoSecundario, fontSize: 13, marginLeft: 8, flexShrink: 1 },

  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeAtivo: { backgroundColor: CORES.sucessoFundo },
  badgeAtivoText: { color: CORES.sucesso },
  badgeAfastado: { backgroundColor: CORES.avisoFundo },
  badgeAfastadoText: { color: CORES.aviso },
  badgeInativo: { backgroundColor: CORES.perigoFundo },
  badgeInativoText: { color: CORES.perigoTexto },
});
}
/** Tema escuro (compatibilidade — telas usam `criarCadastroManutencaoStyles(cores)` de `useTema()`). */
export const styles = criarCadastroManutencaoStyles(TEMA_ESCURO);
