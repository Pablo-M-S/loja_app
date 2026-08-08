import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMediaUrl } from '../services/api';

const VERDE = '#1C682E';

export default function ProductDetailModal({ visible, product, onClose, onAdd }) {
  if (!product) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Image
              source={product.imagemUrl ? { uri: getMediaUrl(product.imagemUrl) } : require('../assets/logo.png')}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.nome}>{product.nome}</Text>
            <Text style={styles.preco}>R$ {Number(product.preco).toFixed(2)}</Text>

            {product.descricao ? (
              <Text style={styles.descricao}>{product.descricao}</Text>
            ) : (
              <Text style={styles.semDescricao}>Sem descrição cadastrada.</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { onClose(); onAdd(product); }}
          >
            <Text style={styles.addText}>Adicionar ao carrinho</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  image: { width: '100%', height: 220, borderRadius: 16, marginTop: 8, backgroundColor: '#EAF5EC' },
  nome: { fontSize: 20, fontWeight: 'bold', marginTop: 16, color: '#222' },
  preco: { fontSize: 17, color: VERDE, fontWeight: '600', marginTop: 4, marginBottom: 14 },
  descricao: { fontSize: 14, color: '#555', lineHeight: 21, marginBottom: 20 },
  semDescricao: { fontSize: 13, color: '#999', fontStyle: 'italic', marginBottom: 20 },
  addButton: { backgroundColor: VERDE, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  addText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
