import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { api, getMediaUrl } from '../services/api';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';

const STATUS_LABEL = {
  aguardando_pagamento: 'Aguardando pagamento',
  em_preparo: 'Em preparo',
  saiu_para_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
};

const STATUS_COR = {
  aguardando_pagamento: '#e0a800',
  em_preparo: '#1C682E',
  saiu_para_entrega: '#2980b9',
  entregue: '#27ae60',
  cancelado: '#c0392b'
};

export default function OrdersScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregarPedidos = useCallback(async () => {
    setErro(null);
    try {
      const salvo = await AsyncStorage.getItem('cliente');
      if (!salvo) throw new Error('Cliente não encontrado. Faça login novamente.');
      const cliente = JSON.parse(salvo);

      const lista = await api.getPedidosCliente(cliente.id);
      setPedidos(lista);
    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPedidos();
    }, [carregarPedidos])
  );

  function aoAtualizar() {
    setAtualizando(true);
    carregarPedidos();
  }

  function renderPedido({ item: pedido }) {
    const primeiraImagem = pedido.itens.find((i) => i.imagemUrl)?.imagemUrl;

    return (
      <View style={styles.card}>
        <View style={styles.linhaTopo}>
          <Text style={styles.numeroPedido}>Pedido #{pedido.numero}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COR[pedido.status] || '#888' }]}>
            <Text style={styles.statusTexto}>{STATUS_LABEL[pedido.status] || pedido.status}</Text>
          </View>
        </View>

        <Text style={styles.data}>
          {new Date(pedido.criadoEm).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </Text>

        <View style={styles.linhaConteudo}>
          {primeiraImagem ? (
            <Image source={{ uri: getMediaUrl(primeiraImagem) }} style={styles.imagem} />
          ) : (
            <View style={[styles.imagem, styles.imagemVazia]} />
          )}

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.itensResumo} numberOfLines={2}>
              {pedido.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}
            </Text>
            <Text style={styles.total}>R$ {pedido.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={VERDE} />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erroTexto}>{erro}</Text>
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vazioTexto}>Você ainda não fez nenhum pedido.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      data={pedidos}
      keyExtractor={(item) => item.id}
      renderItem={renderPedido}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} colors={[VERDE]} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VERDE_CLARO },
  conteudo: { padding: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  erroTexto: { color: '#c0392b', textAlign: 'center' },
  vazioTexto: { color: '#888', textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 1,
  },
  linhaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  numeroPedido: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  data: { fontSize: 12, color: '#888', marginBottom: 10 },

  linhaConteudo: { flexDirection: 'row', alignItems: 'center' },
  imagem: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#f0f0f0' },
  imagemVazia: { backgroundColor: '#eee' },
  itensResumo: { fontSize: 13, color: '#444', marginBottom: 6 },
  total: { fontSize: 15, fontWeight: 'bold', color: VERDE },
});
