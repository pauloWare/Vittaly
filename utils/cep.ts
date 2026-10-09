/**
 * Consulta de endereço por CEP via ViaCEP.
 * Isolado da tela para poder ser reutilizado em qualquer formulário
 * que peça endereço (ex: cadastro de aluno, dados da academia).
 */

export type EnderecoViaCep = {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export type ResultadoBuscaCep =
  | { ok: true; endereco: EnderecoViaCep }
  | { ok: false; motivo: 'nao_encontrado' | 'erro_rede' };

/**
 * Recebe o CEP com ou sem máscara. Só faz sentido chamar esta função
 * quando o CEP já tiver exatamente 8 dígitos — a checagem de tamanho
 * fica a cargo de quem chama, para deixar claro no componente quando
 * a busca é disparada.
 */
export async function buscarEnderecoPorCep(valor: string): Promise<ResultadoBuscaCep> {
  const cep = valor.replace(/\D/g, '');

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) {
      return { ok: false, motivo: 'erro_rede' };
    }

    const data = await response.json();

    // ViaCEP devolve HTTP 200 com { erro: true } quando o CEP não existe,
    // em vez de um status de erro — precisa ser checado explicitamente.
    if (data?.erro) {
      return { ok: false, motivo: 'nao_encontrado' };
    }

    return {
      ok: true,
      endereco: {
        logradouro: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        cidade: data.localidade ?? '',
        estado: data.uf ?? '',
      },
    };
  } catch {
    return { ok: false, motivo: 'erro_rede' };
  }
}