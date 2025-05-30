import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
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
  expanded: boolean;
}

interface Message {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
}

export default function ServerScreen() {
  const { id } = useLocalSearchParams();
  const [selectedChannel, setSelectedChannel] = useState('1');
  const [showMembers, setShowMembers] = useState(false);
  const [messageText, setMessageText] = useState('');
  
  // Mock server data
  const serverData = {
    '1': { name: 'Daily Wellness AI', icon: 'https://via.placeholder.com/40/ed4245/ffffff?text=DW' },
    '2': { name: 'Development', icon: 'https://via.placeholder.com/40/5865f2/ffffff?text=DEV' },
    '3': { name: 'Gaming', icon: 'https://via.placeholder.com/40/faa61a/ffffff?text=G' },
    '4': { name: 'Design', icon: 'https://via.placeholder.com/40/3ba55c/ffffff?text=D' },
  };
  
  const server = serverData[id as keyof typeof serverData];
  
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'TEXT CHANNELS',
      expanded: true,
      channels: [
        { id: '1', name: 'general', type: 'text' },
        { id: '2', name: 'announcements', type: 'text', notifications: 2 },
        { id: '3', name: 'random', type: 'text' },
        { id: '4', name: 'help', type: 'text' },
      ],
    },
    {
      id: '2',
      name: 'VOICE CHANNELS',
      expanded: true,
      channels: [
        { id: '5', name: 'General', type: 'voice' },
        { id: '6', name: 'Meeting Room', type: 'voice' },
        { id: '7', name: 'Gaming Room', type: 'voice' },
      ],
    },
  ]);

  // Mock messages for selected channel
  const [messages] = useState<Message[]>([
    {
      id: '1',
      user: 'Daily Wellness AI',
      avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=DW',
      content: 'Welcome to #general! This is the start of the general channel.',
      timestamp: 'Today at 12:00 PM',
    },
    {
      id: '2',
      user: 'Divy',
      avatar: 'https://via.placeholder.com/40/5865f2/ffffff?text=D',
      content: 'Hello everyone! Excited to be here!',
      timestamp: 'Today at 12:05 PM',
    },
    {
      id: '3',
      user: 'Rishi',
      avatar: 'https://via.placeholder.com/40/7289da/ffffff?text=R',
      content: 'Hey there! Welcome to the team 👋',
      timestamp: 'Today at 12:10 PM',
    },
  ]);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, expanded: !cat.expanded }
        : cat
    ));
  };

  const getChannelName = () => {
    for (const category of categories) {
      const channel = category.channels.find(ch => ch.id === selectedChannel);
      if (channel) return channel.name;
    }
    return 'general';
  };

  const sendMessage = () => {
    if (messageText.trim()) {
      // Handle message sending logic here
      setMessageText('');
    }
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryContainer}>
      <Pressable 
        style={styles.categoryHeader}
        onPress={() => toggleCategory(item.id)}
      >
        <Ionicons 
          name={item.expanded ? "chevron-down" : "chevron-forward"} 
          size={12} 
          color={Colors.textMuted} 
        />
        <Text style={styles.categoryTitle}>{item.name}</Text>
        <Pressable style={styles.addChannelButton}>
          <Ionicons name="add" size={16} color={Colors.textMuted} />
        </Pressable>
      </Pressable>
      
      {item.expanded && item.channels.map((channel) => (
        <Pressable
          key={channel.id}
          style={[
            styles.channelItem,
            selectedChannel === channel.id && styles.selectedChannel
          ]}
          onPress={() => setSelectedChannel(channel.id)}
        >
          <Ionicons 
            name={channel.type === 'text' ? 'chatbubble-outline' : 'volume-medium-outline'} 
            size={20} 
            color={selectedChannel === channel.id ? Colors.text : Colors.textMuted} 
          />
          <Text style={[
            styles.channelName,
            selectedChannel === channel.id && styles.selectedChannelName
          ]}>
            {channel.name}
          </Text>
          {channel.notifications && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{channel.notifications}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageContainer}>
      <Image source={{ uri: item.avatar }} style={styles.messageAvatar} />
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageUser}>{item.user}</Text>
          <Text style={styles.messageTime}>{item.timestamp}</Text>
        </View>
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.mainLayout}>
        {/* Left sidebar - Channels */}
        <View style={styles.channelsArea}>
          <View style={styles.serverHeader}>
            <Pressable 
              style={styles.serverHeaderContent}
              onPress={() => {/* Show server menu */}}
            >
              <Text style={styles.serverName} numberOfLines={1}>{server?.name}</Text>
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
              <Text style={styles.userDisplayName} numberOfLines={1}>Divy</Text>
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
            <Pressable 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </Pressable>
            <Ionicons 
              name="chatbubble-outline" 
              size={24} 
              color={Colors.textMuted} 
            />
            <Text style={styles.chatChannelName}>#{getChannelName()}</Text>
            <View style={styles.chatActions}>
              <Pressable style={styles.chatAction}>
                <Ionicons name="notifications" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.chatAction}>
                <Ionicons name="pin" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable 
                style={styles.chatAction}
                onPress={() => setShowMembers(!showMembers)}
              >
                <Ionicons name="people" size={20} color={Colors.textMuted} />
              </Pressable>
              <Pressable style={styles.chatAction}>
                <Ionicons name="search" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
          </View>
          
          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome to #{getChannelName()}!</Text>
            <Text style={styles.welcomeText}>
              This is the start of the #{getChannelName()} channel.
            </Text>
          </View>
          
          {/* Messages */}
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
          />
          
          {/* Message Input */}
          <View style={styles.inputContainer}>
            <Pressable style={styles.inputButton}>
              <Ionicons name="add" size={24} color={Colors.textMuted} />
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder={`Message #${getChannelName()}`}
              placeholderTextColor={Colors.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
            <Pressable style={styles.inputButton}>
              <Ionicons name="happy" size={24} color={Colors.textMuted} />
            </Pressable>
            {messageText.trim() ? (
              <Pressable style={styles.sendButton} onPress={sendMessage}>
                <Ionicons name="send" size={20} color={Colors.text} />
              </Pressable>
            ) : (
              <Pressable style={styles.inputButton}>
                <Ionicons name="mic" size={24} color={Colors.textMuted} />
              </Pressable>
            )}
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
  channelsArea: {
    width: 240,
    backgroundColor: Colors.surfaceLight,
  },
  serverHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  serverHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
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
  selectedChannel: {
    backgroundColor: Colors.surface,
  },
  channelName: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  selectedChannelName: {
    color: Colors.text,
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
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
  welcomeSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageUser: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
});