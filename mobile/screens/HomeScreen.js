import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, Image, StyleSheet,
  ActivityIndicator, Dimensions, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, getMediaUrl } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCardShelf from '../components/ProductCardShelf';
import QuantityModal from '../components/QuantityModal';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';
const { width } = Dimensions.get('window');

// Ícone padrão para categorias sem símbolo definido ainda.
// Depois trocamos por um mapeamento categoria -> ícone específico.
const ICONE_PADRAO = 'pricetag-outline';

export default function HomeScreen({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [prateleiras, setPrateleiras] = useState([]); // [{ categoria, produtos }]
  const [banners, setBanners] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const { addToCart } = useCart();

  const bannerListRef = useRef(null);
  const bannerIndex = useRef(0);

  useEffect(() => {
    carregarTudo();
  }, []);

  // Carrossel de banners rodando sozinho a cada 8 segundos
  useEffect(() => {
    if (banners.length < 2) return; // não faz sentido rodar com 0 ou 1 banner
    const intervalo = setInterval(() => {
      bannerIndex.current = (bannerIndex.current + 1) % banners.length;
      bannerListRef.current?.scrollToIndex({ index: bannerIndex.current, animated: true });
    }, 8000);
    return () => clearInterval(intervalo);
  }, [banners]);

  async function carregarTudo() {
    setCarregando(true);
    setErro(null);
    try {
      const [cats, listaBanners] = await Promise.all([
        api.getCategories(),
        api.getBanners().catch(() => []) // se der erro nos banners, não trava a Home inteira
      ]);
      setCategorias(cats);
      setBanners(listaBanners);

      // Busca os produtos de cada categoria em paralelo, pra montar as prateleiras
      const resultados = await Promise.all(
        cats.map((cat) =>
          api.getProducts(cat.slug).then((produtos) => ({ categoria: cat, produtos }))
        )
      );

      // Só mostra prateleira de categorias que realmente têm produto
      setPrateleiras(resultados.filter((p) => p.produtos.length > 0));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  function abrirModal(produto) {
    setProdutoSelecionado(produto);
  }

  function confirmarAdicao(produto, quantidade) {
    addToCart(produto, quantidade);
  }

  function irParaCategoria(categoria) {
    navigation.navigate('Category', { categoria });
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
        <TouchableOpacity style={styles.retryBtn} onPress={carregarTudo}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* 1. Banners rotativos (vindos do painel admin) */}
        {banners.length > 0 && (
          <FlatList
            ref={bannerListRef}
            data={banners}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.banners}
            getItemLayout={(_, index) => ({
              length: width * 0.85 + 12, offset: (width * 0.85 + 12) * index, index,
            })}
            renderItem={({ item }) => (
              <Image
                source={{ uri: getMediaUrl(item.imagemUrl) }}
                style={styles.banner}
                resizeMode="cover"
              />
            )}
          />
        )}

        {/* 2. Categorias em lista horizontal */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasRow}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoriaChip}
              onPress={() => irParaCategoria(cat)}
            >
              <Text style={styles.categoriaChipTexto}>{cat.nome}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 3. Prateleiras de produtos por categoria */}
        {prateleiras.map(({ categoria, produtos }) => (
          <View key={categoria.id} style={styles.prateleira}>
            <Text style={styles.secaoTitulo}>{categoria.nome}</Text>
            <FlatList
              data={produtos}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <ProductCardShelf product={item} onAdd={abrirModal} />
              )}
            />
          </View>
        ))}

        {/* 4. Grade final com todas as categorias, 3 por linha */}
        <Text style={styles.secaoTitulo}>Todas as categorias</Text>
        <View style={styles.categoriaGrid}>
          {categorias.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoriaBloco}
              onPress={() => irParaCategoria(cat)}
            >
              <Ionicons name={cat.icone || ICONE_PADRAO} size={26} color="#fff" />
              <Text style={styles.categoriaBlocoTexto} numberOfLines={2}>{cat.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

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
  scrollContent: { paddingBottom: 24 },

  banners: { marginTop: 12, marginBottom: 16, paddingLeft: 12 },
  banner: {
    width: width * 0.85, height: 110, borderRadius: 16, marginRight: 12,
    backgroundColor: VERDE_CLARO,
  },

  categoriasRow: { marginBottom: 16, paddingLeft: 12 },
  categoriaChip: {
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
    marginRight: 10, borderWidth: 1, borderColor: VERDE,
  },
  categoriaChipTexto: { color: VERDE, fontWeight: '600', fontSize: 13 },

  prateleira: { marginBottom: 20, paddingLeft: 12 },
  secaoTitulo: { fontSize: 17, fontWeight: 'bold', color: '#222', marginBottom: 10, paddingLeft: 12 },

  categoriaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, justifyContent: 'flex-start',
  },
  categoriaBloco: {
    width: '30%', aspectRatio: 1, backgroundColor: VERDE, borderRadius: 14,
    margin: '1.5%', justifyContent: 'center', alignItems: 'center', padding: 8,
  },
  categoriaBlocoTexto: {
    color: '#fff', fontWeight: '600', fontSize: 12, textAlign: 'center', marginTop: 6,
  },

  erroTexto: { color: '#c0392b', marginBottom: 12, textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: { backgroundColor: VERDE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: 'bold' },
});
