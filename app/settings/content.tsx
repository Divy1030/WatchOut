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

export default function ContentSettings() {
  const [settings, setSettings] = useState({
    explicitContentFilter: true,
    directMessageSpamFilter: true,
    serverContentFilter: false,
    allowGifs: true,
    allowStickers: true,
    allowEmojis: true,
    autoplayGifs: true,
    autoplayVideos: false,
    linkPreviews: true,
    threadNotifications: true,
    messageRequests: true,
    contactSync: false,
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
        <Text style={styles.headerTitle}>Content & Social</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Content Filtering */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Filtering</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Explicit Content Filter</Text>
              <Text style={styles.settingDescription}>
                Automatically scan and delete messages with explicit content
              </Text>
            </View>
            <Switch
              value={settings.explicitContentFilter}
              onValueChange={() => toggleSetting('explicitContentFilter')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Direct Message Spam Filter</Text>
              <Text style={styles.settingDescription}>
                Filter suspected spam messages in DMs
              </Text>
            </View>
            <Switch
              value={settings.directMessageSpamFilter}
              onValueChange={() => toggleSetting('directMessageSpamFilter')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Server Content Filter</Text>
              <Text style={styles.settingDescription}>
                Hide potentially inappropriate server content
              </Text>
            </View>
            <Switch
              value={settings.serverContentFilter}
              onValueChange={() => toggleSetting('serverContentFilter')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </View>
        
        {/* Media & Files */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media & Files</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow GIFs</Text>
              <Text style={styles.settingDescription}>
                Allow GIF images in chat
              </Text>
            </View>
            <Switch
              value={settings.allowGifs}
              onValueChange={() => toggleSetting('allowGifs')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Stickers</Text>
              <Text style={styles.settingDescription}>
                Allow sticker messages
              </Text>
            </View>
            <Switch
              value={settings.allowStickers}
              onValueChange={() => toggleSetting('allowStickers')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Custom Emojis</Text>
              <Text style={styles.settingDescription}>
                Allow custom emoji reactions
              </Text>
            </View>
            <Switch
              value={settings.allowEmojis}
              onValueChange={() => toggleSetting('allowEmojis')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Autoplay GIFs</Text>
              <Text style={styles.settingDescription}>
                Automatically play GIF animations
              </Text>
            </View>
            <Switch
              value={settings.autoplayGifs}
              onValueChange={() => toggleSetting('autoplayGifs')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Autoplay Videos</Text>
              <Text style={styles.settingDescription}>
                Automatically play video attachments
              </Text>
            </View>
            <Switch
              value={settings.autoplayVideos}
              onValueChange={() => toggleSetting('autoplayVideos')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Link Previews</Text>
              <Text style={styles.settingDescription}>
                Show previews for website links
              </Text>
            </View>
            <Switch
              value={settings.linkPreviews}
              onValueChange={() => toggleSetting('linkPreviews')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </View>
        
        {/* Social Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Features</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Thread Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified about new messages in threads you're in
              </Text>
            </View>
            <Switch
              value={settings.threadNotifications}
              onValueChange={() => toggleSetting('threadNotifications')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Message Requests</Text>
              <Text style={styles.settingDescription}>
                Allow message requests from people not on your friends list
              </Text>
            </View>
            <Switch
              value={settings.messageRequests}
              onValueChange={() => toggleSetting('messageRequests')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Contact Sync</Text>
              <Text style={styles.settingDescription}>
                Find friends using your phone contacts
              </Text>
            </View>
            <Switch
              value={settings.contactSync}
              onValueChange={() => toggleSetting('contactSync')}
              trackColor={{ false: Colors.textMuted, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </View>
        
        {/* Blocked Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Users</Text>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="person-remove" size={22} color={Colors.text} />
            <Text style={styles.actionText}>Blocked Users</Text>
            <Text style={styles.actionCount}>3</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </Pressable>
          
          <Pressable style={styles.actionItem}>
            <Ionicons name="ban" size={22} color={Colors.text} />
            <Text style={styles.actionText}>Blocked Servers</Text>
            <Text style={styles.actionCount}>0</Text>
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
  actionCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
});