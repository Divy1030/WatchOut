import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface MessageItemProps {
  message: {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unread: number;
    status: 'online' | 'offline' | 'idle' | 'dnd';
  };
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return (
    <Pressable
      style={styles.messageItem}
      onPress={() => router.push(`/chat/${message.id}` as any)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: message.avatar }} style={styles.avatar} />
        <View style={[
          styles.statusIndicator,
          {
            backgroundColor: 
              message.status === 'online' ? Colors.secondary
              : message.status === 'idle' ? '#faa61a'
              : message.status === 'dnd' ? Colors.error
              : '#74767b'
          }
        ]} />
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.messageName} numberOfLines={1}>{message.name}</Text>
        <Text style={styles.messageText} numberOfLines={1}>
          {message.id === '1' ? 'You: ' : ''}
          {message.lastMessage}
        </Text>
      </View>
      <View style={styles.messageRight}>
        <Text style={styles.timestamp}>{message.timestamp}</Text>
        {message.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{message.unread}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  messageItem: {
    flexDirection: 'row',
    padding: 12,
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