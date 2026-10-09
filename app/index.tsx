import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Substituição do Ionicons por lucide-react-native para manter o padrão visual do app
import { useTema } from "@/hooks/use-tema";
import { criarLoginStyles } from "@/styles/loginStyles";
import { aoExpirarSessao, ApiError } from "@/utils/api";
import { autenticar, validarSessaoNoServidor } from "@/utils/perfil";
import {
  carregarSessao,
  limparSessao,
  redefinirSessaoExpirada,
  rotaDoAluno,
  rotaDoCargo,
  rotuloDoCargo,
  salvarSessao,
} from "@/utils/sessao";
import { Eye, EyeOff } from "lucide-react-native";

/**
 * Tela de login do GERENCIA Mobile.
 *
 * O acesso é UNIFICADO: uma única entrada com e-mail e senha, sem escolher o
 * tipo de conta. O backend identifica o perfil (ADMIN, TECNICO, ALUNO...) a
 * partir do token assinado e devolve o cargo — o app apenas leva a pessoa até a
 * área correspondente, que já existia no aplicativo.
 *
 * O cargo aqui é somente necessidade de navegação: quem autoriza cada operação
 * é sempre o backend.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarLoginStyles(CORES), [CORES]);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restaurando, setRestaurando] = useState(true);

  // Restaura a sessão ao abrir o app, revalidando o token no servidor: a
  // presença de um token salvo não significa, sozinha, que a sessão é válida.
  useEffect(() => {
    let ativo = true;
    (async () => {
      const salva = await carregarSessao();
      if (!ativo) return;

      if (!salva) {
        setRestaurando(false);
        return;
      }

      try {
        const perfil = await validarSessaoNoServidor();
        if (!ativo) return;

        const destino =
          perfil.cargo === "ALUNO"
            ? rotaDoAluno(perfil.cargo)
            : rotaDoCargo(perfil.cargo);
        if (destino === "/") {
          // Cargo sem área correspondente no aplicativo: encerra a sessão.
          await limparSessao();
          setRestaurando(false);
          return;
        }
        await salvarSessao(perfil, salva.token);
        router.replace(destino);
      } catch {
        // 401: o cliente HTTP já limpou a sessão. Falha de rede mantém o
        // usuário no login em vez de travá-lo.
        if (!ativo) return;
        setRestaurando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [router]);

  useEffect(() => aoExpirarSessao(() => router.replace("/")), [router]);

  /**
   * Autentica por e-mail e senha em UM único endpoint. O backend resolve o
   * perfil (equipe ou aluno) e devolve o cargo; o app só navega.
   */
  const handleEntrar = useCallback(async () => {
    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo || !senha) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    try {
      const data = await autenticar(emailLimpo, senha);
      if (!data?.token || !data?.cargo) {
        throw new ApiError(500, "Resposta inesperada do servidor de login.");
      }

      // O destino vem do cargo devolvido pela API — o app não o escolhe.
      const destino =
        data.cargo === "ALUNO" ? rotaDoAluno(data.cargo) : rotaDoCargo(data.cargo);

      if (destino === "/") {
        // Cargo legítimo, porém sem área correspondente neste aplicativo
        // (ex.: recepção e financeiro). Nada de sessão parcial é guardada.
        await limparSessao();
        Alert.alert(
          "Acesso restrito",
          `Este aplicativo não possui uma área para o perfil de ${rotuloDoCargo(
            data.cargo,
          )}. Use o sistema da academia.`,
        );
        return;
      }

      await salvarSessao(
        { cargo: data.cargo, usuario: data.usuario ?? null, aluno: data.aluno ?? null },
        data.token,
      );
      redefinirSessaoExpirada();
      router.replace(destino);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401)
        Alert.alert("Acesso negado", "E-mail ou senha inválidos.");
      else if (e instanceof ApiError)
        Alert.alert(e.status === 0 ? "Erro de conexão" : "Erro", e.message);
      else
        Alert.alert(
          "Erro de conexão",
          "Não foi possível falar com o servidor. Confira o IP no app e se o backend está rodando.",
        );
    } finally {
      setLoading(false);
    }
  }, [email, senha, router]);

  if (restaurando) {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContainer}>
          {/* Cabeçalho da marca (identidade visual preservada) */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              VITALLY<Text style={styles.logoTextAccent}>EXERCISE</Text>
            </Text>
            <Text style={styles.subtitle}>Gestão da academia</Text>
          </View>

          {/* Formulário único: e-mail e senha para todos os perfis */}
          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seuemail@academia.com"
              placeholderTextColor={CORES.textoMuted}
              selectionColor={CORES.destaque}
              cursorColor={CORES.destaque}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 46 }]}
                placeholder="........"
                placeholderTextColor={CORES.textoMuted}
                selectionColor={CORES.destaque}
                cursorColor={CORES.destaque}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleEntrar}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setMostrarSenha((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {mostrarSenha ? (
                  <EyeOff size={20} color={CORES.textoSecundario} />
                ) : (
                  <Eye size={20} color={CORES.textoSecundario} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.button}
              onPress={handleEntrar}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={CORES.texto} />
              ) : (
                <Text style={styles.buttonText}>ENTRAR</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Use o e-mail e a senha cadastrados na recepção da academia
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
