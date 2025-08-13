import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface ServerItemProps {
  server: {
    id: string;
    name: string;
    icon: string;
    notifications: number;
  };
}

export const ServerItem: React.FC<ServerItemProps> = ({ server }) => {
  return (
    <Pressable
      style={styles.serverItem}
      onPress={() => router.push(`/server/${server.id}` as any)}
    >
      {server.notifications > 0 ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationText}>
            {server.notifications > 99 ? '99+' : server.notifications}
          </Text>
        </View>
      ) : null}
      <Image source={{ uri: server.icon }} style={styles.serverIcon} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  serverItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
});