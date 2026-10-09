import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSessao } from '@/hooks/use-sessao';
import { criarManutencaoChamadosStyles } from '@/styles/manutencaoChamados';
import { useTema } from '@/hooks/use-tema';
import { ApiError, apiFetch } from '@/utils/api';

// A URL base da API fica em utils/api.ts (EXPO_PUBLIC_API_URL no .env).

type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
type StatusChamado = 'ABERTO' | 'EM_ANDAMENTO' | 'FINALIZADO';

type Chamado = {
  id: number;
  equipamento: { id: number; nome: string } | null;
  problema: string;
  fotoBase64?: string;
  data: string;
  hora?: string;
  prioridade: Prioridade;
  responsavel?: string;
  status: StatusChamado;
  observacoes?: string;
  tipo?: string;
  slaDias?: number;
  dataConclusao?: string | null;
};

/** Erros do carregamento da lista (módulo: usado em callbacks de promessa). */
function tratarErroCarregamento(e: unknown) {
  // 401: sessão já foi limpa e o hook redireciona ao login.
  if (e instanceof ApiError && e.status === 401) return;
  Alert.alert('Erro', e instanceof ApiError ? e.message : 'Não foi possível carregar os chamados.');
}

/** Lista de chamados em ordem decrescente de data (mais recente primeiro). */
function buscarChamados(): Promise<Chamado[]> {
  return apiFetch<Chamado[]>('/manutencao/chamados').then((data) => {
    const lista = Array.isArray(data) ? data : [];
    lista.sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''));
    return lista;
  });
}

const FILTROS: { label: string; value: StatusChamado | 'todos' }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Abertos', value: 'ABERTO' },
  { label: 'Em andamento', value: 'EM_ANDAMENTO' },
  { label: 'Finalizados', value: 'FINALIZADO' },
];

const STATUS_LABEL: Record<StatusChamado, string> = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADO: 'Finalizado',
};

function statusAtualStyle(status: StatusChamado, styles: ReturnType<typeof criarManutencaoChamadosStyles>) {
  if (status === 'ABERTO') return styles.statusAtualAberto;
  if (status === 'EM_ANDAMENTO') return styles.statusAtualAndamento;
  return styles.statusAtualFinalizado;
}

function badgeStyle(p: Prioridade, styles: ReturnType<typeof criarManutencaoChamadosStyles>) {
  if (p === 'CRITICA') return { box: styles.badgeCritica, text: styles.badgeCriticaText, label: 'Crítica' };
  if (p === 'ALTA') return { box: styles.badgeAlta, text: styles.badgeAltaText, label: 'Alta' };
  if (p === 'BAIXA') return { box: styles.badgeBaixa, text: styles.badgeBaixaText, label: 'Baixa' };
  return { box: styles.badgeMedia, text: styles.badgeMediaText, label: 'Média' };
}

