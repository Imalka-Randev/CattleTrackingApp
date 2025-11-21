import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  useColorScheme
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  // Consistent color scheme with other screens
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
    fname: '',
    lname: '',
    gender: '',
    mobileNo: '',
    nicNo: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const isFormValid = () => {
    if (!form.id || !form.fname || !form.lname || !form.gender || !form.mobileNo || 
        !form.nicNo || !form.address || !form.password || !form.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    if (!/^[0-9]{9}[vVxX]$/.test(form.nicNo) && !/^[0-9]{12}$/.test(form.nicNo)) {
      Alert.alert('Error', 'Invalid NIC number');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!isFormValid()) return;

    try {
      setIsLoading(true);

      const response = await fetch('http://100.79.26.84:8000/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          fname: form.fname,
          lname: form.lname,
          gender: form.gender,
          mobileNo: parseInt(form.mobileNo),
          nicNo: form.nicNo,
          address: form.address,
          password: form.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Registration Failed', data?.message || 'Try again');
      }

    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView 
        contentContainerStyle={styles.innerContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
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
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          </View>

          <Text style={[styles.subtitle, { color: colors.subText }]}>Register to Smart Collar</Text>

          {[
            { label: 'User ID (e.g. U004)', field: 'id', icon: 'person' },
            { label: 'First Name', field: 'fname', icon: 'person' },
            { label: 'Last Name', field: 'lname', icon: 'person' },
            { label: 'Gender (male/female)', field: 'gender', icon: 'transgender' },
            { label: 'Mobile Number', field: 'mobileNo', icon: 'call', keyboardType: 'phone-pad' },
            { label: 'NIC Number', field: 'nicNo', icon: 'card' },
            { label: 'Address', field: 'address', icon: 'home', multiline: true },
            { label: 'Password', field: 'password', icon: 'lock-closed', secureTextEntry: true },
            { label: 'Confirm Password', field: 'confirmPassword', icon: 'lock-closed', secureTextEntry: true }
          ].map(({ label, field, icon, keyboardType, secureTextEntry, multiline }) => (
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
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  minHeight: multiline ? 80 : 50
                }
              ]}>
                <TextInput
                  placeholder={`Enter ${label}`}
                  placeholderTextColor={colors.subText}
                  value={form[field]}
                  onChangeText={(val) => handleChange(field, val)}
                  keyboardType={keyboardType || 'default'}
                  style={[styles.input, { color: colors.text }]}
                  secureTextEntry={secureTextEntry}
                  multiline={multiline}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.registerButton, 
              { 
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.7 : 1
              }
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.registerButtonText}>Create Account</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.subText }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
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
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    padding: 12,
    fontSize: 15,
  },
  registerButton: {
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
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});