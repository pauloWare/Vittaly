import {
  DashboardStatsGrid,
  type DashboardIndicadores,
} from "@/components/DashboardStatsGrid";
import { useSessao } from "@/hooks/use-sessao";
import { criarDashboardStyles } from "@/styles/dashboardStyles";
import { useTema } from "@/hooks/use-tema";
import { ApiError, apiFetch } from "@/utils/api";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// A URL base da API fica em utils/api.ts (EXPO_PUBLIC_API_URL no .env).

// Os tipos abaixo espelham as entidades devolvidas pelos endpoints do backend;
// os indicadores vêm de DashboardStatsGrid (que replica o DashboardController).

type Equipamento = {
  id: number;
  nome: string;
  marca?: string;
  localizacao?: string;
  situacao: "ATIVO" | "MANUTENCAO" | "INATIVO";
};

type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
type StatusChamado = "ABERTO" | "EM_ANDAMENTO" | "FINALIZADO";

type Chamado = {
  id: number;
  equipamento: Equipamento;
  problema: string;
  fotoBase64?: string;
  data: string;
  hora?: string;
  prioridade: Prioridade;
  responsavel?: string;
  status: StatusChamado;
  observacoes?: string;
};

type Aluno = {
  id: number;
  nome: string;
  plano?: string;
  situacao: string;
};

type Mensalidade = {
  id: number;
  aluno: { id: number; nome: string };
  dataVencimento: string;
  dataPagamento?: string;
  valor: number;
  status: "PENDENTE" | "PAGA" | "ATRASADA";
};

// Exatamente os campos devolvidos por GET /api/dashboard: ver
// DashboardIndicadores exportado por components/DashboardStatsGrid.tsx.

/** Erros do carregamento (módulo: usado em callbacks de promessa). */
function tratarErroCarregamento(e: unknown) {
  // 401: o cliente HTTP já limpou a sessão e o hook redireciona ao login.
  if (e instanceof ApiError && e.status === 401) return;
  Alert.alert(
    "Erro",
    e instanceof ApiError
      ? e.message
      : "Não foi possível carregar os dados da academia.",
  );
}

type DadosDashboard = {
  indicadores: DashboardIndicadores;
  chamados: Chamado[];
  alunos: Aluno[];
  mensalidades: Mensalidade[];
  equipamentos: Equipamento[];
};

/**
 * Busca todas as listas da tela de uma vez (todas autenticadas).
 * Fica em módulo para o efeito usar a corrente de promessa direto.
 */
function buscarDadosDashboard(): Promise<DadosDashboard> {
  return Promise.all([
    apiFetch<DashboardIndicadores>("/dashboard"),
    apiFetch<Chamado[]>("/manutencao/chamados"),
    apiFetch<Aluno[]>("/aluno"),
    apiFetch<Mensalidade[]>("/mensalidade"),
    apiFetch<Equipamento[]>("/manutencao/equipamentos"),
  ]).then(([indicadores, chamados, alunos, mensalidades, equipamentos]) => ({
    indicadores,
    chamados: Array.isArray(chamados) ? chamados : [],
    alunos: Array.isArray(alunos) ? alunos : [],
    mensalidades: Array.isArray(mensalidades) ? mensalidades : [],
    equipamentos: Array.isArray(equipamentos) ? equipamentos : [],
  }));
}

