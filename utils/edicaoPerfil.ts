/**
 * Regras de edição do PERFIL do aluno (contato, endereço e emergência).
 *
 * Módulo puro (sem React, sem rede) para que as validações possam ser
 * testadas pelo `node --test` do projeto. O backend é a fonte de verdade:
 * aqui existe só a validação local, que dá retorno rápido ao aluno — o
 * servidor valida tudo de novo, inclusive duplicidade de e-mail.
 *
 * Nome, CPF, data de nascimento e sexo NÃO aparecem aqui: são campos
 * protegidos (somente leitura; correção pela recepção) e não existem no
 * DTO de edição do backend.
 */

/** Erros por campo devolvidos pela validação local. */
export type ErrosEdicaoPerfil = {
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  contatoEmergenciaNome?: string;
  contatoEmergenciaTelefone?: string;
};

/**
 * Dados crus do formulário de edição (mesmos campos de
 * `DadosEdicaoPerfil`, porém sempre como string — é o que o TextInput guarda).
 */
export type EntradaEdicaoPerfil = {
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
};

/**
 * Máscara de telefone aplicada enquanto o aluno digita
 * (mesma regra de `maskTelefone` em `app/admin/cadastro-manutencao.tsx`):
 * `(DD) 99999-9999` com até 11 dígitos — 10 dígitos viram linha fixa
 * `(DD) 9999-9999`. Idempotente: reaplicar sobre um valor já formatado
 * devolve o mesmo resultado.
 */
export function mascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Máscara de CEP `00000-000` aplicada enquanto o aluno digita (até 8 dígitos).
 * Idempotente, como a de telefone.
 */
export function mascaraCep(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Limites por campo (espelham `AlunoAcessoService` no backend). */
const LIMITES = {
  logradouro: 150,
  numero: 20,
  complemento: 60,
  bairro: 100,
  contatoEmergenciaNome: 150,
} as const;

/** Telefone: até 30 caracteres, só dígitos, espaços, `+ ( ) -`. */
const TELEFONE = /^[+()\-\s\d]+$/;

function validarTelefoneLocal(
  valor: string,
  chave: 'telefone' | 'contatoEmergenciaTelefone',
  erros: ErrosEdicaoPerfil,
): void {
  const texto = valor.trim();
  if (!texto) return; // vazio = limpar campo (opcional)
  if (texto.length > 30) {
    erros[chave] = 'O telefone deve ter no máximo 30 caracteres.';
  } else if (!TELEFONE.test(texto)) {
    erros[chave] = 'Informe um telefone válido.';
  }
}

function validarTextoLocal(
  valor: string,
  chave: 'logradouro' | 'numero' | 'complemento' | 'bairro' | 'contatoEmergenciaNome',
  erros: ErrosEdicaoPerfil,
): void {
  const max = LIMITES[chave];
  if (valor.trim().length > max) {
    erros[chave] = `O campo deve ter no máximo ${max} caracteres.`;
  }
}

/**
 * Valida localmente os campos editáveis do perfil.
 *
 * Regras espelhadas do backend: e-mail obrigatório, com formato válido e
 * até 150 caracteres; CEP, quando preenchido, com exatamente 8 dígitos;
 * telefones até 30 caracteres no padrão `+ ( ) - dígitos`; e os campos de
 * texto nos limites de tamanho. Vazio nos campos opcionais significa limpar
 * no servidor (null/ausente mantém o valor atual).
 */
export function validarDadosPerfil(entrada: EntradaEdicaoPerfil): ErrosEdicaoPerfil {
  const erros: ErrosEdicaoPerfil = {};

  const email = entrada.email.trim();
  if (!email) erros.email = 'Informe o e-mail.';
  else if (email.length > 150) erros.email = 'O e-mail deve ter no máximo 150 caracteres.';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erros.email = 'Informe um e-mail válido.';

  const cep = entrada.cep.trim();
  if (cep && cep.replace(/\D/g, '').length !== 8) {
    erros.cep = 'Informe um CEP com 8 dígitos.';
  }

  validarTelefoneLocal(entrada.telefone, 'telefone', erros);
  validarTelefoneLocal(
    entrada.contatoEmergenciaTelefone,
    'contatoEmergenciaTelefone',
    erros,
  );

  validarTextoLocal(entrada.logradouro, 'logradouro', erros);
  validarTextoLocal(entrada.numero, 'numero', erros);
  validarTextoLocal(entrada.complemento, 'complemento', erros);
  validarTextoLocal(entrada.bairro, 'bairro', erros);
  validarTextoLocal(entrada.contatoEmergenciaNome, 'contatoEmergenciaNome', erros);

  return erros;
}
