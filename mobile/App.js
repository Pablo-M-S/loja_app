import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CartProvider } from './context/CartContext';
import SplashScreen from './screens/SplashScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen'; // agora é a tela "Categorias" do menu
import CategoryScreen from './screens/CategoryScreen';
import CartScreen from './screens/CartScreen';
import CustomDrawerContent from './components/CustomDrawerContent';
import CartButton from './components/CartButton';

const VERDE = '#1C682E';
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Categorias"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: VERDE },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: VERDE,
        drawerActiveBackgroundColor: '#EAF5EC',
      }}
    >
      <Drawer.Screen
        name="Categorias"
        component={HomeScreen}
        options={{ title: 'Minha Loja', headerRight: () => <CartButton /> }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CartProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator initialRouteName="Splash">
            <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Cadastro' }} />
            <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
            <Stack.Screen
              name="Category"
              component={CategoryScreen}
              options={{ title: 'Produtos', headerStyle: { backgroundColor: VERDE }, headerTintColor: '#fff' }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ title: 'Carrinho', headerStyle: { backgroundColor: VERDE }, headerTintColor: '#fff' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </GestureHandlerRootView>
  );
}
