import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSessao } from '@/hooks/use-sessao';
import { criarCadastroManutencaoStyles } from '@/styles/cadastroManutencao';
import { useTema } from '@/hooks/use-tema';
import { ApiError, apiFetch } from '@/utils/api';
import { validarCPF } from '@/utils/cpf';
import { buscarEnderecoPorCep } from '@/utils/cep';

// A URL base da API fica em utils/api.ts (EXPO_PUBLIC_API_URL no .env).

// Campos da entidade Funcionario (GET /api/funcionario)
type Funcionario = {
  id: number;
  nome: string;
  cargo: string;
  telefone?: string;
  salario?: number;
  dataAdmissao?: string;
  situacao: string; // ATIVO | AFASTADO | INATIVO
  cpf?: string;
  dataNascimento?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  usuarioId?: number;
};

/** Erros do carregamento da equipe (módulo: usado em callbacks de promessa). */
function tratarErroCarregamento(e: unknown) {
  // 401: sessão limpa pelo cliente HTTP; o hook redireciona ao login.
  if (e instanceof ApiError && e.status === 401) return;
  Alert.alert(
    'Erro',
    e instanceof ApiError ? e.message : 'Não foi possível carregar a equipe de manutenção.'
  );
}

/** Técnicos cadastrados, em ordem alfabética (GET /api/funcionario). */
function buscarTecnicos(): Promise<Funcionario[]> {
  return apiFetch<Funcionario[]>('/funcionario').then((data) => {
    const lista = Array.isArray(data) ? data : [];
    return lista
      .filter((f) => f.cargo === 'TECNICO')
      .sort((a, b) => a.nome.localeCompare(b.nome));
  });
}

const FORM_INICIAL = {
  // Conta de acesso (Usuario)
  nome: '',
  email: '',
  senha: '',
  sexo: '',
  // Dados do funcionário
  telefone: '',
  cpf: '',
  dataNascimento: '',
  dataAdmissao: '',
  salario: '',
  situacao: 'ATIVO',
  // Endereço
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};
type Form = typeof FORM_INICIAL;

type StatusCep = 'idle' | 'buscando' | 'encontrado' | 'nao_encontrado' | 'erro';

// ===== Máscaras e conversões =====
const onlyDigits = (v: string) => v.replace(/\D/g, '');

