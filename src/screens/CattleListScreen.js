import React, { useEffect, useState, useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CattleCard from '../component/CattleCard';
import FilterScreen from './FilterScreen';
import { UserContext } from '../context/UserContext';

export default function CattleListScreen() {
  const { user } = useContext(UserContext);
  const userId = user?.id;

  const [cattleList, setCattleList] = useState([]);
  const [filteredCattleList, setFilteredCattleList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (userId) {
      fetchData(); // initial fetch

      const interval = setInterval(() => {
        fetchData();
      }, 1000); // every 1 second

      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      const [cattleRes, healthRes] = await Promise.all([
        fetch(`http://100.79.26.84:8000/api/cattle/user/${userId}`),
        fetch(`http://100.79.26.84:8000/api/cattle/lastdata/latest/${userId}`),
      ]);

      const cattleJson = await cattleRes.json();
      const healthJson = await healthRes.json();

      const cattleArray = Array.isArray(cattleJson?.data) ? cattleJson.data : [];
      const healthMap = {};
      Array.isArray(healthJson) &&
        healthJson.forEach(item => {
          if (item?.collar_id) {
            healthMap[item.collar_id] = item.latest_record;
          }
        });

      const merged = cattleArray.map(cow => {
        const record = healthMap[cow.id];
        const createdAt = record?.created_at ?? null;
        const collarOnline = (() => {
          if (!createdAt) return false;
          const lastSeenTime = new Date(createdAt).getTime();
          const now = new Date().getTime();
          const diffInMinutes = (now - lastSeenTime) / (1000 * 60);
          return diffInMinutes <= 5;
        })();

        return {
          ...cow,
          latest_record: record || null,
          helth_notes: record
            ? `Temp: ${record.body_temperature}°C, Battery: ${record.battery_voltage}V, Health: ${record.health_status || 'N/A'}`
            : 'Temp: N/A, Battery: N/A, Health: N/A',
          batteryVoltage: record?.battery_voltage ?? null,
          temperature: record?.body_temperature ?? null,
          rssi: record?.rssi ?? null,
          collarOnline,
          motionDetected: record?.motion_detected ?? false,
          lastSeen: createdAt,
        };
      });

      setCattleList(merged);
      handleSearch(searchQuery, temperatureFilter, merged);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to fetch cattle data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (q, tempFilter = temperatureFilter, sourceList = cattleList) => {
    setSearchQuery(q);
    setFilteredCattleList(
      sourceList.filter(item => {
        const matchQ = item.id.toLowerCase().includes(q.toLowerCase()) ||
          (item.cattle_name || '').toLowerCase().includes(q.toLowerCase());

        const matchT = tempFilter
          ? parseFloat(item.temperature) >= parseFloat(tempFilter)
          : true;

        return matchQ && matchT;
      })
    );
  };

  const applyFilter = ({ temperature }) => {
    setTemperatureFilter(temperature);
    handleSearch(searchQuery, temperature);
    setFilterModalVisible(false);
  };

  const resetFilter = () => {
    setSearchQuery('');
    setTemperatureFilter('');
    setFilteredCattleList(cattleList);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by ID or name..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={text => handleSearch(text)}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter-outline" size={24} color="#4F8EF7" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F8EF7" />
        ) : (
          filteredCattleList.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate('CowDetails', { cow: item })}
              activeOpacity={0.7}
            >
              <CattleCard
                cattleId={item.id}
                name={item.cattle_name}
                breed={item.breed}
                age={item.age}
                healthNotes={item.helth_notes}
                batteryVoltage={item.batteryVoltage}
                rssi={item.rssi}
                cattlePhoto={item.cattle_photo}
                collarOnline={item.collarOnline}
                motionDetected={item.motionDetected}
                lastSeen={item.lastSeen}
              />
            </TouchableOpacity>
          ))
        )}

        {!loading && filteredCattleList.length === 0 && (
          <Text style={styles.emptyText}>No results.</Text>
        )}
      </ScrollView>

      <Modal transparent visible={filterModalVisible} animationType="slide">
        <FilterScreen
          onApplyFilter={applyFilter}
          onReset={() => {
            resetFilter();
            setFilterModalVisible(false);
          }}
          onClose={() => setFilterModalVisible(false)}
          initialValues={{ temperature: temperatureFilter }}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingHorizontal: 12 },
  scrollArea: { marginTop: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderRadius: 10,
    elevation: 2,
  },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: '#333' },
  filterButton: { paddingLeft: 8 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#777', fontSize: 16 },
});