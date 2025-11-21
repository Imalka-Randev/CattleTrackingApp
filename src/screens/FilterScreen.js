import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FilterScreen({ onApplyFilter, onReset, onClose, initialValues }) {
  const [temperature, setTemperature] = useState(initialValues?.temperature || '');

  return (
    <View style={styles.overlay}>
      <View style={styles.dialogBox}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filter Cattle</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#4F8EF7" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Temperature Filter */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Body Temperature (°C)</Text>
            <TextInput
              value={temperature}
              onChangeText={setTemperature}
              placeholder="e.g. 38.5"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#888"
            />
          </View>

          {/* Dummy filters - not functional yet */}
          <Text style={styles.subheading}>Other Filters (Coming Soon)</Text>
          <View style={styles.buttonRow}>
            <FilterTag label="Healthy" />
            <FilterTag label="Sick" />
            <FilterTag label="Pregnant" />
          </View>

          <View style={styles.buttonRow}>
            <FilterTag label="Calf" />
            <FilterTag label="Heifer" />
            <FilterTag label="Cow" />
            <FilterTag label="Bull" />
          </View>

          <View style={styles.buttonRow}>
            <FilterTag label="Male" />
            <FilterTag label="Female" />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.resetButton} onPress={onReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => onApplyFilter({ temperature })}
            >
              <Text style={styles.applyText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function FilterTag({ label }) {
  return (
    <TouchableOpacity style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBox: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F8EF7',
  },
  content: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#333',
  },
  subheading: {
    fontSize: 15,
    marginVertical: 10,
    fontWeight: '600',
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    borderColor: '#4F8EF7',
    borderWidth: 1,
    borderRadius: 25,
    alignItems: 'center',
    paddingVertical: 10,
  },
  resetText: {
    color: '#4F8EF7',
    fontSize: 15,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#4F8EF7',
    borderRadius: 25,
    alignItems: 'center',
    paddingVertical: 10,
  },
  applyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});