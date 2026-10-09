import { useFocusEffect, useRouter } from "expo-router";
import { CalendarDays, Check, CreditCard, Receipt } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessaoAluno } from "@/hooks/use-sessao-aluno";
import { criarMensalidadesStyles } from "@/styles/mensalidadesStyles";
import { useTema } from "@/hooks/use-tema";
import { ApiError, apiFetch } from "@/utils/api";
import {
  formatarData,
  formatarMoeda,
  type SituacaoFinanceira,
  type SituacaoMensalidade,
} from "@/utils/portal";

/**
 * Tela "Mensalidades" do portal do aluno.
 *
 * Consome `GET /api/portal/mensalidades` (ROLE_ALUNO). O backend devolve a
 * situação consolidada, a lista das mensalidades e o aviso sobre pagamento.
 * O backend NÃO tem integração com meio de pagamento
 * (`pagamentoOnlineDisponivel` é sempre false), então hoje o app orienta o
 * pagamento presencial — nunca simulamos uma transação. Quando o backend
 * liberar a flag, o botão vira "Pagar agora" e chama `iniciarPagamentoOnline`.
 *
 * Princípios visuais: cor de status só quando exige atenção (atrasada/pendente),
 * cada informação aparece uma vez, histórico em lista agrupada por ano.
 */
type Mensalidade = {
  id: number;
  dataVencimento: string;
  dataPagamento: string | null;
  valor: number;
  status: string;
  formaPagamento: string | null;
  situacao: SituacaoMensalidade;
};

type RespostaMensalidades = {
  situacao: SituacaoFinanceira;
  hoje: string;
  pagamentoOnlineDisponivel: boolean;
  mensagemPagamento: string;
  mensalidades: Mensalidade[];
};

type Filtro = "todas" | "abertas" | "pagas";

