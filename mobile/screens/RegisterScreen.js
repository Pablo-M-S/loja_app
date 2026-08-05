 import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [modo, setModo] = useState('cadastro'); // 'cadastro' | 'login'

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [tipoMoradia, setTipoMoradia] = useState('casa'); // 'casa' | 'apartamento'
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function buscarCep(valor) {
    const cepLimpo = valor.replace(/[^\d]/g, '');
    setCep(valor);
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await res.json();
      if (dados.erro) {
        Alert.alert('CEP não encontrado', 'Confere se o CEP está certo, ou preenche o endereço manualmente.');
        return;
      }
      setRua(dados.logradouro || '');
      setBairro(dados.bairro || '');
      setCidade(dados.localidade || '');
      setEstado(dados.uf || '');
    } catch (erro) {
      Alert.alert('Erro ao buscar CEP', 'Não consegui buscar o endereço agora. Preenche manualmente.');
    } finally {
      setBuscandoCep(false);
    }
  }

  async function finalizarCadastro() {
    if (!nome || !email || !senha) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, e-mail e senha para continuar.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Senha muito curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }
    setCarregando(true);
    try {
      const temEndereco = cep || rua || numero || bairro || cidade || estado;
      const cliente = await api.registerCustomer({
        nome, email, senha,
        cpf: cpf || undefined,
        endereco: temEndereco
          ? { cep, rua, numero, complemento, tipoMoradia, bairro, cidade, estado }
          : undefined
      });
      await AsyncStorage.setItem('cliente', JSON.stringify(cliente));
      navigation.replace('Main');
    } catch (erro) {
      if (erro.message.includes('e-mail')) {
        Alert.alert(
          'E-mail já cadastrado',
          'Esse e-mail já tem cadastro. Use a opção "Já tenho conta" abaixo para entrar.'
        );
      } else {
        Alert.alert('Erro no cadastro', erro.message);
      }
    } finally {
      setCarregando(false);
    }
  }

  async function fazerLogin() {
    if (!email || !senha) {
      Alert.alert('Informe e-mail e senha', 'Preencha os dois campos para entrar.');
      return;
    }
    setCarregando(true);
    try {
      const cliente = await api.login(email, senha);
      await AsyncStorage.setItem('cliente', JSON.stringify(cliente));
      navigation.replace('Main');
    } catch (erro) {
      Alert.alert('Não foi possível entrar', erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function loginComGoogle() {
    Alert.alert(
      'Login com Google',
      'Essa opção será ativada quando configurarmos as credenciais OAuth do Google Cloud Console.'
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>{modo === 'cadastro' ? 'Criar minha conta' : 'Entrar na minha conta'}</Text>

      <TouchableOpacity style={styles.botaoGoogle} onPress={loginComGoogle}>
        <Text style={styles.textoBotaoGoogle}>Continuar com Google</Text>
      </TouchableOpacity>

      <Text style={styles.divisor}>ou preencha manualmente</Text>

      {modo === 'cadastro' && (
        <>
          <Text style={styles.rotulo}>Nome completo</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />
        </>
      )}

      <Text style={styles.rotulo}>E-mail</Text>
      <TextInput
        style={styles.input} value={email} onChangeText={setEmail}
        placeholder="seuemail@exemplo.com" keyboardType="email-address" autoCapitalize="none"
      />

      <Text style={styles.rotulo}>Senha</Text>
      <TextInput style={styles.input} value={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" secureTextEntry />

      {modo === 'cadastro' ? (
        <TouchableOpacity onPress={() => setModo('login')}>
          <Text style={styles.linkEntrar}>Já tenho conta — entrar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setModo('cadastro')}>
          <Text style={styles.linkEntrar}>Não tenho conta — cadastrar</Text>
        </TouchableOpacity>
      )}

      {modo === 'cadastro' && (
        <>
          <Text style={styles.subtitulo}>CPF (opcional, para nota fiscal)</Text>
          <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="000.000.000-00" keyboardType="numeric" />

          <Text style={styles.subtitulo}>Endereço de entrega</Text>

          <Text style={styles.rotulo}>CEP</Text>
          <View style={styles.cepRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]} value={cep} onChangeText={buscarCep}
              placeholder="00000-000" keyboardType="numeric" maxLength={9}
            />
            {buscandoCep && <ActivityIndicator size="small" color="#1C682E" style={{ marginLeft: 10 }} />}
          </View>

          <Text style={styles.rotulo}>Rua</Text>
          <TextInput style={styles.input} value={rua} onChangeText={setRua} placeholder="Preenchido pelo CEP" />

          <View style={styles.linha}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.rotulo}>Número</Text>
              <TextInput style={styles.input} value={numero} onChangeText={setNumero} keyboardType="numeric" />
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.rotulo}>Bairro</Text>
              <TextInput style={styles.input} value={bairro} onChangeText={setBairro} placeholder="Preenchido pelo CEP" />
            </View>
          </View>

          <Text style={styles.rotulo}>Tipo de moradia</Text>
          <View style={styles.tipoRow}>
            <TouchableOpacity
              style={[styles.tipoBtn, tipoMoradia === 'casa' && styles.tipoBtnAtivo]}
              onPress={() => setTipoMoradia('casa')}
            >
              <Text style={[styles.tipoBtnTexto, tipoMoradia === 'casa' && styles.tipoBtnTextoAtivo]}>Casa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tipoBtn, tipoMoradia === 'apartamento' && styles.tipoBtnAtivo]}
              onPress={() => setTipoMoradia('apartamento')}
            >
              <Text style={[styles.tipoBtnTexto, tipoMoradia === 'apartamento' && styles.tipoBtnTextoAtivo]}>Apartamento</Text>
            </TouchableOpacity>
          </View>

          {tipoMoradia === 'apartamento' && (
            <>
              <Text style={styles.rotulo}>Complemento (bloco, apto, etc.)</Text>
              <TextInput style={styles.input} value={complemento} onChangeText={setComplemento} placeholder="Ex: Bloco 2, Apto 34" />
            </>
          )}

          <View style={styles.linha}>
            <View style={{ flex: 2, marginRight: 8 }}>
              <Text style={styles.rotulo}>Cidade</Text>
              <TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholder="Preenchido pelo CEP" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rotulo}>UF</Text>
              <TextInput style={styles.input} value={estado} onChangeText={setEstado} maxLength={2} autoCapitalize="characters" />
            </View>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.botaoPrincipal}
        onPress={modo === 'cadastro' ? finalizarCadastro : fazerLogin}
        disabled={carregando}
      >
        <Text style={styles.textoBotaoPrincipal}>
          {carregando ? 'Aguarde...' : modo === 'cadastro' ? 'Finalizar cadastro' : 'Entrar'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 20, textAlign: 'center' },
  botaoGoogle: {
    backgroundColor: VERDE_CLARO, borderWidth: 1, borderColor: VERDE,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16,
  },
  textoBotaoGoogle: { color: VERDE, fontWeight: 'bold', fontSize: 15 },
  divisor: { textAlign: 'center', color: '#888', marginBottom: 16, fontSize: 13 },
  rotulo: { fontSize: 13, color: '#555', marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fafafa',
  },
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  linkEntrar: { color: VERDE, fontWeight: '600', fontSize: 13, marginTop: 8, textAlign: 'right' },
  subtitulo: { fontSize: 16, fontWeight: 'bold', color: '#222', marginTop: 24, marginBottom: 8 },
  linha: { flexDirection: 'row' },
  tipoRow: { flexDirection: 'row', marginTop: 4 },
  tipoBtn: {
    flex: 1, borderWidth: 1, borderColor: VERDE, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', marginRight: 8,
  },
  tipoBtnAtivo: { backgroundColor: VERDE },
  tipoBtnTexto: { color: VERDE, fontWeight: '600' },
  tipoBtnTextoAtivo: { color: '#fff' },
  botaoPrincipal: {
    backgroundColor: VERDE, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  textoBotaoPrincipal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});         
