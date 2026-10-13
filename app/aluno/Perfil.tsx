import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Siren,
  ShieldCheck,
  TriangleAlert,
  User,
  X,
} from "lucide-react-native";
import { useMemo, useCallback, useEffect, useRef, useState, type Ref } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSessaoAluno } from "@/hooks/use-sessao-aluno";
import { SeletorTema } from "@/components/seletor-tema";
import { useTema } from "@/hooks/use-tema";
import { criarPerfilStyles } from "@/styles/perfilStyles";
import { ApiError } from "@/utils/api";
import {
  mascaraCep,
  mascaraTelefone,
  validarDadosPerfil,
  type ErrosEdicaoPerfil,
} from "@/utils/edicaoPerfil";
import {
  buscarPerfil,
  salvarFoto,
  salvarPerfil,
  validarFoto,
  type PerfilAluno,
} from "@/utils/perfil";
import {
  ROTULO_SITUACAO_FINANCEIRA,
  formatarData,
  type SituacaoFinanceira,
} from "@/utils/portal";
import {
  buscarResumoAluno,
  descreverUltimaVisita,
  type ResumoAluno,
} from "@/utils/resumoAluno";
import { limparSessao } from "@/utils/sessao";

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

function formatarTelefone(telefone: string): string {
  const d = telefone.replace(/\D/g, "");
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return telefone;
}

/** Idade a partir de 'YYYY-MM-DD'; null quando a data não é válida. */
function calcularIdade(nascimento?: string | null): number | null {
  if (!nascimento || nascimento.length < 10) return null;
  const [ano, mes, dia] = nascimento.slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const jaFez =
    hoje.getMonth() + 1 > mes ||
    (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia);
  if (!jaFez) idade -= 1;
  return idade >= 0 && idade < 120 ? idade : null;
}

/** Campos que o backend reconhece em `{ "campo": "..." }` vindo do PUT do perfil. */
const CAMPOS_ERRO_API: readonly (keyof ErrosEdicaoPerfil)[] = [
  "email",
  "telefone",
  "cep",
  "logradouro",
  "numero",
  "complemento",
  "bairro",
  "contatoEmergenciaNome",
  "contatoEmergenciaTelefone",
];

const COR_SITUACAO_CLARO: Record<SituacaoFinanceira, string> = {
  EM_DIA: '#047857',
  ATRASADA: '#991B1B',
  SEM_MENSALIDADE: '#64748B',
};

const COR_SITUACAO_ESCURO: Record<SituacaoFinanceira, string> = {
  EM_DIA: '#4CD964',
  ATRASADA: '#FF5555',
  SEM_MENSALIDADE: '#A9A9B6',
};

type Pendencia = {
  chave: "foto" | "telefone" | "email";
  rotulo: string;
  icone: LucideIcon;
};

// ─── Componentes de apresentação (sem lógica de negócio) ────────────────────

