import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { ProvedorTema, useTema } from '@/hooks/use-tema';

function LayoutInterno() {
  const { cores, tema, carregado } = useTema();

  if (!carregado) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator color={cores.indicador} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={tema === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="ativar-conta" />
        <Stack.Screen name="aluno/inicio" />
        <Stack.Screen name="aluno/presenca" />
        <Stack.Screen name="aluno/frequencia" />
        <Stack.Screen name="aluno/mensalidades" />
        {/* Arquivo com "P" maiúsculo — o nome da rota segue o do arquivo. */}
        <Stack.Screen name="aluno/Perfil" />
        <Stack.Screen name="admin/dashboard" />
        <Stack.Screen name="admin/cadastro-manutencao" />
        <Stack.Screen name="manutencao/chamados" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

/**
 * Layout raiz do app (Expo Router v54 — file-based routing).
 * O `Stack` registra as telas pelo caminho dos arquivos em `app/`.
 * O login mora em `app/index.tsx`; o portal do aluno em `app/aluno/*`
 * e as telas legadas de staff em `app/admin/*` e `app/manutencao/*`.
 *
 * O `ProvedorTema` injeta o tema claro (padrão) / escuro globalmente.
 */
export default function RootLayout() {
  return (
    <ProvedorTema>
      <LayoutInterno />
    </ProvedorTema>
  );
}

