import { TEMA_ESCURO, type TemaCores } from '@/styles/temas';

/**
 * Paleta legada — mantida para compatibilidade durante a migração.
 * Código novo deve usar `useTema().cores` (ver `styles/temas.ts`).
 * Os valores espelham o tema escuro oficial.
 */
export const CORES: TemaCores = TEMA_ESCURO;
