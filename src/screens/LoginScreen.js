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
  StyleSheet,
  Image,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { loginApi } from '../api/authService';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { setUser } = useContext(UserContext); // ✅ use setUser instead of login
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [userId, setUserId] = useState('0771112222');
  const [password, setPassword] = useState('secret');
  const [isLoading, setIsLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const colors = {
    primary: '#27AE60', 
    bg: isDark ? '#000' : '#ffffff',
    card: isDark ? '#1c1c1e' : '#f9f9f9',
    text: isDark ? '#ffffff' : '#000000',
    subText: isDark ? '#aaaaaa' : '#555555',
    border: isDark ? '#333333' : '#dddddd',
    accent: isDark ? '#27AE60' : '#27AE60', 
  };

  const renderLogo = () => (
    <Image
      source={{
        uri: 'https://img.icons8.com/external-flatart-icons-flat-flatarticons/64/000000/external-cow-farm-flatart-icons-flat-flatarticons.png',
      }}
      style={styles.logo}
      resizeMode="contain"
    />
  );

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both User ID and password');
      return;
    }

    try {
      setIsLoading(true);
      const { ok, data } = await loginApi(userId.trim(), password);

      if (ok) {
        const { token, user } = data;
        if (!token || !user) {
          Alert.alert('Login Failed', 'Invalid server response — missing token or user.');
        } else {
          // ✅ Save token to storage
          await AsyncStorage.setItem('@auth_token', token);

          // ✅ Update context (this triggers navigation in AppNavigator)
          setUser(user);
        }
      } else {
        Alert.alert('Login Failed', data?.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.bg }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            {renderLogo()}
            <Text style={[styles.appName, { color: colors.text }]}>MooMap</Text>
            <Text style={[styles.tagline, { color: colors.subText }]}>
              Smarter way to track, protect & manage your cattle.
            </Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
              Login to your account
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>User ID</Text>
              <TextInput
                placeholder="Enter your User ID"
                placeholderTextColor={colors.subText}
                value={userId}
                onChangeText={setUserId}
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={colors.subText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={secureTextEntry ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.subText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: colors.primary },
                isLoading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: colors.subText }]}>
                Don’t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>
                  Create one
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: { position: 'relative' },
  eyeButton: { position: 'absolute', right: 16, top: 12 },
  loginButton: {
   borderRadius: 50,
   height: 50,
   width: '45%', // takes 45% of screen width, adapts to all phones
   alignSelf: 'center',
   justifyContent: 'center',
   alignItems: 'center',
   marginTop: 16,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.1,
   shadowRadius: 4,
   elevation: 3,
  },
  disabledButton: { opacity: 0.7 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: '600' },
});