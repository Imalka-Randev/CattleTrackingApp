import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  Platform,
  Image,
  Linking,
  Alert
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Example user data with more details
  const user = {
    name: 'Sahan Perera',
    role: 'Farmer',
    farm: 'Sunrise Agro Farm',
    location: 'Kurunegala',
    email: 'sahan@gmail.com',
    phone: '0712345678',
    totalCattle: 10,
    activeCollars: 10,
    joinDate: 'Joined March 2025',
    avatar: 'https://shorturl.at/wr0wi',
    farmSize: '120 acres',
    cattleBreeds: ['Angus', 'Hereford', 'Brahman'],
    subscription: 'Premium (Annual)',
    subscriptionRenewal: 'March 15, 2024'
  };

  const [isDarkMode, setIsDarkMode] = React.useState(isDark);
  const [notifications, setNotifications] = React.useState(true);
  const [language, setLanguage] = React.useState('en');

  // Enhanced color palette with better contrast
  const colors = {
    bg: isDark ? '#121212' : '#F8F9FA',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#F5F5F5' : '#2D3436',
    subText: isDark ? '#BDBDBD' : '#636E72',
    primary: '#27AE60', // Slightly brighter green
    secondary: '#3498DB',
    accent: '#8B4513', // More vibrant brown
    border: isDark ? '#333' : '#E0E0E0',
    danger: '#E74C3C',
    warning: '#F39C12',
    info: '#3498DB',
    success: '#2ECC71',
    premium: '#F39C12'
  };

  const { logout } = React.useContext(UserContext);

  // Handlers for actions
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              console.log('User signed out successfully');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    console.log('Navigate to edit profile');
  };

  const openHelpCenter = () => {
    Linking.openURL('https://support.cattlemanager.com');
  };

  const openTerms = () => {
    Linking.openURL('https://cattlemanager.com/terms');
  };

  const openPrivacy = () => {
    Linking.openURL('https://cattlemanager.com/privacy');
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with enhanced layout */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={[styles.premiumBadge, { backgroundColor: colors.premium }]}>
                <Ionicons name="star" size={12} color="#fff" />
              </View>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.profileName, { color: colors.text }]}>{user.name}</Text>
                <View style={[styles.badge, { backgroundColor: `${colors.premium}20` }]}>
                  <Text style={[styles.badgeText, { color: colors.premium }]}>{user.role}</Text>
                </View>
              </View>

              <Text style={[styles.profileMeta, { color: colors.subText }]}>
                <Ionicons name="calendar" size={12} color={colors.subText} /> {user.joinDate}
              </Text>

              <View style={styles.farmInfo}>
                <Ionicons name="business" size={14} color={colors.primary} />
                <Text style={[styles.farmName, { color: colors.text }]}>{user.farm}</Text>
              </View>

              <View style={styles.locationInfo}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[styles.locationText, { color: colors.subText }]}>{user.location}</Text>
              </View>
            </View>
          </View>

          {/* Enhanced stats with progress indicators */}
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.totalCattle}</Text>
              <Text style={[styles.statLabel, { color: colors.subText }]}>Total Cattle</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(user.activeCollars / user.totalCattle) * 100}%`,
                      backgroundColor: colors.primary
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.activeCollars}</Text>
              <Text style={[styles.statLabel, { color: colors.subText }]}>Active Collars</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(user.activeCollars / user.totalCattle) * 100}%`,
                      backgroundColor: colors.primary
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>98%</Text>
              <Text style={[styles.statLabel, { color: colors.subText }]}>Health Rate</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: '98%',
                      backgroundColor: colors.success
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Farm Information with more details */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Farm Details</Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoGridItem}>
              <Ionicons name="map" size={20} color={colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.subText }]}>Farm Size</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.farmSize}</Text>
              </View>
            </View>

            <View style={styles.infoGridItem}>
              <Ionicons name="paw" size={20} color={colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.subText }]}>Cattle Breeds</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.cattleBreeds.join(', ')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Ionicons name="mail" size={20} color={colors.primary} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.subText }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="call" size={20} color={colors.primary} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.subText }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user.phone}</Text>
            </View>
          </View>
        </View>

        {/* Subscription Information */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Subscription</Text>

          <View style={styles.subscriptionItem}>
            <Ionicons name="card" size={20} color={colors.warning} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.subText }]}>Plan</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user.subscription}</Text>
            </View>
          </View>

          <View style={styles.subscriptionItem}>
            <Ionicons name="calendar" size={20} color={colors.warning} style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.subText }]}>Renewal Date</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{user.subscriptionRenewal}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings with better organization */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Preferences</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleEditProfile}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="lock-closed" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subText} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="language" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Language</Text>
            </View>
            <TouchableOpacity
              style={[styles.languageButton, { backgroundColor: `${colors.primary}10` }]}
              onPress={() => setLanguage(language === 'en' ? 'si' : 'en')}
            >
              <Text style={[styles.languageText, { color: colors.primary }]}>
                {language === 'en' ? 'English' : 'සිංහල'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="notifications" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              thumbColor={notifications ? colors.primary : "#f4f3f4"}
              trackColor={{ false: colors.border, true: `${colors.primary}50` }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="moon" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              thumbColor={isDarkMode ? colors.primary : "#f4f3f4"}
              trackColor={{ false: colors.border, true: `${colors.primary}50` }}
            />
          </View>
        </View>

        {/* Support Section with actual links */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Support</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={openHelpCenter}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.info}20` }]}>
                <Ionicons name="help-circle" size={18} color={colors.info} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={openTerms}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.info}20` }]}>
                <Ionicons name="document-text" size={18} color={colors.info} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={openPrivacy}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.info}20` }]}>
                <Ionicons name="shield-checkmark" size={18} color={colors.info} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${colors.info}20` }]}>
                <Ionicons name="chatbubbles" size={18} color={colors.info} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subText} />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={[styles.versionText, { color: colors.subText }]}>MooMap v1.0.1</Text>

        {/* Logout Button with confirmation */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.card }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color={colors.danger} style={styles.logoutIcon} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleEditProfile}
      >
        <Feather name="edit-2" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#27AE60',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileMeta: {
    fontSize: 13,
    marginBottom: 8,
  },
  farmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  farmName: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    marginLeft: 6,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  progressBar: {
    height: 4,
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 8,
  },
  infoGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  upgradeButton: {
    backgroundColor: '#F39C1220',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#F39C12',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});