import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  useColorScheme,
  // Removed Platform and StatusBar as they are replaced by SafeAreaView
} from 'react-native';
// ✅ Import SafeAreaView from 'react-native-safe-area-context'
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function AddCollarScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const userId = user?.id;

  // Color scheme matching AccountScreen
  const colors = {
    bg: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#F5F5F5' : '#2D3436',
    subText: isDark ? '#BDBDBD' : '#636E72',
    primary: '#27AE60',
    secondary: '#3498DB',
    accent: '#8B4513',
    border: isDark ? '#333' : '#E0E0E0',
    danger: '#E74C3C',
    warning: '#F39C12',
    info: '#3498DB',
    success: '#2ECC71',
    premium: '#F39C12'
  };

  const [form, setForm] = useState({
    id: '',
    cattle_name: '',
    breed: '',
    age: '',
    color: '',
    weight: '',
    helth_notes: '',
    activation_date: '',
    owner_name: '',
    farm_name: '',
    village_or_distric: '',
    cattle_photo: ''
  });
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleQRScan = ({ data }) => {
    setForm(prev => ({ ...prev, id: data }));
    setShowScanner(false);
  };

  const handleSubmit = async () => {
    for (let key in form) {
      if (!form[key]) {
        Alert.alert('Missing Field', `Please fill in ${key.replace(/_/g, ' ')}`);
        return;
      }
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please login again.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://100.79.26.84:8000/api/cattle/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user_id: user.id,
          age: parseInt(form.age),
          weight: parseFloat(form.weight)
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Cattle added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Failed', data?.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const QRScannerModal = () => (
    <Modal visible={showScanner} animationType="slide">
      {/* SafeAreaView wrapper for Modal content, fixing the syntax error */}
      <SafeAreaView style={[styles.scannerContainer, { backgroundColor: colors.bg }]}> 
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{
                barcodeTypes: ['qr']
              }}
              onBarcodeScanned={showScanner ? handleQRScan : undefined}
            />
            <View style={styles.scannerOverlay}>
              <View style={[styles.scannerFrame, { borderColor: colors.primary }]} />
              <Text style={[styles.scannerText, { color: colors.text }]}>Scan Cattle ID QR Code</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.card }]}
              onPress={() => setShowScanner(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>Close Scanner</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={[styles.permissionContainer, { backgroundColor: colors.bg }]}>
            <Text style={[styles.permissionText, { color: colors.text }]}>
              We need permission to access your camera
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={[styles.permissionButtonText, { color: '#fff' }]}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView> {/* <-- Correctly closed SafeAreaView */}
    </Modal>
  );

  return (
    // ✅ Main screen SafeAreaView, excluding the bottom edge
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={['top', 'left', 'right']} 
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container, 
          { backgroundColor: colors.bg }
          // Removed manual safeAreaTopPadding style
        ]}
      >
        <View style={[styles.headerContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}>Add New Cattle</Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          {[
            { label: 'Cattle ID', field: 'id', icon: 'qr-code' },
            { label: 'Name', field: 'cattle_name', icon: 'paw' },
            { label: 'Breed', field: 'breed', icon: 'list' },
            { label: 'Age (years)', field: 'age', keyboardType: 'numeric', icon: 'calendar' },
            { label: 'Color', field: 'color', icon: 'color-palette' },
            { label: 'Weight (kg)', field: 'weight', keyboardType: 'numeric', icon: 'speedometer' },
            { label: 'Health Notes', field: 'helth_notes', icon: 'medkit' },
            { label: 'Activation Date (YYYY-MM-DD)', field: 'activation_date', icon: 'today' },
            { label: 'Owner Name', field: 'owner_name', icon: 'person' },
            { label: 'Farm Name', field: 'farm_name', icon: 'business' },
            { label: 'Village or District', field: 'village_or_distric', icon: 'location' },
            { label: 'Cattle Photo Filename', field: 'cattle_photo', icon: 'camera' }
          ].map(({ label, field, keyboardType, icon }) => (
            <View key={field} style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons 
                  name={icon} 
                  size={16} 
                  color={colors.primary} 
                  style={styles.inputIcon}
                />
                <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: colors.bg }]}>
                <TextInput
                  placeholder={`Enter ${label}`}
                  placeholderTextColor={colors.subText}
                  value={form[field]}
                  onChangeText={(val) => handleChange(field, val)}
                  keyboardType={keyboardType || 'default'}
                  style={[styles.input, { color: colors.text }]}
                  editable={field !== 'id'}
                />
                {field === 'id' && (
                  <TouchableOpacity
                    style={[styles.scanButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowScanner(true)}
                  >
                    <Ionicons name="scan" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Add Cattle</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <QRScannerModal />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
  },
  scanButton: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scannerContainer: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderRadius: 10,
  },
  scannerText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    padding: 15,
    borderRadius: 10,
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  permissionButton: {
    padding: 15,
    borderRadius: 10,
  },
  permissionButtonText: {
    fontWeight: 'bold',
  },
});