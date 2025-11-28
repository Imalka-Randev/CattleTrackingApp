import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';

const PREDEFINED_COLORS = [
  '#4F8EF7', '#34C759', '#FF9500', '#FF3B30', '#9B59B6', '#00BCD4',
  '#1ABC9C', '#F39C12', '#E74C3C', '#2ECC71', '#2980B9', '#E67E22',
  '#8E44AD', '#16A085', '#C0392B', '#3498DB', '#7F8C8D', '#F1C40F',
  '#E84393', '#00CEC9', '#6C5CE7', '#81ECEC', '#A29BFE', '#636E72',
  '#2D3436', '#D63031', '#00B894', '#0984E3'
];

export default function CattleCard({
  cattleId,
  name,
  healthNotes,
  cattlePhoto,
  collarOnline = false,
  rssi = null,
  gsmRssi = null, // New prop
  batteryVoltage = null,
  motionDetected = null,
  lastSeen = null,
  type = 'slave', // New prop, default to slave
}) {
  const [color, setColor] = useState('#4F8EF7');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadColor();
  }, [cattleId]);

  const loadColor = async () => {
    try {
      const stored = await AsyncStorage.getItem('cattleColors');
      const colorMap = stored ? JSON.parse(stored) : {};
      if (colorMap[cattleId]) setColor(colorMap[cattleId]);
    } catch (e) {
      console.error('Error loading color', e);
    }
  };

  const saveColor = async (selectedColor) => {
    try {
      const stored = await AsyncStorage.getItem('cattleColors');
      const colorMap = stored ? JSON.parse(stored) : {};
      colorMap[cattleId] = selectedColor;
      await AsyncStorage.setItem('cattleColors', JSON.stringify(colorMap));
      setColor(selectedColor);
      setModalVisible(false);
    } catch (e) {
      console.error('Error saving color', e);
    }
  };

  const getBatteryColor = (v) =>
    v > 3.9 ? '#34C759' : v > 3.6 ? '#FF9500' : '#FF3B30';

  const batteryColor = batteryVoltage != null ? getBatteryColor(batteryVoltage) : '#ccc';
  const batteryFillPercent = batteryVoltage != null
    ? Math.min(Math.max((batteryVoltage - 3.0) / 1.2, 0), 1)
    : 0;

  // Logic: If master, use GSM RSSI. If slave (or other), use LoRa RSSI.
  const displayRssi = type === 'master' ? gsmRssi : rssi;

  const getSignalBars = (val) => {
    if (val == null) return 0;
    if (val >= -50) return 4;
    if (val >= -70) return 3;
    if (val >= -90) return 2;
    if (val >= -120) return 1; // Expanded range for weak signal
    return 0;
  };

  const signalBars = getSignalBars(displayRssi);

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
              backgroundColor: i <= signalBars ? (type === 'master' ? '#4F8EF7' : '#333') : '#ccc'
            },
          ]}
        />
      ))}
    </View>
  );

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

  const renderPhoto = cattlePhoto?.startsWith('http') ? (
    <View style={[styles.photoWrapper, { borderColor: collarOnline ? '#34C759' : '#aaa' }]}>
      <Image source={{ uri: cattlePhoto }} style={styles.circleImage} />
    </View>
  ) : (
    <View style={[styles.photoWrapper, { borderColor: collarOnline ? '#34C759' : '#aaa' }]}>
      <View style={styles.circle}>
        <Ionicons name="image-outline" size={28} color="#888" />
      </View>
    </View>
  );

  const formattedLastSeen = lastSeen
    ? (() => {
      const d = new Date(lastSeen);
      return isNaN(d.getTime())
        ? 'Unknown'
        : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    })()
    : 'Unknown';

  return (
    <View style={styles.card}>
      {renderPhoto}

      <View style={styles.details}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{name || 'Unnamed Cow'}</Text>
        </View>

        {/* Remove old lastSeenText here so it doesn't show twice */}

        <View style={styles.row}>
          <View style={styles.infoGroup}>
            <Ionicons name="thermometer-outline" size={14} color="#4F8EF7" />
            <Text style={styles.label}>Temp:</Text>
            <Text style={styles.value}>{healthNotes?.match(/Temp: ([^,]+)/)?.[1] || 'N/A'}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Ionicons name="medkit-outline" size={14} color="#4F8EF7" />
            <Text style={styles.label}>Health:</Text>
            <Text style={styles.value}>{healthNotes?.match(/Health: ([^,]+)/)?.[1] || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.infoGroup}>
            <Ionicons name="alert-circle-outline" size={14} color="#4F8EF7" />
            <Text style={styles.label}>Alert:</Text>
            <Text style={styles.value}>{healthNotes?.toLowerCase()?.includes('alert') ? 'Yes' : 'No'}</Text>
          </View>

          <View style={styles.infoGroup}>
            <MaterialCommunityIcons name="cow" size={14} color="#4F8EF7" />
            <Text style={styles.label}>Motion:</Text>
            <View
              style={[
                styles.motionDot,
                { backgroundColor: motionDetected ? '#34C759' : '#FF3B30' },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Color picker trigger */}
      <TouchableOpacity
        style={[styles.colorDot, { backgroundColor: color }]}
        onPress={() => setModalVisible(true)}
      />

      {/* Top right indicators or Last Seen */}
      <View style={styles.iconGroupTopRight}>
        {collarOnline ? (
          <>
            {renderSignalBars()}
            <BatteryIcon />
          </>
        ) : (
          <Text style={styles.lastSeenTopRight}>Last Seen: {formattedLastSeen}</Text>
        )}
      </View>

      {/* Color Picker Modal */}
      <Modal isVisible={modalVisible} onBackdropPress={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose a Color</Text>
          <View style={styles.colorGrid}>
            {PREDEFINED_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorCircle,
                  {
                    backgroundColor: c,
                    borderWidth: c === color ? 2 : 0,
                    borderColor: c === color ? '#000' : 'transparent',
                  },
                ]}
                onPress={() => saveColor(c)}
              />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
    position: 'relative',
  },
  photoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    marginRight: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  details: { flex: 1 },
  topRow: { marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  infoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  label: { fontSize: 13, fontWeight: '500', marginLeft: 6, color: '#555' },
  value: { fontSize: 13, color: '#333', marginLeft: 4 },
  motionDot: {
    width: 10,
    height: 10,
    borderRadius: 1,
    marginLeft: 6,
  },
  iconGroupTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  lastSeenTopRight: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    maxWidth: 400,
    textAlign: 'right',
  },
  signalWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 6,
  },
  signalBar: {
    width: 4,
    backgroundColor: '#333',
    marginHorizontal: 1,
    borderRadius: 2,
  },
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
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 8,
  },
});