import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';

const ZONA_LABEL = {
  grande_sp: 'Grande São Paulo',
  fora_da_capital: 'Fora da capital',
};

export default function ProfileScreen({ navigation }) {
  const [clienteId, setClienteId] = useState(null);
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [zonaEntrega, setZonaEntrega] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    setCarregando(true);
    try {
      const salvo = await AsyncStorage.getItem('cliente');
      if (!salvo) {
        navigation.replace('Register');
        return;
      }
      const clienteLocal = JSON.parse(salvo);
      // Busca dados atualizados no backend, caso tenham mudado desde o último login.
      const cliente = await api.getCustomer(clienteLocal.id);
      preencherCampos(cliente);
    } catch (erro) {
      Alert.alert('Erro ao carregar perfil', erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function preencherCampos(cliente) {
    setClienteId(cliente.id);
    setEmail(cliente.email || '');
    setNome(cliente.nome || '');
    setCpf(cliente.cpf || '');
    setCep(cliente.endereco?.cep || '');
    setRua(cliente.endereco?.rua || '');
    setNumero(cliente.endereco?.numero || '');
    setBairro(cliente.endereco?.bairro || '');
    setCidade(cliente.endereco?.cidade || '');
    setEstado(cliente.endereco?.estado || '');
    setZonaEntrega(cliente.zonaEntrega || null);
  }

  async function salvar() {
    if (!nome) {
      Alert.alert('Nome obrigatório', 'Preencha seu nome.');
      return;
    }
    setSalvando(true);
    try {
      const temEndereco = cep || rua || numero || bairro || cidade || estado;
      const clienteAtualizado = await api.updateCustomer(clienteId, {
        nome,
        cpf: cpf || null,
        endereco: temEndereco ? { cep, rua, numero, bairro, cidade, estado } : null
      });
      await AsyncStorage.setItem('cliente', JSON.stringify(clienteAtualizado));
      setZonaEntrega(clienteAtualizado.zonaEntrega || null);
      Alert.alert('Pronto', 'Seus dados foram atualizados.');
    } catch (erro) {
      Alert.alert('Erro ao salvar', erro.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={VERDE} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.rotulo}>E-mail (login)</Text>
      <TextInput style={[styles.input, styles.inputDesabilitado]} value={email} editable={false} />

      <Text style={styles.rotulo}>Nome completo</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />

      <Text style={styles.rotulo}>CPF (opcional, para nota fiscal)</Text>
      <TextInput style={styles.input} value={cpf} onChangeText={setCpf} placeholder="000.000.000-00" keyboardType="numeric" />

      <Text style={styles.subtitulo}>Endereço de entrega</Text>

      {zonaEntrega && (
        <View style={styles.zonaBox}>
          <Text style={styles.zonaTexto}>Zona de entrega: {ZONA_LABEL[zonaEntrega] || zonaEntrega}</Text>
        </View>
      )}

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

      <TouchableOpacity style={styles.botaoPrincipal} onPress={salvar} disabled={salvando}>
        <Text style={styles.textoBotaoPrincipal}>{salvando ? 'Salvando...' : 'Salvar alterações'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  rotulo: { fontSize: 13, color: '#555', marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fafafa',
  },
  inputDesabilitado: { backgroundColor: '#eee', color: '#888' },
  subtitulo: { fontSize: 16, fontWeight: 'bold', color: '#222', marginTop: 24, marginBottom: 8 },
  zonaBox: { backgroundColor: VERDE_CLARO, borderRadius: 10, padding: 10, marginBottom: 12 },
  zonaTexto: { color: VERDE, fontWeight: '600', fontSize: 13 },
  linha: { flexDirection: 'row' },
  botaoPrincipal: {
    backgroundColor: VERDE, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24, marginBottom: 24,
  },
  textoBotaoPrincipal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
