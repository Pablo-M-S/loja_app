import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const VERDE = '#1C682E';

export default function ProductCard({ product, onAdd }) {
  return (
    <View style={styles.card}>
      <Image
        source={product.imagemUrl ? { uri: product.imagemUrl } : require('../assets/logo.png')}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={2}>{product.nome}</Text>
        <Text style={styles.preco}>R$ {Number(product.preco).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => onAdd(product)}>
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, overflow: 'hidden',
  },
  image: { width: '100%', height: 110, backgroundColor: '#EAF5EC' },
  info: { padding: 10 },
  nome: { fontSize: 13, fontWeight: '600', color: '#222', minHeight: 34 },
  preco: { fontSize: 15, fontWeight: 'bold', color: VERDE, marginTop: 4 },
  addButton: {
    position: 'absolute', right: 8, top: 88, backgroundColor: VERDE,
    width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center',
    elevation: 3,
  },
});
