import { TEMA_ESCURO, type TemaCores } from "@/styles/temas";
import { StyleSheet } from "react-native";

/**
 * Estilos exclusivos da tela "Mensalidades" do aluno.
 * Escalas: espaçamento 4/8/12/16/20/24 · raio 8 (badge), 14 (itens, botões),
 * 20 (cards de destaque), 24 (painel inferior) · alvo de toque mínimo 44–52px.
 * Cores de status vêm dos tokens da paleta (sucesso/aviso/perigo + Fundo/Borda).
 */
export function criarMensalidadesStyles(CORES: TemaCores) {
  return StyleSheet.create({
  // ─── Base ──────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: CORES.fundo },
  // paddingTop/paddingBottom vêm da área segura, aplicados na tela
  scrollContent: { paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ─── Cabeçalho ─────────────────────────────────────────────────────────
  header: { marginBottom: 20 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: CORES.texto,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: CORES.textoSecundario,
    marginTop: 4,
  },

  // ─── Erro ──────────────────────────────────────────────────────────────
  bannerErro: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: CORES.perigoFundo,
    borderWidth: 1,
    borderColor: CORES.perigoBorda,
    marginBottom: 12,
  },
  bannerErroTexto: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    color: CORES.perigoTexto,
  },

  // ─── Card de destaque (mensalidade em aberto / situação) ───────────────
  heroCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: CORES.superficie,
    borderColor: CORES.linha,
    marginBottom: 24,
  },
  heroAtrasada: {
    backgroundColor: CORES.perigoFundo,
    borderColor: CORES.perigoBorda,
  },
  heroPendente: {
    backgroundColor: CORES.superficie,
    borderColor: CORES.perigoBorda,
  },
  heroTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroRotulo: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CORES.textoSecundario,
  },
  heroValor: {
    marginTop: 14,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "900",
    color: CORES.texto,
    fontVariant: ["tabular-nums"],
  },
  heroLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  heroTexto: { fontSize: 14, color: CORES.textoSuave },
  heroExtra: { fontSize: 12, color: CORES.textoSecundario, marginTop: 8 },
  heroCirculoNeutro: { backgroundColor: CORES.superficieAlt },

  // ─── Badges de situação ────────────────────────────────────────────────
  badge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTexto: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  badgeOk: {
    backgroundColor: CORES.sucessoFundo,
    borderColor: CORES.sucessoBorda,
  },
  badgeOkTexto: { color: CORES.sucesso },
  badgeErro: {
    backgroundColor: CORES.perigoFundo,
    borderColor: CORES.perigoBorda,
  },
  badgeErroTexto: { color: CORES.perigoTexto },
  badgeAviso: {
    backgroundColor: CORES.avisoFundo,
    borderColor: CORES.avisoBorda,
  },
  badgeAvisoTexto: { color: CORES.aviso },
  badgeNeutro: { backgroundColor: CORES.neutroFundo, borderColor: CORES.linha },
  badgeNeutroTexto: { color: CORES.textoSecundario },

  // ─── Histórico: título, filtros e itens ────────────────────────────────
  secaoTitulo: {
    marginTop: 12,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: "700",
    color: CORES.texto,
  },
  chipsLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  chipAtivo: {
    backgroundColor: CORES.selecionadoFundo,
    borderColor: CORES.destaque,
  },
  chipTexto: { fontSize: 13, fontWeight: "700", color: CORES.textoSecundario },
  chipTextoAtivo: { color: CORES.destaque },
  anoRotulo: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: CORES.textoMuted,
  },
  itemIconeOk: {
    backgroundColor: CORES.sucessoFundo,
    borderColor: CORES.sucessoBorda,
  },
  itemIconeAviso: {
    backgroundColor: CORES.avisoFundo,
    borderColor: CORES.avisoBorda,
  },
  itemIconeErro: {
    backgroundColor: CORES.perigoFundo,
    borderColor: CORES.perigoBorda,
  },
  itemCorpo: { flex: 1 },
  itemPrincipal: { fontSize: 15, fontWeight: "700", color: CORES.texto },
  itemSecundario: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: CORES.textoMuted,
  },
  itemDireita: { alignItems: "flex-end", gap: 4 },
  itemValor: {
    fontSize: 15,
    fontWeight: "800",
    color: CORES.texto,
    fontVariant: ["tabular-nums"],
  },
  vazioTexto: {
    marginVertical: 24,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: CORES.textoMuted,
  },

  // ─── Botões ────────────────────────────────────────────────────────────
  botaoPrimario: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: CORES.primaria,
  },
  botaoPrimarioTexto: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: CORES.sobrePrimaria,
  },
  botaoSecundario: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
  },
  botaoSecundarioTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: CORES.textoSuave,
  },

  // ─── Painel inferior "Como pagar" ──────────────────────────────────────
  modalFundo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalFechar: { ...StyleSheet.absoluteFill },
  modalSheet: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    backgroundColor: CORES.linhaForte,
  },
  modalCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.selecionadoFundo,
  },
  modalTitulo: { flex: 1, fontSize: 18, fontWeight: "900", color: CORES.texto },
  modalResumo: {
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: CORES.superficieAlt,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  modalLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalRotulo: { fontSize: 13, color: CORES.textoSecundario },
  modalValor: {
    fontSize: 15,
    fontWeight: "700",
    color: CORES.texto,
    fontVariant: ["tabular-nums"],
  },
  modalTexto: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: CORES.textoSuave,
  },
  statusCard: {
  padding: 16,
  borderRadius: 14,
  backgroundColor: CORES.superficie,
  borderWidth: 1,
  borderColor: CORES.linha,
  marginBottom: 24,
},
statusLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
statusTitulo: { fontSize: 16, fontWeight: "700", color: CORES.texto },
statusDetalhe: { marginTop: 4, fontSize: 13, lineHeight: 18, color: CORES.textoSecundario },

historicoTopo: {
  flexDirection: "row",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: 12,
},
historicoTotal: { fontSize: 13, color: CORES.textoMuted, fontVariant: ["tabular-nums"] },

lista: {
  borderRadius: 14,
  backgroundColor: CORES.superficie,
  borderWidth: 1,
  borderColor: CORES.linha,
  overflow: "hidden",
  marginBottom: 20,
},
linha: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  minHeight: 64,
  paddingHorizontal: 16,
  paddingVertical: 12,
},
linhaDivisor: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: CORES.linha },
});
}

/** Tema escuro (compatibilidade — telas usam `criarMensalidadesStyles(cores)` de `useTema()`). */
export const styles = criarMensalidadesStyles(TEMA_ESCURO);
