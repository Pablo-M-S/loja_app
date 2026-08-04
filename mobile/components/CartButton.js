import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';

export default function CartButton() {
  const navigation = useNavigation();
  const { totalItens } = useCart();

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.navigate('Cart')}>
      <Ionicons name="cart-outline" size={26} color="#fff" />
      {totalItens > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItens}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginRight: 16 },
  badge: {
    position: 'absolute', top: -4, right: -8, backgroundColor: '#fff',
    borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#1C682E', fontSize: 11, fontWeight: 'bold' },
});
