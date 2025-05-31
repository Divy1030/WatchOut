import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateServerModal from '../../components/CreateServerModal';
import JoinServerModal from '../../components/JoinServerModal';
import { Colors } from '../../constants/Colors';
import {
  useFriendsList,
  useUserServers
} from '../../src/lib/queries';
import {
  initializeSocket,
  joinUserRoom
} from '../../src/lib/socket';
import { useAuth } from '../../src/providers/AuthProvider';

interface ServerItem {
  _id: string;
  name: string;
  iconUrl?: string;
  description?: string;
  memberCount?: number;
  unreadMessages?: number;
}

interface DirectMessageItem {
  _id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  timestamp?: string;
  unread: number;
  status: 'online' | 'offline' | 'idle' | 'dnd' | 'invisible';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [showJoinServerModal, setShowJoinServerModal] = useState(false);

  // API hooks
  const { 
    data: serversData, 
    isLoading: isLoadingServers,
    refetch: refetchServers 
  } = useUserServers();
  
  const { 
    data: friendsData, 
    isLoading: isLoadingFriends,
    refetch: refetchFriends 
  } = useFriendsList();

  // Initialize socket connection
  useEffect(() => {
    if (user?._id) {
      const setupSocket = async () => {
        await initializeSocket();
        await joinUserRoom(user._id);
      };
      setupSocket();
    }
  }, [user?._id]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchServers(), refetchFriends()]);
    setRefreshing(false);
  };

  // Extract and transform data
  const servers: ServerItem[] = serversData?.data?.servers || [];
  const friends = friendsData?.data?.friends || [];
  
  // Transform friends to direct messages format, with extra null checks
  const directMessages: DirectMessageItem[] = (friends || [])
    .filter((f: any) => f && f.userId && f.status === 'accepted')
    .map((friend: any) => ({
      _id: friend.userId?._id,
      name: friend.userId?.displayName || friend.userId?.username || 'Unknown User',
      avatar: friend.userId?.avatarUrl || 
        `https://via.placeholder.com/40/5865f2/ffffff?text=${
          friend.userId?.username ? friend.userId.username.charAt(0).toUpperCase() : 'U'
        }`,
      status: friend.userId?.status || 'offline',
      unread: 0, // This would come from your message system
      lastMessage: friend.userId?.customStatus || undefined,
      timestamp: friend.addedAt
    }));

  // Filter online friends
  const onlineFriends = directMessages.filter(dm => 
    dm.status === 'online' || dm.status === 'idle' || dm.status === 'dnd'
  );

  const renderServerItem = ({ item }: { item: ServerItem }) => (
    <Pressable
      style={styles.serverItem}
      onPress={() => router.push(`/server/${item._id}` as any)}
    >
      <View style={styles.serverIconContainer}>
        {item.iconUrl ? (
          <Image source={{ uri: item.iconUrl }} style={styles.serverIcon} />
        ) : (
          <View style={styles.serverIconPlaceholder}>
            <Text style={styles.serverIconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.unreadMessages && item.unreadMessages > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadMessages > 99 ? '99+' : item.unreadMessages}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.serverContent}>
        <Text style={styles.serverName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.serverDescription} numberOfLines={1}>
          {item.description || `${item.memberCount || 0} members`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  const renderDirectMessage = ({ item }: { item: DirectMessageItem }) => (
    <Pressable
      style={styles.dmItem}
      onPress={() => router.push(`/chat/${item._id}` as any)}
    >
      <View style={styles.dmAvatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.dmAvatar} />
        <View style={[
          styles.dmStatusIndicator,
          {
            backgroundColor: 
              item.status === 'online' ? Colors.secondary :
              item.status === 'idle' ? Colors.warning :
              item.status === 'dnd' ? Colors.error :
              Colors.textMuted
          }
        ]} />
        {item.unread > 0 && (
          <View style={styles.dmUnreadBadge}>
            <Text style={styles.dmUnreadText}>
              {item.unread > 99 ? '99+' : item.unread}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.dmContent}>
        <Text style={styles.dmName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.dmLastMessage} numberOfLines={1}>
          {item.lastMessage || 
           (item.status === 'dnd' ? 'Do Not Disturb' :
            item.status === 'idle' ? 'Away' :
            item.status.charAt(0).toUpperCase() + item.status.slice(1))}
        </Text>
      </View>
      {item.timestamp && (
        <Text style={styles.dmTimestamp}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      )}
    </Pressable>
  );

  const isLoading = isLoadingServers || isLoadingFriends;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <Image
              source={{ 
                uri: user?.avatarUrl || 
                `https://via.placeholder.com/40/5865f2/ffffff?text=${user?.username?.charAt(0).toUpperCase()}` 
              }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.displayName || user?.username || 'User'}
              </Text>
              <Text style={styles.userStatus}>
                {user?.customStatus || 
                 (user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Online')}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton}>
              <Ionicons name="search" size={24} color={Colors.text} />
            </Pressable>
            <Pressable style={styles.headerButton}>
              <Ionicons name="notifications" size={24} color={Colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Pressable 
              style={styles.quickAction}
              onPress={() => router.push('/friends')}
            >
              <Ionicons name="people" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Friends</Text>
              {friends.filter((f: any) => f && f.status === 'pending' && f.isIncoming).length > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>
                    {friends.filter((f: any) => f && f.status === 'pending' && f.isIncoming).length}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable 
              style={styles.quickAction}
              onPress={() => setShowJoinServerModal(true)}
            >
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Join Server</Text>
            </Pressable>
            <Pressable 
              style={styles.quickAction}
              onPress={() => setShowCreateServerModal(true)}
            >
              <Ionicons name="create" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Create Server</Text>
            </Pressable>
            <Pressable 
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/you')}
            >
              <Ionicons name="settings" size={24} color={Colors.primary} />
              <Text style={styles.quickActionText}>Settings</Text>
            </Pressable>
          </View>
        </View>

        {/* My Servers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Servers</Text>
            <Pressable onPress={() => setShowCreateServerModal(true)}>
              <Ionicons name="add" size={24} color={Colors.primary} />
            </Pressable>
          </View>
          
          {isLoadingServers ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ margin: 16 }} />
          ) : servers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="server-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>No servers yet</Text>
              <Text style={styles.emptyStateSubtext}>Create or join a server to get started</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.serversList}
            >
              {servers.map((server: ServerItem, index: number) => (
                <Pressable
                  key={server._id || index}
                  style={styles.serverItem}
                  onPress={() => router.push(`/server/${server._id}`)}
                >
                  <View style={styles.serverIcon}>
                    {server.iconUrl ? (
                      <Image source={{ uri: server.iconUrl }} style={styles.serverIcon} />
                    ) : (
                      <Text style={styles.serverIconText}>
                        {server.name ? server.name.charAt(0).toUpperCase() : 'S'}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.serverName} numberOfLines={1}>
                    {server.name || 'Unnamed Server'}
                  </Text>
                  <Text style={styles.serverMembers}>
                    {server.memberCount || 0} members
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Direct Messages Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Direct Messages</Text>
            <Text style={styles.sectionCount}>
              {onlineFriends.length} online
            </Text>
          </View>
          
          {isLoadingFriends ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          ) : directMessages.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="chatbubbles" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtitle}>
                Add some friends to start chatting
              </Text>
              <Pressable 
                style={styles.emptyActionButton}
                onPress={() => router.push('/friends')}
              >
                <Text style={styles.emptyActionText}>Add Friends</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={directMessages.slice(0, 6)} // Show only first 6
              renderItem={renderDirectMessage}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
          
          {directMessages.length > 6 && (
            <Pressable 
              style={styles.viewAllButton}
              onPress={() => router.push('/friends')}
            >
              <Text style={styles.viewAllText}>View All Friends</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <CreateServerModal
        visible={showCreateServerModal}
        onClose={() => setShowCreateServerModal(false)}
        onSuccess={() => {
          refetchServers();
        }}
      />

      <JoinServerModal
        visible={showJoinServerModal}
        onClose={() => setShowJoinServerModal(false)}
        onSuccess={() => {
          refetchServers();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  quickActionsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    minWidth: 70,
    position: 'relative',
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  emptySection: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  emptyActionText: {
    color: Colors.text,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 8,
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  // Server item styles
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  serverIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  serverIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  serverIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serverIconText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  serverContent: {
    flex: 1,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  serverDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Direct message item styles
  dmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  dmAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  dmAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dmStatusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
  },
  dmUnreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dmUnreadText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  dmContent: {
    flex: 1,
  },
  dmName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dmLastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dmTimestamp: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  // New styles for empty state and error handling
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  serversList: {
    paddingHorizontal: 4,
  },
  serverMembers: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});