export default function DashboardScreen() {
  const router = useRouter();
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarDashboardStyles(CORES), [CORES]);
  // Tela exclusiva de ADMIN (o backend também restringe /api/dashboard).
  const { usuario, carregando: sessaoCarregando, sair } = useSessao(["ADMIN"]);

  const [indicadores, setIndicadores] = useState<DashboardIndicadores | null>(
    null,
  );
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [equipamentoSelecionado, setEquipamentoSelecionado] =
    useState<Equipamento | null>(null);
  const [problema, setProblema] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("MEDIA");
  const [imagem, setImagem] = useState<{ uri: string; base64: string } | null>(
    null,
  );
  const [enviando, setEnviando] = useState(false);

  // Só busca dados depois que a sessão (e o cargo) estão confirmados.
  // Corrente de promessa partindo da função de módulo: evita setState
  // síncrono dentro do effect (regra react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!usuario) return;
    let ativo = true;
    buscarDadosDashboard()
      .then((dados) => {
        if (!ativo) return;
        setIndicadores(dados.indicadores);
        setChamados(dados.chamados);
        setAlunos(dados.alunos);
        setMensalidades(dados.mensalidades);
        setEquipamentos(dados.equipamentos);
      })
      .catch((e) => {
        if (ativo) tratarErroCarregamento(e);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [usuario]);

  // ===== Inadimplentes: calculado a partir de /api/mensalidade =====
  // (não existe endpoint pronto pra isso no backend)
  const hoje = new Date();
  const inadimplentes = mensalidades
    .filter((m) => m.status !== "PAGA" && new Date(m.dataVencimento) < hoje)
    .map((m) => ({
      id: m.id,
      nome: m.aluno?.nome ?? "Aluno não identificado",
      diasAtraso: Math.floor(
        (hoje.getTime() - new Date(m.dataVencimento).getTime()) / 86400000,
      ),
      valor: m.valor,
    }))
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  // ===== Alunos por plano: calculado a partir de /api/aluno =====
  // (não existe endpoint pronto pra isso no backend)
  const planosMap = new Map<string, number>();
  alunos.forEach((a) => {
    const plano = a.plano?.trim() || "Sem plano definido";
    planosMap.set(plano, (planosMap.get(plano) ?? 0) + 1);
  });
  const planosDistribuicao = Array.from(planosMap.entries()).map(
    ([nome, quantidade]) => ({
      nome,
      quantidade,
    }),
  );
  const maxPlano = planosDistribuicao.length
    ? Math.max(...planosDistribuicao.map((p) => p.quantidade))
    : 1;

  function abrirModal() {
    setEquipamentoSelecionado(null);
    setProblema("");
    setPrioridade("MEDIA");
    setImagem(null);
    setModalVisible(true);
  }

  async function escolherImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso às suas fotos para anexar uma imagem.",
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
      base64: true, // o backend guarda a foto como texto base64 (fotoBase64)
    });

    if (
      !resultado.canceled &&
      resultado.assets.length > 0 &&
      resultado.assets[0].base64
    ) {
      setImagem({
        uri: resultado.assets[0].uri,
        base64: resultado.assets[0].base64,
      });
    }
  }

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso à câmera para tirar a foto.",
      );
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      allowsEditing: true,
      base64: true,
    });

    if (
      !resultado.canceled &&
      resultado.assets.length > 0 &&
      resultado.assets[0].base64
    ) {
      setImagem({
        uri: resultado.assets[0].uri,
        base64: resultado.assets[0].base64,
      });
    }
  }

  async function enviarChamado() {
    if (!equipamentoSelecionado || !problema) {
      Alert.alert("Atenção", "Selecione o equipamento e descreva o problema.");
      return;
    }

    setEnviando(true);
    try {
      const agora = new Date();
      const novoChamado = await apiFetch<Chamado>("/manutencao/chamados", {
        method: "POST",
        body: {
          equipamento: { id: equipamentoSelecionado.id },
          problema,
          prioridade,
          data: agora.toISOString().split("T")[0], // yyyy-MM-dd
          hora: agora.toTimeString().split(" ")[0], // HH:mm:ss
          tipo: "CORRETIVA",
          fotoBase64: imagem?.base64 ?? null,
        },
      });

      setChamados((prev) => [novoChamado, ...prev]);
      setModalVisible(false);
    } catch (error) {
      // 401 tratado pelo cliente HTTP + hook (volta ao login).
      if (error instanceof ApiError && error.status === 401) return;
      Alert.alert(
        "Erro",
        error instanceof ApiError
          ? error.message
          : "Não foi possível abrir o chamado. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  function badgeStyle(p: Prioridade) {
    if (p === "CRITICA")
      return {
        box: styles.badgeCritica,
        text: styles.badgeCriticaText,
        label: "Crítica",
      };
    if (p === "ALTA")
      return {
        box: styles.badgeAlta,
        text: styles.badgeAltaText,
        label: "Alta",
      };
    if (p === "BAIXA")
      return {
        box: styles.badgeBaixa,
        text: styles.badgeBaixaText,
        label: "Baixa",
      };
    return {
      box: styles.badgeMedia,
      text: styles.badgeMediaText,
      label: "Média",
    };
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (carregando || sessaoCarregando || !usuario) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Visão Geral</Text>
              <Text style={styles.headerSubtitle}>
                Olá, {usuario.nome} — acompanhe sua academia em tempo real
              </Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={sair}>
              <Text style={styles.addButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botões de acesso rápido */}
        <View style={{ flexDirection: "row", marginBottom: 24 }}>
          <TouchableOpacity
            style={[
              styles.addButton,
              { flex: 1, marginRight: 8, alignItems: "center" },
            ]}
            onPress={() => router.push("/manutencao/chamados")}
          >
            <Text style={styles.addButtonText}>Tela de Manutenção</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { flex: 1, alignItems: "center" }]}
            onPress={() => router.push("/admin/cadastro-manutencao")}
          >
            <Text style={styles.addButtonText}>Cadastrar Manutenção</Text>
          </TouchableOpacity>
        </View>

        {/* Grade de indicadores — vem 100% de GET /api/dashboard */}
        {indicadores && <DashboardStatsGrid data={indicadores} />}

        {/* Inadimplentes (calculado a partir de /api/mensalidade) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alunos inadimplentes</Text>
          </View>
          {inadimplentes.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum aluno inadimplente no momento.
            </Text>
          ) : (
            <FlatList
              data={inadimplentes}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.inadimplenteCard}>
                  <View>
                    <Text style={styles.inadimplenteNome}>{item.nome}</Text>
                    <Text style={styles.inadimplenteDias}>
                      {item.diasAtraso} {item.diasAtraso === 1 ? "dia" : "dias"}{" "}
                      em atraso
                    </Text>
                  </View>
                  <Text style={styles.inadimplenteValor}>
                    {formatarMoeda(item.valor)}
                  </Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Alunos por plano (calculado a partir de /api/aluno) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alunos por plano</Text>
          </View>
          {planosDistribuicao.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum dado de plano disponível.
            </Text>
          ) : (
            <View style={styles.chartCard}>
              {planosDistribuicao.map((plano) => (
                <View key={plano.nome} style={styles.chartRow}>
                  <View style={styles.chartRowHeader}>
                    <Text style={styles.chartLabel}>{plano.nome}</Text>
                    <Text style={styles.chartValue}>{plano.quantidade}</Text>
                  </View>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartBar,
                        { width: `${(plano.quantidade / maxPlano) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Chamados de manutenção — GET/POST /api/manutencao/chamados */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chamados de manutenção</Text>
            <TouchableOpacity style={styles.addButton} onPress={abrirModal}>
              <Text style={styles.addButtonText}>+ Novo chamado</Text>
            </TouchableOpacity>
          </View>

          {chamados.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum chamado registrado no momento.
            </Text>
          ) : (
            <FlatList
              data={chamados}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const badge = badgeStyle(item.prioridade);
                return (
                  <View style={styles.chamadoCard}>
                    <View style={styles.chamadoHeader}>
                      <Text style={styles.chamadoEquipamento}>
                        {item.equipamento?.nome}
                      </Text>
                      <View style={[styles.badge, badge.box]}>
                        <Text style={[styles.badgeText, badge.text]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.chamadoDescricao}>{item.problema}</Text>
                    {item.fotoBase64 ? (
                      <Image
                        source={{
                          uri: `data:image/jpeg;base64,${item.fotoBase64}`,
                        }}
                        style={styles.chamadoThumb}
                      />
                    ) : null}
                    <View style={styles.chamadoFooter}>
                      <Text style={styles.chamadoData}>
                        {item.data} {item.hora ? `· ${item.hora}` : ""}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal: abrir chamado */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Abrir chamado de manutenção</Text>

              <Text style={styles.label}>Equipamento</Text>
              {equipamentos.length === 0 ? (
                <Text style={styles.emptyText}>
                  Nenhum equipamento cadastrado ainda. Cadastre um equipamento
                  antes de abrir um chamado.
                </Text>
              ) : (
                <View style={styles.chipsRow}>
                  {equipamentos.map((eq) => (
                    <TouchableOpacity
                      key={eq.id}
                      style={[
                        styles.chip,
                        equipamentoSelecionado?.id === eq.id &&
                          styles.chipSelected,
                      ]}
                      onPress={() => setEquipamentoSelecionado(eq)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          equipamentoSelecionado?.id === eq.id &&
                            styles.chipTextSelected,
                        ]}
                      >
                        {eq.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Descrição do problema</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva o que está acontecendo com o equipamento"
                placeholderTextColor={CORES.textoMuted}
                selectionColor={CORES.destaque}
                cursorColor={CORES.destaque}
                value={problema}
                onChangeText={setProblema}
                multiline
              />

              <Text style={styles.label}>Prioridade</Text>
              <View style={styles.prioridadeRow}>
                {(["BAIXA", "MEDIA", "ALTA", "CRITICA"] as Prioridade[]).map(
                  (p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.prioridadeOption,
                        prioridade === p && styles.prioridadeOptionSelected,
                      ]}
                      onPress={() => setPrioridade(p)}
                    >
                      <Text
                        style={[
                          styles.prioridadeOptionText,
                          prioridade === p &&
                            styles.prioridadeOptionTextSelected,
                        ]}
                      >
                        {p === "BAIXA"
                          ? "Baixa"
                          : p === "MEDIA"
                            ? "Média"
                            : p === "ALTA"
                              ? "Alta"
                              : "Crítica"}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              <Text style={styles.label}>Foto do equipamento (opcional)</Text>
              {imagem ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image
                    source={{ uri: imagem.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.imageRemoveButton}
                    onPress={() => setImagem(null)}
                  >
                    <Text style={styles.imageRemoveButtonText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerRow}>
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={escolherImagem}
                  >
                    <Text style={styles.imagePickerButtonText}>
                      Escolher da galeria
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={tirarFoto}
                  >
                    <Text style={styles.imagePickerButtonText}>Tirar foto</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={enviarChamado}
                  disabled={enviando}
                >
                  {enviando ? (
                    <ActivityIndicator color={CORES.texto} />
                  ) : (
                    <Text style={styles.submitButtonText}>Abrir chamado</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
