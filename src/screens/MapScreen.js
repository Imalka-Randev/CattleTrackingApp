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
  Platform,
  Animated,
  Easing,
  PanResponder,
  Dimensions
} from 'react-native';
import MapView, { Marker, Polyline, Polygon } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import api from '../api/apiClient';
import Toast from 'react-native-toast-message';

// --- IMPORTS FOR NAVIGATION ---
import * as Location from 'expo-location'; // For tracking user's real-time location
// Removed MapViewDirections as we are using OSRM now
import RouteInfoCard from '../components/RouteInfoCard'; // Custom component to show Distance/Time

const POLLING_INTERVAL = 15000; // 15s
const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

/**
 * Helper function to decode OSRM polyline string.
 * OSRM returns the route geometry as a compressed string (Google Polyline Algorithm).
 * This function converts that string into an array of {latitude, longitude} objects
 * that <Polyline> can render.
 */
const decodePolyline = (t, e) => {
  for (var n, o, u = 0, l = 0, r = 0, d = [], h = 0, i = 0, a = null, c = Math.pow(10, e || 5); u < t.length;) {
    a = null, h = 0, i = 0;
    do {
      a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5;
    } while (a >= 32);
    n = (1 & i) ? ~(i >> 1) : i >> 1, l += n;
    h = 0, i = 0;
    do {
      a = t.charCodeAt(u++) - 63, i |= (31 & a) << h, h += 5;
    } while (a >= 32);
    o = (1 & i) ? ~(i >> 1) : i >> 1, r += o;
    d.push({ latitude: l / c, longitude: r / c });
  }
  return d;
};

const isValidCoordinate = (lat, lon) => {
  if (lat == null || lon == null) return false;
  const nlat = Number(lat);
  const nlon = Number(lon);
  // Filter out 0,0 as it's likely invalid/default
  if (Math.abs(nlat) < 0.0001 && Math.abs(nlon) < 0.0001) return false;
  return !Number.isNaN(nlat) && nlat >= -90 && nlat <= 90 && nlon >= -180 && nlon <= 180;
};

