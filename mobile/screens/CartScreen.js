import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeFromCart, totalPreco } = useCart();

  function renderItem({ item }) {
    return (
      <View style={styles.item}>
        <Image
          source={item.imagemUrl ? { uri: item.imagemUrl } : require('../assets/logo.png')}
          style={styles.imagem}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.nome} numberOfLines={2}>{item.nome}</Text>
          <Text style={styles.preco}>R$ {Number(item.preco).toFixed(2)}</Text>

          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateQuantity(item.id, item.quantidade - 1)}
            >
              <Ionicons name="remove" size={18} color={VERDE} />
            </TouchableOpacity>
            <Text style={styles.quantidade}>{item.quantidade}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => updateQuantity(item.id, item.quantidade + 1)}
            >
              <Ionicons name="add" size={18} color={VERDE} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.remover} onPress={() => removeFromCart(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#c0392b" />
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.vazioContainer}>
        <Ionicons name="cart-outline" size={64} color={VERDE} />
        <Text style={styles.vazioTexto}>Seu carrinho está vazio</Text>
        <TouchableOpacity style={styles.voltarBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.voltarText}>Ver produtos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.lista}
      />

      <View style={styles.resumo}>
        <View style={styles.linhaResumo}>
          <Text style={styles.labelResumo}>Subtotal</Text>
          <Text style={styles.valorResumo}>R$ {totalPreco.toFixed(2)}</Text>
        </View>
        <View style={styles.linhaResumo}>
          <Text style={styles.labelResumo}>Frete</Text>
          <Text style={styles.valorResumoMuted}>A calcular</Text>
        </View>
        <View style={[styles.linhaResumo, styles.linhaTotal]}>
          <Text style={styles.labelTotal}>Total</Text>
          <Text style={styles.valorTotal}>R$ {totalPreco.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutBtn} disabled>
          <Text style={styles.checkoutText}>Finalizar compra (em breve)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VERDE_CLARO },
  lista: { padding: 12 },
  item: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 10,
    marginBottom: 10, alignItems: 'center', elevation: 1,
  },
  imagem: { width: 60, height: 60, borderRadius: 10, backgroundColor: VERDE_CLARO },
  info: { flex: 1, marginLeft: 12 },
  nome: { fontSize: 14, fontWeight: '600', color: '#222' },
  preco: { fontSize: 13, color: VERDE, fontWeight: '600', marginTop: 2, marginBottom: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.2, borderColor: VERDE,
    justifyContent: 'center', alignItems: 'center',
  },
  quantidade: { fontSize: 15, fontWeight: 'bold', minWidth: 20, textAlign: 'center', color: '#222' },
  remover: { padding: 8 },

  resumo: {
    backgroundColor: '#fff', padding: 18, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 8,
  },
  linhaResumo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  labelResumo: { fontSize: 14, color: '#666' },
  valorResumo: { fontSize: 14, color: '#222', fontWeight: '600' },
  valorResumoMuted: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  linhaTotal: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 4 },
  labelTotal: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  valorTotal: { fontSize: 18, fontWeight: 'bold', color: VERDE },

  checkoutBtn: {
    backgroundColor: '#B5C9BB', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 14,
  },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  vazioContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VERDE_CLARO, padding: 24 },
  vazioTexto: { fontSize: 16, color: '#666', marginTop: 12, marginBottom: 20 },
  voltarBtn: { backgroundColor: VERDE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  voltarText: { color: '#fff', fontWeight: 'bold' },
});
