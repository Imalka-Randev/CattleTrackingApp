// src/screens/MapScreen.js
import React, { useEffect, useState, useRef, useContext, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import api from '../api/apiClient';

const POLLING_INTERVAL = 30000; // 30s
const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

const isValidCoordinate = (lat, lon) => {
  if (lat == null || lon == null) return false;
  const nlat = Number(lat);
  const nlon = Number(lon);
  // Filter out 0,0 as it's likely invalid/default
  if (Math.abs(nlat) < 0.0001 && Math.abs(nlon) < 0.0001) return false;
  return !Number.isNaN(nlat) && nlat >= -90 && nlat <= 90 && nlon >= -180 && nlon <= 180;
};

export default function MapScreen() {
  // ⭐️ Refactored to use shared fetchCollarData from context
  const { cattleList = [], fetchCattle, collarData, updateMultipleCollarData, mapHasFocused, setMapHasFocused, mapRegion, setMapRegion, fetchCollarData } = useContext(UserContext);
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const mapRef = useRef(null);
  const markerColorsRef = useRef({});

  // 🐂 Efficient cattle name/collar lookup map
  const cattleMap = useMemo(() => {
    const newMap = {};
    (cattleList || []).forEach(cattle => {
      // Use collarId as the key for fetching API data, but allow fallback to id
      const collarIdKey = String(cattle.collarId || cattle.id).trim();
      // Use id or cattleId as the key for AsyncStorage (the static ID)
      const storageKey = String(cattle.id || cattle.cattleId || cattle.collarId);

      if (collarIdKey && collarIdKey !== 'undefined') {
        newMap[collarIdKey] = {
          ...cattle, // Store full static data for easy lookup later
          name: cattle.cattle_name || cattle.name || `Cattle ${collarIdKey}`,
          collarId: collarIdKey,
          storageKey: storageKey,
        };
      }
    });
    return newMap;
  }, [cattleList]);

  // Derive items from context collarData
  const items = useMemo(() => {
    const deviceIds = Object.keys(cattleMap);
    return deviceIds.map(collarId => {
      const cattleDetails = cattleMap[collarId] || {};
      const data = collarData[collarId]; // Raw API data from context

      const lastLocation = data?.lastLocation ?? null;
      const apiLastSeen = data?.lastSeen ?? data?.lastLocation?.timestamp ?? data?.updatedAt ?? null;

      const latest_record = lastLocation && isValidCoordinate(lastLocation.lat, lastLocation.lon)
        ? {
          latitude: lastLocation.lat,
          longitude: lastLocation.lon,
          created_at: lastLocation.timestamp ?? apiLastSeen,
          battery_voltage: typeof data?.__v === 'number' ? data.__v : null,
          body_temperature: null,
          gsm_rssi: typeof data?.gsm_rssi === 'number' ? data.gsm_rssi : null,
          lora_rssi: typeof data?.lora_rssi === 'number' ? data.lora_rssi : null,
        } : null;

      return {
        id: cattleDetails.id ?? collarId,
        collar_id: collarId,
        cattle_name: cattleDetails.name ?? `Cattle ${collarId}`,
        latest_record,
        markerColor: markerColorsRef.current[collarId] ?? '#FF6B6B',
      };
    });
  }, [collarData, cattleMap]);

  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('satellite');

  const assignColors = (ids, customColorMap = {}) => {
    const out = { ...markerColorsRef.current };
    let idx = 0;

    const idsToAssignDefault = ids.filter(id => {
      const storageKey = cattleMap[id]?.storageKey;
      return !out[id] && !(storageKey && customColorMap[storageKey]);
    });

    idsToAssignDefault.forEach((id) => {
      out[id] = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
      idx++;
    });

    ids.forEach((id) => {
      const storageKey = cattleMap[id]?.storageKey;
      if (storageKey && customColorMap[storageKey]) {
        out[id] = customColorMap[storageKey];
      }
    });

    markerColorsRef.current = out;
    return out;
  };

  const loadColors = useCallback(async () => {
    try {
      const deviceIds = Object.keys(cattleMap);
      if (deviceIds.length === 0) return;

      const stored = await AsyncStorage.getItem('cattleColors');
      const customColorMap = stored ? JSON.parse(stored) : {};

      assignColors(deviceIds, customColorMap);
      // Force re-render by updating a dummy state or relying on items memoization if it depends on markerColorsRef
      // Since items depends on markerColorsRef.current, we might need to trigger a state update if items doesn't update automatically
      // However, items memo dependency includes collarData and cattleMap. 
      // markerColorsRef is a ref, so changing it won't trigger re-render.
      // We need to force update.
      setLoading(prev => prev); // Dummy update to force re-render
    } catch (e) {
      console.error('Failed to load custom colors:', e);
    }
  }, [cattleMap]);

  useFocusEffect(
    useCallback(() => {
      if (cattleList.length === 0 && fetchCattle) {
        fetchCattle();
      }

      // Load colors whenever screen focuses or cattle list changes
      loadColors();

      // Use shared fetch function
      if (fetchCollarData) {
        setLoading(true);
        fetchCollarData().finally(() => setLoading(false));
      }

      const interval = setInterval(() => {
        if (fetchCollarData) fetchCollarData();
      }, POLLING_INTERVAL);

      return () => clearInterval(interval);
    }, [cattleList, fetchCattle, fetchCollarData, loadColors])
  );

  // Auto-focus map when items are populated (only once per session)
  useEffect(() => {
    if (!mapHasFocused && items.length > 0) {
      // Small delay to ensure map is ready
      const timer = setTimeout(() => {
        focusOnCattle();
        setMapHasFocused(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [items, mapHasFocused, setMapHasFocused]);

  const focusOnCattle = () => {
    const coords = items.map(i => i.latest_record ? {
      latitude: Number(i.latest_record.latitude),
      longitude: Number(i.latest_record.longitude)
    } : null).filter(Boolean);

    if (coords.length > 0 && mapRef.current?.fitToCoordinates) {
      mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 60, bottom: 60, left: 40, right: 40 }, animated: true });
    }
  };

  const renderIcon = (type, color, size) => {
    const mapTypeIcons = {
      standard: { icon: 'map', library: 'MaterialCommunityIcons' },
      satellite: { icon: 'satellite', library: 'FontAwesome5' },
      hybrid: { icon: 'map-legend', library: 'MaterialCommunityIcons' },
    };
    const def = mapTypeIcons[type] || mapTypeIcons.standard;
    if (def.library === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={def.icon} size={size} color={color} />;
    return <FontAwesome5 name={def.icon} size={size} color={color} />;
  };

  const toggleMapType = () => {
    setMapType(prev => {
      if (prev === 'satellite') return 'standard';
      if (prev === 'standard') return 'hybrid';
      return 'satellite';
    });
  };

  // ⭐️ NEW: Handler to navigate to CowDetailsScreen
  const handleMarkerPress = (mapItem) => {
    // 1. Use the collar_id (or its fallback) to find the full static cattle data
    const fullCowData = cattleMap[mapItem.collar_id];

    if (fullCowData) {
      // 2. Overwrite the static 'latest_record' with the fresh location data from the API
      // This ensures CowDetailsScreen uses the latest location fetched here
      const cowForNavigation = {
        ...fullCowData,
        latest_record: mapItem.latest_record || fullCowData.latest_record,
        collarId: mapItem.collar_id, // Ensure collarId is present
      };

      navigation.navigate('CowDetails', { cow: cowForNavigation });
    } else {
      Alert.alert('Error', 'Could not find complete cattle details for navigation.');
    }
  };

  // ⭐️ NEW: Handler to zoom in on marker long press
  const handleMarkerLongPress = (coordinate) => {
    console.log('Long press detected at:', coordinate);
    if (mapRef.current) {
      console.log('Animating to region...');
      mapRef.current.animateToRegion({
        ...coordinate,
        latitudeDelta: 0.002, // Slightly larger delta to be safe
        longitudeDelta: 0.002,
      }, 1000);
    } else {
      console.log('Map ref is null');
    }
  };

  return (
    <View style={[styles.fullScreen, colorScheme === 'dark' && styles.darkBackground]}>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          mapType={mapType}
          showsUserLocation
          showsMyLocationButton
          initialRegion={
            mapRegion || {
              latitude: 7.8731,
              longitude: 80.7718,
              latitudeDelta: 2,
              longitudeDelta: 2,
            }
          }
          onRegionChangeComplete={(region) => setMapRegion(region)}
        >
          {items.map((item, idx) => {
            if (!item.latest_record) return null;
            const lat = Number(item.latest_record.latitude);
            const lon = Number(item.latest_record.longitude);
            if (!isValidCoordinate(lat, lon)) return null;

            // Find the full static data to determine if an alert exists
            const cattleStaticData = cattleMap[item.collar_id];
            const isAlert = cattleStaticData?.healthNotes?.toLowerCase()?.includes('alert');


            return (
              <Marker
                key={item.collar_id ?? item.id ?? idx}
                identifier={item.collar_id ?? item.id ?? String(idx)}
                coordinate={{ latitude: lat, longitude: lon }}
                title={item.cattle_name}
                // ⭐️ CHANGE: Added description to prompt tap for details
                description={"Tap here for full details"}
                // ⭐️ THE FIX: Call the new handler on callout press
                onCalloutPress={() => handleMarkerPress(item)}
                // Keep Marker onLongPress as backup, but main logic is in inner TouchableOpacity
                onLongPress={() => handleMarkerLongPress({ latitude: lat, longitude: lon })}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onLongPress={() => handleMarkerLongPress({ latitude: lat, longitude: lon })}
                  onPress={() => { /* Allow default marker press behavior (open callout) */ }}
                >
                  <View style={[
                    styles.markerIconWrapper,
                    {
                      backgroundColor: item.markerColor,
                      // Highlight marker border if static data indicates alert
                      borderColor: isAlert ? '#FF3B30' : '#fff'
                    }
                  ]}>
                    <MaterialCommunityIcons name="cow" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </Marker>
            );
          })}
        </MapView>

        {/* Adjust button container position to account for full screen */}
        <View style={styles.mapTypeButtonContainer}>
          <TouchableOpacity
            style={styles.mapTypeMainButton}
            onPress={toggleMapType}
          >
            {renderIcon(mapType, '#fff', 26)}
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={focusOnCattle}>
            <MaterialCommunityIcons name="target" size={28} color="#4F8EF7" />
          </TouchableOpacity>
        </View>

        {!loading && items.length === 0 && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#F2F7FA'
  },
  darkBackground: { backgroundColor: '#121212' },
  mapTypeButtonContainer: {
    position: 'absolute',
    bottom: 80,
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
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 6 },
  emptySubText: { fontSize: 13, color: '#666', textAlign: 'center' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' },
  markerIconWrapper: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
});