import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  dataNascimentoNoFuturo,
  dataNascimentoParaIso,
  isoParaMascaraData,
  mascaraDataNascimento,
  mascaraTelefone,
  validarDadosPerfil,
} from './edicaoPerfil.ts';

// ─── mascaraTelefone ────────────────────────────────────────────────────────

test('máscara de telefone formata progressivamente (celular com 11 dígitos)', () => {
  assert.equal(mascaraTelefone(''), '');
  assert.equal(mascaraTelefone('1'), '1');
  assert.equal(mascaraTelefone('11'), '11');
  assert.equal(mascaraTelefone('119'), '(11) 9');
  assert.equal(mascaraTelefone('119876'), '(11) 9876');
  assert.equal(mascaraTelefone('1198765'), '(11) 9876-5');
  // Até 10 dígitos o agrupamento ainda é o de fixo; só com o 11º dígito
  // (celular) ele passa para (DD) 99999-9999 — regra idêntica à do admin.
  assert.equal(mascaraTelefone('11987654'), '(11) 9876-54');
  assert.equal(mascaraTelefone('119876543'), '(11) 9876-543');
  assert.equal(mascaraTelefone('1198765432'), '(11) 9876-5432');
  assert.equal(mascaraTelefone('11987654321'), '(11) 98765-4321');
});

test('telefone com 10 dígitos vira linha fixa (DD) 9999-9999', () => {
  assert.equal(mascaraTelefone('1134567890'), '(11) 3456-7890');
});

test('máscara de telefone é idempotente e não altera valor já formatado', () => {
  assert.equal(mascaraTelefone('(11) 98765-4321'), '(11) 98765-4321');
  assert.equal(mascaraTelefone('(11) 3456-7890'), '(11) 3456-7890');
  assert.equal(mascaraTelefone(mascaraTelefone('11987654321')), '(11) 98765-4321');
});

test('máscara de telefone ignora caracteres não numéricos e limita a 11 dígitos', () => {
  assert.equal(mascaraTelefone('abc'), '');
  assert.equal(mascaraTelefone('(11) 9876-5432'), '(11) 9876-5432');
  assert.equal(mascaraTelefone('119876543219999'), '(11) 98765-4321');
});

// ─── mascaraDataNascimento ──────────────────────────────────────────────────

test('máscara de nascimento formata progressivamente', () => {
  assert.equal(mascaraDataNascimento(''), '');
  assert.equal(mascaraDataNascimento('2'), '2');
  assert.equal(mascaraDataNascimento('25'), '25');
  assert.equal(mascaraDataNascimento('251'), '25/1');
  assert.equal(mascaraDataNascimento('251219'), '25/12/19');
  assert.equal(mascaraDataNascimento('25121990'), '25/12/1990');
});

test('máscara de nascimento ignora caracteres não numéricos e limita a 8 dígitos', () => {
  assert.equal(mascaraDataNascimento('25/12/1990'), '25/12/1990');
  assert.equal(mascaraDataNascimento('abc25x12y1990'), '25/12/1990');
  assert.equal(mascaraDataNascimento('251219901234'), '25/12/1990');
});

// ─── dataNascimentoParaIso ──────────────────────────────────────────────────

test('converte dd/mm/aaaa para o ISO esperado pela API', () => {
  assert.equal(dataNascimentoParaIso('25/12/1990'), '1990-12-25');
  assert.equal(dataNascimentoParaIso('01/01/2000'), '2000-01-01');
  assert.equal(dataNascimentoParaIso('29/02/2000'), '2000-02-29'); // bissexto
});

test('rejeita data incompleta ou fora do formato', () => {
  assert.equal(dataNascimentoParaIso(''), null);
  assert.equal(dataNascimentoParaIso('25/12'), null);
  assert.equal(dataNascimentoParaIso('1990-12-25'), null);
  assert.equal(dataNascimentoParaIso('25-12-1990'), null);
  assert.equal(dataNascimentoParaIso('25/12/199'), null);
});

test('rejeita data inexistente no calendário', () => {
  assert.equal(dataNascimentoParaIso('31/02/1990'), null);
  assert.equal(dataNascimentoParaIso('32/01/1990'), null);
  assert.equal(dataNascimentoParaIso('00/05/1990'), null);
  assert.equal(dataNascimentoParaIso('15/13/1990'), null);
  assert.equal(dataNascimentoParaIso('29/02/1990'), null); // 1990 não é bissexto
});

// ─── isoParaMascaraData ─────────────────────────────────────────────────────

test('converte o ISO do backend para dd/mm/aaaa exibido', () => {
  assert.equal(isoParaMascaraData('1990-12-25'), '25/12/1990');
  assert.equal(isoParaMascaraData('2000-01-01'), '01/01/2000');
});