/** Indicador do resumo; ao tocar, abre a tela correspondente. */
function ResumoItem({
  valor,
  rotulo,
  cor,
  onPress,
}: {
  valor: string;
  rotulo: string;
  cor?: string;
  onPress: () => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => criarPerfilStyles(cores), [cores]);
  return (
    <TouchableOpacity
      style={styles.resumoItem}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${rotulo}: ${valor}`}
    >
      <Text
        style={[styles.resumoValor, cor ? { color: cor } : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {valor}
      </Text>
      <Text style={styles.resumoRotulo}>{rotulo}</Text>
    </TouchableOpacity>
  );
}

/** Bloco de dado: rótulo e valor juntos; cadeado quando é somente leitura. */
function Dado({
  icone: Icone,
  rotulo,
  valor,
  sub,
  vazio,
  bloqueado,
  larga,
}: {
  icone: LucideIcon;
  rotulo: string;
  valor: string;
  sub?: string;
  vazio?: boolean;
  bloqueado?: boolean;
  larga?: boolean;
}) {
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarPerfilStyles(CORES), [CORES]);
  return (
    <View
      style={[styles.tile, larga && styles.tileLarga]}
      accessible
      accessibilityLabel={`${rotulo}: ${valor}${sub ? `, ${sub}` : ""}${
        bloqueado ? ", somente leitura" : ""
      }`}
    >
      <View style={styles.tileTopo}>
        <Icone color={CORES.destaque} size={14} />
        <Text style={styles.tileRotulo}>{rotulo}</Text>
        {bloqueado && (
          <View style={styles.tileCadeado}>
            <Lock color={CORES.textoMuted} size={12} />
          </View>
        )}
      </View>
      <Text
        style={[styles.tileValor, vazio && styles.tileVazio]}
        numberOfLines={1}
      >
        {valor}
      </Text>
      {!!sub && <Text style={styles.tileSub}>{sub}</Text>}
    </View>
  );
}

/** Campo de edição: rótulo, ícone, estado de foco, erro e texto de ajuda. */
function CampoTexto({
  icone: Icone,
  rotulo,
  valor,
  onChangeText,
  placeholder,
  erro,
  ajuda,
  focado,
  onFocus,
  onBlur,
  inputRef,
  onSubmitEditing,
  returnKeyType,
  keyboardType,
  autoCapitalize,
  autoComplete,
}: {
  icone: LucideIcon;
  rotulo: string;
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
  erro?: string;
  ajuda?: string;
  focado: boolean;
  onFocus: () => void;
  onBlur: () => void;
  inputRef?: Ref<TextInput>;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps["returnKeyType"];
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
}) {
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarPerfilStyles(CORES), [CORES]);
  return (
    <View>
      <Text style={styles.campoRotulo}>{rotulo}</Text>
      <View
        style={[
          styles.campoCaixa,
          focado && styles.campoCaixaFocada,
          !!erro && styles.campoCaixaErro,
        ]}
      >
        <Icone
          color={
            erro
              ? CORES.perigoTexto
              : focado
                ? CORES.destaque
                : CORES.textoMuted
          }
          size={18}
        />
        <TextInput
          ref={inputRef}
          style={styles.campoInput}
          value={valor}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={CORES.textoMuted}
          selectionColor={CORES.destaque}
          cursorColor={CORES.destaque}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          accessibilityLabel={rotulo}
        />
      </View>
      {erro ? (
        <Text style={styles.campoErro}>{erro}</Text>
      ) : ajuda ? (
        <Text style={styles.campoAjuda}>{ajuda}</Text>
      ) : null}
    </View>
  );
}

/**
 * Página de PERFIL do aluno.
 *
 * Os dados vêm da API (GET /api/portal/perfil). O aluno edita diretamente
 * SOMENTE contato, endereço e contato de emergência (PUT /api/portal/perfil) e
 * envia a foto em Base64 (PUT /api/portal/perfil/foto). Nome, CPF, data de
 * nascimento e sexo são protegidos: exibidos com cadeado e correção pela
 * recepção — nem existem no DTO de edição do backend. Plano e situação
 * continuam informativos, geridos pela academia. Quem autoriza cada operação é
 * o backend, que identifica o aluno pelo token — nunca por um id enviado aqui.
 *
 * O resumo (treinos, última visita, mensalidade) é só informativo: vem de
 * `buscarResumoAluno` e, se falhar, mostra "—" sem afetar o resto da tela.
 */
export default function PerfilAlunoScreen() {
  const router = useRouter();
  const { cores: CORES, tema } = useTema();
  const styles = useMemo(() => criarPerfilStyles(CORES), [CORES]);
  const COR_SITUACAO = tema === 'dark' ? COR_SITUACAO_ESCURO : COR_SITUACAO_CLARO;
  const insets = useSafeAreaInsets();
  const { carregando: sessaoCarregando } = useSessaoAluno();

  const [perfil, setPerfil] = useState<PerfilAluno | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState("");
  const [contatoEmergenciaTelefone, setContatoEmergenciaTelefone] = useState("");
  const [erros, setErros] = useState<ErrosEdicaoPerfil>({});
  const [aviso, setAviso] = useState<{
    tipo: "ok" | "erro";
    texto: string;
  } | null>(null);
  /** Prévia da foto escolhida, ainda não enviada (cancelável). */
  const [fotoPrevia, setFotoPrevia] = useState<string | null>(null);

  // Resumo informativo (null enquanto carrega ou se falhar).
  const [resumo, setResumo] = useState<ResumoAluno | null>(null);

  // Campo com foco (só visual) e refs para navegar pelo teclado.
  const [focado, setFocado] = useState<
    | "email"
    | "telefone"
    | "cep"
    | "logradouro"
    | "numero"
    | "complemento"
    | "bairro"
    | "contatoEmergenciaNome"
    | "contatoEmergenciaTelefone"
    | null
  >(null);
  const telefoneRef = useRef<TextInput>(null);
  const cepRef = useRef<TextInput>(null);
  const logradouroRef = useRef<TextInput>(null);
  const numeroRef = useRef<TextInput>(null);
  const complementoRef = useRef<TextInput>(null);
  const bairroRef = useRef<TextInput>(null);
  const contatoNomeRef = useRef<TextInput>(null);
  const contatoTelefoneRef = useRef<TextInput>(null);

  /** Erros 401 já limpam a sessão e avisam as telas via cliente HTTP. */
  function tratarErro(e: unknown, padrao: string): string {
    if (e instanceof ApiError) {
      if (e.status === 401) return "";
      return e.message || padrao;
    }
    return padrao;
  }

  /**
   * Preenche os campos de edição com os dados do servidor.
   * Chamado ao carregar, ao iniciar/cancelar edição e após salvar — central
   * num só lugar para os estados nunca divergirem do perfil exibido.
   */
  const preencherCampos = useCallback((dados: PerfilAluno) => {
    setEmail(dados.email ?? "");
    setTelefone(mascaraTelefone(dados.telefone ?? ""));
    setCep(mascaraCep(dados.cep ?? ""));
    setLogradouro(dados.logradouro ?? "");
    setNumero(dados.numero ?? "");
    setComplemento(dados.complemento ?? "");
    setBairro(dados.bairro ?? "");
    setContatoEmergenciaNome(dados.contatoEmergenciaNome ?? "");
    setContatoEmergenciaTelefone(
      mascaraTelefone(dados.contatoEmergenciaTelefone ?? ""),
    );
  }, []);

  /**
   * Carrega o perfil e já preenche os campos de edição com os dados atuais.
   *
   * Não existe efeito sincronizando `perfil` -> campos: os valores são
   * preenchidos aqui (ao carregar) e em `iniciarEdicao`/`cancelarEdicao`, o que
   * evita renders em cascata e mantém a edição previsível.
   */
  const carregar = useCallback(async () => {
    try {
      const dados = await buscarPerfil();
      setPerfil(dados);
      preencherCampos(dados);
      setErroCarregamento(null);
    } catch (e) {
      setErroCarregamento(
        tratarErro(
          e,
          "Não foi possível carregar seu perfil. Verifique a conexão.",
        ),
      );
    } finally {
      setCarregando(false);
    }
  }, [preencherCampos]);

  // Recarrega ao abrir a tela: a foto e os dados vêm sempre do servidor.
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  // Descarta a foto em edição ao sair da tela.
  useFocusEffect(useCallback(() => () => setFotoPrevia(null), []));

  // Atualiza o resumo sempre que a tela ganha foco (ex.: depois de registrar presença).
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      void buscarResumoAluno().then((r) => {
        if (ativo) setResumo(r);
      });
      return () => {
        ativo = false;
      };
    }, []),
  );

  // O aviso some sozinho (sucesso 4s, erro 6s) ou ao tocar nele.
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(
      () => setAviso(null),
      aviso.tipo === "ok" ? 4000 : 6000,
    );
    return () => clearTimeout(t);
  }, [aviso]);

  /** Entra no modo de edição preenchendo os campos com os dados atuais. */
  const iniciarEdicao = useCallback(() => {
    if (!perfil) return;
    preencherCampos(perfil);
    setErros({});
    setAviso(null);
    setEditando(true);
  }, [perfil, preencherCampos]);

  /** Cancela a edição: nada é enviado e os campos voltam aos dados salvos. */
  const cancelarEdicao = useCallback(() => {
    if (perfil) preencherCampos(perfil);
    setErros({});
    setAviso(null);
    setEditando(false);
  }, [perfil, preencherCampos]);

  /** Salva os campos editáveis e (se houver) a foto escolhida. */
  const salvar = useCallback(async () => {
    const problemas = validarDadosPerfil({
      email,
      telefone,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      contatoEmergenciaNome,
      contatoEmergenciaTelefone,
    });
    setErros(problemas);
    if (Object.keys(problemas).length > 0) {
      setAviso({ tipo: "erro", texto: "Revise os campos destacados." });
      return;
    }

    setSalvando(true);
    setAviso(null);
    try {
      let atual = await salvarPerfil({
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        contatoEmergenciaNome,
        contatoEmergenciaTelefone,
      });

      // A foto é enviada logo depois dos dados; se falhar, os dados já
      // gravados permanecem e o aluno é avisado do que não deu certo.
      if (fotoPrevia) {
        setEnviandoFoto(true);
        try {
          atual = await salvarFoto(fotoPrevia);
        } finally {
          setEnviandoFoto(false);
        }
      }

      setPerfil(atual);
      preencherCampos(atual);
      setFotoPrevia(null);
      setEditando(false);
      setAviso({ tipo: "ok", texto: "Perfil atualizado com sucesso." });
    } catch (e) {
      const mensagem = tratarErro(
        e,
        "Não foi possível salvar. Verifique sua conexão e tente novamente.",
      );
      // Erro apontado a um campo específico (ex.: e-mail duplicado, CEP
      // inválido): destaca o campo correspondente e preserva o digitado.
      const campo = e instanceof ApiError ? e.campo : null;
      if (campo && mensagem && CAMPOS_ERRO_API.includes(campo as keyof ErrosEdicaoPerfil)) {
        const chave = campo as keyof ErrosEdicaoPerfil;
        setErros((anteriores) => ({ ...anteriores, [chave]: mensagem }));
        setAviso({ tipo: "erro", texto: "Revise os campos destacados." });
      } else if (mensagem) {
        setAviso({ tipo: "erro", texto: mensagem });
      }
    } finally {
      setSalvando(false);
    }
  }, [
    email,
    telefone,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    contatoEmergenciaNome,
    contatoEmergenciaTelefone,
    fotoPrevia,
    preencherCampos,
  ]);

  /**
   * Seleciona uma imagem da galeria.
   *
   * Pedimos o Base64 direto do seletor (`base64: true`) porque é o que o backend
   * valida e guarda; o `uri` temporário do aparelho NÃO é usado como fonte de
   * verdade e não é enviado. Com `quality` e `allowsEditing`, o próprio seletor
   * reduz o tamanho antes do envio.
   */
  const selecionarFoto = useCallback(async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissao.status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar suas fotos.",
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (resultado.canceled || !resultado.assets?.length) return; // cancelado
    const asset = resultado.assets[0];
    if (!asset.base64) {
      setAviso({
        tipo: "erro",
        texto: "Não foi possível ler a imagem. Escolha outra foto.",
      });
      return;
    }

    const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
    const problema = validarFoto(dataUrl);
    if (problema) {
      setAviso({ tipo: "erro", texto: problema });
      return;
    }

    // Prévia imediata; só vira oficial quando o aluno salvar.
    setFotoPrevia(dataUrl);
    setAviso({
      tipo: "ok",
      texto: "Foto selecionada. Toque em Salvar para confirmar.",
    });
  }, []);

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
    Alert.alert(
      "Encerrar sessão",
      "Tem certeza de que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            void sair();
          },
        },
      ],
    );
  }, [sair]);

  // ─── Estado derivado e ações só de interface ──────────────────────────────
  const alterouCampos =
    !!perfil &&
    editando &&
    (email.trim() !== (perfil.email ?? "").trim() ||
      // Telefone/CEP com ou sem máscara são o mesmo dado: compara só os dígitos.
      mascaraTelefone(telefone) !== mascaraTelefone(perfil.telefone ?? "") ||
      mascaraCep(cep) !== mascaraCep(perfil.cep ?? "") ||
      logradouro.trim() !== (perfil.logradouro ?? "").trim() ||
      numero.trim() !== (perfil.numero ?? "").trim() ||
      complemento.trim() !== (perfil.complemento ?? "").trim() ||
      bairro.trim() !== (perfil.bairro ?? "").trim() ||
      contatoEmergenciaNome.trim() !==
        (perfil.contatoEmergenciaNome ?? "").trim() ||
      mascaraTelefone(contatoEmergenciaTelefone) !==
        mascaraTelefone(perfil.contatoEmergenciaTelefone ?? ""));
  const temAlteracoes = alterouCampos || !!fotoPrevia;
  /** A barra de ações aparece ao editar ou quando há foto escolhida e não salva. */
  const mostrarBarra = editando || !!fotoPrevia;

  /** Descarta tudo o que está pendente (campos e foto). */
  const descartarAlteracoes = useCallback(() => {
    cancelarEdicao();
    setFotoPrevia(null);
  }, [cancelarEdicao]);

  const descartarFoto = useCallback(() => {
    setFotoPrevia(null);
    setAviso({ tipo: "ok", texto: "Seleção de foto descartada." });
  }, []);

  /** Voltar pergunta antes de perder alterações não salvas. */
  const voltar = useCallback(() => {
    if (!temAlteracoes) {
      router.replace("/aluno/inicio");
      return;
    }
    Alert.alert(
      "Descartar alterações?",
      "Você tem alterações não salvas. Se sair agora, elas serão perdidas.",
      [
        { text: "Continuar editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => router.replace("/aluno/inicio"),
        },
      ],
    );
  }, [router, temAlteracoes]);

  if (sessaoCarregando || carregando) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }

  const dados = perfil;
  const nomeExibido = dados?.nome?.trim() || null;
  const plano = rotuloPlano(dados?.plano);
  // Foto em edição (prévia) tem prioridade sobre a foto já salva.
  const fotoExibida = fotoPrevia ?? dados?.fotoPerfilBase64 ?? null;
  const ocupado = salvando || enviandoFoto;
  const idade = calcularIdade(dados?.dataNascimento);
  const versao = Constants.expoConfig?.version;

  // Itens que faltam para o perfil ficar completo (foto, e-mail e telefone).
  const pendencias: Pendencia[] = [];
  if (dados) {
    if (!dados.fotoPerfilBase64)
      pendencias.push({
        chave: "foto",
        rotulo: "Adicionar foto",
        icone: Camera,
      });
    if (!dados.telefone)
      pendencias.push({
        chave: "telefone",
        rotulo: "Adicionar telefone",
        icone: Phone,
      });
    if (!dados.email)
      pendencias.push({
        chave: "email",
        rotulo: "Adicionar e-mail",
        icone: Mail,
      });
  }
  const totalItens = 3;
  const completos = totalItens - pendencias.length;
  const mostrarNudge = !editando && !fotoPrevia && pendencias.length > 0;

  const aoCompletar = (chave: Pendencia["chave"]) => {
    if (chave === "foto") void selecionarFoto();
    else iniciarEdicao();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: mostrarBarra ? 24 : insets.bottom + 24,
          },
        ]}
      >
        {/* Barra superior */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.botaoTopo}
            onPress={voltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <ChevronLeft color={CORES.texto} size={22} />
          </TouchableOpacity>
          <Text style={styles.topBarTitulo}>Meu perfil</Text>
          <View style={styles.topBarEspaco} />
        </View>

        {erroCarregamento && !dados ? (
          <View style={styles.vazioCard}>
            <TriangleAlert color={CORES.perigoTexto} size={24} />
            <Text style={[styles.vazioTitulo, { marginTop: 8 }]}>
              Não foi possível carregar seu perfil
            </Text>
            <Text style={styles.vazioTexto}>{erroCarregamento}</Text>
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => {
                setCarregando(true);
                void carregar();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : !dados ? (
          <View style={styles.vazioCard}>
            <Text style={styles.vazioTitulo}>Dados indisponíveis</Text>
            <Text style={styles.vazioTexto}>
              Não conseguimos carregar o seu cadastro. Tente sair e entrar
              novamente.
            </Text>
          </View>
        ) : (
          <>
            {/* Ficha: identidade + resumo de atividade */}
            <View style={[styles.ficha, editando && styles.fichaEditando]}>
              <View style={styles.fichaTopo}>
                <TouchableOpacity
                  style={styles.avatarWrap}
                  activeOpacity={0.85}
                  onPress={selecionarFoto}
                  disabled={ocupado}
                  accessibilityRole="button"
                  accessibilityLabel="Alterar foto de perfil"
                >
                  {fotoExibida ? (
                    <Image
                      source={{ uri: fotoExibida }}
                      style={styles.avatarImagem}
                    />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTexto}>
                        {iniciais(nomeExibido)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.badgeCamera}>
                    {enviandoFoto ? (
                      <ActivityIndicator size="small" color={CORES.texto} />
                    ) : (
                      <Camera color={CORES.texto} size={13} />
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.fichaInfo}>
                  <Text style={styles.fichaNome} numberOfLines={2}>
                    {nomeExibido ?? "Aluno"}
                  </Text>

                  {!!plano && (
                    <View style={styles.badgePlanoAtivo}>
                      <View style={styles.pontoAtivo} />
                      <Text style={styles.badgePlanoTexto}>{plano}</Text>
                    </View>
                  )}

                  {!!fotoPrevia && (
                    <View style={styles.fotoChip}>
                      <Text style={styles.fotoChipTexto}>
                        Nova foto selecionada
                      </Text>
                      <TouchableOpacity
                        style={styles.fotoChipFechar}
                        onPress={descartarFoto}
                        disabled={ocupado}
                        accessibilityRole="button"
                        accessibilityLabel="Descartar foto selecionada"
                      >
                        <X color={CORES.destaque} size={14} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Resumo: some durante a edição para evitar toques acidentais */}
              {!editando && (
                <View style={styles.resumo}>
                  <ResumoItem
                    valor={
                      resumo?.treinosNoMes != null
                        ? String(resumo.treinosNoMes)
                        : "—"
                    }
                    rotulo="Treinos no mês"
                    onPress={() => router.push("/aluno/frequencia")}
                  />
                  <View style={styles.resumoDivisor} />
                  <ResumoItem
                    valor={
                      resumo ? descreverUltimaVisita(resumo.ultimaVisita) : "—"
                    }
                    rotulo="Última visita"
                    onPress={() => router.push("/aluno/frequencia")}
                  />
                  <View style={styles.resumoDivisor} />
                  <ResumoItem
                    valor={
                      resumo?.situacao
                        ? ROTULO_SITUACAO_FINANCEIRA[resumo.situacao]
                        : "—"
                    }
                    cor={
                      resumo?.situacao
                        ? COR_SITUACAO[resumo.situacao]
                        : undefined
                    }
                    rotulo="Mensalidade"
                    onPress={() => router.push("/aluno/mensalidades")}
                  />
                </View>
              )}
            </View>

            {/* Complete seu perfil: só aparece se faltar algo */}
            {mostrarNudge && (
              <View style={styles.nudgeCard}>
                <View style={styles.nudgeTopo}>
                  <Text style={styles.nudgeTitulo}>Complete seu perfil</Text>
                  <Text style={styles.nudgeContagem}>
                    {completos} de {totalItens}
                  </Text>
                </View>
                <View
                  style={styles.nudgeTrilha}
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: totalItens,
                    now: completos,
                  }}
                >
                  <View
                    style={[
                      styles.nudgeProgresso,
                      { width: `${(completos / totalItens) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.nudgeChips}>
                  {pendencias.map((p) => {
                    const Icone = p.icone;
                    return (
                      <TouchableOpacity
                        key={p.chave}
                        style={styles.nudgeChip}
                        activeOpacity={0.8}
                        onPress={() => aoCompletar(p.chave)}
                        accessibilityRole="button"
                      >
                        <Icone color={CORES.destaque} size={14} />
                        <Text style={styles.nudgeChipTexto}>{p.rotulo}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Dados pessoais: sempre visíveis e somente leitura */}
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Dados pessoais</Text>

              <View style={styles.grade}>
                <Dado
                  larga
                  icone={User}
                  rotulo="Nome completo"
                  valor={dados.nome ?? "Não informado"}
                  vazio={!dados.nome}
                  bloqueado
                />
                {!!dados.cpfMascarado && (
                  <Dado
                    icone={ShieldCheck}
                    rotulo="CPF"
                    valor={dados.cpfMascarado}
                    bloqueado
                  />
                )}
                {!!dados.dataNascimento && (
                  <Dado
                    icone={CalendarDays}
                    rotulo="Nascimento"
                    valor={formatarData(dados.dataNascimento)}
                    sub={idade !== null ? `${idade} anos` : undefined}
                    bloqueado
                  />
                )}
                {!!dados.sexo && (
                  <Dado icone={Lock} rotulo="Sexo" valor={dados.sexo} bloqueado />
                )}
              </View>

              <View style={styles.notaLeitura}>
                <Lock color={CORES.textoMuted} size={14} />
                <Text style={styles.notaLeituraTexto}>
                  Nome, CPF, nascimento e sexo são protegidos. Para corrigir,
                  fale com a recepção da academia.
                </Text>
              </View>
            </View>

            {/* Contato: editável pelo próprio aluno */}
            {editando && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Contato</Text>
                <View style={styles.cardEdicao}>
                  <CampoTexto
                    icone={Mail}
                    rotulo="E-mail"
                    valor={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    erro={erros.email}
                    ajuda="É este e-mail que você usa para entrar no aplicativo."
                    focado={focado === "email"}
                    onFocus={() => setFocado("email")}
                    onBlur={() => setFocado(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => telefoneRef.current?.focus()}
                  />
                  <CampoTexto
                    icone={Phone}
                    rotulo="Telefone"
                    valor={telefone}
                    onChangeText={(texto) => setTelefone(mascaraTelefone(texto))}
                    placeholder="(00) 00000-0000"
                    erro={erros.telefone}
                    focado={focado === "telefone"}
                    onFocus={() => setFocado("telefone")}
                    onBlur={() => setFocado(null)}
                    inputRef={telefoneRef}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    returnKeyType="next"
                    onSubmitEditing={() => cepRef.current?.focus()}
                  />
                </View>
              </View>
            )}

            {/* Endereço: editável pelo próprio aluno */}
            {editando && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Endereço</Text>
                <View style={styles.cardEdicao}>
                  <CampoTexto
                    icone={MapPin}
                    rotulo="CEP"
                    valor={cep}
                    onChangeText={(texto) => setCep(mascaraCep(texto))}
                    placeholder="00000-000"
                    erro={erros.cep}
                    focado={focado === "cep"}
                    onFocus={() => setFocado("cep")}
                    onBlur={() => setFocado(null)}
                    inputRef={cepRef}
                    keyboardType="number-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => logradouroRef.current?.focus()}
                  />
                  <CampoTexto
                    icone={MapPin}
                    rotulo="Rua / avenida"
                    valor={logradouro}
                    onChangeText={setLogradouro}
                    placeholder="Nome da rua"
                    erro={erros.logradouro}
                    focado={focado === "logradouro"}
                    onFocus={() => setFocado("logradouro")}
                    onBlur={() => setFocado(null)}
                    inputRef={logradouroRef}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => numeroRef.current?.focus()}
                  />
                  <CampoTexto
                    icone={MapPin}
                    rotulo="Número"
                    valor={numero}
                    onChangeText={setNumero}
                    placeholder="123"
                    erro={erros.numero}
                    focado={focado === "numero"}
                    onFocus={() => setFocado("numero")}
                    onBlur={() => setFocado(null)}
                    inputRef={numeroRef}
                    returnKeyType="next"
                    onSubmitEditing={() => complementoRef.current?.focus()}
                  />
                  <CampoTexto
                    icone={MapPin}
                    rotulo="Complemento"
                    valor={complemento}
                    onChangeText={setComplemento}
                    placeholder="Apto, bloco... (opcional)"
                    erro={erros.complemento}
                    focado={focado === "complemento"}
                    onFocus={() => setFocado("complemento")}
                    onBlur={() => setFocado(null)}
                    inputRef={complementoRef}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => bairroRef.current?.focus()}
                  />
                  <CampoTexto
                    icone={MapPin}
                    rotulo="Bairro"
                    valor={bairro}
                    onChangeText={setBairro}
                    placeholder="Seu bairro"
                    erro={erros.bairro}
                    focado={focado === "bairro"}
                    onFocus={() => setFocado("bairro")}
                    onBlur={() => setFocado(null)}
                    inputRef={bairroRef}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => contatoNomeRef.current?.focus()}
                  />
                </View>
              </View>
            )}

            {/* Contato de emergência: editável pelo próprio aluno */}
            {editando && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Contato de emergência</Text>
                <View style={styles.cardEdicao}>
                  <CampoTexto
                    icone={Siren}
                    rotulo="Nome do contato"
                    valor={contatoEmergenciaNome}
                    onChangeText={setContatoEmergenciaNome}
                    placeholder="Nome de quem devemos ligar"
                    erro={erros.contatoEmergenciaNome}
                    focado={focado === "contatoEmergenciaNome"}
                    onFocus={() => setFocado("contatoEmergenciaNome")}
                    onBlur={() => setFocado(null)}
                    inputRef={contatoNomeRef}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => contatoTelefoneRef.current?.focus()}
                  />
                  <CampoTexto
                    icone={Phone}
                    rotulo="Telefone do contato"
                    valor={contatoEmergenciaTelefone}
                    onChangeText={(texto) =>
                      setContatoEmergenciaTelefone(mascaraTelefone(texto))
                    }
                    placeholder="(00) 00000-0000"
                    erro={erros.contatoEmergenciaTelefone}
                    focado={focado === "contatoEmergenciaTelefone"}
                    onFocus={() => setFocado("contatoEmergenciaTelefone")}
                    onBlur={() => setFocado(null)}
                    inputRef={contatoTelefoneRef}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
              </View>
            )}


            {/* Contato, endereço e emergência em blocos (exibição) */}
            {!editando && (
              <View style={styles.secao}>
                <Text style={styles.secaoTitulo}>Contato e endereço</Text>

                <View style={styles.grade}>
                  <Dado
                    larga
                    icone={Mail}
                    rotulo="E-mail"
                    valor={dados.email ?? "Não informado"}
                    vazio={!dados.email}
                  />
                  <Dado
                    icone={Phone}
                    rotulo="Telefone"
                    valor={
                      dados.telefone
                        ? formatarTelefone(dados.telefone)
                        : "Não informado"
                    }
                    vazio={!dados.telefone}
                  />
                  <Dado
                    icone={MapPin}
                    rotulo="CEP"
                    valor={dados.cep ? mascaraCep(dados.cep) : "Não informado"}
                    vazio={!dados.cep}
                  />
                  <Dado
                    larga
                    icone={MapPin}
                    rotulo="Endereço"
                    valor={
                      [
                        dados.logradouro,
                        dados.numero,
                        dados.complemento,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Não informado"
                    }
                    vazio={!dados.logradouro && !dados.numero}
                    sub={dados.bairro || undefined}
                  />
                  <Dado
                    larga
                    icone={Siren}
                    rotulo="Contato de emergência"
                    valor={
                      dados.contatoEmergenciaNome || "Não informado"
                    }
                    vazio={!dados.contatoEmergenciaNome}
                    sub={
                      dados.contatoEmergenciaTelefone
                        ? formatarTelefone(dados.contatoEmergenciaTelefone)
                        : undefined
                    }
                  />
                </View>
              </View>
            )}

            {/* Ações */}
            {!editando && (
              <>
                <TouchableOpacity
                  style={styles.botaoEditar}
                  activeOpacity={0.85}
                  onPress={iniciarEdicao}
                  accessibilityRole="button"
                  accessibilityLabel="Editar perfil"
                >
                  <Pencil color={CORES.destaque} size={16} />
                  <Text style={styles.botaoEditarTexto}>Editar perfil</Text>
                </TouchableOpacity>

                <View style={{ marginTop: 20 }}>
                  <SeletorTema />
                </View>

                <TouchableOpacity
                  style={styles.botaoSairLink}
                  activeOpacity={0.7}
                  onPress={confirmarSair}
                  disabled={saindo}
                  accessibilityRole="button"
                  accessibilityLabel="Encerrar sessão"
                >
                  {saindo ? (
                    <ActivityIndicator color={CORES.perigoTexto} />
                  ) : (
                    <>
                      <LogOut color={CORES.perigoTexto} size={16} />
                      <Text style={styles.botaoSairLinkTexto}>
                        Encerrar sessão
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.rodape}>
                  Vitally Exercise{versao ? ` · v${versao}` : ""}
                </Text>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Barra de ações fixa: sempre ao alcance do polegar */}
      {mostrarBarra && !!dados && (
        <View
          style={[styles.barraAcoes, { paddingBottom: insets.bottom + 12 }]}
        >
          <TouchableOpacity
            style={styles.botaoCancelar}
            onPress={descartarAlteracoes}
            disabled={ocupado}
            accessibilityRole="button"
          >
            <Text style={styles.botaoCancelarTexto}>
              {editando ? "Cancelar" : "Descartar foto"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botaoPrimario,
              (ocupado || !temAlteracoes) && styles.botaoDesabilitado,
            ]}
            onPress={salvar}
            disabled={ocupado || !temAlteracoes}
            accessibilityRole="button"
            accessibilityState={{ disabled: ocupado || !temAlteracoes }}
          >
            {ocupado ? (
              <ActivityIndicator color={CORES.texto} />
            ) : (
              <>
                <Save color={CORES.texto} size={18} />
                <Text style={styles.botaoPrimarioTexto}>Salvar alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Aviso flutuante: visível mesmo com a página rolada */}
      {aviso && (
        <View
          style={[styles.toastWrap, { top: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setAviso(null)}
            style={[
              styles.toast,
              aviso.tipo === "ok" ? styles.toastOk : styles.toastErro,
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {aviso.tipo === "ok" ? (
              <CheckCircle2 color={CORES.sucesso} size={18} />
            ) : (
              <TriangleAlert color={CORES.perigoTexto} size={18} />
            )}
            <Text
              style={[
                styles.toastTexto,
                aviso.tipo === "ok"
                  ? styles.toastTextoOk
                  : styles.toastTextoErro,
              ]}
            >
              {aviso.texto}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
