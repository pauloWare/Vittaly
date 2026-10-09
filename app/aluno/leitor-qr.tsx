import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import {
  CameraOff,
  ChevronLeft,
  CircleCheckBig,
  TriangleAlert,
} from 'lucide-react-native';
import { useCallback, useRef, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoAluno } from '@/hooks/use-sessao-aluno';
import { criarLeitorQrStyles } from '@/styles/leitorQrStyles';
import { useTema } from '@/hooks/use-tema';
import { ApiError, apiFetch } from '@/utils/api';
import { ENDPOINT_CHECKIN, corpoCheckin, formatarHora } from '@/utils/portal';

/**
 * Tela "Ler QR Code": registra a ENTRADA do aluno autenticado.
 *
 * A câmera lê o QR Code exibido na recepção — que contém a URL completa da web
 * (`https://dominio/registrar-presenca?token=...`) — e `corpoCheckin` extrai
 * somente o token, enviando `{ token }` para `POST /api/entrada/validar`
 * (sempre com o token da sessão — o backend identifica o aluno pelo token
 * assinado, nunca por CPF enviado aqui). QR sem token utilizável mostra erro
 * amigável sem fazer requisição.
 *
 * Todas as decisões (QR do dia, situação cadastral, mensalidade atrasada e
 * presença duplicada) são do backend; esta tela só apresenta o resultado.
 */
type Fase = 'pronto' | 'enviando' | 'sucesso' | 'erro';

type RespostaEntrada = {
  mensagem?: string;
  aluno?: { id?: number; nome?: string };
  data?: string;
  horaEntrada?: string | null;
};

