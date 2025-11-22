// src/components/SignalIndicator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * SignalIndicator
 * Props:
 *  - rssi: number | null  (example: -78.5; range -140..0)
 *  - bars: number (how many bars to render, default 4)
 *  - label: string (e.g. 'GSM' or 'LoRa')
 *
 * This renders the same vertical bars UI you used before.
 * Mapping: rssi -> 0..bars (0 means all faint)
 * We map rssi range [-140 .. 0] to 0..bars.
 */
export default function SignalIndicator({ rssi = null, bars = 4, label = '' }) {
  // map rssi (-140..0) -> 0..bars
  const normalized = (() => {
    if (rssi == null || isNaN(Number(rssi))) return 0;
    const r = Number(rssi);
    // clamp r to [-140, 0]
    const clamped = Math.max(-140, Math.min(0, r));
    // convert to 0..1
    const unit = 1 - Math.abs(clamped) / 140;
    return Math.round(unit * bars);
  })();

  return (
    <View style={styles.wrapper}>
      <View style={styles.bars}>
        {Array.from({ length: bars }).map((_, i) => {
          const idx = i + 1;
          const isActive = idx <= normalized;
          return (
            <View
              key={idx}
              style={[
                styles.bar,
                {
                  opacity: isActive ? 1 : 0.2,
                  height: 4 * idx,
                },
              ]}
            />
          );
        })}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  bar: {
    width: 4,
    backgroundColor: '#333',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  label: { fontSize: 10, color: '#444', marginTop: 2, fontWeight: '600' },
});