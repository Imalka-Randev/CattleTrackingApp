import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  useColorScheme,
  Vibration
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import MapScreen from "../screens/MapScreen";
import CattleListScreen from "../screens/CattleListScreen";

const BUTTON_HEIGHT = 44;

function TopTabNavigator() {
  const [activeTab, setActiveTab] = useState("map");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [indicatorPos] = useState(new Animated.Value(0));
  const colorScheme = useColorScheme();

  const renderContent = () => {
    if (activeTab === "map") {
      return <MapScreen />;
    } else if (activeTab === "summary") {
      return (
        <View style={[
          styles.card,
          colorScheme === 'dark' && styles.darkCard
        ]}>
          <Text style={[
            styles.cardTitle,
            colorScheme === 'dark' && styles.darkText
          ]}>📊 Cattle Summary</Text>
          <Text style={[
            styles.cardText,
            colorScheme === 'dark' && styles.darkSubText
          ]}>Total Cattle: 5</Text>
          <Text style={[
            styles.cardText,
            colorScheme === 'dark' && styles.darkSubText
          ]}>Healthy: 4 | Needs Attention: 1</Text>
        </View>
      );
    } else if (activeTab === "cattles") {
      return <CattleListScreen />;
    }
    return null;
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    const tabIndex = ["map", "cattles", "summary"].indexOf(activeTab);
    Animated.spring(indicatorPos, {
      toValue: tabIndex * (100 + 16),
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const handleTabPress = useCallback((tabKey) => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(10); // Small vibration feedback on Android
    }
    setActiveTab(tabKey);
  }, []);

  const renderTabButton = useCallback((tabKey) => {
    const iconName = {
      map: 'map',
      cattles: 'paw',
      summary: 'stats-chart'
    }[tabKey];
    
    return (
      <TouchableOpacity
        key={tabKey}
        accessible={true}
        accessibilityLabel={`${tabKey} tab`}
        accessibilityRole="button"
        accessibilityState={{ selected: activeTab === tabKey }}
        style={[
          styles.button,
          activeTab === tabKey ? styles.activeButton : styles.inactiveButton,
          colorScheme === 'dark' && activeTab !== tabKey && styles.darkInactiveButton
        ]}
        onPress={() => handleTabPress(tabKey)}
      >
        <Ionicons 
          name={iconName} 
          size={18} 
          color={activeTab === tabKey ? '#FFF' : '#27AE60'} 
          style={{ marginRight: 6 }} 
        />
        <Text
          style={[
            styles.buttonText,
            activeTab === tabKey ? styles.activeText : styles.inactiveText,
            colorScheme === 'dark' && activeTab !== tabKey && styles.darkInactiveText
          ]}
        >
          {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  }, [activeTab, colorScheme]);

  return (
    <SafeAreaView style={[
      styles.safeArea,
      colorScheme === 'dark' && styles.darkSafeArea
    ]}>
      <View style={[
        styles.container,
        colorScheme === 'dark' && styles.darkContainer
      ]}>
        {["map", "cattles", "summary"].map(renderTabButton)}
        <Animated.View style={[
          styles.indicator,
          {
            transform: [{ translateX: indicatorPos }],
            backgroundColor: colorScheme === 'dark' ? '#8B4513' : '#27AE60'
          }
        ]} />
      </View>
      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim },
        colorScheme === 'dark' && styles.darkContent
      ]}>
        {renderContent()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF6",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  darkSafeArea: {
    backgroundColor: '#121212',
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: BUTTON_HEIGHT + 16,
    paddingVertical: 8,
    paddingHorizontal: Platform.select({ ios: 0, android: 8 }),
    backgroundColor: "#FFFDF6",
    borderBottomWidth: 1,
    borderBottomColor: "#E0D7C6",
  },
  darkContainer: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#333',
  },
  button: {
    flexDirection: 'row',
    height: BUTTON_HEIGHT,
    minWidth: Platform.select({ ios: 90, android: 80 }),
    paddingHorizontal: Platform.select({ ios: 24, android: 16 }),
    borderRadius: BUTTON_HEIGHT / 2,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: '#7C4F29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
    shadowColor: '#27AE60',
    shadowOpacity: 0.3,
  },
  inactiveButton: {
    backgroundColor: "#FFFDF6",
    borderColor: "#27AE60",
  },
  darkInactiveButton: {
    backgroundColor: '#1E1E1E',
    borderColor: '#8B4513',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  activeText: {
    color: "#FFFFFF",
  },
  inactiveText: {
    color: "#27AE60",
  },
  darkInactiveText: {
    color: '#8B4513',
  },
  indicator: {
    position: 'absolute',
    height: 3,
    width: 100,
    bottom: -8,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 0,
    backgroundColor: "#FFFDF6",
  },
  darkContent: {
    backgroundColor: '#121212',
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#7C4F29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#27AE60",
    borderColor: "#E0D7C6",
    borderWidth: 1,
  },
  darkCard: {
    backgroundColor: '#1E1E1E',
    borderLeftColor: '#8B4513',
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333333",
  },
  darkText: {
    color: '#F5F5F5',
  },
  cardText: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 4,
  },
  darkSubText: {
    color: '#BDBDBD',
  },
});

export default TopTabNavigator;