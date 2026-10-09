import { StyleSheet } from "react-native";

import { TEMA_ESCURO, type TemaCores } from "./temas";

/** Substituição local de `StyleSheet.absoluteFillObject` (removido no RN 0.86). */
const TOTAL = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

/**
 * Estilos do leitor de QR Code (app/aluno/leitor-qr.tsx).
 *
 * A tela tem fundo escuro puro porque a pré-visualização da câmera ocupa a
 * maior parte dela; os cards de sucesso/erro ficam sobrepostos à câmera.
 */
export function criarLeitorQrStyles(CORES: TemaCores) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // ─── Cabeçalho ──────────────────────────────────────────────────────────
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CORES.fundo,
  },
  topoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.superficie,
  },
  topoTitulo: { fontSize: 17, fontWeight: "800", color: CORES.texto },

  // ─── Câmera e moldura do QR ─────────────────────────────────────────────
  camera: { flex: 1 },
  moldura: {
    ...TOTAL,
    alignItems: "center",
    justifyContent: "center",
  },
  molduraArea: {
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: CORES.destaque,
    backgroundColor: "transparent",
  },
  dicaCaixa: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  dicaTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: CORES.texto,
    textAlign: "center",
    backgroundColor: "rgba(13, 13, 18, 0.75)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  enviandoCaixa: {
    ...TOTAL,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 13, 18, 0.72)",
  },
  enviandoTexto: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: CORES.texto,
  },

  // ─── Cards sobrepostos (permissão, sucesso e erro) ──────────────────────
  sobreposicao: {
    ...TOTAL,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(13, 13, 18, 0.94)",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  iconeCaixa: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconeSucesso: { backgroundColor: CORES.sucessoFundo },
  iconeErro: { backgroundColor: CORES.perigoFundo },
  iconeNeutro: { backgroundColor: CORES.superficieAlt },
  titulo: { fontSize: 18, fontWeight: "800", color: CORES.texto, textAlign: "center" },
  texto: {
    fontSize: 14,
    lineHeight: 20,
    color: CORES.textoSecundario,
    textAlign: "center",
    marginTop: 6,
  },
  hora: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: CORES.destaque,
    textAlign: "center",
  },
  botaoPrimario: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
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
    alignSelf: "stretch",
    marginTop: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: CORES.superficieAlt,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
  },
  botaoSecundarioTexto: { fontSize: 14, fontWeight: "600", color: CORES.textoSuave },

  // ─── Carregando (sessão) ────────────────────────────────────────────────
  centralizado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CORES.fundo,
  },
});
}


/** Tema escuro (compatibilidade — telas usam `criarLeitorQrStyles(cores)` de `useTema()`). */
export const styles = criarLeitorQrStyles(TEMA_ESCURO);
