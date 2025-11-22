// src/components/BatteryIndicator.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

/**
 * BatteryIndicator
 * Props:
 *  - voltage: number | null  (0..5 expected)
 *  - maxVoltage: number (default 5)
 *  - showLabel: boolean (optional) - if you want to display voltage text
 *
 * Renders the exact battery UI used previously (body, fill, nub).
 */
export default function BatteryIndicator({ voltage = null, maxVoltage = 5, showLabel = false }) {
  const v = typeof voltage === 'number' ? Math.min(Math.max(voltage, 0), maxVoltage) : null;
  const fillPercent = v != null ? Math.min(Math.max(v / maxVoltage, 0), 1) : 0;

  const getBatteryColor = (val) => {
    if (val == null) return '#ccc';
    if (val > 4) return '#34C759';
    if (val > 2.5) return '#FF9500';
    return '#FF3B30';
  };

  const color = getBatteryColor(v);

  return (
    <View style={styles.container}>
      <View style={[styles.batteryBody, { borderColor: color }]}>
        <View style={[styles.batteryFill, { width: `${fillPercent * 100}%`, backgroundColor: color }]} />
      </View>
      <View style={[styles.batteryNub, { backgroundColor: color }]} />
      {showLabel && (
        <Text style={styles.labelText}>
          {v != null ? `${v.toFixed(1)}V` : 'N/A'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
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
  labelText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
});