export default function MapScreen() {
  // ⭐️ ACCESS GLOBAL STATE
  // We get the list of cattle and functions to fetch data from UserContext.
  // This connects MapScreen to the rest of the app's data layer.
  const {
    cattleList = [],
    fetchCattle,
    collarData,
    updateMultipleCollarData,
    mapHasFocused,
    setMapHasFocused,
    mapRegion,
    setMapRegion,
    fetchCollarData,
    toolboxRightSide,    // Persistent state
    setToolboxRightSide,  // Setter for persistent state
    geofences, // Saved Geofences
  } = useContext(UserContext);
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const mapRef = useRef(null);
  const markerColorsRef = useRef({});

  // --- NAVIGATION STATE ---
  const [userLocation, setUserLocation] = useState(null); // Current GPS location of the user
  const [isDirectionMode, setIsDirectionMode] = useState(false); // True if "Direction Mode" is active
  const [targetCattle, setTargetCattle] = useState(null); // The destination cattle selected by the user
  const [routeDetails, setRouteDetails] = useState({ distance: 0, duration: 0 }); // Distance (km) and Time (min) for the route
  const [routeCoordinates, setRouteCoordinates] = useState([]); // Array of coordinates representing the road path

  // --- OPTION BOX ANIMATION & DRAG STATE ---
  const [isOptionBoxOpen, setIsOptionBoxOpen] = useState(false);
  const optionBoxAnim = useRef(new Animated.Value(0)).current;

  // Screen Dimensions for snapping
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  // Initial Position: Bottom Right (approx 20px margin)
  // We use absolute coordinates relative to the screen. 
  // Let's assume bottom-right is default: X = Width - 80, Y = Height - 150 (approx).
  // Actually, easiest is to let it be 0,0 relative to a container, but 'absolute' is best for full screen drag.
  // let's try tracking the delta from the bottom-right corner or just absolute X/Y.

  // Strategy: Snap to specific X offsets.
  // Right Snap: 0 (if using right: 20 style) -> No, `transform` is easier.
  // Let's use an Animated Value for X Offset.
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Constants for snapping
  const buttonWidth = 56;
  const margin = 20;
  const snapLeftDistance = -(SCREEN_WIDTH - (margin * 2) - buttonWidth);
  const snapRightDistance = 0;

  // Effect to sync PAN position with persisted toolboxRightSide state
  // This handles initial load and updates from context
  useEffect(() => {
    const targetX = toolboxRightSide ? snapRightDistance : snapLeftDistance;
    pan.setValue({ x: targetX, y: 0 });
  }, [toolboxRightSide, SCREEN_WIDTH]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start drag if moved significantly (prevent accidental drags on tap)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset(); // Merge offset into value

        // Snap Logic
        // Calculate absolute X position based on current transform + initial position assumptions
        // Simplified: Check gesture.moveX

        // If released on Left half of screen (< width/2) -> Snap Left
        // If released on Right half -> Snap Right

        // We are using `right: 20` as base in styles.
        // So x=0 is Right. Negative X moves Left.

        if (gesture.moveX < SCREEN_WIDTH / 2) {
          // Snap Left
          Animated.spring(pan, {
            toValue: { x: snapLeftDistance, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            if (setToolboxRightSide) setToolboxRightSide(false);
          });
        } else {
          // Snap Right
          Animated.spring(pan, {
            toValue: { x: snapRightDistance, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            if (setToolboxRightSide) setToolboxRightSide(true);
          });
        }
      },
    })
  ).current;

  const toggleOptionBox = () => {
    const toValue = isOptionBoxOpen ? 0 : 1;

    Animated.timing(optionBoxAnim, {
      toValue,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design Standard Easing
      useNativeDriver: true,
    }).start();

    setIsOptionBoxOpen(!isOptionBoxOpen);
  };

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
  const [mapType, setMapType] = useState('hybrid');

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
      setLoading(prev => prev); // Dummy update to force re-render
    } catch (e) {
      console.error('Failed to load custom colors:', e);
    }
  }, [cattleMap]);

  // --- LOCATION TRACKING ---
  // This effect runs once on mount. It asks for permission and then
  // continuously watches the user's location.
  useEffect(() => {
    let subscription;
    const startTracking = async () => {
      // 1. Request Permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to use direction features.');
        return;
      }

      // 2. Start Watching Position
      // We use high accuracy and update every 10 meters to balance performance and battery.
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (location) => {
          // Update state with new coordinates
          setUserLocation(location.coords);
        }
      );
    };

    startTracking();

    // Cleanup: Stop watching when component unmounts
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // --- OSRM ROUTING LOGIC ---
  // This effect triggers whenever the User moves OR the Target Cattle moves.
  useEffect(() => {
    if (isDirectionMode && userLocation && targetCattle) {
      fetchOSRMRoute(userLocation, targetCattle);
    }
  }, [userLocation, targetCattle, isDirectionMode]);

  /**
   * Fetches the driving route from OSRM (Open Source Routing Machine).
   * @param {object} start - User's location {latitude, longitude}
   * @param {object} end - Cattle's location {latitude, longitude}
   */
  const fetchOSRMRoute = async (start, end) => {
    try {
      // Construct OSRM API URL
      // Format: /route/v1/driving/{lon},{lat};{lon},{lat}
      const url = `http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=polyline`;

      const response = await fetch(url);
      const json = await response.json();

      if (json.code === 'Ok' && json.routes.length > 0) {
        const route = json.routes[0];

        // Decode the polyline string into coordinates for the map
        const points = decodePolyline(route.geometry);

        setRouteCoordinates(points);
        setRouteDetails({
          distance: route.distance / 1000, // Convert meters to km
          duration: route.duration / 60,   // Convert seconds to minutes
        });

        // Auto-zoom the map to fit the entire route
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 50, right: 50, bottom: 150, left: 50 },
            animated: true,
          });
        }
      }
    } catch (error) {
      console.error('OSRM Fetch Error:', error);
      // Fail silently or show toast if needed
    }
  };

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

  // --- TOGGLE DIRECTION MODE ---
  // Switches the app between "Normal Map View" and "Navigation View"
  const toggleDirectionMode = () => {
    setIsDirectionMode(!isDirectionMode);
    if (!isDirectionMode) {
      // Activating: Inform user what to do
      Toast.show({
        type: 'info',
        text1: 'Direction Mode Activated',
        text2: 'Please select a cattle marker to start navigation.',
      });
    } else {
      // Deactivating: Clean up state
      setTargetCattle(null); // Clear target
      setRouteDetails({ distance: 0, duration: 0 }); // Clear details
      setRouteCoordinates([]); // Clear route line
    }
  };

  // --- MARKER PRESS HANDLER ---
  const handleMarkerPress = (mapItem) => {
    // CASE 1: Direction Mode is ON
    // Instead of opening details, we set this cattle as the NAVIGATION TARGET.
    if (isDirectionMode) {
      if (mapItem.latest_record) {
        setTargetCattle({
          latitude: Number(mapItem.latest_record.latitude),
          longitude: Number(mapItem.latest_record.longitude),
          name: mapItem.cattle_name
        });
        Toast.show({
          type: 'success',
          text1: 'Target Selected',
          text2: `Routing to ${mapItem.cattle_name}...`,
        });
      } else {
        Alert.alert('No Location', 'This cattle does not have a valid location.');
      }
      return; // Stop here, don't navigate to details
    }

    // CASE 2: Normal Mode
    // Navigate to the Cow Details screen as usual.
    const fullCowData = cattleMap[mapItem.collar_id];
    if (fullCowData) {
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
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...coordinate,
        latitudeDelta: 0.002, // Slightly larger delta to be safe
        longitudeDelta: 0.002,
      }, 1000);
    }
  };

  return (
    <View style={[styles.fullScreen, colorScheme === 'dark' && styles.darkBackground]}>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          mapType={mapType}
          showsUserLocation={true} // Show blue dot for user
          showsMyLocationButton={true}
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
          {/* --- SAVED GEOFENCES --- */}
          {geofences && geofences.map((fence) => (
            <Polygon
              key={fence.id}
              coordinates={fence.coordinates}
              strokeColor={fence.color}
              fillColor={fence.color + "40"} // Add transparency
              strokeWidth={2}
            />
          ))}

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
                // Change callout text based on mode
                description={isDirectionMode ? "Tap to track" : "Tap here for full details"}
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

          {/* --- ROUTE POLYLINE --- */}
          {/* Renders the blue path on the map when a route is active */}
          {isDirectionMode && routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={4}
              strokeColor="#4F8EF7" // Blue line
            />
          )}

        </MapView>

        {/* --- ROUTE INFO CARD --- */}
        {/* Displays Distance and Time at the bottom of the screen */}
        {isDirectionMode && targetCattle && (
          <RouteInfoCard
            distance={routeDetails.distance}
            duration={routeDetails.duration}
            onClose={() => {
              // Close button turns off direction mode
              toggleDirectionMode();
            }}
          />
        )}

        {/* Adjust button container position to account for full screen */}
        {/* Controls Container with Drag Support */}
        <Animated.View
          style={[
            styles.mapTypeButtonContainer,
            { transform: pan.getTranslateTransform() } // Move based on Pan
          ]}
          {...panResponder.panHandlers}
        >
          {/* Animated Option Buttons */}
          <Animated.View
            style={[
              styles.optionBoxOptions,
              {
                opacity: optionBoxAnim,
                transform: [
                  {
                    translateY: optionBoxAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: optionBoxAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                // Hide when closed to prevent accidental touches
                display: isOptionBoxOpen ? 'flex' : 'none',
              },
            ]}
          >
            {/* Expand / FenceTestMap Button */}
            <TouchableOpacity
              style={[styles.mapTypeMainButton, { backgroundColor: '#FF9F43', marginBottom: 12 }]}
              onPress={() => {
                toggleOptionBox();
                navigation.navigate('FenceTestMap');
              }}
            >
              <MaterialCommunityIcons name="fullscreen" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Direction Mode Toggle */}
            <TouchableOpacity
              style={[
                styles.mapTypeMainButton,
                { backgroundColor: isDirectionMode ? '#34C759' : '#fff', marginBottom: 12 }
              ]}
              onPress={() => {
                toggleOptionBox();
                toggleDirectionMode();
              }}
            >
              <MaterialCommunityIcons
                name="directions"
                size={24}
                color={isDirectionMode ? '#fff' : '#4F8EF7'}
              />
            </TouchableOpacity>

            {/* Map Type Toggle */}
            <TouchableOpacity
              style={[styles.mapTypeMainButton, { marginBottom: 12, backgroundColor: '#fff' }]}
              onPress={toggleMapType}
            >
              {renderIcon(mapType, '#4F8EF7', 24)}
            </TouchableOpacity>

            {/* Focus / Target Button */}
            <TouchableOpacity
              style={[styles.mapTypeMainButton, { marginBottom: 12, backgroundColor: '#fff' }]}
              onPress={focusOnCattle}
            >
              <MaterialCommunityIcons name="target" size={24} color="#4F8EF7" />
            </TouchableOpacity>
          </Animated.View>

          {/* Main OptionBox Button (FAB) */}
          <TouchableOpacity
            style={[
              styles.mapTypeMainButton,
              {
                backgroundColor: isOptionBoxOpen ? '#FF3B30' : '#FF9F43', // Red when open, Orange default
                width: isOptionBoxOpen ? 44 : 56, // Smaller when open (Close button)
                height: isOptionBoxOpen ? 44 : 56,
                borderRadius: isOptionBoxOpen ? 22 : 28,
              }
            ]}
            onPress={toggleOptionBox}
            activeOpacity={0.8}
          >
            {isOptionBoxOpen ? (
              <MaterialCommunityIcons name="close" size={22} color="#fff" />
            ) : (
              <View style={styles.psIconContainer}>
                {/* Top: Map Icon */}
                <MaterialCommunityIcons name="map" size={12} color="#fff" style={styles.psIconTop} />
                <View style={styles.psIconRow}>
                  {/* Left: Directions Icon */}
                  <MaterialCommunityIcons name="directions" size={12} color="#fff" style={styles.psIconLeft} />
                  {/* Right: Target Icon */}
                  <MaterialCommunityIcons name="target" size={12} color="#fff" style={styles.psIconRight} />
                </View>
                {/* Bottom: Fullscreen Icon */}
                <MaterialCommunityIcons name="fullscreen" size={12} color="#fff" style={styles.psIconBottom} />
              </View>
            )}
          </TouchableOpacity>

        </Animated.View>

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
    // marginBottom: 8, // Removed default margin, handled by container
  },
  optionBoxOptions: {
    alignItems: 'center',
    marginBottom: 0, // Space between options and main button
  },
  // refreshButton: { ... removed ... }
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
  psIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  psIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 28,
    // marginTop: -2, 
    // marginBottom: -2,
    alignItems: 'center',
  },
  psIconTop: {
    marginBottom: -4,
  },
  psIconBottom: {
    marginTop: -4,
  },
  psIconLeft: {
    marginRight: -2,
  },
  psIconRight: {
    marginLeft: -2,
  },
});