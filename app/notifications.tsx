import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationsContext } from '../src/providers/NotificationProvider';
import { useMarkAllNotificationsAsRead, useDeleteNotification } from '../src/lib/queries';
import {Colors} from '../constants/Colors';

export default function NotificationsScreen() {
  const { notifications, markAsRead, isLoading } = useNotificationsContext();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteNotificationMutation = useDeleteNotification();

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const renderNotificationItem = ({ item }: { item: any }) => {
    const notificationDate = new Date(item.createdAt);
    const formattedDate = notificationDate.toLocaleDateString();
    const formattedTime = notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>{item.message}</Text>
          <Text style={styles.notificationTime}>{formattedDate} at {formattedTime}</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Notifications',
          headerRight: () => (
            <TouchableOpacity 
              style={styles.markAllButton} 
              onPress={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          ),
        }} 
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications || []}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  markAllText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});