import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Sessão do usuário autenticado na API do Gerencia.
 *
 * O login é UNIFICADO: a mesma tela pede apenas e-mail e senha, e o backend
 * devolve o perfil já resolvido (POST /api/auth/login). O cargo vem do token
 * assinado, nunca é escolhido na tela nem enviado pelo app.
 */
export type UsuarioSessao = {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  telefone?: string | null;
  sexo?: string | null;
  dataNascimento?: string | null;
  status?: string | null;
};

/**
 * Sessão do ALUNO no app.
 *
 * O aluno se autentica pelo mesmo login unificado (e-mail e senha) e recebe um
 * token próprio (subject `aluno:<id>` no backend), que dá acesso apenas às rotas
 * /api/portal/**. Não há mais CPF como credencial — o CPF guardado aqui é apenas
 * conveniência da tela de presença (pré-preenchimento do check-in); quem
 * autoriza continua sendo o backend, que revalida tudo.
 */
export type SessaoAluno = {
  token: string;
  aluno: {
    id: number;
    nome: string;
    email?: string | null;
    plano?: string | null;
    situacao?: string | null;
  };
  cpf: string;
};

/** Perfil retornado por GET /api/auth/sessao ao reabrir o aplicativo. */
export type SessaoUnificada = {
  cargo: string;
  usuario: UsuarioSessao | null;
  aluno: SessaoAluno['aluno'] | null;
};

/**
 * Sessão recuperada do armazenamento local: o perfil guardado em cache mais o
 * token. O `cpf` é apenas conveniência da tela de presença (o login é por
 * e-mail/senha) e nunca é usado para autorizar nada.
 */
export type SessaoGuardada = SessaoUnificada & { token: string; cpf: string };

// Chaves do SecureStore: apenas alfanuméricos, '.', '-' e '_'.
const CHAVE_TOKEN = 'gerencia.token';
const CHAVE_USUARIO = 'gerencia.usuario';
const CHAVE_ALUNO = 'gerencia.aluno';

// Aviso de sessão expirada (401) — módulo único evita alerts duplicados
// quando várias requisições falham ao mesmo tempo (ex.: Promise.all).
let sessaoExpirada = false;

/** Marca a expiração; devolve true apenas na primeira chamada. */
export function marcarSessaoExpirada(): boolean {
  if (sessaoExpirada) return false;
  sessaoExpirada = true;
  return true;
}

/** Chamado após um novo login para rearmar o aviso de expiração. */
export function redefinirSessaoExpirada(): void {
  sessaoExpirada = false;
}

/**
 * Rota inicial do app conforme o cargo devolvido pelo backend.
 *
 * A área de cada perfil JÁ EXISTE no app — nada é criado por cargo. Cargos sem
 * área correspondente no aplicativo (RECEPCIONISTA, FINANCEIRO) voltam ao login
 * com um aviso: o app não faz parte das permissões deles.
 */
export function rotaDoCargo(cargo?: string): '/admin/dashboard' | '/manutencao/chamados' | '/' {
  if (cargo === 'ADMIN') return '/admin/dashboard';
  if (cargo === 'TECNICO') return '/manutencao/chamados';
  return '/';
}

/** Rota inicial do portal do aluno (sessão com cargo ALUNO). */
export function rotaDoAluno(cargo?: string): '/aluno/inicio' | '/' {
  return cargo === 'ALUNO' ? '/aluno/inicio' : '/';
}

/** Descrição amigável da área de cada perfil (usada nas mensagens do app). */
export function rotuloDoCargo(cargo?: string): string {
  switch (cargo) {
    case 'ADMIN':
      return 'administrador';
    case 'TECNICO':
      return 'técnico de manutenção';
    case 'ALUNO':
      return 'aluno';
    case 'RECEPCIONISTA':
      return 'recepção';
    case 'FINANCEIRO':
      return 'financeiro';
    default:
      return 'usuário';
  }
}

// No web (expo start --web) não existe SecureStore; usamos localStorage como
// fallback de desenvolvimento. O alvo real é o Expo Go, onde vale o SecureStore.
async function guardar(chave: string, valor: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(chave, valor);
    return;
  }
  await SecureStore.setItemAsync(chave, valor);
}

async function ler(chave: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.localStorage.getItem(chave) : null;
  }
  return SecureStore.getItemAsync(chave);
}

async function apagar(chave: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(chave);
    return;
  }
  await SecureStore.deleteItemAsync(chave);
}

/**
 * Grava a sessão vinda do login unificado.
 *
 * `tipo` é definido pelo próprio backend (`ALUNO` para aluno, demais cargos para
 * a equipe) e vem dentro do próprio token assinado — o app não escolhe o perfil,
 * apenas guarda o que a API devolveu.
 */
export async function salvarSessao(perfil: SessaoUnificada, token: string): Promise<void> {
  if (perfil.cargo === 'ALUNO' && perfil.aluno?.id) {
    await Promise.all([
      apagar(CHAVE_USUARIO),
      guardar(CHAVE_TOKEN, token),
      guardar(CHAVE_ALUNO, JSON.stringify({ aluno: perfil.aluno, cpf: '' })),
    ]);
    return;
  }
  if (perfil.usuario?.id && perfil.cargo !== 'ALUNO') {
    await Promise.all([
      apagar(CHAVE_ALUNO),
      guardar(CHAVE_TOKEN, token),
      guardar(CHAVE_USUARIO, JSON.stringify(perfil.usuario)),
    ]);
    return;
  }
  // Perfil incompleto: não se guarda sessão parcial.
  await limparSessao();
}

/**
 * Recupera a sessão salva localmente; null quando não há (ou está corrompida).
 *
 * Isto é apenas o estado em cache. A validade real do token é conferida pelo
 * backend em GET /api/auth/sessao — ver validarSessaoGuardada().
 */
export async function carregarSessao(): Promise<SessaoGuardada | null> {
  try {
    const [token, usuarioBruto, alunoBruto] = await Promise.all([
      ler(CHAVE_TOKEN),
      ler(CHAVE_USUARIO),
      ler(CHAVE_ALUNO),
    ]);
    if (!token) return null;
    if (alunoBruto) {
      const dados = JSON.parse(alunoBruto) as { aluno?: SessaoAluno['aluno']; cpf?: string };
      if (!dados?.aluno || typeof dados.aluno.id !== 'number' || typeof dados.aluno.nome !== 'string') {
        return null;
      }
      return {
        token,
        cargo: 'ALUNO',
        usuario: null,
        aluno: dados.aluno,
        cpf: typeof dados.cpf === 'string' ? dados.cpf : '',
      };
    }
    if (usuarioBruto) {
      const usuario = JSON.parse(usuarioBruto) as UsuarioSessao;
      if (!usuario || typeof usuario !== 'object' || !usuario.cargo) return null;
      return { token, cargo: usuario.cargo, usuario, aluno: null, cpf: '' };
    }
    return null;
  } catch {
    return null;
  }
}

/** Lê apenas o token (usado pelo cliente HTTP). */
export async function carregarToken(): Promise<string | null> {
  try {
    return await ler(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

/** Encerra a sessão local (logout ou 401). O backend continua stateless. */
export async function limparSessao(): Promise<void> {
  await Promise.all([apagar(CHAVE_TOKEN), apagar(CHAVE_USUARIO), apagar(CHAVE_ALUNO)]);
}
