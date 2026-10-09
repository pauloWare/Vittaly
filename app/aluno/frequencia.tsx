import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSessaoAluno } from '@/hooks/use-sessao-aluno';
import { criarFrequenciaStyles } from '@/styles/frequenciaStyles';
import { useTema } from '@/hooks/use-tema';
import { ApiError, apiFetch } from '@/utils/api';
import { formatarData, formatarHora } from '@/utils/portal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react-native';

type Registro = { id: number; data: string; horaEntrada: string | null };

type ResumoFrequencia = {
  presencasMes: number;
  diasConsiderados: number;
  percentual: number | null;
  totalPresencas: number;
  ultimaPresenca: Registro | null;
  historico: Registro[];
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function FrequenciaAlunoScreen() {
  const router = useRouter();
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarFrequenciaStyles(CORES), [CORES]);
  const { aluno, carregando } = useSessaoAluno();
  const [resumo, setResumo] = useState<ResumoFrequencia | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  // Controle de Mês/Ano selecionado para o Calendário
  const [dataSelecionada, setDataSelecionada] = useState(new Date());

  const carregar = useCallback(async (silencioso = false) => {
    if (silencioso) setAtualizando(true);
    else setCarregandoDados(true);
    setErro(null);
    try {
      const data = await apiFetch<ResumoFrequencia>('/portal/frequencia');
      setResumo(data);
    } catch (e) {
      if (e instanceof ApiError) setErro(e.message);
      else setErro('Erro inesperado ao carregar sua frequência.');
    } finally {
      setCarregandoDados(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const navegarMes = (direcao: -1 | 1) => {
    setDataSelecionada((prev) => {
      const novaData = new Date(prev);
      novaData.setMonth(prev.getMonth() + direcao);
      return novaData;
    });
  };

  // Configuração do gesto de deslizar (Swipe) no calendário
  const panResponder = useMemo(
  () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;

        if (Math.abs(dx) > 40 && Math.abs(dy) < 50) {
          if (dx > 0) {
            navegarMes(-1);
          } else {
            navegarMes(1);
          }
        }
      },
    }),
  []
);

  // Mapeia histórico em um Set de datas no formato YYYY-MM-DD
  const datasPresentes = useMemo(() => {
    const set = new Set<string>();
    if (resumo?.historico) {
      resumo.historico.forEach((reg) => {
        const dataFormatada = reg.data.split('T')[0];
        set.add(dataFormatada);
      });
    }
    return set;
  }, [resumo]);

  // Monta a grade de dias do calendário para o mês ativo
  const gradeCalendario = useMemo(() => {
    const ano = dataSelecionada.getFullYear();
    const mes = dataSelecionada.getMonth();

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const diaSemanaInicio = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dias = [];

    // Espaços vazios antes do início do mês
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ id: `vazio-inicio-${i}`, vazio: true });
    }

    // Dias do mês
    for (let dia = 1; dia <= totalDias; dia++) {
      const mesStr = String(mes + 1).padStart(2, '0');
      const diaStr = String(dia).padStart(2, '0');
      const isoData = `${ano}-${mesStr}-${diaStr}`;

      const dataAtual = new Date(ano, mes, dia);
      dataAtual.setHours(0, 0, 0, 0);

      const ehFuturo = dataAtual.getTime() > hoje.getTime();
      const ehHoje = dataAtual.getTime() === hoje.getTime();
      const ehPassado = dataAtual.getTime() < hoje.getTime();
      const presente = datasPresentes.has(isoData);
      
      // Regra de falta: Dia passado sem presença registrada
      const ehFalta = ehPassado && !presente;

      dias.push({
        id: isoData,
        diaNumber: dia,
        vazio: false,
        presente,
        ehHoje,
        ehFuturo,
        ehFalta,
      });
    }

    return dias;
  }, [dataSelecionada, datasPresentes]);

  if (carregando && carregandoDados && !resumo) {
    return (
      <View style={[criarFrequenciaStyles(CORES).container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }

  const percentualExibicao = resumo?.percentual ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => void carregar(true)}
          tintColor={CORES.indicador}
          colors={[CORES.indicador]}
        />
      }
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha frequência</Text>
        <Text style={styles.headerSubtitle}>
          {aluno ? `${aluno.nome} — ` : ''}Acompanhe sua constância
        </Text>
      </View>

      {erro ? (
        <View style={styles.bannerErro}>
          <Text style={styles.bannerErroTexto}>{erro}</Text>
          <TouchableOpacity style={styles.botaoSecundario} onPress={() => void carregar()}>
            <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!erro && resumo && (
        <>
          {/* Card de Frequência e Barra de Progresso */}
          <View style={styles.resumoCard}>
            <Text style={styles.resumoRotulo}>FREQUÊNCIA NO MÊS</Text>
            <View style={styles.percentualLinha}>
              <Text style={styles.percentualValor}>{percentualExibicao}</Text>
              <Text style={styles.percentualSimbolo}>%</Text>
            </View>
            <Text style={styles.resumoLegenda}>
              {resumo.diasConsiderados} dia(s) útil(eis) considerado(s) até hoje
            </Text>

            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(100, Math.max(0, percentualExibicao))}%` }
                ]} 
              />
            </View>
          </View>

          {/* Indicadores de Totais */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValor}>{resumo.presencasMes}</Text>
              <Text style={styles.statRotulo}>Presenças no mês</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValor}>{resumo.totalPresencas}</Text>
              <Text style={styles.statRotulo}>Total histórico</Text>
            </View>
          </View>

          {/* Seção do Calendário */}
          <View style={styles.secaoLinha}>
            <Text style={styles.secaoTitulo}>Calendário de treino</Text>
          </View>

          {/* Card do Calendário com detecção de Swipe */}
          <View style={styles.calendarioCard} {...panResponder.panHandlers}>
            {/* Navegação entre Meses */}
            <View style={styles.mesNav}>
              <TouchableOpacity style={styles.mesBotao} onPress={() => navegarMes(-1)}>
                <ChevronLeft size={20} color={CORES.texto} />
              </TouchableOpacity>

              <Text style={styles.mesTitulo}>
                {NOMES_MESES[dataSelecionada.getMonth()]} {dataSelecionada.getFullYear()}
              </Text>

              <TouchableOpacity style={styles.mesBotao} onPress={() => navegarMes(1)}>
                <ChevronRight size={20} color={CORES.texto} />
              </TouchableOpacity>
            </View>

            {/* Cabeçalho dos Dias da Semana */}
            <View style={styles.calendarioSemana}>
              {DIAS_SEMANA.map((dia) => (
                <Text key={dia} style={styles.calendarioSemanaTexto}>{dia}</Text>
              ))}
            </View>

            {/* Grade dos Dias */}
            <View style={styles.calendarioGrade}>
              {gradeCalendario.map((item) => {
                if (item.vazio) {
                  return <View key={item.id} style={styles.diaCelula} />;
                }

                return (
                  <View key={item.id} style={styles.diaCelula}>
                    <View
                      style={[
                        styles.diaBolha,
                        item.presente && styles.diaBolhaPresente,
                        item.ehFalta && styles.diaBolhaFalta,
                        item.ehHoje && styles.diaBolhaHoje,
                      ]}
                    >
                      <Text
                        style={[
                          styles.diaTexto,
                          item.presente && styles.diaTextoPresente,
                          item.ehFalta && styles.diaTextoFalta,
                          item.ehFuturo && styles.diaTextoFuturo,
                        ]}
                      >
                        {item.diaNumber}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Legenda do Calendário */}
            <View style={styles.legenda}>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaPonto, styles.legendaPontoPresente]} />
                <Text style={styles.legendaTexto}>Treinado</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaPonto, styles.legendaPontoFalta]} />
                <Text style={styles.legendaTexto}>Falta</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaPonto, styles.legendaPontoHoje]} />
                <Text style={styles.legendaTexto}>Hoje</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Botão Voltar */}
      <TouchableOpacity 
        style={styles.botaoSecundario} 
        onPress={() => router.replace('/aluno/inicio')}
      >
        <Text style={styles.botaoSecundarioTexto}>Voltar ao Início</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}