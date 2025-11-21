import React from 'react';
import { SafeAreaView, StyleSheet, useColorScheme } from 'react-native';
import TopTabNavigator from '../navigation/TopTabNavigator';

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={[styles.safeArea, colorScheme === 'dark' && styles.darkBackground]}>
      <TopTabNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F7FA',
  },
  darkBackground: {
    backgroundColor: '#121212',
  },
});