import { aoExpirarSessao } from '@/utils/api';
import { validarSessaoNoServidor } from '@/utils/perfil';
import { carregarSessao, limparSessao, rotaDoAluno, rotaDoCargo, type UsuarioSessao } from '@/utils/sessao';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

/**
 * Guarda de sessão das telas protegidas.
 *
 * - Sem sessão salva -> volta para o login.
 * - Token revalidado no backend (GET /api/auth/sessao) ao abrir o app: a simples
 *   presença de um token local não é tratada como sessão válida.
 * - Cargo fora dos permitidos -> manda o usuário para a rota do próprio cargo.
 * - Qualquer requisição que responda 401 -> limpa a sessão e volta ao login
 *   (o disparo vem do cliente HTTP, que é o único lugar que vê o 401).
 *
 * Os cargos informados aqui são apenas conforto de interface: quem realmente
 * autoriza cada operação é o backend (SecurityConfig).
 */
export function useSessao(cargosPermitidos?: string[]) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Arrays literais mudam a cada render; usamos a junção como dependência.
  const permitidos = cargosPermitidos ? cargosPermitidos.join('|') : '';

  useEffect(() => {
    let ativo = true;

    (async () => {
      const salva = await carregarSessao();
      if (!ativo) return;

      if (!salva) {
        router.replace('/');
        return;
      }

      // Sessão de aluno não pertence a esta área: vai para o portal do aluno.
      if (salva.cargo === 'ALUNO') {
        router.replace(rotaDoAluno(salva.cargo));
        return;
      }

      const cargos = permitidos ? permitidos.split('|') : null;
      if (cargos && !cargos.includes(salva.cargo)) {
        const destino = rotaDoCargo(salva.cargo);
        if (destino === '/') {
          // Conta fora do escopo do app: encerra a sessão local.
          limparSessao().finally(() => router.replace('/'));
        } else {
          Alert.alert('Acesso restrito', 'Seu perfil não tem acesso a esta tela.');
          router.replace(destino);
        }
        return;
      }

      // Revalida no servidor: token expirado ou conta removida deixam de valer
      // imediatamente, mesmo que ainda estejam guardados no aparelho.
      try {
        const perfil = await validarSessaoNoServidor();
        if (!ativo) return;
        if (perfil.cargo === 'ALUNO' || !perfil.usuario?.id) {
          await limparSessao();
          router.replace(perfil.cargo === 'ALUNO' ? rotaDoAluno(perfil.cargo) : '/');
          return;
        }
        setUsuario(perfil.usuario);
        setCarregando(false);
      } catch {
        // 401 já limpou a sessão e disparou o aviso global; falha de rede não
        // deve apagar a sessão nem travar a tela.
        if (!ativo) return;
        setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [permitidos, router]);

  useEffect(() => {
    return aoExpirarSessao(() => {
      setUsuario(null);
      Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
      router.replace('/');
    });
  }, [router]);

  /** Encerra a sessão local e volta para a tela de login. */
  const sair = useCallback(async () => {
    await limparSessao();
    router.replace('/');
  }, [router]);

  return { usuario, carregando, sair };
}
