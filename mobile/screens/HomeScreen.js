// screens/HomeScreen.js
// Tela principal: mostra as categorias da loja em formato de grade.

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { api } from '../services/api';

// Ícones simples por slug de categoria (emoji, só pra dar identidade visual
// sem depender de biblioteca de ícones por enquanto)
const ICONES = {
  'graos': '🌾',
  'farinhas': '🌽',
  'temperos': '🌶️',
  'frutas-secas': '🍇',
  'casa': '🏠',
  'cuidados-pessoais': '🧴',
  'sem-gluten': '🌿'
};

export default function HomeScreen({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.getCategories()
      .then(setCategorias)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.textoErro}>Não foi possível carregar as categorias.</Text>
        <Text style={styles.textoErroDetalhe}>{erro}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Categorias</Text>
      <FlatList
        data={categorias}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.linha}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cartao}
            onPress={() => navigation.navigate('Category', { categoria: item })}
          >
            <Text style={styles.icone}>{ICONES[item.slug] || '🛒'}</Text>
            <Text style={styles.nomeCategoria}>{item.nome}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  linha: { justifyContent: 'space-between' },
  cartao: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12
  },
  icone: { fontSize: 32, marginBottom: 8 },
  nomeCategoria: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  textoErro: { fontSize: 16, fontWeight: '600', color: '#dc2626', marginBottom: 8 },
  textoErroDetalhe: { fontSize: 13, color: '#888', textAlign: 'center' }
});
