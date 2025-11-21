// src/context/UserContext.js
import React, { createContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // ✅ login() function that stores token and sets user globally
  const login = async (token, userData) => {
    try {
      await AsyncStorage.setItem('@auth_token', token);
      setUser(userData);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  };

  // ✅ logout() function clears everything
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      setUser(null);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};