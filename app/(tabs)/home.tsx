import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface Server {
  id: string;
  name: string;
  icon: string;
  notifications: number;
}

interface DirectMessage {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: 'online' | 'offline' | 'idle' | 'dnd';
}

export default function Home() {
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  
  // Mock data for servers
  const [servers] = useState<Server[]>([
    { id: '1', name: 'Daily Wellness AI', icon: 'https://via.placeholder.com/60/ed4245/ffffff?text=DW', notifications: 0 },
    { id: '2', name: 'Development', icon: 'https://via.placeholder.com/60/5865f2/ffffff?text=DEV', notifications: 60 },
    { id: '3', name: 'Gaming', icon: 'https://via.placeholder.com/60/faa61a/ffffff?text=G', notifications: 2 },
    { id: '4', name: 'Design', icon: 'https://via.placeholder.com/60/3ba55c/ffffff?text=D', notifications: 0 },
  ]);

  // Mock data for direct messages
  const [messages] = useState<DirectMessage[]>([
    { 
      id: '1', 
      name: 'Rishi', 
      avatar: 'https://via.placeholder.com/40/7289da/ffffff?text=R', 
      lastMessage: 'thik hai sir',
      timestamp: '3m',
      unread: 0,
      status: 'online'
    },
    { 
      id: '2', 
      name: 'Daily Wellness AI', 
      avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=DW', 
      lastMessage: 'https://do...',
      timestamp: '1h',
      unread: 0,
      status: 'online'
    },
    { 
      id: '3', 
      name: 'Dhruval Gupta', 
      avatar: 'https://via.placeholder.com/40/faa61a/ffffff?text=DG', 
      lastMessage: '2nd - #FB93A3',
      timestamp: '1h',
      unread: 0,
      status: 'idle'
    },
    { 
      id: '4', 
      name: 'Abhinav Mishra', 
      avatar: 'https://via.placeholder.com/40/3ba55c/ffffff?text=AM', 
      lastMessage: 'Thik hai sir',
      timestamp: '3h',
      unread: 0,
      status: 'online'
    },
    { 
      id: '5', 
      name: 'AYUSH', 
      avatar: 'https://via.placeholder.com/40/5865f2/ffffff?text=A', 
      lastMessage: 'Ayush meet hai?',
      timestamp: '4d',
      unread: 0,
      status: 'online'
    },
    { 
      id: '6', 
      name: 'ANIRUDH SONI', 
      avatar: 'https://via.placeholder.com/40/7289da/ffffff?text=AS', 
      lastMessage: 'Meet',
      timestamp: '10d',
      unread: 0,
      status: 'offline'
    },
    { 
      id: '7', 
      name: 'sahaD844', 
      avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=S', 
      lastMessage: 'Hn',
      timestamp: '1mo',
      unread: 0,
      status: 'offline'
    },
    { 
      id: '8', 
      name: 'ParvArora', 
      avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=PA', 
      lastMessage: 'sir email and password for login i...',
      timestamp: '1mo',
      unread: 0,
      status: 'offline'
    },
  ]);

  // Render server icon
  const renderServer = ({ item }: { item: Server }) => (
    <Pressable
      style={[
        styles.serverItem,
        selectedServer === item.id && styles.selectedServer
      ]}
      onPress={() => {
        setSelectedServer(item.id);
        // Navigate to full-screen server view
        router.push(`/server/${item.id}` as any);
      }}
    >
      {item.notifications > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>
            {item.notifications > 99 ? '99+' : item.notifications}
          </Text>
        </View>
      )}
      <Image source={{ uri: item.icon }} style={styles.serverIcon} />
      {selectedServer === item.id && <View style={styles.activeIndicator} />}
    </Pressable>
  );

  // Render direct message
  const renderMessage = ({ item }: { item: DirectMessage }) => (
    <Pressable
      style={styles.messageItem}
      onPress={() => router.push(`/chat/${item.id}` as any)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={[
          styles.statusIndicator,
          {
            backgroundColor: 
              item.status === 'online' ? Colors.secondary
              : item.status === 'idle' ? '#faa61a'
              : item.status === 'dnd' ? Colors.error
              : '#74767b'
          }
        ]} />
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.messageName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.messageText} numberOfLines={1}>
          {item.id === '1' ? 'You: ' : ''}
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.messageRight}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainLayout}>
        {/* Left sidebar - Servers */}
        <View style={styles.serversSidebar}>
          {/* Home/DM button */}
          <Pressable 
            style={[
              styles.serverItem, 
              !selectedServer && styles.selectedServer
            ]}
            onPress={() => setSelectedServer(null)}
          >
            <Ionicons name="chatbubbles" size={24} color="#ffffff" />
            {!selectedServer && <View style={styles.activeIndicator} />}
          </Pressable>
          
          <View style={styles.divider} />
          
          <FlatList
            data={servers}
            renderItem={renderServer}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          />
          
          <View style={styles.divider} />
          
          <Pressable style={styles.serverItem}>
            <Ionicons name="add" size={24} color="#3ba55c" />
          </Pressable>
          <Pressable style={styles.serverItem}>
            <Ionicons name="compass" size={24} color="#3ba55c" />
          </Pressable>
          <Pressable style={styles.serverItem}>
            <Ionicons name="download" size={24} color="#3ba55c" />
          </Pressable>
        </View>

        {/* Right content - Messages */}
        <View style={styles.contentArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.headerActions}>
              <Pressable style={styles.headerButton}>
                <Ionicons name="search" size={22} color={Colors.textSecondary} />
              </Pressable>
              <Pressable style={styles.headerButton}>
                <Ionicons name="add" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>
          
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContainer}
          />
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
    marginVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedServer: {
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  activeIndicator: {
    position: 'absolute',
    left: -12,
    width: 4,
    height: 24,
    backgroundColor: Colors.text,
    borderRadius: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 4,
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: Colors.background,
    marginVertical: 8,
  },
  contentArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 18,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingBottom: 20,
  },
  messageItem: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  messageContent: {
    flex: 1,
  },
  messageName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  messageRight: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
});