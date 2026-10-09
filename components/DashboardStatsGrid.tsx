import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTema } from '@/hooks/use-tema';
import { CARD_COLORS_CLARO, CARD_COLORS_ESCURO, criarStatsGridStyles } from '@/styles/statsGridStyles';

type StatCardConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value: string;
  subtitle: string;
};

// Espelha 1:1 o que GET /api/dashboard devolve (DashboardController.java)
export type DashboardIndicadores = {
  totalAlunos: number;
  alunosAtivos: number;
  alunosInadimplentes: number;
  mensalidadesPendentes: number;
  mensalidadesAVencer: number;
  aReceber: number;
  receitaMes: number;
  despesaMes: number;
  saldoMes: number;
  despesasFixasMes: number;
  despesasVariaveisMes: number;
  equipamentosManutencao: number;
  chamadosAbertos: number;
  chamadosAndamento: number;
  manutencoesPendentes: number;
  frequenciaHoje: number;
  frequenciaDiaria: number;
  frequenciaMensal: number;
};

function formatarMoeda(valor: number) {
  return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Grid({ cards }: { cards: StatCardConfig[] }) {
  const { cores } = useTema();
  const styles = useMemo(() => criarStatsGridStyles(cores), [cores]);
  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <View key={card.label} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: card.color }]}>
            <Ionicons name={card.icon} size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.label}>{card.label}</Text>
          <Text style={styles.value}>{card.value}</Text>
          <Text style={styles.subtitle}>{card.subtitle}</Text>
        </View>
      ))}
    </View>
  );
}

export function DashboardStatsGrid({ data }: { data: DashboardIndicadores }) {
  const { cores, tema } = useTema();
  const styles = useMemo(() => criarStatsGridStyles(cores), [cores]);
  const CARD_COLORS = tema === 'dark' ? CARD_COLORS_ESCURO : CARD_COLORS_CLARO;
  const alunosCards: StatCardConfig[] = [
    {
      icon: 'people',
      color: CARD_COLORS.blue,
      label: 'Total de alunos',
      value: String(data.totalAlunos),
      subtitle: 'Cadastrados no total',
    },
    {
      icon: 'checkmark-circle',
      color: CARD_COLORS.green,
      label: 'Alunos ativos',
      value: String(data.alunosAtivos),
      subtitle: 'Matrículas ativas',
    },
    {
      icon: 'alert-circle',
      color: CARD_COLORS.red,
      label: 'Inadimplentes',
      value: String(data.alunosInadimplentes),
      subtitle: 'Mensalidade vencida',
    },
  ];

  const financeiroCards: StatCardConfig[] = [
    {
      icon: 'card',
      color: CARD_COLORS.yellow,
      label: 'Pendências',
      value: String(data.mensalidadesPendentes),
      subtitle: 'Mensalidades em aberto',
    },
    {
      icon: 'time',
      color: CARD_COLORS.orange,
      label: 'A vencer (7 dias)',
      value: String(data.mensalidadesAVencer),
      subtitle: 'Mensalidades próximas',
    },
    {
      icon: 'cash',
      color: CARD_COLORS.orange,
      label: 'A receber',
      value: formatarMoeda(data.aReceber),
      subtitle: 'Total pendente',
    },
    {
      icon: 'trending-up',
      color: CARD_COLORS.green,
      label: 'Receita do mês',
      value: formatarMoeda(data.receitaMes),
      subtitle: 'Pagamentos recebidos',
    },
    {
      icon: 'trending-down',
      color: CARD_COLORS.red,
      label: 'Despesa do mês',
      value: formatarMoeda(data.despesaMes),
      subtitle: 'Fixas + variáveis',
    },
    {
      icon: 'wallet',
      color: CARD_COLORS.teal,
      label: 'Saldo do mês',
      value: formatarMoeda(data.saldoMes),
      subtitle: 'Receita - despesa',
    },
    {
      icon: 'lock-closed',
      color: CARD_COLORS.gray,
      label: 'Despesas fixas',
      value: formatarMoeda(data.despesasFixasMes),
      subtitle: 'No mês atual',
    },
    {
      icon: 'repeat',
      color: CARD_COLORS.pink,
      label: 'Despesas variáveis',
      value: formatarMoeda(data.despesasVariaveisMes),
      subtitle: 'No mês atual',
    },
  ];

  const manutencaoCards: StatCardConfig[] = [
    {
      icon: 'construct',
      color: CARD_COLORS.orange,
      label: 'Em manutenção',
      value: String(data.equipamentosManutencao),
      subtitle: 'Equipamentos parados',
    },
    {
      icon: 'alert',
      color: CARD_COLORS.red,
      label: 'Chamados abertos',
      value: String(data.chamadosAbertos),
      subtitle: 'Aguardando início',
    },
    {
      icon: 'hammer',
      color: CARD_COLORS.yellow,
      label: 'Em andamento',
      value: String(data.chamadosAndamento),
      subtitle: 'Sendo atendidos',
    },
    {
      icon: 'build',
      color: CARD_COLORS.purple,
      label: 'Manutenções pendentes',
      value: String(data.manutencoesPendentes),
      subtitle: 'Chamados + preventivas',
    },
  ];

  const frequenciaCards: StatCardConfig[] = [
    {
      icon: 'today',
      color: CARD_COLORS.blue,
      label: 'Frequência hoje',
      value: `${data.frequenciaHoje}%`,
      subtitle: 'Presença do dia',
    },
    {
      icon: 'calendar',
      color: CARD_COLORS.teal,
      label: 'Check-ins hoje',
      value: String(data.frequenciaDiaria),
      subtitle: 'Alunos que vieram hoje',
    },
    {
      icon: 'calendar-outline',
      color: CARD_COLORS.purple,
      label: 'Frequência no mês',
      value: String(data.frequenciaMensal),
      subtitle: 'Check-ins no mês',
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.groupBlock}>
        <Text style={styles.groupTitle}>Alunos</Text>
        <Grid cards={alunosCards} />
      </View>

      <View style={styles.groupBlock}>
        <Text style={styles.groupTitle}>Financeiro</Text>
        <Grid cards={financeiroCards} />
      </View>

      <View style={styles.groupBlock}>
        <Text style={styles.groupTitle}>Manutenção</Text>
        <Grid cards={manutencaoCards} />
      </View>

      <View style={styles.groupBlock}>
        <Text style={styles.groupTitle}>Frequência</Text>
        <Grid cards={frequenciaCards} />
      </View>
    </View>
  );
}