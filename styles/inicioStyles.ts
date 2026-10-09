import { TEMA_ESCURO, type TemaCores } from "@/styles/temas";
import { StyleSheet } from "react-native";

/**
 * Estilos exclusivos da tela inicial do aluno.
 * Escalas: espaçamento 4/8/12/16/20/24/28 · raio 14 (ícones), 16 (card
 * principal), 20 (blocos) · alvo de toque mínimo de 44px.
 */
export function criarInicioStyles(CORES: TemaCores) {
  return StyleSheet.create({
  // ─── Base ──────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: CORES.fundo },
  // paddingTop/paddingBottom vêm da área segura, aplicados na tela
  scrollContent: { paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // ─── Barra superior ────────────────────────────────────────────────────
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  brand: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: CORES.texto,
  },
  brandAccent: { color: CORES.destaque },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
  },

  // ─── Saudação ──────────────────────────────────────────────────────────
  saudacaoLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 28,
  },
  saudacaoTextos: { flex: 1, paddingRight: 16 },
  saudacaoCaption: {
    fontSize: 13,
    color: CORES.textoSecundario,
    marginBottom: 2,
  },
  saudacaoNome: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: CORES.texto,
  },
  planoPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: CORES.selecionadoFundo,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
  },
  planoPillTexto: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: CORES.destaque,
  },

  // ─── Card principal: registrar presença ────────────────────────────────
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 88,
    padding: 18,
    borderRadius: 16,
    backgroundColor: CORES.primaria,
    marginBottom: 28,
    shadowColor: CORES.primaria,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroIcone: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.sobrePrimariaSuave,
  },
  heroTitulo: { fontSize: 18, fontWeight: "800", color: CORES.sobrePrimaria },
  heroSubtitulo: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: CORES.sobrePrimaria,
    opacity: 0.85,
  },

  // ─── Grade de atalhos ──────────────────────────────────────────────────
  secaoTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: CORES.texto,
    marginBottom: 12,
  },
  // flexWrap + flexBasis: 2 por linha; um bloco sozinho na última linha ocupa a largura toda
  grade: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 156,
    padding: 16,
    borderRadius: 20,
    justifyContent: "space-between",
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  tileTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  tileIcone: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.selecionadoFundo,
  },
  tileTitulo: { fontSize: 16, fontWeight: "800", color: CORES.texto },
  tileDescricao: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: CORES.textoSecundario,
  },
  avatar: {
  width: 64,
  height: 64,
  borderRadius: 32,
  overflow: 'hidden', // novo: a foto respeita o círculo
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: CORES.superficieAlt,
  borderWidth: 2,
  borderColor: CORES.linhaForte,
},
avatarImagem: { width: '100%', height: '100%' }, // novo
avatarTexto: { fontSize: 22, fontWeight: '800', color: CORES.destaque },
});
}


/** Tema escuro (compatibilidade — telas usam `criarInicioStyles(cores)` de `useTema()`). */
export const styles = criarInicioStyles(TEMA_ESCURO);
