// src/screens/CattleListScreen.js
import React, { useEffect, useState, useContext, useRef } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import CattleCard from '../component/CattleCard';
import FilterScreen from './FilterScreen';
import { UserContext } from '../context/UserContext';

export default function CattleListScreen() {
  const { user, cattleList, fetchCattle, cattleLoading } = useContext(UserContext);
  const userId = user?.userId || user?.id || null;

  const [displayList, setDisplayList] = useState([]);
  const [filteredCattleList, setFilteredCattleList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const navigation = useNavigation();
  const staticCattleRef = useRef([]);

  // store latest static cattle to ref
  useEffect(() => {
    staticCattleRef.current = cattleList || [];
  }, [cattleList]);

  // INITIAL load from context
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        if (!cattleList || cattleList.length === 0) {
          await fetchCattle?.();
        }
        const initial = cattleList || staticCattleRef.current || [];
        setDisplayList(initial);
        setFilteredCattleList(initial);
      } catch (e) {
        console.log("CattleList init error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (userId) {
      init();
    }

    return () => { mounted = false };
  }, [userId, cattleList, fetchCattle]);

  // SEARCH + FILTER only on static data
  const applySearchAndFilter = (q, tempFilter, sourceList = displayList) => {
    setFilteredCattleList(
      (sourceList || []).filter(item => {
        const idVal = (item.id || item.cattleId || '').toString();
        const nameVal = (item.cattle_name || item.name || '').toString();

        const matchesSearch =
          idVal.toLowerCase().includes(q.toLowerCase()) ||
          nameVal.toLowerCase().includes(q.toLowerCase());

        // If you want temperature filter removed completely, tell me — I can remove this too
        const tempVal = parseFloat(item.temperature ?? 0);
        const matchesTemp = tempFilter ? tempVal >= parseFloat(tempFilter) : true;

        return matchesSearch && matchesTemp;
      })
    );
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    applySearchAndFilter(q, temperatureFilter);
  };

  const applyFilter = ({ temperature }) => {
    setTemperatureFilter(temperature);
    applySearchAndFilter(searchQuery, temperature);
    setFilterModalVisible(false);
  };

  const resetFilter = () => {
    setSearchQuery('');
    setTemperatureFilter('');
    setFilteredCattleList(displayList);
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
          onChangeText={handleSearch}
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
        {(loading || cattleLoading) ? (
          <ActivityIndicator size="large" color="#4F8EF7" />
        ) : (
          filteredCattleList.map(item => (
            <TouchableOpacity
              key={(item.id || item.cattleId) + ''}
              onPress={() => navigation.navigate('CowDetails', { cow: item })}
              activeOpacity={0.7}
            >
              <CattleCard
                cattleId={item.cattleId || item.id}
                name={item.cattle_name || item.name}
                breed={item.breed}
                age={item.age}
                healthNotes={item.healthNotes || "No health data"}
                cattlePhoto={item.cattle_photo || item.Image}
              />
            </TouchableOpacity>
          ))
        )}

        {!loading && !cattleLoading && filteredCattleList.length === 0 && (
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