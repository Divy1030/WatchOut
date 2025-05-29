import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    sender: 'me' | 'other';
    timestamp: string;
    avatar?: string;
    username?: string;
  };
  showHeader: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, showHeader }) => {
  return (
    <View style={styles.messageContainer}>
      {showHeader && message.sender === 'other' && (
        <View style={styles.messageHeader}>
          <Image source={{ uri: message.avatar }} style={styles.messageAvatar} />
          <Text style={styles.messageUsername}>{message.username}</Text>
          <Text style={styles.messageTime}>{message.timestamp}</Text>
        </View>
      )}
      
      {showHeader && message.sender === 'me' && (
        <Text style={styles.messageTime}>{message.timestamp}</Text>
      )}
      
      <View style={[
        styles.messageBubble,
        message.sender === 'me' ? styles.myMessage : styles.otherMessage,
        !showHeader && { marginLeft: message.sender === 'other' ? 46 : 0 }
      ]}>
        <Text style={styles.messageText}>{message.text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  messageUsername: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
  },
  myMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: Colors.surfaceLight,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
  },
});