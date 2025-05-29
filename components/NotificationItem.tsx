import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'mention' | 'friend_request' | 'announcement';
    content: string;
    timestamp: string;
    source: {
      name: string;
      avatar: string;
      server?: string;
      channel?: string;
    };
  };
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  return (
    <View style={styles.notificationItem}>
      <Image source={{ uri: notification.source.avatar }} style={styles.avatar} />
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.boldText}>{notification.source.name}</Text>
          {notification.type === 'mention' ? ' mentioned you in ' : ' '}
          {notification.source.server && notification.source.channel ? (
            <Text>
              <Text style={styles.boldText}>{notification.source.server}</Text>
              {' - '}
              <Text style={styles.channelText}>{notification.source.channel}</Text>:
            </Text>
          ) : null}
        </Text>
        
        {notification.type === 'mention' ? (
          <Text style={styles.mentionContent}>{notification.content}</Text>
        ) : (
          <Text style={styles.notificationText}>{notification.content}</Text>
        )}
      </View>
      
      <Text style={styles.timestamp}>{notification.timestamp}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '600',
    color: Colors.text,
  },
  channelText: {
    color: Colors.primary,
  },
  mentionContent: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});