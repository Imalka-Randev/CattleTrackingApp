import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { UserContext } from '../context/UserContext'; // ✅ Import context

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const { setUser } = useContext(UserContext); // 👈 get setUser from context

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {() => <LoginScreen onLogin={(user) => setUser(user)} />}
      </Stack.Screen>
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}