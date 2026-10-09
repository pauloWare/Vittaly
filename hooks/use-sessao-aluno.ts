/**
 * Guarda de sessão do PORTAL DO ALUNO.
 *
 * - Sem sessão de aluno salva -> volta para o login.
 * - Qualquer 401 em requisição autenticada -> limpa a sessão e volta ao login
 *   (o disparo vem do cliente HTTP, que é o único lugar que vê o 401).
 *
 * A identidade exibida aqui (nome/plano) é apenas conforto de interface: quem
 * autoriza a frequência, as mensalidades e o check-in é sempre o backend, que
 * deriva o aluno do token assinado (ROLE_ALUNO).
 */
import { aoExpirarSessao } from '@/utils/api';
import { validarSessaoNoServidor } from '@/utils/perfil';
import {
  carregarSessao,
  limparSessao,
  rotaDoAluno,
  type SessaoAluno,
} from '@/utils/sessao';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

/**
 * Guarda de sessão do PORTAL DO ALUNO.
 *
 * - Sem sessão salva -> volta para o login.
 * - Token revalidado no backend (GET /api/auth/sessao) ao abrir o app: a
 *   simples presença de um token local não é tratada como sessão válida.
 * - Qualquer 401 em requisição autenticada -> limpa a sessão e volta ao login
 *   (o disparo vem do cliente HTTP, que é o único lugar que vê o 401).
 *
 * A identidade exibida aqui (nome/plano) é apenas conforto de interface: quem
 * autoriza a frequência, as mensalidades, o check-in e o perfil é sempre o
 * backend, que deriva o aluno do token assinado (ROLE_ALUNO).
 */
export function useSessaoAluno() {
  const router = useRouter();
  const [sessao, setSessao] = useState<SessaoAluno | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const salva = await carregarSessao();
      if (!ativo) return;

      if (!salva || salva.cargo !== 'ALUNO' || !salva.aluno?.id) {
        // Sessão ausente (ou de outro perfil): não há o que restaurar aqui.
        router.replace(rotaDoAluno(salva?.cargo));
        return;
      }

      // Revalida no servidor: token expirado, conta removida ou cargo alterado
      // deixam de ser aceitos imediatamente.
      try {
        const perfil = await validarSessaoNoServidor();
        if (!ativo) return;
        if (perfil.cargo !== 'ALUNO' || !perfil.aluno?.id) {
          await limparSessao();
          router.replace('/');
          return;
        }
        setSessao({
          token: salva.token,
          aluno: perfil.aluno,
          cpf: salva.cpf ?? '',
        });
        setCarregando(false);
      } catch {
        // 401 já limpou a sessão e disparou o aviso global; qualquer outra
        // falha (rede) mantém o usuário na tela, sem apagar a sessão.
        if (!ativo) return;
        setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [router]);

  useEffect(() => {
    return aoExpirarSessao(() => {
      setSessao(null);
      Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
      router.replace('/');
    });
  }, [router]);

  /** Encerra a sessão local e volta para a tela de login. */
  const sair = useCallback(async () => {
    await limparSessao();
    router.replace('/');
  }, [router]);

  return { sessao, aluno: sessao?.aluno ?? null, carregando, sair };
}
