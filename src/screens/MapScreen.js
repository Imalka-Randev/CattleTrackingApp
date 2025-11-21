import React, { useEffect, useState, useRef, useContext, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

const COLOR_KEY = 'cattleColors';
const LAST_MAP_REGION_KEY = 'lastMapRegion';
const POLLING_INTERVAL = 30000; // 30 seconds instead of 100ms
const API_BASE_URL = 'http://100.79.26.84:8000';

// Coordinate validation function
const isValidCoordinate = (lat, lon) => {
  return lat && lon && 
         !isNaN(lat) && !isNaN(lon) &&
         lat >= -90 && lat <= 90 &&
         lon >= -180 && lon <= 180;
};

// Default colors for markers
const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

export default function MapScreen() {
  const { user } = useContext(UserContext);
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [cattleData, setCattleData] = useState([]);
  const [markerColors, setMarkerColors] = useState({});
  const [mapType, setMapType] = useState('satellite');
  const [showMapTypeOptions, setShowMapTypeOptions] = useState(false);
  const [region, setRegion] = useState(null);
  const [hasAutoFocused, setHasAutoFocused] = useState(false);

  const mapRef = useRef(null);
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const regionChangeTimeoutRef = useRef(null);

  const animateToCattle = useCallback((data) => {
    const coords = data
      .map(item => {
        if (!item.latest_record) return null;
        const lat = parseFloat(item.latest_record.latitude);
        const lon = parseFloat(item.latest_record.longitude);
        return isValidCoordinate(lat, lon) ? { latitude: lat, longitude: lon } : null;
      })
      .filter(Boolean);
    if (coords.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, bottom: 60, left: 40, right: 40 },
        animated: true,
      });
    }
  }, []);

  const assignDefaultColors = useCallback((cattleList, existingColors) => {
    const newColors = { ...existingColors };
    let colorIndex = 0;
    
    cattleList.forEach(cow => {
      if (!newColors[cow.id]) {
        newColors[cow.id] = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length];
        colorIndex++;
      }
    });
    
    return newColors;
  }, []);

  const fetchMergedCattleData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      
      const [genericRes, latestRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/cattle/user/${userId}`).catch(err => {
          console.error('Error fetching cattle data:', err);
          return { data: { data: [] } };
        }),
        axios.get(`${API_BASE_URL}/api/cattle/lastdata/latest/${userId}`).catch(err => {
          console.error('Error fetching latest data:', err);
          return { data: [] };
        })
      ]);

      // Add response validation
      if (!genericRes || !latestRes) {
        throw new Error('Network error - no response received');
      }

      const general = genericRes.data?.data || [];
      const latest = latestRes.data || [];

      console.log('General cattle data:', general.length);
      console.log('Latest location data:', latest.length);

      // Assign default colors to any cattle that don't have colors
      const updatedColors = assignDefaultColors(general, markerColors);
      if (Object.keys(updatedColors).length !== Object.keys(markerColors).length) {
        setMarkerColors(updatedColors);
        // Save the updated colors to AsyncStorage
        try {
          await AsyncStorage.setItem(COLOR_KEY, JSON.stringify(updatedColors));
        } catch (e) {
          console.error('Error saving marker colors:', e);
        }
      }

      // Optimize data processing - create a Map for O(1) lookups
      const latestMap = new Map();
      latest.forEach(item => {
        if (item.collar_id) {
          latestMap.set(item.collar_id, item);
        }
      });

      console.log('Latest data map:', Array.from(latestMap.keys()));

      const merged = general
        .map(cow => {
          const match = latestMap.get(cow.id);
          console.log(`Processing cow ${cow.id} (${cow.cattle_name}):`, match ? 'has location data' : 'no location data');
          
          // Return cattle data even if no latest location or color
          // We'll handle the missing location in the marker rendering
          return {
            ...cow,
            latest_record: match?.latest_record || null,
            collar_id: cow.id,
            markerColor: updatedColors[cow.id] || DEFAULT_COLORS[0],
          };
        })
        .filter(Boolean);

      console.log('Final merged data:', merged.length, 'cattle');
      merged.forEach(cow => {
        console.log(`- ${cow.cattle_name} (${cow.id}):`, cow.latest_record ? 'has location' : 'no location');
      });

      setCattleData(merged);

      // Auto-focus only on first app load and only if region is not already restored
      if (!hasAutoFocused && !region && merged.length > 0) {
        // Only focus on cattle that have valid coordinates
        const cattleWithLocations = merged.filter(cow => 
          cow.latest_record && 
          isValidCoordinate(
            parseFloat(cow.latest_record.latitude), 
            parseFloat(cow.latest_record.longitude)
          )
        );
        if (cattleWithLocations.length > 0) {
          animateToCattle(cattleWithLocations);
          setHasAutoFocused(true);
        }
      }
    } catch (err) {
      console.error('Data fetch error:', err.message);
    } finally {
      // Always set loading to false after the first successful data fetch
      setLoading(false);
    }
  }, [userId, markerColors, hasAutoFocused, region, animateToCattle, assignDefaultColors]);

  useEffect(() => {
    loadMarkerColors();
    loadLastRegion();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        // Show loader only on initial load
        fetchMergedCattleData(true);
        const interval = setInterval(() => fetchMergedCattleData(false), POLLING_INTERVAL);
        
        return () => {
          clearInterval(interval);
        };
      }
    }, [userId, fetchMergedCattleData])
  );

  const loadMarkerColors = async () => {
    try {
      const savedColors = await AsyncStorage.getItem(COLOR_KEY);
      if (savedColors) {
        setMarkerColors(JSON.parse(savedColors));
      }
    } catch (e) {
      console.error('Error loading marker colors:', e);
    }
  };

  const loadLastRegion = async () => {
    try {
      const savedRegion = await AsyncStorage.getItem(LAST_MAP_REGION_KEY);
      if (savedRegion) {
        setRegion(JSON.parse(savedRegion));
      }
    } catch (e) {
      console.error('Error loading last region:', e);
    }
  };

  const saveCurrentRegion = async (newRegion) => {
    try {
      await AsyncStorage.setItem(LAST_MAP_REGION_KEY, JSON.stringify(newRegion));
    } catch (e) {
      console.error('Error saving region:', e);
    }
  };

  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    
    // Debounce the save operation
    if (regionChangeTimeoutRef.current) {
      clearTimeout(regionChangeTimeoutRef.current);
    }
    
    regionChangeTimeoutRef.current = setTimeout(() => {
      saveCurrentRegion(newRegion);
    }, 1000);
  };

  const mapTypeIcons = {
    standard: { icon: 'map', library: 'MaterialCommunityIcons' },
    satellite: { icon: 'satellite', library: 'FontAwesome5' },
    hybrid: { icon: 'map-legend', library: 'MaterialCommunityIcons' },
  };

  const renderIcon = (type, color, size) => {
    const { icon, library } = mapTypeIcons[type] || {};
    if (library === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={icon} size={size} color={color} />;
    } else if (library === 'FontAwesome5') {
      return <FontAwesome5 name={icon} size={size} color={color} />;
    }
    return null;
  };

  const otherMapTypes = Object.keys(mapTypeIcons).filter(t => t !== mapType);

  return (
    <SafeAreaView style={[styles.safeArea, colorScheme === 'dark' && styles.darkBackground]}>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          mapType={mapType}
          showsUserLocation
          showsMyLocationButton
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
          customMapStyle={colorScheme === 'dark' ? darkMapStyle : []}
        >
          {cattleData.map((item, index) => {
            // Only render markers for cattle that have valid location data
            if (!item.latest_record) return null;
            
            const lat = parseFloat(item.latest_record.latitude);
            const lon = parseFloat(item.latest_record.longitude);
            if (!isValidCoordinate(lat, lon)) return null;

            return (
              <Marker
                key={item.id || index}
                coordinate={{ latitude: lat, longitude: lon }}
                pinColor={item.markerColor || 'red'}
                title={`🐮 ${item.cattle_name || 'Unnamed'} (ID: ${item.id})`}
                description={`Temp: ${item.latest_record.body_temperature || 'N/A'}°C\nBattery: ${item.latest_record.battery_voltage || 'N/A'}V`}
                onCalloutPress={() => navigation.navigate('CowDetails', { cow: item })}
              >
                <View style={[styles.markerIconWrapper, { backgroundColor: item.markerColor }]}>
                  <MaterialCommunityIcons name="cow" size={20} color="#fff" />
                </View>
              </Marker>
            );
          })}
        </MapView>

        <View style={styles.mapTypeButtonContainer} pointerEvents="box-none">
          {showMapTypeOptions &&
            otherMapTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.mapTypePopupButton}
                onPress={() => {
                  setMapType(type);
                  setShowMapTypeOptions(false);
                }}
                accessibilityLabel={`Switch to ${type} map`}
                accessibilityRole="button"
              >
                {renderIcon(type, '#4F8EF7', 20)}
              </TouchableOpacity>
            ))}
          <TouchableOpacity
            style={styles.mapTypeMainButton}
            onPress={() => setShowMapTypeOptions(prev => !prev)}
            accessibilityLabel="Change map type"
            accessibilityRole="button"
          >
            {renderIcon(mapType, '#fff', 26)}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => animateToCattle(cattleData)}
            accessibilityLabel="Focus on cattle locations"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="target" size={28} color="#4F8EF7" />
          </TouchableOpacity>
        </View>

        {!loading && cattleData.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You don't have any cattle registered yet.</Text>
            <Text style={styles.emptySubText}>Please add your cattle by clicking the add collar.</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#4F8EF7" />
          </View>
        )}
      </View>
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
  mapTypeButtonContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 20,
    alignItems: 'center',
  },
  mapTypeMainButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginBottom: 8,
  },
  mapTypePopupButton: {
    backgroundColor: '#fff',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4F8EF7',
    elevation: 3,
  },
  refreshButton: {
    backgroundColor: '#fff',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    borderWidth: 2,
    borderColor: '#4F8EF7',
  },
  emptyContainer: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerIconWrapper: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];