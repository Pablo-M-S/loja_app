import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';
const LARANJA = '#B5651D';

function enderecoValido(endereco) {
  if (!endereco) return false;
  return !!(endereco.rua && endereco.numero && endereco.cidade && endereco.estado);
}

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeFromCart, totalPreco } = useCart();
  const [temEndereco, setTemEndereco] = useState(false);
  const [verificandoEndereco, setVerificandoEndereco] = useState(true);

  // Roda toda vez que a tela do carrinho ganha foco, para refletir
  // um endereço recém-salvo no Perfil sem precisar sair e voltar do zero.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function verificarEndereco() {
        setVerificandoEndereco(true);
        try {
          const salvo = await AsyncStorage.getItem('cliente');
          if (!salvo) {
            if (ativo) {
              setTemEndereco(false);
              setVerificandoEndereco(false);
            }
            return;
          }
          const clienteLocal = JSON.parse(salvo);
          const cliente = await api.getCustomer(clienteLocal.id);
          if (ativo) {
            setTemEndereco(enderecoValido(cliente.endereco));
          }
        } catch (erro) {
          if (ativo) setTemEndereco(false);
        } finally {
          if (ativo) setVerificandoEndereco(false);
        }
      }

      verificarEndereco();
      return () => { ativo = false; };
    }, [])
  );

  function handleFinalizarCompra() {
    if (!temEndereco) {
      Alert.alert(
        'Endereço necessário',
        'Você precisa cadastrar um endereço de entrega antes de finalizar a compra.',
        [{ text: 'Ir para Meus Dados', onPress: () => navigation.navigate('Profile') }]
      );
      return;
    }
    // Checkout em si ainda não implementado (pendência separada do handoff).
    Alert.alert('Quase lá', 'O checkout completo ainda está sendo desenvolvido. Em breve!');
  }

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

        {!verificandoEndereco && !temEndereco && (
          <View style={styles.avisoEndereco}>
            <Ionicons name="alert-circle-outline" size={16} color={LARANJA} />
            <Text style={styles.avisoEnderecoTexto}>
              Cadastre um endereço de entrega para continuar
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            !verificandoEndereco && !temEndereco && styles.checkoutBtnAviso,
          ]}
          onPress={handleFinalizarCompra}
          disabled={verificandoEndereco}
        >
          <Text style={styles.checkoutText}>
            {verificandoEndereco
              ? 'Verificando endereço...'
              : temEndereco
              ? 'Finalizar compra'
              : 'Adicionar endereço para continuar'}
          </Text>
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

  avisoEndereco: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBEFE4',
    borderRadius: 10, padding: 8, marginTop: 10, gap: 6,
  },
  avisoEnderecoTexto: { color: LARANJA, fontSize: 12, flex: 1 },

  checkoutBtn: {
    backgroundColor: VERDE, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 14,
  },
  checkoutBtnAviso: { backgroundColor: LARANJA },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  vazioContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VERDE_CLARO, padding: 24 },
  vazioTexto: { fontSize: 16, color: '#666', marginTop: 12, marginBottom: 20 },
  voltarBtn: { backgroundColor: VERDE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  voltarText: { color: '#fff', fontWeight: 'bold' },
});
