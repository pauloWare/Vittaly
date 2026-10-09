import assert from 'node:assert/strict';
import { test } from 'node:test';

import { corpoCheckin, extrairTokenQr } from './portal.ts';

// ─── extrairTokenQr: QR com URL (formato atual da web) ──────────────────────

test('extrai o token da URL completa gerada pela web', () => {
  assert.equal(
    extrairTokenQr('https://dominio.com/registrar-presenca?token=ABC123'),
    'ABC123'
  );
});

test('extrai o token mesmo com outros parâmetros na URL', () => {
  assert.equal(
    extrairTokenQr('https://dominio.com/registrar-presenca?foo=1&token=ABC123&bar=2'),
    'ABC123'
  );
});

test('ignora espaços em branco ao redor do conteúdo lido', () => {
  assert.equal(
    extrairTokenQr('  https://dominio.com/registrar-presenca?token=ABC123  '),
    'ABC123'
  );
});

test('extrai token de URL fora do padrão (sem esquema) pelo fallback', () => {
  assert.equal(extrairTokenQr('dominio.com/registrar-presenca?token=ABC123'), 'ABC123');
});

// ─── extrairTokenQr: token puro (formato futuro) ────────────────────────────

test('aceita token puro sem tratamento', () => {
  assert.equal(extrairTokenQr('ABC123'), 'ABC123');
});

test('faz trim de token puro com espaços', () => {
  assert.equal(extrairTokenQr('  ABC123\n'), 'ABC123');
});

// ─── extrairTokenQr: conteúdos inválidos → null (sem requisição) ────────────

test('URL sem parâmetro token devolve null', () => {
  assert.equal(extrairTokenQr('https://dominio.com/registrar-presenca'), null);
});

test('URL com outros parâmetros mas sem token devolve null', () => {
  assert.equal(extrairTokenQr('https://dominio.com/registrar-presenca?foo=1'), null);
});

test('token vazio (token=) devolve null', () => {
  assert.equal(extrairTokenQr('https://dominio.com/registrar-presenca?token='), null);
});

test('conteúdo vazio, só espaços ou nulo devolve null', () => {
  assert.equal(extrairTokenQr(''), null);
  assert.equal(extrairTokenQr('   '), null);
  assert.equal(extrairTokenQr(null), null);
  assert.equal(extrairTokenQr(undefined), null);
});

test('rota interna sem token devolve null', () => {
  assert.equal(extrairTokenQr('/registrar-presenca'), null);
});

// ─── corpoCheckin: formato exato do POST /api/entrada/validar ───────────────

test('o app envia SOMENTE { token } ao backend (sem URL, cpf ou alunoId)', () => {
  const corpo = corpoCheckin('https://dominio.com/registrar-presenca?token=ABC123');
  assert.deepEqual(corpo, { token: 'ABC123' });
  assert.deepEqual(Object.keys(corpo ?? {}), ['token']);
});

test('token puro também vira { token }', () => {
  assert.deepEqual(corpoCheckin('ABC123'), { token: 'ABC123' });
});

test('QR sem token utilizável devolve null (tela bloqueia a requisição)', () => {
  assert.equal(corpoCheckin('https://dominio.com/registrar-presenca'), null);
  assert.equal(corpoCheckin(''), null);
  assert.equal(corpoCheckin(null), null);
});
