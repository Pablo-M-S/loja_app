import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const VERDE = '#1C682E';
const VERDE_CLARO = '#EAF5EC';

const ICONES = {
  'graos': '🌾', 'farinhas': '🌽', 'temperos': '🌶️',
  'frutas-secas': '🍇', 'casa': '🏠', 'cuidados-pessoais': '🧴', 'sem-gluten': '🌿'
};

export default function HomeScreen({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mostrarPopupCadastro, setMostrarPopupCadastro] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategorias).catch((e) => setErro(e.message)).finally(() => setCarregando(false));
    verificarSeDeveMostrarPopup();
  }, []);

  async function verificarSeDeveMostrarPopup() {
    const clienteSalvo = await AsyncStorage.getItem('cliente');
    if (!clienteSalvo) setMostrarPopupCadastro(true);
  }

  function irParaCadastro() {
    setMostrarPopupCadastro(false);
    navigation.navigate('Register');
  }

  if (carregando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color={VERDE} /></View>;
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
          <TouchableOpacity style={styles.cartao} onPress={() => navigation.navigate('Category', { categoria: item })}>
            <Text style={styles.icone}>{ICONES[item.slug] || '🛒'}</Text>
            <Text style={styles.nomeCategoria}>{item.nome}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={mostrarPopupCadastro} transparent animationType="fade" onRequestClose={() => setMostrarPopupCadastro(false)}>
        <View style={styles.fundoModal}>
          <View style={styles.cartaoModal}>
            <TouchableOpacity style={styles.botaoFechar} onPress={() => setMostrarPopupCadastro(false)}>
              <Text style={styles.textoFechar}>✕</Text>
            </TouchableOpacity>
            <Image source={require('../assets/logo.png')} style={styles.logoModal} resizeMode="contain" />
            <Text style={styles.tituloModal}>Crie sua conta</Text>
            <Text style={styles.subtituloModal}>Cadastre-se para acompanhar seus pedidos e calcular o frete para o seu endereço.</Text>
            <TouchableOpacity style={styles.botaoCadastrar} onPress={irParaCadastro}>
              <Text style={styles.textoBotaoCadastrar}>Cadastrar agora</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMostrarPopupCadastro(false)}>
              <Text style={styles.textoContinuarSemCadastro}>Continuar navegando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: VERDE },
  linha: { justifyContent: 'space-between' },
  cartao: { width: '48%', backgroundColor: VERDE_CLARO, borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 12 },
  icone: { fontSize: 32, marginBottom: 8 },
  nomeCategoria: { fontSize: 15, fontWeight: '600', textAlign: 'center', color: VERDE },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  textoErro: { fontSize: 16, fontWeight: '600', color: '#dc2626', marginBottom: 8 },
  textoErroDetalhe: { fontSize: 13, color: '#888', textAlign: 'center' },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  cartaoModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' },
  botaoFechar: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: VERDE_CLARO, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  textoFechar: { fontSize: 16, color: VERDE, fontWeight: 'bold' },
  logoModal: { width: 80, height: 80, marginBottom: 12, marginTop: 8 },
  tituloModal: { fontSize: 19, fontWeight: 'bold', color: VERDE, marginBottom: 8 },
  subtituloModal: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 20 },
  botaoCadastrar: { backgroundColor: VERDE, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12 },
  textoBotaoCadastrar: { color: '#fff', fontSize: 16, fontWeight: '600' },
  textoContinuarSemCadastro: { color: VERDE, fontSize: 14, fontWeight: '500' }
});