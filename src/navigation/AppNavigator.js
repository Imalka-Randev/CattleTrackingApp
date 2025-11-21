// src/navigation/AppNavigator.js

import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabNavigator from './BottomTabNavigator';
import CowDetailsScreen from '../screens/CowDetailsScreen'; // ✅ Corrected path

import { UserContext } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native'; // for navigation hook
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user } = useContext(UserContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
           
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />
          <Stack.Screen
            name="CowDetails"
            component={CowDetailsScreen}
            options={{ presentation: 'modal' }} // Optional: overlap effect
          />
          
        </>
      ) : (
        <>
        
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
