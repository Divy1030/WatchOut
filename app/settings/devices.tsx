import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'web';
  os: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function DevicesSettings() {
  const [devices] = useState<Device[]>([
    {
      id: '1',
      name: 'iPhone 14 Pro',
      type: 'mobile',
      os: 'iOS 17.2',
      location: 'New Delhi, India',
      lastActive: 'Active now',
      isCurrent: true,
    },
    {
      id: '2',
      name: 'MacBook Pro',
      type: 'desktop',
      os: 'macOS Sonoma',
      location: 'New Delhi, India',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
    {
      id: '3',
      name: 'Chrome on Windows',
      type: 'web',
      os: 'Windows 11',
      location: 'Mumbai, India',
      lastActive: '1 day ago',
      isCurrent: false,
    },
    {
      id: '4',
      name: 'Discord Android',
      type: 'mobile',
      os: 'Android 14',
      location: 'Bangalore, India',
      lastActive: '3 days ago',
      isCurrent: false,
    },
  ]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return 'phone-portrait';
      case 'desktop':
        return 'desktop';
      case 'web':
        return 'globe';
      default:
        return 'help';
    }
  };

  const handleLogoutDevice = (device: Device) => {
    Alert.alert(
      'Log out device',
      `Are you sure you want to log out ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
            Alert.alert('Success', `Logged out from ${device.name}`);
          }
        },
      ]
    );
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Log out all devices',
      'This will log you out from all devices except this one. You\'ll need to log in again on those devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out All', 
          style: 'destructive',
          onPress: () => {
            // Handle logout all logic here
            Alert.alert('Success', 'Logged out from all other devices');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Devices</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Current Device */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Device</Text>
          
          {devices
            .filter(device => device.isCurrent)
            .map(device => (
              <View key={device.id} style={[styles.deviceItem, styles.currentDevice]}>
                <View style={styles.deviceIcon}>
                  <Ionicons 
                    name={getDeviceIcon(device.type) as any} 
                    size={24} 
                    color={Colors.primary} 
                  />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceDetails}>{device.os}</Text>
                  <Text style={styles.deviceLocation}>{device.location}</Text>
                  <Text style={styles.deviceActive}>{device.lastActive}</Text>
                </View>
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              </View>
            ))}
        </View>
        
        {/* Other Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Other Sessions</Text>
            <Pressable onPress={handleLogoutAllDevices} style={styles.logoutAllButton}>
              <Text style={styles.logoutAllText}>Log out all</Text>
            </Pressable>
          </View>
          
          {devices
            .filter(device => !device.isCurrent)
            .map(device => (
              <View key={device.id} style={styles.deviceItem}>
                <View style={styles.deviceIcon}>
                  <Ionicons 
                    name={getDeviceIcon(device.type) as any} 
                    size={24} 
                    color={Colors.textSecondary} 
                  />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceDetails}>{device.os}</Text>
                  <Text style={styles.deviceLocation}>{device.location}</Text>
                  <Text style={styles.deviceActive}>Last active: {device.lastActive}</Text>
                </View>
                <Pressable 
                  onPress={() => handleLogoutDevice(device)}
                  style={styles.logoutButton}
                >
                  <Ionicons name="log-out" size={20} color={Colors.error} />
                </Pressable>
              </View>
            ))}
        </View>
        
        {/* Security Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="shield-checkmark" size={22} color={Colors.text} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>Two-Factor Authentication</Text>
              <Text style={styles.actionDescription}>Add an extra layer of security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="key" size={22} color={Colors.text} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>Backup Codes</Text>
              <Text style={styles.actionDescription}>Generate backup login codes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="time" size={22} color={Colors.text} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>Login History</Text>
              <Text style={styles.actionDescription}>View recent login attempts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
        
        {/* Device Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Settings</Text>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="notifications" size={22} color={Colors.text} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>Push Notifications</Text>
              <Text style={styles.actionDescription}>Manage notification settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="download" size={22} color={Colors.text} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>Offline Storage</Text>
              <Text style={styles.actionDescription}>Manage downloaded content</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="cellular" size={22} color={Colors.text} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>Data Usage</Text>
              <Text style={styles.actionDescription}>View and manage data usage</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  logoutAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  logoutAllText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
  },
  currentDevice: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  deviceDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  deviceLocation: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  deviceActive: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  currentBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
  },
  actionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});