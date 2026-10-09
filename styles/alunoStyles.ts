import { StyleSheet } from 'react-native';
import { TEMA_ESCURO, type TemaCores } from '@/styles/temas';

/**
 * Estilos das telas do portal do aluno (início, presença, frequência e
 * mensalidades). Identidade visual: fundo #0F0028, cards #1B004B com borda
 * violeta translúcida e destaque #6E42C1/#C084FC (ver `styles/palette.ts`).
 * Vermelho/amarelo/verde aparecem apenas em badges e banners de status.
 *
 * Escalas usadas em todo o arquivo, para manter ritmo visual consistente:
 *  - espaçamento: 4 / 8 / 12 / 16 / 20 / 24 / 32
 *  - raio: 8 (badge) / 12 (input, ícone) / 14 (botão) / 16 (card)
 *  - alvo de toque: mínimo 48px de altura
 */

export function criarAlunoStyles(CORES: TemaCores) {
  return StyleSheet.create({
  // ─── Base ──────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: CORES.fundo },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ─── Cabeçalho das telas internas ──────────────────────────────────────
  header: { marginBottom: 24 },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: CORES.texto,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: CORES.textoSecundario,
    marginTop: 4,
  },

  // ─── Tela inicial: marca, saudação e plano ─────────────────────────────
  homeHeader: { alignItems: 'center', marginBottom: 28 },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    color: CORES.texto,
  },
  logoTextAccent: { color: CORES.destaque },
  greeting: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: '800',
    color: CORES.texto,
    letterSpacing: -0.3,
  },
  badgePlano: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
  },
  badgePlanoText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: CORES.destaque,
  },

  // ─── Tela inicial: ação principal ──────────────────────────────────────
  primaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 88,
    padding: 18,
    borderRadius: 16,
    backgroundColor: CORES.primaria,
    marginBottom: 32,
    // brilho violeta para dar hierarquia sobre os demais cards
    shadowColor: CORES.primaria,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.sobrePrimariaSuave,
  },
  primaryTitle: { fontSize: 18, fontWeight: '800', color: CORES.sobrePrimaria },
  primarySubtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: CORES.sobrePrimaria,
    opacity: 0.85,
  },

  // ─── Tela inicial: menu secundário ─────────────────────────────────────
  menuGrid: { gap: 12, marginBottom: 24 },
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 72,
    padding: 16,
    borderRadius: 16,
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  secondaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES.superficieAlt,
    borderWidth: 1,
    borderColor: CORES.linha,
  },
  secondaryTitle: { fontSize: 15, fontWeight: '700', color: CORES.texto },
  secondarySubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: CORES.textoSecundario,
  },

  // ─── Tela inicial: sair ────────────────────────────────────────────────
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    marginTop: 8,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: CORES.textoMuted },

  // ─── Card genérico ─────────────────────────────────────────────────────
  card: {
    backgroundColor: CORES.superficie,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: CORES.textoSecundario,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // ─── Frequência ────────────────────────────────────────────────────────
  percentualValor: {
    fontSize: 48,
    fontWeight: '900',
    color: CORES.texto,
    fontVariant: ['tabular-nums'],
  },
  percentualLegenda: {
    color: CORES.textoSecundario,
    fontSize: 13,
    marginTop: 2,
  },
  // Barra de progresso (opcional): <View style={styles.progressTrack}>
  //   <View style={[styles.progressFill, { width: `${percentual}%` }]} />
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
    backgroundColor: CORES.superficieAlt,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: CORES.destaque,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: CORES.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.linha,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValor: {
    color: CORES.texto,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statRotulo: {
    color: CORES.textoMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  // ─── Listas (frequência e mensalidades) ────────────────────────────────
  sectionTitle: {
    color: CORES.texto,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: CORES.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 14,
    minHeight: 64,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  itemPrincipal: { color: CORES.texto, fontSize: 15, fontWeight: '600' },
  itemSecundario: { color: CORES.textoMuted, fontSize: 12, marginTop: 2 },
  itemValor: {
    color: CORES.texto,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // ─── Badges de situação ────────────────────────────────────────────────
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  badgeOk: { backgroundColor: CORES.sucessoFundo, borderColor: CORES.sucessoBorda },
  badgeOkText: { color: CORES.sucesso },
  badgeErro: { backgroundColor: CORES.perigoFundo, borderColor: CORES.perigoBorda },
  badgeErroText: { color: CORES.perigoTexto },
  badgeAviso: { backgroundColor: CORES.avisoFundo, borderColor: CORES.avisoBorda },
  badgeAvisoText: { color: CORES.aviso },
  badgeNeutro: { backgroundColor: CORES.neutroFundo, borderColor: CORES.linha },
  badgeNeutroText: { color: CORES.textoSecundario },

  // ─── Banners de resultado (sucesso/erro/neutro) ────────────────────────
  banner: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  bannerSucesso: { backgroundColor: CORES.sucessoFundo, borderColor: CORES.sucessoBorda },
  bannerSucessoText: {
    color: CORES.sucesso,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bannerErro: { backgroundColor: CORES.perigoFundo, borderColor: CORES.perigoBorda },
  bannerErroText: {
    color: CORES.perigoTexto,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bannerNeutro: { backgroundColor: CORES.superficie, borderColor: CORES.linha },
  bannerNeutroText: { color: CORES.textoSuave, fontSize: 13, lineHeight: 19 },
  bannerDetalhe: { color: CORES.textoSecundario, fontSize: 12, marginTop: 6 },

  // ─── Câmera (leitura do QR Code) ───────────────────────────────────────
  cameraArea: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: CORES.superficie,
    borderWidth: 1,
    borderColor: CORES.linha,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  camera: { flex: 1, alignSelf: 'stretch' },
  cameraDica: {
    color: CORES.textoSecundario,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    padding: 16,
  },

  // ─── Formulário e ações ────────────────────────────────────────────────
  label: {
    color: CORES.destaque,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    backgroundColor: CORES.superficieAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    color: CORES.texto,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  // Estados do input (opcionais): style={[styles.input, focado && styles.inputFocused]}
  inputFocused: { borderColor: CORES.destaque },
  inputError: { borderColor: CORES.perigoTexto },
  button: {
    minHeight: 52,
    marginTop: 20,
    backgroundColor: CORES.primaria,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecundario: {
    minHeight: 52,
    marginTop: 12,
    backgroundColor: CORES.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.linhaForte,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: CORES.sobrePrimaria,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  buttonSecundarioText: {
    color: CORES.textoSuave,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: { opacity: 0.5 },

  // ─── Estados vazios e rodapé ───────────────────────────────────────────
  emptyText: {
    color: CORES.textoMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginVertical: 24,
  },
  footer: {
    textAlign: 'center',
    color: CORES.textoMuted,
    fontSize: 12,
    marginTop: 24,
  },
});
}
/** Tema escuro (compatibilidade — telas usam `criarAlunoStyles(cores)` de `useTema()`). */
export const styles = criarAlunoStyles(TEMA_ESCURO);
