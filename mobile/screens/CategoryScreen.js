import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { api } from '../services/api';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';

export default function CategoryScreen({ route, navigation }) {
  const { categoria } = route.params;
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: categoria.nome });
    api.getProducts(categoria.slug).then(setProdutos).finally(() => setCarregando(false));
  }, []);

  if (carregando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color={VERDE} /></View>;
  }

  return (
    <FlatList
      data={produtos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text style={styles.vazio}>Nenhum produto nessa categoria ainda.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.estoque}>{item.estoque > 0 ? `${item.estoque} em estoque` : 'Fora de estoque'}</Text>
          </View>
          <Text style={styles.preco}>R$ {Number(item.preco).toFixed(2)}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: VERDE_CLARO, borderRadius: 8, padding: 14, marginBottom: 10 },
  nome: { fontSize: 15, fontWeight: '600', color: '#222' },
  estoque: { fontSize: 12, color: '#888', marginTop: 4 },
  preco: { fontSize: 16, fontWeight: 'bold', color: VERDE },
  vazio: { textAlign: 'center', color: '#888', marginTop: 40 }
});
