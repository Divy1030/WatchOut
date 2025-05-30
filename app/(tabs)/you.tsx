import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

export default function ProfileScreen() {
  const [showNitroModal, setShowNitroModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const statusOptions = [
    { id: 'online', label: 'Online', color: Colors.secondary, icon: 'checkmark-circle' },
    { id: 'idle', label: 'Idle', color: '#faa61a', icon: 'moon' },
    { id: 'dnd', label: 'Do Not Disturb', color: Colors.error, icon: 'remove-circle' },
    { id: 'invisible', label: 'Invisible', color: '#74767b', icon: 'eye-off' },
  ];

  const handleStatusChange = (status: string) => {
    Alert.alert('Status Changed', `Your status has been changed to ${status}`);
    setShowStatusMenu(false);
  };

  const StatusModal = () => (
    <Modal
      visible={showStatusMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowStatusMenu(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowStatusMenu(false)}
      >
        <View style={styles.statusModal}>
          <Text style={styles.modalTitle}>Set Status</Text>
          {statusOptions.map((option) => (
            <Pressable
              key={option.id}
              style={styles.statusOption}
              onPress={() => handleStatusChange(option.label)}
            >
              <Ionicons name={option.icon as any} size={20} color={option.color} />
              <Text style={styles.statusLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header with profile image */}
        <View style={styles.headerSection}>
          <Pressable 
            style={styles.profileImageContainer}
            onPress={() => setShowStatusMenu(true)}
          >
            <Image
              source={{ uri: 'https://via.placeholder.com/100/5865f2/ffffff?text=D' }}
              style={styles.profileImage}
            />
            <View style={styles.statusIndicator} />
            <View style={styles.statusEditIcon}>
              <Ionicons name="pencil" size={12} color={Colors.text} />
            </View>
          </Pressable>
          
          <Text style={styles.username}>Divy</Text>
          <Text style={styles.discriminator}>divy__1030</Text>
          
          <Pressable style={styles.editButton}>
            <Ionicons name="pencil" size={16} color="#ffffff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        </View>
        
        {/* Enhanced Nitro promotion */}
        <View style={styles.promoSection}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Amp up your profile</Text>
            <Text style={styles.promoDescription}>
              Get exclusive perks with Discord Nitro
            </Text>
            <View style={styles.promoButtons}>
              <Pressable 
                style={[styles.promoButton, styles.nitroButton]}
                onPress={() => setShowNitroModal(true)}
              >
                <Ionicons name="flash" size={16} color="#ffffff" />
                <Text style={styles.promoButtonText}>Get Nitro</Text>
              </Pressable>
              <Pressable style={styles.promoButton}>
                <Ionicons name="bag" size={16} color="#ffffff" />
                <Text style={styles.promoButtonText}>Shop</Text>
              </Pressable>
            </View>
          </View>
          <Pressable style={styles.closeButton}>
            <Ionicons name="close" size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>
        
        {/* Member since with enhanced info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Member Since</Text>
          <View style={styles.infoContent}>
            <Ionicons name="logo-discord" size={18} color={Colors.textSecondary} />
            <View style={styles.memberInfo}>
              <Text style={styles.infoText}>Jan 25, 2024</Text>
              <Text style={styles.memberDuration}>1 year, 4 months</Text>
            </View>
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Pressable 
              style={styles.quickAction}
              onPress={() => router.push('/friends')}
            >
              <Ionicons name="people" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Friends</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="notifications" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Notifications</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="shield" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Privacy</Text>
            </Pressable>
            <Pressable style={styles.quickAction}>
              <Ionicons name="help-circle" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Help</Text>
            </Pressable>
          </View>
        </View>
        
        {/* Enhanced Settings options */}
        <View style={styles.optionsTitle}>
          <Text style={styles.optionsTitleText}>Account Settings</Text>
        </View>
        
        <View style={styles.optionsList}>
          <Pressable style={styles.optionItem} onPress={() => router.push('/settings/account')}>
            <View style={styles.optionIcon}>
              <Ionicons name="person" size={22} color={Colors.text} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Account</Text>
              <Text style={styles.optionDescription}>Manage your account settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={() => router.push('/settings/privacy')}>
            <View style={styles.optionIcon}>
              <Ionicons name="shield" size={22} color={Colors.text} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Data & Privacy</Text>
              <Text style={styles.optionDescription}>Control your privacy settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={() => router.push('/settings/content')}>
            <View style={styles.optionIcon}>
              <Ionicons name="people" size={22} color={Colors.text} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Content & Social</Text>
              <Text style={styles.optionDescription}>Manage content preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.optionItem} onPress={() => router.push('/settings/devices')}>
            <View style={styles.optionIcon}>
              <Ionicons name="phone-portrait" size={22} color={Colors.text} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Devices</Text>
              <Text style={styles.optionDescription}>Manage connected devices</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* App Settings */}
        <View style={styles.optionsTitle}>
          <Text style={styles.optionsTitleText}>App Settings</Text>
        </View>
        
        <View style={styles.optionsList}>
          <Pressable style={styles.optionItem}>
            <View style={styles.optionIcon}>
              <Ionicons name="moon" size={22} color={Colors.text} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Appearance</Text>
              <Text style={styles.optionDescription}>Dark theme</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.optionItem}>
            <View style={styles.optionIcon}>
              <Ionicons name="globe" size={22} color={Colors.text} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>Language</Text>
              <Text style={styles.optionDescription}>English (US)</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Pressable style={styles.logoutButton}>
            <Ionicons name="log-out" size={22} color={Colors.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
      
      <StatusModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    borderWidth: 4,
    borderColor: Colors.background,
  },
  statusEditIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  discriminator: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: Colors.text,
    fontWeight: '600',
    marginLeft: 8,
  },
  promoSection: {
    backgroundColor: 'rgba(88, 101, 242, 0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    margin: 16,
    padding: 16,
    flexDirection: 'row',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  promoDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  promoButtons: {
    flexDirection: 'row',
  },
  promoButton: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  nitroButton: {
    backgroundColor: Colors.primary,
  },
  promoButtonText: {
    color: Colors.text,
    marginLeft: 8,
    fontWeight: '600',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: 16,
  },
  infoSectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    borderRadius: 8,
  },
  memberInfo: {
    marginLeft: 8,
  },
  infoText: {
    color: Colors.text,
    fontWeight: '600',
  },
  memberDuration: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  quickActionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 16,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    color: Colors.text,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  optionsTitle: {
    padding: 16,
    paddingBottom: 8,
  },
  optionsTitleText: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  optionsList: {
    backgroundColor: Colors.surfaceLight,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  logoutSection: {
    padding: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 66, 69, 0.15)',
    borderWidth: 1,
    borderColor: Colors.error,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    minWidth: 200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  statusLabel: {
    color: Colors.text,
    marginLeft: 12,
    fontSize: 16,
  },
});