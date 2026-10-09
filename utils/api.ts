import { carregarToken, limparSessao, marcarSessaoExpirada } from './sessao';

/**
 * URL base única da API do Gerencia (inclui o prefixo /api).
 *
 * Configurada no arquivo `.env` via `EXPO_PUBLIC_API_URL` — veja `.env.example`
 * para os valores de cada ambiente (computador, celular físico, emulador,
 * produção). O fallback é o backend rodando localmente.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api').replace(
  /\/+$/,
  ''
);

/** Timeout padrão das requisições (evita travar a tela sem resposta). */
const TIMEOUT_PADRAO_MS = 15000;

/**
 * Erro tipado de toda falha de requisição.
 * `status === 0` significa falha de rede/timeout (o servidor nem respondeu);
 * demais valores são os códigos HTTP devolvidos pela API (401, 403, 404...).
 *
 * `campo` espelha o `{ "campo": "..." }` que o backend devolve junto da mensagem
 * (ex.: "nome", "cpf", "dataNascimento"), permitindo que a tela destaque o
 * campo exato com o erro em vez de só um aviso genérico. É opcional: endpoints
 * antigos podem não enviar.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly campo?: string | null;

  constructor(status: number, message: string, campo?: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.campo = campo ?? null;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';

type OpcoesApi = {
  method?: Metodo;
  /** Corpo JSON (serializado automaticamente com Content-Type application/json). */
  body?: unknown;
  /** Envia `Authorization: Bearer <token>` (padrão true). */
  auth?: boolean;
  /**
   * Em 401, limpa a sessão local e avisa as telas assinantes (padrão true).
   * Use false no próprio login, onde401 significa "credenciais inválidas".
   */
  sessao?: boolean;
  timeoutMs?: number;
};

// ===== Aviso de sessão expirada (401) =====
type OuvinteSessao = () => void;
const ouvintesSessao = new Set<OuvinteSessao>();

/**
 * Assina o aviso de sessão expirada/inválida (401 em requisição autenticada).
 * Retorna a função para cancelar a assinatura.
 */
export function aoExpirarSessao(ouvinte: OuvinteSessao): () => void {
  ouvintesSessao.add(ouvinte);
  return () => {
    ouvintesSessao.delete(ouvinte);
  };
}

function notificarSessaoExpirada(): void {
  ouvintesSessao.forEach((ouvinte) => ouvinte());
}

/** Extrai a mensagem de erro no formato `{ "erro": "...", "campo": "..." }` usado pelo backend. */
function mensagemDeErro(corpo: unknown, status: number): string {
  if (
    corpo !== null &&
    typeof corpo === 'object' &&
    'erro' in corpo &&
    typeof (corpo as { erro: unknown }).erro === 'string'
  ) {
    return (corpo as { erro: string }).erro;
  }
  if (status === 401) return 'Autenticação necessária. Faça login novamente.';
  if (status === 403) return 'Seu perfil não tem permissão para esta operação.';
  if (status === 404) return 'Recurso não encontrado na API.';
  if (status === 409) return 'Já existe um cadastro com estes dados.';
  if (status >= 500) return 'O servidor encontrou um erro. Tente novamente.';
  return `Falha na requisição (HTTP ${status}).`;
}

/** Extrai o campo apontado pelo backend (`{ "campo": "cpf" }`), quando presente. */
function campoDeErro(corpo: unknown): string | null {
  if (
    corpo !== null &&
    typeof corpo === 'object' &&
    'campo' in corpo &&
    typeof (corpo as { campo: unknown }).campo === 'string'
  ) {
    return (corpo as { campo: string }).campo;
  }
  return null;
}

/**
 * Cliente HTTP central do app. Toda tela deve usar esta função em vez de
 * `fetch` direto: aqui ficam a URL base, o token, o timeout e o tratamento
 * de erros/sessão expirada.
 *
 * @param caminho Caminho a partir da URL base, ex.: '/usuario/login'.
 */
export async function apiFetch<T>(caminho: string, opcoes: OpcoesApi = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    sessao = true,
    timeoutMs = TIMEOUT_PADRAO_MS,
  } = opcoes;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await carregarToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), timeoutMs);

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controle.signal,
    });
  } catch (erro) {
    // AbortError = timeout; os demais são falhas de rede (IP errado, backend
    // fora do ar, sem internet).
    const esgotou = erro instanceof Error && erro.name === 'AbortError';
    throw new ApiError(
      0,
      esgotou
        ? 'O servidor demorou para responder. Verifique a conexão e tente novamente.'
        : 'Não foi possível falar com o servidor. Confira se o backend está rodando e se a URL em .env está correta.'
    );
  } finally {
    clearTimeout(temporizador);
  }

  const texto = await resposta.text().catch(() => '');
  let corpo: unknown = null;
  if (texto) {
    try {
      corpo = JSON.parse(texto);
    } catch {
      corpo = null;
    }
  }

  if (!resposta.ok) {
    const mensagem = mensagemDeErro(corpo, resposta.status);
    if (resposta.status === 401 && sessao) {
      // Token inválido/expirado: derruba a sessão local e manda o usuário
      // de volta ao login (apenas uma vez, mesmo com vários erros em paralelo).
      await limparSessao();
      if (marcarSessaoExpirada()) notificarSessaoExpirada();
    }
    throw new ApiError(resposta.status, mensagem, campoDeErro(corpo));
  }

  // Sucesso sem conteúdo (ex.: 204).
  if (!texto) return undefined as T;
  if (corpo === null) {
    throw new ApiError(resposta.status, 'Resposta inválida recebida do servidor.');
  }
  return corpo as T;
}
