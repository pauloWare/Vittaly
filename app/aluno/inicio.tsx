import { useFocusEffect, useRouter, type Href } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  ArrowUpRight,
  CalendarCheck,
  ChevronRight,
  DollarSign,
  LogOut,
  QrCode,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { buscarPerfil } from "@/utils/perfil";

import { useSessaoAluno } from "@/hooks/use-sessao-aluno";
import { useTema } from "@/hooks/use-tema";
import { criarInicioStyles } from "@/styles/inicioStyles";
import { limparSessao } from "@/utils/sessao";

type Atalho = {
  titulo: string;
  descricao: string;
  rota: Href;
  icone: LucideIcon;
};

const ROTA_PERFIL: Href = "/aluno/Perfil"; // o arquivo se chama Perfil.tsx (maiúsculo)

// Ação principal
const ACAO_PRESENCA: Atalho = {
  titulo: "Registrar presença",
  descricao: "Leia o QR Code e confirme sua entrada",
  rota: "/aluno/leitor-qr",
  icone: QrCode,
};

// Blocos da grade (2 por linha; para um terceiro basta adicionar aqui)
const ATALHOS: Atalho[] = [
  {
    titulo: "Minha frequência",
    descricao: "Histórico e percentual do mês",
    rota: "/aluno/frequencia",
    icone: CalendarCheck,
  },
  {
    titulo: "Mensalidades",
    descricao: "Pagamentos e vencimentos",
    rota: "/aluno/mensalidades",
    icone: DollarSign,
  },
];

/** "Rafael Souza Lima" → "RL" */
function iniciais(nome?: string | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/** O backend já pode mandar "Plano Anual"; só acrescenta o prefixo se faltar. */
function rotuloPlano(plano?: string | null): string | null {
  const texto = (plano ?? "").trim();
  if (!texto) return null;
  return /^plano\b/i.test(texto) ? texto : `Plano ${texto}`;
}

export default function InicioAlunoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarInicioStyles(CORES), [CORES]);
  const { aluno, carregando } = useSessaoAluno();
  const [saindo, setSaindo] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);

  const sair = useCallback(async () => {
    setSaindo(true);
    try {
      await limparSessao();
      router.replace("/");
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível encerrar a sessão. Tente novamente.",
      );
    } finally {
      setSaindo(false);
    }
  }, [router]);

  const confirmarSair = useCallback(() => {
    Alert.alert("Encerrar sessão", "Tem certeza de que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          void sair();
        },
      },
    ]);
  }, [sair]);

   useFocusEffect(
    useCallback(() => {
      let ativo = true;
      buscarPerfil()
        .then((perfil) => {
          if (ativo) setFoto(perfil.fotoPerfilBase64 ?? null);
        })
        .catch(() => {
          // Sem foto ou sem conexão: o avatar continua mostrando as iniciais.
        });
      return () => {
        ativo = false;
      };
    }, []),
  );

  if (carregando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }
  
  const IconePresenca = ACAO_PRESENCA.icone;
  const primeiroNome = aluno?.nome?.trim().split(" ")[0];
  const plano = rotuloPlano(aluno?.plano);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Barra superior */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>
            VITALLY<Text style={styles.brandAccent}>EXERCISE</Text>
          </Text>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={confirmarSair}
            disabled={saindo}
            accessibilityRole="button"
            accessibilityLabel="Encerrar sessão"
          >
            {saindo ? (
              <ActivityIndicator size="small" color={CORES.textoSecundario} />
            ) : (
              <LogOut color={CORES.textoSecundario} size={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* Saudação + avatar */}
        <View style={styles.saudacaoLinha}>
          <View style={styles.saudacaoTextos}>
            <Text style={styles.saudacaoCaption}>Bem-vindo de volta</Text>
            <Text style={styles.saudacaoNome} numberOfLines={1}>
              {primeiroNome ? `Olá, ${primeiroNome}` : "Portal do Aluno"}
            </Text>

            {!!plano && (
              <View style={styles.planoPill}>
                <Text style={styles.planoPillTexto}>{plano}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
  style={styles.avatar}
  activeOpacity={0.8}
  onPress={() => router.push(ROTA_PERFIL)}
  accessibilityRole="button"
  accessibilityLabel="Abrir meu perfil"
>
  {foto ? (
    <Image
      source={{ uri: foto }}
      style={styles.avatarImagem}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <Text style={styles.avatarTexto}>{iniciais(aluno?.nome)}</Text>
  )}
</TouchableOpacity>
        </View>

        {/* Card principal: registrar presença */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.heroCard}
          onPress={() => router.push(ACAO_PRESENCA.rota)}
          accessibilityRole="button"
          accessibilityLabel={`${ACAO_PRESENCA.titulo}. ${ACAO_PRESENCA.descricao}`}
        >
          <View style={styles.heroIcone}>
            <IconePresenca color={CORES.texto} size={28} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitulo}>{ACAO_PRESENCA.titulo}</Text>
            <Text style={styles.heroSubtitulo}>{ACAO_PRESENCA.descricao}</Text>
          </View>

          <ChevronRight color={CORES.texto} size={22} />
        </TouchableOpacity>

        {/* Grade de atalhos */}
        <Text style={styles.secaoTitulo}>Serviços e Consultas</Text>

        <View style={styles.grade}>
          {ATALHOS.map((atalho) => {
            const Icone = atalho.icone;

            return (
              <TouchableOpacity
                key={atalho.titulo}
                style={styles.tile}
                activeOpacity={0.75}
                onPress={() => router.push(atalho.rota)}
                accessibilityRole="button"
                accessibilityLabel={`${atalho.titulo}. ${atalho.descricao}`}
              >
                <View style={styles.tileTopo}>
                  <View style={styles.tileIcone}>
                    <Icone color={CORES.destaque} size={24} />
                  </View>
                  <ArrowUpRight color={CORES.textoMuted} size={18} />
                </View>

                <View>
                  <Text style={styles.tileTitulo}>{atalho.titulo}</Text>
                  <Text style={styles.tileDescricao}>{atalho.descricao}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
