import { TEMA_ESCURO, type TemaCores } from "@/styles/temas";
import { StyleSheet } from "react-native";

/**
 * Estilos exclusivos da tela "Minha frequência" do aluno.
 * Escalas: espaçamento 4/8/12/16/20/24 · raio 12 (botões menores, chips),
 * 14 (botões, itens), 16/20 (cards) · alvo de toque mínimo de 44–52px.
 */

const LARGURA_DIA = "14.2857%"; // 100% / 7 colunas

export function criarFrequenciaStyles(CORES: TemaCores) {
  return StyleSheet.create({
  // ─── Base ──────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: CORES.fundo },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  // ─── Cabeçalho ─────────────────────────────────────────────────────────
  header: { marginBottom: 20 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: CORES.texto,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: CORES.textoSecundario,
    marginTop: 4,
  },

  // ─── Navegação de mês ──────────────────────────────────────────────────
  mesNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  mesBotao: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  mesBotaoDesabilitado: { opacity: 0.35 },
  mesTitulo: { fontSize: 17, fontWeight: "800", color: CORES.texto },

  // ─── Resumo do mês ─────────────────────────────────────────────────────
  resumoCard: {
    backgroundColor: CORES.superficie,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 20,
    marginBottom: 12,
  },
  resumoRotulo: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: CORES.textoSecundario,
  },
  percentualLinha: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 6,
  },
  percentualValor: {
    fontSize: 56,
    lineHeight: 62,
    fontWeight: "900",
    color: CORES.texto,
    fontVariant: ["tabular-nums"],
  },
  percentualSimbolo: {
    fontSize: 24,
    fontWeight: "800",
    color: CORES.destaque,
    marginLeft: 2,
    marginBottom: 10,
  },
  resumoLegenda: { fontSize: 13, color: CORES.textoSecundario, marginTop: 2 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 16,
    backgroundColor: CORES.superficieAlt,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: CORES.destaque,
  },

  // ─── Indicadores ───────────────────────────────────────────────────────
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: CORES.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.linha,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statValor: {
    fontSize: 18,
    fontWeight: "800",
    color: CORES.texto,
    fontVariant: ["tabular-nums"],
  },
  statRotulo: {
    fontSize: 11,
    color: CORES.textoMuted,
    marginTop: 2,
    textAlign: "center",
  },

  // ─── Lembrete de treino do dia ─────────────────────────────────────────
  lembrete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    padding: 14,
    borderRadius: 14,
    backgroundColor: CORES.selecionadoFundo,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    marginBottom: 12,
  },
  lembreteTexto: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: CORES.textoSuave,
  },
  lembreteAcao: { fontSize: 13, fontWeight: "800", color: CORES.destaque },

  // ─── Seções ────────────────────────────────────────────────────────────
  secaoLinha: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
  },
  secaoTitulo: { fontSize: 17, fontWeight: "800", color: CORES.texto },
  secaoContagem: { fontSize: 13, color: CORES.textoMuted },

  // ─── Calendário do mês ─────────────────────────────────────────────────
  calendarioCard: {
    backgroundColor: CORES.superficie,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 12,
    marginBottom: 12,
  },
  calendarioSemana: { flexDirection: "row", marginBottom: 4 },
  calendarioSemanaTexto: {
    width: LARGURA_DIA,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: CORES.textoMuted,
  },
  calendarioGrade: { flexDirection: "row", flexWrap: "wrap" },
  diaCelula: {
    width: LARGURA_DIA,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  diaBolha: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  diaBolhaPresente: { backgroundColor: CORES.primaria },
  diaBolhaHoje: { borderColor: CORES.destaque },
  diaTexto: {
    fontSize: 13,
    fontWeight: "500",
    color: CORES.textoSuave,
    fontVariant: ["tabular-nums"],
  },
  diaTextoPresente: { color: CORES.sobrePrimaria, fontWeight: "800" },
  diaTextoFuturo: { color: CORES.textoMuted, opacity: 0.5 },
  legenda: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CORES.linha,
  },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendaPonto: { width: 12, height: 12, borderRadius: 6 },
  legendaPontoPresente: { backgroundColor: CORES.primaria },
  legendaPontoFalta: { borderWidth: 2, borderColor: CORES.perigo },
  legendaPontoHoje: { borderWidth: 2, borderColor: CORES.destaque },
  legendaTexto: { fontSize: 11, color: CORES.textoMuted },

  // ─── Histórico ─────────────────────────────────────────────────────────
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    padding: 12,
    borderRadius: 14,
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
    marginBottom: 8,
  },
  itemData: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.superficieAlt,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  itemDataSemana: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: CORES.destaque,
  },
  itemDataDia: {
    fontSize: 18,
    fontWeight: "900",
    color: CORES.texto,
    fontVariant: ["tabular-nums"],
  },
  itemCorpo: { flex: 1 },
  itemTitulo: { fontSize: 15, fontWeight: "700", color: CORES.texto },
  itemHoraLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  itemHora: { fontSize: 12, color: CORES.textoSecundario },
  badgeHoje: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: CORES.selecionadoFundo,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
  },
  badgeHojeTexto: { fontSize: 11, fontWeight: "800", color: CORES.destaque },

  // ─── Estado vazio ──────────────────────────────────────────────────────
  vazioCard: {
    alignItems: "center",
    padding: 28,
    borderRadius: 16,
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  vazioIcone: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.superficieAlt,
    marginBottom: 12,
  },
  vazioTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: CORES.texto,
    textAlign: "center",
  },
  vazioTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: CORES.textoSecundario,
    textAlign: "center",
    marginTop: 4,
  },

  // ─── Erros ─────────────────────────────────────────────────────────────
  bannerErro: {
    padding: 14,
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
  erroTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: CORES.texto,
    textAlign: "center",
    marginBottom: 6,
  },
  erroTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: CORES.textoSecundario,
    textAlign: "center",
    marginBottom: 8,
  },

  // ─── Botões ────────────────────────────────────────────────────────────
  botaoPrimario: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
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

  diaBolhaFalta: {
    backgroundColor: CORES.perigoFundo, // Fundo vermelho escuro
    borderColor: CORES.perigoBorda, // Borda vermelha
  },
  diaTextoFalta: {
    color: CORES.perigoTexto, // Texto vermelho claro
    fontWeight: "700",
  },
});
}

/** Tema escuro (compatibilidade — telas usam `criarFrequenciaStyles(cores)` de `useTema()`). */
export const styles = criarFrequenciaStyles(TEMA_ESCURO);
