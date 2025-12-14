// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabNavigator from './BottomTabNavigator';
import CowDetailsScreen from '../screens/CowDetailsScreen';
import FenceTestMapScreen from '../screens/FenceTestMapScreen';

import { UserContext } from '../context/UserContext';

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
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="FenceTestMap" component={FenceTestMapScreen} />
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