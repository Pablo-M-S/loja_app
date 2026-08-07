import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';

export default function CheckoutScreen({ navigation }) {
  const { items, totalPreco, clearCart } = useCart();
  const [cliente, setCliente] = useState(null);
  const [frete, setFrete] = useState(null);
  const [carregandoFrete, setCarregandoFrete] = useState(true);
  const [erroFrete, setErroFrete] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarClienteECalcularFrete();
  }, []);

  async function carregarClienteECalcularFrete() {
    setCarregandoFrete(true);
    setErroFrete(null);
    try {
      const salvo = await AsyncStorage.getItem('cliente');
      if (!salvo) throw new Error('Cliente não encontrado. Faça login novamente.');
      const clienteLocal = JSON.parse(salvo);

      const clienteAtualizado = await api.getCustomer(clienteLocal.id);
      setCliente(clienteAtualizado);

      const cotacao = await api.cotarFrete({ endereco: clienteAtualizado.endereco });
      setFrete(cotacao);
    } catch (erro) {
      setErroFrete(erro.message);
    } finally {
      setCarregandoFrete(false);
    }
  }

  async function confirmarPedido() {
    if (!cliente || !frete) return;

    setEnviando(true);
    try {
      const pedido = await api.criarPedido({
        clienteId: cliente.id,
        itens: items,
        frete
      });

      clearCart();

      Alert.alert(
        'Pedido realizado!',
        `Seu pedido #${pedido.numero} foi registrado com sucesso.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    } catch (erro) {
      Alert.alert('Erro ao confirmar pedido', erro.message);
    } finally {
      setEnviando(false);
    }
  }

  const totalGeral = totalPreco + (frete?.valor || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>

      {/* Endereço de entrega */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Endereço de entrega</Text>
        {cliente?.endereco ? (
          <Text style={styles.textoEndereco}>
            {cliente.endereco.rua}, {cliente.endereco.numero}
            {cliente.endereco.complemento ? ` - ${cliente.endereco.complemento}` : ''}
            {'\n'}{cliente.endereco.bairro} - {cliente.endereco.cidade}/{cliente.endereco.estado}
            {'\n'}CEP: {cliente.endereco.cep}
          </Text>
        ) : (
          <ActivityIndicator color={VERDE} />
        )}
      </View>

      {/* Itens do pedido */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Itens do pedido</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.linhaItem}>
            <Text style={styles.itemNome} numberOfLines={1}>
              {item.quantidade}x {item.nome}
            </Text>
            <Text style={styles.itemValor}>
              R$ {(item.preco * item.quantidade).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Frete */}
      <View style={styles.card}>
        <Text style={styles.tituloCard}>Entrega</Text>
        {carregandoFrete && (
          <View style={styles.linhaFrete}>
            <ActivityIndicator color={VERDE} />
            <Text style={styles.textoCalculando}>Calculando frete...</Text>
          </View>
        )}
        {!carregandoFrete && erroFrete && (
          <View>
            <Text style={styles.erroTexto}>Não foi possível calcular o frete: {erroFrete}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={carregarClienteECalcularFrete}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
        {!carregandoFrete && frete && !erroFrete && (
          <View>
            <View style={styles.linhaResumo}>
              <Text style={styles.labelResumo}>Valor do frete</Text>
              <Text style={styles.valorResumo}>R$ {frete.valor.toFixed(2)}</Text>
            </View>
            {frete.duracaoEstimadaMinutos && (
              <Text style={styles.prazoTexto}>
                Previsão de entrega: ~{frete.duracaoEstimadaMinutos} minutos após confirmação
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Resumo final */}
      <View style={styles.card}>
        <View style={styles.linhaResumo}>
          <Text style={styles.labelResumo}>Subtotal</Text>
          <Text style={styles.valorResumo}>R$ {totalPreco.toFixed(2)}</Text>
        </View>
        <View style={styles.linhaResumo}>
          <Text style={styles.labelResumo}>Frete</Text>
          <Text style={styles.valorResumo}>
            {frete ? `R$ ${frete.valor.toFixed(2)}` : '—'}
          </Text>
        </View>
        <View style={[styles.linhaResumo, styles.linhaTotal]}>
          <Text style={styles.labelTotal}>Total</Text>
          <Text style={styles.valorTotal}>R$ {totalGeral.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.confirmarBtn, (carregandoFrete || erroFrete || enviando) && styles.confirmarBtnDesabilitado]}
        onPress={confirmarPedido}
        disabled={carregandoFrete || !!erroFrete || enviando}
      >
        {enviando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmarText}>Confirmar pedido</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.avisoPagamento}>
        <Ionicons name="information-circle-outline" size={14} color="#888" />
        {'  '}O pagamento ainda será combinado após a confirmação do pedido.
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VERDE_CLARO },
  conteudo: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 1,
  },
  tituloCard: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  textoEndereco: { fontSize: 14, color: '#444', lineHeight: 20 },

  linhaItem: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6,
  },
  itemNome: { fontSize: 13, color: '#444', flex: 1, marginRight: 10 },
  itemValor: { fontSize: 13, color: '#222', fontWeight: '600' },

  linhaFrete: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textoCalculando: { color: '#666', fontSize: 13 },
  erroTexto: { color: '#c0392b', fontSize: 13, marginBottom: 8 },
  retryBtn: {
    backgroundColor: VERDE, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  prazoTexto: { fontSize: 12, color: '#888', marginTop: 4 },

  linhaResumo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  labelResumo: { fontSize: 14, color: '#666' },
  valorResumo: { fontSize: 14, color: '#222', fontWeight: '600' },
  linhaTotal: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 4, marginBottom: 0 },
  labelTotal: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  valorTotal: { fontSize: 18, fontWeight: 'bold', color: VERDE },

  confirmarBtn: {
    backgroundColor: VERDE, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4,
  },
  confirmarBtnDesabilitado: { opacity: 0.5 },
  confirmarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  avisoPagamento: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 12 },
});
