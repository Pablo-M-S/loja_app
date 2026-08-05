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
  const [complemento, setComplemento] = useState('');
  const [tipoMoradia, setTipoMoradia] = useState('casa');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [zonaEntrega, setZonaEntrega] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
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
    setComplemento(cliente.endereco?.complemento || '');
    setTipoMoradia(cliente.endereco?.tipoMoradia || 'casa');
    setBairro(cliente.endereco?.bairro || '');
    setCidade(cliente.endereco?.cidade || '');
    setEstado(cliente.endereco?.estado || '');
    setZonaEntrega(cliente.zonaEntrega || null);
  }

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
        endereco: temEndereco
          ? { cep, rua, numero, complemento, tipoMoradia, bairro, cidade, estado }
          : null
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
      <View style={styles.cepRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]} value={cep} onChangeText={buscarCep}
          placeholder="00000-000" keyboardType="numeric" maxLength={9}
        />
        {buscandoCep && <ActivityIndicator size="small" color={VERDE} style={{ marginLeft: 10 }} />}
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
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  subtitulo: { fontSize: 16, fontWeight: 'bold', color: '#222', marginTop: 24, marginBottom: 8 },
  zonaBox: { backgroundColor: VERDE_CLARO, borderRadius: 10, padding: 10, marginBottom: 12 },
  zonaTexto: { color: VERDE, fontWeight: '600', fontSize: 13 },
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
    alignItems: 'center', marginTop: 24, marginBottom: 24,
  },
  textoBotaoPrincipal: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
