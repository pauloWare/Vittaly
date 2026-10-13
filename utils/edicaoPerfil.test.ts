import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  mascaraCep,
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

// ─── mascaraCep ─────────────────────────────────────────────────────────────

test('máscara de CEP formata progressivamente em 00000-000', () => {
  assert.equal(mascaraCep(''), '');
  assert.equal(mascaraCep('0'), '0');
  assert.equal(mascaraCep('01310'), '01310');
  assert.equal(mascaraCep('013101'), '01310-1');
  assert.equal(mascaraCep('01310100'), '01310-100');
});

test('máscara de CEP é idempotente e ignora caracteres não numéricos', () => {
  assert.equal(mascaraCep('01310-100'), '01310-100');
  assert.equal(mascaraCep(mascaraCep('01310100')), '01310-100');
  assert.equal(mascaraCep('abc01310100'), '01310-100');
  assert.equal(mascaraCep('013101009999'), '01310-100');
});

// ─── validarDadosPerfil ─────────────────────────────────────────────────────

const VALIDO = {
  email: 'aluno@teste.com',
  telefone: '(11) 98765-4321',
  cep: '01310-100',
  logradouro: 'Av. Paulista',
  numero: '1000',
  complemento: 'Apto 111',
  bairro: 'Bela Vista',
  contatoEmergenciaNome: 'Mae do Aluno',
  contatoEmergenciaTelefone: '(11) 91111-2222',
};

test('aceita um preenchimento válido completo', () => {
  assert.deepEqual(validarDadosPerfil(VALIDO), {});
});

test('e-mail vazio, longo ou com formato inválido é rejeitado', () => {
  assert.equal(validarDadosPerfil({ ...VALIDO, email: '' }).email, 'Informe o e-mail.');
  assert.equal(
    validarDadosPerfil({ ...VALIDO, email: 'x'.repeat(146) + '@a.co' }).email,
    'O e-mail deve ter no máximo 150 caracteres.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, email: 'sem-arroba' }).email,
    'Informe um e-mail válido.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, email: 'a@b' }).email,
    'Informe um e-mail válido.'
  );
});

test('CEP vazio é aceito (limpa); com menos de 8 dígitos é rejeitado', () => {
  assert.deepEqual(validarDadosPerfil({ ...VALIDO, cep: '' }), {});
  assert.equal(
    validarDadosPerfil({ ...VALIDO, cep: '0131-100' }).cep,
    'Informe um CEP com 8 dígitos.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, cep: '123' }).cep,
    'Informe um CEP com 8 dígitos.'
  );
});

test('telefones vazios são aceitos; conteúdo inválido é rejeitado', () => {
  assert.deepEqual(validarDadosPerfil({ ...VALIDO, telefone: '' }), {});
  assert.deepEqual(
    validarDadosPerfil({ ...VALIDO, contatoEmergenciaTelefone: '' }),
    {}
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, telefone: 'abc' }).telefone,
    'Informe um telefone válido.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, contatoEmergenciaTelefone: 'call-me' })
      .contatoEmergenciaTelefone,
    'Informe um telefone válido.'
  );
});

test('telefone acima de 30 caracteres é rejeitado nos dois campos', () => {
  const longo = '+1 (555) 123-456789012345678901234567';
  assert.ok(longo.length > 30);
  assert.equal(
    validarDadosPerfil({ ...VALIDO, telefone: longo }).telefone,
    'O telefone deve ter no máximo 30 caracteres.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, contatoEmergenciaTelefone: longo })
      .contatoEmergenciaTelefone,
    'O telefone deve ter no máximo 30 caracteres.'
  );
});

test('campos de texto respeitam os limites do backend', () => {
  assert.equal(
    validarDadosPerfil({ ...VALIDO, logradouro: 'x'.repeat(151) }).logradouro,
    'O campo deve ter no máximo 150 caracteres.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, numero: 'x'.repeat(21) }).numero,
    'O campo deve ter no máximo 20 caracteres.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, complemento: 'x'.repeat(61) }).complemento,
    'O campo deve ter no máximo 60 caracteres.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, bairro: 'x'.repeat(101) }).bairro,
    'O campo deve ter no máximo 100 caracteres.'
  );
  assert.equal(
    validarDadosPerfil({ ...VALIDO, contatoEmergenciaNome: 'x'.repeat(151) })
      .contatoEmergenciaNome,
    'O campo deve ter no máximo 150 caracteres.'
  );
  // Nos limites exatos continua aceito.
  assert.deepEqual(
    validarDadosPerfil({
      ...VALIDO,
      logradouro: 'x'.repeat(150),
      numero: 'x'.repeat(20),
      complemento: 'x'.repeat(60),
      bairro: 'x'.repeat(100),
      contatoEmergenciaNome: 'x'.repeat(150),
    }),
    {}
  );
});

test('erros de campos diferentes são reportados em conjunto', () => {
  const erros = validarDadosPerfil({
    email: 'invalido',
    telefone: 'abc',
    cep: '123',
    logradouro: 'x'.repeat(151),
    numero: '',
    complemento: '',
    bairro: '',
    contatoEmergenciaNome: '',
    contatoEmergenciaTelefone: 'call-me',
  });
  assert.ok(erros.email);
  assert.ok(erros.telefone);
  assert.ok(erros.cep);
  assert.ok(erros.logradouro);
  assert.ok(erros.contatoEmergenciaTelefone);
  // Opcionais vazios não geram erro.
  assert.equal(erros.numero, undefined);
  assert.equal(erros.complemento, undefined);
  assert.equal(erros.bairro, undefined);
  assert.equal(erros.contatoEmergenciaNome, undefined);
});
