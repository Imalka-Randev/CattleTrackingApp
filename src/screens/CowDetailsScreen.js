// src/screens/CowDetailsScreen.js
import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- NEW IMPORT
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'; // Ensure MaterialCommunityIcons is imported
import api from '../api/apiClient';
import { UserContext } from '../context/UserContext';

import BatteryIndicator from '../component/BatteryIndicator';
import SignalIndicator from '../component/SignalIndicator';

// const MAP_TYPES = ['standard', 'satellite', 'hybrid', 'terrain']; // Removed as we use string state now

export default function CowDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const { cow } = route.params || {};

  // local state for API collar-data
  const { collarData, updateCollarData } = useContext(UserContext);
  // const [apiData, setApiData] = useState(null); // REMOVED: using shared state
  const [trail, setTrail] = useState([]);
  const [mapType, setMapType] = useState('satellite'); // default to 'satellite'
  const [markerColor, setMarkerColor] = useState('#4F8EF7'); // <--- NEW STATE for custom color

  // If no data at all
  if (!cow) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ No data available for this cow.</Text>
      </View>
    );
  }

  // STATIC DATA PASSED FROM LIST SCREEN
  const {
    cattleId,
    name,
    breed,
    age,
    weight,
    color,
    farmName,
    address,
    Image: cattleImage,
    collarId,
    healthNotes,
    latest_record = {},
    lastSeen: staticLastSeen,
    id: cowId, // Use 'id' as a fallback key
  } = cow;

  // OLD latest_record fields (may be undefined)
  const {
    latitude: old_latitude,
    longitude: old_longitude,
    body_temperature,
    battery_voltage: old_battery_voltage,
    motion_detected,
    rssi,
    health_status,
    created_at: old_created_at,
  } = latest_record || {};

  // Helper to trim collarId to deviceId string
  const deviceId = collarId ? String(collarId).trim() : null;


  // ---- Load Custom Marker Color from AsyncStorage ----
  useEffect(() => {
    const loadMarkerColor = async () => {
      try {
        const stored = await AsyncStorage.getItem('cattleColors');
        const colorMap = stored ? JSON.parse(stored) : {};
        // Use cattleId as the key, falling back to cowId if cattleId isn't present
        const key = cattleId || cowId;
        if (key && colorMap[key]) {
          setMarkerColor(colorMap[key]);
        }
      } catch (e) {
        console.error('Error loading marker color from AsyncStorage', e);
      }
    };

    loadMarkerColor();
  }, [cattleId, cowId]); // Run once when cow data loads


  // ---- Fetch collar-data repeatedly (every 1s) silently ----
  useEffect(() => {
    let mounted = true;
    if (!deviceId) return () => { mounted = false; };

    const fetchCollarData = async () => {
      try {
        const res = await api.get(`/api/collar-data/${deviceId}`);
        const d = res?.data ?? null;
        if (mounted && d) {
          updateCollarData(deviceId, d);
        }
      } catch (err) {
        // intentionally silent: do not show error to user, just keep previous data
        // if (mounted) setApiData(null); // Don't clear shared state on error
      }
    };

    // initial fetch + interval
    fetchCollarData();
    const interval = setInterval(fetchCollarData, 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [deviceId]);

  // Extract API fields (if available)
  const apiData = collarData[deviceId] || null; // Derived from shared state
  const apiLastLocation = apiData?.lastLocation ?? null; // { lat, lon, timestamp }
  const apiVoltageRaw = apiData?.__v ?? null; // use __v as voltage (0..5)
  const apiLastSeen = apiData?.lastSeen ?? apiData?.lastLocation?.timestamp ?? null;

  // Also read signal fields if present
  const gsmRssi = typeof apiData?.gsm_rssi === 'number' ? apiData.gsm_rssi : (apiData?.gsm_rssi ?? null);
  const loraRssi = typeof apiData?.lora_rssi === 'number' ? apiData.lora_rssi : (apiData?.lora_rssi ?? null);

  // Compute displayed location / timestamp with fallbacks
  const latitude = apiLastLocation?.lat ?? old_latitude ?? null;
  const longitude = apiLastLocation?.lon ?? old_longitude ?? null;
  const displayedTimestamp = apiLastSeen ?? staticLastSeen ?? old_created_at ?? null;

  // Battery: prefer API __v (clamped 0..5), fallback to old battery_voltage
  const batteryVoltage = (() => {
    if (typeof apiVoltageRaw === 'number') return Math.min(Math.max(apiVoltageRaw, 0), 5);
    if (typeof old_battery_voltage === 'number') return Math.min(Math.max(old_battery_voltage, 0), 5);
    return null;
  })();

  // Map focus helper
  const handleFocus = () => {
    if (mapRef.current && latitude != null && longitude != null) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: Number(latitude),
            longitude: Number(longitude),
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000
        );
      } catch (e) {
        // ignore animation errors
      }
    }
  };

  // check location valid
  const locationAvailable =
    latitude != null &&
    longitude != null &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude)) &&
    !(Math.abs(Number(latitude)) < 0.0001 && Math.abs(Number(longitude)) < 0.0001);

  // ---- Maintain movement trail (last 10 points) ----
  useEffect(() => {
    if (!locationAvailable) return;

    const latNum = Number(latitude);
    const lonNum = Number(longitude);

    setTrail((prev) => {
      // avoid duplicates
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.latitude === latNum && last.longitude === lonNum) {
          return prev;
        }
      }
      const next = [...prev, { latitude: latNum, longitude: lonNum }];
      if (next.length > 10) return next.slice(next.length - 10);
      return next;
    });
  }, [latitude, longitude, locationAvailable]);

  // ---- Smooth map animation whenever displayed location updates (hidden to user) ----
  useEffect(() => {
    if (!mapRef.current) return;
    if (!locationAvailable) return;

    try {
      mapRef.current.animateToRegion(
        {
          latitude: Number(latitude),
          longitude: Number(longitude),
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        800
      );
    } catch (e) {
      // ignore
    }
  }, [latitude, longitude, locationAvailable]);

  // Format timestamp to "08:08 AM • 22/11/2025"
  const formatTimestamp = (isoString) => {
    if (!isoString) return 'No timestamp';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'No timestamp';

    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const mm = minutes < 10 ? `0${minutes}` : minutes;
    const timePart = `${hours}:${mm} ${ampm}`;

    const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
    const month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const datePart = `${day}/${month}/${d.getFullYear()}`;

    return `${timePart} • ${datePart}`;
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

  const handleNavigateToCattle = () => {
    if (!locationAvailable) {
      Alert.alert('Location Missing', 'Cannot navigate because the cattle location is not available.');
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const label = name || 'Cattle';

    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url).catch(err => {
      console.error('An error occurred', err);
      Alert.alert('Error', 'Could not open map application.');
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* NAME */}
        <Text style={styles.title}>{name || 'Unnamed Cow'}</Text>

        {/* MAP SECTION */}
        <Text style={styles.sectionTitle}>🗺️ Cattle Location</Text>

        {!locationAvailable ? (
          <View style={styles.mapContainer}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#c00', fontWeight: '600' }}>
                Location not available
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              mapType={mapType}
              initialRegion={{
                latitude: Number(latitude),
                longitude: Number(longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {/* Movement Trail (polyline) */}
              {trail.length > 1 && (
                <Polyline
                  coordinates={trail}
                  strokeWidth={4}
                  strokeColor="#00BFFF"
                />
              )}

              {/* Cow Marker with Custom Color */}
              <Marker
                coordinate={{
                  latitude: Number(latitude),
                  longitude: Number(longitude),
                }}
                title={name}
                description={`Lat: ${latitude}, Lon: ${longitude}`}
              >
                {/* Custom icon using the loaded markerColor */}
                <View style={[styles.markerIconWrapper, { backgroundColor: markerColor }]}>
                  <MaterialCommunityIcons name="cow" size={20} color="#fff" />
                </View>
              </Marker>
            </MapView>

            {/* Floating controls over the map */}
            <View style={styles.mapTypeButtonContainer}>
              {/* 
                NAVIGATE BUTTON 
                Opens external maps (Apple Maps on iOS, Google Maps on Android)
              */}
              <TouchableOpacity
                style={[styles.mapTypeMainButton, { backgroundColor: '#34C759', marginBottom: 8 }]}
                onPress={handleNavigateToCattle}
              >
                <MaterialCommunityIcons name="navigation-variant" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapTypeMainButton}
                onPress={toggleMapType}
              >
                {renderIcon(mapType, '#fff', 20)}
              </TouchableOpacity>
              <TouchableOpacity style={styles.refreshButton} onPress={handleFocus}>
                <MaterialCommunityIcons name="target" size={22} color="#4F8EF7" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CATTLE INFO */}
        <Text style={styles.sectionTitle}>🐄 Cattle Information</Text>
        <View style={styles.rowCardColumn}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>ID: {cattleId}</Text>
            <Text style={styles.infoText}>Breed: {breed}</Text>
            <Text style={styles.infoText}>Age: {age} yrs</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Weight: {weight} kg</Text>
            <Text style={styles.infoText}>Color: {color}</Text>
            <Text style={styles.infoText}>Health: {healthNotes || 'N/A'}</Text>
          </View>
        </View>

        {/* FARM INFO */}
        <Text style={styles.sectionTitle}>🏡 Farm Info</Text>
        <View style={styles.rowCard}>
          <Text style={styles.value}>{farmName || 'Not available'}</Text>
        </View>

        {/* COLLAR DATA */}
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>📟 Collar Data</Text>
          <Text style={styles.timestampLabel}>
            {displayedTimestamp ? formatTimestamp(displayedTimestamp) : 'No timestamp'}
          </Text>
        </View>

        <View style={styles.rowCard}>
          <View style={styles.column}>
            {/* Battery indicator (component) */}
            <BatteryIndicator voltage={batteryVoltage} />
          </View>

          <View style={styles.column}>
            {/* Show GSM and LoRa indicators stacked to preserve the same area */}
            <SignalIndicator rssi={gsmRssi ?? rssi ?? null} label="GSM" />
            <SignalIndicator rssi={loraRssi ?? rssi ?? null} label="LoRa" />
          </View>

          <View style={styles.column}>
            <View
              style={[
                styles.motionDot,
                { backgroundColor: motion_detected ? '#34C759' : '#FF3B30' },
              ]}
            />
            <Text style={[styles.label, { marginTop: 6 }]}>Motion</Text>
          </View>

          <View style={styles.column}>
            <Text style={styles.value}>
              {body_temperature ? `${body_temperature}°C` : 'N/A'}
            </Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Temp</Text>
          </View>
        </View>

        {/* ALERT */}
        <Text style={styles.sectionTitle}>⚠️ Alert Info</Text>
        <View style={styles.rowCard}>
          <Text style={styles.value}>{health_status || 'Unknown'}</Text>
        </View>

        {/* IMAGE */}
        {cattleImage && cattleImage !== 'no' && cattleImage !== 'No' ? (
          <Image source={{ uri: cattleImage }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ color: '#888' }}>No Image Available</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>⬅️ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---- STYLES (UPDATED) ----

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F2F7FA', paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#4F8EF7', marginVertical: 5 },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#d8d8d8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#0bee88ff',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  column: { width: '22%', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600', color: '#666', textAlign: 'center' },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    textAlign: 'center',
  },
  motionDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 4 },
  mapContainer: {
    width: '100%',
    height: Dimensions.get('window').height * 0.3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: { width: '100%', height: '100%' },
  // Custom Marker Wrapper Style (copied from MapScreen logic)
  markerIconWrapper: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 3,
  },
  // small overlay controls on the map
  mapTypeButtonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  mapTypeMainButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  refreshButton: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    borderWidth: 2,
    borderColor: '#4F8EF7',
  },
  backButton: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: '#4F8EF7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 4,
  },
  backText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#c00' },
  batteryContainer: { flexDirection: 'row', alignItems: 'center' },
  batteryBody: {
    width: 30,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  batteryFill: { height: '100%' },
  batteryNub: { width: 4, height: 8, borderRadius: 1, marginLeft: 2 },
  signalWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  signalBar: { width: 4, backgroundColor: '#333', marginHorizontal: 1, borderRadius: 2 },
  timestampLabel: { fontSize: 12, color: '#333', fontWeight: '500' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCardColumn: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    elevation: 3,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderColor: '#0bee88ff', borderWidth: 1, padding: 5, borderRadius: 10, backgroundColor: '#ffffffff' },
  infoText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
    textAlign: 'center',
  },
});