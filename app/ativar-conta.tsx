import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
} from 'react-native';
import { useTema } from '@/hooks/use-tema';
import { criarLoginStyles } from '@/styles/loginStyles';
import { ApiError } from '@/utils/api';
import { ativarConta } from '@/utils/perfil';
import { Eye, EyeOff } from 'lucide-react-native';

/**
 * Tela "Ativar minha conta" (Expo Router v54 — file-based routing).
 *
 * E-mail + codigo de uso unico + senha escolhida pelo aluno (minimo 6).
 * Sucesso: mensagem + botao "Ir para o login" (sem sessao artificial).
 */
export default function AtivarContaScreen() {
  const router = useRouter();
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarLoginStyles(CORES), [CORES]);

  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAtivar() {
    const emailLimpo = email.trim().toLowerCase();
    const codigoLimpo = codigo.trim().toUpperCase();
    if (!emailLimpo || !codigoLimpo || !senha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha e-mail, código, senha e confirmação.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }
    setLoading(true);
    try {
      const resposta = await ativarConta({
        email: emailLimpo,
        codigo: codigoLimpo,
        senha,
        confirmarSenha,
      });
      Alert.alert(
        'Conta ativada',
        resposta?.mensagem || 'Conta ativada. Entre com seu e-mail e senha.',
        [{ text: 'IR PARA O LOGIN', onPress: () => router.replace('/') }],
      );
    } catch (e) {
      if (e instanceof ApiError) {
        Alert.alert(e.status === 0 ? 'Erro de conexão' : 'Não foi possível ativar', e.message);
      } else {
        Alert.alert('Erro de conexão', 'Não foi possível falar com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Ativar minha conta' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>
                ATIVAR <Text style={styles.logoTextAccent}>CONTA</Text>
              </Text>
              <Text style={styles.subtitle}>Use o código informado pela recepção</Text>
            </View>
            <View style={styles.form}>
              <Text style={styles.label}>E-mail cadastrado</Text>
              <TextInput
                style={styles.input}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor={CORES.textoMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <Text style={styles.label}>Código de ativação</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: K7Q2M9XD"
                placeholderTextColor={CORES.textoMuted}
                value={codigo}
                onChangeText={(t) => setCodigo(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                returnKeyType="next"
              />
              <Text style={styles.label}>Nova senha (mínimo 6)</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 46 }]}
                  placeholder="........"
                  placeholderTextColor={CORES.textoMuted}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setMostrarSenha((v) => !v)}
                  accessibilityRole="button"
                >
                  {mostrarSenha ? (
                    <EyeOff size={20} color={CORES.textoSecundario} />
                  ) : (
                    <Eye size={20} color={CORES.textoSecundario} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Confirmar nova senha</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 46 }]}
                  placeholder="........"
                  placeholderTextColor={CORES.textoMuted}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry={!mostrarConfirmacao}
                  autoCapitalize="none"
                  returnKeyType="go"
                  onSubmitEditing={handleAtivar}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setMostrarConfirmacao((v) => !v)}
                  accessibilityRole="button"
                >
                  {mostrarConfirmacao ? (
                    <EyeOff size={20} color={CORES.textoSecundario} />
                  ) : (
                    <Eye size={20} color={CORES.textoSecundario} />
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.button}
                onPress={handleAtivar}
                disabled={loading}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color={CORES.texto} />
                ) : (
                  <Text style={styles.buttonText}>ATIVAR CONTA</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.button, styles.buttonSecundario]}
                onPress={() => router.replace('/' as never)}
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, styles.buttonTextSecundario]}>
                  VOLTAR AO LOGIN
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.footer}>
              O código é de uso único e expira em alguns dias. Perdeu? Peça outro na recepção.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
