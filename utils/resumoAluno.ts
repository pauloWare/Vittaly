import { apiFetch } from "@/utils/api";
import type { SituacaoFinanceira } from "@/utils/portal";

// AJUSTE AQUI se o endpoint de frequência for outro (o mesmo da tela de frequência).
const ENDPOINT_FREQUENCIA = "/frequencia/minha";
const ENDPOINT_MENSALIDADES = "/portal/mensalidades";

type Presenca = { data?: string | null };
type RespostaFrequencia = Presenca[] | { presencas?: Presenca[] };
type RespostaMensalidades = { situacao?: SituacaoFinanceira };

export type ResumoAluno = {
  treinosNoMes: number | null;
  /** 'YYYY-MM-DD' da presença mais recente, ou null. */
  ultimaVisita: string | null;
  situacao: SituacaoFinanceira | null;
};

const dois = (n: number) => String(n).padStart(2, "0");

const chaveDe = (d: Date) =>
  `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;

const emUtc = (chave: string) => {
  const [a, m, d] = chave.slice(0, 10).split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

/** "Hoje", "Ontem", "há 5 dias" ou "—" quando não há visita. */
export function descreverUltimaVisita(chave: string | null): string {
  if (!chave) return "—";
  const dias = Math.round(
    (emUtc(chaveDe(new Date())) - emUtc(chave)) / 86400000,
  );
  if (dias <= 0) return "Hoje";
  if (dias === 1) return "Ontem";
  return `há ${dias} dias`;
}

/**
 * Busca o resumo exibido no perfil. Nunca rejeita: o que falhar fica `null`
 * e a tela mostra "—" no lugar.
 */
export async function buscarResumoAluno(): Promise<ResumoAluno> {
  const resumo: ResumoAluno = {
    treinosNoMes: null,
    ultimaVisita: null,
    situacao: null,
  };

  const [frequencia, financeiro] = await Promise.allSettled([
    apiFetch<RespostaFrequencia>(ENDPOINT_FREQUENCIA),
    apiFetch<RespostaMensalidades>(ENDPOINT_MENSALIDADES),
  ]);

  if (frequencia.status === "fulfilled") {
    const bruto = frequencia.value;
    const lista = Array.isArray(bruto) ? bruto : (bruto?.presencas ?? []);
    const datas = lista
      .map((p) => p?.data)
      .filter((d): d is string => typeof d === "string" && d.length >= 10)
      .map((d) => d.slice(0, 10))
      .sort();
    const prefixoMes = chaveDe(new Date()).slice(0, 7);
    resumo.treinosNoMes = new Set(
      datas.filter((d) => d.startsWith(prefixoMes)),
    ).size;
    resumo.ultimaVisita = datas.length ? datas[datas.length - 1] : null;
  }

  if (financeiro.status === "fulfilled") {
    resumo.situacao = financeiro.value?.situacao ?? null;
  }

  return resumo;
}
