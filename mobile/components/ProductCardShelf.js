import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMediaUrl } from '../services/api';

const VERDE = '#1C682E';

export default function ProductCardShelf({ product, onAdd }) {
  return (
    <View style={styles.card}>
      <Image
        source={product.imagemUrl ? { uri: getMediaUrl(product.imagemUrl) } : require('../assets/logo.png')}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={2}>{product.nome}</Text>
        <Text style={styles.preco}>R$ {Number(product.preco).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => onAdd(product)}>
        <Ionicons name="add" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 130, backgroundColor: '#fff', borderRadius: 14, marginRight: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, overflow: 'hidden',
  },
  image: { width: '100%', height: 90, backgroundColor: '#EAF5EC' },
  info: { padding: 8 },
  nome: { fontSize: 12, fontWeight: '600', color: '#222', minHeight: 30 },
  preco: { fontSize: 13, fontWeight: 'bold', color: VERDE, marginTop: 4 },
  addButton: {
    position: 'absolute', right: 6, top: 68, backgroundColor: VERDE,
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    elevation: 3,
  },
});
