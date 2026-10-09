import { StyleSheet } from 'react-native';
import { TEMA_ESCURO, type TemaCores } from '@/styles/temas';

export function criarDashboardStyles(CORES: TemaCores) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: CORES.texto },
  headerSubtitle: { fontSize: 13, color: CORES.textoSecundario, marginTop: 4 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: CORES.texto },
  sectionBlock: { marginBottom: 28 },
  addButton: {
    backgroundColor: CORES.primaria,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: { color: CORES.sobrePrimaria, fontWeight: '700', fontSize: 13 },
  emptyText: { color: CORES.textoMuted, fontSize: 13, textAlign: 'center', marginTop: 16 },

  // Inadimplentes
  inadimplenteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CORES.superficie,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.linha,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  inadimplenteNome: { color: CORES.texto, fontWeight: '600', fontSize: 14 },
  inadimplenteDias: { color: CORES.textoMuted, fontSize: 12, marginTop: 2 },
  inadimplenteValor: { color: CORES.perigoTexto, fontWeight: '700', fontSize: 14 },

  // Gráfico de barras (alunos por plano)
  chartCard: {
    backgroundColor: CORES.superficie,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 16,
  },
  chartRow: { marginBottom: 14 },
  chartRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  chartLabel: { color: CORES.textoSecundario, fontSize: 13 },
  chartValue: { color: CORES.texto, fontSize: 13, fontWeight: '700' },
  chartTrack: { height: 8, backgroundColor: CORES.neutroFundo, borderRadius: 4, overflow: 'hidden' },
  chartBar: { height: 8, backgroundColor: CORES.indicador, borderRadius: 4 },

  // Chamados
  chamadoCard: {
    backgroundColor: CORES.superficie,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 14,
    marginBottom: 10,
  },
  chamadoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chamadoEquipamento: { color: CORES.texto, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 },
  chamadoDescricao: { color: CORES.textoSecundario, fontSize: 13, marginTop: 6 },
  chamadoThumb: { width: '100%', height: 140, borderRadius: 8, marginTop: 10, backgroundColor: CORES.fundo },
  chamadoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  chamadoData: { color: CORES.textoMuted, fontSize: 11 },

  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeAlta: { backgroundColor: CORES.perigoFundo },
  badgeAltaText: { color: CORES.perigoTexto },
  badgeCritica: { backgroundColor: CORES.perigoFundo },
  badgeCriticaText: { color: CORES.perigoTexto },
  badgeMedia: { backgroundColor: CORES.avisoFundo },
  badgeMediaText: { color: CORES.aviso },
  badgeBaixa: { backgroundColor: CORES.sucessoFundo },
  badgeBaixaText: { color: CORES.sucesso },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: CORES.superficie,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '88%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: CORES.texto, marginBottom: 16 },
  label: { color: CORES.destaque, fontSize: 13, marginBottom: 6, marginTop: 14 },
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  // Seleção de equipamento (chips)
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { borderColor: CORES.indicador, backgroundColor: CORES.selecionadoFundo },
  chipText: { color: CORES.textoSecundario, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: CORES.texto },

  prioridadeRow: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  prioridadeOption: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  prioridadeOptionSelected: { borderColor: CORES.indicador, backgroundColor: CORES.selecionadoFundo },
  prioridadeOptionText: { color: CORES.textoSecundario, fontSize: 13, fontWeight: '600' },
  prioridadeOptionTextSelected: { color: CORES.texto },

  imagePickerRow: { flexDirection: 'row', marginTop: 6 },
  imagePickerButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  imagePickerButtonText: { color: CORES.textoSecundario, fontSize: 13, fontWeight: '600' },
  imagePreviewWrapper: { marginTop: 6 },
  imagePreview: { width: '100%', height: 160, borderRadius: 10, backgroundColor: CORES.fundo },
  imageRemoveButton: { marginTop: 8, alignSelf: 'flex-start' },
  imageRemoveButtonText: { color: CORES.perigoTexto, fontSize: 13, fontWeight: '600' },

  modalButtons: { flexDirection: 'row', marginTop: 24 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    marginRight: 10,
  },
  cancelButtonText: { color: CORES.textoSuave, fontWeight: '600' },
  submitButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 8, backgroundColor: CORES.primaria },
  submitButtonText: { color: CORES.sobrePrimaria, fontWeight: '700' },
});
}
/** Tema escuro (compatibilidade — telas usam `criarDashboardStyles(cores)` de `useTema()`). */
export const styles = criarDashboardStyles(TEMA_ESCURO);
