// screens/RegisterScreen.js
// Cadastro do cliente: nome, CPF, endereço.
// O botão de "Continuar com Google" está com a estrutura pronta,
// mas precisa das credenciais OAuth reais do Google Cloud Console
// para funcionar (veja o comentário mais abaixo, na função loginComGoogle).

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
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function finalizarCadastro() {
    if (!nome || !cpf) {
      Alert.alert('Campos obrigatórios', 'Preencha nome e CPF para continuar.');
      return;
    }

    setCarregando(true);
    try {
      const cliente = await api.registerCustomer({
        nome,
        cpf,
        endereco: { cep, rua, numero, bairro, cidade, estado }
      });

      await AsyncStorage.setItem('cliente', JSON.stringify(cliente));
      navigation.replace('Home');
    } catch (erro) {
      Alert.alert('Erro no cadastro', erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function loginComGoogle() {
    // Login com Google via expo-auth-session.
    // Passos para ativar de verdade:
    // 1. Criar um projeto no Google Cloud Console
    // 2. Gerar credenciais OAuth (Android + Web client ID)
    // 3. Configurar expo-auth-session com esses IDs
    // 4. Ao receber o perfil do Google, chamar api.registerCustomer
    //    passando o googleId e email retornados
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
      <TextInput
        style={styles.input}
        value={cpf}
        onChangeText={setCpf}
        placeholder="000.000.000-00"
        keyboardType="numeric"
      />

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

      <TouchableOpacity
        style={styles.botaoPrincipal}
        onPress={finalizarCadastro}
        disabled={carregando}
      >
        <Text style={styles.textoBotaoPrincipal}>
          {carregando ? 'Salvando...' : 'Finalizar cadastro'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  subtitulo: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  rotulo: { fontSize: 13, color: '#555', marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 10, marginTop: 4, fontSize: 15
  },
  linha: { flexDirection: 'row', marginTop: 4 },
  botaoGoogle: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 12, alignItems: 'center', marginBottom: 12
  },
  textoBotaoGoogle: { fontSize: 15, fontWeight: '500' },
  divisor: { textAlign: 'center', color: '#888', marginBottom: 12, fontSize: 13 },
  botaoPrincipal: {
    backgroundColor: '#2563eb', borderRadius: 6,
    padding: 14, alignItems: 'center', marginTop: 24
  },
  textoBotaoPrincipal: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
