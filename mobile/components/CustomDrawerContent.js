import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERDE = '#1C682E';

export default function CustomDrawerContent(props) {
  async function handleLogout() {
    await AsyncStorage.removeItem('cliente');
    props.navigation.closeDrawer();
    props.navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Register' }] });
  }

  return (
    <View style={{ flex: 1, backgroundColor: VERDE }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: VERDE, flex: 1 }}>
        <View style={styles.header}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.menuBox}>
          <DrawerItem
            label="Categorias"
            labelStyle={styles.label}
            icon={({ size }) => <Ionicons name="grid-outline" size={size} color={VERDE} />}
            onPress={() => props.navigation.navigate('Categorias')}
          />
          <DrawerItem
            label="Meus Dados"
            labelStyle={styles.label}
            icon={({ size }) => <Ionicons name="person-outline" size={size} color={VERDE} />}
            onPress={() => props.navigation.navigate('Register')}
          />
        </View>
      </DrawerContentScrollView>
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 24, alignItems: 'center' },
  logo: { width: 120, height: 60 },
  menuBox: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 16, paddingVertical: 8 },
  label: { color: '#222', fontWeight: '600' },
  logout: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
