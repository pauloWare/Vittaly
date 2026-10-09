import { StyleSheet } from 'react-native';
import { TEMA_ESCURO, type TemaCores } from '@/styles/temas';

export function criarStatsGridStyles(CORES: TemaCores) {
  return StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
  },
  groupBlock: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: CORES.destaque,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '31.5%',
    backgroundColor: CORES.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.linha,
    padding: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: CORES.textoSecundario,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  value: {
    fontSize: 17,
    fontWeight: '800',
    color: CORES.texto,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: CORES.textoMuted,
  },
});
}

// Cores de identificação dos ícones. No escuro, saturadas sobre o card escuro;
// no claro, tons do web (contraste sobre fundo branco). A chave `blue` foi
// mantida (é usada em DashboardStatsGrid): no escuro aponta para a violeta
// da marca; no claro, para o azul oficial do web.
export const CARD_COLORS_ESCURO = {
  blue: '#6E42C1',
  green: '#20C97A',
  purple: '#9B5CF6',
  yellow: '#F2B33D',
  orange: '#F2903D',
  red: '#E63030',
  teal: '#1FCBAA',
  pink: '#F0508C',
  gray: '#6B7280',
};
export const CARD_COLORS_CLARO = {
  blue: '#1A56DB',
  green: '#059669',
  purple: '#7C3AED',
  yellow: '#D97706',
  orange: '#EA580C',
  red: '#DC2626',
  teal: '#0D9488',
  pink: '#DB2777',
  gray: '#64748B',
};
/** Compatibilidade: mapa do tema escuro. */
export const CARD_COLORS = CARD_COLORS_ESCURO;
/** Estilos com o tema escuro (compatibilidade). */
export const statsGridStyles = criarStatsGridStyles(TEMA_ESCURO);
