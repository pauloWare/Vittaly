import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  QrCode,
} from 'lucide-react-native';

import { useSessaoAluno } from '@/hooks/use-sessao-aluno';
import { criarFrequenciaStyles } from '@/styles/frequenciaStyles';
import { useTema } from '@/hooks/use-tema';
import { ApiError, apiFetch } from '@/utils/api';
import { formatarHora } from '@/utils/portal';

/**
 * Tela "Minha frequência": mostra o calendário do mês com os dias em que o
 * aluno treinou, indicadores (percentual, presenças, média semanal, última
 * visita) e o histórico detalhado, com navegação mês a mês.
 *
 * Todos os dados vêm do backend; o app só organiza e exibe.
 */

// AJUSTE AQUI se o endpoint do backend for outro.
const ENDPOINT_FREQUENCIA = '/frequencia/minha';

/** Aceita `data` no formato 'YYYY-MM-DD' (ou ISO, usando só os 10 primeiros caracteres). */
type Presenca = { id?: number; data: string; horaEntrada?: string | null };
type RespostaFrequencia = Presenca[] | { presencas?: Presenca[] };

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const SEMANA_INICIAL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const SEMANA_CURTA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const SEMANA_LONGA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
];

// ─── Helpers de data (sem depender de fuso horário) ────────────────────────
const dois = (n: number) => String(n).padStart(2, '0');

const chaveDe = (d: Date) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;

const partesDe = (chave: string) => {
  const [ano, mes, dia] = chave.split('-').map(Number);
  return { ano, mes: mes - 1, dia };
};

const diasEntre = (de: string, ate: string) => {
  const a = partesDe(de);
  const b = partesDe(ate);
  return Math.round(
    (Date.UTC(b.ano, b.mes, b.dia) - Date.UTC(a.ano, a.mes, a.dia)) / 86400000
  );
};

