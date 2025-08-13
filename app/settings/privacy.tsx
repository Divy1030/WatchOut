import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

export default function PrivacySettings() {
  const [settings, setSettings] = useState({
    directMessages: true,
    serverMessages: false,
    friendRequests: true,
    serverInvites: false,
    activityStatus: true,
    readReceipts: true,
    typing: true,
    dataCollection: false,
    personalization: true,
    analytics: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Data & Privacy</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Privacy Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Controls</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Direct Messages</Text>
              <Text style={styles.settingDescription}>
                Allow direct messages from server members
              </Text>
            </View>
            <Switch
              value={settings.directMessages}
              onValueChange={() => toggleSetting('directMessages')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Server Messages</Text>
              <Text style={styles.settingDescription}>
                Allow messages from people you don't share a server with
              </Text>
            </View>
            <Switch
              value={settings.serverMessages}
              onValueChange={() => toggleSetting('serverMessages')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Friend Requests</Text>
              <Text style={styles.settingDescription}>
                Allow friend requests from server members
              </Text>
            </View>
            <Switch
              value={settings.friendRequests}
              onValueChange={() => toggleSetting('friendRequests')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Server Invites</Text>
              <Text style={styles.settingDescription}>
                Allow server invites from friends
              </Text>
            </View>
            <Switch
              value={settings.serverInvites}
              onValueChange={() => toggleSetting('serverInvites')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </View>
        
        {/* Activity Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Activity Status</Text>
              <Text style={styles.settingDescription}>
                Display current activity as a status message
              </Text>
            </View>
            <Switch
              value={settings.activityStatus}
              onValueChange={() => toggleSetting('activityStatus')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Read Receipts</Text>
              <Text style={styles.settingDescription}>
                Show when you've read messages
              </Text>
            </View>
            <Switch
              value={settings.readReceipts}
              onValueChange={() => toggleSetting('readReceipts')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Typing Indicator</Text>
              <Text style={styles.settingDescription}>
                Show when you're typing a message
              </Text>
            </View>
            <Switch
              value={settings.typing}
              onValueChange={() => toggleSetting('typing')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </View>
        
        {/* Data Collection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Collection</Text>
              <Text style={styles.settingDescription}>
                Allow Discord to collect usage data
              </Text>
            </View>
            <Switch
              value={settings.dataCollection}
              onValueChange={() => toggleSetting('dataCollection')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Personalization</Text>
              <Text style={styles.settingDescription}>
                Use data to personalize Discord for you
              </Text>
            </View>
            <Switch
              value={settings.personalization}
              onValueChange={() => toggleSetting('personalization')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Analytics</Text>
              <Text style={styles.settingDescription}>
                Help improve Discord with usage analytics
              </Text>
            </View>
            <Switch
              value={settings.analytics}
              onValueChange={() => toggleSetting('analytics')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </View>
        
        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="download" size={22} color={Colors.text} />
            <Text style={styles.actionText}>Download My Data</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="trash" size={22} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Delete My Data</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.error} />
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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
  actionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 16,
  },
});