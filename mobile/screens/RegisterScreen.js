import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function finalizarCadastro() {
    if (!nome || !cpf || !senha) {
      Alert.alert('Campos obrigatórios', 'Preencha nome, CPF e senha para continuar.');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Senha muito curta', 'Use uma senha com pelo menos 6 caracteres.');
      return;
    }
    setCarregando(true);
    try {
      const cliente = await api.registerCustomer({
        nome, cpf, senha,
        endereco: { cep, rua, numero, bairro, cidade, estado }
      });
      await AsyncStorage.setItem('cliente', JSON.stringify(cliente));
      navigation.replace('Main');
    } catch (erro) {
      if (erro.message.includes('Já existe')) {
        Alert.alert(
          'CPF já cadastrado',
          'Esse CPF já tem cadastro. Use a opção "Já tenho cadastro" abaixo para entrar.'
        );
      } else {
        Alert.alert('Erro no cadastro', erro.message);
      }
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComCpfESenha() {
    if (!cpf || !senha) {
      Alert.alert('Informe CPF e senha', 'Preencha os dois campos para entrar com um cadastro existente.');
      return;
    }
    setCarregando(true);
    try {
      const cliente = await api.login(cpf, senha);
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
      <Text style={styles.titulo}>Criar minha conta</Text>

      <TouchableOpacity style={styles.botaoGoogle} onPress={loginComGoogle}>
        <Text style={styles.textoBotaoGoogle}>Continuar com Google</Text>
      </TouchableOpacity>

      <Text style={styles.divisor}>ou preencha manualmente</Text>

      <Text style={styles.rotulo}>Nome completo</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />

      <Text style={styles.rotulo}>CPF</Text>
      <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="000.000.000-00" keyboardType="numeric" />

      <Text style={styles.rotulo}>Senha</Text>
      <TextInput style={styles.input} value={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" secureTextEntry />

      <TouchableOpacity onPress={entrarComCpfESenha} disabled={carregando}>
        <Text style={styles.linkEntrar}>Já tenho cadastro — entrar com CPF e senha</Text>
      </TouchableOpacity>

      <Text style={styles.subtitulo}>Endereço de entrega</Text>

      <Text style={styles.rotulo}>CEP</Text>
      <TextInput style={styles.input} value={cep} onChangeText={setCep} placeholder="00000-000" keyboardType="numeric" />

      <Text style={styles.rotulo}>Rua</Text>
      <TextInput style={styles.input} value={rua} onChangeText={setRua} placeholder="Nome da rua" />

      <View style={styles.linha}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.rotulo}>Número</Text>
          <TextInput style={styles.input} value={numero} onChangeText={setNumero} keyboardType="numeric" />
        </View>
        <View style={{ flex: 2 }}>
          <Text style={styles.rotulo}>Bairro</Text>
          <TextInput style={styles.input} value={bairro} onChangeText={setBairro} />
        </View>
      </View>

      <View style={styles.linha}>
        <View style={{ flex: 2, marginRight: 8 }}>
          <Text style={styles.rotulo}>Cidade</Text>
          <TextInput style={styles.input} value={cidade} onChangeText={setCidade} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rotulo}>UF</Text>
          <TextInput style={styles.input} value={estado} onChangeText={setEstado} maxLength={2} autoCapitalize="characters" />
        </View>
      </View>

      <TouchableOpacity style={styles.botaoPrincipal} onPress={finalizarCadastro} disabled={carregando}>
        <Text style={styles.textoBotaoPrincipal}>
          {carregando ? 'Salvando...' : 'Finalizar cadastro'}
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
  linkEntrar: { color: VERDE, fontWeight: '600', fontSize: 13, marginTop: 8, textAlign: 'right' },
  subtitulo: { fontSize: 16, fontWeight: 'bold', color: '#222', marginTop: 24, marginBottom: 8 },
  linha: { flexDirection: 'row' },
  botaoPrincipal: {
    backgroundColor: VERDE, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  textoBotaoPrincipal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
