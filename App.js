// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/context/UserContext';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const toastConfig = {
  custom_error: ({ text1, text2, props }) => (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.card}>
        <MaterialCommunityIcons
          name={props.iconName || 'wifi-off'}
          size={48}
          color="#FF3B30"
          style={{ marginBottom: 12 }}
        />
        <Text style={styles.title}>{text1}</Text>
        <Text style={styles.subtitle}>{text2}</Text>
      </View>
    </View>
  ),
};

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    height: height,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  card: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});