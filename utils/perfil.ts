/**
 * Cliente do PORTAL DO ALUNO.
 *
 * Todos os endpoints ficam sob `/api/portal/**` e exigem uma sessão de ALUNO no
 * backend (ROLE_ALUNO): o id do aluno vem sempre do token assinado, nunca é
 * enviado pelo aplicativo — é isso que impede um aluno de ler ou alterar o
 * cadastro de outro.
 */
import { apiFetch } from './api';
import type { SessaoUnificada } from './sessao';

/** Resposta do login unificado (POST /api/auth/login). */
export type RespostaLogin = SessaoUnificada & { token: string };

/**
 * Autentica por e-mail e senha em UM único endpoint.
 *
 * O backend decide se a conta é da equipe ou de um aluno e devolve o cargo já
 * resolvido — o app não informa nem escolhe o tipo de login.
 *
 * `sessao: false` porque, aqui, 401 significa "credencial inválida" e não
 * "token expirado": não deve derrubar nem limpar a sessão do aparelho.
 */
export function autenticar(email: string, senha: string): Promise<RespostaLogin> {
  return apiFetch<RespostaLogin>('/auth/login', {
    method: 'POST',
    body: { email, senha },
    auth: false,
    sessao: false,
  });
}

/**
 * Confere se a sessão guardada ainda é válida no servidor.
 *
 * Chamado ao abrir o aplicativo: a presença de um token no aparelho não é prova
 * de sessão viva — assinatura, expiração e identidade são reconferidas pelo
 * backend, que também devolve o perfil atualizado. O cliente HTTP se encarga de
 * limpar a sessão e avisar as telas em caso de 401.
 */
export function validarSessaoNoServidor(): Promise<SessaoUnificada> {
  return apiFetch<SessaoUnificada>('/auth/sessao');
}

/** Perfil do aluno devolvido por GET/PUT /api/portal/perfil. */
export type PerfilAluno = {
  id: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  /** CPF já mascarado pelo backend (ex.: ***.***-01). */
  cpfMascarado?: string | null;
  dataNascimento?: string | null;
  sexo?: string | null;
  plano?: string | null;
  situacao?: string | null;
  /** Foto em Base64 (data URL) ou ausente quando o aluno não tem foto. */
  fotoPerfilBase64?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  contatoEmergenciaNome?: string | null;
  contatoEmergenciaTelefone?: string | null;
};

/** Campos editáveis direto pelo aluno (nome/CPF/nascimento/sexo são protegidos). */
export type DadosEdicaoPerfil = {
  email: string;
  telefone?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  /** Apelido aceito também pelo backend. */
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  contatoEmergenciaNome?: string | null;
  contatoEmergenciaTelefone?: string | null;
};

/**
 * Limite do Base64 da foto. Espelha `app.upload.foto-max-bytes` do backend
 * (~1.000.000 caracteres ≈ 750 KB): o app avisa antes de enviar para não gastar
 * a banda do usuário com uma imagem que o servidor recusaria.
 */
export const FOTO_MAX_BASE64 = 1_000_000;

/** Data URLs de imagem aceitos (o mesmo conjunto validado no backend). */
const DATA_URL_IMAGEM = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

/** Carrega o perfil do aluno autenticado. */
export function buscarPerfil(): Promise<PerfilAluno> {
  return apiFetch<PerfilAluno>('/portal/perfil');
}

/**
 * Salva os campos editáveis; devolve o perfil já persistido.
 *
 * Envia apenas contato, endereço e emergência (nome, CPF, nascimento e sexo
 * são protegidos e nem chegam aqui). O backend identifica o aluno pelo token —
 * nunca pelo corpo — e valida tudo de novo (incluindo duplicidade de e-mail,
 * formato de CEP e limites de tamanho).
 */
export function salvarPerfil(dados: DadosEdicaoPerfil): Promise<PerfilAluno> {
  return apiFetch<PerfilAluno>('/portal/perfil', {
    method: 'PUT',
    body: {
      email: dados.email,
      // String vazia limpa o campo no servidor; null/ausente manteria o valor.
      telefone: dados.telefone ?? '',
      // Normalização defensiva antes de enviar: o backend normaliza de novo.
      cep: (dados.cep ?? '').replace(/\D/g, ''),
      logradouro: dados.logradouro ?? '',
      numero: dados.numero ?? '',
      complemento: dados.complemento ?? '',
      bairro: dados.bairro ?? '',
      contatoEmergenciaNome: dados.contatoEmergenciaNome ?? '',
      contatoEmergenciaTelefone: dados.contatoEmergenciaTelefone ?? '',
    },
  });
}

/**
 * Envia a foto de perfil (Base64) para o backend.
 * `foto` vazio remove a foto atual.
 */
export function salvarFoto(fotoBase64: string): Promise<PerfilAluno> {
  return apiFetch<PerfilAluno>('/portal/perfil/foto', {
    method: 'PUT',
    body: { fotoBase64 },
  });
}

/**
 * Ativação da conta mobile pelo próprio aluno ("Ativar minha conta").
 *
 * POST /api/portal/ativar-conta (público): e-mail + código de uso único +
 * senha escolhida pelo aluno. Não devolve sessão/token — após o sucesso o
 * app encaminha ao login normal.
 */
export type DadosAtivacao = {
  email: string;
  codigo: string;
  senha: string;
  confirmarSenha: string;
};

export function ativarConta(dados: DadosAtivacao): Promise<{ mensagem: string }> {
  return apiFetch<{ mensagem: string }>('/portal/ativar-conta', {
    method: 'POST',
    body: dados,
    auth: false,
    sessao: false,
  });
}


/** Valida a foto escolhida antes de enviar (formato e tamanho). */
export function validarFoto(fotoBase64: string | null | undefined): string | null {
  if (!fotoBase64) return 'Não foi possível ler a imagem selecionada.';
  if (!DATA_URL_IMAGEM.test(fotoBase64)) {
    return 'Formato não suportado. Escolha uma imagem PNG, JPEG ou WEBP.';
  }
  if (fotoBase64.length > FOTO_MAX_BASE64) {
    return 'A foto é muito grande. Escolha uma imagem menor.';
  }
  return null;
}