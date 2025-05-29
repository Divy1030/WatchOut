import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationItem } from '../../components/NotificationItem';
import { Colors } from '../../constants/Colors';

interface Notification {
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
}

export default function NotificationsScreen() {
  // Mock notification data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'mention',
      content: '@everyone there\'s a SPAM email going with my name, please don\'t OPEN IT!!!',
      timestamp: '6d',
      source: {
        name: 'Daily Wellness AI',
        avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=DW',
        server: 'Daily Wellness AI\'s server',
        channel: 'marketing-team',
      },
    },
    {
      id: '2',
      type: 'friend_request',
      content: 'accepted your friend request.',
      timestamp: '2mo',
      source: {
        name: 'sahaD844',
        avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=S',
      },
    },
    {
      id: '3',
      type: 'friend_request',
      content: 'accepted your friend request.',
      timestamp: '2mo',
      source: {
        name: 'Abhinav Mishra',
        avatar: 'https://via.placeholder.com/40/3ba55c/ffffff?text=AM',
      },
    },
    {
      id: '4',
      type: 'friend_request',
      content: 'accepted your friend request.',
      timestamp: '2mo',
      source: {
        name: 'ParvArora',
        avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=PA',
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textSecondary} />
        </Pressable>
      </View>
      
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      <FlatList
        data={notifications}
        renderItem={({ item }) => <NotificationItem notification={item} />}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  notificationsList: {
    flex: 1,
  }
});