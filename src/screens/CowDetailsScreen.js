import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function CowDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const { cow } = route.params;

  if (!cow || !cow.latest_record) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ No data available for this cow.</Text>
      </View>
    );
  }

  const {
    id,
    cattle_name,
    breed,
    age,
    weight,
    color,
    farm_name,
    cattle_photo,
    collar_id,
    latest_record,
  } = cow;

  const {
    latitude,
    longitude,
    body_temperature,
    battery_voltage,
    motion_detected,
    rssi,
    health_status,
    created_at,
  } = latest_record;

  const getBatteryColor = (v) =>
    v > 3.9 ? '#34C759' : v > 3.6 ? '#FF9500' : '#FF3B30';

  const batteryColor = battery_voltage != null ? getBatteryColor(battery_voltage) : '#ccc';
  const batteryFillPercent = battery_voltage != null
    ? Math.min(Math.max((battery_voltage - 3.0) / 1.2, 0), 1)
    : 0;

  const BatteryIcon = () => (
    <View style={styles.batteryContainer}>
      <View style={[styles.batteryBody, { borderColor: batteryColor }]}>
        <View
          style={[
            styles.batteryFill,
            { backgroundColor: batteryColor, width: `${batteryFillPercent * 100}%` },
          ]}
        />
      </View>
      <View style={[styles.batteryNub, { backgroundColor: batteryColor }]} />
    </View>
  );

  const getSignalBars = (rssi) => {
    if (rssi == null) return 0;
    if (rssi >= -50) return 4;
    if (rssi >= -70) return 3;
    if (rssi >= -90) return 2;
    return 1;
  };

  const signalBars = getSignalBars(rssi);
  const renderSignalBars = () => (
    <View style={styles.signalWrapper}>
      {[1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={[
            styles.signalBar,
            {
              opacity: i <= signalBars ? 1 : 0.2,
              height: 4 * i,
            },
          ]}
        />
      ))}
    </View>
  );

  const handleFocus = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{cattle_name || 'Unnamed Cow'}</Text>

        {/* Map Section (moved to top) */}
        <Text style={styles.sectionTitle}>🗺️ Cattle Location</Text>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            mapType="satellite"
            initialRegion={{
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              }}
              title={cattle_name}
              description={`Lat: ${latitude}, Lon: ${longitude}`}
            />
          </MapView>

          <TouchableOpacity style={styles.focusButton} onPress={handleFocus}>
            <Text style={styles.focusIcon}>🎯</Text>
          </TouchableOpacity>
        </View>

        

        {/* Cattle Info */}
        <Text style={styles.sectionTitle}>🐄 Cattle Information</Text>
        <View style={styles.rowCardColumn}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>ID: {collar_id || id}</Text>
            <Text style={styles.infoText}>Breed: {breed}</Text>
            <Text style={styles.infoText}>Age: {age} yrs</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Weight: {weight} kg</Text>
            <Text style={styles.infoText}>Color: {color}</Text>
            <Text style={styles.infoText}>Health: N/A</Text>
          </View>
        </View>

        {/* Farm Info */}
        <Text style={styles.sectionTitle}>🏡 Farm Info</Text>
        <View style={styles.rowCard}>
          <Text style={styles.value}>{farm_name || 'Not available'}</Text>
        </View>

        {/* Collar Data */}
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>📟 Collar Data</Text>
          <Text style={styles.timestampLabel}>⏰ {new Date(created_at).toLocaleString()}</Text>
        </View>

        <View style={styles.rowCard}>
          <View style={styles.column}><BatteryIcon /></View>
          <View style={styles.column}>{renderSignalBars()}</View>
          <View style={styles.column}>
            <View style={[styles.motionDot, { backgroundColor: motion_detected ? '#34C759' : '#FF3B30' }]} />
            <Text style={[styles.label, { marginTop: 6 }]}>Motion</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.value}>{body_temperature ? `${body_temperature}°C` : 'N/A'}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Temp</Text>
          </View>
        </View>

        {/* Alert Section */}
        <Text style={styles.sectionTitle}>⚠️ Alert Info</Text>
        <View style={styles.rowCard}>
          <Text style={styles.value}>{health_status || 'Unknown'}</Text>
        </View>
        {/* Cow Image */}
        {cattle_photo && cattle_photo !== 'no' && cattle_photo !== 'No' ? (
          <Image source={{ uri: cattle_photo }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ color: '#888' }}>No Image Available</Text>
          </View>
        )}
      </ScrollView>
       
      {/* Fixed Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>⬅️ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F2F7FA', paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#333', },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#4F8EF7', marginVertical: 5 },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  imagePlaceholder: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#d8d8d8', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  rowCard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, elevation: 3 },
  column: { width: '22%', alignItems: 'center', },
  label: { fontSize: 16, fontWeight: '600', color: '#666', textAlign: 'center' },
  value: { fontSize: 14, fontWeight: '500', color: '#111', textAlign: 'center' },
  motionDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 4 },
  mapContainer: { width: '100%', height: Dimensions.get('window').height * 0.3, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  map: { width: '100%', height: '100%' },
  focusButton: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'white', padding: 10, borderRadius: 20, elevation: 4 },
  focusIcon: { fontSize: 18 },
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
  batteryBody: { width: 30, height: 14, borderRadius: 3, borderWidth: 2, overflow: 'hidden', backgroundColor: '#fff' },
  batteryFill: { height: '100%' },
  batteryNub: { width: 4, height: 8, borderRadius: 1, marginLeft: 2 },
  signalWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  signalBar: { width: 4, backgroundColor: '#333', marginHorizontal: 1, borderRadius: 2 },
  timestampLabel: { fontSize: 12, color: '#333', fontWeight: '500' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCardColumn: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 14, elevation: 3, },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#111' ,alignContent: 'center', textAlign: 'center' },
});