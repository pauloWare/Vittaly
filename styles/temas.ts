/**
 * Paletas oficiais do GERENCIA Mobile — tema claro (padrão) e tema escuro.
 *
 * - `TEMA_ESCURO`: preserva 1:1 o visual preto/violeta que o app já tinha
 *   (valores vindos da antiga `CORES` de `styles/palette.ts`).
 * - `TEMA_CLARO`: nova identidade oficial para o modo claro, derivada do
 *   frontend web (`front-end/src/theme.css`): primária azul #1A56DB sobre
 *   fundo #F1F5F9, superfícies brancas, texto slate e status nos tons do web.
 *
 * Todas as telas devem usar `useTema().cores` em vez de importar `CORES`
 * direto. As chaves são idênticas nos dois temas — nenhum `if (claro)` nas
 * telas, só `cores.fundo`, `cores.texto`, etc.
 */

export type TemaCores = {
  fundo: string;
  superficie: string;
  superficieAlt: string;
  linha: string;
  linhaForte: string;
  primaria: string;
  primariaSuave: string;
  selecionadoFundo: string;
  destaque: string;
  indicador: string;
  sobrePrimaria: string;
  sobrePrimariaSuave: string;
  texto: string;
  textoSuave: string;
  textoSecundario: string;
  textoMuted: string;
  perigo: string;
  perigoTexto: string;
  perigoFundo: string;
  perigoBorda: string;
  aviso: string;
  avisoFundo: string;
  avisoBorda: string;
  sucesso: string;
  sucessoFundo: string;
  sucessoBorda: string;
  neutroFundo: string;
};

export type NomeTema = 'light' | 'dark';

/** Tema escuro = visual atual do app (grafite + violeta). Não redesenhar. */
export const TEMA_ESCURO: TemaCores = {
  fundo: '#0D0D12',
  superficie: '#16161D',
  superficieAlt: '#1E1E27',
  linha: 'rgba(255, 255, 255, 0.08)',
  linhaForte: 'rgba(255, 255, 255, 0.16)',
  primaria: '#6E42C1',
  primariaSuave: 'rgba(110, 66, 193, 0.45)',
  selecionadoFundo: 'rgba(110, 66, 193, 0.22)',
  destaque: '#C084FC',
  indicador: '#9B6EFF',
  sobrePrimaria: '#F4F4F6',
  sobrePrimariaSuave: 'rgba(255, 255, 255, 0.18)',
  texto: '#F4F4F6',
  textoSuave: '#D2D2DA',
  textoSecundario: '#A9A9B6',
  textoMuted: '#8A8A98',
  perigo: '#E63030',
  perigoTexto: '#FF5555',
  perigoFundo: '#3A1414',
  perigoBorda: '#5C1F1F',
  aviso: '#FFB800',
  avisoFundo: '#4A3A14',
  avisoBorda: '#6B5420',
  sucesso: '#4CD964',
  sucessoFundo: '#14301A',
  sucessoBorda: '#1F5C2E',
  neutroFundo: '#26262F',
};

/**
 * Tema claro = identidade do frontend web adaptada para mobile.
 * Referência (`front-end/src/theme.css`):
 * primary #1A56DB / dark #1E3A8A / light #3B82F6 / bg #EFF6FF,
 * background #F1F5F9, surface #FFFFFF, text #0F172A,
 * text-secondary #64748B, text-muted #94A3B8, border #E2E8F0,
 * success #10B981/#D1FAE5/#065F46, danger #EF4444/#FEE2E2/#991B1B,
 * warning #F59E0B/#FEF3C7/#92400E.
 */
export const TEMA_CLARO: TemaCores = {
  fundo: '#F1F5F9',
  superficie: '#FFFFFF',
  superficieAlt: '#F8FAFC',
  linha: '#E2E8F0',
  linhaForte: '#CBD5E1',
  primaria: '#1A56DB',
  primariaSuave: 'rgba(26, 86, 219, 0.12)',
  selecionadoFundo: '#EFF6FF',
  destaque: '#1A56DB',
  indicador: '#1A56DB',
  sobrePrimaria: '#FFFFFF',
  sobrePrimariaSuave: 'rgba(255, 255, 255, 0.22)',
  texto: '#0F172A',
  textoSuave: '#334155',
  textoSecundario: '#64748B',
  textoMuted: '#94A3B8',
  perigo: '#EF4444',
  perigoTexto: '#991B1B',
  perigoFundo: '#FEE2E2',
  perigoBorda: '#FECACA',
  aviso: '#92400E',
  avisoFundo: '#FEF3C7',
  avisoBorda: '#FDE68A',
  sucesso: '#047857',
  sucessoFundo: '#D1FAE5',
  sucessoBorda: '#A7F3D0',
  neutroFundo: '#E2E8F0',
};

export const TEMAS: Record<NomeTema, TemaCores> = {
  light: TEMA_CLARO,
  dark: TEMA_ESCURO,
};
