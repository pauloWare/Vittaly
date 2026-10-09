/**
 * Tipos e regras de apresentação do portal do aluno.
 *
 * O backend é a única autoridade das decisões financeiras e de frequência;
 * aqui ficam só os formatos que as telas exibem a partir dos dados que a
 * API devolveu.
 */

/** Frequência consolidada do aluno no mês atual (regra do FrequenciaService). */
export type FrequenciaMensal = {
  presencasMes: number;
  diasConsiderados: number;
  percentual: number | null;
};

/** Conta segunda a sexta do dia 1 até o dia informado (mesma regra do backend). */
export function contarDiasUteisEm(ano: number, mesZeroBase: number, ateDia: number): number {
  let total = 0;
  for (let dia = 1; dia <= ateDia; dia += 1) {
    const diaDaSemana = new Date(ano, mesZeroBase, dia).getDay();
    if (diaDaSemana !== 0 && diaDaSemana !== 6) total += 1;
  }
  return total;
}

/** Rótulo exibido na tela de mensalidades a partir do status derivado no backend. */
export type SituacaoMensalidade = 'PAGA' | 'ATRASADA' | 'PENDENTE';

/**
 * Situação financeira consolidada devolvida por GET /api/portal/mensalidades:
 * EM_DIA, ATRASADA ou SEM_MENSALIDADE.
 */
export type SituacaoFinanceira = 'EM_DIA' | 'ATRASADA' | 'SEM_MENSALIDADE';

/** Rótulo em português para a situação consolidada. */
export const ROTULO_SITUACAO_FINANCEIRA: Record<SituacaoFinanceira, string> = {
  EM_DIA: 'Em dia',
  ATRASADA: 'Mensalidade atrasada',
  SEM_MENSALIDADE: 'Sem mensalidade cadastrada',
};

/**
 * Formata uma data ISO (AAAA-MM-DD), como devolvida pelo Jackson para
 * LocalDate, no padrão brasileiro. Devolve "—" quando ausente.
 */
export function formatarData(iso?: string | null): string {
  if (!iso) return '—';
  const partes = iso.slice(0, 10).split('-');
  if (partes.length !== 3 || partes.some((p) => p.length !== 2 && p.length !== 4)) return iso;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

/** Formata um horário (HH:MM:SS) como HH:MM. */
export function formatarHora(hora?: string | null): string {
  if (!hora) return '';
  const partes = hora.split(':');
  return partes.length >= 2 ? `${partes[0]}:${partes[1]}` : hora;
}

/** Formata um valor em reais (BRL). */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Rota oficial de check-in via QR Code.
 *
 * O QR exibido na recepção contém a URL completa
 * (`https://dominio/registrar-presenca?token=...`); o app extrai só o token
 * (veja {@link extrairTokenQr}) e envia o corpo `{ token: string }` — sem CPF
 * nem alunoId: a identidade vem da sessão/JWT. O backend valida tudo (QR
 * inválido/expirado, situação cadastral, situação financeira e entrada
 * duplicada) e responde:
 *
 * - 200 `{ mensagem, aluno { id, nome }, data, horaEntrada }`
 * - 400 `{ erro }` QR inválido ou expirado
 * - 403 `{ erro, motivo }` bloqueio (mensalidade atrasada / situação)
 * - 404 `{ erro }` aluno não encontrado
 * - 409 `{ erro }` entrada já registrada hoje
 */
export const ENDPOINT_CHECKIN = '/entrada/validar';

/**
 * Extrai o token diário do conteúdo lido no QR Code.
 *
 * Aceita os dois formatos possíveis:
 *
 * 1. URL do QR da web: `https://dominio/registrar-presenca?token=ABC123`
 *    → devolve `ABC123`;
 * 2. Token puro (futuro do QR): `ABC123` → devolve `ABC123`.
 *
 * Devolve `null` quando o conteúdo é vazio, é uma URL sem o parâmetro `token`
 * ou traz `token=` vazio — casos em que o app deve exibir erro amigável sem
 * fazer requisição ao backend. A validação real do token (dia vigente) é
 * sempre do `FrequenciaService`, nunca aqui.
 */
export function extrairTokenQr(bruto?: string | null): string | null {
  const conteudo = (bruto ?? '').trim();
  if (!conteudo) return null;

  // 1. Conteúdo com `?token=` (URL absoluta ou caminho relativo).
  if (/[?&]token=/.test(conteudo)) {
    let token: string | null = null;
    try {
      token = new URL(conteudo).searchParams.get('token');
    } catch {
      // URL fora do padrão (ex.: sem esquema): extrai o parâmetro por regex.
      const casado = /[?&]token=([^&#]*)/.exec(conteudo);
      if (casado) {
        try {
          token = decodeURIComponent(casado[1]);
        } catch {
          token = casado[1];
        }
      }
    }
    const limpo = token?.trim();
    return limpo ? limpo : null;
  }

  // 2. URL/rota sem `token=`: não há o que registrar.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(conteudo) || conteudo.startsWith('/')) return null;

  // 3. Token puro (sem cara de URL).
  return conteudo;
}

/**
 * Corpo exato enviado pelo app em {@link ENDPOINT_CHECKIN}: somente o token
 * extraído do QR. Devolve `null` quando o QR não traz token utilizável — nesse
 * caso a tela mostra erro e não faz a requisição.
 */
export function corpoCheckin(bruto?: string | null): { token: string } | null {
  const token = extrairTokenQr(bruto);
  return token ? { token } : null;
}
