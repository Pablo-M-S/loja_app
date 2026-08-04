import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, Image, StyleSheet,
  ActivityIndicator, Dimensions, TouchableOpacity
} from 'react-native';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import QuantityModal from '../components/QuantityModal';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';
const { width } = Dimensions.get('window');

const BANNERS = [
  { id: '1', cor: VERDE, titulo: 'Ofertas da semana' },
  { id: '2', cor: '#2E8B4E', titulo: 'Novidades em Grãos' },
  { id: '3', cor: '#155023', titulo: 'Frete grátis acima de R$100' },
];

export default function HomeScreen({ navigation }) {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    carregarProdutos();
  }, []);

  function carregarProdutos() {
    setCarregando(true);
    api.getProducts()
      .then(setProdutos)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }

  function abrirModal(produto) {
    setProdutoSelecionado(produto);
  }

  function confirmarAdicao(produto, quantidade) {
    addToCart(produto, quantidade);
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
        <TouchableOpacity style={styles.retryBtn} onPress={carregarProdutos}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.linha}
        contentContainerStyle={styles.listaContent}
        ListHeaderComponent={
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.banners}>
              {BANNERS.map((banner) => (
                <View key={banner.id} style={[styles.banner, { backgroundColor: banner.cor }]}>
                  <Text style={styles.bannerTexto}>{banner.titulo}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.secaoTitulo}>Produtos</Text>
          </>
        }
        renderItem={({ item }) => <ProductCard product={item} onAdd={abrirModal} />}
        ListEmptyComponent={
          <Text style={styles.vazio}>Nenhum produto encontrado.</Text>
        }
      />

      <QuantityModal
        visible={!!produtoSelecionado}
        product={produtoSelecionado}
        onClose={() => setProdutoSelecionado(null)}
        onConfirm={confirmarAdicao}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VERDE_CLARO },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VERDE_CLARO },
  listaContent: { paddingHorizontal: 12, paddingBottom: 24 },
  linha: { justifyContent: 'space-between' },
  banners: { marginTop: 12, marginBottom: 16 },
  banner: {
    width: width * 0.75, height: 100, borderRadius: 16, marginRight: 12,
    justifyContent: 'flex-end', padding: 14,
  },
  bannerTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secaoTitulo: { fontSize: 17, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  vazio: { textAlign: 'center', marginTop: 40, color: '#666' },
  erroTexto: { color: '#c0392b', marginBottom: 12, textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: { backgroundColor: VERDE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: 'bold' },
});
