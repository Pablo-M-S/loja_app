import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import QuantityModal from '../components/QuantityModal';
import ProductDetailModal from '../components/ProductDetailModal';

const VERDE = '#1C682E';

export default function CategoryScreen({ route, navigation }) {
  const { categoria } = route.params;
  const { addToCart } = useCart();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [produtoQuantidade, setProdutoQuantidade] = useState(null); // abre QuantityModal
  const [produtoDetalhe, setProdutoDetalhe] = useState(null); // abre ProductDetailModal

  useEffect(() => {
    navigation.setOptions({ title: categoria.nome });
    api.getProducts(categoria.slug).then(setProdutos).finally(() => setCarregando(false));
  }, []);

  function confirmarAdicao(produto, quantidade) {
    addToCart(produto, quantidade);
  }

  if (carregando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color={VERDE} /></View>;
  }

  return (
    <>
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.linha}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum produto nessa categoria ainda.</Text>}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAdd={(produto) => setProdutoQuantidade(produto)}
            onPress={(produto) => setProdutoDetalhe(produto)}
          />
        )}
      />

      <QuantityModal
        visible={!!produtoQuantidade}
        product={produtoQuantidade}
        onClose={() => setProdutoQuantidade(null)}
        onConfirm={confirmarAdicao}
      />

      <ProductDetailModal
        visible={!!produtoDetalhe}
        product={produtoDetalhe}
        onClose={() => setProdutoDetalhe(null)}
        onAdd={(produto) => setProdutoQuantidade(produto)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { padding: 16 },
  linha: { justifyContent: 'space-between' },
  vazio: { textAlign: 'center', color: '#888', marginTop: 40 },
});