function rotuloUltimaVisita(chave: string | null, hoje: string): string {
  if (!chave) return '—';
  const dias = diasEntre(chave, hoje);
  if (dias <= 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  return `há ${dias} dias`;
}

function normalizar(resp: RespostaFrequencia | null | undefined): Presenca[] {
  const lista = Array.isArray(resp) ? resp : resp?.presencas ?? [];
  return lista.filter((p) => typeof p?.data === 'string' && p.data.length >= 10);
}

export default function FrequenciaAlunoScreen() {
  const router = useRouter();
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarFrequenciaStyles(CORES), [CORES]);
  const insets = useSafeAreaInsets();
  const { carregando } = useSessaoAluno();

  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [carregou, setCarregou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [mesVisto, setMesVisto] = useState(() => {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
  });

  const carregar = useCallback(async (manual = false) => {
    if (manual) setAtualizando(true);
    try {
      const resp = await apiFetch<RespostaFrequencia>(ENDPOINT_FREQUENCIA);
      setPresencas(normalizar(resp));
      setErro(null);
      setCarregou(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar sua frequência.');
    } finally {
      setAtualizando(false);
    }
  }, []);

  // Recarrega sempre que a tela ganha foco (ex.: depois de registrar presença).
  useFocusEffect(
    useCallback(() => {
      if (!carregando) {
        void carregar();
      }
    }, [carregando, carregar])
  );

  const tentarNovamente = useCallback(() => {
    setErro(null);
    void carregar();
  }, [carregar]);

  const mudarMes = useCallback((delta: number) => {
    setMesVisto(({ ano, mes }) => {
      const d = new Date(ano, mes + delta, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
  }, []);

  const resumo = useMemo(() => {
    const agora = new Date();
    const chaveHoje = chaveDe(agora);
    const prefixo = `${mesVisto.ano}-${dois(mesVisto.mes + 1)}`;
    const ehMesAtual = prefixo === chaveHoje.slice(0, 7);
    const totalDias = new Date(mesVisto.ano, mesVisto.mes + 1, 0).getDate();
    const decorridos = ehMesAtual ? agora.getDate() : totalDias;

    // Mais recentes primeiro.
    const ordenadas = [...presencas].sort((a, b) =>
      `${b.data.slice(0, 10)}${b.horaEntrada ?? ''}`.localeCompare(
        `${a.data.slice(0, 10)}${a.horaEntrada ?? ''}`
      )
    );
    const doMes = ordenadas.filter((p) => p.data.slice(0, 7) === prefixo);
    const diasComPresenca = new Set(doMes.map((p) => p.data.slice(0, 10)));

    const percentual =
      decorridos > 0
        ? Math.min(100, Math.round((diasComPresenca.size / decorridos) * 100))
        : 0;
    const mediaSemanal = decorridos > 0 ? (diasComPresenca.size / decorridos) * 7 : 0;

    return {
      chaveHoje,
      prefixo,
      ehMesAtual,
      totalDias,
      decorridos,
      doMes,
      diasComPresenca,
      percentual,
      mediaSemanal,
      ultimaVisita: ordenadas.length ? ordenadas[0].data.slice(0, 10) : null,
      menorPrefixo: ordenadas.length
        ? ordenadas[ordenadas.length - 1].data.slice(0, 7)
        : null,
      treinouHoje: ordenadas.some((p) => p.data.slice(0, 10) === chaveHoje),
      deslocamentoInicial: new Date(mesVisto.ano, mesVisto.mes, 1).getDay(),
    };
  }, [presencas, mesVisto]);

  // Estados de carregando e de erro também respeitam a área segura.
  const estiloCentralizado = [
    styles.container,
    styles.centered,
    { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
  ];

  // ─── Carregando ──────────────────────────────────────────────────────────
  if (carregando || (!carregou && !erro)) {
    return (
      <View style={estiloCentralizado}>
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }

  // ─── Erro na primeira carga ──────────────────────────────────────────────
  if (!carregou && erro) {
    return (
      <View style={estiloCentralizado}>
        <Text style={styles.erroTitulo}>Não foi possível carregar</Text>
        <Text style={styles.erroTexto}>{erro}</Text>
        <TouchableOpacity
          style={[styles.botaoPrimario, { alignSelf: 'stretch' }]}
          onPress={tentarNovamente}
          accessibilityRole="button"
        >
          <Text style={styles.botaoPrimarioTexto}>TENTAR NOVAMENTE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botaoSecundario, { alignSelf: 'stretch' }]}
          onPress={() => router.replace('/aluno/inicio')}
          accessibilityRole="button"
        >
          <Text style={styles.botaoSecundarioTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    chaveHoje, prefixo, ehMesAtual, totalDias, decorridos, doMes,
    diasComPresenca, percentual, mediaSemanal, ultimaVisita, menorPrefixo,
    treinouHoje, deslocamentoInicial,
  } = resumo;

  const podeVoltarMes = menorPrefixo !== null && prefixo > menorPrefixo;
  const podeAvancarMes = !ehMesAtual;
  const nomeMes = MESES[mesVisto.mes];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
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
        <Text style={styles.headerTitle}>Minha frequência</Text>
        <Text style={styles.headerSubtitle}>
          Acompanhe seus treinos e mantenha a constância
        </Text>
      </View>

      {!!erro && (
        <View style={styles.bannerErro}>
          <Text style={styles.bannerErroTexto}>{erro}</Text>
        </View>
      )}

      {/* Navegação de mês */}
      <View style={styles.mesNav}>
        <TouchableOpacity
          style={[styles.mesBotao, !podeVoltarMes && styles.mesBotaoDesabilitado]}
          onPress={() => mudarMes(-1)}
          disabled={!podeVoltarMes}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          accessibilityState={{ disabled: !podeVoltarMes }}
        >
          <ChevronLeft color={CORES.texto} size={22} />
        </TouchableOpacity>

        <Text style={styles.mesTitulo}>
          {nomeMes} de {mesVisto.ano}
        </Text>

        <TouchableOpacity
          style={[styles.mesBotao, !podeAvancarMes && styles.mesBotaoDesabilitado]}
          onPress={() => mudarMes(1)}
          disabled={!podeAvancarMes}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          accessibilityState={{ disabled: !podeAvancarMes }}
        >
          <ChevronRight color={CORES.texto} size={22} />
        </TouchableOpacity>
      </View>

      {/* Resumo do mês */}
      <View style={styles.resumoCard}>
        <Text style={styles.resumoRotulo}>Frequência do mês</Text>
        <View style={styles.percentualLinha}>
          <Text style={styles.percentualValor}>{percentual}</Text>
          <Text style={styles.percentualSimbolo}>%</Text>
        </View>
        <Text style={styles.resumoLegenda}>
          {diasComPresenca.size} de {decorridos}{' '}
          {decorridos === 1 ? 'dia' : 'dias'} com treino
        </Text>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percentual }}
        >
          <View style={[styles.progressFill, { width: `${percentual}%` }]} />
        </View>
      </View>

      {/* Indicadores */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValor}>{diasComPresenca.size}</Text>
          <Text style={styles.statRotulo}>Presenças no mês</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValor}>
            {mediaSemanal.toFixed(1).replace('.', ',')}
          </Text>
          <Text style={styles.statRotulo}>Treinos por semana</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValor} numberOfLines={1} adjustsFontSizeToFit>
            {rotuloUltimaVisita(ultimaVisita, chaveHoje)}
          </Text>
          <Text style={styles.statRotulo}>Última visita</Text>
        </View>
      </View>

      {/* Lembrete: ainda não treinou hoje */}
      {ehMesAtual && !treinouHoje && (
        <TouchableOpacity
          style={styles.lembrete}
          activeOpacity={0.8}
          onPress={() => router.push('/aluno/leitor-qr')}
          accessibilityRole="button"
          accessibilityLabel="Você ainda não registrou presença hoje. Registrar presença."
        >
          <QrCode color={CORES.destaque} size={22} />
          <Text style={styles.lembreteTexto}>Você ainda não registrou presença hoje.</Text>
          <Text style={styles.lembreteAcao}>Registrar</Text>
        </TouchableOpacity>
      )}

      {/* Calendário */}
      <View style={styles.secaoLinha}>
        <Text style={styles.secaoTitulo}>Calendário</Text>
      </View>

      <View style={styles.calendarioCard}>
        <View style={styles.calendarioSemana}>
          {SEMANA_INICIAL.map((letra, i) => (
            <Text key={i} style={styles.calendarioSemanaTexto}>
              {letra}
            </Text>
          ))}
        </View>

        <View style={styles.calendarioGrade}>
          {Array.from({ length: deslocamentoInicial }).map((_, i) => (
            <View key={`vazio-${i}`} style={styles.diaCelula} />
          ))}

          {Array.from({ length: totalDias }).map((_, i) => {
            const dia = i + 1;
            const chave = `${prefixo}-${dois(dia)}`;
            const presente = diasComPresenca.has(chave);
            const ehHoje = chave === chaveHoje;
            const futuro = chave > chaveHoje;

            return (
              <View
                key={chave}
                style={styles.diaCelula}
                accessible
                accessibilityLabel={`${dia} de ${nomeMes}${presente ? ', treinou' : ''}${ehHoje ? ', hoje' : ''}`}
              >
                <View
                  style={[
                    styles.diaBolha,
                    presente && styles.diaBolhaPresente,
                    ehHoje && styles.diaBolhaHoje,
                  ]}
                >
                  <Text
                    style={[
                      styles.diaTexto,
                      presente && styles.diaTextoPresente,
                      futuro && styles.diaTextoFuturo,
                    ]}
                  >
                    {dia}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.legenda}>
          <View style={styles.legendaItem}>
            <View style={[styles.legendaPonto, styles.legendaPontoPresente]} />
            <Text style={styles.legendaTexto}>Treinou</Text>
          </View>
          <View style={styles.legendaItem}>
            <View style={[styles.legendaPonto, styles.legendaPontoHoje]} />
            <Text style={styles.legendaTexto}>Hoje</Text>
          </View>
        </View>
      </View>

      {/* Histórico */}
      <View style={styles.secaoLinha}>
        <Text style={styles.secaoTitulo}>Histórico</Text>
        <Text style={styles.secaoContagem}>
          {doMes.length} {doMes.length === 1 ? 'registro' : 'registros'}
        </Text>
      </View>

      {doMes.length === 0 ? (
        <View style={styles.vazioCard}>
          <View style={styles.vazioIcone}>
            <CalendarCheck color={CORES.textoMuted} size={26} />
          </View>
          <Text style={styles.vazioTitulo}>
            {ehMesAtual ? 'Nenhum treino neste mês ainda' : 'Nenhuma presença neste mês'}
          </Text>
          <Text style={styles.vazioTexto}>
            {ehMesAtual
              ? 'Leia o QR Code na recepção para registrar sua primeira presença.'
              : 'Não há registros de presença para o período selecionado.'}
          </Text>
          {ehMesAtual && (
            <TouchableOpacity
              style={[styles.botaoPrimario, { alignSelf: 'stretch' }]}
              onPress={() => router.push('/aluno/leitor-qr')}
              accessibilityRole="button"
            >
              <QrCode color={CORES.texto} size={18} />
              <Text style={styles.botaoPrimarioTexto}>REGISTRAR PRESENÇA</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        doMes.map((p, i) => {
          const chave = p.data.slice(0, 10);
          const { ano, mes, dia } = partesDe(chave);
          const diaSemana = new Date(ano, mes, dia).getDay();

          return (
            <View key={`${p.id ?? chave}-${i}`} style={styles.item}>
              <View style={styles.itemData}>
                <Text style={styles.itemDataSemana}>{SEMANA_CURTA[diaSemana]}</Text>
                <Text style={styles.itemDataDia}>{dois(dia)}</Text>
              </View>

              <View style={styles.itemCorpo}>
                <Text style={styles.itemTitulo}>
                  {SEMANA_LONGA[diaSemana]}, {dois(dia)}/{dois(mes + 1)}
                </Text>
                <View style={styles.itemHoraLinha}>
                  <Clock color={CORES.textoSecundario} size={13} />
                  <Text style={styles.itemHora}>
                    {p.horaEntrada
                      ? `Entrada às ${formatarHora(p.horaEntrada ?? undefined)}`
                      : 'Presença registrada'}
                  </Text>
                </View>
              </View>

              {chave === chaveHoje && (
                <View style={styles.badgeHoje}>
                  <Text style={styles.badgeHojeTexto}>Hoje</Text>
                </View>
              )}
            </View>
          );
        })
      )}

      <TouchableOpacity
        style={styles.botaoSecundario}
        onPress={() => router.replace('/aluno/inicio')}
        accessibilityRole="button"
      >
        <Text style={styles.botaoSecundarioTexto}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}