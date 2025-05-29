import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  mutualServers?: number;
  mutualFriends?: number;
}

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'blocked'>('all');
  
  // Mock friends data
  const allFriends: Friend[] = [
    {
      id: '1',
      name: 'Rishi',
      avatar: 'https://via.placeholder.com/40/7289da/ffffff?text=R',
      status: 'online',
      mutualServers: 2,
      mutualFriends: 3,
    },
    {
      id: '2',
      name: 'Dhruval Gupta',
      avatar: 'https://via.placeholder.com/40/faa61a/ffffff?text=DG',
      status: 'idle',
      mutualServers: 1,
      mutualFriends: 1,
    },
    {
      id: '3',
      name: 'Abhinav Mishra',
      avatar: 'https://via.placeholder.com/40/3ba55c/ffffff?text=AM',
      status: 'online',
      mutualServers: 3,
      mutualFriends: 2,
    },
    {
      id: '4',
      name: 'AYUSH',
      avatar: 'https://via.placeholder.com/40/5865f2/ffffff?text=A',
      status: 'online',
      mutualServers: 1,
      mutualFriends: 0,
    },
    {
      id: '5',
      name: 'ANIRUDH SONI',
      avatar: 'https://via.placeholder.com/40/7289da/ffffff?text=AS',
      status: 'offline',
      mutualServers: 0,
      mutualFriends: 1,
    },
    {
      id: '6',
      name: 'sahaD844',
      avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=S',
      status: 'offline',
      mutualServers: 2,
      mutualFriends: 1,
    },
    {
      id: '7',
      name: 'ParvArora',
      avatar: 'https://via.placeholder.com/40/ed4245/ffffff?text=PA',
      status: 'offline',
      mutualServers: 1,
      mutualFriends: 2,
    },
  ];
  
  const onlineFriends = allFriends.filter(friend => friend.status === 'online' || friend.status === 'idle');
  const friendsToShow = activeTab === 'online' ? onlineFriends : allFriends;
  
  const renderFriend = ({ item }: { item: Friend }) => (
    <Pressable
      style={styles.friendItem}
      onPress={() => router.push(`/chat/${item.id}` as any)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={[
          styles.statusIndicator,
          {
            backgroundColor: 
              item.status === 'online' ? Colors.secondary
              : item.status === 'idle' ? Colors.warning
              : item.status === 'dnd' ? Colors.error
              : '#74767b'
          }
        ]} />
      </View>
      
      <View style={styles.friendContent}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendStatus}>
          {item.status === 'online' ? 'Online' : 
           item.status === 'idle' ? 'Idle' :
           item.status === 'dnd' ? 'Do Not Disturb' : 'Offline'}
        </Text>
        {(item.mutualServers || item.mutualFriends) && (
          <Text style={styles.mutualInfo}>
            {item.mutualServers ? `${item.mutualServers} mutual servers` : ''}
            {item.mutualServers && item.mutualFriends ? ' • ' : ''}
            {item.mutualFriends ? `${item.mutualFriends} mutual friends` : ''}
          </Text>
        )}
      </View>
      
      <View style={styles.friendActions}>
        <Pressable style={styles.actionButton}>
          <Ionicons name="chatbubble" size={20} color={Colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicons name="call" size={20} color={Colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Friends</Text>
        <Pressable style={styles.headerButton}>
          <Ionicons name="person-add" size={24} color={Colors.text} />
        </Pressable>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'online' && styles.activeTab]}
          onPress={() => setActiveTab('online')}
        >
          <Text style={[styles.tabText, activeTab === 'online' && styles.activeTabText]}>
            Online — {onlineFriends.length}
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Friends — {allFriends.length}
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
          onPress={() => setActiveTab('blocked')}
        >
          <Text style={[styles.tabText, activeTab === 'blocked' && styles.activeTabText]}>
            Blocked
          </Text>
        </Pressable>
      </View>
      
      {/* Friends List */}
      <FlatList
        data={friendsToShow}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        style={styles.friendsList}
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
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.text,
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
  friendContent: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  mutualInfo: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  friendActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
  },
});