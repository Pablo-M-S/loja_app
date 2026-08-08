import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMediaUrl } from '../services/api';

const VERDE = '#1C682E';

export default function QuantityModal({ visible, product, onClose, onConfirm }) {
  const [quantidade, setQuantidade] = useState(1);

  if (!product) return null;

  function confirmar() {
    onConfirm(product, quantidade);
    setQuantidade(1);
    onClose();
  }

  function fechar() {
    setQuantidade(1);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={fechar}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={fechar}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <Image
            source={product.imagemUrl ? { uri: getMediaUrl(product.imagemUrl) } : require('../assets/logo.png')}
            style={styles.image}
            resizeMode="cover"
          />
          <Text style={styles.nome}>{product.nome}</Text>
          <Text style={styles.preco}>R$ {Number(product.preco).toFixed(2)}</Text>

          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setQuantidade((q) => Math.max(1, q - 1))}
            >
              <Ionicons name="remove" size={22} color={VERDE} />
            </TouchableOpacity>
            <Text style={styles.quantidade}>{quantidade}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => setQuantidade((q) => q + 1)}>
              <Ionicons name="add" size={22} color={VERDE} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={confirmar}>
            <Text style={styles.confirmText}>
              Adicionar · R$ {(product.preco * quantidade).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  image: { width: 140, height: 140, borderRadius: 16, marginTop: 8, backgroundColor: '#EAF5EC' },
  nome: { fontSize: 18, fontWeight: 'bold', marginTop: 14, textAlign: 'center', color: '#222' },
  preco: { fontSize: 16, color: VERDE, fontWeight: '600', marginTop: 4, marginBottom: 18 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 },
  stepBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: VERDE,
    justifyContent: 'center', alignItems: 'center',
  },
  quantidade: { fontSize: 20, fontWeight: 'bold', minWidth: 30, textAlign: 'center', color: '#222' },
  confirmBtn: { backgroundColor: VERDE, width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
