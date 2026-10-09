/**
 * Validação e formatação de CPF.
 */

// Extrai apenas os números
const somenteDigitos = (valor: string): string => valor.replace(/\D/g, "");

function calcularDigitoVerificador(cpfParcial: string): number {
  let soma = 0;
  let peso = cpfParcial.length + 1;

  for (const char of cpfParcial) {
    soma += Number(char) * peso;
    peso -= 1;
  }

  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Retorna true se o CPF (com ou sem máscara) for válido.
 * Rejeita CPFs com menos/mais de 11 dígitos e sequências repetidas
 * (ex: "111.111.111-11"), que passam no cálculo mas não são CPFs reais.
 */
export function validarCPF(valor: string): boolean {
  const cpf = somenteDigitos(valor);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const primeiroDigito = calcularDigitoVerificador(cpf.slice(0, 9));
  if (primeiroDigito !== Number(cpf[9])) return false;

  const segundoDigito = calcularDigitoVerificador(cpf.slice(0, 10));
  if (segundoDigito !== Number(cpf[10])) return false;

  return true;
}

/**
 * Formata uma string para o padrão de CPF: 000.000.000-00
 * Conforme o usuário digita, a máscara é aplicada dinamicamente.
 */
export function formatarCPF(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);

  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