export default function ManutencaoChamadosScreen() {
  // ADMIN e TECNICO podem listar/alterar chamados (regra do SecurityConfig).
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarManutencaoChamadosStyles(CORES), [CORES]);
  const { usuario, carregando: sessaoCarregando, sair } = useSessao(['ADMIN', 'TECNICO']);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtro, setFiltro] = useState<StatusChamado | 'todos'>('todos');
  const [alterandoId, setAlterandoId] = useState<number | null>(null);

  // Usado pelos eventos (pull-to-refresh), que aceitam async normalmente.
  const carregar = useCallback(async () => {
    setChamados(await buscarChamados());
  }, []);

  // Só busca depois que a sessão está confirmada (token disponível).
  // Corrente de promessa partindo da função de módulo: evita setState
  // síncrono dentro do effect (regra react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!usuario) return;
    let ativo = true;
    buscarChamados()
      .then((lista) => {
        if (ativo) setChamados(lista);
      })
      .catch((e) => {
        if (ativo) tratarErroCarregamento(e);
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
          setAtualizando(false);
        }
      });
    return () => {
      ativo = false;
    };
  }, [usuario]);

  async function atualizarStatus(chamado: Chamado, novoStatus: StatusChamado) {
    if (chamado.status === novoStatus) return;

    setAlterandoId(chamado.id);
    try {
      // Só os campos que a entidade realmente grava — reenviar os campos
      // calculados que a API devolve (prazo, slaStatus) quebraria o PUT.
      const payload = {
        equipamento: chamado.equipamento ? { id: chamado.equipamento.id } : null,
        problema: chamado.problema,
        fotoBase64: chamado.fotoBase64 ?? null,
        data: chamado.data,
        hora: chamado.hora ?? null,
        prioridade: chamado.prioridade,
        responsavel: chamado.responsavel ?? null,
        status: novoStatus,
        observacoes: chamado.observacoes ?? null,
        tipo: chamado.tipo ?? 'CORRETIVA',
        slaDias: chamado.slaDias ?? null,
        dataConclusao: chamado.dataConclusao ?? null,
      };

      const atualizado = await apiFetch<Chamado>(`/manutencao/chamados/${chamado.id}`, {
        method: 'PUT',
        body: payload,
      });
      setChamados((prev) => prev.map((c) => (c.id === chamado.id ? atualizado : c)));
    } catch (e) {
      // 401: sessão expirada — o hook leva o usuário de volta ao login.
      if (e instanceof ApiError && e.status === 401) return;
      Alert.alert(
        'Erro',
        e instanceof ApiError
          ? e.message
          : 'Não foi possível atualizar o status do chamado.'
      );
    } finally {
      setAlterandoId(null);
    }
  }

  const chamadosFiltrados =
    filtro === 'todos' ? chamados : chamados.filter((c) => c.status === filtro);

  if (carregando || sessaoCarregando || !usuario) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregar()
                .catch(tratarErroCarregamento)
                .finally(() => setAtualizando(false));
            }}
            tintColor={CORES.indicador}
          />
        }
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Chamados de Manutenção</Text>
              <Text style={styles.headerSubtitle}>
                Olá, {usuario.nome} — acompanhe e atualize os reparos
              </Text>
            </View>
            <TouchableOpacity style={styles.sairButton} onPress={sair}>
              <Text style={styles.sairButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, filtro === f.value && styles.filterChipSelected]}
              onPress={() => setFiltro(f.value)}
            >
              <Text style={[styles.filterChipText, filtro === f.value && styles.filterChipTextSelected]}>
                {f.label} {f.value !== 'todos' ? `(${chamados.filter((c) => c.status === f.value).length})` : `(${chamados.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {chamadosFiltrados.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum chamado nessa categoria.</Text>
        ) : (
          <FlatList
            data={chamadosFiltrados}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const badge = badgeStyle(item.prioridade, styles);
              return (
                <View style={styles.chamadoCard}>
                  <View style={styles.chamadoHeader}>
                    <Text style={styles.chamadoEquipamento}>
                      {item.equipamento?.nome ?? 'Equipamento não informado'}
                    </Text>
                    <View style={[styles.badge, badge.box]}>
                      <Text style={[styles.badgeText, badge.text]}>{badge.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.chamadoDescricao}>{item.problema}</Text>

                  {item.fotoBase64 ? (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${item.fotoBase64}` }}
                      style={styles.chamadoThumb}
                    />
                  ) : null}

                  <View style={styles.chamadoFooter}>
                    <Text style={styles.chamadoData}>
                      {item.data} {item.hora ? `· ${item.hora}` : ''}
                    </Text>
                    <Text style={[styles.statusAtual, statusAtualStyle(item.status, styles)]}>
                      {STATUS_LABEL[item.status]}
                    </Text>
                  </View>

                  <View style={styles.statusRow}>
                    {(['ABERTO', 'EM_ANDAMENTO', 'FINALIZADO'] as StatusChamado[]).map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusOption, item.status === s && styles.statusOptionSelected]}
                        onPress={() => atualizarStatus(item, s)}
                        disabled={alterandoId === item.id}
                      >
                        {alterandoId === item.id ? (
                          <ActivityIndicator size="small" color={CORES.texto} />
                        ) : (
                          <Text
                            style={[
                              styles.statusOptionText,
                              item.status === s && styles.statusOptionTextSelected,
                            ]}
                          >
                            {STATUS_LABEL[s]}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}