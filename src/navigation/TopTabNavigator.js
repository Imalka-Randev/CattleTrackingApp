import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  useColorScheme,
  Vibration,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapScreen from "../screens/MapScreen";
import CattleListScreen from "../screens/CattleListScreen";

import SummaryScreen from "../screens/SummaryScreen";
import CommunityScreen from "../screens/CommunityScreen";

const BUTTON_HEIGHT = 44;
const TABS = ["map", "cattles", "summary", "community"];

function TopTabNavigator() {
  const [activeTab, setActiveTab] = useState("map");
  const [fadeAnim] = useState(new Animated.Value(0));
  const colorScheme = useColorScheme();

  const renderContent = () => {
    // This is where the main screen content is rendered based on the active tab
    if (activeTab === "map") {
      return <MapScreen />;
    } else if (activeTab === "summary") {
      return <SummaryScreen />;
    } else if (activeTab === "cattles") {
      return <CattleListScreen />;
    } else if (activeTab === "community") {
      return <CommunityScreen />;
    }
    return null;
  };

  useEffect(() => {
    // Simple fade animation for content view when switching tabs
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
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
    // Define the icon name AND the component (library) for each tab
    const iconDetails = {
      map: { name: 'map', Component: Ionicons },
      cattles: { name: 'cow', Component: MaterialCommunityIcons },
      summary: { name: 'stats-chart', Component: Ionicons },
      community: { name: 'people', Component: Ionicons }
    }[tabKey];

    const IconComponent = iconDetails.Component;
    const iconName = iconDetails.name;
    const isActive = activeTab === tabKey;

    // Determine icon color based on active state and color scheme
    const iconColor = isActive
      ? '#FFF'
      : (colorScheme === 'dark' ? '#8B4513' : '#27AE60');

    // Determine text style dynamically
    const textStyle = [
      styles.buttonText,
      isActive ? styles.activeText : styles.inactiveText,
      !isActive && colorScheme === 'dark' && styles.darkInactiveText
    ];

    return (
      <TouchableOpacity
        key={tabKey}
        accessible={true}
        accessibilityLabel={`${tabKey} tab`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        style={[
          styles.button,
          isActive ? styles.activeButton : styles.inactiveButton,
          !isActive && colorScheme === 'dark' && styles.darkInactiveButton
        ]}
        onPress={() => handleTabPress(tabKey)}
      >
        <IconComponent
          name={iconName}
          size={18}
          color={iconColor}
          style={{ marginRight: 6 }}
        />
        <Text style={textStyle}>
          {tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  }, [activeTab, colorScheme, handleTabPress]);

  return (
    // Root View container
    <View style={[
      styles.container, // New name for root container style (flex: 1)
      colorScheme === 'dark' && styles.darkContainer
    ]}>
      {/* ScrollView for horizontal scrolling tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tabBarWrapper,
          colorScheme === 'dark' && styles.darkTabBarWrapper
        ]}
        contentContainerStyle={styles.tabContentContainer}
      >
        {TABS.map(renderTabButton)}
      </ScrollView>

      {/* Animated content view */}
      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim },
        colorScheme === 'dark' && styles.darkContent
      ]}>
        {renderContent()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ⭐️ Renamed and clarified root container style
  container: {
    flex: 1,
    backgroundColor: "#FFFDF6",
    // Manually handle Android status bar padding for a full-screen app container
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  // Removed old 'safeArea' and 'darkSafeArea' styles

  tabBarWrapper: {
    maxHeight: BUTTON_HEIGHT + 16,
    backgroundColor: "#FFFDF6",
    borderBottomWidth: 1,
    borderBottomColor: "#E0D7C6",
  },
  darkTabBarWrapper: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#333',
  },
  tabContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  button: {
    flexDirection: 'row',
    height: BUTTON_HEIGHT,
    minWidth: Platform.select({ ios: 100, android: 90 }),
    paddingHorizontal: Platform.select({ ios: 18, android: 12 }),
    borderRadius: BUTTON_HEIGHT / 2,
    marginHorizontal: 4,
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
    whiteSpace: 'nowrap',
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