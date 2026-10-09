import { StyleSheet } from 'react-native';
import { TEMA_ESCURO, type TemaCores } from '@/styles/temas';

export function criarManutencaoChamadosStyles(CORES: TemaCores) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
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

  filterRow: { flexDirection: 'row', marginBottom: 18 },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipSelected: { borderColor: CORES.indicador, backgroundColor: CORES.selecionadoFundo },
  filterChipText: { color: CORES.textoSecundario, fontSize: 13, fontWeight: '600' },
  filterChipTextSelected: { color: CORES.texto },

  emptyText: { color: CORES.textoMuted, fontSize: 13, textAlign: 'center', marginTop: 24 },

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

  statusAtual: { fontSize: 11, fontWeight: '700' },
  statusAtualAberto: { color: CORES.perigoTexto },
  statusAtualAndamento: { color: CORES.aviso },
  statusAtualFinalizado: { color: CORES.sucesso },

  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeCritica: { backgroundColor: CORES.perigoFundo },
  badgeCriticaText: { color: CORES.perigoTexto },
  badgeAlta: { backgroundColor: CORES.perigoFundo },
  badgeAltaText: { color: CORES.perigoTexto },
  badgeMedia: { backgroundColor: CORES.avisoFundo },
  badgeMediaText: { color: CORES.aviso },
  badgeBaixa: { backgroundColor: CORES.sucessoFundo },
  badgeBaixaText: { color: CORES.sucesso },

  statusRow: { flexDirection: 'row', marginTop: 12 },
  statusOption: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 6,
  },
  statusOptionSelected: { borderColor: CORES.indicador, backgroundColor: CORES.selecionadoFundo },
  statusOptionText: { color: CORES.textoSecundario, fontSize: 11, fontWeight: '600' },
  statusOptionTextSelected: { color: CORES.texto },
});
}
/** Tema escuro (compatibilidade — telas usam `criarManutencaoChamadosStyles(cores)` de `useTema()`). */
export const styles = criarManutencaoChamadosStyles(TEMA_ESCURO);