type Tom = {
  rotulo: string;
  badge: StyleProp<ViewStyle>;
  texto: StyleProp<TextStyle>;
};

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "abertas", rotulo: "Pendentes" },
  { id: "pagas", rotulo: "Pagas" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
const emUtc = (chave: string) => {
  const [a, m, d] = chave.slice(0, 10).split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

/** Dias de `de` até `ate` (positivo quando `ate` está no futuro). */
const diasEntre = (de: string, ate: string) =>
  Math.round((emUtc(ate) - emUtc(de)) / 86400000);

function descreverPrazo(
  m: Mensalidade,
  hoje: string,
): { texto: string; atrasada: boolean } {
  const dias = diasEntre(hoje, m.dataVencimento);

  if (m.situacao === "ATRASADA" || dias < 0) {
    const atraso = Math.abs(dias);
    if (dias >= 0) return { texto: "Atrasada", atrasada: true };
    return {
      texto: atraso === 1 ? "Atrasada há 1 dia" : `Atrasada há ${atraso} dias`,
      atrasada: true,
    };
  }
  if (dias === 0) return { texto: "Vence hoje", atrasada: false };
  if (dias === 1) return { texto: "Vence amanhã", atrasada: false };
  return { texto: `Vence em ${dias} dias`, atrasada: false };
}

export default function MensalidadesAlunoScreen() {
  const router = useRouter();
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarMensalidadesStyles(CORES), [CORES]);
  const TOM_MENSALIDADE: Record<SituacaoMensalidade, Tom> = useMemo(
    () => ({
      PAGA: { rotulo: "Paga", badge: styles.badgeOk, texto: styles.badgeOkTexto },
      ATRASADA: { rotulo: "Atrasada", badge: styles.badgeErro, texto: styles.badgeErroTexto },
      PENDENTE: { rotulo: "Pendente", badge: styles.badgeAviso, texto: styles.badgeAvisoTexto },
    }),
    [styles],
  );
  const insets = useSafeAreaInsets();
  const { aluno, carregando } = useSessaoAluno();

  const [dados, setDados] = useState<RespostaMensalidades | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [painelAberto, setPainelAberto] = useState(false);

  const carregar = useCallback(async (silencioso = false) => {
    if (silencioso) setAtualizando(true);
    else setCarregandoDados(true);
    setErro(null);
    try {
      const data = await apiFetch<RespostaMensalidades>("/portal/mensalidades");
      setDados(data);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.message);
      else setErro("Erro inesperado ao carregar suas mensalidades.");
    } finally {
      setCarregandoDados(false);
      setAtualizando(false);
    }
  }, []);

  // Recarrega sempre que a tela ganha foco.
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  /**
   * Ponto de integração para o pagamento online. Hoje o backend mantém
   * `pagamentoOnlineDisponivel = false`, então o botão nunca chega aqui.
   * TODO: iniciar o fluxo real de pagamento quando o backend liberar.
   */
  const iniciarPagamentoOnline = useCallback((_mensalidade: Mensalidade) => {
    Alert.alert("Pagamento online", "Esta função ainda não está integrada.");
  }, []);

  const resumo = useMemo(() => {
    const lista = dados?.mensalidades ?? [];
    const desc = [...lista].sort((a, b) =>
      b.dataVencimento.localeCompare(a.dataVencimento),
    );
    const emAberto = lista
      .filter((m) => m.situacao !== "PAGA")
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)); // mais antiga primeiro
    const pagas = lista.filter((m) => m.situacao === "PAGA");
    const totalPago = pagas.reduce(
      (soma, m) => soma + (Number(m.valor) || 0),
      0,
    );
    const ultimaPaga =
      [...pagas]
        .filter((m) => m.dataPagamento)
        .sort((a, b) =>
          (b.dataPagamento ?? "").localeCompare(a.dataPagamento ?? ""),
        )[0] ?? null;
    return { lista, desc, emAberto, pagas, totalPago, ultimaPaga };
  }, [dados]);

  // Histórico filtrado e agrupado por ano de vencimento.
  const grupos = useMemo(() => {
    const filtradas = resumo.desc.filter((m) =>
      filtro === "abertas"
        ? m.situacao !== "PAGA"
        : filtro === "pagas"
          ? m.situacao === "PAGA"
          : true,
    );
    const mapa = new Map<string, Mensalidade[]>();
    filtradas.forEach((m) => {
      const ano = m.dataVencimento.slice(0, 4);
      mapa.set(ano, [...(mapa.get(ano) ?? []), m]);
    });
    return Array.from(mapa.entries());
  }, [resumo.desc, filtro]);

  if ((carregando || carregandoDados) && !dados && !erro) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }

  const foco = resumo.emAberto[0] ?? null;
  const hoje = (dados?.hoje ?? "").slice(0, 10);
  const prazo = foco && hoje ? descreverPrazo(foco, hoje) : null;
  const outrasAbertas = resumo.emAberto.length - 1;

  const aoPressionarCta = () => {
    if (!foco || !dados) return;
    if (dados.pagamentoOnlineDisponivel) iniciarPagamentoOnline(foco);
    else setPainelAberto(true);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => void carregar(true)}
            tintColor={CORES.destaque}
            colors={[CORES.destaque]}
            progressBackgroundColor={CORES.superficie}
          />
        }
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mensalidades</Text>
          <Text style={styles.headerSubtitle}>
            {aluno?.nome
              ? aluno.nome
              : "Acompanhe e regularize seus pagamentos"}
          </Text>
        </View>

        {/* Erro */}
        {!!erro && (
          <View style={styles.bannerErro}>
            <Text style={styles.bannerErroTexto}>{erro}</Text>
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => void carregar()}
              accessibilityRole="button"
            >
              <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {dados && (
          <>
            {/* Card de destaque: só ganha cor quando há algo a pagar */}
            {foco && prazo ? (
              <View
                style={[
                  styles.heroCard,
                  prazo.atrasada ? styles.heroAtrasada : styles.heroPendente,
                ]}
              >
                <View style={styles.heroTopo}>
                  <Text style={styles.heroRotulo}>
                    {prazo.atrasada
                      ? "Mensalidade atrasada"
                      : "Próximo pagamento"}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      prazo.atrasada ? styles.badgeErro : styles.badgeAviso,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeTexto,
                        prazo.atrasada
                          ? styles.badgeErroTexto
                          : styles.badgeAvisoTexto,
                      ]}
                    >
                      {prazo.texto}
                    </Text>
                  </View>
                </View>

                <Text style={styles.heroValor}>
                  {formatarMoeda(foco.valor)}
                </Text>

                <View style={styles.heroLinha}>
                  <CalendarDays color={CORES.textoSecundario} size={16} />
                  <Text style={styles.heroTexto}>
                    Vencimento {formatarData(foco.dataVencimento)}
                  </Text>
                </View>

                {outrasAbertas > 0 && (
                  <Text style={styles.heroExtra}>
                    + {outrasAbertas}{" "}
                    {outrasAbertas === 1
                      ? "outra pendente"
                      : "outras pendentes"}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.botaoPrimario}
                  activeOpacity={0.85}
                  onPress={aoPressionarCta}
                  accessibilityRole="button"
                >
                  {dados.pagamentoOnlineDisponivel ? (
                    <CreditCard color={CORES.texto} size={18} />
                  ) : (
                    <Receipt color={CORES.texto} size={18} />
                  )}
                  <Text style={styles.botaoPrimarioTexto}>
                    {dados.pagamentoOnlineDisponivel
                      ? "PAGAR AGORA"
                      : "COMO PAGAR"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.statusCard}>
                <View style={styles.statusLinha}>
                  {resumo.lista.length === 0 ? (
                    <Receipt color={CORES.textoSecundario} size={18} />
                  ) : (
                    <Check color={CORES.sucesso} size={18} />
                  )}
                  <Text style={styles.statusTitulo}>
                    {resumo.lista.length === 0
                      ? "Sem mensalidades"
                      : "Tudo em dia"}
                  </Text>
                </View>
                <Text style={styles.statusDetalhe}>
                  {resumo.ultimaPaga?.dataPagamento
                    ? `Último pagamento em ${formatarData(resumo.ultimaPaga.dataPagamento)}${
                        resumo.ultimaPaga.formaPagamento
                          ? ` · ${resumo.ultimaPaga.formaPagamento}`
                          : ""
                      }`
                    : "Nenhuma mensalidade lançada para o seu cadastro."}
                </Text>
              </View>
            )}

            {/* Histórico */}
            {resumo.lista.length > 0 && (
              <>
                <View style={styles.historicoTopo}>
                  <Text style={styles.secaoTitulo}>Histórico</Text>
                  <Text style={styles.historicoTotal}>
                    Total pago {formatarMoeda(resumo.totalPago)}
                  </Text>
                </View>

                <View style={styles.chipsLinha}>
                  {FILTROS.map((f) => {
                    const ativo = filtro === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.chip, ativo && styles.chipAtivo]}
                        onPress={() => setFiltro(f.id)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: ativo }}
                      >
                        <Text
                          style={[
                            styles.chipTexto,
                            ativo && styles.chipTextoAtivo,
                          ]}
                        >
                          {f.rotulo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {grupos.length === 0 && (
                  <Text style={styles.vazioTexto}>
                    Nenhuma mensalidade pendente.
                  </Text>
                )}

                {grupos.map(([ano, itens]) => (
                  <View key={ano}>
                    <Text style={styles.anoRotulo}>{ano}</Text>

                    <View style={styles.lista}>
                      {itens.map((m, i) => {
                        const tom =
                          TOM_MENSALIDADE[m.situacao] ??
                          TOM_MENSALIDADE.PENDENTE;
                        const paga = m.situacao === "PAGA";

                        return (
                          <View
                            key={m.id}
                            style={[styles.linha, i > 0 && styles.linhaDivisor]}
                          >
                            <View style={styles.itemCorpo}>
                              <Text style={styles.itemPrincipal}>
                                Vencimento {formatarData(m.dataVencimento)}
                              </Text>
                              <Text style={styles.itemSecundario}>
                                {paga && m.dataPagamento
                                  ? `Paga em ${formatarData(m.dataPagamento)}${
                                      m.formaPagamento
                                        ? ` · ${m.formaPagamento}`
                                        : ""
                                    }`
                                  : "Aguardando pagamento"}
                              </Text>
                            </View>

                            <View style={styles.itemDireita}>
                              <Text style={styles.itemValor}>
                                {formatarMoeda(m.valor)}
                              </Text>
                              {!paga && (
                                <View style={[styles.badge, tom.badge]}>
                                  <Text style={[styles.badgeTexto, tom.texto]}>
                                    {tom.rotulo}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.replace("/aluno/inicio")}
          accessibilityRole="button"
        >
          <Text style={styles.botaoSecundarioTexto}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Painel inferior: como pagar */}
      <Modal
        visible={painelAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setPainelAberto(false)}
      >
        <View style={styles.modalFundo}>
          <Pressable
            style={styles.modalFechar}
            onPress={() => setPainelAberto(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          />

          <View
            style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}
            accessibilityViewIsModal
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalCabecalho}>
              <View style={styles.modalIcone}>
                <Receipt color={CORES.destaque} size={22} />
              </View>
              <Text style={styles.modalTitulo}>Como pagar</Text>
            </View>

            {foco && prazo && (
              <View style={styles.modalResumo}>
                <View style={styles.modalLinha}>
                  <Text style={styles.modalRotulo}>Valor</Text>
                  <Text style={styles.modalValor}>
                    {formatarMoeda(foco.valor)}
                  </Text>
                </View>
                <View style={styles.modalLinha}>
                  <Text style={styles.modalRotulo}>Vencimento</Text>
                  <Text style={styles.modalValor}>
                    {formatarData(foco.dataVencimento)}
                  </Text>
                </View>
                <View style={styles.modalLinha}>
                  <Text style={styles.modalRotulo}>Situação</Text>
                  <Text style={styles.modalValor}>{prazo.texto}</Text>
                </View>
              </View>
            )}

            {!!dados?.mensagemPagamento && (
              <Text style={styles.modalTexto}>{dados.mensagemPagamento}</Text>
            )}

            <TouchableOpacity
              style={styles.botaoPrimario}
              onPress={() => setPainelAberto(false)}
              accessibilityRole="button"
            >
              <Text style={styles.botaoPrimarioTexto}>ENTENDI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
