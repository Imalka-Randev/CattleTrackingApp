import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons'; 

import HomeScreen from '../screens/HomeScreen';
import AddCollarScreen from '../screens/AddCollarScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add Collar') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#27AE60', // Changed to your app's primary green
        tabBarInactiveTintColor: '#333333', // Charcoal Gray for inactive elements
        tabBarStyle: {
          paddingVertical: 6,
          height: 80,
          backgroundColor: '#FFFDF6', // Cream White for tab bar background
          borderTopColor: '#E0D7C6', // Light Beige for subtle border
          shadowColor: '#7C4F29', // Earth Brown for shadow
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          color: '#333333', // Charcoal Gray for label text
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Add Collar" component={AddCollarScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}