test('devolve vazio para data ausente ou fora do formato', () => {
  assert.equal(isoParaMascaraData(null), '');
  assert.equal(isoParaMascaraData(undefined), '');
  assert.equal(isoParaMascaraData(''), '');
  assert.equal(isoParaMascaraData('25/12/1990'), '');
});


// ─── dataNascimentoNoFuturo ─────────────────────────────────────────────────

test('data futura é detectada; passado e hoje não são', () => {
  const hoje = new Date();
  const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
    hoje.getDate(),
  ).padStart(2, '0')}`;

  const amanha = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
  const amanhaIso = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, '0')}-${String(
    amanha.getDate(),
  ).padStart(2, '0')}`;

  assert.equal(dataNascimentoNoFuturo('1990-12-25'), false);
  assert.equal(dataNascimentoNoFuturo(hojeIso), false);
  assert.equal(dataNascimentoNoFuturo(amanhaIso), true);
  assert.equal(dataNascimentoNoFuturo('2999-01-01'), true);
});

// ─── validarDadosPerfil ─────────────────────────────────────────────────────

const VALIDO = {
  nome: 'Aluno Teste',
  email: 'aluno@teste.com',
  telefone: '11987654321',
  cpf: '529.982.247-25',
  dataNascimento: '25/12/1990',
};

test('aceita um preenchimento válido completo', () => {
  assert.deepEqual(validarDadosPerfil(VALIDO), {});
});

test('nome vazio ou só espaços é rejeitado', () => {
  assert.equal(validarDadosPerfil({ ...VALIDO, nome: '' }).nome, 'Informe o nome.');
  assert.equal(validarDadosPerfil({ ...VALIDO, nome: '   ' }).nome, 'Informe o nome.');
  assert.equal(
    validarDadosPerfil({ ...VALIDO, nome: 'x'.repeat(151) }).nome,
    'O nome deve ter no máximo 150 caracteres.'
  );
});

test('e-mail vazio ou com formato inválido é rejeitado', () => {
  assert.equal(validarDadosPerfil({ ...VALIDO, email: '' }).email, 'Informe o e-mail.');
  assert.equal(
    validarDadosPerfil({ ...VALIDO, email: 'sem-arroba' }).email,
    'Informe um e-mail válido.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, email: 'a@b' }).email,
    'Informe um e-mail válido.'
  );
});

test('aceita CPF com máscara e sem máscara quando válido', () => {
  assert.deepEqual(validarDadosPerfil({ ...VALIDO, cpf: '529.982.247-25' }), {});
  assert.deepEqual(validarDadosPerfil({ ...VALIDO, cpf: '52998224725' }), {});
});

test('rejeita CPF incompleto ou com dígitos verificadores errados', () => {
  assert.equal(
    validarDadosPerfil({ ...VALIDO, cpf: '529.982.247' }).cpf,
    'Informe um CPF com 11 dígitos.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, cpf: '111.111.111-11' }).cpf,
    'CPF inválido. Confira os números.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, cpf: '123.456.789-00' }).cpf,
    'CPF inválido. Confira os números.'
  );
});

test('CPF vazio é aceito: significa manter o atual', () => {
  assert.deepEqual(validarDadosPerfil({ ...VALIDO, cpf: '' }), {});
  assert.deepEqual(validarDadosPerfil({ ...VALIDO, cpf: '   ' }), {});
});

test('data de nascimento válida é aceita e vazia mantém a atual', () => {
  assert.deepEqual(validarDadosPerfil({ ...VALIDO, dataNascimento: '01/01/2000' }), {});
  assert.deepEqual(validarDadosPerfil({ ...VALIDO, dataNascimento: '' }), {});
});

test('data de nascimento incompleta, impossível ou futura é rejeitada', () => {
  assert.equal(
    validarDadosPerfil({ ...VALIDO, dataNascimento: '25/12' }).dataNascimento,
    'Informe a data completa (dd/mm/aaaa).'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, dataNascimento: '31/02/1990' }).dataNascimento,
    'Data de nascimento inválida.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, dataNascimento: '01/01/2999' }).dataNascimento,
    'A data de nascimento não pode estar no futuro.'
  );
});

test('erros de campos diferentes são reportados em conjunto', () => {
  const erros = validarDadosPerfil({
    nome: '',
    email: 'invalido',
    telefone: '',
    cpf: '111.111.111-11',
    dataNascimento: '01/01/2999',
  });
  assert.ok(erros.nome);
  assert.ok(erros.email);
  assert.ok(erros.cpf);
  assert.ok(erros.dataNascimento);
  assert.equal(erros.telefone, undefined);
});