function maskCpf(v: string) {
  return onlyDigits(v)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function maskTelefone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCep(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function maskData(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// dd/mm/aaaa -> yyyy-MM-dd (formato que o backend espera). Retorna null se inválida.
function dataParaISO(v: string): string | null {
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    dt.getFullYear() !== Number(yyyy) ||
    dt.getMonth() !== Number(mm) - 1 ||
    dt.getDate() !== Number(dd)
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

function isoParaData(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function parseSalario(v: string): number | null {
  const s = v.trim();
  const normalizado = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalizado);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatarMoeda(valor?: number) {
  return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function situacaoEstilo(s: string, styles: ReturnType<typeof criarCadastroManutencaoStyles>) {
  if (s === 'ATIVO') return { box: styles.badgeAtivo, text: styles.badgeAtivoText, label: 'Ativo' };
  if (s === 'AFASTADO')
    return { box: styles.badgeAfastado, text: styles.badgeAfastadoText, label: 'Afastado' };
  return { box: styles.badgeInativo, text: styles.badgeInativoText, label: 'Inativo' };
}

// ===== Componentes pequenos =====
function Campo({
  label,
  half,
  invalido,
  ...props
}: { label: string; half?: boolean; invalido?: boolean } & TextInputProps) {
  const { cores } = useTema();
  const styles = useMemo(() => criarCadastroManutencaoStyles(cores), [cores]);
  return (
    <View style={half ? styles.half : undefined}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, invalido && styles.inputInvalido]}
        placeholderTextColor={cores.textoMuted}
        selectionColor={cores.destaque}
        cursorColor={cores.destaque}
        {...props}
      />
    </View>
  );
}

function Chips({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { label: string; value: string }[];
  valor: string;
  onChange: (v: string) => void;
}) {
  const { cores } = useTema();
  const styles = useMemo(() => criarCadastroManutencaoStyles(cores), [cores]);
  return (
    <View style={styles.chipsRow}>
      {opcoes.map((o) => (
        <TouchableOpacity
          key={o.value}
          style={[styles.chip, valor === o.value && styles.chipSelected]}
          onPress={() => onChange(o.value)}
        >
          <Text style={[styles.chipText, valor === o.value && styles.chipTextSelected]}>
            {o.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Linha({ icone, texto }: { icone: keyof typeof Ionicons.glyphMap; texto: string }) {
  const { cores } = useTema();
  const styles = useMemo(() => criarCadastroManutencaoStyles(cores), [cores]);
  return (
    <View style={styles.cardLinha}>
      <Ionicons name={icone} size={14} color={cores.textoSecundario} />
      <Text style={styles.cardLinhaTexto}>{texto}</Text>
    </View>
  );
}

export default function CadastroManutencaoScreen() {
  // Criar funcionários/contas exige ADMIN no backend (também FINANCEIRO em
  // /api/funcionario, mas este app só roda contas ADMIN/TECNICO).
  const { cores: CORES } = useTema();
  const styles = useMemo(() => criarCadastroManutencaoStyles(CORES), [CORES]);
  const { usuario, carregando: sessaoCarregando, sair } = useSessao(['ADMIN']);
  const [form, setForm] = useState<Form>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  // CPF: só mostra erro depois que o campo tiver os 11 dígitos digitados,
  // pra não cravar "inválido" no meio da digitação.
  const cpfDigitos = onlyDigits(form.cpf);
  const cpfCompleto = cpfDigitos.length === 11;
  const cpfValido = cpfCompleto && validarCPF(form.cpf);
  const cpfInvalido = cpfCompleto && !cpfValido;

  // CEP: busca automática no ViaCEP assim que completar 8 dígitos.
  const [statusCep, setStatusCep] = useState<StatusCep>('idle');
  const ultimoCepBuscado = useRef<string | null>(null);

  const [tecnicos, setTecnicos] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  function set<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    // CEP incompleto não tem busca a exibir (reset feito no evento de
    // digitação para não chamar setState síncrono dentro do effect).
    if (campo === 'cep' && typeof valor === 'string' && onlyDigits(valor).length !== 8) {
      setStatusCep('idle');
    }
  }

  // Dispara a busca de CEP só quando o campo chega a exatamente 8 dígitos,
  // e não repete a busca se o CEP não mudou desde a última consulta.
  useEffect(() => {
    const cepDigitos = onlyDigits(form.cep);

    if (cepDigitos.length !== 8) return;
    if (ultimoCepBuscado.current === cepDigitos) return;

    let cancelado = false;
    setStatusCep('buscando');

    buscarEnderecoPorCep(cepDigitos).then((resultado) => {
      if (cancelado) return;
      ultimoCepBuscado.current = cepDigitos;

      if (resultado.ok) {
        setForm((prev) => ({
          ...prev,
          logradouro: resultado.endereco.logradouro,
          bairro: resultado.endereco.bairro,
          cidade: resultado.endereco.cidade,
          estado: resultado.endereco.estado,
        }));
        setStatusCep('encontrado');
      } else {
        setStatusCep(resultado.motivo === 'nao_encontrado' ? 'nao_encontrado' : 'erro');
      }
    });

    return () => {
      cancelado = true;
    };
  }, [form.cep]);

  // Usado pelos eventos (pull-to-refresh e pós-cadastro).
  const carregar = useCallback(async () => {
    setTecnicos(await buscarTecnicos());
  }, []);

  // Só busca depois que a sessão está confirmada (token disponível).
  // Corrente de promessa partindo da função de módulo: evita setState
  // síncrono dentro do effect (regra react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!usuario) return;
    let ativo = true;
    buscarTecnicos()
      .then((tecnicos) => {
        if (ativo) setTecnicos(tecnicos);
      })
      .catch((e) => {
        if (ativo) tratarErroCarregamento(e);
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
          setAtualizando(false);
        }
      });
    return () => {
      ativo = false;
    };
  }, [usuario]);

  async function cadastrar() {
    const erro = (msg: string) => Alert.alert('Atenção', msg);

    const telefone = onlyDigits(form.telefone);
    const nascimento = dataParaISO(form.dataNascimento);
    const admissao = dataParaISO(form.dataAdmissao);
    const salario = parseSalario(form.salario);
    const email = form.email.trim().toLowerCase();

    if (!form.nome.trim()) return erro('Informe o nome completo.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return erro('Informe um e-mail válido.');
    if (form.senha.length < 6) return erro('A senha precisa ter pelo menos 6 caracteres.');
    if (!form.sexo) return erro('Selecione o sexo.');
    if (telefone.length < 10) return erro('Informe um telefone com DDD.');
    if (!cpfCompleto) return erro('Informe um CPF com 11 dígitos.');
    if (!cpfValido) return erro('O CPF informado é inválido. Confira os números.');
    if (!nascimento) return erro('Data de nascimento inválida. Use dd/mm/aaaa.');
    if (!admissao) return erro('Data de admissão inválida. Use dd/mm/aaaa.');
    if (!salario) return erro('Informe um salário válido.');

    setSalvando(true);
    let usuarioCriado = false;
    try {
      // O login usa e-mail + senha; e-mail repetido deixaria o acesso ambíguo.
      const usuarios = await apiFetch<{ email?: string }[]>('/usuario');
      if (Array.isArray(usuarios) && usuarios.some((u) => u.email?.toLowerCase() === email)) {
        erro('Já existe uma conta com esse e-mail.');
        return;
      }

      // 1) Conta de acesso (Usuario) com cargo TECNICO
      const usuario = await apiFetch<{ id: number }>('/usuario', {
        method: 'POST',
        body: {
          nome: form.nome.trim(),
          email,
          senha: form.senha,
          telefone,
          sexo: form.sexo,
          dataNascimento: nascimento,
          cargo: 'TECNICO',
          status: 'user',
        },
      });
      usuarioCriado = true;

      // 2) Registro do funcionário, ligado à conta pelo usuarioId
      await apiFetch('/funcionario', {
        method: 'POST',
        body: {
          nome: form.nome.trim(),
          cargo: 'TECNICO',
          telefone,
          salario,
          dataAdmissao: admissao,
          situacao: form.situacao,
          cpf: form.cpf,
          dataNascimento: nascimento,
          email,
          cep: onlyDigits(form.cep),
          logradouro: form.logradouro.trim(),
          numero: form.numero.trim(),
          complemento: form.complemento.trim(),
          bairro: form.bairro.trim(),
          cidade: form.cidade.trim(),
          estado: form.estado.trim().toUpperCase(),
          usuarioId: usuario.id,
        },
      });

      Alert.alert('Sucesso', 'Funcionário de manutenção cadastrado.');
      setForm(FORM_INICIAL);
      ultimoCepBuscado.current = null;
      setStatusCep('idle');
      await carregar();
    } catch (e) {
      // 401: sessão expirada — sem alerta extra, o hook já redireciona.
      if (e instanceof ApiError && e.status === 401) return;
      console.log('ERRO CADASTRO:', e instanceof ApiError ? `${e.status}: ${e.message}` : e);
      if (usuarioCriado) {
        Alert.alert(
          'Atenção',
          'A conta de acesso foi criada, mas o cadastro do funcionário falhou. Confira a lista e tente novamente.'
        );
        carregar();
      } else if (e instanceof ApiError && e.status !== 0) {
        // Mensagem vinda do backend (validação, duplicidade, permissão...).
        Alert.alert('Erro', e.message);
      } else {
        Alert.alert('Erro', 'Não foi possível cadastrar o funcionário. Tente novamente.');
      }
    } finally {
      setSalvando(false);
    }
  }

  const bloqueado = salvando || cpfInvalido;

  if (sessaoCarregando || !usuario) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={CORES.indicador} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregar()
                .catch(tratarErroCarregamento)
                .finally(() => setAtualizando(false));
            }}
            tintColor={CORES.indicador}
          />
        }
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Equipe de Manutenção</Text>
              <Text style={styles.headerSubtitle}>
                Olá, {usuario.nome} — cadastre quem vai atender os chamados
              </Text>
            </View>
            <TouchableOpacity style={styles.sairButton} onPress={sair}>
              <Text style={styles.sairButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== Dados de acesso ===== */}
        <Text style={styles.sectionTitle}>Dados de acesso</Text>
        <Campo
          label="Nome completo"
          placeholder="Nome do funcionário"
          value={form.nome}
          onChangeText={(v) => set('nome', v)}
        />
        <Campo
          label="E-mail (login)"
          placeholder="funcionario@academia.com"
          value={form.email}
          onChangeText={(v) => set('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Campo
          label="Senha de acesso"
          placeholder="Mínimo 6 caracteres"
          value={form.senha}
          onChangeText={(v) => set('senha', v)}
          secureTextEntry
        />

        {/* ===== Dados pessoais e do cargo ===== */}
        <Text style={styles.sectionTitle}>Dados pessoais e do cargo</Text>
        <Text style={styles.label}>Sexo</Text>
        <Chips
          opcoes={[
            { label: 'Masculino', value: 'M' },
            { label: 'Feminino', value: 'F' },
          ]}
          valor={form.sexo}
          onChange={(v) => set('sexo', v)}
        />
        <Campo
          label="Telefone"
          placeholder="(00) 00000-0000"
          value={form.telefone}
          onChangeText={(v) => set('telefone', maskTelefone(v))}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>CPF</Text>
        <TextInput
          style={[styles.input, cpfInvalido && styles.inputInvalido]}
          placeholder="000.000.000-00"
          placeholderTextColor={CORES.textoMuted}
          value={form.cpf}
          onChangeText={(v) => set('cpf', maskCpf(v))}
          keyboardType="number-pad"
          maxLength={14}
        />
        {cpfInvalido ? <Text style={styles.fieldError}>CPF inválido. Confira os números.</Text> : null}

        <View style={styles.row}>
          <Campo
            half
            label="Nascimento"
            placeholder="dd/mm/aaaa"
            value={form.dataNascimento}
            onChangeText={(v) => set('dataNascimento', maskData(v))}
            keyboardType="number-pad"
          />
          <Campo
            half
            label="Admissão"
            placeholder="dd/mm/aaaa"
            value={form.dataAdmissao}
            onChangeText={(v) => set('dataAdmissao', maskData(v))}
            keyboardType="number-pad"
          />
        </View>
        <Campo
          label="Salário (R$)"
          placeholder="1700,00"
          value={form.salario}
          onChangeText={(v) => set('salario', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.label}>Situação</Text>
        <Chips
          opcoes={[
            { label: 'Ativo', value: 'ATIVO' },
            { label: 'Afastado', value: 'AFASTADO' },
            { label: 'Inativo', value: 'INATIVO' },
          ]}
          valor={form.situacao}
          onChange={(v) => set('situacao', v)}
        />

        {/* ===== Endereço ===== */}
        <Text style={styles.sectionTitle}>Endereço (opcional)</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>CEP</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="00000-000"
              placeholderTextColor={CORES.textoMuted}
              value={form.cep}
              onChangeText={(v) => set('cep', maskCep(v))}
              keyboardType="number-pad"
              maxLength={9}
            />
            {statusCep === 'buscando' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <ActivityIndicator size="small" color={CORES.indicador} />
                <Text style={[styles.fieldInfo, { marginLeft: 6, marginTop: 0 }]}>
                  Buscando endereço...
                </Text>
              </View>
            )}
            {statusCep === 'nao_encontrado' && (
              <Text style={styles.fieldWarning}>CEP não encontrado. Preencha manualmente.</Text>
            )}
            {statusCep === 'erro' && (
              <Text style={styles.fieldError}>
                Não foi possível consultar o CEP agora. Preencha manualmente.
              </Text>
            )}
          </View>
          <Campo
            half
            label="Número"
            placeholder="123"
            value={form.numero}
            onChangeText={(v) => set('numero', v)}
          />
        </View>
        <Campo
          label="Logradouro"
          placeholder="Rua, avenida..."
          value={form.logradouro}
          onChangeText={(v) => set('logradouro', v)}
        />
        <Campo
          label="Complemento"
          placeholder="Apto, sala..."
          value={form.complemento}
          onChangeText={(v) => set('complemento', v)}
        />
        <Campo
          label="Bairro"
          placeholder="Bairro"
          value={form.bairro}
          onChangeText={(v) => set('bairro', v)}
        />
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Campo
              label="Cidade"
              placeholder="Cidade"
              value={form.cidade}
              onChangeText={(v) => set('cidade', v)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Campo
              label="UF"
              placeholder="SP"
              value={form.estado}
              onChangeText={(v) => set('estado', v.toUpperCase())}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, bloqueado && styles.buttonDisabled]}
          onPress={cadastrar}
          disabled={bloqueado}
        >
          {salvando ? (
            <ActivityIndicator color={CORES.texto} />
          ) : (
            <Text style={styles.buttonText}>CADASTRAR</Text>
          )}
        </TouchableOpacity>

        {/* ===== Equipe cadastrada ===== */}
        <Text style={styles.listTitle}>Equipe cadastrada ({tecnicos.length})</Text>

        {carregando ? (
          <ActivityIndicator color={CORES.indicador} />
        ) : tecnicos.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum técnico cadastrado ainda.</Text>
        ) : (
          tecnicos.map((t) => {
            const badge = situacaoEstilo(t.situacao, styles);
            const endereco = [
              [t.logradouro, t.numero].filter(Boolean).join(', '),
              t.complemento,
              t.bairro,
              [t.cidade, t.estado].filter(Boolean).join('/'),
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardNome}>{t.nome}</Text>
                  <View style={[styles.badge, badge.box]}>
                    <Text style={[styles.badgeText, badge.text]}>{badge.label}</Text>
                  </View>
                </View>

                {t.email ? <Linha icone="mail" texto={t.email} /> : null}
                {t.telefone ? <Linha icone="call" texto={maskTelefone(t.telefone)} /> : null}
                {t.cpf ? <Linha icone="id-card" texto={t.cpf} /> : null}
                <Linha icone="calendar" texto={`Admissão: ${isoParaData(t.dataAdmissao)}`} />
                <Linha icone="cash" texto={formatarMoeda(t.salario)} />
                {endereco ? <Linha icone="location" texto={endereco} /> : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}