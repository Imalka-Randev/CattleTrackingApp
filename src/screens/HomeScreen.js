import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import TopTabNavigator from '../navigation/TopTabNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView 
      style={[styles.safeArea, colorScheme === 'dark' && styles.darkBackground]}
      // ✅ FIX: Explicitly set edges to exclude 'bottom'.
      edges={['top', 'left', 'right']} 
    >
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