export default function LeitorQrAlunoScreen() {
  const router = useRouter();
  const { cores: CORES } = useTema();
  const st = useMemo(() => criarLeitorQrStyles(CORES), [CORES]);
  const insets = useSafeAreaInsets();
  const { carregando } = useSessaoAluno();

  const [permissao, pedirPermissao] = useCameraPermissions();
  const [fase, setFase] = useState<Fase>('pronto');
  const [erro, setErro] = useState<string | null>(null);
  const [horaEntrada, setHoraEntrada] = useState<string | null>(null);

  // Trava única de envio: a câmera dispara vários eventos por segundo com o
  // mesmo QR; sem esta trava o POST seria repetido (e o 409 apareceria como
  // "erro" logo após o sucesso).
  const enviandoRef = useRef(false);

  const registrar = useCallback(async (token: string) => {
    enviandoRef.current = true;
    setFase('enviando');
    setErro(null);
    try {
      const resp = await apiFetch<RespostaEntrada>(ENDPOINT_CHECKIN, {
        method: 'POST',
        body: { token },
      });
      setHoraEntrada(resp?.horaEntrada ?? null);
      setFase('sucesso');
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível registrar sua entrada. Tente novamente.'
      );
      setFase('erro');
    } finally {
      enviandoRef.current = false;
    }
  }, []);

  const aoLerCodigo = useCallback(
    (resultado: BarcodeScanningResult) => {
      if (enviandoRef.current || fase !== 'pronto') return;
      // O QR da web traz a URL completa; extrai só o token. Sem token
      // utilizável, avisa o aluno e NÃO faz a requisição.
      const corpo = corpoCheckin(resultado.data);
      if (!corpo) {
        setErro('QR Code inválido. Aponte a câmera para o QR Code exibido na recepção.');
        setFase('erro');
        return;
      }
      void registrar(corpo.token);
    },
    [fase, registrar]
  );

  const tentarNovamente = useCallback(() => {
    setErro(null);
    setHoraEntrada(null);
    setFase('pronto');
  }, []);

  // ─── Carregando (sessão ou permissão) ────────────────────────────────────
  if (carregando || !permissao) {
    return (
      <View style={[st.centralizado, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }

  const barraTopo = (
    <View style={[st.topo, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={st.topoVoltar}
        onPress={() => router.replace('/aluno/inicio')}
        accessibilityRole="button"
        accessibilityLabel="Voltar ao início"
      >
        <ChevronLeft color={CORES.texto} size={22} />
      </TouchableOpacity>
      <Text style={st.topoTitulo}>Registrar entrada</Text>
    </View>
  );

  // ─── Sem permissão de câmera ─────────────────────────────────────────────
  if (!permissao.granted) {
    return (
      <View style={st.container}>
        {barraTopo}
        <View style={st.sobreposicao}>
          <View style={st.card}>
            <View style={[st.iconeCaixa, st.iconeNeutro]}>
              <CameraOff color={CORES.destaque} size={28} />
            </View>
            <Text style={st.titulo}>A câmera é necessária</Text>
            <Text style={st.texto}>
              Usamos a câmera apenas para ler o QR Code de presença exibido na
              recepção da academia.
            </Text>

            {permissao.canAskAgain ? (
              <TouchableOpacity
                style={st.botaoPrimario}
                onPress={() => void pedirPermissao()}
                accessibilityRole="button"
              >
                <Text style={st.botaoPrimarioTexto}>PERMITIR CÂMERA</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={st.botaoPrimario}
                onPress={() => void Linking.openSettings()}
                accessibilityRole="button"
              >
                <Text style={st.botaoPrimarioTexto}>ABRIR CONFIGURAÇÕES</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={st.botaoSecundario}
              onPress={() => router.replace('/aluno/inicio')}
              accessibilityRole="button"
            >
              <Text style={st.botaoSecundarioTexto}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Sucesso ─────────────────────────────────────────────────────────────
  if (fase === 'sucesso') {
    return (
      <View style={st.container}>
        {barraTopo}
        <View style={st.sobreposicao}>
          <View style={st.card}>
            <View style={[st.iconeCaixa, st.iconeSucesso]}>
              <CircleCheckBig color={CORES.sucesso} size={30} />
            </View>
            <Text style={st.titulo}>Entrada registrada!</Text>
            <Text style={st.texto}>Sua presença foi confirmada. Bom treino!</Text>
            {!!horaEntrada && (
              <Text style={st.hora}>Entrada às {formatarHora(horaEntrada)}</Text>
            )}

            <TouchableOpacity
              style={st.botaoPrimario}
              onPress={() => router.replace('/aluno/presenca')}
              accessibilityRole="button"
            >
              <Text style={st.botaoPrimarioTexto}>VER MINHA FREQUÊNCIA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={st.botaoSecundario}
              onPress={() => router.replace('/aluno/inicio')}
              accessibilityRole="button"
            >
              <Text style={st.botaoSecundarioTexto}>Voltar ao início</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Erro (QR inválido, mensalidade atrasada, duplicado...) ──────────────
  if (fase === 'erro') {
    return (
      <View style={st.container}>
        {barraTopo}
        <View style={st.sobreposicao}>
          <View style={st.card}>
            <View style={[st.iconeCaixa, st.iconeErro]}>
              <TriangleAlert color={CORES.perigoTexto} size={28} />
            </View>
            <Text style={st.titulo}>Não foi possível registrar</Text>
            <Text style={st.texto}>{erro}</Text>

            <TouchableOpacity
              style={st.botaoPrimario}
              onPress={tentarNovamente}
              accessibilityRole="button"
            >
              <Text style={st.botaoPrimarioTexto}>TENTAR NOVAMENTE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={st.botaoSecundario}
              onPress={() => router.replace('/aluno/inicio')}
              accessibilityRole="button"
            >
              <Text style={st.botaoSecundarioTexto}>Voltar ao início</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── Câmera pronta (pronto / enviando) ───────────────────────────────────
  return (
    <View style={st.container}>
      {barraTopo}
      <View style={st.camera}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          // Só escaneia quando não há envio em andamento (evita disparos repetidos).
          onBarcodeScanned={fase === 'pronto' ? aoLerCodigo : undefined}
        />

        {/* Moldura de mira */}
        <View style={st.moldura} pointerEvents="none">
          <View style={st.molduraArea} />
        </View>

        <View style={st.dicaCaixa} pointerEvents="none">
          <Text style={st.dicaTexto}>
            Aponte a câmera para o QR Code exibido na recepção
          </Text>
        </View>

        {fase === 'enviando' && (
          <View style={st.enviandoCaixa}>
            <ActivityIndicator color={CORES.indicador} size="large" />
            <Text style={st.enviandoTexto}>Registrando sua entrada...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

