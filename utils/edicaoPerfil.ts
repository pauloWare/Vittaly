/**
 * Regras de edição dos dados pessoais da tela /aluno/Perfil.
 *
 * Módulo puro (sem React, sem rede) para que as validações possam ser
 * testadas pelo `node --test` do projeto. O backend é a fonte de verdade:
 * aqui existe só a validação local, que dá retorno rápido ao aluno — o
 * servidor valida tudo de novo, inclusive duplicidade de CPF/e-mail.
 *
 * Nada aqui constrói `Date` a partir da data do aluno: a conversão ISO usa
 * string montada a partir das partes, evitando deslocar o dia por causa de
 * timezone.
 */
import { validarCPF } from './cpf.ts';

/** Erros por campo devolvidos pela validação local. */
export type ErrosEdicaoPerfil = {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
};

/** Dados crus do formulário de edição. */
export type EntradaEdicaoPerfil = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
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
 * Máscara de data `dd/mm/aaaa` aplicada enquanto o aluno digita
 * (o mesmo mecanismo adotado em `app/admin/cadastro-manutencao.tsx`).
 */
export function mascaraDataNascimento(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * Converte `dd/mm/aaaa` para o ISO `AAAA-MM-DD` esperado pela API.
 * Devolve `null` quando a data está incompleta ou não existe no calendário
 * (ex.: 31/02). A string ISO é montada a partir das partes digitadas —
 * sem passar por `Date` — para preservar dia/mês/ano com segurança.
 */
export function dataNascimentoParaIso(valor: string): string | null {
  const m = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const d = Number(dia);
  const mm = Number(mes);
  const a = Number(ano);
  if (mm < 1 || mm > 12 || d < 1) return null;
  // Dias do mês com suporte a bissexto, sem criar objeto Date.
  const diasNoMes = [31, a % 4 === 0 && (a % 100 !== 0 || a % 400 === 0) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (d > diasNoMes[mm - 1]) return null;
  return `${ano}-${mes}-${dia}`;
}

/**
 * Converte o ISO `AAAA-MM-DD` (formato do backend) para `dd/mm/aaaa` exibido.
 * Devolve string vazia quando ausente ou fora do formato.
 */
export function isoParaMascaraData(iso?: string | null): string {
  if (!iso) return '';
  const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  const [, ano, mes, dia] = m;
  return `${dia}/${mes}/${ano}`;
}

/**
 * Indica se a data ISO está no futuro. A comparação é feita por string contra
 * a data local de hoje (montada por partes), sem converter a data do aluno
 * para `Date` — assim não há risco de deslocamento de fuso.
 */
export function dataNascimentoNoFuturo(iso: string): boolean {
  const hoje = new Date();
  const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
    hoje.getDate(),
  ).padStart(2, '0')}`;
  return iso > hojeIso;
}

/**
 * Valida localmente os campos editáveis do perfil.
 * Regras espelhadas do backend: nome obrigatório (máx. 150), e-mail
 * obrigatório e com formato válido, CPF com 11 dígitos e dígitos verificadores
 * corretos (quando preenchido) e data de nascimento real e não futura
 * (quando preenchida). CPF/nascimento vazios são aceitos: significam manter o
 * valor atual — o backend não apaga dado ausente.
 */
export function validarDadosPerfil(entrada: EntradaEdicaoPerfil): ErrosEdicaoPerfil {
  const erros: ErrosEdicaoPerfil = {};

  const nome = entrada.nome.trim();
  if (!nome) erros.nome = 'Informe o nome.';
  else if (nome.length > 150) erros.nome = 'O nome deve ter no máximo 150 caracteres.';

  const email = entrada.email.trim();
  if (!email) erros.email = 'Informe o e-mail.';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erros.email = 'Informe um e-mail válido.';

  const cpf = entrada.cpf.trim();
  if (cpf) {
    const digitos = cpf.replace(/\D/g, '');
    if (digitos.length !== 11) erros.cpf = 'Informe um CPF com 11 dígitos.';
    else if (!validarCPF(cpf)) erros.cpf = 'CPF inválido. Confira os números.';
  }

  const nascimento = entrada.dataNascimento.trim();
  if (nascimento) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(nascimento)) {
      erros.dataNascimento = 'Informe a data completa (dd/mm/aaaa).';
    } else {
      const iso = dataNascimentoParaIso(nascimento);
      if (!iso) erros.dataNascimento = 'Data de nascimento inválida.';
      else if (dataNascimentoNoFuturo(iso))
        erros.dataNascimento = 'A data de nascimento não pode estar no futuro.';
    }
  }

  return erros;
}
