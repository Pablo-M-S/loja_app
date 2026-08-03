// screens/SplashScreen.js
// Primeira tela que o cliente vê ao abrir o app: logo da empresa.
// Depois de um tempo (ou ao carregar o cliente salvo), navega
// automaticamente para Home ou Register.

import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    async function verificarCliente() {
      const clienteSalvo = await AsyncStorage.getItem('cliente');

      setTimeout(() => {
        if (clienteSalvo) {
          navigation.replace('Home');
        } else {
          navigation.replace('Register');
        }
      }, 1500); // tempo mínimo de exibição da splash
    }

    verificarCliente();
  }, []);

  return (
    <View style={styles.container}>
      {/* Troque o require abaixo pela logo real da empresa quando tiver o arquivo */}
      <Image
        source={require('../assets/logo-placeholder.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 200,
    height: 200
  }
});
