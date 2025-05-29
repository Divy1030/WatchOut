import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  notifications?: number;
}

interface Category {
  id: string;
  name: string;
  channels: Channel[];
}

export default function ServerScreen() {
  const { id } = useLocalSearchParams();
  
  // Mock server data
  const serverData = {
    '1': { name: 'Daily Wellness AI', icon: 'https://via.placeholder.com/40/ed4245/ffffff?text=DW' },
    '2': { name: 'Development', icon: 'https://via.placeholder.com/40/5865f2/ffffff?text=DEV' },
    '3': { name: 'Gaming', icon: 'https://via.placeholder.com/40/faa61a/ffffff?text=G' },
    '4': { name: 'Design', icon: 'https://via.placeholder.com/40/3ba55c/ffffff?text=D' },
  };
  
  const server = serverData[id as keyof typeof serverData];
  
  const categories: Category[] = [
    {
      id: '1',
      name: 'TEXT CHANNELS',
      channels: [
        { id: '1', name: 'general', type: 'text' },
        { id: '2', name: 'announcements', type: 'text', notifications: 2 },
        { id: '3', name: 'random', type: 'text' },
      ],
    },
    {
      id: '2',
      name: 'VOICE CHANNELS',
      channels: [
        { id: '4', name: 'General', type: 'voice' },
        { id: '5', name: 'Meeting Room', type: 'voice' },
      ],
    },
  ];
  
  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <Ionicons name="chevron-down" size={12} color={Colors.textMuted} />
        <Text style={styles.categoryTitle}>{item.name}</Text>
        <Pressable style={styles.addChannelButton}>
          <Ionicons name="add" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
      
      {item.channels.map((channel) => (
        <Pressable
          key={channel.id}
          style={styles.channelItem}
          onPress={() => router.push(`/channel/${channel.id}` as any)}
        >
          <Ionicons 
            name={channel.type === 'text' ? 'chatbubble-outline' : 'volume-medium-outline'} 
            size={20} 
            color={Colors.textMuted} 
          />
          <Text style={styles.channelName}>{channel.name}</Text>
          {channel.notifications && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{channel.notifications}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainLayout}>
        {/* Left sidebar - Servers */}
        <View style={styles.serversSidebar}>
          <Pressable style={styles.serverItem} onPress={() => router.back()}>
            <Ionicons name="chatbubbles-outline" size={24} color="#ffffff" />
          </Pressable>
          <View style={styles.divider} />
          <View style={[styles.serverItem, styles.activeServer]}>
            <Image source={{ uri: server?.icon }} style={styles.serverIcon} />
          </View>
        </View>

        {/* Middle - Channels */}
        <View style={styles.channelsArea}>
          <View style={styles.serverHeader}>
            <Text style={styles.serverName}>{server?.name}</Text>
            <Pressable style={styles.serverMenuButton}>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </Pressable>
          </View>
          
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            style={styles.channelsList}
            showsVerticalScrollIndicator={false}
          />
          
          {/* User info at bottom */}
          <View style={styles.userInfo}>
            <Image
              source={{ uri: 'https://via.placeholder.com/32/5865f2/ffffff?text=D' }}
              style={styles.userAvatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userDisplayName}>Divy</Text>
              <Text style={styles.userStatus}>Online</Text>
            </View>
            <Pressable style={styles.userAction}>
              <Ionicons name="mic" size={20} color={Colors.text} />
            </Pressable>
            <Pressable style={styles.userAction}>
              <Ionicons name="headset" size={20} color={Colors.text} />
            </Pressable>
            <Pressable style={styles.userAction}>
              <Ionicons name="settings" size={20} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Right - Chat area */}
        <View style={styles.chatArea}>
          <View style={styles.chatHeader}>
            <Ionicons name="chatbubble-outline" size={24} color={Colors.textMuted} />
            <Text style={styles.chatChannelName}>general</Text>
            <View style={styles.chatActions}>
              <Pressable style={styles.chatAction}>
                <Ionicons name="notifications" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.chatAction}>
                <Ionicons name="pin" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.chatAction}>
                <Ionicons name="people" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.chatAction}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>
          
          <View style={styles.welcomeMessage}>
            <Text style={styles.welcomeTitle}>Welcome to #{`general`}!</Text>
            <Text style={styles.welcomeText}>
              This is the start of the #general channel.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  serversSidebar: {
    width: 72,
    backgroundColor: Colors.surface,
    paddingTop: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  serverItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeServer: {
    borderRadius: 16,
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: Colors.background,
    marginVertical: 8,
  },
  channelsArea: {
    width: 240,
    backgroundColor: Colors.surfaceLight,
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  serverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  serverMenuButton: {
    padding: 4,
  },
  channelsList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  addChannelButton: {
    padding: 4,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  channelName: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  notificationBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.surface,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userDetails: {
    flex: 1,
    marginLeft: 8,
  },
  userDisplayName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  userStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userAction: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  chatArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  chatChannelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  chatActions: {
    flexDirection: 'row',
  },
  chatAction: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  welcomeMessage: {
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});